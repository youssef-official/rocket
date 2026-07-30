import { apiUrl, getToken } from './api';

// SMART CREDIT DEDUCTION: Calculate credit cost based on file count then deduct
export async function deductPointsAfterGeneration(
    userId: string,
    projectId?: string,
    workDescription?: string,
    creditsToDeduct: number = 1
): Promise<{ creditsDeducted: number; success: boolean }> {
    // Credits are a future server-side billing concern; generation is never charged in the browser.
    void userId; void projectId; void workDescription;
    return { creditsDeducted: creditsToDeduct, success: true };
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

// Main function to call AI through Vivora X's private Node API.
// Supports adaptive timeouts for slow/thinking models
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'suggestions' | 'chat' | 'version-name' | 'clarify',
    messages: any[],
    signal?: AbortSignal,
    userPlan?: string,
    userLanguage?: string,
    colorTheme?: { name: string; colors: string[] } | null,
    projectId?: string,
    generationKind?: 'initial' | 'edit'
): Promise<Response> {

    const timeoutMs: Record<string, number> = {
        'code': 300_000,
        'chat': 180_000,
        'clarify': 60_000,
        'explanation': 180_000,
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
            userLanguage: userLanguage || 'en',
            projectId,
            generationKind,
        };
        if (colorTheme) {
            body.colorTheme = colorTheme;
        }

        const response = await fetch(apiUrl('/generate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken() || ''}`
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
