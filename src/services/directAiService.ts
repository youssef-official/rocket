import { deductCredits } from './creditService';

// Get Supabase URL from env
function getSupabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL || '';
}

// SMART CREDIT DEDUCTION: Calculate credit cost based on complexity then deduct
export async function deductPointsAfterGeneration(
    userId: string,
    projectId?: string,
    workDescription?: string,
    creditsToDeduct: number = 1
): Promise<{ creditsDeducted: number; success: boolean }> {
    const result = await deductCredits(userId, projectId, workDescription, creditsToDeduct);
    return {
        creditsDeducted: result.creditsDeducted,
        success: result.success
    };
}

// Calculate how many credits a request should cost (0.5 / 1 / 2 / 3)
export async function calculateRequestCredits(userMessage: string): Promise<number> {
    const supabaseUrl = getSupabaseUrl();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({
                mode: 'credit',
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        if (!response.ok) return 1;

        const data = await response.json();
        const credits = typeof data?.credits === 'number' ? data.credits : 1;
        // Clamp to valid values: 0.5, 1, 2, 3
        if (credits <= 0.5) return 0.5;
        if (credits <= 1) return 1;
        if (credits <= 2) return 2;
        return 3;
    } catch {
        return 1; // Default to 1 credit on error
    }
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
