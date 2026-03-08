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
    if (fileCount <= 3) return 1;
    if (fileCount <= 5) return 3;
    return 5; // 6+ files
}

// Legacy function - no longer calls AI, uses file count instead
export async function calculateRequestCredits(_userMessage: string): Promise<number> {
    // Default to 1 credit pre-deduction; actual amount adjusted after generation
    return 1;
}

// Main function to call AI via Supabase Edge Function
// Supports adaptive timeouts for slow/thinking models
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'project-name' | 'suggestions' | 'chat' | 'version-name',
    messages: any[],
    signal?: AbortSignal,
    userPlan?: string,
    userLanguage?: string,
    colorTheme?: { name: string; colors: string[] } | null
): Promise<Response> {
    const supabaseUrl = getSupabaseUrl();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
        throw new Error("Missing Supabase URL. Please check your .env file.");
    }

    const timeoutMs: Record<string, number> = {
        'code': 300_000,
        'chat': 180_000,
        'explanation': 180_000,
        'project-name': 120_000,
        'version-name': 120_000,
        'suggestions': 120_000,
        'status': 60_000,
    };
    const timeout = timeoutMs[mode] || 180_000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

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

    try {
        const body: any = { 
            mode, 
            messages: formattedMessages,
            userPlan: userPlan || 'free',
            userLanguage: userLanguage || 'en'
        };
        if (colorTheme) {
            body.colorTheme = colorTheme;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
