import { callingDirectAI, deductPointsAfterGeneration } from './directAiService';

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

// Re-export types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Suggestion {
  label: string;
  prompt: string;
}

// Helper to parse AI response
export function parseAIResponse(response: string): { files: Record<string, any>, fileList: string[] } {
  try {
    // Attempt to extract JSON from code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
      response.match(/```([\s\S]*?)```/);

    let jsonStr = jsonMatch ? jsonMatch[1] : response;
    // Clean potential prefixes
    jsonStr = jsonStr.trim();

    // Ensure we capture the JSON object if there's surrounding text
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    // Sanitize JSON string before parsing to handle unterminated strings or common AI errors
    let sanitizedJson = jsonStr.trim();
    
    // If JSON is truncated (common with AI), try to fix it
    if (!sanitizedJson.endsWith('}')) {
      // Find the last complete object or try to close it
      const lastBrace = sanitizedJson.lastIndexOf('}');
      if (lastBrace !== -1) {
        sanitizedJson = sanitizedJson.substring(0, lastBrace + 1);
      } else {
        // If no closing brace at all, it's likely very broken, but let's try a basic fix
        sanitizedJson += '"}}'; 
      }
    }
    
    // Final check for unterminated strings which cause the specific error reported
    const quoteCount = (sanitizedJson.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      sanitizedJson += '"';
      if (!sanitizedJson.endsWith('}')) sanitizedJson += '}}';
    }

    const parsed = JSON.parse(sanitizedJson);

    const files: Record<string, any> = {};
    let fileList: string[] = [];

    if (parsed.files) {
      // Check if files is an array (some AI models return array format)
      if (Array.isArray(parsed.files)) {
        parsed.files.forEach((file: any) => {
          if (file.path && file.content !== undefined) {
            const path = file.path;
            // Ignore numeric file names or paths without extensions (hallucinations)
            if (/^\d+$/.test(path)) return;

            fileList.push(path);
            files[path] = {
              path,
              content: file.content as string,
              type: 'file'
            };
          }
        });
      } else {
        // Standard object format { "path": "content" }
        Object.entries(parsed.files).forEach(([path, content]) => {
          // Ignore numeric file names or paths without extensions (hallucinations)
          if (/^\d+$/.test(path)) return;

          // Handle case where content might be an object with content property
          const fileContent = typeof content === 'object' && content !== null && 'content' in content
            ? (content as any).content
            : content;

          fileList.push(path);
          files[path] = {
            path,
            content: fileContent as string,
            type: 'file'
          };
        });
      }
    }

    console.log('[parseAIResponse] Parsed files:', fileList);
    return { files, fileList };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { files: {}, fileList: [] };
  }
}

// Generate default project
export function generateDefaultViteProject(): any[] {
  return [];
}


// Generate short project name (2 words)
export async function generateProjectName(prompt: string, modelId?: string): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: `Project: ${prompt}` }];
    const response = await callingDirectAI('project-name', msgs, modelId);

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    // Just read stream as text for project name, looking for data
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

    // Clean and return the 2-word name
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
export async function generateSuggestions(projectDescription: string, modelId?: string): Promise<Suggestion[]> {
  const defaultSuggestions: Suggestion[] = [
    { label: "Add Dark Mode", prompt: "Add a dark mode toggle that saves user preference" },
    { label: "Improve Mobile", prompt: "Improve the mobile responsiveness and add a hamburger menu" },
    { label: "Add Animations", prompt: "Add smooth animations and transitions using Framer Motion" },
    { label: "SEO Optimization", prompt: "Add meta tags and improve SEO for better search rankings" },
  ];

  try {
    const msgs = [{ role: 'user', content: `Project description: ${projectDescription}. Generate 4 relevant feature suggestions.` }];
    const response = await callingDirectAI('suggestions', msgs, modelId);

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
  conversationHistory: Array<{ role: string; content: string }>,
  modelId?: string
): Promise<string> {
  try {
    const msgs = [
      ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];
    const response = await callingDirectAI('chat', msgs, modelId);

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
  projectType: 'vite' | 'html',
  modelId?: string
): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: prompt }];
    const response = await callingDirectAI('explanation', msgs, modelId);

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
    return "I'll build something great for you! 🚀";
  }
}

// Generate status update
export async function generateStatusUpdate(
  currentStep: string
): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: `Current step: ${currentStep}. Give a brief status.` }];
    const response = await callingDirectAI('status', msgs);

    if (!response.ok) return currentStep;

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) return currentStep;

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

    return fullResponse || currentStep;

  } catch {
    return currentStep;
  }
}

// Re-export credit deduction
export { deductPointsAfterGeneration };

// Abort controller for stopping generation
let currentAbortController: AbortController | null = null;

// Stop generation
export function stopGeneration(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
  onFileStart?: (fileName: string) => void;
  onStatusUpdate?: (status: string) => void;
}

// Stream AI code generation
export async function streamAICodeGeneration(
  messages: ChatMessage[],
  projectType: 'vite' | 'html',
  callbacks: StreamCallbacks,
  existingFiles?: string[],
  modelId?: string
): Promise<void> {
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  try {
    callbacks.onStatusUpdate?.('Setting up project structure...');

    const response = await callingDirectAI(
      'code',
      messages,
      modelId,
      signal
    );

    if (!response.ok) {
      throw new Error('⚠️ Service temporarily unavailable. Please try again later.');
    }

    if (!response.body) {
      throw new Error('⚠️ Connection issue. Please check your internet and try again.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    // Status messages that rotate
    const statusMessages = [
      'Setting up project structure...',
      'Creating design system...',
      'Building components...',
      'Adding styles and animations...',
      'Generating pages...',
      'Finalizing the build...',
    ];

    let fileCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;

      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            // Sanitize JSON string before parsing to handle unterminated strings or common AI errors
    let sanitizedJson = jsonStr.trim();
    
    // If JSON is truncated (common with AI), try to fix it
    if (!sanitizedJson.endsWith('}')) {
      // Find the last complete object or try to close it
      const lastBrace = sanitizedJson.lastIndexOf('}');
      if (lastBrace !== -1) {
        sanitizedJson = sanitizedJson.substring(0, lastBrace + 1);
      } else {
        // If no closing brace at all, it's likely very broken, but let's try a basic fix
        sanitizedJson += '"}}'; 
      }
    }
    
    // Final check for unterminated strings which cause the specific error reported
    const quoteCount = (sanitizedJson.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      sanitizedJson += '"';
      if (!sanitizedJson.endsWith('}')) sanitizedJson += '}}';
    }

    const parsed = JSON.parse(sanitizedJson);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              callbacks.onChunk(content);

              // Simple heuristic to detect new file starts for status updates
              if (content.includes('```') || content.includes('import ') || content.includes('export ')) {
                if (Math.random() > 0.8) {
                  const status = statusMessages[fileCount % statusMessages.length];
                  callbacks.onStatusUpdate?.(status);
                  fileCount++;
                }
              }
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }

    callbacks.onComplete(fullResponse);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Generation stopped by user');
    } else {
      console.error('Stream error:', error);
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  } finally {
    currentAbortController = null;
  }
}
