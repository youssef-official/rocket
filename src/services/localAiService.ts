import { getAIConfig } from '@/lib/aiProviders';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIConfigError extends Error {}

export async function* streamChat(
  messages: ChatTurn[],
  opts: { model?: string; signal?: AbortSignal } = {}
): AsyncGenerator<string, void, void> {
  const cfg = getAIConfig();
  if (!cfg || !cfg.apiKey || !cfg.baseUrl) {
    throw new AIConfigError('AI provider is not configured. Open Settings to add your API key.');
  }
  const model = opts.model || cfg.model;
  if (!model) throw new AIConfigError('No model selected. Pick one in Settings.');

  const url = `${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: opts.signal,
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => '');
    throw new Error(`AI request failed (${resp.status}): ${text.slice(0, 300)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
}

export async function chatComplete(messages: ChatTurn[], opts: { model?: string; signal?: AbortSignal } = {}): Promise<string> {
  let out = '';
  for await (const chunk of streamChat(messages, opts)) out += chunk;
  return out;
}

export async function testConnection(model?: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await chatComplete([{ role: 'user', content: 'Say "ok"' }], { model });
    return { ok: true, message: res.slice(0, 100) };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Failed' };
  }
}
