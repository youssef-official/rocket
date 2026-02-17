import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { ChevronRight, ChevronDown, File, Folder, FileCode, FileJson, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import type { ProjectFile } from '@/types';

interface CodeViewProps {
  files: Record<string, ProjectFile>;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  streamingContent?: string;
  isGenerating?: boolean;
}

// Parse streaming content to extract files being generated
function parseStreamingFiles(content: string): { path: string; content: string; complete: boolean }[] {
  const files: { path: string; content: string; complete: boolean }[] = [];
  
  // Try JSON format first
  const jsonMatch = content.match(/```json\s*([\s\S]*?)(\s*```|$)/);
  if (jsonMatch) {
    try {
      let jsonStr = jsonMatch[1].trim();
      
      // Remove trailing commas before closing braces or brackets
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

      if (!jsonStr.endsWith('}')) {
        jsonStr = jsonStr + '"}}}';
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.files) {
        for (const [path, fileContent] of Object.entries(parsed.files)) {
          files.push({ 
            path, 
            content: fileContent as string, 
            complete: jsonMatch[2] === '```' 
          });
        }
        return files;
      }
    } catch {
      // Partial JSON, extract what we can
      const fileMatches = jsonMatch[1].matchAll(/"([^"]+)":\s*"((?:[^"\\]|\\.)*)(")?/g);
      for (const match of fileMatches) {
        const path = match[1];
        const fileContent = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        const complete = !!match[3];
        if (path.includes('.') && !path.includes('://')) {
          files.push({ path, content: fileContent, complete });
        }
      }
    }
  }

  // Fallback: extract code blocks with file paths
  const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*)?(\S+\.\w+)\n([\s\S]*?)(```|$)/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const path = match[2];
    const fileContent = match[3];
    const complete = match[4] === '```';
    files.push({ path, content: fileContent, complete });
  }

  return files;
}

export const CodeView: React.FC<CodeViewProps> = ({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onUpdateFile,
  streamingContent = '',
  isGenerating = false,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

  // Parse streaming files
  const streamingFiles = useMemo(() => {
    if (!streamingContent) return [];
    return parseStreamingFiles(streamingContent);
  }, [streamingContent]);

  // Combine existing files with streaming files
  const allFiles = useMemo(() => {
    const fileMap = new Map<string, { content: string; isNew: boolean; complete: boolean }>();
    
    // Add existing files
    Object.entries(files).forEach(([path, file]) => {
      fileMap.set(path, { content: file.content, isNew: false, complete: true });
    });
    
    // Add/update with streaming files
    streamingFiles.forEach(({ path, content, complete }) => {
      const existing = fileMap.get(path);
      fileMap.set(path, { 
        content, 
        isNew: !existing, 
        complete 
      });
    });
    
    return fileMap;
  }, [files, streamingFiles]);

  // Auto-select first new file when streaming starts, and update as new files are created
  useEffect(() => {
    if (streamingFiles.length > 0) {
      // If no file selected, select the first streaming file
      if (!selectedFile) {
        const firstNewFile = streamingFiles[0];
        if (firstNewFile) {
          onSelectFile(firstNewFile.path);
        }
      } else {
        // If current file is complete, switch to the latest incomplete file
        const currentFileData = streamingFiles.find(f => f.path === selectedFile);
        if (currentFileData?.complete) {
          const incompleteFile = streamingFiles.find(f => !f.complete);
          if (incompleteFile) {
            onSelectFile(incompleteFile.path);
          }
        }
      }
    }
  }, [streamingFiles, selectedFile, onSelectFile]);
  
  // Expand folders containing new files
  useEffect(() => {
    if (streamingFiles.length > 0) {
      const newFolders = new Set(expandedFolders);
      streamingFiles.forEach(({ path }) => {
        const parts = path.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          newFolders.add(currentPath);
        }
      });
      setExpandedFolders(newFolders);
    }
  }, [streamingFiles]);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return FileCode;
    if (name.endsWith('.json')) return FileJson;
    if (name.endsWith('.md') || name.endsWith('.txt')) return FileText;
    return File;
  };

  const getLanguage = (name: string): string => {
    if (name.endsWith('.tsx')) return 'typescript';
    if (name.endsWith('.ts')) return 'typescript';
    if (name.endsWith('.jsx')) return 'javascript';
    if (name.endsWith('.js')) return 'javascript';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  // Build folder tree from combined files
  const buildTree = () => {
    const tree: Record<string, any> = {};
    
    Array.from(allFiles.keys()).forEach(path => {
      const parts = path.split('/');
      let current = tree;
      const fileData = allFiles.get(path)!;
      
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { 
            type: 'file', 
            path,
            isNew: fileData.isNew,
            complete: fileData.complete,
          };
        } else {
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      });
    });

    return tree;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTree = (node: Record<string, any>, parentPath = '', depth = 0) => {
    const entries = Object.entries(node).sort((a, b) => {
      const aIsFolder = a[1].type === 'folder';
      const bIsFolder = b[1].type === 'folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a[0].localeCompare(b[0]);
    });

    return entries.map(([name, data]) => {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      const isExpanded = expandedFolders.has(fullPath);
      const isSelected = selectedFile === (data as any).path;
      const FileIcon = getFileIcon(name);
      const isNew = (data as any).isNew;
      const complete = (data as any).complete;

      if ((data as any).type === 'folder') {
        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className="file-tree-item w-full"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <Folder className={`w-4 h-4 ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm truncate">{name}</span>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {renderTree((data as any).children, fullPath, depth + 1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      return (
        <motion.button
          key={(data as any).path}
          initial={isNew ? { opacity: 0, x: -10 } : false}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectFile((data as any).path)}
          className={`file-tree-item w-full ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 28}px` }}
        >
          <FileIcon className={`w-4 h-4 ${
            isNew && !complete ? 'text-yellow-500' : 
            isNew ? 'text-green-500' : 
            isSelected ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <span className="text-sm truncate flex-1">{name}</span>
          
          {isNew && !complete && (
            <Loader2 className="w-3 h-3 animate-spin text-yellow-500 ml-1" />
          )}
          
          {isNew && complete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <CheckCircle2 className="w-3 h-3 text-green-500 ml-1" />
            </motion.div>
          )}
        </motion.button>
      );
    });
  };

  const tree = buildTree();
  
  // Get current file content (from streaming or existing)
  const currentFileData = selectedFile ? allFiles.get(selectedFile) : null;
  const currentFile = selectedFile && files[selectedFile] ? files[selectedFile] : null;
  const displayContent = currentFileData?.content || currentFile?.content || '';
  const fileName = selectedFile?.split('/').pop() || '';

  return (
    <div className="flex h-full bg-background">
      {/* File Tree */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Files
          </h3>
          {isGenerating && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {allFiles.size === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No files generated yet
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile && displayContent ? (
          <>
            <div className="px-4 py-2 border-b border-border flex items-center gap-2 bg-secondary/30">
              <File className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedFile}</span>
              {currentFileData?.isNew && !currentFileData?.complete && (
                <span className="text-xs text-yellow-500 flex items-center gap-1 ml-auto">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </span>
              )}
              {currentFileData?.isNew && currentFileData?.complete && (
                <span className="text-xs text-green-500 flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="w-3 h-3" />
                  New
                </span>
              )}
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={getLanguage(fileName)}
                value={displayContent}
                onChange={(value) => {
                  if (currentFile) {
                    onUpdateFile(selectedFile, value || '');
                  }
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16 },
                  renderLineHighlight: 'gutter',
                  cursorBlinking: 'smooth',
                  readOnly: currentFileData?.isNew && !currentFileData?.complete,
                }}
                beforeMount={(monaco) => {
                  // Disable all TypeScript/JavaScript diagnostics to prevent false red squiggly lines
                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                    noSuggestionDiagnostics: true,
                  });
                  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                    noSuggestionDiagnostics: true,
                  });
                }}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {isGenerating ? 'Generating files...' : 'Select a file to view and edit'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
