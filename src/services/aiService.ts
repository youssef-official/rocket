import { callingDirectAI, deductPointsAfterGeneration } from './directAiService';

// Re-export types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Suggestion {
  label: string;
  prompt: string;
}

export interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ROBUST JSON EXTRACTION & PARSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cleans and sanitizes JSON string from AI response
 * Handles common issues like escaped characters, trailing commas, etc.
 */
function sanitizeJsonString(jsonStr: string): string {
  let cleaned = jsonStr;

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/gi, '');
  
  // Remove any text before first { or after last }
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No valid JSON object found');
  }
  
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Fix common JSON issues
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  
  // Fix improperly escaped characters
  // Replace unescaped control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });

  return cleaned;
}

/**
 * Attempts to fix truncated JSON by closing open structures
 */
function attemptJsonRepair(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Count brackets and braces
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // Check if we have unbalanced quotes (potential truncation mid-string)
  const quotes = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) {
    repaired += '"';
  }

  // Close any unclosed brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }

  // Close any unclosed braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }

  return repaired;
}

/**
 * Detects if a response appears to be truncated
 */
function detectTruncation(response: string): boolean {
  const text = response.trim();
  
  // Check for unbalanced braces
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return true;
  }

  // Check for common truncation indicators
  const truncationPatterns = [
    /\.\.\.$/,
    /\u2026$/,  // ellipsis character
    /\[truncated\]/i,
    /\[continued\]/i,
  ];

  return truncationPatterns.some(p => p.test(text));
}

// Main parser with robust error handling
export function parseAIResponse(response: string): { files: Record<string, any>, fileList: string[], actionsTaken?: FileActivity[] } {
  try {
    // Handle "json|..." format from AI gateways
    if (response.startsWith('json|')) {
      const parts = response.split('|');
      if (parts.length > 1) {
        response = parts.slice(1).join('|');
      }
    }

    // Check for truncation
    if (detectTruncation(response)) {
      console.warn('[parseAIResponse] Response appears truncated, attempting repair...');
    }

    // Step 1: Sanitize the JSON string
    let jsonStr: string;
    try {
      jsonStr = sanitizeJsonString(response);
    } catch (e) {
      console.error('[parseAIResponse] Failed to sanitize JSON:', e);
      return { files: {}, fileList: [] };
    }

    // Step 2: Try direct parsing
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (firstError) {
      console.warn('[parseAIResponse] First parse failed, attempting repair...');
      
      // Step 3: Try with repairs
      try {
        const repaired = attemptJsonRepair(jsonStr);
        parsed = JSON.parse(repaired);
      } catch (secondError) {
        console.error('[parseAIResponse] JSON repair failed:', secondError);
        
        // Step 4: Final fallback - try to extract any valid file content
        try {
          const filesMatch = jsonStr.match(/"files"\s*:\s*\{([^]*)\}/);
          if (filesMatch) {
            const partialJson = `{"files":{${filesMatch[1]}}}`;
            const cleanPartial = attemptJsonRepair(partialJson);
            parsed = JSON.parse(cleanPartial);
          } else {
            throw new Error('Could not extract files object');
          }
        } catch (thirdError) {
          console.error('[parseAIResponse] All parsing attempts failed');
          return { files: {}, fileList: [] };
        }
      }
    }

    // Extract files and actions
    const files: Record<string, any> = {};
    let fileList: string[] = [];
    let actionsTaken: FileActivity[] = [];

    if (parsed.files) {
      if (Array.isArray(parsed.files)) {
        parsed.files.forEach((file: any) => {
          if (file.path && file.content !== undefined) {
            const path = file.path;
            if (/^\d+$/.test(path)) return;
            fileList.push(path);
            files[path] = { path, content: file.content as string, type: 'file' };
          }
        });
      } else {
        Object.entries(parsed.files).forEach(([path, content]) => {
          if (/^\d+$/.test(path)) return;
          const fileContent = typeof content === 'object' && content !== null && 'content' in content
            ? (content as any).content
            : content;
          fileList.push(path);
          files[path] = { path, content: fileContent as string, type: 'file' };
        });
      }
    }

    if (parsed.actions_taken && Array.isArray(parsed.actions_taken)) {
      actionsTaken = parsed.actions_taken.map((action: any) => ({
        name: action.name,
        action: action.action,
        status: action.status || 'done'
      }));
    }

    console.log('[parseAIResponse] Successfully parsed files:', fileList);
    return { files, fileList, actionsTaken };
    
  } catch (e) {
    console.error('[parseAIResponse] Unexpected error:', e);
    return { files: {}, fileList: [] };
  }
}

// Generate default project
export function generateDefaultViteProject(): any[] {
  return [];
}

// Generate short project name (2 words)
export async function generateProjectName(prompt: string): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: `Project: ${prompt}` }];
    const response = await callingDirectAI('project-name', msgs);

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

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

    const content = fullResponse || 'New Project';
    const cleaned = content.trim().replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleaned.split(/\s+/).filter((w: string) => w.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return cleaned || 'New Project';

  } catch (error) {
    console.error('Project name generation error:', error);
    return 'New Project';
  }
}

// Generate suggestions after project completion
export async function generateSuggestions(projectDescription: string): Promise<Suggestion[]> {
  const defaultSuggestions: Suggestion[] = [
    { label: "Add Dark Mode", prompt: "Add a dark mode toggle that saves user preference" },
    { label: "Improve Mobile", prompt: "Improve the mobile responsiveness and add a hamburger menu" },
    { label: "Add Animations", prompt: "Add smooth animations and transitions using Framer Motion" },
    { label: "SEO Optimization", prompt: "Add meta tags and improve SEO for better search rankings" },
  ];

  try {
    const msgs = [{ role: 'user', content: `Project description: ${projectDescription}. Generate 4 relevant feature suggestions.` }];
    const response = await callingDirectAI('suggestions', msgs);

    if (!response.ok) return defaultSuggestions;

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

    try {
      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]) as Suggestion[];
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 4);
        }
      }
    } catch {
      console.error('Failed to parse suggestions JSON');
    }

    return defaultSuggestions;
  } catch (error) {
    console.error('Suggestions generation error:', error);
    return defaultSuggestions;
  }
}

// Chat-only response (no code generation)
export async function generateChatResponse(
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const msgs = [
      ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];
    const response = await callingDirectAI('chat', msgs);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) throw new Error('No body');

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

    return fullResponse || "I'm here to help! What would you like to know about your project?";

  } catch (error) {
    console.error('Chat response error:', error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

// Generate explanation only (for chat display)
export async function generateExplanation(
  prompt: string,
  projectType: 'vite' | 'html'
): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: prompt }];
    const response = await callingDirectAI('explanation', msgs);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) throw new Error('No body');

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

    return fullResponse || "I'll create something amazing for you!";

  } catch (error) {
    console.error('Explanation generation error:', error);
    return "I'll create something amazing for you!";
  }
}

// Stream code generation
export async function streamAICodeGeneration(
  messages: any[],
  projectType: 'vite' | 'html',
  options: {
    onChunk: (chunk: string) => void;
    onComplete: (fullResponse: string) => void;
    onError?: (error: Error) => void;
    onFileStart?: (fileName: string) => void;
    onStatusUpdate?: (status: string) => void;
    signal?: AbortSignal;
  },
  existingFiles?: string
) {
  try {
    let finalMessages = [...messages];
    if (existingFiles && finalMessages.length > 0) {
      const lastMsg = finalMessages[finalMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `${lastMsg.content}\n\nExisting files in project: ${existingFiles}\nPLEASE FOCUS ON TARGETED EDITS.`;
      }
    }

    const response = await callingDirectAI('code', finalMessages, options.signal);

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

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
              options.onChunk(content);
            } catch (e) { }
          }
        }
      }
    }

    options.onComplete(fullResponse);
  } catch (error) {
    console.error('Code generation error:', error);
    if (options.onError) {
      options.onError(error as Error);
    } else {
      options.onComplete('');
    }
  }
}

// Stop generation (placeholder for now as fetch signal is used)
export function stopGeneration() {
  // Implementation handled via AbortController in calling components
}

export { deductPointsAfterGeneration };
