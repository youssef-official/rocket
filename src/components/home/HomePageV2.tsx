import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Send, X, Image as ImageIcon, ChevronDown, Sparkles, BookOpen,
    CircleHelp, LogIn, Wand2, ArrowUpRight, Plus, Copy, Loader2, Mic, MicOff,
    Palette, Home, Search, FolderOpen, Star, UserCheck, Users2, ChevronRight,
    Zap, Gift
} from 'lucide-react';
import { UserMenuDropdown, getWallpaperSrc } from '@/components/shared/UserMenuDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TemplatesSection } from './TemplatesSection';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { FrameworkBar } from '@/components/shared/FrameworkLogos';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { SettingsModal } from '@/components/shared/SettingsModal';
import { NotificationInbox } from '@/components/shared/NotificationInbox';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { toast } from '@/hooks/use-toast';
import { useThemePreference } from '@/hooks/useThemePreference';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface Project {
    id: string;
    name: string;
    description?: string;
    projectType: 'vite' | 'html';
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

interface HomePageV2Props {
    onStartBuilding: (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageUrls?: string[]) => void;
    onViewDashboard?: () => void;
    onOpenProject?: (id: string) => void;
    onDeleteProject?: (id: string) => void;
    onForkProject?: (id: string) => void;
    onShowAuth?: () => void;
    projects?: Project[];
    projectsLoading?: boolean;
}

const MAX_PROMPT_LENGTH = 1000000;

export const HomePageV2: React.FC<HomePageV2Props> = ({
    onStartBuilding,
    onViewDashboard,
    onOpenProject,
    onDeleteProject,
    onForkProject,
    onShowAuth,
    projects = [],
    projectsLoading = false
}) => {
    const { user, signOut } = useAuth();
    const { t, isRTL, language } = useLanguage();
    const { theme } = useThemePreference();
    const { userPlan, shouldShowUpgradeBanner, canUsePrivateProjects, getRemainingCredits } = useUserPlan();
    const isPaidPlan = userPlan?.plan && userPlan.plan !== 'free';
    const navigate = useNavigate();

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Sidebar state
    const [sidebarActiveTab, setSidebarActiveTab] = useState<'home' | 'search' | 'resources'>('home');
    const [projectsFilter, setProjectsFilter] = useState<'all' | 'starred' | 'created' | 'shared'>('all');

    const [prompt, setPrompt] = useState(() => localStorage.getItem('vivora_home_prompt') || '');
    const [selectedFramework, setSelectedFramework] = useState('React');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isPublic] = useState(true);
    const [uploadedImages, setUploadedImages] = useState<{
        file: File;
        preview: string;
        uploading: boolean;
        url?: string;
    }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [cloneAttachment, setCloneAttachment] = useState<{ url: string; html: string } | null>(null);
    const [showCloneInput, setShowCloneInput] = useState(false);
    const [cloneUrl, setCloneUrl] = useState('');
    const [cloneLoading, setCloneLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Voice input state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const plusButtonRef = useRef<HTMLDivElement>(null);

    // Credits
    const remainingCredits = getRemainingCredits();
    const planConfig = userPlan ? (PLAN_CONFIG[userPlan.plan] || PLAN_CONFIG.free) : PLAN_CONFIG.free;

    // Persist prompt to localStorage
    useEffect(() => {
        localStorage.setItem('vivora_home_prompt', prompt);
    }, [prompt]);

    // Voice recognition handlers
    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: 'Not supported', description: 'Speech recognition is not supported in this browser.', variant: 'destructive' });
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        const langMap: Record<string, string> = { 'ar': 'ar-SA', 'zh': 'zh-CN', 'ja': 'ja-JP', 'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 'pt': 'pt-BR', 'ko': 'ko-KR', 'tr': 'tr-TR', 'hi': 'hi-IN', 'ru': 'ru-RU' };
        const browserLang = navigator.language || 'en-US';
        recognition.lang = langMap[language] || (browserLang.startsWith('ar') ? 'ar-SA' : browserLang);

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setPrompt(prev => {
                if (event.results[event.resultIndex]?.isFinal) {
                    return prev + transcript + ' ';
                }
                return prev;
            });
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [language]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Upload helpers
    const normalizePublicImageUrl = useCallback((url: string): string => {
        const trimmed = (url || '').trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed.replace(/^\/+/, '')}`;
    }, []);

    const uploadFileToR2 = useCallback(async (file: File) => {
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
            if (res.ok) {
                const result = await res.json();
                return normalizePublicImageUrl(result.url || '');
            }
            return null;
        } catch {
            return null;
        }
    }, [normalizePublicImageUrl]);

    const uploadImmediately = useCallback((files: File[]) => {
        const newEntries = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
        }));
        setUploadedImages(prev => [...prev, ...newEntries]);
        for (const entry of newEntries) {
            uploadFileToR2(entry.file).then(url => {
                if (!url) {
                    setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
                    toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
                    return;
                }
                setUploadedImages(prev => prev.map(img =>
                    img.file === entry.file ? { ...img, uploading: false, url } : img
                ));
            }).catch(() => {
                setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
            });
        }
    }, [uploadFileToR2]);

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (!isPaidPlan) { toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' }); return; }
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 5 - uploadedImages.length);
        if (files.length === 0) return;
        uploadImmediately(files);
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isPaidPlan) { toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' }); return; }
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).slice(0, 5 - uploadedImages.length);
        if (files.length === 0) return;
        uploadImmediately(files);
    };
    const removeUploadedImage = (index: number) => {
        setUploadedImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_PROMPT_LENGTH) setPrompt(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const stillUploading = uploadedImages.some(img => img.uploading);
        if (prompt.trim() && !isSubmitting && !stillUploading) {
            const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
            const urls = uploadedImages.map(img => normalizePublicImageUrl(img.url || '')).filter((u): u is string => !!u);
            if (uploadedImages.length > 0 && urls.length === 0) {
                toast({ title: 'Upload failed', description: 'Please re-upload your image.', variant: 'destructive' });
                return;
            }
            setIsSubmitting(true);
            localStorage.removeItem('vivora_home_prompt');
            onStartBuilding(prompt, projectType, undefined, urls.length > 0 ? urls : undefined);
        }
    };

    useEffect(() => {
        if (isSubmitting && cloneAttachment) {
            sessionStorage.setItem('pending_clone_data', JSON.stringify({ url: cloneAttachment.url, html: cloneAttachment.html }));
        }
    }, [isSubmitting, cloneAttachment]);

    // Recent projects (last 5)
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="h-screen flex overflow-hidden bg-[#0a0a0a]" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* ============================
          SIDEBAR
      ============================ */}
            <aside className={`hidden md:flex flex-col w-[240px] min-w-[240px] bg-[#111113] border-${isRTL ? 'l' : 'r'} border-white/[0.06] h-full`}>
                {/* Sidebar Header */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <VivoraLogo size="sm" showText={true} className="scale-90" />
                </div>

                {/* User Workspace */}
                <div className="px-3 py-2">
                    <button
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                        onClick={() => navigate('/settings')}
                    >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white/80 font-medium truncate flex-1 text-left">{displayName}'s Vivora</span>
                        <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-2 mt-1 space-y-0.5 overflow-y-auto">
                    <button
                        onClick={() => setSidebarActiveTab('home')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${sidebarActiveTab === 'home'
                                ? 'bg-white/[0.08] text-white font-medium'
                                : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                            } ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Home className="w-4 h-4" />
                        {t('nav.home') || 'Home'}
                    </button>
                    <button
                        onClick={() => setSidebarActiveTab('search')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${sidebarActiveTab === 'search'
                                ? 'bg-white/[0.08] text-white font-medium'
                                : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                            } ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                    <button
                        onClick={() => window.open('/docs', '_self')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Resources
                    </button>

                    {/* Projects Section */}
                    <div className="pt-4 pb-1 px-1">
                        <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">{t('nav.projects') || 'Projects'}</p>
                    </div>

                    <button
                        onClick={() => { setProjectsFilter('all'); navigate('/dashboard'); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        All projects
                    </button>
                    <button
                        onClick={() => setProjectsFilter('starred')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Star className="w-4 h-4" />
                        Starred
                    </button>
                    <button
                        onClick={() => setProjectsFilter('created')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <UserCheck className="w-4 h-4" />
                        Created by me
                    </button>
                    <button
                        onClick={() => setProjectsFilter('shared')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Users2 className="w-4 h-4" />
                        Shared with me
                    </button>

                    {/* Recents */}
                    <div className="pt-4 pb-1 px-1">
                        <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">Recents</p>
                    </div>

                    {recentProjects.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-white/25 italic">No recent projects</p>
                    ) : (
                        recentProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => onOpenProject?.(project.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-all truncate ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                                <span className="truncate">{project.name}</span>
                            </button>
                        ))
                    )}
                </nav>

                {/* Sidebar Bottom */}
                <div className="mt-auto px-2 pb-3 space-y-1.5">
                    {/* Share Vivora */}
                    <div className="mx-1 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <p className="text-sm text-white/80 font-medium">Share Vivora</p>
                                <p className="text-[11px] text-white/30">100 credits per paid referral</p>
                            </div>
                            <Gift className="w-4 h-4 text-white/30" />
                        </div>
                    </div>

                    {/* Upgrade */}
                    {(!isPaidPlan) && (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className={`w-full mx-1 flex items-center justify-between px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:bg-white/[0.06] transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                                <p className="text-sm text-white/80 font-medium">Upgrade to Pro</p>
                                <p className="text-[11px] text-white/30">Unlock more benefits</p>
                            </div>
                            <Zap className="w-4 h-4 text-purple-400" />
                        </button>
                    )}

                    {/* User */}
                    {user && (
                        <div className={`mx-1 flex items-center gap-2 px-2 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <NotificationInbox />
                        </div>
                    )}
                </div>
            </aside>

            {/* ============================
          MAIN CONTENT
      ============================ */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Aurora Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-[1]" />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.6) 0%, rgba(219,39,119,0.3) 30%, transparent 70%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], x: [-20, 20, -20], opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -bottom-20 left-[10%] w-[500px] h-[350px]"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.2) 40%, transparent 70%)',
                            filter: 'blur(50px)',
                        }}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.12, 1], x: [20, -20, 20], opacity: [0.4, 0.55, 0.4] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -bottom-20 right-[10%] w-[500px] h-[350px]"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.2) 40%, transparent 70%)',
                            filter: 'blur(50px)',
                        }}
                    />
                </div>

                {/* Top Bar for mobile (no sidebar) */}
                <header className="relative z-50 md:hidden px-4 py-3 flex items-center justify-between">
                    <VivoraLogo size="sm" showText={true} />
                    {user && (
                        <UserMenuDropdown
                            user={user}
                            signOut={signOut}
                            onSettingsClick={() => setShowSettingsModal(true)}
                            onUpgradeClick={() => setShowUpgradeModal(true)}
                        />
                    )}
                </header>

                {/* Top Right user menu for desktop */}
                {user && (
                    <div className={`hidden md:flex absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-50 items-center gap-2`}>
                        <UserMenuDropdown
                            user={user}
                            signOut={signOut}
                            onSettingsClick={() => setShowSettingsModal(true)}
                            onUpgradeClick={() => setShowUpgradeModal(true)}
                        />
                    </div>
                )}

                {/* Scrollable Main */}
                <main className="relative z-10 flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center min-h-full px-4 md:px-6 py-12 md:py-20">
                        {/* Greeting */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                                What should we build, <span className="text-pink-400">{displayName}</span>?
                            </h1>
                        </motion.div>

                        {/* Prompt Input */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-2xl"
                        >
                            <form onSubmit={handleSubmit}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <div
                                    className={`bg-[#1e1e24]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/30 transition-colors ${isDragging ? 'ring-2 ring-pink-400' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {/* Drag overlay */}
                                    {isDragging && (
                                        <div className="absolute inset-0 z-10 bg-pink-500/10 border-2 border-dashed border-pink-400 rounded-2xl flex items-center justify-center pointer-events-none">
                                            <div className="flex flex-col items-center gap-2 text-pink-400">
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="font-medium">Drop image here</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Uploaded Images Preview */}
                                    {uploadedImages.length > 0 && (
                                        <div className="px-4 pt-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {uploadedImages.map((img, index) => (
                                                    <div key={index} className="relative group/upload">
                                                        <div className="relative w-14 h-14">
                                                            <img
                                                                src={img.preview}
                                                                alt={`Upload ${index + 1}`}
                                                                className={`w-14 h-14 object-cover rounded-lg border border-white/10 transition-opacity ${img.uploading ? 'opacity-50' : ''}`}
                                                            />
                                                            {img.uploading && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUploadedImage(index)}
                                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <textarea
                                        value={prompt}
                                        onChange={handlePromptChange}
                                        placeholder={t('home.placeholder') || 'Ask Vivora to create a landing page for...'}
                                        className={`w-full px-5 py-4 bg-transparent text-white placeholder-white/30 resize-none focus:outline-none text-[15px] ${isRTL ? 'text-right' : ''}`}
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                        rows={2}
                                    />

                                    <div className={`flex items-center justify-between px-4 py-3 border-t border-white/[0.06] ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        {/* Plus button */}
                                        <div className="relative" ref={plusButtonRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPlusMenu(!showPlusMenu)}
                                                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center transition-all duration-200"
                                            >
                                                <Plus className={`w-4 h-4 text-white/50 transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {showPlusMenu && (
                                                    <>
                                                        <div className="fixed inset-0 z-[9998]" onClick={() => setShowPlusMenu(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute bottom-full mb-2 w-52 bg-[#1e1e24] rounded-xl shadow-xl border border-white/[0.08] overflow-hidden z-[9999]"
                                                            style={{ [isRTL ? 'right' : 'left']: 0 }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowPlusMenu(false);
                                                                    if (!user) { if (onShowAuth) onShowAuth(); return; }
                                                                    if (!isPaidPlan) { toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' }); return; }
                                                                    fileInputRef.current?.click();
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                                                            >
                                                                <ImageIcon className="w-4 h-4 text-pink-400" />
                                                                <span className="text-sm text-white/70">Attach Images</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setShowPlusMenu(false); setShowCloneInput(true); }}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                                                            >
                                                                <Copy className="w-4 h-4 text-purple-400" />
                                                                <span className="text-sm text-white/70">Clone Design</span>
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            {/* Plan badge */}
                                            <span className="hidden sm:inline text-[11px] text-white/25 font-medium">Plan</span>

                                            {/* Mic */}
                                            <button
                                                type="button"
                                                onClick={isListening ? stopListening : startListening}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white/[0.06] hover:bg-white/10'
                                                    }`}
                                            >
                                                {isListening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white/50" />}
                                            </button>

                                            {/* Submit */}
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                disabled={!prompt.trim() || isSubmitting}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${prompt.trim() ? 'bg-white hover:bg-white/90' : 'bg-white/10'
                                                    }`}
                                            >
                                                <ArrowRight className={`w-4 h-4 ${prompt.trim() ? 'text-black' : 'text-white/40'}`} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>

                        {/* Frameworks */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 w-full max-w-2xl"
                        >
                            <FrameworkBar selectedFramework={selectedFramework} onSelectFramework={setSelectedFramework} />
                        </motion.div>
                    </div>

                    {/* Templates */}
                    <TemplatesSection onSelectTemplate={(prompt) => setPrompt(prompt)} />
                </main>
            </div>

            {/* Modals */}
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        </div>
    );
};
