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
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ROBUST JSON EXTRACTION & PARSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cleans and sanitizes JSON string from AI response
 */
function sanitizeJsonString(jsonStr: string): string {
  let cleaned = jsonStr;

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/gi, '');
  
  // Find all potential JSON objects and pick the one that looks most like our response
  // We look for the object that contains "files" or "actions_taken"
  const startIndices: number[] = [];
  let pos = cleaned.indexOf('{');
  while (pos !== -1) {
    startIndices.push(pos);
    pos = cleaned.indexOf('{', pos + 1);
  }

  if (startIndices.length === 0) return "{}";

  let bestJson = "";
  let maxScore = -1;

  for (const startIdx of startIndices) {
    let depth = 0;
    let inString = false;
    let escaping = false;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaping) { escaping = false; continue; }
      if (ch === '\\' && inString) { escaping = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    const candidate = endIdx === -1 
      ? cleaned.slice(startIdx) 
      : cleaned.slice(startIdx, endIdx + 1);
    
    // Score the candidate based on presence of expected keys
    let score = 0;
    if (candidate.includes('"files"') || candidate.includes('files:')) score += 10;
    if (candidate.includes('"actions_taken"') || candidate.includes('actions_taken:')) score += 5;
    if (candidate.includes('"content"') || candidate.includes('content:')) score += 2;
    
    if (score > maxScore) {
      maxScore = score;
      bestJson = candidate;
    }
    
    // If we found a perfect match that is balanced, we can stop
    if (score >= 10 && endIdx !== -1) break;
  }

  cleaned = bestJson || cleaned.slice(startIndices[0]);

  // Fix common JSON issues
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  
  // Fix unescaped control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });
  
  // Fix common escape issues
  cleaned = cleaned.replace(/\\(?![nrt"\\bfu])/g, '\\\\');

  return cleaned;
}

/**
 * Fallback: Manually extracts files from a malformed or truncated JSON string
 * using regex when JSON.parse fails completely.
 */
function manualExtractFiles(text: string): { files: Record<string, any>, fileList: string[] } {
  const files: Record<string, any> = {};
  const fileList: string[] = [];
  
  // Regex to find "path/to/file": "content" or "path/to/file": { "content": "..." }
  // This is designed to be extremely forgiving
  const fileRegex = /"([^"]+\.(tsx?|jsx?|css|json|html|md|js))"\s*:\s*(\{[\s\S]*?\}|"[^"]*")/g;
  let match;
  
  while ((match = fileRegex.exec(text)) !== null) {
    const path = match[1];
    const rawValue = match[2];
    
    try {
      if (rawValue.startsWith('{')) {
        // Try to find content inside the object
        const contentMatch = rawValue.match(/"content"\s*:\s*"([\s\S]*?)"/);
        if (contentMatch) {
          const content = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          files[path] = { path, content, type: 'file' };
          if (!fileList.includes(path)) fileList.push(path);
        }
      } else {
        // Direct string value
        const content = rawValue.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        files[path] = { path, content, type: 'file' };
        if (!fileList.includes(path)) fileList.push(path);
      }
    } catch (e) {
      // Skip this file if extraction fails
    }
  }
  
  return { files, fileList };
}

/**
 * Parses <FILE path="...">...</FILE> blocks (preferred for code mode).
 */
function parseFileBlocks(text: string): { files: Record<string, any>, fileList: string[], deletedFiles: string[] } | null {
  const files: Record<string, any> = {};
  const fileList: string[] = [];
  const deletedFiles: string[] = [];

  // Parse FILE blocks
  const re = /<FILE\s+path=("|')([^"']+)\1>\s*([\s\S]*?)\s*<\/FILE>/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const path = match[2]?.trim();
    if (!path || /^\d+$/.test(path)) continue;
    const content = match[3] ?? '';
    if (!fileList.includes(path)) fileList.push(path);
    files[path] = { path, content, type: 'file' };
  }

  // Parse DELETE blocks
  const deleteRe = /<DELETE\s+path=("|')([^"']+)\1\s*\/?>/g;
  let deleteMatch: RegExpExecArray | null;
  while ((deleteMatch = deleteRe.exec(text)) !== null) {
    const path = deleteMatch[2]?.trim();
    if (path && !deletedFiles.includes(path)) {
      deletedFiles.push(path);
    }
  }

  if (fileList.length === 0 && deletedFiles.length === 0) return null;
  return { files, fileList, deletedFiles };
}

/**
 * Attempts to fix truncated JSON by closing open structures
 */
function attemptJsonRepair(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // 1. Fix common unquoted keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // 2. Balance braces and brackets while respecting strings
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaping = false;
  let lastValidChar = '';
  let lastColonIdx = -1;

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escaping) {
      escaping = false;
      continue;
    }
    if (ch === '\\') {
      escaping = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
      if (ch === ':') lastColonIdx = i;
      if (!/\s/.test(ch)) lastValidChar = ch;
    }
  }

  // 3. Handle truncated content
  if (inString) {
    repaired += '"';
    // If we just closed a string that was a key (no colon after it), add colon and value
    const lastQuoteIdx = repaired.lastIndexOf('"');
    if (lastColonIdx < repaired.lastIndexOf('"', lastQuoteIdx - 1)) {
      repaired += ':""';
    }
  }

  if (lastValidChar === ':') {
    repaired += '""';
  }

  if (lastValidChar === ',') {
    repaired = repaired.replace(/,\s*$/, '');
  }

  // Close unclosed structures
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }

  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  return repaired;
}

/**
 * Detects if a response appears to be truncated
 */
function detectTruncation(response: string): boolean {
  const text = response.trim();
  
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) return true;

  const truncationPatterns = [/\.\.\.$/,/\u2026$/,/\[truncated\]/i,/\[continued\]/i];
  return truncationPatterns.some(p => p.test(text));
}

// Main parser with robust error handling
export function parseAIResponse(response: string): { files: Record<string, any>, fileList: string[], actionsTaken?: FileActivity[], deletedFiles?: string[] } {
  try {
    // Handle "json|..." format from AI gateways
    if (response.startsWith('json|')) {
      const parts = response.split('|');
      if (parts.length > 1) {
        response = parts.slice(1).join('|');
      }
    }

    // Preferred: parse <FILE> blocks (doesn't require JSON escaping)
    const fileBlocks = parseFileBlocks(response);
    if (fileBlocks && (fileBlocks.fileList.length > 0 || fileBlocks.deletedFiles.length > 0)) {
      console.log('[parseAIResponse] Parsed <FILE> blocks:', fileBlocks.fileList, 'Deleted:', fileBlocks.deletedFiles);
      return { ...fileBlocks, actionsTaken: [] };
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
    const fixKnownUnquotedKeys = (s: string) =>
      s
        .replace(/([{,]\s*)files\s*:/g, '$1"files":')
        .replace(/([{,]\s*)actions_taken\s*:/g, '$1"actions_taken":')
        .replace(/([{,]\s*)actionsTaken\s*:/g, '$1"actions_taken":');

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (firstError) {
      console.warn('[parseAIResponse] First parse failed, attempting repair...');

      const keyFixed = fixKnownUnquotedKeys(jsonStr);

      // Step 2.5: Try parsing after fixing common unquoted keys
      try {
        parsed = JSON.parse(keyFixed);
      } catch {
        // Step 3: Try with repairs
        try {
          const repaired = attemptJsonRepair(keyFixed);
          parsed = JSON.parse(repaired);
        } catch (secondError) {
          console.error('[parseAIResponse] JSON repair failed:', secondError);

          // Step 4: Final fallback - try to extract any valid file content
          try {
            const filesMatch = keyFixed.match(/"files"\s*:\s*\{([^]*)\}/);
            if (filesMatch) {
              const partialJson = `{"files":{${filesMatch[1]}}}`;
              const cleanPartial = attemptJsonRepair(partialJson);
              parsed = JSON.parse(cleanPartial);
            } else {
              throw new Error('Could not extract files object');
            }
          } catch (thirdError) {
            console.warn('[parseAIResponse] All JSON.parse attempts failed, using manual extraction fallback...');
            const manualResult = manualExtractFiles(response);
            if (manualResult.fileList.length > 0) {
              return { ...manualResult, actionsTaken: [] };
            }
            console.error('[parseAIResponse] All parsing attempts failed');
            return { files: {}, fileList: [] };
          }
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

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 STREAMING (SSE) - DO NOT DROP PARTIAL LINES
// ═══════════════════════════════════════════════════════════════════════════════

async function readSSEStream(
  response: Response,
  onDelta?: (deltaText: string) => void
): Promise<string> {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let textBuffer = '';
  let fullResponse = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue; // keepalive/comments
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullResponse += content;
          onDelta?.(content);
        }
      } catch {
        // JSON can be split across chunks; put it back and wait for more data
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush (in case buffer ended without trailing newline)
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;

      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullResponse += content;
          onDelta?.(content);
        }
      } catch {
        // ignore partial leftovers
      }
    }
  }

  return fullResponse;
}

// Generate short project name (2 words)
export async function generateProjectName(prompt: string): Promise<string> {
  try {
    const msgs = [{ role: 'user', content: `Project: ${prompt}` }];
    const response = await callingDirectAI('project-name', msgs);

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const fullResponse = await readSSEStream(response);

    const content = fullResponse || 'New Project';
    const cleaned = content.trim().replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleaned.split(/\s+/).filter((w: string) => w.length > 0);
    if (words.length >= 2) {
      return words
        .slice(0, 2)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
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

    const fullResponse = await readSSEStream(response);

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

    const fullResponse = await readSSEStream(response);

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

    const fullResponse = await readSSEStream(response);

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
        lastMsg.content = `${lastMsg.content}

EXISTING PROJECT FILES: [${existingFiles}]
⚠️ CRITICAL EDITING RULES:
- This is an EXISTING project. ONLY output <FILE> blocks for files that NEED changes.
- DO NOT regenerate index.html, main.tsx, index.css, App.tsx unless the change SPECIFICALLY requires it.
- If the user asks to fix a bug, identify the EXACT file causing it and ONLY fix that file.
- If the user asks to add a feature, ONLY create/modify the files needed for that feature.
- NEVER touch files unrelated to the user's request.
- Include "read" actions for files you analyzed, and "edited"/"created" for files you changed.`;
      }
    }

    const response = await callingDirectAI('code', finalMessages, options.signal);

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const fullResponse = await readSSEStream(response, options.onChunk);
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
