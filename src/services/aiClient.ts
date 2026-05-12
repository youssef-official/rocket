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
 * Returns the URL to fetch. We call the provider directly from the browser.
 *
 * CORS reality check: CORS is enforced by the *target* server, not by us.
 * No amount of client-side code can "bypass" CORS without an actual server
 * relaying the request. The good news: most modern AI providers DO send the
 * right CORS headers and work directly from the browser:
 *
 *   ✅ OpenAI, OpenRouter, Google Gemini, Groq, Mistral, DeepSeek, xAI
 *   ✅ Ollama / LM Studio (localhost — no CORS at all)
 *   ❌ Anthropic, NVIDIA NIM (no CORS for browsers)
 *
 * For the ❌ providers, the user should pick OpenRouter (which mirrors the
 * same models with proper CORS) instead — surfaced in the Settings UI.
 *
 * Dev-only escape hatch: when running on Vite dev server we still route
 * through `/ai-proxy/<encoded-origin>` so developers can test no-CORS
 * providers locally.
 */
export function toProxiedUrl(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return absoluteUrl;
    }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0') {
      return absoluteUrl;
    }
    // Dev-only proxy via Vite (works only when running `npm run dev`)
    if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
      return `/ai-proxy/${encodeURIComponent(u.origin)}${u.pathname}${u.search}`;
    }
    // Production: call provider directly. Provider must allow CORS.
    return absoluteUrl;
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
