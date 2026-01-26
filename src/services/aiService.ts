import type { ProjectFile } from '@/types';

// Abort controller for stopping generation
let currentAbortController: AbortController | null = null;

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
  onFileStart?: (fileName: string) => void;
  onStatusUpdate?: (status: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Enhanced system prompt for PREMIUM, PROFESSIONAL designs
const ENHANCED_SYSTEM_PROMPT = `You are an ELITE web developer and UI/UX designer creating STUNNING, PROFESSIONAL applications.

## 🎨 DESIGN EXCELLENCE STANDARDS

### Visual Design (CRITICAL)
- Create interfaces that look like they cost $100,000+ to build
- Use sophisticated, harmonious color palettes with PERFECT contrast
- Implement smooth, delightful micro-interactions and animations with Framer Motion
- Apply generous whitespace and CAREFUL spacing for elegant layouts
- Use gradients, shadows, and depth for a PREMIUM feel
- Design mobile-first, responsive across ALL devices

### Typography Hierarchy
- Headlines: Large, bold, impactful (text-4xl to text-7xl)
- Subheadings: Clear, medium weight (text-xl to text-2xl)  
- Body: Readable, comfortable (text-base to text-lg)
- Use proper line height and letter spacing

### Component Quality
- Build REUSABLE, well-structured React components
- Use semantic HTML elements (header, main, section, article, nav, footer)
- Implement proper accessibility (ARIA labels, keyboard navigation)
- Add hover states, focus states, and smooth transitions

### Modern Patterns
- Hero sections with compelling CTAs and animations
- Feature grids with icons and descriptions
- Testimonial carousels or cards
- Pricing tables with highlighted plans
- Contact forms with validation
- Footer with links and social icons

## 🛠 TECH STACK (Vite + React + TypeScript)

**IMPORTANT FILE ORDER:**
1. FIRST generate: src/index.css (with Tailwind and CSS variables)
2. SECOND generate: tailwind.config.ts
3. THEN generate all other files in order:
   - package.json
   - vite.config.ts
   - tsconfig.json
   - index.html
   - src/main.tsx
   - src/App.tsx
   - src/components/* (create MULTIPLE component files)
   - Additional pages and utilities

## 📦 RESPONSE FORMAT
You MUST respond with valid JSON in this EXACT structure:
{
  "files": {
    "src/index.css": "/* CSS content */",
    "tailwind.config.ts": "// config content",
    "package.json": "{ package content }",
    "src/App.tsx": "// React component"
  }
}

## ⚠️ CRITICAL RULES
1. Generate COMPLETE, RUNNABLE code - NO placeholders, NO TODOs
2. Include ALL imports and dependencies
3. Use Tailwind CSS for ALL styling with CSS variables
4. Add Framer Motion animations for smooth UX
5. Use Lucide React icons consistently
6. Implement RESPONSIVE design (sm:, md:, lg:, xl:)
7. Create MULTIPLE PAGES and COMPONENTS for large projects
8. Generate AT LEAST 10-15 files for complex projects
9. Make the UI VISUALLY STUNNING - this is the #1 priority

CREATE SOMETHING EXCEPTIONAL!`;

// System prompt for step-by-step status updates
const STATUS_SYSTEM_PROMPT = `You are a helpful assistant that provides brief, one-line status updates.

When asked, respond with ONLY a short status message (max 8 words) describing what's being done.

Examples:
- "Creating the design system..."
- "Building the navigation components..."
- "Setting up the page layouts..."
- "Adding animations and interactions..."
- "Configuring the project structure..."

RULES:
- Response should be ONE short sentence only
- No code, no JSON, no markdown
- Keep it friendly and professional
- Max 8 words`;

// System prompt for explanation only (no code)
const EXPLANATION_SYSTEM_PROMPT = `You are a helpful AI assistant that explains project plans clearly and concisely.

When a user asks you to build something:
1. Start with a friendly acknowledgment (1 sentence)
2. List 4-6 key features you'll create (bullet points with •)
3. End with "Now I'll start building..."

IMPORTANT RULES:
- Do NOT include any code, JSON, or technical file contents
- Do NOT use markdown code blocks
- Keep the response SHORT (max 100 words)
- Focus on WHAT you'll build, not HOW
- Use simple, friendly language

Example response:
"I'll create a stunning restaurant website for you! 🍽️

Here's what I'm building:
• Eye-catching hero with food photography
• Interactive menu with categories and filters
• Reservation booking system
• Customer reviews section
• Contact information and location map
• Responsive design for all devices

Now I'll start building..."`;

// System prompt for generating a short project name
const PROJECT_NAME_SYSTEM_PROMPT = `You are a creative naming assistant. Generate a SHORT, CATCHY 2-letter project code/name based on the user's project description.

RULES:
1. Return ONLY 2 uppercase letters
2. The letters should relate to the project (e.g., "RW" for Restaurant Website, "EC" for E-commerce)
3. No explanation, no extra text, just 2 letters
4. Make it memorable and relevant

Examples:
- Restaurant Website → RW
- Portfolio Site → PS
- Blog Platform → BP
- E-commerce Store → ES
- Task Manager → TM
- Social Network → SN`;

// Generate short project name (2 letters)
export async function generateProjectName(prompt: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Project: ${prompt}` }],
        projectType: 'vite',
        mode: 'project-name',
      }),
    });

    if (!response.ok) {
      // Generate fallback name from first letters of words
      const words = prompt.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return prompt.slice(0, 2).toUpperCase();
    }

    if (!response.body) {
      return prompt.slice(0, 2).toUpperCase();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Extract only letters and return first 2 uppercase
    const letters = fullResponse.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return letters.slice(0, 2) || prompt.slice(0, 2).toUpperCase();
  } catch (error) {
    console.error('Project name generation error:', error);
    // Fallback: use first letters of words
    const words = prompt.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return prompt.slice(0, 2).toUpperCase();
  }
}

// Chat-only response (no code generation)
export async function generateChatResponse(
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [
          ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: prompt }
        ],
        projectType: 'vite',
        mode: 'chat',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate chat response: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        projectType,
        mode: 'explanation',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate explanation: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    return fullResponse || "I'll create something amazing for you!";
  } catch (error) {
    console.error('Explanation generation error:', error);
    return "I'm working on your project now...";
  }
}

// Generate status update
export async function generateStatusUpdate(
  currentStep: string
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Current step: ${currentStep}. Give a brief status.` }],
        projectType: 'vite',
        mode: 'status',
      }),
    });

    if (!response.ok) {
      return currentStep;
    }

    if (!response.body) {
      return currentStep;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    return fullResponse || currentStep;
  } catch {
    return currentStep;
  }
}

// Stop generation
export function stopGeneration(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

// Stream AI code generation
export async function streamAICodeGeneration(
  messages: ChatMessage[],
  projectType: 'vite' | 'html',
  callbacks: StreamCallbacks,
  existingFiles?: string[]
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Create new abort controller
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  try {
    callbacks.onStatusUpdate?.('Setting up project structure...');

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ 
        messages, 
        projectType, 
        mode: 'code',
        existingFiles: existingFiles || []
      }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (response.status === 402) {
        throw new Error('Credits exhausted. Please add more credits.');
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';
    let currentFileName = '';
    let fileCount = 0;

    // Status messages that rotate
    const statusMessages = [
      'Setting up project structure...',
      'Creating design system...',
      'Building components...',
      'Adding styles and animations...',
      'Generating pages...',
      'Finalizing the build...',
    ];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
            callbacks.onChunk(content);

            // Detect file being generated by matching file paths
            const filePatterns = [
              /"(src\/[^"]+\.(tsx?|jsx?|css))"/,
              /"(tailwind\.config\.ts)"/,
              /"(package\.json)"/,
              /"(vite\.config\.ts)"/,
              /"(tsconfig\.json)"/,
              /"(index\.html)"/,
            ];

            for (const pattern of filePatterns) {
              const fileMatch = content.match(pattern);
              if (fileMatch && fileMatch[1] !== currentFileName) {
                currentFileName = fileMatch[1];
                fileCount++;
                callbacks.onFileStart?.(currentFileName);
                
                // Update status periodically
                const statusIndex = Math.min(fileCount - 1, statusMessages.length - 1);
                callbacks.onStatusUpdate?.(statusMessages[statusIndex]);
              }
            }
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    callbacks.onStatusUpdate?.('Generation complete!');
    callbacks.onComplete(fullResponse);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      callbacks.onError(new Error('Generation stopped by user.'));
    } else {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  } finally {
    currentAbortController = null;
  }
}

// Parse AI response to extract files
export function parseAIResponse(response: string): { 
  files: Record<string, ProjectFile>; 
  explanation: string;
  fileList: string[];
} {
  let files: Record<string, ProjectFile> = {};
  let explanation = '';
  const fileList: string[] = [];

  // Clean the response - remove non-JSON prefix
  let cleanedResponse = response.trim();
  
  // Find the start of JSON object
  const jsonStartIndex = cleanedResponse.indexOf('{');
  if (jsonStartIndex > 0) {
    cleanedResponse = cleanedResponse.slice(jsonStartIndex);
  }

  // PRIORITY 1: Try to extract JSON from ```json blocks
  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      if (parsed.files && typeof parsed.files === 'object') {
        for (const [path, content] of Object.entries(parsed.files)) {
          if (typeof content === 'string' && path.includes('.')) {
            const name = path.split('/').pop() || path;
            files[path] = {
              name,
              path,
              content: content as string,
              language: getLanguageFromPath(path),
            };
            fileList.push(path);
          }
        }
        if (fileList.length > 0) {
          explanation = parsed.explanation || '';
          return { files, explanation, fileList };
        }
      }
    } catch (e) {
      console.error('Failed to parse JSON block:', e);
    }
  }

  // PRIORITY 2: Try direct JSON parse (full response is JSON)
  try {
    // Try to fix incomplete JSON by finding the last complete file entry
    let jsonToParse = cleanedResponse;
    
    // Try parsing as-is first
    const parsed = JSON.parse(jsonToParse);
    if (parsed.files && typeof parsed.files === 'object') {
      for (const [path, content] of Object.entries(parsed.files)) {
        if (typeof content === 'string' && path.includes('.')) {
          const name = path.split('/').pop() || path;
          files[path] = {
            name,
            path,
            content: content as string,
            language: getLanguageFromPath(path),
          };
          fileList.push(path);
        }
      }
      if (fileList.length > 0) {
        explanation = parsed.explanation || '';
        return { files, explanation, fileList };
      }
    }
  } catch {
    // Try to extract files using regex from partial JSON
    const fileExtractRegex = /"((?:src\/)?[a-zA-Z0-9_\-./]+\.(?:tsx?|jsx?|css|html|json|ts))":\s*"((?:[^"\\]|\\.)*)"/g;
    let fileMatch;
    
    while ((fileMatch = fileExtractRegex.exec(cleanedResponse)) !== null) {
      const path = fileMatch[1];
      // Decode escaped content
      let content = fileMatch[2]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      
      if (path && content && !path.startsWith('file-')) {
        const name = path.split('/').pop() || path;
        files[path] = {
          name,
          path,
          content,
          language: getLanguageFromPath(path),
        };
        fileList.push(path);
      }
    }
    
    if (fileList.length > 0) {
      return { files, explanation: '', fileList };
    }
  }

  // PRIORITY 3: Extract code blocks with explicit file paths (```tsx // src/App.tsx)
  const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*)?(\S+\.\w+)\n([\s\S]*?)```/g;
  let match;
  const codeRanges: { start: number; end: number }[] = [];
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const path = match[2];
    const content = match[3];
    
    // Only accept valid file paths, not generic file-N names
    if (path && !path.startsWith('file-') && path.includes('.')) {
      const name = path.split('/').pop() || path;
      const language = match[1] || getLanguageFromPath(path);
      
      files[path] = { name, path, content, language };
      fileList.push(path);
      codeRanges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  // Extract explanation from non-code text
  if (codeRanges.length > 0) {
    const explanationParts: string[] = [];
    let lastEnd = 0;
    for (const range of codeRanges) {
      if (range.start > lastEnd) {
        explanationParts.push(response.slice(lastEnd, range.start));
      }
      lastEnd = range.end;
    }
    if (lastEnd < response.length) {
      explanationParts.push(response.slice(lastEnd));
    }
    explanation = explanationParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // If still no files, try one more pattern for JSON-like content
  if (fileList.length === 0 && cleanedResponse.includes('"files"')) {
    // Last resort: extract any valid file content we can find
    const simpleFileMatch = cleanedResponse.match(/"files"\s*:\s*\{([\s\S]*)\}/);
    if (simpleFileMatch) {
      const fileContent = simpleFileMatch[1];
      const pathMatches = fileContent.matchAll(/"([^"]+\.[a-z]+)":\s*"((?:[^"\\]|\\.)*)"/gi);
      
      for (const pm of pathMatches) {
        const path = pm[1];
        let content = pm[2]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        if (!path.startsWith('file-')) {
          const name = path.split('/').pop() || path;
          files[path] = {
            name,
            path,
            content,
            language: getLanguageFromPath(path),
          };
          fileList.push(path);
        }
      }
    }
  }

  return { files, explanation, fileList };
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    js: 'javascript',
    css: 'css',
    html: 'html',
    json: 'json',
    md: 'markdown',
  };
  return langMap[ext || ''] || 'plaintext';
}

// Generate a default Vite project structure
export function generateDefaultViteProject(projectName: string): Record<string, ProjectFile> {
  const files: Record<string, ProjectFile> = {};
  
  const addFile = (path: string, content: string) => {
    const name = path.split('/').pop() || path;
    files[path] = {
      name,
      path,
      content,
      language: getLanguageFromPath(path),
    };
  };

  // IMPORTANT: Generate index.css FIRST
  addFile('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --ring: 224 76% 48%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}`);

  // Generate tailwind.config.ts SECOND
  addFile('tailwind.config.ts', `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}`);

  addFile('package.json', JSON.stringify({
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "framer-motion": "^10.16.4",
      "lucide-react": "^0.284.0"
    },
    devDependencies: {
      "@types/react": "^18.3.5",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.31",
      "tailwindcss": "^3.3.3",
      typescript: "^5.5.4",
      vite: "^5.4.2"
    }
  }, null, 2));

  addFile('vite.config.ts', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);

  addFile('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"]
  }, null, 2));

  addFile('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

  addFile('src/main.tsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

  addFile('src/App.tsx', `function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">${projectName}</h1>
        <p className="text-muted-foreground">Edit src/App.tsx to get started</p>
      </div>
    </div>
  )
}

export default App`);

  return files;
}

// Export the prompts for edge function use
export { ENHANCED_SYSTEM_PROMPT, EXPLANATION_SYSTEM_PROMPT, STATUS_SYSTEM_PROMPT };
