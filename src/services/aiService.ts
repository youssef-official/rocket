import { callingDirectAI } from './directAiService';

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

    const parsed = JSON.parse(jsonStr);

    const files: Record<string, any> = {};
    let fileList: string[] = [];

    if (parsed.files) {
      fileList = Object.keys(parsed.files);
      Object.entries(parsed.files).forEach(([path, content]) => {
        files[path] = {
          path,
          content: content as string,
          type: 'file'
        };
      });
    }
    return { files, fileList };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { files: {}, fileList: [] };
  }
}

// Generate default project
export function generateDefaultViteProject(): any[] {
  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        "name": "vite-react-project",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "lint": "eslint .",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.344.0",
          "clsx": "^2.1.0",
          "tailwind-merge": "^2.2.1",
          "framer-motion": "^11.0.8"
        },
        "devDependencies": {
          "@types/react": "^18.2.66",
          "@types/react-dom": "^18.2.22",
          "@vitejs/plugin-react": "^4.2.1",
          "autoprefixer": "^10.4.18",
          "postcss": "^8.4.35",
          "tailwindcss": "^3.4.1",
          "typescript": "^5.2.2",
          "vite": "^5.2.0"
        }
      }, null, 2),
      type: 'file'
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      type: 'file'
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      type: 'file'
    },
    {
      path: 'src/main.tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      type: 'file'
    },
    {
      path: 'src/App.tsx',
      content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Vite + React
      </h1>
      <div className="card p-8 bg-slate-900 rounded-xl border border-slate-800">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
        >
          count is {count}
        </button>
        <p className="mt-4 text-slate-400">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App`,
      type: 'file'
    },
    {
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}`,
      type: 'file'
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "baseUrl": ".",
          "paths": { "@/*": ["./src/*"] }
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
      }, null, 2),
      type: 'file'
    }
  ];
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
            const parsed = JSON.parse(jsonStr);
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
