import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronDown, Plus, StopCircle, Code2, FileCode, FileType, File, FileJson, CheckCircle2, Image as ImageIcon, X, Lightbulb, ListOrdered, Zap, Bookmark, Pencil, FileOutput, Package, MousePointer, MoreVertical, Eye, Lock, Trash2, FileSearch, Files, Sparkles, CircleDot, ArrowUp, Monitor, AtSign, Download, Copy, ThumbsUp, ThumbsDown, Check, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChatMessage } from '@/types';
import type { ProjectVersion } from '@/hooks/useVersions';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { useUserPlan } from '@/hooks/useUserPlan';
import { toast } from '@/hooks/use-toast';
import { VersionCardNew } from '@/components/editor/VersionCardNew';

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
  agentStep?: 'planning' | 'generating' | 'validating' | 'fixing' | 'streaming' | 'done' | 'error';
  agentConfidence?: number;
  agentIssuesCount?: number;
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
  onShowDetails?: (version: ProjectVersion, activities: FileActivity[]) => void;
  waitingForTest?: boolean;
  projectFiles?: Record<string, { content: string }>;
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
  
  if (trimmedS.startsWith('{') && (
    trimmedS.includes('"files"') || 
    trimmedS.includes('"src/') ||
    trimmedS.includes('"index.html"') ||
    trimmedS.includes('"actions_taken"')
  )) {
    return "";
  }
  
  if (trimmedS.startsWith('[') && trimmedS.endsWith(']')) {
    return "";
  }

  let cleaned = content;

  cleaned = cleaned.replace(/\{\s*"files"\s*:\s*\{[\s\S]*?\}\s*\}/g, '');
  cleaned = cleaned.replace(/\{\s*"actions_taken"\s*:\s*\[[\s\S]*?\]\s*\}/g, '');
  cleaned = cleaned.replace(/<FILE\s+path=("|')[^"']+\1>[\s\S]*?<\/FILE>/gi, '');
  cleaned = cleaned.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '');
  cleaned = cleaned.replace(/```(?:tsx?|jsx?|html|css)?\s*[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/\{\s*"files"\s*:\s*\{[\s\S]*$/g, '');
  cleaned = cleaned.replace(/\[\s*\{[\s\S]*$/g, '');
  cleaned = cleaned.replace(/<!--SUMMARY-->[\s\S]*?<!--\/SUMMARY-->/g, '');
  cleaned = cleaned.replace(/\*?\*?Summary:?\*?\*?[\s\S]*?(?=\*\*|$)/gi, '');
  cleaned = cleaned.replace(/✅[^\n]*/g, '');
  cleaned = cleaned.replace(/###?\s*\*?\*?What I['']?m Building.*?\*?\*?:?\s*/gi, '');
  cleaned = cleaned.replace(/###?\s*\*?\*?What I will build.*?\*?\*?:?\s*/gi, '');
  cleaned = cleaned.replace(/\*\*.*?Generating.*?\*\*/gi, '');
  cleaned = cleaned.replace(/Done!?\s*Generated\/modified\s*\d+\s*files?\s*(in background)?\.?\s*/gi, '');
  cleaned = cleaned.replace(/^-\s*(src\/|index\.html|public\/).+$/gm, '');
  cleaned = cleaned.replace(/\.\.\.\s*and\s*\d+\s*more\s*files?/gi, '');

  cleaned = cleaned.split('\n').filter(line => {
    const t = line.trim();
    if (t.startsWith('"') && (t.includes('src/') || t.includes('index.html'))) return false;
    if (t.startsWith('{') || t === '}' || t === '],') return false;
    if (t.startsWith('[') && t.includes('"')) return false;
    if (t.toLowerCase().startsWith('summary:')) return false;
    if (/^["']?(src\/|index\.html|package\.json|tailwind|vite)/.test(t)) return false;
    return true;
  }).join('\n');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
};

const extractSummaryFromMessage = (content: string): string | null => {
  if (!content) return null;
  const markerMatch = content.match(/<!--SUMMARY-->([\s\S]*?)<!--\/SUMMARY-->/);
  if (markerMatch) return markerMatch[1].trim();
  const legacyMatch = content.match(/✅[\s\S]*$/);
  return legacyMatch ? legacyMatch[0].trim() : null;
};

const extractBuildingPlan = (content: string): string[] => {
  if (!content) return [];
  const planMatch = content.match(/What I['']m Building:?[\s\S]*?\n([\s\S]*?)(?=\*\*|Now I['']ll|$)/i);
  if (!planMatch) return [];
  const planText = planMatch[1];
  const lines = planText.split('\n')
    .filter(line => /^\d+\.|^•|^\*|^-/.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*|^•\s*|^\*\s*|^-\s*/, '').trim())
    .filter(line => line.length > 0);
  return lines;
};

// Action icon mapping with better visual distinction
const getActionIcon = (action: string) => {
  switch (action) {
    case 'edited': return { Icon: Pencil, color: 'text-muted-foreground' };
    case 'created': return { Icon: Sparkles, color: 'text-muted-foreground' };
    case 'read': return { Icon: Eye, color: 'text-muted-foreground' };
    case 'deleted': return { Icon: Trash2, color: 'text-muted-foreground' };
    case 'analyzed_image': return { Icon: ImageIcon, color: 'text-muted-foreground' };
    default: return { Icon: FileOutput, color: 'text-muted-foreground' };
  }
};

const normalizePublicImageUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

// ═══════════════════════════════════════════════
// Feedback component for AI messages (like/dislike/copy/token info)
// ═══════════════════════════════════════════════
const MessageFeedback: React.FC<{ messageId: string; creditsUsed?: number; tokensUsed?: number; content: string }> = ({ messageId, creditsUsed, tokensUsed, content }) => {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing feedback from supabase
    supabase.from('message_feedback').select('feedback').eq('message_id', messageId).maybeSingle().then(({ data }) => {
      if (data?.feedback) setFeedback(data.feedback as 'like' | 'dislike');
    });
  }, [messageId]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleFeedback = async (type: 'like' | 'dislike') => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    try {
      if (newFeedback) {
        await supabase.from('message_feedback').upsert({ message_id: messageId, user_id: (await supabase.auth.getUser()).data.user?.id || '', feedback: newFeedback, project_id: null }, { onConflict: 'message_id,user_id' });
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) await supabase.from('message_feedback').delete().eq('message_id', messageId).eq('user_id', userId);
      }
    } catch (e) { console.error('Feedback error:', e); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate estimated tokens from content length if real tokens not available
  const displayTokens = tokensUsed || (content ? Math.round(content.length / 3.8) : 0);

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => handleFeedback('like')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'like' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-muted text-muted-foreground'}`}>
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => handleFeedback('dislike')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'dislike' ? 'bg-red-500/10 text-red-500' : 'hover:bg-muted text-muted-foreground'}`}>
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <div ref={menuRef} className="relative">
        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-1 w-48 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Points Consumption</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Site Credits</span>
                </div>
                <span className="text-xs font-bold text-amber-500">{creditsUsed !== undefined ? Number(creditsUsed).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs text-muted-foreground">AI Tokens</span>
                </div>
                <span className="text-xs font-bold text-purple-500">
                  {tokensUsed ? tokensUsed.toLocaleString() : `~${displayTokens.toLocaleString()}`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
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
  onRollback,
  onShowDetails,
  waitingForTest = false,
  projectFiles = {},
}) => {
  const { t } = useLanguage();
  const { userPlan } = useUserPlan();
  const isPaidPlan = userPlan?.plan && userPlan.plan !== 'free';
  const [input, setInput] = useState(() => localStorage.getItem('vivora_chat_input') || '');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [isChatMode, setIsChatMode] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; uploading: boolean; url?: string }[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rollbackVersionId, setRollbackVersionId] = useState<number | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [atFilter, setAtFilter] = useState('');
  const [referencedFiles, setReferencedFiles] = useState<string[]>([]);
  const [atMenuIndex, setAtMenuIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

    if (supportedFiles.length === 0) return;

    const newFiles = supportedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      uploading: true,
    }));

    setUploadedImages(prev => [...prev, ...newFiles]);

    // Upload each file immediately
    for (const entry of newFiles) {
      if (onImageUpload) {
        onImageUpload(entry.file).then(url => {
          const normalizedUrl = normalizePublicImageUrl(url || '');
          if (!normalizedUrl) {
            setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
            toast({ title: 'Upload failed', description: 'Could not upload file. Please try again.', variant: 'destructive' });
            return;
          }
          setUploadedImages(prev => prev.map(img => 
            img.file === entry.file ? { ...img, uploading: false, url: normalizedUrl } : img
          ));
        }).catch(() => {
          setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
          toast({ title: 'Upload failed', description: 'Could not upload file. Please try again.', variant: 'destructive' });
        });
      }
    }
  };

  // Persist chat input to localStorage
  useEffect(() => {
    localStorage.setItem('vivora_chat_input', input);
  }, [input]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, fileActivities, generationPhase, statusMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  // Get filtered project files for @ menu - show ALL files
  const allFileNames = Object.keys(projectFiles);
  const filteredFiles = atFilter
    ? allFileNames.filter(f => f.toLowerCase().includes(atFilter.toLowerCase())).slice(0, 20)
    : allFileNames.slice(0, 20);

  const handleAtSelect = (fileName: string) => {
    // Replace @query with just removing the @query from input (file goes to badges only)
    const atIndex = input.lastIndexOf('@');
    if (atIndex !== -1) {
      const before = input.slice(0, atIndex);
      setInput(before);
    }
    if (!referencedFiles.includes(fileName)) {
      setReferencedFiles(prev => [...prev, fileName]);
    }
    setShowAtMenu(false);
    setAtFilter('');
    setAtMenuIndex(0);
    textareaRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Detect @ trigger
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = value.slice(atIndex + 1);
      // Only show menu if @ is at start or preceded by space, and no space in the query
      const charBefore = atIndex > 0 ? value[atIndex - 1] : ' ';
      if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !afterAt.includes(' ')) {
        setAtFilter(afterAt);
        setShowAtMenu(true);
        setAtMenuIndex(0);
        return;
      }
    }
    setShowAtMenu(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      // Check if any images are still uploading
      const stillUploading = uploadedImages.some(img => img.uploading);
      if (stillUploading) return;

      const imageUrls = uploadedImages
        .map(img => normalizePublicImageUrl(img.url || ''))
        .filter((url): url is string => !!url);

      // Build message with referenced file paths (contents will be read by the model)
      let finalMessage = input.trim();
      if (referencedFiles.length > 0) {
        const refPaths = referencedFiles.map(f => `@${f}`).join(' ');
        finalMessage = `${finalMessage}\n\n[Referenced Files: ${refPaths}]\n\nPlease read and consider the following files before making changes:\n${referencedFiles.filter(f => projectFiles[f]).map(f => `--- @${f} ---\n${projectFiles[f].content}`).join('\n\n')}`;
      }

      onSendMessage(finalMessage, isChatMode, imageUrls.length > 0 ? imageUrls.join(',') : undefined);

      setInput('');
      localStorage.removeItem('vivora_chat_input');
      setUploadedImages([]);
      setReferencedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAtMenu && filteredFiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAtMenuIndex(prev => (prev + 1) % filteredFiles.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAtMenuIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleAtSelect(filteredFiles[atMenuIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAtMenu(false);
        return;
      }
    }
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
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      uploading: true,
    }));

    setUploadedImages(prev => [...prev, ...newFiles]);
    setShowPlusMenu(false);

    // Upload each file immediately
    for (const entry of newFiles) {
      if (onImageUpload) {
        onImageUpload(entry.file).then(url => {
          const normalizedUrl = normalizePublicImageUrl(url || '');
          if (!normalizedUrl) {
            setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
            toast({ title: 'Upload failed', description: 'Could not upload file. Please try again.', variant: 'destructive' });
            return;
          }
          setUploadedImages(prev => prev.map(img => 
            img.file === entry.file ? { ...img, uploading: false, url: normalizedUrl } : img
          ));
        }).catch(() => {
          setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
          toast({ title: 'Upload failed', description: 'Could not upload file. Please try again.', variant: 'destructive' });
        });
      }
    }
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

  const toggleActivities = (messageId: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const getVersionForMessageIndex = (msgIndex: number): ProjectVersion | undefined => {
    const messagesUpToHere = messages.slice(0, msgIndex + 1);
    const versionNumber = Math.floor(messagesUpToHere.filter(m => m.role === 'assistant').length);
    return versions.find(v => v.versionNumber === versionNumber);
  };

  // Render File Activity Panel
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
        {/* Header */}
        <button
          onClick={() => toggleActivities(messageId)}
          className="w-full flex items-center justify-between py-2.5 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            {isLive ? (
              <div className="relative">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-primary" />
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{actionsCount}</span> {t('chat.actionsTaken')}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* File List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="py-1 space-y-0.5">
                {files.map((file, i) => {
                  const isEditing = file.status === 'editing';
                  const actionLabel = t(`action.${file.action}`);
                  const { Icon: ActionIcon, color: actionColor } = getActionIcon(file.action);

                  return (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex items-center gap-3 py-2 px-2.5 rounded-lg transition-colors ${isEditing ? 'bg-primary/5' : 'hover:bg-secondary/50'}`}
                    >
                      {/* Action Icon */}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        isEditing ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                        <ActionIcon className={`w-3.5 h-3.5 ${isEditing ? 'text-primary' : actionColor}`} />
                      </div>

                      {/* Action Label */}
                      <span className={`text-xs font-medium flex-shrink-0 min-w-[60px] uppercase tracking-wide ${
                        isEditing ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {actionLabel}
                      </span>

                      {/* File Name */}
                      <span className={`text-sm font-mono truncate ${
                        isEditing ? 'text-primary' : 'text-foreground/70'
                      }`}>
                        {file.name}
                      </span>

                      {/* Loading indicator */}
                      {isEditing && (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-auto flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Build status */}
                {!isLive && files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 py-2 px-2.5 mt-1"
                  >
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
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

  // Render Thinking Indicator
  const renderThinkingIndicator = () => {
    if (!generationPhase || generationPhase.phase !== 'thinking') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-3"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-xl bg-yellow-400/15"
          />
        </div>
        <span className="text-sm font-semibold text-foreground/70 tabular-nums">
          {generationPhase.thinkingTime || 0}s
        </span>
      </motion.div>
    );
  };

  // Render Status Message
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
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground/80 flex-1">
          {currentStatus}
        </span>
        {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />}
      </motion.div>
    );
  };

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

      const timer = setTimeout(() => {
        setDisplayedLength(prev => Math.min(prev + 8, totalLength));
      }, 12);

      return () => clearTimeout(timer);
    }, [displayedLength, text, isNew, isComplete]);

    const visibleText = text.slice(0, displayedLength);
    const isRTL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(visibleText.slice(0, 50));

    return (
      <div className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {visibleText}
        {!isComplete && (
          <span className={`inline-block w-0.5 h-4 bg-primary animate-pulse ${isRTL ? 'mr-0.5' : 'ml-0.5'} align-middle`} />
        )}
      </div>
    );
  };

  const formatSummary = (raw: string): string => {
    let text = raw.replace(/^✅\s*/, '').trim();
    text = text.replace(/\s*✅\s*/g, '\n').trim();
    // Strip markdown bold/italic markers like ** and __
    text = text.replace(/\*\*([^*]*)\*\*/g, '$1');
    text = text.replace(/__([^_]*)__/g, '$1');
    text = text.replace(/\*([^*]*)\*/g, '$1');
    // Strip ### headings
    text = text.replace(/^#{1,6}\s+/gm, '');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.join('\n');
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
        className="mt-3 pl-2 border-l-2 border-primary/20"
      >
        <StreamingSummary text={formatted} isNew={isStreaming} />
      </motion.div>
    );
  };

  // Render Suggestions
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
            className="flex-shrink-0 px-3.5 py-2 text-xs font-medium bg-secondary/80 hover:bg-accent border border-border/50 rounded-xl text-muted-foreground hover:text-foreground transition-all whitespace-nowrap hover:border-primary/20 hover:shadow-sm"
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
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
    const versionAssignments = new Map<number, ProjectVersion>();
    const assistantMessages = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.role === 'assistant');

    for (const version of sortedVersions) {
      const versionTime = new Date(version.createdAt).getTime();
      let bestMatchIdx: number | null = null;
      let minDiff = Infinity;
      for (const { msg, idx } of assistantMessages) {
        const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
        const diff = versionTime - msgTime;
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
  const maxVersionNumber = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) : 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-editor-bg">
      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5 min-h-0">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 opacity-30">
              <VivoraLogo size="md" showText={false} className="justify-center" />
            </div>
            <p className="text-muted-foreground text-base font-medium">Your preview will appear here</p>
          </div>
        ) : (
          <>
            {messagesWithVersions.map(({ msg, version, isLastAssistant, msgIndex }) => {
              const isUser = msg.role === 'user';
              const prevMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
              const showHeader = !prevMsg || prevMsg.role !== msg.role;
              const cleanedContent = !isUser ? cleanAIMessage(msg.content) : null;
              const hasContent = isUser || (cleanedContent && cleanedContent.length > 0);

              const versionActivities: FileActivity[] = version?.actionsTaken
                ? (version.actionsTaken as unknown as FileActivity[])
                : (msg.actionsTaken ? (msg.actionsTaken as unknown as FileActivity[]) : []);

              const isActiveVersion = currentVersion === version?.versionNumber ||
                (!currentVersion && version?.versionNumber === versions[0]?.versionNumber);

              return (
                <div key={msg.id} className="flex w-full justify-start">
                  {isUser ? (
                    /* User message - refined bubble */
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md shadow-sm text-[15px] break-words whitespace-pre-wrap overflow-hidden bg-primary text-primary-foreground ml-auto">
                      {msg.imageUrl && (
                        <div className="mb-2 flex flex-wrap gap-2">
                         {msg.imageUrl
                            .split(',')
                            .map(url => normalizePublicImageUrl(url))
                            .filter(Boolean)
                            .map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Attached ${i + 1}`}
                                className="max-w-full max-h-64 rounded-lg object-contain ring-1 ring-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewImage(url)}
                              />
                            ))}
                        </div>
                      )}
                      {/* Render clone design as file badge, not inline text */}
                      {(() => {
                        const cloneMatch = msg.content.match(/^([\s\S]*?)\n\n📎 Clone Design: (.+)$/);
                        if (cloneMatch) {
                          return (
                            <>
                              {cloneMatch[1]}
                              <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 w-fit">
                                <Files className="w-4 h-4 text-purple-300 flex-shrink-0" />
                                <span className="text-xs text-white/70 truncate max-w-[200px]">Clone: {cloneMatch[2]}</span>
                              </div>
                            </>
                          );
                        }
                        return msg.content;
                      })()}
                    </div>
                  ) : (
                    /* AI message */
                    <div className="w-full flex flex-col min-w-0 group">
                      {showHeader && (
                        <div className="flex items-center gap-2 mb-3">
                          <VivoraLogo size="sm" showText={true} />
                        </div>
                      )}
                      <div className="break-words overflow-hidden w-full">
                        {hasContent && cleanedContent && (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 prose-a:text-primary">
                            <ReactMarkdown>{cleanedContent}</ReactMarkdown>
                          </div>
                        )}

                        {/* Show current generation state only for last message */}
                        {isLastAssistant && (
                          <>
                            {renderThinkingIndicator()}
                            {renderStatusMessage()}
                            {isGenerating && fileActivities.length > 0 && (
                              <div className="mt-4">
                              <VersionCardNew
                                  version={{
                                    id: 'live',
                                    projectId: '',
                                    userId: '',
                                    versionNumber: maxVersionNumber + 1,
                                    name: generationPhase?.status || statusMessage || 'Generating...',
                                    files: {} as any,
                                    chatMessages: [],
                                    createdAt: new Date().toISOString(),
                                  }}
                                  isActive={true}
                                  activities={fileActivities}
                                  onShowDetails={onShowDetails}
                                  isLatestVersion={true}
                                  isLive={true}
                                  liveStatus={generationPhase?.status || statusMessage}
                                  agentStep={generationPhase?.agentStep}
                                  agentConfidence={generationPhase?.agentConfidence}
                                  agentIssuesCount={generationPhase?.agentIssuesCount}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Version card */}
                        {version && !isGenerating && (
                          <div className="mt-4">
                            <VersionCardNew
                              version={version}
                              isActive={isActiveVersion}
                              activities={versionActivities}
                              onSelectVersion={onSelectVersion}
                              onRollback={(vn) => setRollbackVersionId(vn)}
                              onShowDetails={onShowDetails}
                              isLatestVersion={version.versionNumber === maxVersionNumber}
                            />
                          </div>
                        )}

                        {/* Summary after version card - delay until test completes */}
                        {isLastAssistant && !isGenerating && !waitingForTest && generationPhase?.phase === 'complete' && generationPhase?.summary && versionActivities.length === 0 && (
                          renderSummaryBlock(generationPhase.summary, [], true)
                        )}
                        {!isGenerating && !waitingForTest && versionActivities.length > 0 && (
                          renderSummaryBlock(extractSummaryFromMessage(msg.content), versionActivities)
                        )}

                        {/* Feedback + Ready message */}
                        {isLastAssistant && !isGenerating && version && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2"
                          >
                            <MessageFeedback messageId={msg.id} creditsUsed={msg.creditsUsed} tokensUsed={msg.tokensUsed} content={cleanedContent || msg.content} />
                            <div className="flex items-center gap-2 py-2.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-sm text-foreground font-medium">{t('chat.readyMessage')}</span>
                            </div>
                          </motion.div>
                        )}
                        {/* Non-last assistant messages also get feedback */}
                        {!isLastAssistant && !isUser && version && (
                          <MessageFeedback messageId={msg.id} creditsUsed={msg.creditsUsed} tokensUsed={msg.tokensUsed} content={cleanedContent || msg.content} />
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
                   <div className="flex items-center gap-2 mb-3">
                    <VivoraLogo size="sm" showText={true} />
                  </div>
                  <div className="space-y-4">
                    {renderThinkingIndicator()}
                    {renderStatusMessage()}
                    {fileActivities.length > 0 && (
                      <VersionCardNew
                        version={{
                          id: 'live-standalone',
                          projectId: '',
                          userId: '',
                          versionNumber: maxVersionNumber + 1,
                          name: generationPhase?.status || statusMessage || 'Generating...',
                          files: {} as any,
                          chatMessages: [],
                          createdAt: new Date().toISOString(),
                        }}
                        isActive={true}
                        activities={fileActivities}
                        onShowDetails={onShowDetails}
                        isLatestVersion={true}
                        isLive={true}
                        liveStatus={generationPhase?.status || statusMessage}
                        agentStep={generationPhase?.agentStep}
                        agentConfidence={generationPhase?.agentConfidence}
                        agentIssuesCount={generationPhase?.agentIssuesCount}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div
        className={`shrink-0 p-4 pt-2 pb-[env(safe-area-inset-bottom,24px)] md:pb-4 border-t bg-editor-bg border-border transition-colors ${isDragging ? 'bg-primary/5' : ''}`}
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
              <div key={index} className="relative group/upload">
                {img.file.type.startsWith('image/') ? (
                  <div className="relative h-16 w-16">
                    <img
                      src={img.preview}
                      alt={`Upload preview ${index + 1}`}
                      className={`h-16 w-16 object-cover rounded-xl border border-border shadow-sm transition-opacity ${img.uploading ? 'opacity-50' : ''}`}
                    />
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`relative h-16 w-auto min-w-[64px] px-3 flex flex-col items-center justify-center rounded-xl border border-border bg-secondary shadow-sm ${img.uploading ? 'opacity-50' : ''}`}>
                    <File className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{img.file.name}</span>
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeUploadedImage(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/upload:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground self-end mb-1">{uploadedImages.length}/5</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Input Container */}
          <div className="max-w-3xl mx-auto rounded-2xl border shadow-sm flex items-end flex-wrap p-1.5 transition-all bg-secondary/80 border-border focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 relative">
            {/* Plus Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-0.5 ml-0.5 transition-all ${
                  showPlusMenu 
                    ? 'bg-primary/10 text-primary rotate-45' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              <AnimatePresence>
                {showPlusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-56 bg-card rounded-xl overflow-hidden shadow-xl z-50 border border-border"
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
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        {isPaidPlan ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <span className="text-sm text-foreground/80 group-hover/item:text-foreground">{t('chat.uploadImage')}</span>
                      {!isPaidPlan && <span className="text-[10px] font-semibold text-amber-500 ml-auto px-1.5 py-0.5 rounded-md bg-amber-500/10">PRO</span>}
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
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left border-t border-border/50 group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        {isPaidPlan ? <File className="w-4 h-4 text-purple-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <span className="text-sm text-foreground/80 group-hover/item:text-foreground">{t('chat.uploadFile') || 'Upload File'}</span>
                      {!isPaidPlan && <span className="text-[10px] font-semibold text-amber-500 ml-auto px-1.5 py-0.5 rounded-md bg-amber-500/10">PRO</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlusMenu(false);
                        // Insert @ at cursor
                        setInput(prev => prev + '@');
                        setShowAtMenu(true);
                        setAtFilter('');
                        setTimeout(() => textareaRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left border-t border-border/50 group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <AtSign className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-sm text-foreground/80 group-hover/item:text-foreground">{t('chat.addReference')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlusMenu(false);
                        window.dispatchEvent(new CustomEvent('open-visual-edit'));
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left border-t border-border/50 group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <MousePointer className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm text-foreground/80 group-hover/item:text-foreground">{t('chat.visualEdit')}</span>
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

            {/* Referenced Files Badges */}
            {referencedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 w-full px-3 pt-2">
                {referencedFiles.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                    @{f}
                    <button type="button" onClick={() => setReferencedFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* @ Mention Dropdown */}
            <AnimatePresence>
              {showAtMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full left-2 right-2 mb-1 max-h-64 overflow-y-auto bg-card rounded-xl border border-border shadow-xl z-[60]"
                >
                  <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                    {t('chat.referenceFile')}
                  </div>
                  {filteredFiles.length > 0 ? filteredFiles.map((fileName, i) => {
                    const shortName = fileName.split('/').pop() || fileName;
                    const dir = fileName.includes('/') ? fileName.slice(0, fileName.lastIndexOf('/')) : '';
                    return (
                      <button
                        key={fileName}
                        onClick={() => handleAtSelect(fileName)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${i === atMenuIndex ? 'bg-accent' : 'hover:bg-accent/60'}`}
                      >
                        {getFileIcon(fileName)}
                        <span className="text-sm text-foreground truncate">{shortName}</span>
                        {dir && <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[120px]">{dir}</span>}
                      </button>
                    );
                  }) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No files found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isChatMode ? t('chat.planPlaceholder') : t('chat.placeholder')}
              disabled={false}
              className="flex-1 bg-transparent resize-none max-h-32 py-2.5 px-3 text-[15px] outline-none text-foreground placeholder-muted-foreground/60"
              rows={1}
              style={{ minHeight: '40px' }}
            />

            {/* Plan Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsChatMode(!isChatMode)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs transition-all shrink-0 mb-0.5 ${isChatMode
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center shrink-0 mb-0.5 mr-0.5 transition-all"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <motion.button
                type="submit"
                disabled={!input.trim() || uploadedImages.some(img => img.uploading)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-0.5 mr-0.5 transition-all ${input.trim() && !uploadedImages.some(img => img.uploading)
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
                  : 'bg-muted text-muted-foreground'
                  }`}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </form>
      </div>

      {/* Rollback Confirmation Dialog */}
      {rollbackVersionId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('chat.rollbackConfirm')}</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {t('chat.rollbackDesc', { version: rollbackVersionId || '' })}
              <br /><br />
              <span className="text-destructive font-medium">
                {t('chat.rollbackWarning')}
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRollbackVersionId(null)}
                className="px-4 py-2.5 text-sm font-medium text-foreground bg-secondary hover:bg-accent rounded-xl transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRollbackClick}
                disabled={isRollingBack}
                className="px-4 py-2.5 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
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

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between w-full px-2">
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white">image.png</p>
                  <p className="text-xs">Image</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch(previewImage!);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'image.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch {
                        // fallback: open in new tab
                        window.open(previewImage!, '_blank');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(previewImage!);
                        const blob = await res.blob();
                        await navigator.clipboard.write([
                          new ClipboardItem({ [blob.type]: blob })
                        ]);
                        toast({ title: 'Image copied!' });
                      } catch {
                        // fallback: copy link
                        await navigator.clipboard.writeText(previewImage!);
                        toast({ title: 'Link copied!' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Image */}
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
