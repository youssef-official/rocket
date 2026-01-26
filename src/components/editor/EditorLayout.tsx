import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Eye, LogOut, 
  ChevronDown, Download, Home, ArrowLeft,
  GitBranch, Github, Share2, ExternalLink
} from 'lucide-react';
import { ChatView } from './ChatView';
import { CodeView } from './CodeView';
import { PreviewView } from './PreviewView';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useVersions, type ProjectVersion } from '@/hooks/useVersions';
import type { ProjectData, ChatMessage, ViewType, ProjectFile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

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

interface Suggestion {
  label: string;
  prompt: string;
}

interface EditorLayoutProps {
  project: ProjectData | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, isChatOnly?: boolean, imageUrl?: string) => void;
  isGenerating: boolean;
  onNewProject: () => void;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onViewDashboard?: () => void;
  streamingContent?: string;
  onVersionRestore?: (files: Record<string, ProjectFile>, messages: ChatMessage[]) => void;
  onGoHome?: () => void;
  fileActivities?: FileActivity[];
  generationPhase?: GenerationPhase | null;
  statusMessage?: string;
  onStop?: () => void;
  currentVersion?: number | null;
  isChatMode?: boolean;
  suggestions?: Suggestion[];
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  project,
  messages,
  onSendMessage,
  isGenerating,
  onNewProject,
  onUpdateProject,
  onViewDashboard,
  streamingContent,
  onVersionRestore,
  onGoHome,
  fileActivities = [],
  generationPhase,
  statusMessage,
  onStop,
  currentVersion,
  isChatMode = false,
  suggestions = [],
}) => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'code' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatWidth, setChatWidth] = useState(450);
  
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | null>(null);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const isResizing = useRef(false);
  const prevIsGenerating = useRef(isGenerating);
  const versionCreatedForSession = useRef(false);

  // Versions hook
  const { versions, fetchVersions, createVersion } = useVersions(project?.id || null);

  // Fetch versions when project changes
  useEffect(() => {
    if (project?.id) {
      fetchVersions();
      versionCreatedForSession.current = false;
    }
  }, [project?.id, fetchVersions]);

  // Auto-create version when generation completes
  useEffect(() => {
    const wasGenerating = prevIsGenerating.current;
    const nowNotGenerating = !isGenerating;
    
    if (wasGenerating && nowNotGenerating && project?.files && !versionCreatedForSession.current && !isChatMode) {
      const hasFiles = Object.keys(project.files).length > 0;
      const hasMessages = messages.length > 0;
      
      if (hasFiles && hasMessages) {
        const versionNames = [
          'Initial Build',
          'Feature Update',
          'UI Enhancement',
          'Bug Fixes',
          'Performance Boost',
          'Style Refresh',
          'Component Upgrade',
          'Layout Optimization',
        ];
        const versionName = versionNames[versions.length % versionNames.length];
        createVersion(project.files, messages, `${versionName} v${versions.length + 1}`);
        setCurrentVersionNumber(null);
        versionCreatedForSession.current = true;
      }
    }
    
    if (!wasGenerating && isGenerating) {
      versionCreatedForSession.current = false;
    }
    
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, messages, project?.files, createVersion, versions.length, isChatMode]);

  // Handle version selection
  const handleSelectVersion = (version: ProjectVersion) => {
    setCurrentVersionNumber(version.versionNumber);
    if (onVersionRestore) {
      onVersionRestore(version.files, version.chatMessages);
    }
  };

  // Handle image upload to Supabase storage
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }, []);

  // Handle panel resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = moveEvent.clientX;
      setChatWidth(Math.max(380, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle file updates
  const handleUpdateFile = (path: string, content: string) => {
    if (!project) return;
    const updatedFiles = {
      ...project.files,
      [path]: { ...project.files[path], content },
    };
    onUpdateProject({ files: updatedFiles });
  };

  // Download project as ZIP
  const handleDownload = async () => {
    if (!project) return;
    
    const zip = new JSZip();
    Object.entries(project.files).forEach(([path, file]) => {
      zip.file(path, file.content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayMessages = messages;

  // Apply dark mode always
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // State for mobile view
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'preview' | 'code'>('preview');

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a]">
      {/* Header - Bolt Style */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-[#1e1e1e]">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative">
            <RocketLogo 
              size="sm" 
              showText={false}
              onClick={() => setShowHomeDialog(!showHomeDialog)}
              className="cursor-pointer"
            />
            
            {/* Home dialog dropdown */}
            <AnimatePresence>
              {showHomeDialog && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 w-48 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowHomeDialog(false);
                      onGoHome?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-white"
                  >
                    <Home className="w-4 h-4" />
                    Go to Home
                  </button>
                  <button
                    onClick={() => {
                      setShowHomeDialog(false);
                      onNewProject();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm border-t border-white/10 text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    New Project
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-5 w-px bg-white/10" />

          {/* User Avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-[10px] font-medium text-white">
            {user?.email?.[0].toUpperCase()}
          </div>

          <ChevronDown className="w-3 h-3 text-white/40" />

          {/* Project Name with 2-letter badge */}
          {project && (
            <div className="flex items-center gap-2">
              {/* 2-Letter Badge */}
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-[10px] font-bold text-white shadow-lg">
                {project.name.length === 2 ? project.name : project.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-white/70 truncate max-w-[200px]">
                {project.description || project.name}
              </span>
            </div>
          )}
        </div>

        {/* Center - View Toggle (Bolt Style) */}
        <div className="hidden md:flex items-center bg-[#2a2a2a] rounded-full p-1 border border-white/10">
          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'preview'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'code'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Open in New Tab */}
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* GitHub Icon */}
          <button
            onClick={handleDownload}
            disabled={!project || Object.keys(project.files).length === 0}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 text-white/70 hover:text-white"
            title="Download ZIP"
          >
            <Github className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
            Share
          </button>

          {/* Publish Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            Publish
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-[10px] font-bold text-black"
            >
              {user?.email?.[0].toUpperCase()}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-[9999]"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium truncate text-white">{user?.email}</p>
                      <p className="text-xs text-white/50">Free Plan</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Panel Selector */}
      <div className="md:hidden flex items-center justify-center gap-1 p-2 border-b border-white/10 bg-[#1e1e1e]">
        <button
          onClick={() => setMobilePanel('chat')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-[#2a2a2a] text-white/70'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setMobilePanel('preview')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-[#2a2a2a] text-white/70'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setMobilePanel('code')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'code' ? 'bg-primary text-primary-foreground' : 'bg-[#2a2a2a] text-white/70'
          }`}
        >
          Code
        </button>
      </div>

      {/* Main Content - Desktop */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Chat Panel - Bolt Style */}
        <motion.div
          animate={{ width: chatWidth }}
          className="border-r border-white/10 flex-shrink-0 overflow-hidden bg-[#1a1a1a]"
        >
          <ChatView
            messages={displayMessages}
            onSendMessage={onSendMessage}
            isGenerating={isGenerating}
            fileActivities={fileActivities}
            generationPhase={generationPhase}
            statusMessage={statusMessage}
            onStop={onStop}
            currentVersion={currentVersion}
            onImageUpload={handleImageUpload}
            suggestions={suggestions}
            onOpenVersions={() => setShowVersionSelector(true)}
          />
        </motion.div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 bg-white/10 hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0"
        />

        {/* Right Panel - Code or Preview */}
        <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
          <AnimatePresence mode="wait">
            {currentView === 'code' && (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <CodeView files={project?.files || {}} selectedFile={selectedFile} onSelectFile={setSelectedFile} onUpdateFile={handleUpdateFile} streamingContent={streamingContent} isGenerating={isGenerating} />
              </motion.div>
            )}
            {currentView === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <PreviewView files={project?.files || {}} projectType={project?.projectType || 'vite'} isLoading={isGenerating} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Mobile */}
      <div className="flex-1 md:hidden overflow-hidden">
        {mobilePanel === 'chat' && (
          <ChatView messages={displayMessages} onSendMessage={onSendMessage} isGenerating={isGenerating} fileActivities={fileActivities} generationPhase={generationPhase} statusMessage={statusMessage} onStop={onStop} currentVersion={currentVersion} onImageUpload={handleImageUpload} suggestions={suggestions} onOpenVersions={() => setShowVersionSelector(true)} />
        )}
        {mobilePanel === 'preview' && (
          <PreviewView files={project?.files || {}} projectType={project?.projectType || 'vite'} isLoading={isGenerating} />
        )}
        {mobilePanel === 'code' && (
          <CodeView files={project?.files || {}} selectedFile={selectedFile} onSelectFile={setSelectedFile} onUpdateFile={handleUpdateFile} streamingContent={streamingContent} isGenerating={isGenerating} />
        )}
      </div>
    </div>
  );
};
