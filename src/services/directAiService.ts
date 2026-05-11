// Local AI service — replaces the former Supabase edge function call.
// Streams from the user-configured OpenAI-compatible provider.

import { callAI, type AIMode } from './aiClient';

// Credits are removed in the local/open-source build.
export async function deductPointsAfterGeneration(
  _userId: string,
  _projectId?: string,
  _workDescription?: string,
  _creditsToDeduct: number = 0
): Promise<{ creditsDeducted: number; success: boolean }> {
  return { creditsDeducted: 0, success: true };
}

export function calculateCreditsByFileCount(_fileCount: number, _isFirstVersion: boolean): number {
  return 0;
}

export async function calculateRequestCredits(_userMessage: string): Promise<number> {
  return 0;
}

/**
 * Calls the user-configured AI provider directly. Returns a streaming Response
 * (SSE) — the existing readSSEStream parser in aiService.ts handles it.
 */
export async function callingDirectAI(
  mode: AIMode,
  messages: any[],
  signal?: AbortSignal,
  _userPlan?: string,
  userLanguage?: string,
  colorTheme?: { name: string; colors: string[] } | null
): Promise<Response> {
  return callAI(mode, messages, { signal, userLanguage, colorTheme, stream: true });
}
