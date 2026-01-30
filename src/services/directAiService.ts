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
import { calculateCredits, deductCredits, getModelMultiplier } from './creditService';

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
    return import.meta.env.VITE_OPENAI_API_KEY ||
        import.meta.env.VITE_VERCEL_AI_API_KEY ||
        import.meta.env.VITE_AI_API_KEY ||
        null;
}

// Get API URL from env or default to Vercel AI Gateway
function getAIUrl(): string {
    return "https://ai-gateway.vercel.sh/v1/chat/completions";
}

// Model ID to real model mapping
function mapModel(modelId: string): string {
    switch (modelId) {
        case 'rok-fast': return 'xai/grok-code-fast-1';
        case 'rok-smart': return 'zai/glm-4.7';
        case 'rok-turbo': return 'moonshotai/kimi-k2-thinking';
        case 'rok-ultra': return 'google/gemini-3-flash';
        case 'rok-reson': return 'anthropic/claude-haiku-4.5';
        default: return modelId.includes('/') ? modelId : 'xai/grok-code-fast-1';
    }
}

// DEDUCT_POINTS: Calculate and deduct credits after generation
export async function deductPointsAfterGeneration(
    userId: string,
    modelId: string,
    filesChanged: number,
    linesOfCode: number,
    projectId?: string,
    workDescription?: string,
    isFirstVersion: boolean = false
): Promise<{ creditsDeducted: number; success: boolean }> {
    const multiplier = getModelMultiplier(modelId);
    const credits = calculateCredits(filesChanged, linesOfCode, multiplier, isFirstVersion);
    
    const result = await deductCredits(userId, credits, modelId, projectId, workDescription);
    
    return {
        creditsDeducted: result.creditsDeducted,
        success: result.success
    };
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
       temperature: 0.7,
       top_p: 0.95

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
