import type { ProjectFile } from '@/types';

// Abort controller for stopping generation
let currentAbortController: AbortController | null = null;

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string, metadata?: { creditsUsed: number }) => void;
  onError: (error: Error) => void;
  onFileStart?: (fileName: string) => void;
  onStatusUpdate?: (status: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Suggestion {
  label: string;
  prompt: string;
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
10. Do NOT use 'import.meta.env' or 'import.meta' (it causes errors)
11. Do NOT use 'react-hot-toast' (use 'sonner' instead)

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

// System prompt for generating a short project name (2 words)
const PROJECT_NAME_SYSTEM_PROMPT = `You are a creative naming assistant. Generate a SHORT, CATCHY 2-WORD project name based on the user's project description.

RULES:
1. Return ONLY 2 words separated by a space
2. The words should relate to the project theme
3. Make it catchy, memorable, and professional
4. No explanation, no extra text, just 2 words
5. Use Title Case (first letter of each word capitalized)

Examples:
- Restaurant Website → Gourmet Hub
- Portfolio Site → Creative Canvas
- Blog Platform → Story Flow
- E-commerce Store → Shop Swift
- Task Manager → Task Master
- Social Network → Connect Hub
- Fitness App → Fit Track
- Recipe App → Chef's Corner`;

// System prompt for generating suggestions
const SUGGESTIONS_SYSTEM_PROMPT = `You are a helpful assistant that generates feature suggestions for a project.

Based on the project description and current state, generate 4 useful suggestions that the user might want to add or improve.

RULES:
1. Return ONLY valid JSON array with 4 objects
2. Each object must have "label" (short display text, 2-4 words) and "prompt" (the full request to send)
3. Make suggestions relevant and actionable
4. Focus on common next steps users forget or might want

Response format (JSON only, no markdown):
[
  {"label": "Add Dark Mode", "prompt": "Add a dark mode toggle that saves preference to localStorage"},
  {"label": "Improve SEO", "prompt": "Add meta tags, Open Graph tags, and improve SEO optimization"},
  {"label": "Add Animations", "prompt": "Add smooth page transitions and micro-interactions using Framer Motion"},
  {"label": "Mobile Menu", "prompt": "Add a responsive mobile hamburger menu with smooth animations"}
]`;

// Generate short project name (2 words)
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
      // Generate fallback name from first 2 significant words
      const words = prompt.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 2) {
        return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return 'New Project';
    }

    if (!response.body) {
      return 'New Project';
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

    // Clean and return the 2-word name
    const cleaned = fullResponse.trim().replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return cleaned || 'New Project';
  } catch (error) {
    console.error('Project name generation error:', error);
    // Fallback: use first 2 words from prompt
    const words = prompt.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return 'New Project';
  }
}

// Generate suggestions after project completion
export async function generateSuggestions(projectDescription: string): Promise<Suggestion[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const defaultSuggestions: Suggestion[] = [
    { label: "Add Dark Mode", prompt: "Add a dark mode toggle that saves user preference" },
    { label: "Improve Mobile", prompt: "Improve the mobile responsiveness and add a hamburger menu" },
    { label: "Add Animations", prompt: "Add smooth animations and transitions using Framer Motion" },
    { label: "SEO Optimization", prompt: "Add meta tags and improve SEO for better search rankings" },
  ];

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Project description: ${projectDescription}. Generate 4 relevant feature suggestions.` }],
        projectType: 'vite',
        mode: 'suggestions',
      }),
    });

    if (!response.ok) {
      return defaultSuggestions;
    }

    if (!response.body) {
      return defaultSuggestions;
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

    // Try to parse the suggestions JSON
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
  existingFiles?: string[],
  modelId?: string
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
        existingFiles: existingFiles || [],
        modelId
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

    const creditsUsed = parseFloat(response.headers.get("x-rok-credits-used") || "0");

    callbacks.onStatusUpdate?.('Generation complete!');
    callbacks.onComplete(fullResponse, { creditsUsed });
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

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const language = match[1] || 'typescript';
    const path = match[2];
    const content = match[3].trim();
    
    if (path && content) {
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

  // Extract explanation text (everything before first code block or JSON)
  const firstCodeIndex = Math.min(
    response.indexOf('```') !== -1 ? response.indexOf('```') : response.length,
    response.indexOf('{"files"') !== -1 ? response.indexOf('{"files"') : response.length
  );
  if (firstCodeIndex > 0) {
    explanation = response.slice(0, firstCodeIndex).trim();
  }

  return { files, explanation, fileList };
}

// Helper function to get language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': return 'tsx';
    case 'ts': return 'typescript';
    case 'jsx': return 'jsx';
    case 'js': return 'javascript';
    case 'css': return 'css';
    case 'html': return 'html';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
}

// Generate default Vite project files
export function generateDefaultViteProject(): Record<string, ProjectFile> {
  const files: Record<string, ProjectFile> = {
    'package.json': {
      name: 'package.json',
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: "vite-react-app",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview"
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "framer-motion": "^10.16.4",
          "lucide-react": "^0.294.0",
          "sonner": "^1.4.0"
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "@vitejs/plugin-react": "^4.2.0",
          "autoprefixer": "^10.4.16",
          "postcss": "^8.4.31",
          "tailwindcss": "^3.3.5",
          "typescript": "^5.2.2",
          "vite": "^5.0.0"
        }
      }, null, 2)
    },
    'index.html': {
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    },
    'src/main.tsx': {
      name: 'main.tsx',
      path: 'src/main.tsx',
      language: 'tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
    },
    'src/App.tsx': {
      name: 'App.tsx',
      path: 'src/App.tsx',
      language: 'tsx',
      content: `import { motion } from 'framer-motion';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-4">Welcome to Rocket! 🚀</h1>
        <p className="text-xl text-blue-200">Start building something amazing</p>
      </motion.div>
    </div>
  )
}

export default App`
    },
    'src/index.css': {
      name: 'index.css',
      path: 'src/index.css',
      language: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
    },
    'tailwind.config.ts': {
      name: 'tailwind.config.ts',
      path: 'tailwind.config.ts',
      language: 'typescript',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
    },
    'vite.config.ts': {
      name: 'vite.config.ts',
      path: 'vite.config.ts',
      language: 'typescript',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
    },
    'tsconfig.json': {
      name: 'tsconfig.json',
      path: 'tsconfig.json',
      language: 'json',
      content: JSON.stringify({
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
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }]
      }, null, 2)
    }
  };

  return files;
}
