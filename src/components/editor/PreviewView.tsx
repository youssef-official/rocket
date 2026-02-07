import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
}

// Loading placeholder with animation
const LoadingPlaceholder: React.FC<{ status?: string }> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <div className="flex items-center justify-center opacity-40">
            <VivoraLogo size="lg" showText={false} className="justify-center" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg font-medium"
        >
          {status || "Your preview will appear here"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 rounded-full bg-primary/40"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 rounded-full bg-primary/40"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 rounded-full bg-primary/40"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export const PreviewView: React.FC<PreviewViewProps> = ({ files, projectType, isLoading }) => {
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


  const refresh = () => setKey(k => k + 1);

  // Show loading placeholder
  if (isLoading || (sandboxId && !isSandboxReady)) {
    return (
      <div className={`flex flex-col h-full bg-white`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-mono text-gray-500">{sandboxStatus}</div>
        </div>
        <div className="flex-1">
          <LoadingPlaceholder status={sandboxStatus} />
        </div>
      </div>
    );
  }

  // Preview Frame
  return (
    <div className={`flex flex-col h-full bg-white`}>
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
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                Modal Sandbox Active
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
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
      <div className="flex-1 overflow-hidden bg-gray-100 relative">
        {!previewUrl || !isSandboxReady ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingPlaceholder status={sandboxStatus} />
          </div>
        ) : (
          <div className={`h-full w-full flex justify-center ${viewMode === 'mobile' ? 'bg-gray-200 py-4 items-center' : 'bg-white'}`}>
            <motion.iframe
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={previewUrl}
              className={`bg-white shadow-xl ${viewMode === 'mobile'
                ? 'w-[375px] h-[667px] rounded-xl border-4 border-gray-800'
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
