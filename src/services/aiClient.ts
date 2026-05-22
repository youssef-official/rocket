// Direct AI client — calls the user-configured OpenAI-compatible provider from the browser.
// No backend, no edge functions, no API keys in the codebase.

import { getAISettings, getActiveModel } from './aiSettings';
import {
  CODE_GENERATION_PROMPT,
  CHAT_PROMPT,
  EXPLANATION_PROMPT,
  PROJECT_NAME_PROMPT,
  SUGGESTIONS_PROMPT,
  VERSION_NAME_PROMPT,
  STATUS_PROMPT,
  CLARIFY_PROMPT,
} from './systemPrompts';

function canUseInProcessProxy(): boolean {
  return Boolean(import.meta.env.DEV);
}

function looksLikeHtmlDocument(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return /text\/html|application\/xhtml\+xml/i.test(contentType);
}

async function fetchWithProxyFallback(targetUrl: string, init: RequestInit): Promise<Response> {
  const proxiedUrl = toProxiedUrl(targetUrl);
  const response = await fetch(proxiedUrl, init);

  if (proxiedUrl !== targetUrl && looksLikeHtmlDocument(response)) {
    return fetch(targetUrl, init);
  }

  return response;
}

/**
 * Routes outbound AI requests through the local Vite middleware only while the
 * app is actually running under the local dev server. Built previews/published
 * deployments do not have that middleware, so they must call the provider URL
 * directly instead of hitting the SPA fallback and receiving index.html.
 *
 * Exceptions:
 *   - Same-origin URLs are returned as-is.
 *   - localhost providers (Ollama, LM Studio) are returned as-is.
 */
export function toProxiedUrl(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    if (typeof window !== "undefined" && u.origin === window.location.origin) {
      return absoluteUrl;
    }
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "0.0.0.0") {
      return absoluteUrl;
    }
    if (!canUseInProcessProxy()) {
      return absoluteUrl;
    }
    return `/ai-proxy/${encodeURIComponent(u.origin)}${u.pathname}${u.search}`;
  } catch {
    return absoluteUrl;
  }
}

export type AIMode =
  | 'code'
  | 'chat'
  | 'explanation'
  | 'project-name'
  | 'version-name'
  | 'suggestions'
  | 'status'
  | 'clarify';

const SYSTEM_PROMPTS: Record<AIMode, string> = {
  code: CODE_GENERATION_PROMPT,
  chat: CHAT_PROMPT,
  explanation: EXPLANATION_PROMPT,
  'project-name': PROJECT_NAME_PROMPT,
  'version-name': VERSION_NAME_PROMPT,
  suggestions: SUGGESTIONS_PROMPT,
  status: STATUS_PROMPT,
  clarify: CLARIFY_PROMPT,
};

export interface AICallOptions {
  signal?: AbortSignal;
  userLanguage?: string;
  colorTheme?: { name: string; colors: string[] } | null;
  stream?: boolean;
  maxTokens?: number;
}

/**
 * Calls the configured OpenAI-compatible provider. Returns a Response with SSE body
 * (when stream=true, default) so existing readSSEStream logic keeps working.
 */
export async function callAI(
  mode: AIMode,
  messages: any[],
  options: AICallOptions = {}
): Promise<Response> {
  const settings = getAISettings();
  const model = getActiveModel();

  if (!settings.apiKey) {
    throw new Error(
      'No API key configured. Open Settings and add your AI provider API key.'
    );
  }
  const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('No base URL configured. Open Settings to configure your provider.');
  }

  let systemPrompt = SYSTEM_PROMPTS[mode] || CHAT_PROMPT;
  if (options.userLanguage) {
    systemPrompt = `[USER_LANGUAGE=${options.userLanguage}]\n\n${systemPrompt}`;
  }
  if (options.colorTheme) {
    systemPrompt += `\n\n<color_palette>\nUse this palette: ${options.colorTheme.name} — ${options.colorTheme.colors.join(', ')}\n</color_palette>`;
  }

  // Format messages: OpenAI vision content format if imageUrls present.
  const formatted = messages.map((m: any) => {
    if (m.role === 'user' && Array.isArray(m.imageUrls) && m.imageUrls.length > 0) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: m.content || '' },
          ...m.imageUrls.map((url: string) => ({ type: 'image_url', image_url: { url } })),
        ],
      };
    }
    if (m.role && m.content !== undefined) return { role: m.role, content: m.content };
    return m;
  });

  const stream = options.stream !== false;
  const body: any = {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...formatted],
    stream,
  };
  if (typeof options.maxTokens === 'number') {
    body.max_tokens = options.maxTokens;
  }

  const targetUrl = `${baseUrl}/chat/completions`;

  return fetchWithProxyFallback(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Vivora Local',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });
}
