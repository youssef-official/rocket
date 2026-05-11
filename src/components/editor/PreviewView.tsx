import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, RotateCcw, ExternalLink } from 'lucide-react';
import type { ProjectFile } from '@/types';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { toast } from 'sonner';

// Use the edge function proxy to avoid CORS issues with Modal
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const MODAL_PROXY_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/modal-proxy` : "";

interface PreviewViewProps {
  files: Record<string, ProjectFile>;
  projectType: 'vite' | 'html';
  isLoading?: boolean;
  onPreviewError?: (errorLog: string) => void;
  onPreviewUrlChange?: (url: string | null) => void;
  projectId?: string;
}

// Loading placeholder with rich animation
const LoadingPlaceholder: React.FC<{ status?: string }> = ({ status }) => {
  const tips = [
    "Building your premium design...",
    "Applying elegant typography & colors...",
    "Making it responsive for all devices...",
    "Adding smooth animations...",
    "Connecting all interactive elements...",
    "Almost there! Final touches..."
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
    <div className="flex flex-col items-center justify-center h-full bg-editor-bg overflow-auto">
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
          className="mb-6"
        >
          <div className="flex items-center justify-center opacity-50">
            <VivoraLogo size="lg" showText={false} className="justify-center" />
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 mx-auto mb-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Status */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground text-sm font-semibold mb-1">
          {status || "Your preview will appear here"}
        </motion.p>

        {/* Rotating Tips */}
        <div className="h-5 overflow-hidden mb-4">
          <AnimatePresence mode="wait">
            <motion.p key={tipIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }} className="text-muted-foreground text-xs">
              {tips[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i} animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-primary" />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export const PreviewView: React.FC<PreviewViewProps> = ({ files, projectType, isLoading, onPreviewError, onPreviewUrlChange, projectId }) => {
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
  // Check if watermark should be removed
  const watermarkRemoved = projectId ? localStorage.getItem(`project_watermark_${projectId}`) === 'removed' : false;

  const sandboxFiles = useMemo(() => {
    const spFiles: Record<string, string> = {};

    Object.entries(files).forEach(([path, file]) => {
      const sandboxPath = path.startsWith('/') ? path : `/${path}`;
      let content = file.content;
      // Strip branding.js script if watermark is removed
      if (watermarkRemoved && (sandboxPath === '/index.html' || sandboxPath === '/public/index.html')) {
        content = content.replace(/<script[^>]*branding\.js[^>]*><\/script>/gi, '');
        content = content.replace(/<script[^>]*branding\.js[^>]*\/>/gi, '');
        content = content.replace(/<script[^>]*branding\.js[^>]*>[^<]*<\/script>/gi, '');
      }
      spFiles[sandboxPath] = content;
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

      // Parse AI generated dependencies if a package.json was provided
      let customDeps: Record<string, string> = {};
      try {
        if (spFiles['/package.json']) {
          const customPkg = JSON.parse(spFiles['/package.json']);
          if (customPkg.dependencies) {
            customDeps = { ...customPkg.dependencies };
          }
        }
      } catch (e) {
        console.warn('Failed to parse AI package.json dependencies, falling back to base.', e);
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
          "tailwind-merge": "latest",
          "@clerk/clerk-react": "latest",
          "react-router-dom": "latest",
          ...customDeps
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
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true
  }
})`
    }

    // Inject analytics tracking script into index.html
    if (projectId && spFiles['/index.html']) {
      const analyticsSrc = `<script>window.__vivorax_project_id="${projectId}";window.__vivorax_api_base="${SUPABASE_URL}";window.__vivorax_anon_key="${SUPABASE_ANON_KEY}";(function(){if(window.__vxa)return;window.__vxa=true;var SK="vx_s",FK="vx_fq",PID=window.__vivorax_project_id,API=window.__vivorax_api_base,AKEY=window.__vivorax_anon_key;function uid(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==="x"?r:(r&3)|8).toString(16)})}function gs(){var s=sessionStorage.getItem(SK);if(s)return JSON.parse(s);var o={id:uid(),start:Date.now(),pages:[],device:/Mobi|Android/i.test(navigator.userAgent)?"mobile":"desktop",country:Intl.DateTimeFormat().resolvedOptions().timeZone||"unknown",referrer:document.referrer||"direct",sw:screen.width,sh:screen.height};sessionStorage.setItem(SK,JSON.stringify(o));return o}function ss(o){sessionStorage.setItem(SK,JSON.stringify(o))}function qe(e){try{var q=JSON.parse(localStorage.getItem(FK)||"[]");q.push(e);if(q.length>200)q=q.slice(-200);localStorage.setItem(FK,JSON.stringify(q))}catch(x){}}function flush(){if(!PID||!API)return;var r=localStorage.getItem(FK);if(!r)return;var ev;try{ev=JSON.parse(r)}catch(x){return}if(!ev||!ev.length)return;localStorage.removeItem(FK);var url=API+"/functions/v1/track-analytics";var p=JSON.stringify({project_id:PID,events:ev});fetch(url,{method:"POST",headers:{"Content-Type":"application/json","apikey":AKEY||""},body:p,keepalive:true}).catch(function(){try{var existing=JSON.parse(localStorage.getItem(FK)||"[]");localStorage.setItem(FK,JSON.stringify(existing.concat(ev)))}catch(x){}})}function tv(){var s=gs();s.pages.push({path:location.pathname,time:Date.now()});ss(s);qe({session_id:s.id,event_type:"pageview",path:location.pathname,device:s.device,referrer:s.referrer,country:s.country,screen_w:s.sw,screen_h:s.sh})}function fin(){var s=gs();qe({session_id:s.id,event_type:"session_end",path:location.pathname,device:s.device,referrer:s.referrer,country:s.country,screen_w:s.sw,screen_h:s.sh,duration:Math.round((Date.now()-s.start)/1000),pages_count:s.pages.length});flush()}tv();var lp=location.pathname;setInterval(function(){if(location.pathname!==lp){lp=location.pathname;tv()}},500);setInterval(flush,15000);addEventListener("beforeunload",fin)})();</script>`;
      spFiles['/index.html'] = spFiles['/index.html'].replace('</head>', analyticsSrc + '\n</head>');
    }

    return spFiles;
  }, [files, projectType, watermarkRemoved, projectId]);

  // Create Sandbox Logic
  useEffect(() => {
    const createSandbox = async () => {
      // Don't create if already exists or invalid URL
      if (sandboxId) return;

      if (!MODAL_PROXY_URL) {
        setSandboxStatus("Backend proxy not configured");
        return;
      }

      try {
        setSandboxStatus("Booting Modal Sandbox...");
        const response = await fetch(MODAL_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
        });

        if (!response.ok) throw new Error('Failed to create sandbox');

        const data = await response.json();
        const { sandbox_id, api_url, preview_url } = data;

        setSandboxId(sandbox_id);
        setApiUrl(api_url);
        setPreviewUrl(preview_url);
        onPreviewUrlChange?.(preview_url);
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
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Auto-restart on errors, 404, or timeout
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (sandboxStatus.toLowerCase().includes("error") || sandboxStatus.toLowerCase().includes("timeout")) {
          setSandboxId(null);
          setIsSandboxReady(false);
          initializedHash.current = null;
          lastSyncedHash.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sandboxStatus]);

  // Auto-recover: if sandbox stays in error/timeout for 8s, auto-restart
  useEffect(() => {
    if (sandboxStatus.toLowerCase().includes("error") || sandboxStatus.toLowerCase().includes("timeout")) {
      if (retryCountRef.current >= maxRetries) return;
      const timer = setTimeout(() => {
        retryCountRef.current += 1;
        console.log(`[Preview] Auto-restarting sandbox (attempt ${retryCountRef.current}/${maxRetries})`);
        setSandboxId(null);
        setIsSandboxReady(false);
        initializedHash.current = null;
        lastSyncedHash.current = null;
        setSandboxStatus("Auto-restarting...");
      }, 8000);
      return () => clearTimeout(timer);
    } else if (sandboxStatus === "Ready") {
      retryCountRef.current = 0;
    }
  }, [sandboxStatus]);

  // Track consecutive failures for health check
  const consecutiveFailsRef = useRef(0);
  const readyTimestampRef = useRef<number>(0);

  // Listen for iframe load errors (404, ERR_CONNECTION_CLOSED, etc.)
  useEffect(() => {
    if (!previewUrl || !isSandboxReady) return;

    // Record when sandbox became ready - give it a grace period
    readyTimestampRef.current = Date.now();
    consecutiveFailsRef.current = 0;

    const restartSandbox = (reason: string) => {
      if (retryCountRef.current >= maxRetries) return;
      retryCountRef.current += 1;
      console.log(`[Preview] ${reason}, restarting (attempt ${retryCountRef.current})`);
      setSandboxId(null);
      setIsSandboxReady(false);
      initializedHash.current = null;
      lastSyncedHash.current = null;
      setSandboxStatus(`${reason}, restarting...`);
    };

    // Check if preview URL is reachable every 5 seconds, with 20s grace period
    const checkIframe = () => {
      const elapsed = Date.now() - readyTimestampRef.current;
      if (elapsed < 20000) return; // 20s grace period after ready

      fetch(previewUrl, { method: 'HEAD', mode: 'no-cors' })
        .then(() => { consecutiveFailsRef.current = 0; })
        .catch(() => {
          consecutiveFailsRef.current += 1;
          if (consecutiveFailsRef.current >= 3) {
            consecutiveFailsRef.current = 0;
            restartSandbox("Preview unreachable");
          }
        });
    };
    const intervalId = setInterval(checkIframe, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [previewUrl, isSandboxReady, key]);

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

  const refresh = () => {
    // If sandbox timed out or errored, reset sandboxId to trigger recreation
    if (sandboxStatus.toLowerCase().includes("error") || sandboxStatus.toLowerCase().includes("timeout")) {
      setSandboxId(null);
      setIsSandboxReady(false);
    }
    setKey(k => k + 1);
  };

  // Show loading placeholder
  if (isLoading || (sandboxId && !isSandboxReady)) {
    return (
      <div className="flex flex-col h-full w-full bg-editor-bg">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-editor-bg shrink-0">
          <div className="text-sm font-mono text-muted-foreground">{sandboxStatus}</div>
        </div>
        <div className="flex-1 min-h-0">
          <LoadingPlaceholder status={sandboxStatus} />
        </div>
      </div>
    );
  }

  // Preview Frame
  return (
    <div className="flex flex-col h-full w-full bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-editor-bg shrink-0">
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
                Live Preview
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                Starting...
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
      <div className="flex-1 min-h-0 overflow-hidden bg-muted relative">
        {!previewUrl || !isSandboxReady ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingPlaceholder status={sandboxStatus} />
          </div>
        ) : (
          <div className={`h-full w-full flex justify-center ${viewMode === 'mobile' ? 'bg-muted py-4 items-center' : 'bg-background'}`}>
            <motion.iframe
              key={key}
              data-preview="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={previewUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox allow-downloads"
              allow="cross-origin-isolated; clipboard-write"
              className={`bg-background shadow-xl ${viewMode === 'mobile'
                ? 'w-[375px] h-[667px] rounded-xl border-4 border-border'
                : 'w-full h-full border-none'
                }`}
              title="Modal Preview"
              onError={() => {
                if (retryCountRef.current < maxRetries) {
                  retryCountRef.current += 1;
                  setSandboxId(null);
                  setIsSandboxReady(false);
                  initializedHash.current = null;
                  lastSyncedHash.current = null;
                  setSandboxStatus("Connection lost, restarting...");
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
