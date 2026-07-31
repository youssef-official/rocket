import { getAiSettings, AI_PROVIDER_PRESETS } from './aiSettings';
import { promptForMode, autoFixSystem } from './systemPrompts';

// SMART CREDIT DEDUCTION: everything is free in the local build.
export async function deductPointsAfterGeneration(
    userId: string,
    projectId?: string,
    workDescription?: string,
    creditsToDeduct: number = 1
): Promise<{ creditsDeducted: number; success: boolean }> {
    void userId; void projectId; void workDescription;
    return { creditsDeducted: creditsToDeduct, success: true };
}

export function calculateCreditsByFileCount(fileCount: number, isFirstVersion: boolean): number {
    if (isFirstVersion) return 2;
    if (fileCount <= 2) return 0.5;
    if (fileCount <= 3) return 1;
    if (fileCount <= 5) return 3;
    return 5;
}

export async function calculateRequestCredits(_userMessage: string): Promise<number> {
    return 1;
}

export class MissingAiSettingsError extends Error {
    constructor() {
        super('Add your AI provider, API key and model in Settings before generating.');
    }
}

/**
 * Calls the user's own OpenAI-compatible provider directly from the browser.
 * No server, no proxy, no database: the key stays on the device.
 */
export async function callingDirectAI(
    mode: 'code' | 'status' | 'explanation' | 'suggestions' | 'chat' | 'version-name' | 'clarify' | 'store-config',
    messages: any[],
    signal?: AbortSignal,
    userPlan?: string,
    userLanguage?: string,
    colorTheme?: { name: string; colors: string[] } | null,
    projectId?: string,
    generationKind?: 'initial' | 'edit'
): Promise<Response> {
    void userPlan; void projectId; void generationKind;

    const settings = getAiSettings();
    const preset = AI_PROVIDER_PRESETS.find(item => item.id === settings.providerId);
    if (!settings.baseUrl || !settings.model || (!settings.apiKey && !preset?.local)) {
        throw new MissingAiSettingsError();
    }

    const timeoutMs: Record<string, number> = {
        'code': 900_000,
        'chat': 300_000,
        'clarify': 120_000,
        'explanation': 300_000,
        'version-name': 120_000,
        'suggestions': 180_000,
        'status': 60_000,
        'store-config': 180_000,
    };
    const timeout = timeoutMs[mode] || 300_000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) signal.addEventListener('abort', () => controller.abort());

    const formattedMessages = messages.map(msg => {
        if (msg.role === 'user' && msg.imageUrls && Array.isArray(msg.imageUrls)) {
            return {
                role: 'user',
                content: [
                    { type: 'text', text: msg.content },
                    ...msg.imageUrls.map((url: string) => ({ type: 'image_url', image_url: { url } })),
                ],
            };
        }
        return msg;
    });

    const latestUserContent = [...formattedMessages].reverse().find(message => message.role === 'user')?.content;
    const isAutoFix = mode === 'code' && typeof latestUserContent === 'string' && latestUserContent.startsWith('[AUTO-FIX]');
    const themeDirective = colorTheme
        ? `\n\nSELECTED DESIGN SYSTEM (MANDATORY): Use the “${colorTheme.name}” palette as real CSS design tokens throughout the result: ${colorTheme.colors.join(', ')}. Preserve accessible contrast while keeping these colors visibly dominant. Do not substitute a different palette.`
        : '';
    const languageDirective = userLanguage ? `\n\nRespond and write all user-facing copy in the user's language (${userLanguage}).` : '';
    const systemPrompt = `${isAutoFix ? autoFixSystem : promptForMode(mode)}${themeDirective}${languageDirective}`;

    const temperature = isAutoFix ? 0.1 : mode === 'code' ? 0.35 : 0.25;
    const maxTokens = isAutoFix ? 6000 : mode === 'explanation' ? 240 : mode === 'store-config' ? 1400 : mode === 'code' ? 35000 : 8000;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
    if (settings.baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Vivora X';
    }

    try {
        const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: settings.model,
                stream: true,
                temperature,
                max_tokens: maxTokens,
                messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
