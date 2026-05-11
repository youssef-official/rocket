// AI Provider Settings — stored in localStorage, fully local.
// Users can pick a preset or enter custom provider+API key+base URL.

export interface AIProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  models: string[];
  notes?: string;
}

export const PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o1-preview'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.1-405b-instruct',
      'deepseek/deepseek-chat',
      'x-ai/grok-2',
    ],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic (via OpenRouter recommended)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    notes: 'Anthropic API does not allow CORS from browsers. Use OpenRouter instead.',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  {
    id: 'mistral',
    label: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'codestral-latest', 'mistral-small-latest'],
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    models: [],
  },
];

export interface AISettings {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const KEY = 'vivora_ai_settings';

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    providerId: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'openai/gpt-4o-mini',
  };
}

export function saveAISettings(s: AISettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('vivora-ai-settings-change'));
}

export function getAvailableModels(providerId: string): string[] {
  return PROVIDER_PRESETS.find(p => p.id === providerId)?.models || [];
}

// Per-project override (set from Home model selector)
export function getActiveModel(): string {
  const sessionOverride = sessionStorage.getItem('vivora_active_model');
  if (sessionOverride) return sessionOverride;
  return getAISettings().model;
}

export function setActiveModel(model: string) {
  sessionStorage.setItem('vivora_active_model', model);
  window.dispatchEvent(new Event('vivora-ai-settings-change'));
}
