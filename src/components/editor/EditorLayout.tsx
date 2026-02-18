import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Eye, LogOut, Settings, HelpCircle, CreditCard, Moon, Sun,
  ChevronDown, Download, Home, ArrowLeft, Clock, Pencil, Eye as EyeIcon,
  FolderOpen, Upload, Coins
} from 'lucide-react';
import { ChatView } from './ChatView';
import { CodeView } from './CodeView';
import { PreviewView } from './PreviewView';
import { VisualEditMode } from './VisualEditMode';
import { VercelDeployDialog } from './IntegrationDialogs';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useVersions, type ProjectVersion } from '@/hooks/useVersions';
import { generateVersionName } from '@/services/versionNameService';
import { useAutoRedeploy } from '@/hooks/useAutoRedeploy';
import type { ProjectData, ChatMessage, ViewType, ProjectFile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image';
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
  const { t, isRTL } = useLanguage();
  const { userPlan, getRemainingCredits } = useUserPlan();
  const [currentView, setCurrentView] = useState<'code' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [chatWidth, setChatWidth] = useState(450);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768);

  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | null>(null);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showVisualEdit, setShowVisualEdit] = useState(false);
  // GitHub removed - Vercel only
  const [showVercelDialog, setShowVercelDialog] = useState(false);
  // connectedRepoUrl removed
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const isResizing = useRef(false);
  const prevIsGenerating = useRef(isGenerating);
  const versionCreatedForSession = useRef(false);
  const lastFileActivitiesRef = useRef<FileActivity[]>([]);

  // Versions hook
  const { versions, fetchVersions, createVersion, rollbackToVersion } = useVersions(project?.id || null);

  // Auto-redeploy hook — re-publishes to Vivora/Vercel via Inngest background job
  const { triggerVivoraRedeploy, triggerVercelRedeploy } = useAutoRedeploy({
    projectId: project?.id || '',
    userId: user?.id,
  });

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

  // Refetch versions when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && project?.id) {
        fetchVersions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [project?.id, fetchVersions]);

  // Auto-create version when generation completes - WITH actions_taken
  useEffect(() => {
    const wasGenerating = prevIsGenerating.current;
    const nowNotGenerating = !isGenerating;

    if (wasGenerating && nowNotGenerating && project?.files && !versionCreatedForSession.current && !isChatMode) {
      const hasFiles = Object.keys(project.files).length > 0;
      const hasMessages = messages.length > 0;

      if (hasFiles && hasMessages) {
        // Generate AI version name + trigger auto-redeploy
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

          // Check if this version already exists (prevent duplicates)
          const alreadyExists = versions.some(v => 
            v.chatMessages.length === messages.length && 
            JSON.stringify(v.files) === JSON.stringify(project.files)
          );

          if (!alreadyExists) {
            // Save version with actions_taken
            await createVersion(
              project.files,
              messages,
              versionName,
              lastFileActivitiesRef.current.length > 0 ? lastFileActivitiesRef.current : undefined
            );

            // 🚀 Auto-redeploy to Vivora/Vercel if project was previously deployed
            triggerVivoraRedeploy(project.files);
            triggerVercelRedeploy(project.files, project.name);
          }
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

  // Handle version rollback
  const handleRollback = useCallback(async (versionNumber: number) => {
    const result = await rollbackToVersion(versionNumber);
    if (result && onVersionRestore) {
      onVersionRestore(result.files, result.messages);
      setCurrentVersionNumber(null);
    }
  }, [rollbackToVersion, onVersionRestore]);

  // Handle image upload to Supabase storage
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const bucket = file.type.startsWith('image/') ? 'chat-images' : 'chat-images';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // For non-image files, prefix with file type info so the AI knows what it is
      const publicUrl = urlData.publicUrl;
      if (!file.type.startsWith('image/')) {
        // Return URL with metadata prefix for context
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        return `[FILE:${ext}:${file.name}]${publicUrl}`;
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
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

  // Listen for visual edit trigger from ChatView
  useEffect(() => {
    const handleOpenVisualEdit = () => {
      setShowVisualEdit(true);
    };

    window.addEventListener('open-visual-edit', handleOpenVisualEdit);
    return () => window.removeEventListener('open-visual-edit', handleOpenVisualEdit);
  }, []);

  // Handle visual edit save - update project files and create a version
  const handleVisualEditSave = async (
    changes: { elementId: string; newContent: string; newStyles: any; position?: { x: number; y: number } }[],
    updatedFiles: Record<string, ProjectFile>,
    summary: string
  ) => {
    console.log('Visual edit changes:', changes);
    console.log('Updated files:', Object.keys(updatedFiles));

    // Update project files
    if (project && Object.keys(updatedFiles).length > 0) {
      onUpdateProject({ files: updatedFiles });

      // Create a new version with the visual changes
      await createVersion(
        updatedFiles,
        messages,
        summary || 'Visual Edit Changes',
        [{ name: 'Visual Edit', status: 'done', action: 'edited' }]
      );
    }

    setShowVisualEdit(false);
  };
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

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get display name for project
  const displayProjectName = project?.generatedName || project?.name || 'Untitled Project';

  // Visual Edit mode is now integrated into the main layout below

  return (
    <div className="h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* CreditWarningBanner removed */}
      {/* Header - Bolt Style */}
      <header className={`h-14 flex items-center justify-between px-4 bg-card ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Left Section */}
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo - Clickable to go home */}
          <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
            <VivoraLogo
              size="md"
              showText={false}
              className={isRTL ? 'rotate-180' : ''}
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
                    className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[9999]`}
                  >
                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        onViewDashboard?.();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{t('editor.openRecent')}</span>
                      <ChevronDown className={`w-3 h-3 text-muted-foreground ${isRTL ? 'mr-auto rotate-90' : 'ml-auto -rotate-90'}`} />
                    </button>
                    <button
                      onClick={() => setShowProjectMenu(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{t('editor.versionHistory')}</span>
                      <ChevronDown className={`w-3 h-3 text-muted-foreground ${isRTL ? 'mr-auto rotate-90' : 'ml-auto -rotate-90'}`} />
                    </button>
                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        const newName = prompt(isRTL ? 'أدخل اسم المشروع الجديد:' : 'Enter new project name:', displayProjectName);
                        if (newName && newName.trim()) {
                          onUpdateProject({ name: newName.trim(), generatedName: newName.trim() });
                          // Update in database
                          if (project?.id) {
                            supabase.from('projects').update({ name: newName.trim(), generated_name: newName.trim() }).eq('id', project.id).then(() => {});
                          }
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span>{t('editor.rename')}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowProjectMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span>{t('editor.export')}</span>
                      <ChevronDown className={`w-3 h-3 text-muted-foreground ${isRTL ? 'mr-auto rotate-90' : 'ml-auto -rotate-90'}`} />
                    </button>
                    <div className={`flex items-center gap-3 px-4 py-3 border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <EyeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{t('editor.visibility')}</span>
                      <span className={`text-xs text-muted-foreground ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{t('home.private')}</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - View Toggle (Bolt Style) - More to the left */}
        <div className={`hidden md:flex items-center bg-secondary rounded-full p-1 border border-border absolute left-1/2 transform -translate-x-1/2`}>
          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${currentView === 'preview'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('editor.preview')}</span>
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${currentView === 'code'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t('editor.code')}</span>
          </button>
        </div>

        {/* Right Section */}
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Credits Display Removed as requested */}

          {/* Download ZIP */}
          <button
            onClick={handleDownload}
            disabled={!project || Object.keys(project.files).length === 0}
            className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
            title={t('editor.download')}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button className={`flex items-center gap-2 px-4 py-1.5 bg-secondary border border-border rounded-lg text-sm font-bold text-foreground hover:bg-accent transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
            {t('editor.share')}
          </button>

          {/* Publish Button */}
          <button
            onClick={() => setShowVercelDialog(true)}
            className={`flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Upload className="w-4 h-4" />
            {t('editor.publish')}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-sm font-bold text-black overflow-hidden"
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="" 
                  className="w-full h-full object-cover rounded-full" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerText = user?.email?.[0].toUpperCase() || 'U';
                    }
                  }}
                />
              ) : (
                user?.email?.[0].toUpperCase()
              )}
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
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-[9999]`}
                  >
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>{t('common.settings')}</span>
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      <span>{t('nav.docs')}</span>
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{t('nav.pricing')}</span>
                    </button>
                    {/* Credits Display */}
                    {userPlan && (
                      <div className="px-4 py-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-foreground">Credits</span>
                          </div>
                          <span className="text-sm font-bold text-yellow-500">
                            {getRemainingCredits().total.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (getRemainingCredits().total / (userPlan.dailyCredits + PLAN_CONFIG[userPlan.plan].monthlyCredits || 5)) * 100)}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>Daily: {getRemainingCredits().daily.toFixed(1)}</span>
                          <span>Monthly: {getRemainingCredits().monthly.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        toggleTheme();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-sm text-foreground border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-muted-foreground" />
                      ) : theme === 'light' ? (
                        <Sun className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{t('common.theme')}</span>
                      <span className={`text-xs text-muted-foreground capitalize ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{theme}</span>
                    </button>
                    <button
                      onClick={() => signOut()}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors border-t border-border ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('common.signOut')}</span>
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
        <div className={`md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-around z-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setMobilePanel('chat')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${mobilePanel === 'chat' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs">{t('editor.chat')}</span>
          </button>
          <button
            onClick={() => setMobilePanel('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${mobilePanel === 'preview' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs">{t('editor.preview')}</span>
          </button>
          <button
            onClick={() => setMobilePanel('code')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${mobilePanel === 'code' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs">{t('editor.code')}</span>
          </button>
        </div>

        {!isMobileViewport ? (
          <div className="flex flex-1 overflow-hidden">
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
                currentVersion={currentVersionNumber ?? currentVersion}
                onImageUpload={handleImageUpload}
                suggestions={suggestions}
                versions={versions}
                onSelectVersion={handleSelectVersion}
                onRollback={handleRollback}
              />
            </div>

            {/* Resize Handle */}
            <div
              className="w-1 bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors"
              onMouseDown={handleResizeStart}
            />

            {/* Main Panel - keep preview mounted to preserve sandbox session */}
            <div className="flex-1 overflow-hidden relative">
              <div className={`h-full ${currentView === 'preview' && !showVisualEdit ? 'block' : 'hidden'}`}>
                <PreviewView
                  files={project?.files || {}}
                  projectType={project?.projectType || 'vite'}
                  isLoading={isGenerating && !isChatMode}
                  onPreviewError={(errorLog) => {
                    // Auto-send preview errors to AI for fixing
                    onSendMessage(`[AUTO-FIX] The preview has console errors. Please fix them:\n\n${errorLog}`, false);
                  }}
                />
              </div>

              <div className={`h-full ${currentView === 'code' && !showVisualEdit ? 'block' : 'hidden'}`}>
                <CodeView
                  files={project?.files || {}}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  onUpdateFile={handleUpdateFile}
                />
              </div>

              {showVisualEdit && (
                <div className="absolute inset-0 z-10 flex">
                  <VisualEditMode
                    projectFiles={project?.files || {}}
                    onSave={handleVisualEditSave}
                    onClose={() => setShowVisualEdit(false)}
                  />
                  <div className="flex-1" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden pb-14">
            {mobilePanel === 'chat' && (
            <ChatView
              messages={displayMessages}
              onSendMessage={onSendMessage}
              isGenerating={isGenerating}
              fileActivities={fileActivities}
              generationPhase={generationPhase}
              onStop={onStop}
              statusMessage={statusMessage}
              currentVersion={currentVersionNumber ?? currentVersion}
              onImageUpload={handleImageUpload}
              suggestions={suggestions}
              versions={versions}
              onSelectVersion={handleSelectVersion}
              onRollback={handleRollback}
            />
            )}

            <div className={`h-full ${mobilePanel === 'preview' ? 'block' : 'hidden'}`}>
              <PreviewView
                files={project?.files || {}}
                projectType={project?.projectType || 'vite'}
                isLoading={isGenerating && !isChatMode}
                onPreviewError={(errorLog) => {
                  onSendMessage(`[AUTO-FIX] The preview has console errors. Please fix them:\n\n${errorLog}`, false);
                }}
              />
            </div>

            <div className={`h-full ${mobilePanel === 'code' ? 'block' : 'hidden'}`}>
              <CodeView
                files={project?.files || {}}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                onUpdateFile={handleUpdateFile}
              />
            </div>
          </div>
        )}
      </div>

      {/* Integration Dialogs - Vercel only */}

      <VercelDeployDialog
        open={showVercelDialog}
        onOpenChange={setShowVercelDialog}
        projectName={project?.name || 'untitled-project'}
        projectFiles={project?.files || {}}
        onDeployed={setDeployedUrl}
        onSendErrorToChat={(errorLog) => {
          // Send the deploy error to the AI chat for auto-fix
          onSendMessage(`[AUTO-FIX] The deployment to Vercel failed. Please analyze the error log and fix any issues in the code:\n\n${errorLog}`, false);
        }}
      />
    </div>
  );
};
