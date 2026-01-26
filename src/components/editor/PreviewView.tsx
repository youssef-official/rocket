import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { 
  SandpackProvider, 
  SandpackPreview as SandpackPreviewPane,
} from '@codesandbox/sandpack-react';
import type { ProjectFile } from '@/types';

interface PreviewViewProps {
  files: Record<string, ProjectFile>;
  projectType: 'vite' | 'html';
  isLoading?: boolean;
}

export const PreviewView: React.FC<PreviewViewProps> = ({ files, projectType, isLoading }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');
  
  // Create a unique key based on file contents to force re-render when files change
  const filesHash = React.useMemo(() => {
    // Use actual content hash for better change detection
    const allContent = Object.entries(files)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, file]) => `${path}:${(file.content || '').substring(0, 200)}`)
      .join('|');
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < allContent.length; i++) {
      const char = allContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }, [files]);
  
  const [key, setKey] = React.useState(0);

  // Convert project files to Sandpack format with Tailwind support
  const sandpackFiles = useMemo(() => {
    const spFiles: Record<string, string> = {};
    
    Object.entries(files).forEach(([path, file]) => {
      // Sandpack expects paths starting with /
      const sandpackPath = path.startsWith('/') ? path : `/${path}`;
      spFiles[sandpackPath] = file.content;
    });

    // Ensure we have essential files for React projects
    if (projectType === 'vite') {
      // Add index.html if missing
      if (!spFiles['/index.html']) {
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
  </body>
</html>`;
      } else {
        // Inject Tailwind CDN if not present
        const indexHtml = spFiles['/index.html'];
        if (!indexHtml.includes('tailwindcss')) {
          spFiles['/index.html'] = indexHtml.replace(
            '</head>',
            '    <script src="https://cdn.tailwindcss.com"></script>\n  </head>'
          );
        }
      }

      // Only add default App.tsx if there's no app file at all
      const hasAppFile = Object.keys(spFiles).some(path => 
        path.includes('App.tsx') || path.includes('App.jsx') || path.includes('App.ts') || path.includes('App.js')
      );
      
      if (!hasAppFile) {
        spFiles['/App.tsx'] = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">🚀 Ready to Build</h1>
        <p className="text-gray-400">Generate a project to see the preview here</p>
      </div>
    </div>
  );
}`;
      }

      // Remap src/ paths to root for Sandpack
      const remappedFiles: Record<string, string> = {};
      Object.entries(spFiles).forEach(([path, content]) => {
        // Sandpack react template uses /App.tsx not /src/App.tsx
        if (path.startsWith('/src/')) {
          const newPath = path.replace('/src/', '/');
          remappedFiles[newPath] = content;
        } else {
          remappedFiles[path] = content;
        }
      });

      return remappedFiles;
    }

    return spFiles;
  }, [files, projectType]);

  const refresh = () => setKey(k => k + 1);

  if (Object.keys(files).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
          <p className="text-muted-foreground text-sm">
            Generate a project to see the preview here
          </p>
        </motion.div>
      </div>
    );
  }

  if (projectType === 'html') {
    // For HTML projects, use iframe
    const indexFile = files['index.html'];
    return (
      <div className="flex flex-col h-full bg-secondary/30">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-lg overflow-hidden shadow-2xl border border-border ${
              viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'
            }`}
          >
            {indexFile && (
              <iframe
                key={key}
                srcDoc={indexFile.content}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
              />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // For Vite/React projects, use Sandpack with Tailwind
  return (
    <div className="flex flex-col h-full bg-secondary/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating...</p>
          </div>
        ) : viewMode === 'mobile' ? (
          <div className="flex items-center justify-center h-full p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-[375px] h-[667px] bg-white rounded-lg overflow-hidden shadow-2xl border border-border"
            >
              <SandpackProvider
                key={`${key}-${filesHash}`}
                template="react-ts"
                files={sandpackFiles}
                theme="light"
                options={{
                  externalResources: ["https://cdn.tailwindcss.com"],
                  recompileMode: 'delayed',
                  recompileDelay: 300,
                }}
                customSetup={{
                  dependencies: {
                    'lucide-react': 'latest',
                    'framer-motion': 'latest',
                    'clsx': 'latest',
                    'tailwind-merge': 'latest',
                  },
                }}
              >
                <SandpackPreviewPane
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: '100%', width: '100%' }}
                />
              </SandpackProvider>
            </motion.div>
          </div>
        ) : (
          <SandpackProvider
            key={`${key}-${filesHash}`}
            template="react-ts"
            files={sandpackFiles}
            theme="light"
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
              recompileMode: 'delayed',
              recompileDelay: 300,
            }}
            customSetup={{
              dependencies: {
                'lucide-react': 'latest',
                'framer-motion': 'latest',
                'clsx': 'latest',
                'tailwind-merge': 'latest',
              },
            }}
          >
            <SandpackPreviewPane
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              style={{ height: '100%', width: '100%' }}
            />
          </SandpackProvider>
        )}
      </div>
    </div>
  );
};