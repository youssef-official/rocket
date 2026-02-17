import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, RotateCcw, ExternalLink } from 'lucide-react';
import type { ProjectFile } from '@/types';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { toast } from 'sonner';

// URL of your deployed Modal Function. 
// For local dev, you might use something like:
// "https://<your-username>--rocket-preview-create-sandbox-dev.modal.run"
// TODO: Replace this with the actual URL or an environment variable
const MODAL_CREATE_URL = import.meta.env.VITE_MODAL_API_URL || "";

interface PreviewViewProps {
  files: Record<string, ProjectFile>;
  projectType: 'vite' | 'html';
  isLoading?: boolean;
  onPreviewError?: (errorLog: string) => void;
}

// Loading placeholder with rich animation - dark mode compatible
const LoadingPlaceholder: React.FC<{ status?: string }> = ({ status }) => {
  const tips = [
    "✨ Building your premium design...",
    "🎨 Applying elegant typography & colors...",
    "📱 Making it responsive for all devices...",
    "⚡ Adding smooth animations...",
    "🧩 Connecting all interactive elements...",
    "🚀 Almost there! Final touches..."
  ];
  const [tipIndex, setTipIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 95));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md px-6"
      >
        {/* Animated Logo */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-center opacity-50">
            <VivoraLogo size="lg" showText={false} className="justify-center" />
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 mx-auto mb-6 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Status */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-foreground text-base font-semibold mb-2"
        >
          {status || "Your preview will appear here"}
        </motion.p>

        {/* Rotating Tips with slide animation */}
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-muted-foreground text-sm"
            >
              {tips[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export const PreviewView: React.FC<PreviewViewProps> = ({ files, projectType, isLoading, onPreviewError }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<string>("Waiting for code...");
  const [isSandboxReady, setIsSandboxReady] = useState(false);

  // Ref to track if we've initialized the current set of files
  const initializedHash = useRef<string | null>(null);
  const lastSyncedHash = useRef<string | null>(null);

  // Generate a robust hash of all files for change detection
  const filesHash = React.useMemo(() => {
    let hash = 0;
    const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [path, file] of entries) {
      const content = file?.content || '';
      // Hash full content for accurate change detection
      const sample = `${path}:${content.length}:${content}`;
      for (let i = 0; i < sample.length; i++) {
        const char = sample.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
    }

    return hash.toString(36);
  }, [files]);

  const [key, setKey] = React.useState(0);

  // Prepare files for the sandbox
  const sandboxFiles = useMemo(() => {
    const spFiles: Record<string, string> = {};

    Object.entries(files).forEach(([path, file]) => {
      const sandboxPath = path.startsWith('/') ? path : `/${path}`;
      spFiles[sandboxPath] = file.content;
    });

    if (projectType === 'vite') {
      // 1. Check where App exists
      const hasRootApp = !!spFiles['/App.tsx'];
      const hasSrcApp = !!spFiles['/src/App.tsx'];
      const hasAnyApp = hasRootApp || hasSrcApp;

      // 2. Ensure index.html exists
      if (!spFiles['/index.html']) {
        const scriptSrc = hasSrcApp ? '/src/main.tsx' : '/main.tsx';
        spFiles['/index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${scriptSrc}"></script>
  </body>
</html>`;
      }

      // 3. Ensure App exists if missing (fallback)
      if (!hasAnyApp) {
        // Create a root App.tsx if neither exists
        spFiles['/App.tsx'] = `export default function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Ready</h1>
        <p className="text-gray-400 text-lg">Your preview is ready</p>
      </div>
    </div>
  );
}`;
      }

      // 4. Ensure main.tsx exists
      // We look for any existing main entry
      const hasMain = spFiles['/main.tsx'] || spFiles['/src/main.tsx'] || spFiles['/index.tsx'] || spFiles['/src/index.tsx'];

      if (!hasMain) {
        if (hasSrcApp) {
          spFiles['/src/main.tsx'] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);`;
        } else {
          spFiles['/main.tsx'] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);`;
        }
      }

      if (!spFiles['/index.css'] && !spFiles['/src/index.css']) {
        const cssPath = hasSrcApp ? '/src/index.css' : '/index.css';
        spFiles[cssPath] = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
      }

      // Generate package.json if strictly needed by the server
      spFiles['/package.json'] = JSON.stringify({
        "name": "preview-app",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "latest",
          "framer-motion": "latest",
          "clsx": "latest",
          "tailwind-merge": "latest"
        },
        "devDependencies": {
          "@types/react": "^18.2.66",
          "@types/react-dom": "^18.2.22",
          "@vitejs/plugin-react": "^4.2.1",
          "vite": "^5.2.0",
          "tailwindcss": "^3.4.3",
          "postcss": "^8.4.38",
          "autoprefixer": "^10.4.19"
        }
      }, null, 2);

      // Add vite config
      // Inject allowedHosts: true to bypass Modal/Vite tunnel host checks
      spFiles['/vite.config.ts'] = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '::',
    allowedHosts: true
  }
})`
    }

    return spFiles;
  }, [files, projectType]);

  // Create Sandbox Logic
  useEffect(() => {
    const createSandbox = async () => {
      // Don't create if already exists or invalid URL
      if (sandboxId) return;

      if (!MODAL_CREATE_URL) {
        setSandboxStatus("Please configure MODAL_CREATE_URL in PreviewView.tsx or .env");
        return;
      }

      try {
        setSandboxStatus("Booting Modal Sandbox...");
        const response = await fetch(MODAL_CREATE_URL, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to create sandbox');

        const data = await response.json();
        const { sandbox_id, api_url, preview_url } = data;

        setSandboxId(sandbox_id);
        setApiUrl(api_url);
        setPreviewUrl(preview_url);
        setSandboxStatus("Sandbox created. Initializing...");
      } catch (error) {
        console.error("Error creating sandbox:", error);
        setSandboxStatus("Error creating sandbox. Check console.");
        toast.error("Failed to create Modal sandbox");
      }
    };

    if (Object.keys(files).length > 0) {
      createSandbox();
    }
  }, [sandboxId, files, projectType]);

  // Sync Files Logic - with better change detection
  useEffect(() => {
    const syncFiles = async () => {
      if (!apiUrl || !sandboxFiles) return;
      
      // Skip if hash unchanged
      if (lastSyncedHash.current === filesHash) return;

      try {
        const isFirstInit = !isSandboxReady;
        setSandboxStatus(isFirstInit ? "Installing dependencies & Starting..." : "Updating files...");

        const endpoint = isFirstInit ? '/init' : '/update';
        console.log(`[Preview] Syncing ${Object.keys(sandboxFiles).length} files to ${endpoint}, hash: ${filesHash}`);

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: sandboxFiles })
        });

        if (!response.ok) throw new Error("Failed to sync files");

        initializedHash.current = filesHash;
        lastSyncedHash.current = filesHash;

        if (isFirstInit) {
          setTimeout(() => {
            setIsSandboxReady(true);
            setSandboxStatus("Ready");
            // Force refresh iframe
            setKey(k => k + 1);
          }, 6000);
        } else {
          setSandboxStatus("Ready");
          // Refresh iframe on updates
          setKey(k => k + 1);
        }

      } catch (error) {
        console.error("Sync error:", error);
        setSandboxStatus("Error syncing files");
      }
    };

    // Debounce slightly for batch updates
    const timer = setTimeout(syncFiles, 500);
    return () => clearTimeout(timer);
  }, [apiUrl, sandboxFiles, filesHash, isSandboxReady]);

  // Listen for errors from the preview iframe via postMessage
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const errorSentRef = useRef(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-error' && event.data?.message) {
        const errMsg = event.data.message;
        setPreviewErrors(prev => {
          const next = [...prev, errMsg];
          // Auto-send first batch of errors to AI after 3 seconds of collecting
          if (!errorSentRef.current && onPreviewError && next.length >= 1) {
            errorSentRef.current = true;
            setTimeout(() => {
              if (onPreviewError) {
                onPreviewError(`Preview console errors detected:\n${next.join('\n')}`);
              }
            }, 3000);
          }
          return next;
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPreviewError]);

  // Reset error tracking when files change
  useEffect(() => {
    errorSentRef.current = false;
    setPreviewErrors([]);
  }, [filesHash]);

  const refresh = () => setKey(k => k + 1);

  // Show loading placeholder
  if (isLoading || (sandboxId && !isSandboxReady)) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div className="text-sm font-mono text-muted-foreground">{sandboxStatus}</div>
        </div>
        <div className="flex-1">
          <LoadingPlaceholder status={sandboxStatus} />
        </div>
      </div>
    );
  }

  // Preview Frame
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">

          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2 font-mono flex items-center">
            {sandboxId ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Modal Sandbox Active
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                Initializing...
              </>
            )}
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            title="Refresh preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => previewUrl && window.open(previewUrl, '_blank')}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            title="Open in new tab"
            disabled={!previewUrl}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-hidden bg-muted relative">
        {!previewUrl || !isSandboxReady ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingPlaceholder status={sandboxStatus} />
          </div>
        ) : (
          <div className={`h-full w-full flex justify-center ${viewMode === 'mobile' ? 'bg-muted py-4 items-center' : 'bg-background'}`}>
            <motion.iframe
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={previewUrl}
              className={`bg-background shadow-xl ${viewMode === 'mobile'
                ? 'w-[375px] h-[667px] rounded-xl border-4 border-border'
                : 'w-full h-full border-none'
                }`}
              title="Modal Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};
