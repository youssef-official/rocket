import { callAI as callingDirectAI } from './aiClient';

// Generate AI-powered version names based on changes made
export async function generateVersionName(
  projectDescription: string,
  changeDescription?: string,
  versionNumber?: number
): Promise<string> {

  const fallbackNames = [
    'Initial Build',
    'Feature Update',
    'UI Enhancement',
    'Bug Fixes',
    'Performance Boost',
    'Style Refresh',
    'Component Upgrade',
    'Layout Update',
  ];

  try {
    const promptContent = changeDescription
      ? `Project: ${projectDescription}. Change: ${changeDescription}. Generate a short name for this version.`
      : `Project: ${projectDescription}. This is version ${versionNumber || 1}. Generate a short name for this initial build.`;

    const msgs = [{ role: 'user', content: promptContent }];
    const response = await callingDirectAI('version-name', msgs);

    if (!response.ok) {
      return fallbackNames[(versionNumber || 1) % fallbackNames.length];
    }

    // Parse SSE response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullResponse += content;
            } catch (e) { }
          }
        }
      }
    }

    // Clean the response
    const cleaned = fullResponse.trim().replace(/["\n]/g, '').trim();
    if (cleaned && cleaned.length > 0 && cleaned.length < 50) {
      return cleaned;
    }

    return fallbackNames[(versionNumber || 1) % fallbackNames.length];
  } catch (error) {
    console.error('Version name generation error:', error);
    return fallbackNames[(versionNumber || 1) % fallbackNames.length];
  }
}
