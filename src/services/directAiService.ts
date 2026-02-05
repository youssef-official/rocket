import { deductCredits } from './creditService';

// Standard OpenAI/Vercel AI SDK compatible payload
interface AIRequestPayload {
    model: string;
    messages: Array<{ role: string; content: string | any[] }>;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
}

// Get Supabase URL from env
function getSupabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL || '';
}

// DEDUCT_POINTS: Deduct 1 credit after successful generation
export async function deductPointsAfterGeneration(
    userId: string,
    projectId?: string,
    workDescription?: string
): Promise<{ creditsDeducted: number; success: boolean }> {
    const result = await deductCredits(userId, projectId, workDescription);
    return {
        creditsDeducted: result.creditsDeducted,
        success: result.success
    };
}

// Main function to call AI via Supabase Edge Function
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'project-name' | 'suggestions' | 'chat' | 'version-name',
    messages: any[],
    signal?: AbortSignal
): Promise<Response> {
    const supabaseUrl = getSupabaseUrl();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
        throw new Error("Missing Supabase URL. Please check your .env file.");
    }

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

    console.log(`[AI] Calling Edge Function for mode: ${mode}`);

    return fetch(`${supabaseUrl}/functions/v1/generate-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({ 
            mode, 
            messages: formattedMessages 
        }),
        signal
    });
}
