export interface AIProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  docsUrl?: string;
  apiKeyHint?: string;
}

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'gpt-3.5-turbo'],
    docsUrl: 'https://platform.openai.com/api-keys',
    apiKeyHint: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    docsUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyHint: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    docsUrl: 'https://aistudio.google.com/apikey',
    apiKeyHint: 'AIza...',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    docsUrl: 'https://console.groq.com/keys',
    apiKeyHint: 'gsk_...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct'],
    docsUrl: 'https://openrouter.ai/keys',
    apiKeyHint: 'sk-or-...',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    docsUrl: 'https://console.mistral.ai/api-keys/',
    apiKeyHint: '...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    docsUrl: 'https://platform.deepseek.com/api_keys',
    apiKeyHint: 'sk-...',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    docsUrl: 'https://api.together.ai/settings/api-keys',
    apiKeyHint: '...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.2', 'qwen2.5-coder', 'mistral'],
    docsUrl: 'https://ollama.com',
    apiKeyHint: 'ollama (any value)',
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    models: [],
    apiKeyHint: 'Your API key',
  },
];

export interface AIConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  customModels: string[]; // user-added models
}

const STORAGE_KEY = 'vivora_ai_config';

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAIConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getAvailableModels(): string[] {
  const cfg = getAIConfig();
  if (!cfg) return [];
  const preset = AI_PROVIDER_PRESETS.find(p => p.id === cfg.providerId);
  const presetModels = preset?.models || [];
  return Array.from(new Set([...presetModels, ...(cfg.customModels || []), cfg.model].filter(Boolean)));
}
