import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Smartphone, Monitor, Loader2, Maximize2, RotateCcw } from 'lucide-react';
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
  
  const filesHash = React.useMemo(() => {
    const allContent = Object.entries(files)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, file]) => `${path}:${(file.content || '').substring(0, 200)}`)
      .join('|');
    let hash = 0;
    for (let i = 0; i < allContent.length; i++) {
      const char = allContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }, [files]);
  
  const [key, setKey] = React.useState(0);

  const sandpackFiles = useMemo(() => {
    const spFiles: Record<string, string> = {};
    
    Object.entries(files).forEach(([path, file]) => {
      const sandpackPath = path.startsWith('/') ? path : `/${path}`;
      spFiles[sandpackPath] = file.content;
    });

    if (projectType === 'vite') {
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
        const indexHtml = spFiles['/index.html'];
        if (!indexHtml.includes('tailwindcss')) {
          spFiles['/index.html'] = indexHtml.replace(
            '</head>',
            '    <script src="https://cdn.tailwindcss.com"></script>\n  </head>'
          );
        }
      }

      const hasAppFile = Object.keys(spFiles).some(path => 
        path.includes('App.tsx') || path.includes('App.jsx') || path.includes('App.ts') || path.includes('App.js')
      );
      
      if (!hasAppFile) {
        spFiles['/App.tsx'] = `export default function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-gray-400">
            <text x="50" y="70" textAnchor="middle" fontSize="80" fill="currentColor" fontWeight="bold">R</text>
          </svg>
        </div>
        <p className="text-gray-400 text-lg">Your preview will appear here</p>
      </div>
    </div>
  );
}`;
      }

      const remappedFiles: Record<string, string> = {};
      Object.entries(spFiles).forEach(([path, content]) => {
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

  // Empty State - Clean White
  if (Object.keys(files).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
              <text x="50" y="70" textAnchor="middle" fontSize="80" fill="currentColor" fontWeight="bold">R</text>
            </svg>
          </div>
          <p className="text-gray-400 text-lg">Your preview will appear here</p>
        </motion.div>
      </div>
    );
  }

  if (projectType === 'html') {
    const indexFile = files['index.html'];
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'desktop' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'mobile' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Refresh preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-gray-100">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-lg overflow-hidden shadow-lg ${
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

  // For Vite/React projects - White background preview
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar - Light theme */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'desktop' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'mobile' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Refresh preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-gray-500">Generating...</p>
          </div>
        ) : viewMode === 'mobile' ? (
          <div className="flex items-center justify-center h-full p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-[375px] h-[667px] bg-white rounded-lg overflow-hidden shadow-lg"
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
