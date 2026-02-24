import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Eye, LogOut, Moon, Sun, ChevronDown, Download, Clock, Pencil,
  Eye as EyeIcon, Upload, Coins, Database, GitBranch, Settings2,
  BookOpen, CreditCard, CircleHelp, Rocket, Monitor, FileArchive,
  Shield
} from 'lucide-react';
import githubLogo from '@/assets/logos/github.svg';
import { ChatView } from './ChatView';
import { CodeView } from './CodeView';
import { PreviewView } from './PreviewView';
import { VisualEditMode } from './VisualEditMode';
import { VercelDeployDialog } from './IntegrationDialogs';
import { GitHubPushDialog } from './GitHubPushDialog';
import { DatabasePanel } from './DatabasePanel';
import { DetailsPanel } from './DetailsPanel';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useVersions, type ProjectVersion } from '@/hooks/useVersions';
import { generateVersionName } from '@/services/versionNameService';
import type { ProjectData, ChatMessage, ViewType, ProjectFile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
// CreditWarningBanner removed

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
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
  isBackgroundProcessing?: boolean;
  backgroundJobStatus?: string;
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
  isBackgroundProcessing = false,
  backgroundJobStatus,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { userPlan, getRemainingCredits } = useUserPlan();
  const [currentView, setCurrentView] = useState<'code' | 'preview' | 'database' | 'details'>('preview');
  const [detailsVersion, setDetailsVersion] = useState<{ version: ProjectVersion; activities: any[] } | null>(null);
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
  const [showGitHubPush, setShowGitHubPush] = useState(false);
  const [gitHubRepoName, setGitHubRepoName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  // connectedRepoUrl removed
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [waitingForTest, setWaitingForTest] = useState(false);
  const pendingVersionRef = useRef<{ files: Record<string, ProjectFile>; messages: ChatMessage[]; activities: FileActivity[] } | null>(null);
  const isResizing = useRef(false);
  const prevIsGenerating = useRef(isGenerating);
  const versionCreatedForSession = useRef(false);
  const lastFileActivitiesRef = useRef<FileActivity[]>([]);

  // Versions hook
  const { versions, fetchVersions, createVersion, rollbackToVersion } = useVersions(project?.id || null);

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
        const isFirstVersion = versions.length === 0;

        if (isFirstVersion) {
          // Save version immediately (no more screenshot test blocking)
          const createFirstVersion = async () => {
            const versionNumber = 1;
            const projectDescription = project.description || project.name || '';
            const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

            const versionName = await generateVersionName(
              projectDescription,
              lastUserMessage,
              versionNumber
            );

            await createVersion(
              project.files,
              messages,
              versionName,
              lastFileActivitiesRef.current.length > 0 ? lastFileActivitiesRef.current : undefined
            );
            setCurrentVersionNumber(null);
            versionCreatedForSession.current = true;
          };

          createFirstVersion();
        } else {
          // For subsequent versions, save immediately (no test)
          const createVersionWithAIName = async () => {
            const versionNumber = versions.length + 1;
            const projectDescription = project.description || project.name || '';
            const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

            const versionName = await generateVersionName(
              projectDescription,
              lastUserMessage,
              versionNumber
            );

            const alreadyExists = versions.some(v => 
              v.chatMessages.length === messages.length && 
              JSON.stringify(v.files) === JSON.stringify(project.files)
            );

            if (!alreadyExists) {
              await createVersion(
                project.files,
                messages,
                versionName,
                lastFileActivitiesRef.current.length > 0 ? lastFileActivitiesRef.current : undefined
              );
            }
            setCurrentVersionNumber(null);
            versionCreatedForSession.current = true;
          };

          createVersionWithAIName();
        }
      }
    }

    if (!wasGenerating && isGenerating) {
      versionCreatedForSession.current = false;
    }

    prevIsGenerating.current = isGenerating;
  }, [isGenerating, messages, project?.files, project?.description, project?.name, createVersion, versions.length, isChatMode]);

  // Handle test completion - save pending version
  const handleTestComplete = useCallback(async (passed: boolean) => {
    if (!waitingForTest || !pendingVersionRef.current) return;
    
    const pending = pendingVersionRef.current;
    const versionNumber = versions.length + 1;
    const projectDescription = project?.description || project?.name || '';
    const lastUserMessage = pending.messages.filter(m => m.role === 'user').pop()?.content || '';

    const versionName = await generateVersionName(
      projectDescription,
      lastUserMessage,
      versionNumber
    );

    await createVersion(
      pending.files,
      pending.messages,
      versionName,
      pending.activities.length > 0 ? pending.activities : undefined
    );

    setCurrentVersionNumber(null);
    setWaitingForTest(false);
    pendingVersionRef.current = null;
  }, [waitingForTest, versions.length, project?.description, project?.name, createVersion]);

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

  // Handle show details in right panel
  const handleShowDetails = useCallback((version: ProjectVersion, activities: any[]) => {
    setDetailsVersion({ version, activities });
    setCurrentView('details');
  }, []);

  // Handle image upload to Cloudflare R2 via edge function
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        console.error('Error uploading file:', await res.text());
        return null;
      }

      const result = await res.json();
      const publicUrl = result.url;

      // For non-image files, prefix with file type info so the AI knows what it is
      if (!file.type.startsWith('image/')) {
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
      {/* Header - Bolt Style */}
      <header className={`h-14 flex items-center justify-between px-3 md:px-4 bg-card border-b border-border/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Left Section */}
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={handleLogoClick} className="hover:opacity-80 transition-all duration-200 hover:scale-105">
            <VivoraLogo
              size="sm"
              showText={false}
              className={isRTL ? 'rotate-180' : ''}
            />
          </button>

          <div className="h-5 w-px bg-border/60" />

          {/* Project Name Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-accent/80 transition-all duration-200 group"
            >
              <span className="text-sm font-semibold text-foreground truncate max-w-[200px] md:max-w-[280px]">
                {displayProjectName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <AnimatePresence>
              {showProjectMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowProjectMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-2 w-60 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-[9999]`}
                  >
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setShowProjectMenu(false);
                          setShowRenameDialog(true);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t('editor.rename')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProjectMenu(false);
                          window.location.href = `/projects/${project?.id}/settings`;
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">Project Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          handleDownload();
                          setShowProjectMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <FileArchive className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t('editor.export')}</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - View Toggle */}
        <div className={`hidden md:flex items-center bg-secondary/80 rounded-xl p-0.5 border border-border/40 absolute left-1/2 transform -translate-x-1/2`}>
          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${currentView === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('editor.preview')}</span>
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${currentView === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t('editor.code')}</span>
          </button>
          <button
            onClick={() => setCurrentView('database')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${currentView === 'database' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DB</span>
          </button>
        </div>

        {/* Right Section */}
        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!project || Object.keys(project.files).length === 0}
            className="p-2 rounded-xl hover:bg-accent/80 transition-all duration-200 disabled:opacity-40 text-muted-foreground hover:text-foreground"
            title={t('editor.download')}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* GitHub */}
          <motion.button
            onClick={() => setShowGitHubPush(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/60 bg-secondary/60 hover:bg-secondary text-foreground text-sm font-semibold transition-all duration-200 shadow-sm"
            title="Push to GitHub"
          >
            <img src={githubLogo} alt="GitHub" className="w-4 h-4 dark:invert" />
            <span className="hidden lg:inline">GitHub</span>
          </motion.button>

          {/* Publish */}
          <motion.button
            onClick={() => setShowVercelDialog(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 shadow-md shadow-primary/20 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Rocket className="w-3.5 h-3.5" />
            {t('editor.publish')}
          </motion.button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden ring-2 ring-border/40 hover:ring-primary/30 transition-all duration-200"
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="" 
                  className="w-full h-full object-cover rounded-xl" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) parent.innerText = user?.email?.[0].toUpperCase() || 'U';
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
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-64 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-[9999]`}
                  >
                    {/* User Info Header */}
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden ring-2 ring-primary/20">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            user?.email?.[0].toUpperCase()
                          )}
                        </div>
                        <div className={`min-w-0 ${isRTL ? 'text-right' : ''}`}>
                          <p className="text-sm font-semibold text-foreground truncate">{user?.displayName || user?.email}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credits */}
                    {userPlan && (
                      <div className="px-4 py-3 border-b border-border/40 bg-accent/30">
                        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-xs font-semibold text-foreground">Credits</span>
                          </div>
                          <span className="text-xs font-bold text-yellow-500">
                            {getRemainingCredits().total.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (getRemainingCredits().total / (userPlan.dailyCredits + PLAN_CONFIG[userPlan.plan].monthlyCredits || 5)) * 100)}%`
                            }}
                          />
                        </div>
                        <div className={`flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>Daily: {getRemainingCredits().daily.toFixed(1)}</span>
                          <span>Monthly: {getRemainingCredits().monthly.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Settings2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">{t('common.settings')}</span>
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/docs'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t('nav.docs')}</span>
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/pricing'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t('nav.pricing')}</span>
                      </button>

                      <div className="my-1 mx-3 border-t border-border/40" />

                      {/* Theme */}
                      <button
                        onClick={() => toggleTheme()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/80 rounded-xl transition-all duration-200 text-sm text-foreground ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-muted-foreground" /> : theme === 'light' ? <Sun className="w-3.5 h-3.5 text-muted-foreground" /> : <Monitor className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <span className="font-medium">{t('common.theme')}</span>
                        <span className={`text-[11px] text-muted-foreground bg-accent px-2 py-0.5 rounded-md capitalize ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{theme}</span>
                      </button>

                      <div className="my-1 mx-3 border-t border-border/40" />

                      <button
                        onClick={() => signOut()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 rounded-xl transition-all duration-200 text-sm text-destructive ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">{t('common.signOut')}</span>
                      </button>
                    </div>
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
                onShowDetails={handleShowDetails}
                waitingForTest={waitingForTest}
                projectFiles={project?.files || {}}
              />
            </div>

            {/* Resize Handle */}
            <div
              className="w-1 bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors"
              onMouseDown={handleResizeStart}
            />

            {/* Main Panel */}
            <div className="flex-1 overflow-hidden relative">
              <div className={`h-full ${currentView === 'preview' && !showVisualEdit ? 'block' : 'hidden'}`}>
                <PreviewView
                  files={project?.files || {}}
                  projectType={project?.projectType || 'vite'}
                  isLoading={isGenerating && !isChatMode}
                  onPreviewError={(errorLog) => {
                    onSendMessage(`[AUTO-FIX] The preview has console errors. Please fix them:\n\n${errorLog}`, false);
                  }}
                  onPreviewUrlChange={(url) => setPreviewUrl(url)}
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
              {/* Database Tab */}
              {currentView === 'database' && !showVisualEdit && (
                <DatabasePanel projectId={project?.id || null} onSendMessage={onSendMessage} />
              )}
              {/* Details Tab - use live fileActivities during generation */}
              {currentView === 'details' && !showVisualEdit && detailsVersion && (
                <DetailsPanel
                  version={detailsVersion.version}
                  activities={isGenerating ? fileActivities : detailsVersion.activities}
                  onClose={() => setCurrentView('preview')}
                  isGenerating={isGenerating}
                />
              )}
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
              onShowDetails={handleShowDetails}
              waitingForTest={waitingForTest}
              projectFiles={project?.files || {}}
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
                onPreviewUrlChange={(url) => setPreviewUrl(url)}
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

      {/* Integration Dialogs */}
      <VercelDeployDialog
        open={showVercelDialog}
        onOpenChange={setShowVercelDialog}
        projectName={project?.name || 'untitled-project'}
        projectFiles={project?.files || {}}
        onDeployed={(url) => {
          setDeployedUrl(url);
        }}
        onSendErrorToChat={(errorLog) => {
          onSendMessage(`[AUTO-FIX] The deployment to Vercel failed. Please analyze the error log and fix any issues in the code:\n\n${errorLog}`, false);
        }}
        projectId={project?.id || null}
        existingVercelUrl={project?.vercelUrl || deployedUrl || null}
      />

      <GitHubPushDialog
        open={showGitHubPush}
        onOpenChange={setShowGitHubPush}
        projectName={project?.name || 'untitled-project'}
        projectFiles={project?.files || {}}
        projectId={project?.id || null}
        existingRepoUrl={project?.githubRepoUrl || null}
      />

      {/* Rename Dialog */}
      <AnimatePresence>
        {showRenameDialog && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setShowRenameDialog(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
            >
              <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/20 p-6 w-full max-w-md pointer-events-auto">
                <h2 className="text-lg font-bold text-foreground mb-1">{t('editor.rename')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{isRTL ? 'أدخل اسم جديد للمشروع' : 'Enter a new name for your project'}</p>
                <input
                  autoFocus
                  type="text"
                  defaultValue={displayProjectName}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const name = renameValue.trim() || displayProjectName;
                      onUpdateProject({ name, generatedName: name });
                      if (project?.id) {
                        supabase.from('projects').update({ name, generated_name: name }).eq('id', project.id).then(() => {});
                      }
                      setShowRenameDialog(false);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-secondary/80 border border-border/60 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 mb-4 transition-all duration-200"
                />
                <div className={`flex gap-2 justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setShowRenameDialog(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/80 transition-all duration-200 font-medium"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      const name = renameValue.trim() || displayProjectName;
                      onUpdateProject({ name, generatedName: name });
                      if (project?.id) {
                        supabase.from('projects').update({ name, generated_name: name }).eq('id', project.id).then(() => {});
                      }
                      setShowRenameDialog(false);
                    }}
                    className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold shadow-md shadow-primary/20"
                  >
                    {isRTL ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
