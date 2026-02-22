import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronDown, Plus, StopCircle, Code2, FileCode, FileType, File, FileJson, CheckCircle2, Image as ImageIcon, X, Lightbulb, ListOrdered, Zap, Bookmark, Pencil, FileOutput, Package, MousePointer, MoreVertical, Eye, Lock, Trash2, FileSearch, Files } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChatMessage } from '@/types';
import type { ProjectVersion } from '@/hooks/useVersions';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { useUserPlan } from '@/hooks/useUserPlan';
import { toast } from '@/hooks/use-toast';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
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

// Message with associated version and activities
interface MessageWithMeta {
  message: ChatMessage;
  versionNumber?: number;
  activities?: FileActivity[];
  plan?: string[];
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
  onRollback?: (versionNumber: number) => Promise<void>;
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
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

// AGGRESSIVE cleaning - remove ALL JSON/code from AI messages
const cleanAIMessage = (content: string): string => {
  if (!content) return "";

  const trimmedS = content.trim();
  
  // Hide raw JSON responses completely - they're handled by file updates
  if (trimmedS.startsWith('{') && (
    trimmedS.includes('"files"') || 
    trimmedS.includes('"src/') ||
    trimmedS.includes('"index.html"') ||
    trimmedS.includes('"actions_taken"')
  )) {
    return "";
  }
  
  // Hide array responses (suggestions, etc)
  if (trimmedS.startsWith('[') && trimmedS.endsWith(']')) {
    return "";
  }

  let cleaned = content;

  // Remove JSON objects embedded in text
  cleaned = cleaned.replace(/\{\s*"files"\s*:\s*\{[\s\S]*?\}\s*\}/g, '');
  cleaned = cleaned.replace(/\{\s*"actions_taken"\s*:\s*\[[\s\S]*?\]\s*\}/g, '');

  // Remove file-block output (preferred code mode format)
  cleaned = cleaned.replace(/<FILE\s+path=("|')[^"']+\1>[\s\S]*?<\/FILE>/gi, '');
  
  // Remove code blocks that contain JSON
  cleaned = cleaned.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '');
  cleaned = cleaned.replace(/```(?:tsx?|jsx?|html|css)?\s*[\s\S]*?```/gi, '');

  // Remove trailing JSON garbage
  cleaned = cleaned.replace(/\{\s*"files"\s*:\s*\{[\s\S]*$/g, '');
  cleaned = cleaned.replace(/\[\s*\{[\s\S]*$/g, '');

  // Remove summary marker block - rendered separately below activity log
  cleaned = cleaned.replace(/<!--SUMMARY-->[\s\S]*?<!--\/SUMMARY-->/g, '');
  // Legacy: remove ✅ lines and summary sections
  cleaned = cleaned.replace(/\*?\*?Summary:?\*?\*?[\s\S]*?(?=\*\*|$)/gi, '');
  cleaned = cleaned.replace(/✅[^\n]*/g, '');
  // Remove "What I'm Building" headers
  cleaned = cleaned.replace(/###?\s*\*?\*?What I['']?m Building.*?\*?\*?:?\s*/gi, '');
  cleaned = cleaned.replace(/###?\s*\*?\*?What I will build.*?\*?\*?:?\s*/gi, '');
  // Remove "Generating..." text
  cleaned = cleaned.replace(/\*\*.*?Generating.*?\*\*/gi, '');

  // Filter out technical lines
  cleaned = cleaned.split('\n').filter(line => {
    const t = line.trim();
    if (t.startsWith('"') && (t.includes('src/') || t.includes('index.html'))) return false;
    if (t.startsWith('{') || t === '}' || t === '],') return false;
    if (t.startsWith('[') && t.includes('"')) return false;
    if (t.toLowerCase().startsWith('summary:')) return false;
    if (/^["']?(src\/|index\.html|package\.json|tailwind|vite)/.test(t)) return false;
    return true;
  }).join('\n');

  // Clean excessive whitespace
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
};

// Extract summary line from AI message (✅ line)
const extractSummaryFromMessage = (content: string): string | null => {
  if (!content) return null;
  // Try new marker format first
  const markerMatch = content.match(/<!--SUMMARY-->([\s\S]*?)<!--\/SUMMARY-->/);
  if (markerMatch) return markerMatch[1].trim();
  // Legacy: ✅ line
  const legacyMatch = content.match(/✅[\s\S]*$/);
  return legacyMatch ? legacyMatch[0].trim() : null;
};

// Extract "What I'm Building" section from message
const extractBuildingPlan = (content: string): string[] => {
  if (!content) return [];

  // Look for the "What I'm Building" section, supporting various formats
  // Handles possible ### markers and different quote styles
  const planMatch = content.match(/What I['’]m Building:?[\s\S]*?\n([\s\S]*?)(?=\*\*|Now I['’]ll|$)/i);
  if (!planMatch) return [];

  const planText = planMatch[1];
  const lines = planText.split('\n')
    .filter(line => /^\d+\.|^•|^\*|^-/.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*|^•\s*|^\*\s*|^-\s*/, '').trim())
    .filter(line => line.length > 0);

  return lines;
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
  onSelectVersion,
  onRollback
}) => {
  const { t } = useLanguage();
  const { userPlan } = useUserPlan();
  const isPaidPlan = userPlan?.plan && userPlan.plan !== 'spark';
  const [input, setInput] = useState('');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [isChatMode, setIsChatMode] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rollbackVersionId, setRollbackVersionId] = useState<number | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'File upload is available on paid plans only.', variant: 'destructive' });
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(f => 
      f.type.startsWith('image/') || 
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      f.type === 'text/csv' ||
      f.type.startsWith('video/') ||
      f.type.startsWith('font/') ||
      f.name.endsWith('.ttf') || f.name.endsWith('.otf') || f.name.endsWith('.woff') || f.name.endsWith('.woff2')
    ).slice(0, 5 - uploadedImages.length);

    const newFiles = supportedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    setUploadedImages(prev => [...prev, ...newFiles]);
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
      let imageUrls: string[] = [];

      if (uploadedImages.length > 0 && onImageUpload) {
        // Upload all images and get their URLs
        const uploadPromises = uploadedImages.map(img => onImageUpload(img.file));
        const urls = await Promise.all(uploadPromises);
        imageUrls = urls.filter((url): url is string => url !== null);
      }

      // If we have multiple images, we'll pass the first one for backward compatibility 
      // but we should eventually update the whole chain to support arrays
      onSendMessage(input.trim(), isChatMode, imageUrls.length > 0 ? imageUrls.join(',') : undefined);

      setInput('');
      setUploadedImages([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const supportedFiles = files.filter(f => 
      f.type.startsWith('image/') || 
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      f.type === 'text/csv' ||
      f.type.startsWith('video/') ||
      f.type.startsWith('font/') ||
      f.name.endsWith('.ttf') || f.name.endsWith('.otf') || f.name.endsWith('.woff') || f.name.endsWith('.woff2')
    ).slice(0, 5 - uploadedImages.length);

    const newFiles = supportedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    setUploadedImages(prev => [...prev, ...newFiles]);
    setShowPlusMenu(false);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.prompt);
  };

  // Toggle activities for a specific message
  const toggleActivities = (messageId: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Match messages to versions
  const getVersionForMessageIndex = (msgIndex: number): ProjectVersion | undefined => {
    // Find the version that was created after this message
    const messagesUpToHere = messages.slice(0, msgIndex + 1);
    const versionNumber = Math.floor(messagesUpToHere.filter(m => m.role === 'assistant').length);
    return versions.find(v => v.versionNumber === versionNumber);
  };

  // Render File Activity Panel for a specific message
  const renderFileActivityPanelForMessage = (messageId: string, files: FileActivity[], isLive: boolean = false) => {
    if (files.length === 0) return null;

    const isExpanded = expandedActivities[messageId] ?? true;
    const actionsCount = files.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        {/* Header - Actions taken */}
        <button
          onClick={() => toggleActivities(messageId)}
          className="w-full flex items-center justify-between py-2 transition-colors group"
        >
          <div className="flex items-center gap-2">
            {isLive ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-border" />
            )}
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground/80 font-medium">{actionsCount}</span> {t('chat.actionsTaken')}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* File List - Expandable */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="py-2 space-y-1">
                {files.map((file, i) => {
                  const isEditing = file.status === 'editing';
                  const actionLabel = t(`action.${file.action}`);
                  const ActionIcon = file.action === 'edited' ? Pencil :
                    file.action === 'created' ? FileOutput :
                      file.action === 'read' ? Eye :
                        file.action === 'deleted' ? Trash2 :
                          file.action === 'analyzed_image' ? ImageIcon : FileOutput;

                  return (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-3 py-1.5 group"
                    >
                      {/* Action Icon */}
                      <ActionIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isEditing ? 'text-primary' : 'text-muted-foreground'
                        }`} />

                      {/* Action Label */}
                      <span className={`text-sm flex-shrink-0 min-w-[70px] ${isEditing ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                        {actionLabel}
                      </span>

                      {/* File Name with Background */}
                      <span className={`text-sm font-mono px-2 py-0.5 rounded ${isEditing
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-foreground/70'
                        }`}>
                        {file.name}
                      </span>

                      {/* Loading indicator for active file */}
                      {isEditing && (
                        <Loader2 className="w-3 h-3 text-primary animate-spin ml-auto" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Build status message */}
                {!isLive && files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 py-1.5 mt-2"
                  >
                    <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {t('chat.built')}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Render Thinking Indicator - Icon + Timer only
  const renderThinkingIndicator = () => {
    if (!generationPhase || generationPhase.phase !== 'thinking') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-2"
      >
        <div className="relative">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-yellow-400/20"
          />
        </div>
        <span className="text-sm font-medium text-white/80">
          {generationPhase.thinkingTime || 0}s
        </span>
      </motion.div>
    );
  };



  // Render Status Message (during generation)
  const renderStatusMessage = () => {
    if (generationPhase?.plan && generationPhase.plan.length > 0) return null;
    if (generationPhase?.phase === 'thinking') return null;
    if (!generationPhase?.status && !statusMessage) return null;
    if (!isGenerating && !generationPhase?.status) return null;

    const currentStatus = generationPhase?.status || statusMessage;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary border border-border"
      >
        <div className="relative">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground/80 flex-1">
          {currentStatus}
        </span>
        {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </motion.div>
    );
  };

  // Handle rollback action
  const handleRollbackClick = async () => {
    if (rollbackVersionId === null) return;
    setIsRollingBack(true);
    try {
      await onRollback?.(rollbackVersionId);
    } finally {
      setIsRollingBack(false);
      setRollbackVersionId(null);
    }
  };

  // Render Version Card for a specific message
  const renderVersionCard = (version: ProjectVersion, isActive: boolean, isLatest: boolean = false) => {
    return (
      <div className="relative group">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectVersion?.(version)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${isActive
            ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20'
            : 'bg-secondary border border-border hover:border-foreground/20'
            }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {version.name || `${t('chat.version')} ${version.versionNumber}`}
            </p>
            <p className={`text-xs mt-0.5 ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
              {t('chat.version')} {version.versionNumber}{isActive && ` • ${t('chat.active')}`}
            </p>
          </div>

          {/* Rollback button - only for non-latest versions */}
          {!isLatest && onRollback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRollbackVersionId(version.versionNumber);
              }}
              className="p-2 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
              title={t('chat.rollback')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
        </motion.div>
      </div>
    );
  };

  // Streaming summary component
  const StreamingSummary: React.FC<{ text: string; isNew?: boolean }> = ({ text, isNew = false }) => {
    const [displayedLength, setDisplayedLength] = useState(isNew ? 0 : text.length);
    const [isComplete, setIsComplete] = useState(!isNew);

    useEffect(() => {
      if (!isNew || isComplete) return;
      
      const totalLength = text.length;
      if (displayedLength >= totalLength) {
        setIsComplete(true);
        return;
      }

      // Speed: ~15 chars per tick for smooth streaming
      const timer = setTimeout(() => {
        setDisplayedLength(prev => Math.min(prev + 8, totalLength));
      }, 12);

      return () => clearTimeout(timer);
    }, [displayedLength, text, isNew, isComplete]);

    const visibleText = text.slice(0, displayedLength);

    return (
      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap" dir="auto">
        {visibleText}
        {!isComplete && (
          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    );
  };

  // Format summary: ensure each ✅ item is on its own line
  const formatSummary = (raw: string): string => {
    let text = raw.replace(/^✅\s*/, '').trim();
    // Split on ✅ and rejoin with newlines
    text = text.replace(/\s*✅\s*/g, '\n✅ ').trim();
    // Ensure first item starts with ✅ if it has numbered items
    if (!text.startsWith('✅')) {
      // Check if it's a multi-line summary with numbered items
      const lines = text.split('\n');
      if (lines.length > 1) {
        text = lines.map(l => l.trim()).filter(Boolean).join('\n');
      }
    }
    return text;
  };

  // Render Summary Block
  const renderSummaryBlock = (summary: string | null, _activities: FileActivity[], isStreaming: boolean = false) => {
    if (!summary) return null;

    const formatted = formatSummary(summary);
    if (!formatted) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 py-3 px-4 rounded-lg bg-secondary/50 border border-border/50"
      >
        <StreamingSummary text={formatted} isNew={isStreaming} />
      </motion.div>
    );
  };

  // Render Success message + Version card for completed generation
  const renderCompletionBlock = (version?: ProjectVersion, isActive?: boolean, isLatest?: boolean) => {
    const isLatestVersion = versions.length > 0 && version?.versionNumber === Math.max(...versions.map(v => v.versionNumber));

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 space-y-3"
      >
        {/* Success message - only for latest version */}
        {isLatest && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm text-foreground font-medium">{t('chat.readyMessage')}</span>
          </div>
        )}

        {/* Version Card - Blue for current, gray for past */}
        {version && renderVersionCard(version, isActive || false, isLatestVersion)}
      </motion.div>
    );
  };

  // Render Suggestions - Horizontal layout, max 3
  const renderSuggestions = () => {
    if (suggestions.length === 0 || isGenerating) return null;

    const displaySuggestions = suggestions.slice(0, 3);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-3 flex-nowrap overflow-x-auto no-scrollbar"
      >
        {displaySuggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSuggestionClick(suggestion)}
            className="flex-shrink-0 px-3 py-1.5 text-xs bg-secondary hover:bg-accent border border-border rounded-full text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
          >
            {suggestion.label}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  const showEmptyState = messages.length === 0 && !isGenerating && !generationPhase;

  // Group messages with their associated versions
  const getMessagesWithVersions = (): { msg: ChatMessage; version?: ProjectVersion; isLastAssistant: boolean; msgIndex: number }[] => {
    const result: { msg: ChatMessage; version?: ProjectVersion; isLastAssistant: boolean; msgIndex: number }[] = [];
    const lastAssistantIndex = messages.reduce((last, msg, i) => msg.role === 'assistant' ? i : last, -1);

    // Sort versions by versionNumber ascending for mapping
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    // Match versions to assistant messages by timestamp proximity
    // Each version is assigned to the closest assistant message that came before it
    const versionAssignments = new Map<number, ProjectVersion>();
    
    const assistantMessages = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.role === 'assistant');

    // Map versions to assistant messages
    // Each version should be assigned to the assistant message that triggered its creation
    // We match by finding the assistant message whose creation time is closest to (and before) the version creation time
    for (const version of sortedVersions) {
      const versionTime = new Date(version.createdAt).getTime();
      let bestMatchIdx: number | null = null;
      let minDiff = Infinity;

      for (const { msg, idx } of assistantMessages) {
        const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
        const diff = versionTime - msgTime;
        
        // Version must be created AFTER the message (or within a very small overlap)
        // We use a small buffer (5000ms) for clock drift or DB lag
        if (diff >= -5000 && diff < minDiff) {
          minDiff = diff;
          bestMatchIdx = idx;
        }
      }

      if (bestMatchIdx !== null) {
        versionAssignments.set(bestMatchIdx, version);
      }
    }

    messages.forEach((msg, msgIndex) => {
      if (msg.role === 'assistant') {
        const version = versionAssignments.get(msgIndex);
        const noUserMessagesAfter = !messages.slice(msgIndex + 1).some(m => m.role === 'user');
        const isLastAssistantActive = msgIndex === lastAssistantIndex && noUserMessagesAfter;
        result.push({ msg, version, isLastAssistant: isLastAssistantActive, msgIndex });
      } else {
        result.push({ msg, version: undefined, isLastAssistant: false, msgIndex });
      }
    });

    return result;
  };

  const messagesWithVersions = getMessagesWithVersions();

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0">
        {showEmptyState ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 opacity-40">
              <VivoraLogo size="md" showText={false} className="justify-center" />
            </div>
            <p className="text-muted-foreground text-lg">Your preview will appear here</p>
          </div>
        ) : (
          <>
            {messagesWithVersions.map(({ msg, version, isLastAssistant, msgIndex }) => {
              const isUser = msg.role === 'user';

              const prevMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
              const showHeader = !prevMsg || prevMsg.role !== msg.role;

              const cleanedContent = !isUser ? cleanAIMessage(msg.content) : null;
              const hasContent = isUser || (cleanedContent && cleanedContent.length > 0);

              // Extract plan from this message
              const messagePlan = !isUser ? extractBuildingPlan(msg.content) : [];

              // Get activities for this version from stored data
              const versionActivities: FileActivity[] = version?.actionsTaken
                ? (version.actionsTaken as unknown as FileActivity[])
                : (msg.actionsTaken ? (msg.actionsTaken as unknown as FileActivity[]) : []);

              // Check if this version is the currently active one
              const isActiveVersion = currentVersion === version?.versionNumber ||
                (!currentVersion && version?.versionNumber === versions[0]?.versionNumber);

              return (
                <div key={msg.id} className="flex w-full justify-start">
                  {isUser ? (
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-[15px] break-words whitespace-pre-wrap overflow-hidden bg-secondary text-foreground ml-auto">
                      {msg.imageUrl && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {msg.imageUrl.split(',').map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Attached ${i + 1}`}
                              className="max-w-full max-h-48 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full flex flex-col min-w-0 group">
                      {showHeader && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <VivoraLogo size="sm" className="text-foreground" />
                          </div>
                        </div>
                      )}
                      <div className="break-words overflow-hidden w-full">
                        {hasContent && cleanedContent && (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80">
                            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
                          </div>
                        )}



                        {/* Show current generation state only for last message */}
                        {isLastAssistant && (
                          <>
                            {renderThinkingIndicator()}
                            {renderStatusMessage()}
                            {isGenerating && fileActivities.length > 0 && renderFileActivityPanelForMessage(msg.id, fileActivities, true)}
                          </>
                        )}

                        {/* Summary after live generation completes */}
                        {isLastAssistant && !isGenerating && generationPhase?.phase === 'complete' && generationPhase?.summary && versionActivities.length === 0 && (
                          renderSummaryBlock(generationPhase.summary, [], true)
                        )}

                        {/* Show stored activities for completed versions - always visible */}
                        {versionActivities.length > 0 && (
                          renderFileActivityPanelForMessage(msg.id, versionActivities, false)
                        )}

                        {/* Summary block - after activities, before version card */}
                        {!isGenerating && versionActivities.length > 0 && (
                          renderSummaryBlock(extractSummaryFromMessage(msg.content), versionActivities)
                        )}

                        {/* Show version card for message */}
                        {version && (
                          renderCompletionBlock(version, isActiveVersion, isLastAssistant)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show generation UI when generating and no assistant message yet */}
            {isGenerating && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') && (
              <div className="flex w-full justify-start">
                <div className="w-full flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <VivoraLogo size="sm" className="text-foreground" />
                  </div>
                  <div className="space-y-4">
                    {renderThinkingIndicator()}
                    {/* Plan section removed to avoid duplication */}
                    {renderStatusMessage()}
                    {fileActivities.length > 0 && renderFileActivityPanelForMessage('live', fileActivities, true)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area - Matching test.tsx exactly */}
      <div
        className={`shrink-0 p-4 pt-2 pb-[env(safe-area-inset-bottom,24px)] md:pb-4 border-t bg-card border-border transition-colors ${isDragging ? 'bg-primary/5' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="text-primary font-medium flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <span>{t('home.dropImage')}</span>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {renderSuggestions()}

        {uploadedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative">
                {img.file.type.startsWith('image/') ? (
                  <img
                    src={img.preview}
                    alt={`Upload preview ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="h-16 w-auto min-w-[64px] px-3 flex flex-col items-center justify-center rounded-lg border border-border bg-secondary">
                    <File className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{img.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeUploadedImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Input Container - test.tsx style */}
          <div className="max-w-3xl mx-auto rounded-2xl border shadow-sm flex items-end p-2 transition-colors bg-secondary border-border">
            {/* Plus Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 ml-1 transition-colors bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className={`w-5 h-5 transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
              </button>

              <AnimatePresence>
                {showPlusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-56 bg-card rounded-xl overflow-hidden shadow-2xl z-50 border border-border"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPaidPlan) {
                          toast({ title: t('common.upgradeRequired') || 'Upgrade Required', description: t('common.upgradeToUpload') || 'Image upload is available on paid plans only.', variant: 'destructive' });
                          setShowPlusMenu(false);
                          return;
                        }
                        fileInputRef.current?.click();
                        setShowPlusMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left text-muted-foreground hover:text-foreground"
                    >
                      {isPaidPlan ? <ImageIcon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span className="text-sm">{t('chat.uploadImage')}</span>
                      {!isPaidPlan && <span className="text-[10px] text-amber-500 ml-auto">PRO</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPaidPlan) {
                          toast({ title: t('common.upgradeRequired') || 'Upgrade Required', description: t('common.upgradeToUpload') || 'File upload is available on paid plans only.', variant: 'destructive' });
                          setShowPlusMenu(false);
                          return;
                        }
                        docInputRef.current?.click();
                        setShowPlusMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left text-muted-foreground hover:text-foreground border-t border-border"
                    >
                      {isPaidPlan ? <File className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span className="text-sm">{t('chat.uploadFile') || 'Upload File (PDF, Excel, Font)'}</span>
                      {!isPaidPlan && <span className="text-[10px] text-amber-500 ml-auto">PRO</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Trigger visual edit mode - handled by parent
                        setShowPlusMenu(false);
                        // Dispatch custom event for parent to handle
                        window.dispatchEvent(new CustomEvent('open-visual-edit'));
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left text-muted-foreground hover:text-foreground border-t border-border"
                    >
                      <MousePointer className="w-4 h-4" />
                      <span className="text-sm">{t('chat.visualEdit')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.mp4,.webm,.ttf,.otf,.woff,.woff2"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
            </div>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isChatMode ? t('chat.planPlaceholder') : t('chat.placeholder')}
              disabled={isGenerating}
              className="flex-1 bg-transparent resize-none max-h-32 py-2.5 px-3 text-[15px] outline-none text-foreground placeholder-muted-foreground"
              rows={1}
              style={{ minHeight: '40px' }}
            />

            {/* Plan Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsChatMode(!isChatMode)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-xs transition-all shrink-0 mb-0.5 ${isChatMode
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">{t('chat.planMode')}</span>
            </button>

            {/* Send/Stop button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 mb-0.5 mr-1 transition-all"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <motion.button
                type="submit"
                disabled={!input.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 mr-1 transition-all ${input.trim()
                  ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90'
                  : 'bg-muted text-muted-foreground'
                  }`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </form>
      </div>

      {/* Rollback Confirmation Dialog */}
      {rollbackVersionId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('chat.rollbackConfirm')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('chat.rollbackDesc', { version: rollbackVersionId || '' })}
              <br /><br />
              <span className="text-destructive font-medium">
                {t('chat.rollbackWarning')}
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRollbackVersionId(null)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRollbackClick}
                disabled={isRollingBack}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-colors flex items-center gap-2"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rolling back...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    {t('chat.rollback')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
