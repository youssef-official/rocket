import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Globe, LogOut, 
  ChevronDown, Download, Home, ArrowLeft,
  GitBranch
} from 'lucide-react';
import { ChatView } from './ChatView';
import { CodeView } from './CodeView';
import { PreviewView } from './PreviewView';
import { VersionSelector } from './VersionSelector';
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
  phase: 'planning' | 'designing' | 'generating' | 'complete';
  message: string;
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
}) => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'code' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  
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
      versionCreatedForSession.current = false; // Reset when project changes
    }
  }, [project?.id, fetchVersions]);

  // Auto-create version when generation completes (transition from generating to not generating)
  // BUT NOT in chat mode - chat mode should not create versions
  useEffect(() => {
    const wasGenerating = prevIsGenerating.current;
    const nowNotGenerating = !isGenerating;
    
    // Check if we just finished generating (was generating, now not)
    // Skip version creation if in chat mode
    if (wasGenerating && nowNotGenerating && project?.files && !versionCreatedForSession.current && !isChatMode) {
      const hasFiles = Object.keys(project.files).length > 0;
      const hasMessages = messages.length > 0;
      
      if (hasFiles && hasMessages) {
        // Generate smart version name
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
    
    // If we start generating again, allow new version to be created
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
      setChatWidth(Math.max(350, Math.min(600, newWidth)));
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

  // Use messages directly - streaming is now shown separately in ChatView
  const displayMessages = messages;

  // Apply dark mode always
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Get current version display
  const getVersionDisplay = () => {
    if (currentVersionNumber) {
      const version = versions.find(v => v.versionNumber === currentVersionNumber);
      return version?.name || `Version ${currentVersionNumber}`;
    }
    if (versions.length > 0) {
      return 'Previewing latest version';
    }
    return null;
  };

  const versionDisplay = getVersionDisplay();

  // State for mobile view
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'preview' | 'code'>('preview');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Clean and minimal */}
      <header className="h-12 md:h-14 border-b border-border flex items-center justify-between px-2 md:px-4 bg-card">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo with home navigation */}
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
                  className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowHomeDialog(false);
                      onGoHome?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-sm"
                  >
                    <Home className="w-4 h-4" />
                    Go to Home
                  </button>
                  <button
                    onClick={() => {
                      setShowHomeDialog(false);
                      onNewProject();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-sm border-t border-border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    New Project
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />

          {/* Project Name - hidden on mobile */}
          {project && (
            <div className="hidden md:flex items-center gap-3">
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {project.name.length > 30 ? project.name.slice(0, 30) + '...' : project.name}
              </span>
            </div>
          )}
        </div>

        {/* Center - Version Selector - hidden on mobile */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          {versions.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowVersionSelector(!showVersionSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
              >
                <GitBranch className="w-4 h-4 text-primary" />
                <span>
                  {currentVersionNumber 
                    ? `Version ${currentVersionNumber}`
                    : `Latest (v${versions[0]?.versionNumber || 1})`
                  }
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showVersionSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Version Dropdown */}
              <AnimatePresence>
                {showVersionSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-border bg-secondary/30">
                      <p className="text-sm font-semibold text-foreground">
                        Version History ({versions.length} versions)
                      </p>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                      {versions.map((version) => {
                        const isSelected = currentVersionNumber === version.versionNumber;
                        const isLatest = version.versionNumber === versions[0]?.versionNumber;
                        
                        return (
                          <button
                            key={version.id}
                            onClick={() => {
                              handleSelectVersion(version);
                              setShowVersionSelector(false);
                            }}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                              isSelected 
                                ? 'bg-primary/15 border-2 border-primary/30' 
                                : 'hover:bg-secondary border-2 border-transparent'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground'
                            }`}>
                              v{version.versionNumber}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                  {version.name || `Version ${version.versionNumber}`}
                                </p>
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-500 rounded">
                                    LATEST
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                                    VIEWING
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Object.keys(version.files).length} files • {version.chatMessages.length} messages
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
              <GitBranch className="w-4 h-4" />
              <span>No versions yet</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* View Toggle - Only Code and Preview - Desktop */}
          <div className="hidden md:flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setCurrentView('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setCurrentView('code')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Actions */}
          <button
            onClick={handleDownload}
            disabled={!project || Object.keys(project.files).length === 0}
            className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            title="Download ZIP"
          >
            <Download className="w-4 h-4" />
          </button>


          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {user?.email?.[0].toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Panel Selector */}
      <div className="md:hidden flex items-center justify-center gap-1 p-2 border-b border-border bg-card">
        <button
          onClick={() => setMobilePanel('chat')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setMobilePanel('preview')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setMobilePanel('code')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mobilePanel === 'code' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          Code
        </button>
      </div>

      {/* Main Content - Desktop */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Chat Panel */}
        <motion.div
          animate={{ width: chatWidth }}
          className="border-r border-border flex-shrink-0 overflow-hidden bg-background"
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
          />
        </motion.div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0"
        />

        {/* Right Panel - Code or Preview */}
        <div className="flex-1 overflow-hidden">
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
          <ChatView messages={displayMessages} onSendMessage={onSendMessage} isGenerating={isGenerating} fileActivities={fileActivities} generationPhase={generationPhase} statusMessage={statusMessage} onStop={onStop} currentVersion={currentVersion} onImageUpload={handleImageUpload} />
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
