import { deductCredits } from './creditService';

// Get Supabase URL from env
function getSupabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL || '';
}

// SMART CREDIT DEDUCTION: Calculate credit cost based on file count then deduct
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

// Calculate credits based on number of files modified (file-count algorithm)
export function calculateCreditsByFileCount(fileCount: number, isFirstVersion: boolean): number {
    if (isFirstVersion) return 2; // First version always costs 2 credits
    if (fileCount <= 2) return 0.5;
    if (fileCount <= 5) return 1;
    if (fileCount <= 10) return 1.5;
    return 3; // 10+ files
}

// Legacy function - no longer calls AI, uses file count instead
export async function calculateRequestCredits(_userMessage: string): Promise<number> {
    // Default to 1 credit pre-deduction; actual amount adjusted after generation
    return 1;
}

// Main function to call AI via Supabase Edge Function
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'project-name' | 'suggestions' | 'chat' | 'version-name',
    messages: any[],
    signal?: AbortSignal,
    userPlan?: string
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
            messages: formattedMessages,
            userPlan: userPlan || 'spark'
        }),
        signal
    });
}
