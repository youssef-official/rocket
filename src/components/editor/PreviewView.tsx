import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, RotateCcw, ExternalLink } from 'lucide-react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import type { ProjectFile } from '@/types';
import { VivoraLogo } from '@/components/shared/VivoraLogo';

interface PreviewViewProps {
  files: Record<string, ProjectFile>;
  projectType: 'vite' | 'html';
  isLoading?: boolean;
  onPreviewError?: (errorLog: string) => void;
  onPreviewUrlChange?: (url: string | null) => void;
  projectId?: string;
}

const LoadingPlaceholder: React.FC<{ status?: string }> = ({ status }) => {
  const tips = [
    'Building your premium design...',
    'Applying elegant typography & colors...',
    'Making it responsive for all devices...',
    'Adding smooth animations...',
    'Connecting all interactive elements...',
    'Almost there! Final touches...',
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTipIndex(x => (x + 1) % tips.length), 3000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const i = setInterval(() => setProgress(p => Math.min(p + Math.random() * 8, 95)), 800);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-editor-bg overflow-auto">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }} className="text-center max-w-md px-6">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="mb-6">
          <div className="flex items-center justify-center opacity-50">
            <VivoraLogo size="lg" showText={false} className="justify-center" />
          </div>
        </motion.div>
        <div className="w-48 h-1.5 mx-auto mb-4 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground text-sm font-semibold mb-1">
          {status || 'Your preview will appear here'}
        </motion.p>
        <div className="h-5 overflow-hidden mb-4">
          <AnimatePresence mode="wait">
            <motion.p key={tipIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }} className="text-muted-foreground text-xs">
              {tips[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i} animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-primary" />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Inner component with Sandpack hooks for error monitoring + url change
const SandpackBridge: React.FC<{
  onPreviewError?: (errorLog: string) => void;
  onPreviewUrlChange?: (url: string | null) => void;
  refreshKey: number;
}> = ({ onPreviewError, onPreviewUrlChange, refreshKey }) => {
  const { sandpack } = useSandpack();
  const errorReportedRef = React.useRef(false);

  useEffect(() => {
    errorReportedRef.current = false;
  }, [refreshKey]);

  useEffect(() => {
    const err = sandpack.error;
    if (err && !errorReportedRef.current) {
      errorReportedRef.current = true;
      const msg = `${err.title || 'Preview error'}: ${err.message || ''}`;
      onPreviewError?.(msg);
    }
  }, [sandpack.error, onPreviewError]);

  useEffect(() => {
    // Sandpack runs in-browser; there is no external public URL.
    onPreviewUrlChange?.(null);
  }, [onPreviewUrlChange]);

  return null;
};

export const PreviewView: React.FC<PreviewViewProps> = ({
  files, projectType, isLoading, onPreviewError, onPreviewUrlChange, projectId,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const watermarkRemoved = projectId
    ? localStorage.getItem(`project_watermark_${projectId}`) === 'removed'
    : false;

  // Build sandpack files + dependencies
  const { sandpackFiles, dependencies, template, entry } = useMemo(() => {
    const sp: Record<string, { code: string; hidden?: boolean }> = {};

    Object.entries(files).forEach(([path, file]) => {
      const p = path.startsWith('/') ? path : `/${path}`;
      let content = file?.content ?? '';
      if (watermarkRemoved && (p === '/index.html' || p === '/public/index.html')) {
        content = content.replace(/<script[^>]*branding\.js[^>]*>[\s\S]*?<\/script>/gi, '');
      }
      sp[p] = { code: content };
    });

    if (projectType === 'html') {
      if (!sp['/index.html']) {
        sp['/index.html'] = {
          code: `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Preview</title></head><body><h1>Empty project</h1></body></html>`,
        };
      }
      return { sandpackFiles: sp, dependencies: {}, template: 'static' as const, entry: '/index.html' };
    }

    // ── Vite / React-TS ──
    const hasRootApp = !!sp['/App.tsx'] || !!sp['/App.jsx'];
    const hasSrcApp = !!sp['/src/App.tsx'] || !!sp['/src/App.jsx'];
    const hasAnyApp = hasRootApp || hasSrcApp;

    if (!hasAnyApp) {
      sp['/App.tsx'] = {
        code: `export default function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Ready</h1>
        <p className="text-gray-400 text-lg">Your preview is ready</p>
      </div>
    </div>
  );
}`,
      };
    }

    const hasMain =
      sp['/index.tsx'] || sp['/src/index.tsx'] || sp['/main.tsx'] || sp['/src/main.tsx'];

    if (!hasMain) {
      const target = hasSrcApp ? '/src/index.tsx' : '/index.tsx';
      const importPath = hasSrcApp ? './App' : './App';
      sp[target] = {
        code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "${importPath}";
${(sp['/src/index.css'] || sp['/index.css']) ? `import "${hasSrcApp ? './index.css' : './index.css'}";` : ''}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
      };
    }

    if (!sp['/public/index.html']) {
      sp['/public/index.html'] = {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body><div id="root"></div></body>
</html>`,
        hidden: true,
      };
    }

    // Parse user-provided package.json deps so AI-installed libs work
    let userDeps: Record<string, string> = {};
    try {
      if (sp['/package.json']?.code) {
        const parsed = JSON.parse(sp['/package.json'].code);
        if (parsed?.dependencies) userDeps = parsed.dependencies;
      }
    } catch {
      /* ignore */
    }
    // Sandpack manages its own package.json
    delete sp['/package.json'];

    const deps: Record<string, string> = {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'lucide-react': 'latest',
      'framer-motion': 'latest',
      clsx: 'latest',
      'tailwind-merge': 'latest',
      'react-router-dom': 'latest',
      ...userDeps,
    };

    const entryFile = hasSrcApp ? '/src/index.tsx' : '/index.tsx';
    return {
      sandpackFiles: sp,
      dependencies: deps,
      template: 'react-ts' as const,
      entry: entryFile,
    };
  }, [files, projectType, watermarkRemoved]);

  const refresh = () => setRefreshKey(k => k + 1);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-editor-bg">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-editor-bg shrink-0">
          <div className="text-sm font-mono text-muted-foreground">Preparing preview…</div>
        </div>
        <div className="flex-1 min-h-0">
          <LoadingPlaceholder status="Preparing preview…" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-editor-bg shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2 font-mono flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Local Preview
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            title="Refresh preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 overflow-hidden bg-muted relative">
        <div className={`h-full w-full flex justify-center ${viewMode === 'mobile' ? 'bg-muted py-4 items-center' : 'bg-background'}`}>
          <div
            className={
              viewMode === 'mobile'
                ? 'w-[375px] h-[667px] rounded-xl border-4 border-border overflow-hidden bg-white'
                : 'w-full h-full'
            }
          >
            <SandpackProvider
              key={refreshKey}
              template={template}
              files={sandpackFiles}
              customSetup={template === 'react-ts' ? { dependencies, entry } : undefined}
              options={{ recompileMode: 'delayed', recompileDelay: 400 }}
              theme="dark"
            >
              <SandpackBridge
                onPreviewError={onPreviewError}
                onPreviewUrlChange={onPreviewUrlChange}
                refreshKey={refreshKey}
              />
              <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0 }}>
                <SandpackPreview
                  showNavigator={false}
                  showRefreshButton={false}
                  showOpenInCodeSandbox={false}
                  style={{ height: '100%', minHeight: '100%' }}
                />
              </SandpackLayout>
            </SandpackProvider>
          </div>
        </div>
      </div>
    </div>
  );
};
