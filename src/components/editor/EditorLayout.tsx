import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Eye, LogOut, Settings, HelpCircle, CreditCard, Moon, Sun,
  ChevronDown, Download, Home, ArrowLeft, Clock, Pencil, Eye as EyeIcon,
  Github, FolderOpen
} from 'lucide-react';
import { ChatView } from './ChatView';
import { CodeView } from './CodeView';
import { PreviewView } from './PreviewView';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useVersions, type ProjectVersion } from '@/hooks/useVersions';
import { generateVersionName } from '@/services/versionNameService';
import type { ProjectData, ChatMessage, ViewType, ProjectFile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'code' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [chatWidth, setChatWidth] = useState(450);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | null>(null);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const isResizing = useRef(false);
  const prevIsGenerating = useRef(isGenerating);
  const versionCreatedForSession = useRef(false);
  const lastFileActivitiesRef = useRef<FileActivity[]>([]);

  // Versions hook
  const { versions, fetchVersions, createVersion } = useVersions(project?.id || null);

  // Track file activities for version
  useEffect(() => {
    if (fileActivities.length > 0) {
      lastFileActivitiesRef.current = [...fileActivities];
    }
  }, [fileActivities]);

  // Fetch versions when project changes
  useEffect(() => {
    if (project?.id) {
      fetchVersions();
      versionCreatedForSession.current = false;
    }
  }, [project?.id, fetchVersions]);

  // Auto-create version when generation completes - WITH actions_taken
  useEffect(() => {
    const wasGenerating = prevIsGenerating.current;
    const nowNotGenerating = !isGenerating;
    
    if (wasGenerating && nowNotGenerating && project?.files && !versionCreatedForSession.current && !isChatMode) {
      const hasFiles = Object.keys(project.files).length > 0;
      const hasMessages = messages.length > 0;
      
      if (hasFiles && hasMessages) {
        // Generate AI version name
        const createVersionWithAIName = async () => {
          const versionNumber = versions.length + 1;
          const projectDescription = project.description || project.name || '';
          const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
          
          // Generate descriptive name based on what was built
          const versionName = await generateVersionName(
            projectDescription,
            lastUserMessage,
            versionNumber
          );
          
          // Save version with actions_taken
          await createVersion(
            project.files, 
            messages, 
            versionName, 
            lastFileActivitiesRef.current.length > 0 ? lastFileActivitiesRef.current : undefined
          );
          setCurrentVersionNumber(null);
          versionCreatedForSession.current = true;
        };
        
        createVersionWithAIName();
      }
    }
    
    if (!wasGenerating && isGenerating) {
      versionCreatedForSession.current = false;
    }
    
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, messages, project?.files, project?.description, project?.name, createVersion, versions.length, isChatMode]);

  // Handle version selection - VIEW ONLY (no restore)
  const handleSelectVersion = (version: ProjectVersion) => {
    setCurrentVersionNumber(version.versionNumber);
    // Update files and switch to preview to show that version
    if (onVersionRestore) {
      onVersionRestore(version.files, messages); // Keep messages, just change files for preview
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

  // Handle logo click - navigate to home
  const handleLogoClick = () => {
    navigate('/');
  };

  const displayMessages = messages;

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    };
    
    applyTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  // State for mobile view
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'preview' | 'code'>('preview');

  // Get display name for project
  const displayProjectName = project?.generatedName || project?.name || 'Untitled Project';

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Bolt Style */}
      <header className="h-14 flex items-center justify-between px-4 bg-card">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Logo - Clickable to go home */}
          <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
            <RocketLogo 
              size="md" 
              showText={false}
            />
          </button>

          <div className="h-6 w-px bg-border" />

          {/* Project Name - Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-base font-bold text-foreground truncate max-w-[280px]">
                {displayProjectName}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {showProjectMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowProjectMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[9999]"
                  >
                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        onViewDashboard?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground"
                    >
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span>Open recent project</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto -rotate-90" />
                    </button>
                    <button
                      onClick={() => setShowProjectMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Version history</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto -rotate-90" />
                    </button>
                    <button
                      onClick={() => setShowProjectMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span>Rename...</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowProjectMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span>Export</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto -rotate-90" />
                    </button>
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
                      <EyeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Visibility</span>
                      <span className="text-xs text-muted-foreground ml-auto">Private</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - View Toggle (Bolt Style) - More to the left */}
        <div className="hidden md:flex items-center bg-secondary rounded-full p-1 border border-border absolute left-1/2 transform -translate-x-[calc(50%+120px)]">
          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'preview'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'code'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* GitHub Icon */}
          <button
            onClick={handleDownload}
            disabled={!project || Object.keys(project.files).length === 0}
            className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
            title="Download ZIP"
          >
            <Github className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button className="flex items-center gap-2 px-4 py-1.5 bg-secondary border border-border rounded-lg text-sm font-bold text-foreground hover:bg-accent transition-colors">
            Share
          </button>

          {/* Publish Button - White text, bold */}
          <button className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
            Publish
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-sm font-bold text-black"
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
                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[9999]"
                  >
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      <span>Help</span>
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>Subscription</span>
                    </button>
                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border"
                    >
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-muted-foreground" />
                      ) : theme === 'light' ? (
                        <Sun className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>Theme</span>
                      <span className="text-xs text-muted-foreground ml-auto capitalize">{theme}</span>
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors border-t border-border"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-around z-50">
          <button
            onClick={() => setMobilePanel('chat')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
              mobilePanel === 'chat' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            onClick={() => setMobilePanel('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
              mobilePanel === 'preview' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs">Preview</span>
          </button>
          <button
            onClick={() => setMobilePanel('code')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
              mobilePanel === 'code' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs">Code</span>
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Chat Panel */}
          <div 
            className="flex-shrink-0 border-r border-border"
            style={{ width: chatWidth }}
          >
            <ChatView
              messages={displayMessages}
              onSendMessage={onSendMessage}
              isGenerating={isGenerating}
              fileActivities={fileActivities}
              generationPhase={generationPhase}
              onStop={onStop}
              statusMessage={statusMessage}
              currentVersion={currentVersion}
              onImageUpload={handleImageUpload}
              suggestions={suggestions}
              versions={versions}
              onSelectVersion={handleSelectVersion}
            />
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors"
            onMouseDown={handleResizeStart}
          />

          {/* Main Panel - Code/Preview */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'preview' ? (
              <PreviewView 
                files={project?.files || {}} 
                projectType={project?.projectType || 'vite'}
                isLoading={isGenerating}
              />
            ) : (
              <CodeView
                files={project?.files || {}}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                onUpdateFile={handleUpdateFile}
              />
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex-1 overflow-hidden pb-14">
          {mobilePanel === 'chat' && (
            <ChatView
              messages={displayMessages}
              onSendMessage={onSendMessage}
              isGenerating={isGenerating}
              fileActivities={fileActivities}
              generationPhase={generationPhase}
              onStop={onStop}
              statusMessage={statusMessage}
              currentVersion={currentVersion}
              onImageUpload={handleImageUpload}
              suggestions={suggestions}
              versions={versions}
              onSelectVersion={handleSelectVersion}
            />
          )}
          {mobilePanel === 'preview' && (
            <PreviewView 
              files={project?.files || {}} 
              projectType={project?.projectType || 'vite'}
              isLoading={isGenerating}
            />
          )}
          {mobilePanel === 'code' && (
            <CodeView
              files={project?.files || {}}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onUpdateFile={handleUpdateFile}
            />
          )}
        </div>
      </div>
    </div>
  );
};
