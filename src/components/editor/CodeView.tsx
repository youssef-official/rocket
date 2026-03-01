import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { type Monaco } from '@monaco-editor/react';
import { ChevronRight, ChevronDown, File, Folder, FileCode, FileJson, FileText, Loader2, CheckCircle2, Hash, Image, Settings2, Lock } from 'lucide-react';
import type { ProjectFile } from '@/types';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';

// GitHub Dark inspired Monaco theme
const defineGitHubDarkTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme('github-dark-custom', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f97583' },
      { token: 'string', foreground: '9ecbff' },
      { token: 'number', foreground: '79b8ff' },
      { token: 'regexp', foreground: 'ffab70' },
      { token: 'type', foreground: '79b8ff' },
      { token: 'class', foreground: 'b392f0' },
      { token: 'function', foreground: 'b392f0' },
      { token: 'variable', foreground: 'e1e4e8' },
      { token: 'variable.predefined', foreground: '79b8ff' },
      { token: 'constant', foreground: '79b8ff' },
      { token: 'tag', foreground: '85e89d' },
      { token: 'attribute.name', foreground: 'b392f0' },
      { token: 'attribute.value', foreground: '9ecbff' },
      { token: 'delimiter', foreground: 'e1e4e8' },
      { token: 'delimiter.bracket', foreground: 'e1e4e8' },
      { token: 'operator', foreground: 'f97583' },
      { token: 'identifier', foreground: 'e1e4e8' },
      { token: 'meta.tag', foreground: '85e89d' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e1e4e8',
      'editor.lineHighlightBackground': '#161b2233',
      'editor.selectionBackground': '#3392FF44',
      'editor.inactiveSelectionBackground': '#3392FF22',
      'editorCursor.foreground': '#79b8ff',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#e1e4e8',
      'editor.selectionHighlightBackground': '#3392FF22',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
      'editorBracketMatch.background': '#3392FF33',
      'editorBracketMatch.border': '#3392FF55',
      'scrollbar.shadow': '#00000000',
      'editorOverviewRuler.border': '#00000000',
      'editor.wordHighlightBackground': '#3392FF22',
      'editorGutter.background': '#0d1117',
      'minimap.background': '#0d1117',
      'editorWidget.background': '#161b22',
      'editorWidget.border': '#30363d',
    },
  });
};

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

  // Fallback: extract <FILE path|name="..."> blocks from streaming XML responses
  const fileTagRegex = /<FILE\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi;
  const fileTagMatches = Array.from(content.matchAll(fileTagRegex));
  if (fileTagMatches.length > 0) {
    const starts = fileTagMatches.map((m) => ({
      path: (m[1] ?? m[2] ?? m[3] ?? '').trim(),
      tagIndex: m.index ?? 0,
      contentStart: (m.index ?? 0) + m[0].length,
    })).filter((s) => s.path.length > 0);

    for (let i = 0; i < starts.length; i++) {
      const current = starts[i];
      const nextTagIndex = i + 1 < starts.length ? starts[i + 1].tagIndex : -1;
      const closeIdx = content.indexOf('</FILE>', current.contentStart);
      const endIdx = closeIdx !== -1 ? closeIdx : (nextTagIndex !== -1 ? nextTagIndex : content.length);
      const fileContent = content.slice(current.contentStart, endIdx).trim();
      files.push({ path: current.path, content: fileContent, complete: closeIdx !== -1 });
    }

    return files;
  }

  // Fallback: extract markdown code blocks with file paths
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
  const { userPlan } = useUserPlan();
  const canEditCode = userPlan ? (PLAN_CONFIG[userPlan.plan] || PLAN_CONFIG.free).features.codeEditing : false;
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
    if (name.endsWith('.css') || name.endsWith('.scss')) return Hash;
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return Image;
    if (name.endsWith('.toml') || name.endsWith('.env')) return Settings2;
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
              className="w-full flex items-center gap-2 py-1.5 px-3 text-left transition-colors duration-100 hover:bg-[#161b22]"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" style={{ color: '#484f58' }} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" style={{ color: '#484f58' }} />
              )}
              <Folder className="w-3.5 h-3.5" style={{ color: isExpanded ? '#58a6ff' : '#8b949e' }} />
              <span className="text-[13px] truncate" style={{ color: '#e1e4e8' }}>{name}</span>
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
          className="w-full flex items-center gap-2 py-1.5 px-3 text-left transition-colors duration-100"
          style={{
            paddingLeft: `${depth * 12 + 28}px`,
            background: isSelected ? '#161b22' : 'transparent',
            borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
          }}
          onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#161b2288'; }}
          onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <FileIcon className="w-3.5 h-3.5" style={{
            color: isNew && !complete ? '#d29922' :
              isNew ? '#3fb950' :
              isSelected ? '#58a6ff' : '#8b949e'
          }} />
          <span className="text-[13px] truncate flex-1" style={{ color: isSelected ? '#e1e4e8' : '#c9d1d9' }}>{name}</span>
          
          {isNew && !complete && (
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#d29922' }} />
          )}
          
          {isNew && complete && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="w-3 h-3" style={{ color: '#3fb950' }} />
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
    <div className="flex h-full" style={{ background: '#0d1117' }}>
      {/* File Tree */}
      <div className="w-64 flex flex-col" style={{ background: '#010409', borderRight: '1px solid #21262d' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #21262d' }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8b949e' }}>
            Explorer
          </h3>
          {isGenerating && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#79b8ff' }} />
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-1.5 no-scrollbar">
          {allFiles.size === 0 ? (
            <div className="p-4 text-center text-xs" style={{ color: '#484f58' }}>
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
            <div className="px-4 py-2 flex items-center gap-2" style={{ background: '#161b22', borderBottom: '1px solid #21262d' }}>
              <File className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />
              <span className="text-xs font-medium" style={{ color: '#e1e4e8', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{selectedFile}</span>
              {currentFileData?.isNew && !currentFileData?.complete && (
                <span className="text-[10px] flex items-center gap-1 ml-auto font-medium" style={{ color: '#d29922' }}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </span>
              )}
              {currentFileData?.isNew && currentFileData?.complete && (
                <span className="text-[10px] flex items-center gap-1 ml-auto font-medium" style={{ color: '#3fb950' }}>
                  <CheckCircle2 className="w-3 h-3" />
                  New
                </span>
              )}
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={getLanguage(fileName)}
                value={displayContent}
                onChange={(value) => {
                  if (currentFile && canEditCode) {
                    onUpdateFile(selectedFile, value || '');
                  }
                }}
                theme="github-dark-custom"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  renderLineHighlight: 'line',
                  cursorBlinking: 'phase',
                  cursorSmoothCaretAnimation: 'on',
                  cursorWidth: 2,
                  smoothScrolling: true,
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  readOnly: !canEditCode || (currentFileData?.isNew && !currentFileData?.complete),
                  lineHeight: 22,
                  letterSpacing: 0.3,
                  renderWhitespace: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                    verticalSliderSize: 6,
                  },
                }}
                beforeMount={(monaco) => {
                  defineGitHubDarkTheme(monaco);
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
                  <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#79b8ff' }} />
                  </div>
                }
              />
            </div>
            {!canEditCode && (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 flex items-end justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm">
                  <Lock className="w-4 h-4 text-yellow-400" />
                  <span>Code editing requires <a href="/pricing" className="text-purple-400 hover:underline font-semibold">Pro or Business</a> plan</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ background: '#0d1117' }}>
            <div className="text-center">
              <FileCode className="w-10 h-10 mx-auto mb-3" style={{ color: '#30363d' }} />
              <p className="text-sm" style={{ color: '#484f58' }}>
                {isGenerating ? 'Generating files...' : 'Select a file to view'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
