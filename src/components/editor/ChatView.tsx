import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, ChevronDown, ChevronUp, Plus, StopCircle, Code2, FileCode, FileType, File, FileJson, CheckCircle2, Image as ImageIcon, X, Snowflake, Lightbulb, ListOrdered, Zap, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'edited' | 'created';
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
  onImageUpload
}) => {
  const [input, setInput] = useState('');
  const [showFileList, setShowFileList] = useState(true);
  const chatMode = false;
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
      
      onSendMessage(input.trim(), chatMode, imageUrl);
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

  // Render Plan Section with step-by-step progress
  const renderPlanSection = () => {
    if (!generationPhase?.plan || generationPhase.plan.length === 0) return null;

    const completedSteps = generationPhase.completedSteps || [];
    const currentStep = generationPhase.currentStep;
    const stepFiles = generationPhase.stepFiles || {};

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-[#2a2a2a]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <ListOrdered className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">What I'm Building:</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          {generationPhase.plan.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isCurrent = currentStep === i;
            const filesForStep = stepFiles[i] || [];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-start gap-3">
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
                </div>

                {/* Files for this step */}
                {filesForStep.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-8 space-y-1 border-l-2 border-white/10 pl-3"
                  >
                    {filesForStep.map((file, fileIdx) => (
                      <div key={fileIdx} className="flex items-center gap-2 text-xs text-white/60">
                        {getFileIcon(file)}
                        <span className="font-mono">{file}</span>
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                      </div>
                    ))}
                  </motion.div>
                )}

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

  // Render Summary Section
  const renderSummarySection = () => {
    if (!generationPhase?.summary) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-lg overflow-hidden border border-green-500/30 bg-green-500/10"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-green-500/20">
          <FileText className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Summary</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-white/80">{generationPhase.summary}</p>
        </div>
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
              <svg viewBox="0 0 100 100" className="w-full h-full text-white/40">
                <text x="50" y="70" textAnchor="middle" fontSize="80" fill="currentColor" fontWeight="bold">b</text>
              </svg>
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
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white text-xs font-bold">Rocket</span>
                      </div>
                      <div className="pl-9 break-words overflow-hidden w-full">
                        {hasContent && cleanedContent && (
                          <div className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-li:text-white/80">
                            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
                          </div>
                        )}

                        {isLastAssistant && !chatMode && (
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
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
                placeholder="How can Rocket help you today? (or /command)"
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
