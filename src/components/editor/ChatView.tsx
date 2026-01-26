import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronDown, ChevronUp, Plus, StopCircle, Code2, FileCode, FileType, File, FileJson, CheckCircle2, Image as ImageIcon, X, Snowflake, Lightbulb, ListOrdered, Zap, FileText, MessageCircle, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import type { ProjectVersion } from '@/hooks/useVersions';
import rocketLogo from '@/assets/rocket-logo.png';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'edited' | 'created';
}

interface Suggestion {
  label: string;
  prompt: string;
}

interface GenerationPhase {
  phase: 'thinking' | 'planning' | 'generating' | 'complete';
  message: string;
  thinkingTime?: number;
  plan?: string[];
  completedSteps?: number[];
  currentStep?: number;
  stepFiles?: Record<number, string[]>;
  status?: string;
  summary?: string;
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, isChat?: boolean, imageUrl?: string) => void;
  isGenerating: boolean;
  fileActivities?: FileActivity[];
  generationPhase?: GenerationPhase | null;
  currentFile?: string | null;
  onStop?: () => void;
  statusMessage?: string;
  currentVersion?: number | null;
  onImageUpload?: (file: File) => Promise<string | null>;
  suggestions?: Suggestion[];
  versions?: ProjectVersion[];
  onSelectVersion?: (version: ProjectVersion) => void;
}

// Get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return <Code2 className="w-4 h-4 text-blue-400" />;
    case 'jsx':
    case 'js':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'css':
      return <FileType className="w-4 h-4 text-purple-400" />;
    case 'html':
      return <File className="w-4 h-4 text-orange-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-green-400" />;
    default:
      return <File className="w-4 h-4 text-white/40" />;
  }
};

// AGGRESSIVE cleaning - remove ALL JSON/code from AI messages
const cleanAIMessage = (content: string): string => {
  if (content.trim().startsWith('{') && (content.includes('"files"') || content.includes('"src/'))) {
    return "";
  }
  
  let cleaned = content;
  cleaned = cleaned.replace(/(\*?\*?Now I['']ll start building\.{2,3}\*?\*?\s*){2,}/gi, 'Now I\'ll start building...\n\n');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/\{\s*"files"\s*:\s*\{[\s\S]*$/g, '');
  cleaned = cleaned.replace(/\{\s*"[^"]+"\s*:\s*"[\s\S]*$/g, '');
  cleaned = cleaned.replace(/"src\/[^"]+"\s*:\s*"[^"]*"/g, '');
  
  cleaned = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('"src/') || trimmed.startsWith('"package.json"') || 
        trimmed.startsWith('"tailwind.config') || trimmed.startsWith('"vite.config') ||
        trimmed.startsWith('"index.html"') || trimmed.startsWith('"tsconfig')) {
      return false;
    }
    if (trimmed.startsWith('{') && trimmed.includes('"files"')) return false;
    if (trimmed === '{' || trimmed === '}' || trimmed === '",') return false;
    return true;
  }).join('\n');
  
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
};

export const ChatView: React.FC<ChatViewProps> = ({ 
  messages, 
  onSendMessage, 
  isGenerating,
  fileActivities = [],
  generationPhase,
  currentFile,
  onStop,
  statusMessage,
  currentVersion,
  onImageUpload,
  suggestions = [],
  versions = [],
  onSelectVersion
}) => {
  const [input, setInput] = useState('');
  const [showFileList, setShowFileList] = useState(true);
  const [isChatMode, setIsChatMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, fileActivities, generationPhase, statusMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      let imageUrl: string | undefined;
      
      if (uploadedImage && onImageUpload) {
        const url = await onImageUpload(uploadedImage.file);
        if (url) {
          imageUrl = url;
        }
      }
      
      onSendMessage(input.trim(), isChatMode, imageUrl);
      setInput('');
      setUploadedImage(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
    setShowPlusMenu(false);
  };

  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
      setUploadedImage(null);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.prompt);
  };

  // Render File Activity Panel - Bolt style
  const renderFileActivityPanel = (files: FileActivity[], isLive: boolean = false) => {
    if (files.length === 0) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-[#2a2a2a]"
      >
        <button
          onClick={() => setShowFileList(!showFileList)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              Files ({files.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showFileList ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {showFileList && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 overflow-hidden"
            >
              {files.map((file, i) => {
                const isEditing = file.status === 'editing';
                
                return (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-all ${
                      isEditing ? 'bg-primary/10' : ''
                    } ${i !== files.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    {isEditing ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}

                    {getFileIcon(file.name)}

                    <span className="text-sm font-mono text-white/80 flex-1 truncate">
                      {file.name}
                    </span>

                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isEditing 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {isEditing ? 'Editing' : 'Done'}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Render Thinking Indicator
  const renderThinkingIndicator = () => {
    if (!generationPhase || generationPhase.phase !== 'thinking') return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2a2a2a] border border-white/10"
      >
        <div className="relative">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-yellow-400/20"
          />
        </div>
        <span className="text-sm font-medium text-white/80 flex-1">
          Thought for {generationPhase.thinkingTime || 0}s
        </span>
      </motion.div>
    );
  };

  // Render Plan Section with step-by-step progress (Tasks)
  const renderPlanSection = () => {
    if (!generationPhase?.plan || generationPhase.plan.length === 0) return null;

    const completedSteps = generationPhase.completedSteps || [];
    const currentStep = generationPhase.currentStep;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-[#2a2a2a]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <ListOrdered className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Tasks</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {generationPhase.plan.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isCurrent = currentStep === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                {/* Step indicator */}
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{i + 1}.</span>
                )}
                <div className="flex flex-col">
                  {isCurrent && (
                    <span className="text-xs text-primary font-medium mb-1">Now I'm making:</span>
                  )}
                  <span className={`text-sm ${isCompleted ? 'text-green-400' : isCurrent ? 'text-white' : 'text-white/60'}`}>
                    {step}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Render Status Message (during generation) - Only show when NOT in plan view
  const renderStatusMessage = () => {
    // Don't show separate status if we're showing plan (status is shown inline in plan)
    if (generationPhase?.plan && generationPhase.plan.length > 0) return null;
    if (!generationPhase?.status && !statusMessage) return null;
    if (!isGenerating && !generationPhase?.status) return null;

    const currentStatus = generationPhase?.status || statusMessage;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2a2a2a] border border-white/10"
      >
        <div className="relative">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-white/80 flex-1">
          {currentStatus}
        </span>
        {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </motion.div>
    );
  };

  // Render Summary Section with Version Card
  const renderSummarySection = () => {
    if (!generationPhase?.summary) return null;

    // Get the latest version for display
    const latestVersion = versions.length > 0 ? versions[0] : null;
    const activeVersion = currentVersion 
      ? versions.find(v => v.versionNumber === currentVersion) 
      : latestVersion;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 space-y-3"
      >
        {/* Version Card - Bolt Style */}
        {activeVersion && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectVersion?.(activeVersion)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-[#2a2a2a] border border-primary/30 hover:border-primary/50 transition-all shadow-lg shadow-primary/5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary flex-shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {activeVersion.name || `Version ${activeVersion.versionNumber}`}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Version {activeVersion.versionNumber}
              </p>
            </div>
          </motion.button>
        )}

        {/* Show all versions if more than 1 */}
        {versions.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-white/40 px-1">Previous Versions</p>
            {versions.slice(1, 4).map((version) => (
              <motion.button
                key={version.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => onSelectVersion?.(version)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                  currentVersion === version.versionNumber
                    ? 'bg-[#2a2a2a] border border-white/20'
                    : 'bg-[#252525] border border-white/5 hover:border-white/10'
                }`}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5 text-white/50 flex-shrink-0 text-[10px] font-bold">
                  v{version.versionNumber}
                </div>
                <p className="text-xs text-white/60 truncate flex-1">
                  {version.name || `Version ${version.versionNumber}`}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // Render Suggestions
  const renderSuggestions = () => {
    if (suggestions.length === 0 || isGenerating) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2 mb-3"
      >
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
          >
            {suggestion.label}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  const showEmptyState = messages.length === 0 && !isGenerating;

  const lastAssistantIndex = messages.reduce((last, msg, i) => 
    msg.role === 'assistant' ? i : last, -1);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#1a1a1a]">
      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0">
        {showEmptyState ? (
          // Empty State - Bolt Style with big logo
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 mb-6 opacity-20">
              <img src={rocketLogo} alt="Rocket" className="w-full h-full object-contain" />
            </div>
            <p className="text-white/40 text-lg">Your preview will appear here</p>
          </div>
        ) : (
          <>
            {messages.map((msg, msgIndex) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = msgIndex === lastAssistantIndex;

              const cleanedContent = !isUser ? cleanAIMessage(msg.content) : null;
              const hasContent = isUser || (cleanedContent && cleanedContent.length > 0);

              return (
                <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm shadow-sm text-[15px] break-words whitespace-pre-wrap overflow-hidden bg-[#2a2a2a] text-white">
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <img 
                            src={msg.imageUrl} 
                            alt="Attached" 
                            className="max-w-full max-h-48 rounded-lg object-cover"
                          />
                        </div>
                      )}
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] flex flex-col min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden">
                          <img src={rocketLogo} alt="Rocket" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-xs font-bold">Rocket</span>
                      </div>
                      <div className="pl-9 break-words overflow-hidden w-full">
                        {hasContent && cleanedContent && (
                          <div className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-li:text-white/80">
                            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
                          </div>
                        )}

                        {isLastAssistant && !isChatMode && (
                          <>
                            {renderThinkingIndicator()}
                            {renderPlanSection()}
                            {renderStatusMessage()}
                            {fileActivities.length > 0 && renderFileActivityPanel(fileActivities, isGenerating)}
                            {renderSummarySection()}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isGenerating && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
              <div className="flex w-full justify-start">
                <div className="max-w-[95%] flex flex-col min-w-0 w-full">
                  <div className="pl-9 -mt-2">
                    {renderStatusMessage()}
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') && (
              <div className="flex w-full justify-start">
                <div className="max-w-[95%] flex flex-col min-w-0 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden">
                      <img src={rocketLogo} alt="Rocket" className="w-full h-full object-contain animate-pulse" />
                    </div>
                    <span className="text-white text-xs font-bold">Rocket</span>
                  </div>
                  <div className="pl-9 space-y-4">
                    {renderThinkingIndicator()}
                    {renderPlanSection()}
                    {renderStatusMessage()}
                    {fileActivities.length > 0 && renderFileActivityPanel(fileActivities, true)}
                    {renderSummarySection()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area - Bolt Style */}
      <div 
        className={`shrink-0 p-4 pt-2 bg-[#1a1a1a] transition-colors ${isDragging ? 'bg-primary/5' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="text-primary font-medium flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <span>Drop image here</span>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {renderSuggestions()}

        {uploadedImage && (
          <div className="mb-3 flex items-center gap-2 max-w-3xl mx-auto">
            <div className="relative">
              <img 
                src={uploadedImage.preview} 
                alt="Upload preview" 
                className="h-16 w-16 object-cover rounded-lg border border-white/10"
              />
              <button
                onClick={removeUploadedImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-sm text-white/50">{uploadedImage.file.name}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Bolt Style Input */}
          <div className="bg-[#2a2a2a] border border-white/10 rounded-xl overflow-hidden">
            {/* Text Input */}
            <div className="px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isChatMode ? "Chat with Rocket (no code changes)..." : "How can Rocket help you today?"}
                disabled={isGenerating}
                className="w-full bg-transparent resize-none max-h-32 text-[15px] outline-none text-white placeholder-white/30 leading-relaxed"
                rows={2}
                style={{ minHeight: '50px' }}
              />
            </div>
            
            {/* Bottom Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                {/* Plus Button */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-white/40 hover:text-white hover:bg-white/10"
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showPlusMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 bg-[#2a2a2a] rounded-lg overflow-hidden shadow-xl z-50 border border-white/10"
                      >
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors w-full text-left text-white"
                        >
                          <ImageIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm">Upload Image</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Model Selector - Bolt Style */}
                <button 
                  type="button"
                  className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gemini 3</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Plan/Chat Mode Toggle */}
                <button 
                  type="button"
                  onClick={() => setIsChatMode(!isChatMode)}
                  className={`flex items-center gap-1.5 h-7 px-2 rounded-md text-xs transition-all ${
                    isChatMode 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>

                {/* Version Button Removed - now shown as cards after summary */}
              </div>

              <div className="flex items-center gap-1">
                {/* Send/Stop button */}
                {isGenerating ? (
                  <button 
                    type="button"
                    onClick={onStop}
                    className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      input.trim()
                        ? 'bg-primary text-white hover:opacity-90'
                        : 'bg-white/10 text-white/30'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
