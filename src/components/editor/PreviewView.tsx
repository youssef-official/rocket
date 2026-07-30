import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Monitor, RotateCcw, Smartphone } from 'lucide-react';
import type { ProjectFile } from '@/types';
import { api } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isHtmlProjectFile,
  normalizeBrowserProjectPath,
} from '@/lib/browserProject';

interface PreviewViewProps {
  files: Record<string, ProjectFile>;
  projectType: 'vite' | 'html';
  isLoading?: boolean;
  onPreviewError?: (errorLog: string) => void;
  onPreviewUrlChange?: (url: string | null) => void;
  projectId?: string;
}

const normalizedFiles = (files: Record<string, ProjectFile>) =>
  Object.entries(files).reduce<Record<string, ProjectFile>>((result, [key, file]) => {
    result[normalizeBrowserProjectPath(file.path || key)] = file;
    return result;
  }, {});

const resolveProjectReference = (entryPath: string, reference: string) => {
  const cleanReference = reference.trim().split(/[?#]/, 1)[0];
  if (
    !cleanReference
    || cleanReference.startsWith('#')
    || /^(?:[a-z]+:|\/\/)/i.test(cleanReference)
  ) return null;

  const baseSegments = entryPath.split('/').slice(0, -1);
  const referenceSegments = (cleanReference.startsWith('/') ? cleanReference.slice(1) : cleanReference).split('/');
  const resolved = cleanReference.startsWith('/') ? [] : [...baseSegments];
  for (const segment of referenceSegments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!resolved.length) return null;
      resolved.pop();
      continue;
    }
    resolved.push(segment);
  }
  return normalizeBrowserProjectPath(resolved.join('/'));
};

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export const findJavaScriptSyntaxError = (files: Record<string, ProjectFile>) => {
  const compile = (path: string, content: string, lineOffset = 0) => {
    try {
      // Compile only; generated code is never executed in the parent application.
      new Function(content);
      return null;
    } catch (error) {
      const syntaxError = error as SyntaxError & { lineNumber?: number; columnNumber?: number };
      const stackLocation = syntaxError.stack?.match(/<anonymous>:(\d+):(\d+)/);
      const rawLine = syntaxError.lineNumber ?? (stackLocation ? Number(stackLocation[1]) : undefined);
      const line = rawLine ? Math.max(1, rawLine - 2 + lineOffset) : undefined;
      const column = syntaxError.columnNumber ?? (stackLocation ? Number(stackLocation[2]) : undefined);
      return { path, message: syntaxError.message, line, column };
    }
  };

  for (const [rawPath, file] of Object.entries(files)) {
    const path = normalizeBrowserProjectPath(file.path || rawPath);
    if (path.toLowerCase().endsWith('.js')) {
      const issue = compile(path, file.content);
      if (issue) return issue;
      continue;
    }
    if (!path.toLowerCase().endsWith('.html')) continue;

    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let scriptMatch: RegExpExecArray | null;
    while ((scriptMatch = scriptRegex.exec(file.content)) !== null) {
      const attributes = scriptMatch[1] || '';
      if (/\bsrc\s*=/i.test(attributes) || /\btype\s*=\s*["'](?:application\/ld\+json|application\/json|module)["']/i.test(attributes)) continue;
      const script = scriptMatch[2] || '';
      const contentStart = scriptMatch.index + scriptMatch[0].indexOf(script);
      const lineOffset = file.content.slice(0, contentStart).split('\n').length - 1;
      const issue = compile(path, script, lineOffset);
      if (issue) return issue;
    }
  }
  return null;
};

export const buildBrowserDocument = (
  files: Record<string, ProjectFile>,
  instrumentationBridge = '',
  requestedEntryPath = 'index.html',
) => {
  const projectFiles = normalizedFiles(files);
  const entryPath = normalizeBrowserProjectPath(requestedEntryPath) || 'index.html';
  const html = projectFiles[entryPath]?.content ?? '';
  if (!html) return '';

  const errorBridge = `<script>
window.addEventListener('error', function (event) {
  parent.postMessage({ type: 'webo-preview-error', message: event.message + ' at ' + event.filename + ':' + event.lineno }, '*');
});
window.addEventListener('unhandledrejection', function (event) {
  parent.postMessage({ type: 'webo-preview-error', message: 'Unhandled promise: ' + String(event.reason) }, '*');
});
</script>`;
  const instrumentationTag = instrumentationBridge
    ? `<script data-webo-analytics>${instrumentationBridge}</script>`
    : '';
  const navigationBridge = `<script data-webo-navigation>
document.addEventListener('click', function (event) {
  const link = event.target && event.target.closest ? event.target.closest('a[data-webo-page]') : null;
  if (!link) return;
  event.preventDefault();
  parent.postMessage({ type: 'webo-preview-navigate', path: link.getAttribute('data-webo-page') }, '*');
});
</script>`;
  const localScripts: Array<{ path: string; content: string }> = [];

  let documentText = html.replace(
    /<link\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>/gi,
    (tag, before, _quote, href, after) => {
      if (!/\brel\s*=\s*(?:"stylesheet"|'stylesheet'|stylesheet)/i.test(`${before} ${after}`)) return tag;
      const target = resolveProjectReference(entryPath, href);
      const content = target ? projectFiles[target]?.content : '';
      return target?.toLowerCase().endsWith('.css') && content
        ? `<style data-webo-source="${escapeAttribute(target)}">${content}</style>`
        : tag;
    },
  ).replace(
    /<script\b([^>]*?)src=(["'])([^"']+)\2([^>]*)>\s*<\/script>/gi,
    (tag, _before, _quote, src) => {
      const target = resolveProjectReference(entryPath, src);
      const content = target ? projectFiles[target]?.content : '';
      if (!target?.toLowerCase().endsWith('.js') || !content) return tag;
      localScripts.push({ path: target, content });
      return '';
    },
  ).replace(
    /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>/gi,
    (tag, before, quote, href, after) => {
      const target = resolveProjectReference(entryPath, href);
      if (!target || !isHtmlProjectFile(target) || !projectFiles[target]) return tag;
      return `<a${before}href=${quote}${href}${quote} data-webo-page="${escapeAttribute(target)}"${after}>`;
    },
  );
  documentText = /<\/head>/i.test(documentText)
    ? documentText.replace(/<\/head>/i, `${errorBridge}${instrumentationTag}${navigationBridge}</head>`)
    : `${errorBridge}${instrumentationTag}${navigationBridge}${documentText}`;
  const scriptTags = localScripts
    .map(({ path, content }) => `<script data-webo-source="${escapeAttribute(path)}">${content.replace(/<\/script/gi, '<\\/script')}\n//# sourceURL=webo-preview://${encodeURI(path)}</script>`)
    .join('');
  documentText = /<\/body>/i.test(documentText)
    ? documentText.replace(/<\/body>/i, `${scriptTags}</body>`)
    : `${documentText}${scriptTags}`;
  return documentText;
};

export const PreviewView: React.FC<PreviewViewProps> = ({
  files,
  isLoading,
  onPreviewError,
  onPreviewUrlChange,
  projectId,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewPath, setPreviewPath] = useState('index.html');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const analyticsBridge = projectId ? `
(() => {
  let visitorId;
  try {
    visitorId = sessionStorage.getItem('webo-visitor-id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      sessionStorage.setItem('webo-visitor-id', visitorId);
    }
  } catch {
    visitorId = crypto.randomUUID();
  }
  const track = (eventType, target) => parent.postMessage({
    type: 'webo-analytics-event',
    visitorId,
    eventType,
    path: ${JSON.stringify(`/${previewPath}`)},
    target
  }, '*');
  const describeTarget = element => {
    if (!element) return 'unknown';
    const label = element.getAttribute?.('aria-label') || element.textContent?.trim() || element.id || element.tagName;
    return String(label || 'unknown').replace(/\\s+/g, ' ').slice(0, 120);
  };
  window.addEventListener('DOMContentLoaded', () => track('pageview'));
  document.addEventListener('click', event => track('click', describeTarget(event.target?.closest?.('button, a, input, select, textarea, [role="button"]') || event.target)));
})();` : '';
  const previewDocument = useMemo(
    () => buildBrowserDocument(files, analyticsBridge, previewPath),
    [analyticsBridge, files, previewPath],
  );
  const previewUrlChangeRef = useRef(onPreviewUrlChange);
  const previewErrorRef = useRef(onPreviewError);

  useEffect(() => {
    previewUrlChangeRef.current = onPreviewUrlChange;
    previewErrorRef.current = onPreviewError;
  }, [onPreviewError, onPreviewUrlChange]);

  useEffect(() => {
    const issue = findJavaScriptSyntaxError(files);
    if (!issue) return;
    const location = issue.line ? ` at line ${issue.line}${issue.column ? `:${issue.column}` : ''}` : '';
    previewErrorRef.current?.(`JavaScript syntax error in ${issue.path}${location}: ${issue.message}\nPatch only ${issue.path} and preserve all unrelated code.`);
  }, [files]);

  useEffect(() => {
    const projectFiles = normalizedFiles(files);
    if (!projectFiles[previewPath] || !isHtmlProjectFile(previewPath)) setPreviewPath('index.html');
  }, [files, previewPath]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === 'webo-preview-navigate'
        && event.source === iframeRef.current?.contentWindow
      ) {
        const nextPath = normalizeBrowserProjectPath(String(event.data.path || ''));
        const projectFiles = normalizedFiles(files);
        if (isHtmlProjectFile(nextPath) && projectFiles[nextPath]) setPreviewPath(nextPath);
        return;
      }
      if (event.data?.type === 'webo-preview-error' && event.data?.message) {
        // Syntax issues are reported separately with their exact source path.
        if (findJavaScriptSyntaxError(files)) return;
        previewErrorRef.current?.(`Browser preview error:\n${event.data.message}\nReview the linked HTML, CSS, and JavaScript project files.`);
      }
      if (
        event.data?.type === 'webo-analytics-event'
        && event.source === iframeRef.current?.contentWindow
        && projectId
      ) {
        void api(`/projects/${projectId}/analytics/events`, {
          method: 'POST',
          body: JSON.stringify({
            visitorId: event.data.visitorId,
            eventType: event.data.eventType,
            path: event.data.path,
            target: event.data.target,
          }),
        }).catch(() => undefined);
        return;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files, projectId]);

  useEffect(() => {
    if (!previewDocument) {
      previewUrlChangeRef.current?.(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([previewDocument], { type: 'text/html' }));
    previewUrlChangeRef.current?.(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewDocument]);

  useEffect(() => () => {
    previewUrlChangeRef.current?.(null);
  }, []);

  const openInBrowser = () => {
    if (!previewDocument) return;
    const url = URL.createObjectURL(new Blob([previewDocument], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const isWaiting = isLoading || !previewDocument;

  return (
    <div className="flex h-full w-full flex-col bg-editor-bg">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-editor-bg px-4 py-2">
        <div className="flex items-center gap-1" aria-label={t('preview.size')}>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'desktop' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
            title={t('preview.desktop')}
            aria-pressed={viewMode === 'desktop'}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'mobile' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
            title={t('preview.mobile')}
            aria-pressed={viewMode === 'mobile'}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-48 truncate rounded-md bg-secondary/60 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            {previewPath}
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${previewDocument ? 'bg-emerald-500' : 'bg-pink-500'}`} />
            {previewDocument ? t('preview.ready') : t('preview.waiting')}
          </span>
          <button
            type="button"
            onClick={() => setRefreshKey(key => key + 1)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            title={t('preview.refresh')}
            disabled={!previewDocument}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openInBrowser}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:opacity-40"
            title={t('preview.openTab')}
            disabled={!previewDocument}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted">
        {isWaiting ? (
          <div className="max-w-sm px-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              {isLoading ? t('preview.writing') : t('preview.startsWhenReady')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('preview.browserDescription')}
            </p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={`${previewPath}-${refreshKey}-${previewDocument.length}`}
            data-preview="true"
            srcDoc={previewDocument}
            sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-modals"
            className={`bg-white transition-[width,height,border-radius] ${
              viewMode === 'mobile'
                ? 'h-[667px] max-h-[calc(100%-2rem)] w-[375px] max-w-[calc(100%-2rem)] rounded-xl border-4 border-border shadow-xl'
                : 'h-full w-full border-0'
            }`}
            title={t('preview.browser')}
          />
        )}
      </div>
    </div>
  );
};
