import { callingDirectAI, deductPointsAfterGeneration } from './directAiService';
import type { ProjectFile } from '@/types';
import { isBrowserProjectFile, normalizeBrowserProjectPath } from '@/lib/browserProject';

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

  // Try FILE block extraction first (handles partial/malformed blocks, case-insensitive)
  const fileTagRegex = /<file\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  const fileStarts: { path: string; tagStart: number; contentStart: number }[] = [];

  while ((tagMatch = fileTagRegex.exec(text)) !== null) {
    const path = normalizeBrowserProjectPath(tagMatch[1] ?? tagMatch[2] ?? tagMatch[3] ?? '');
    if (!isBrowserProjectFile(path)) continue;
    fileStarts.push({
      path,
      tagStart: tagMatch.index,
      contentStart: tagMatch.index + tagMatch[0].length,
    });
  }

  const lowerText = text.toLowerCase();

  for (let i = 0; i < fileStarts.length; i++) {
    const { path, contentStart } = fileStarts[i];
    const closeIdx = lowerText.indexOf('</file>', contentStart);
    const nextTagIdx = i + 1 < fileStarts.length ? fileStarts[i + 1].tagStart : -1;
    const endIdx = closeIdx !== -1 ? closeIdx : (nextTagIdx !== -1 ? nextTagIdx : text.length);
    const content = text.substring(contentStart, endIdx).trim();

    if (content.length > 5 && !fileList.includes(path)) {
      fileList.push(path);
      files[path] = { path, content, type: 'file' };
    }
  }

  if (fileList.length > 0) return { files, fileList };

  // Fallback: JSON-style extraction
  const fileRegex = /"([^"]+\.(?:html|css|js|json|svg|txt|md))"\s*:\s*(\{[\s\S]*?\}|"[^"]*")/gi;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    const path = normalizeBrowserProjectPath(match[1]);
    if (!isBrowserProjectFile(path)) continue;
    const rawValue = match[2];

    try {
      if (rawValue.startsWith('{')) {
        const contentMatch = rawValue.match(/"content"\s*:\s*"([\s\S]*?)"/);
        if (contentMatch) {
          const content = contentMatch[1]
            .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
            .replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          files[path] = { path, content, type: 'file' };
          if (!fileList.includes(path)) fileList.push(path);
        }
      } else {
        const content = rawValue.slice(1, -1)
          .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
          .replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        files[path] = { path, content, type: 'file' };
        if (!fileList.includes(path)) fileList.push(path);
      }
    } catch {
      // skip malformed match
    }
  }

  return { files, fileList };
}

/**
 * Fallback: Extracts files from markdown-style responses.
 * Example supported patterns:
 * - ### index.html + fenced code block
 * - **File: styles.css** + fenced code block
 * - `script.js` + fenced code block
 */
function extractMarkdownFileBlocks(text: string): { files: Record<string, any>, fileList: string[] } {
  const files: Record<string, any> = {};
  const fileList: string[] = [];

  const pathRegex = /((?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+\.(?:html|css|js|json|svg|txt|md))\b/i;
  const fenceRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(text)) !== null) {
    const code = (match[1] || '').trim();
    if (!code) continue;

    const before = text.slice(Math.max(0, match.index - 320), match.index);
    const contextLines = before.split('\n').slice(-6).join('\n');

    let path = '';
    const contextPath = contextLines.match(pathRegex);
    if (contextPath?.[1]) {
      path = contextPath[1].trim();
    } else {
      const firstLine = code.split('\n')[0] || '';
      const firstLinePath = firstLine.match(/(?:file|path)\s*[:=-]\s*((?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+\.(?:html|css|js|json|svg|txt|md))\b/i);
      if (firstLinePath?.[1]) {
        path = firstLinePath[1].trim();
      }
    }

    path = normalizeBrowserProjectPath(path);
    if (!isBrowserProjectFile(path) || fileList.includes(path)) continue;

    fileList.push(path);
    files[path] = { path, content: code, type: 'file' };
  }

  return { files, fileList };
}

/**
 * Parses <FILE path="...">...</FILE> blocks (preferred for code mode).
 * Also handles truncated responses where the last FILE block may not be closed.
 */
function parseFileBlocks(text: string): { files: Record<string, any>, fileList: string[], deletedFiles: string[], actionsTaken: FileActivity[], summary: string } | null {
  const files: Record<string, any> = {};
  const fileList: string[] = [];
  const deletedFiles: string[] = [];
  let actionsTaken: FileActivity[] = [];
  let summary = '';

  // Normalize FILE tags to support uppercase/lowercase variants
  const normalizedText = text
    .replace(/<\s*file\b/gi, '<FILE')
    .replace(/<\/\s*file\s*>/gi, '</FILE>');

  // Parse complete FILE blocks using indexOf-based approach (fast on large strings)
  let searchFrom = 0;
  while (true) {
    const openTagStart = normalizedText.indexOf('<FILE', searchFrom);
    if (openTagStart === -1) break;

    // Find the end of the opening tag
    const openTagEnd = normalizedText.indexOf('>', openTagStart);
    if (openTagEnd === -1) break;

    // Extract path from the opening tag (supports path= or name=, quoted and unquoted values)
    const tagStr = normalizedText.substring(openTagStart, openTagEnd + 1);
    const pathMatch = tagStr.match(/(?:path|name)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/);
    const path = normalizeBrowserProjectPath(pathMatch?.[1] ?? pathMatch?.[2] ?? pathMatch?.[3] ?? '');
    if (!isBrowserProjectFile(path)) { searchFrom = openTagEnd + 1; continue; }

    // Find closing tag
    const closeTag = '</FILE>';
    const closeIdx = normalizedText.indexOf(closeTag, openTagEnd + 1);

    if (closeIdx !== -1) {
      // Complete block
      const content = normalizedText.substring(openTagEnd + 1, closeIdx).trim();
      if (!fileList.includes(path)) fileList.push(path);
      files[path] = { path, content, type: 'file' };
      searchFrom = closeIdx + closeTag.length;
    } else {
      // Truncated: last FILE block has no closing tag - take everything after the opening tag
      const content = normalizedText.substring(openTagEnd + 1).trim();
      // Only include if there's meaningful content (at least a few chars)
      if (content.length > 10) {
        if (!fileList.includes(path)) fileList.push(path);
        files[path] = { path, content, type: 'file' };
      }
      break; // No more blocks possible after a truncated one
    }
  }

  // Parse DELETE blocks
  const deleteRe = /<delete\s+path=("|')([^"']+)\1\s*\/?>/gi;
  let deleteMatch: RegExpExecArray | null;
  while ((deleteMatch = deleteRe.exec(normalizedText)) !== null) {
    const path = normalizeBrowserProjectPath(deleteMatch[2] || '');
    if (isBrowserProjectFile(path) && !deletedFiles.includes(path)) {
      deletedFiles.push(path);
    }
  }

  // Parse ACTIONS block
  const actionsMatch = normalizedText.match(/<ACTIONS>([\s\S]*?)<\/ACTIONS>/i);
  if (actionsMatch) {
    const actionsText = actionsMatch[1];
    const actionLines = actionsText.split('\n').filter(l => l.trim().startsWith('{'));
    actionLines.forEach(line => {
      try {
        const action = JSON.parse(line.trim());
        if (action.name && action.action && (
          isBrowserProjectFile(String(action.name))
          || action.action === 'analyzed_image'
        )) {
          actionsTaken.push({
            name: action.name,
            status: action.status || 'done',
            action: action.action
          });
        }
      } catch { /* skip invalid lines */ }
    });
  }

  // Parse SUMMARY block
  const summaryMatch = normalizedText.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  if (fileList.length === 0 && deletedFiles.length === 0 && actionsTaken.length === 0) return null;
  return { files, fileList, deletedFiles, actionsTaken, summary };
}

/**
 * Attempts to fix truncated JSON by closing open structures
 */
function attemptJsonRepair(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // 1. Fix common unquoted keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // 1.1 Fix single-quoted keys and values
  // This is a simple heuristic and might fail on complex strings, but it's better than nothing
  repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // 1.2 Fix common malformed JSON like { , } or { "key": , }
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  repaired = repaired.replace(/{\s*,/g, '{');

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

  const truncationPatterns = [/\.\.\.$/, /\u2026$/, /\[truncated\]/i, /\[continued\]/i];
  return truncationPatterns.some(p => p.test(text));
}

/**
 * Extracts JSON from mixed responses (markdown/explanations + JSON).
 */
function extractJsonFromResponse(raw: string): any {
  let cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) {
    throw new Error('No JSON boundary found');
  }

  cleaned = cleaned.slice(jsonStart);

  let inString = false;
  let escaping = false;
  let braces = 0;
  let brackets = 0;
  let endIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

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
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '[') brackets++;
      if (ch === ']') brackets--;

      if (i > 0 && braces === 0 && brackets === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const candidate = endIdx !== -1 ? cleaned.slice(0, endIdx + 1) : cleaned;
  const attempts = [
    candidate,
    candidate
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ''),
    attemptJsonRepair(candidate),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // continue
    }
  }

  throw new Error('Could not parse extracted JSON');
}

function extractJsonFromMixedResponse(raw: string): any {
  try {
    return extractJsonFromResponse(raw);
  } catch {
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch?.[1]) {
      return extractJsonFromResponse(codeBlockMatch[1]);
    }

    const filesIdx = raw.search(/"files"\s*:/);
    if (filesIdx !== -1) {
      const objectStart = raw.lastIndexOf('{', filesIdx);
      if (objectStart !== -1) {
        return extractJsonFromResponse(raw.slice(objectStart));
      }
    }

    throw new Error('No parseable JSON found in mixed response');
  }
}

// Main parser with robust error handling
function parseSearchReplaceBlocks(
  response: string,
  currentFiles: Record<string, { content: string }> = {},
): { files: Record<string, any>; fileList: string[]; actionsTaken: FileActivity[] } {
  const files: Record<string, any> = {};
  const fileList: string[] = [];
  const actionsTaken: FileActivity[] = [];
  const patchRegex = /<PATCH\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/PATCH>/gi;
  const unwrap = (value: string) => value.replace(/^\r?\n/, '').replace(/\r?\n$/, '');
  let match: RegExpExecArray | null;

  while ((match = patchRegex.exec(response)) !== null) {
    const path = normalizeBrowserProjectPath(match[1] ?? match[2] ?? match[3] ?? '');
    if (!isBrowserProjectFile(path) || !currentFiles[path]) continue;
    const body = match[4] || '';
    const replacement = body.match(/<SEARCH>([\s\S]*?)<\/SEARCH>\s*<REPLACE>([\s\S]*?)<\/REPLACE>/i);
    if (!replacement) continue;

    const search = unwrap(replacement[1]);
    const replace = unwrap(replacement[2]);
    const baseContent = files[path]?.content ?? currentFiles[path].content;
    const searchIndex = baseContent.indexOf(search);
    if (!search || searchIndex === -1) continue;

    const content = baseContent.slice(0, searchIndex) + replace + baseContent.slice(searchIndex + search.length);
    files[path] = { path, content, type: 'file' };
    if (!fileList.includes(path)) {
      fileList.push(path);
      actionsTaken.push({ name: path, status: 'done', action: 'edited' });
    }
  }

  return { files, fileList, actionsTaken };
}

export function parseAIResponse(
  response: string,
  currentFiles: Record<string, { content: string }> = {},
): { files: Record<string, any>, fileList: string[], actionsTaken?: FileActivity[], deletedFiles?: string[], summary?: string } {
  try {
    // Handle "json|..." format from AI gateways
    if (response.startsWith('json|')) {
      const parts = response.split('|');
      if (parts.length > 1) {
        response = parts.slice(1).join('|');
      }
    }

    // Preferred for edits: apply compact exact SEARCH/REPLACE patches.
    const patches = parseSearchReplaceBlocks(response, currentFiles);

    // Preferred for initial generation and large edits: complete <FILE> blocks.
    const fileBlocks = parseFileBlocks(response);
    if (patches.fileList.length > 0 || (fileBlocks && (fileBlocks.fileList.length > 0 || fileBlocks.deletedFiles.length > 0 || fileBlocks.actionsTaken.length > 0))) {
      console.log('[parseAIResponse] Successfully parsed compact patches or <FILE> blocks');
      const completeFiles = fileBlocks?.files || {};
      const fileList = [...new Set([...(fileBlocks?.fileList || []), ...patches.fileList])];
      const actionsTaken = [...(fileBlocks?.actionsTaken || []), ...patches.actionsTaken]
        .filter((action, index, all) => all.findIndex(item => item.name === action.name && item.action === action.action) === index);
      return {
        files: { ...patches.files, ...completeFiles },
        fileList,
        deletedFiles: fileBlocks?.deletedFiles || [],
        actionsTaken,
        summary: fileBlocks?.summary,
      };
    }

    // Check for truncation (diagnostic only)
    if (detectTruncation(response)) {
      console.warn('[parseAIResponse] Response appears truncated, attempting resilient extraction...');
    }

    // Fallback #1: manual FILE extraction BEFORE JSON parsing
    const manualEarly = manualExtractFiles(response);
    if (manualEarly.fileList.length > 0) {
      console.log('[parseAIResponse] Successfully parsed using manualExtractFiles fallback');
      return { ...manualEarly, actionsTaken: [] };
    }

    // Fallback #2: markdown file extraction (### path + ```code``` patterns)
    const markdownEarly = extractMarkdownFileBlocks(response);
    if (markdownEarly.fileList.length > 0) {
      console.log('[parseAIResponse] Successfully parsed using extractMarkdownFileBlocks fallback');
      return { ...markdownEarly, actionsTaken: [] };
    }

    const fixKnownUnquotedKeys = (s: string) =>
      s
        .replace(/([{,]\s*)files\s*:/g, '$1"files":')
        .replace(/([{,]\s*)actions_taken\s*:/g, '$1"actions_taken":')
        .replace(/([{,]\s*)actionsTaken\s*:/g, '$1"actions_taken":');

    let parsed: any;

    // Step 1: robust mixed-response JSON extraction
    try {
      parsed = extractJsonFromMixedResponse(response);
    } catch {
      // Step 2: legacy sanitizer + repair chain
      let jsonStr: string;
      try {
        jsonStr = sanitizeJsonString(response);
      } catch (e) {
        console.error('[parseAIResponse] Failed to sanitize JSON:', e);
        return { files: {}, fileList: [] };
      }

      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.warn('[parseAIResponse] First parse failed, attempting repair...');
        const keyFixed = fixKnownUnquotedKeys(jsonStr);

        try {
          parsed = JSON.parse(keyFixed);
        } catch {
          try {
            const repaired = attemptJsonRepair(keyFixed);
            parsed = JSON.parse(repaired);
          } catch (secondError) {
            console.error('[parseAIResponse] JSON repair failed:', secondError);
            console.warn('[parseAIResponse] All JSON.parse attempts failed, using manual extraction fallback...');

            const manualResult = manualExtractFiles(response);
            if (manualResult.fileList.length > 0) {
              return { ...manualResult, actionsTaken: [] };
            }

            const markdownResult = extractMarkdownFileBlocks(response);
            if (markdownResult.fileList.length > 0) {
              return { ...markdownResult, actionsTaken: [] };
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
            const path = normalizeBrowserProjectPath(String(file.path));
            if (!isBrowserProjectFile(path)) return;
            fileList.push(path);
            files[path] = { path, content: file.content as string, type: 'file' };
          }
        });
      } else {
        Object.entries(parsed.files).forEach(([rawPath, content]) => {
          const path = normalizeBrowserProjectPath(rawPath);
          if (!isBrowserProjectFile(path)) return;
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

    // Successfully parsed files
    return { files, fileList, actionsTaken };
    
  } catch (e) {
    console.error('[parseAIResponse] Unexpected error:', e);
    return { files: {}, fileList: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 STREAMING (SSE) - DO NOT DROP PARTIAL LINES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SSEUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface AgentStepEvent {
  step: 'planning' | 'generating' | 'validating' | 'fixing' | 'streaming' | 'done' | 'error';
  message?: string;
  confidence?: number;
  issues_count?: number;
}

export async function readSSEStream(
  response: Response,
  onDelta?: (deltaText: string) => void,
  onAgentStep?: (event: AgentStepEvent) => void
): Promise<{ text: string; usage: SSEUsage | null }> {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let textBuffer = '';
  let fullResponse = '';
  let streamDone = false;
  let usage: SSEUsage | null = null;

  // Do not leave the editor spinning forever if an upstream stream opens but
  // stops producing data. The caller turns this into a retryable project error.
  const READ_TIMEOUT = 90_000;

  while (!streamDone) {
    const readPromise = reader.read();
    let readTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      readTimeoutId = setTimeout(() => reject(new Error('The AI response stopped. Please retry.')), READ_TIMEOUT);
    });

    let result: ReadableStreamReadResult<Uint8Array>;
    try {
      result = await Promise.race([readPromise, timeoutPromise]);
      if (readTimeoutId) clearTimeout(readTimeoutId);
    } catch (e) {
      if (readTimeoutId) clearTimeout(readTimeoutId);
      reader.cancel();
      throw e;
    }

    const { done, value } = result;
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

        // Handle agent step events (from the agent loop)
        if (parsed.step && onAgentStep) {
          onAgentStep(parsed as AgentStepEvent);
          continue;
        }

        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullResponse += content;
          onDelta?.(content);
        }
        if (parsed.usage) {
          usage = {
            prompt_tokens: parsed.usage.prompt_tokens,
            completion_tokens: parsed.usage.completion_tokens,
            total_tokens: parsed.usage.total_tokens,
          };
        }
      } catch (parseErr) {
        // JSON can be split across chunks; put it back and wait for more data
        // But only if it looks like incomplete JSON (starts with { or [)
        if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
        // Otherwise log and skip malformed lines
        console.warn('[readSSEStream] Failed to parse SSE line:', jsonStr.slice(0, 100), parseErr);
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
        if (parsed.step && onAgentStep) {
          onAgentStep(parsed as AgentStepEvent);
          continue;
        }
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullResponse += content;
          onDelta?.(content);
        }
        if (parsed.usage) {
          usage = {
            prompt_tokens: parsed.usage.prompt_tokens,
            completion_tokens: parsed.usage.completion_tokens,
            total_tokens: parsed.usage.total_tokens,
          };
        }
      } catch (parseErr) {
        // ignore partial leftovers, but log for debugging
        if (jsonStr.length > 0 && jsonStr.length < 500) {
          console.warn('[readSSEStream] Final flush parse error:', jsonStr.slice(0, 100), parseErr);
        }
      }
    }
  }

  return { text: fullResponse, usage };
}

// Generate suggestions after project completion
export async function generateSuggestions(projectDescription: string): Promise<Suggestion[]> {
  try {
    const msgs = [{ role: 'user', content: `Project description: ${projectDescription}. Generate 4 relevant feature suggestions.` }];
    const response = await callingDirectAI('suggestions', msgs);

    if (!response.ok) return [];

    const { text: fullResponse } = await readSSEStream(response);

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

    return [];
  } catch (error) {
    console.error('Suggestions generation error:', error);
    return [];
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

    const { text: fullResponse } = await readSSEStream(response);

    return fullResponse || "I'm here to help! What would you like to know about your project?";
  } catch (error) {
    console.error('Chat response error:', error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

// Generate explanation only (for chat display)
// Uses a generous timeout to support slow/thinking AI models
export async function generateExplanation(
  prompt: string,
  projectType: 'vite' | 'html',
  userLanguage?: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const controller = new AbortController();
  try {
    const msgs = [{ role: 'user', content: prompt }];
    const response = await callingDirectAI('explanation', msgs, controller.signal, undefined, userLanguage);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const streamPromise = readSSEStream(response, onChunk).then(r => r.text);
    const timeoutPromise = new Promise<string>((resolve) =>
      setTimeout(() => { controller.abort(); resolve(''); }, 30_000)
    );

    const fullResponse = await Promise.race([streamPromise, timeoutPromise]);

    return fullResponse || '';
  } catch (error) {
    console.error('Explanation generation error:', error);
    return '';
  }
}

// Stream code generation
export async function streamAICodeGeneration(
  messages: any[],
  projectType: 'vite' | 'html',
  options: {
    onChunk: (chunk: string) => void;
    onComplete: (fullResponse: string, usage?: SSEUsage | null) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
    onFileStart?: (fileName: string) => void;
    onStatusUpdate?: (status: string) => void;
    onAgentStep?: (event: AgentStepEvent) => void;
    signal?: AbortSignal;
    projectId?: string;
    generationKind?: 'initial' | 'edit';
  },
  existingFiles?: string,
  userLanguage?: string,
  colorTheme?: { name: string; colors: string[] } | null
) {
  try {
    let finalMessages = [...messages];
    if (existingFiles && finalMessages.length > 0) {
      const lastMsg = finalMessages[finalMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `${lastMsg.content}

EXISTING PROJECT FILES:
${existingFiles}
⚠️ CRITICAL EDITING RULES:
- This is an EXISTING project. For small fixes, output compact <PATCH> blocks instead of rewriting complete files.
- Patch format: <PATCH path="relative/file.js"><SEARCH>exact existing snippet</SEARCH><REPLACE>corrected snippet</REPLACE></PATCH>.
- SEARCH must match the supplied file exactly and include enough surrounding context to be unique. Use multiple PATCH blocks when needed.
- Use a complete <FILE> block only for a new file or when most of an existing file genuinely changes.
- Read the supplied current file contents before editing.
- Keep index.html as the entry point. Additional browser-native HTML, CSS, JavaScript, JSON, SVG, text, and Markdown files may be organized in folders.
- If the user asks to fix a bug, identify the EXACT file causing it and ONLY fix that file.
- If the user asks to add a feature, ONLY create/modify the files needed for that feature.
- NEVER touch files unrelated to the user's request.
- Never return read-only actions. A successful edit response must contain at least one valid PATCH, FILE, or DELETE block.`;
      }
    }

    const response = await callingDirectAI('code', finalMessages, options.signal, undefined, userLanguage, colorTheme, options.projectId, options.generationKind);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `AI request failed: ${response.status}`);
    }

    const { text: fullResponse, usage } = await readSSEStream(
      response,
      options.onChunk,
      (event) => {
        options.onAgentStep?.(event);
        if (event.message) {
          options.onStatusUpdate?.(event.message);
        }
      }
    );
    await options.onComplete(fullResponse, usage);
  } catch (error) {
    console.error('Code generation error:', error);
    if (options.onError) {
      await options.onError(error as Error);
    } else {
      await options.onComplete('');
    }
  }
}

// Stop generation (placeholder for now as fetch signal is used)
export function stopGeneration() {
  // Implementation handled via AbortController in calling components
}

// Clarify request - analyzes user message to determine intent
export interface ClarifyQuestion {
  question: string;
  options: string[];
}

export interface ClarifyResult {
  type: 'chat' | 'clarify' | 'build';
  questions?: ClarifyQuestion[];
}

export async function clarifyRequest(
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userLanguage?: string
): Promise<ClarifyResult> {
  try {
    const msgs = [
      ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const response = await callingDirectAI('clarify', msgs, undefined, undefined, userLanguage);
    if (!response.ok) return { type: 'build' }; // Default to build on error

    // Use readSSEStream to properly handle SSE format
    const { text: fullResponse } = await readSSEStream(response);
    
    // Parse JSON from response
    let result: ClarifyResult;
    if (typeof fullResponse === 'string' && fullResponse.trim()) {
      // Try to extract JSON object from the response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.error('Failed to parse clarify JSON:', parseErr);
          return { type: 'build' };
        }
      } else {
        console.warn('No JSON found in clarify response:', fullResponse.slice(0, 100));
        return { type: 'build' };
      }
    } else {
      console.warn('Empty clarify response');
      return { type: 'build' };
    }

    // Validate
    if (!result.type || !['chat', 'clarify', 'build'].includes(result.type)) {
      console.warn('Invalid clarify result type:', result.type);
      return { type: 'build' };
    }
    if (result.type === 'clarify' && (!result.questions || result.questions.length === 0)) {
      console.warn('Clarify type but no questions provided');
      return { type: 'build' };
    }

    return result;
  } catch (error) {
    console.error('Clarify request error:', error);
    return { type: 'build' }; // Default to build on any error
  }
}

export { deductPointsAfterGeneration };
