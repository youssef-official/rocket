import type { Suggestion, ChatMessage } from './aiService';
import {
    CODE_GENERATION_PROMPT,
    STATUS_SYSTEM_PROMPT,
    EXPLANATION_SYSTEM_PROMPT,
    PROJECT_NAME_SYSTEM_PROMPT,
    SUGGESTIONS_SYSTEM_PROMPT,
    CHAT_ONLY_PROMPT,
    VERSION_NAME_PROMPT
} from './aiPrompts';

// Standard OpenAI/Vercel AI SDK compatible payload
interface AIRequestPayload {
    model: string;
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
}

// Get API Key from env
function getAIKey(): string | null {
    // Check for various potential key names
    return import.meta.env.VITE_OPENAI_API_KEY ||
        import.meta.env.VITE_VERCEL_AI_API_KEY ||
        import.meta.env.VITE_AI_API_KEY ||
        null;
}

// Get API URL from env or default to Vercel AI Gateway
function getAIUrl(): string {
    return "https://ai-gateway.vercel.sh/v1/chat/completions";
}

function mapModel(modelId: string): string {
    // Return direct mapping to Vercel AI Gateway model IDs
    switch (modelId) {
        case 'rok-fast': return 'google/gemini-3-flash';
        case 'rok-smart': return 'google/gemini-3-flash';
        case 'rok-turbo': return 'google/gemini-3-flash';
        case 'rok-ultra': return 'anthropic/claude-haiku-4.5';
        case 'rok-reson': return 'anthropic/claude-opus-4.5';
        // Allow passing through other model IDs or fallback
        default: return modelId.includes('/') ? modelId : 'google/gemini-3-flash';
    }
}

// Main function to call AI directly from client
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'project-name' | 'suggestions' | 'chat' | 'version-name',
    messages: any[],
    modelId: string = 'rok-fast',
    signal?: AbortSignal
): Promise<Response> {
    const apiKey = getAIKey();

    if (!apiKey) {
        throw new Error("Missing API Key. Please add VITE_VERCEL_AI_API_KEY to your .env file.");
    }

    // Select system prompt
    let systemPrompt = CODE_GENERATION_PROMPT;
    switch (mode) {
        case 'status': systemPrompt = STATUS_SYSTEM_PROMPT; break;
        case 'explanation': systemPrompt = EXPLANATION_SYSTEM_PROMPT; break;
        case 'project-name': systemPrompt = PROJECT_NAME_SYSTEM_PROMPT; break;
        case 'suggestions': systemPrompt = SUGGESTIONS_SYSTEM_PROMPT; break;
        case 'chat': systemPrompt = CHAT_ONLY_PROMPT; break;
        case 'version-name': systemPrompt = VERSION_NAME_PROMPT; break;
    }

    const actualModel = mapModel(modelId);

    // Construct payload
    const payload: any = {
        model: actualModel,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        stream: true,
        max_tokens: 32000,
        temperature: 0.15,
        top_p: 0.9
    };

    if (mode === 'project-name' || mode === 'version-name') {
        payload.max_tokens = 100;
    }

    console.log(`[LocalAI] Calling Vercel AI Gateway (${actualModel}) for mode: ${mode}`);

    return fetch(getAIUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal
    });
}
