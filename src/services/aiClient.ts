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

/**
 * Routes every outbound AI request through our in-process Vite middleware
 * at `/ai-proxy/<encoded-origin>/<path>`. The middleware (see
 * `vite-plugins/ai-proxy.ts`) runs alongside the main dev/preview server,
 * so there is no separate process to start and no external service to trust.
 * CORS becomes a non-issue because the browser only ever talks to its own origin.
 *
 * Exceptions:
 *   - Same-origin URLs are returned as-is.
 *   - localhost providers (Ollama, LM Studio) are returned as-is — they
 *     already accept browser requests without CORS restrictions.
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
  const finalUrl = toProxiedUrl(targetUrl);

  return fetch(finalUrl, {
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
