/**
 * Local AI provider settings.
 *
 * Everything is stored on the user's device. The app talks to the chosen
 * OpenAI-compatible endpoint directly from the browser, so there is no server
 * or database involved.
 */

export interface AiProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  models: string[];
  keyUrl?: string;
  /** Local runtimes need no key and never hit CORS. */
  local?: boolean;
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: ['qwen/qwen3-coder', 'anthropic/claude-3.7-sonnet', 'google/gemini-2.5-pro', 'deepseek/deepseek-chat'], keyUrl: 'https://openrouter.ai/keys' },
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o'], keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b-versatile', 'qwen-2.5-coder-32b'], keyUrl: 'https://console.groq.com/keys' },
  { id: 'gemini', label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.5-pro', 'gemini-2.5-flash'], keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'mistral', label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-large-latest', 'codestral-latest'], keyUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'ollama', label: 'Ollama (on this machine)', baseUrl: 'http://localhost:11434/v1', models: ['qwen2.5-coder:14b', 'llama3.1:8b'], local: true },
  { id: 'lmstudio', label: 'LM Studio (on this machine)', baseUrl: 'http://localhost:1234/v1', models: ['local-model'], local: true },
];

export interface AiSettings {
  providerId: string;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  models: string[];
}

const KEY = 'vivora_ai_settings';

const defaults = (): AiSettings => {
  const preset = AI_PROVIDER_PRESETS[0];
  return { providerId: preset.id, label: preset.label, baseUrl: preset.baseUrl, apiKey: '', model: preset.models[0], models: preset.models };
};

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const base = defaults();
    const models = Array.isArray(parsed.models) && parsed.models.length ? parsed.models : base.models;
    return {
      providerId: parsed.providerId || base.providerId,
      label: parsed.label || base.label,
      baseUrl: (parsed.baseUrl || base.baseUrl).replace(/\/+$/, ''),
      apiKey: parsed.apiKey || '',
      model: parsed.model || models[0],
      models,
    };
  } catch {
    return defaults();
  }
}

export function saveAiSettings(settings: AiSettings) {
  const next: AiSettings = { ...settings, baseUrl: settings.baseUrl.replace(/\/+$/, '') };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('vivora-ai-settings-change'));
  return next;
}

export function isAiConfigured() {
  const settings = getAiSettings();
  const preset = AI_PROVIDER_PRESETS.find(item => item.id === settings.providerId);
  return Boolean(settings.baseUrl && settings.model && (settings.apiKey || preset?.local));
}
