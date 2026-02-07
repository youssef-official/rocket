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
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        files: parsed.files || {},
        fileList: Object.keys(parsed.files || {}),
        actionsTaken: parsed.actions_taken || []
      };
    } catch (e) {
      // Step 3: Try repair if direct parsing fails
      try {
        const repairedJson = attemptJsonRepair(jsonStr);
        const parsed = JSON.parse(repairedJson);
        return {
          files: parsed.files || {},
          fileList: Object.keys(parsed.files || {}),
          actionsTaken: parsed.actions_taken || []
        };
      } catch (repairError) {
        // Step 4: Final fallback - manual extraction
        console.error('[parseAIResponse] JSON parse failed after repair, using manual extraction');
        return manualExtractFiles(jsonStr);
      }
    }
  } catch (e) {
    console.error('[parseAIResponse] Critical error during parsing:', e);
    return { files: {}, fileList: [] };
  }
}

/**
 * Calls the AI to generate or modify files
 */
export async function generateWithAI(
  prompt: string, 
  history: ChatMessage[] = [], 
  onProgress?: (status: string) => void
): Promise<{ files: Record<string, any>, fileList: string[], actionsTaken?: FileActivity[] }> {
  try {
    if (onProgress) onProgress('Preparing AI request...');
    
    // Call the direct AI service
    const response = await callingDirectAI(prompt, history);
    
    if (onProgress) onProgress('Parsing AI response...');
    
    // Parse the response
    const result = parseAIResponse(response);
    
    // Deduct points after successful generation
    await deductPointsAfterGeneration();
    
    return result;
  } catch (error) {
    console.error('Error in generateWithAI:', error);
    throw error;
  }
}
