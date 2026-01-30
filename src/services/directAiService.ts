import type { Suggestion, ChatMessage } from './aiService';
import {
    CODE_GENERATION_PROMPT,
    STATUS_SYSTEM_PROMPT,
    EXPLANATION_SYSTEM_PROMPT,
    PROJECT_NAME_SYSTEM_PROMPT,
    SUGGESTIONS_SYSTEM_PROMPT,
    CHAT_ONLY_PROMPT,
    VERSION_NAME_PROMPT,
    IMAGE_PROMPT_SYSTEM_PROMPT
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
        case 'rok-fast': return 'google/gemini-2.0-flash';
        case 'rok-smart': return 'xai/grok-4.1-fast-reasoning';
        case 'rok-turbo': return 'google/gemini-3-flash';
        case 'rok-ultra': return 'anthropic/claude-haiku-4.5';
        case 'rok-reson': return 'anthropic/claude-opus-4.5';
        // Allow passing through other model IDs or fallback
        default: return modelId.includes('/') ? modelId : 'google/gemini-2.0-flash';
    }
}

// Main function to call AI directly from client
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'project-name' | 'suggestions' | 'chat' | 'version-name' | 'image-prompt' | 'image-logic',
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
        case 'image-prompt': systemPrompt = IMAGE_PROMPT_SYSTEM_PROMPT; break;
        case 'image-logic': systemPrompt = "Analyze images and user intent. Which image index (0-based) is the logo? Answer ONLY index or 'generate'."; break;
    }

    const actualModel = mapModel(modelId);

    // Construct payload with support for images if provided
    const formattedMessages = messages.map(msg => {
        if (msg.role === 'user' && msg.imageUrls && Array.isArray(msg.imageUrls)) {
            return {
                role: 'user',
                content: [
                    { type: 'text', text: msg.content },
                    ...msg.imageUrls.map((url: string) => ({
                        type: 'image_url',
                        image_url: { url }
                    }))
                ]
            };
        }
        return msg;
    });

    const payload: any = {
        model: actualModel,
        messages: [
            { role: 'system', content: systemPrompt },
            ...formattedMessages
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

// Helper to generate a professional image prompt using Gemini
export async function generateImagePrompt(userPrompt: string, modelId: string = 'rok-fast'): Promise<string> {
    try {
        const response = await callingDirectAI('image-prompt', [{ role: 'user', content: userPrompt }], modelId);
        if (!response.ok) return userPrompt;

        // Handle stream to get full text
        const reader = response.body?.getReader();
        if (!reader) return userPrompt;

        let fullContent = '';
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        fullContent += content;
                    } catch (e) { }
                }
            }
        }

        return fullContent.trim() || userPrompt;
    } catch (e) {
        console.error('Failed to generate image prompt:', e);
        return userPrompt;
    }
}

