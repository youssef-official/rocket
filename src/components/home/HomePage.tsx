import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, X, Image as ImageIcon, ChevronDown, Sparkles, BookOpen, CircleHelp, LogIn, Wand2, ArrowUpRight, Plus, Copy, Loader2, Mic, MicOff, Palette } from 'lucide-react';
import { CelebrationEffects } from './CelebrationEffects';
import { UserMenuDropdown, getWallpaperSrc } from '@/components/shared/UserMenuDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectsSection } from './ProjectsSection';
import { TemplatesSection } from './TemplatesSection';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { FrameworkBar } from '@/components/shared/FrameworkLogos';
import { Footer } from '@/components/shared/Footer';
const NotificationInbox = () => null;
const useUserPlan = () => ({ userPlan: { plan: 'business' as const, dailyCredits: 999 }, shouldShowUpgradeBanner: () => false, canUsePrivateProjects: () => true, getRemainingCredits: () => ({ daily: 999, monthly: 999, total: 999 }) });
import { toast } from '@/hooks/use-toast';
import { useThemePreference } from '@/hooks/useThemePreference';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import lightHeroBg from '@/assets/light-hero-bg.jpg';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: 'vite' | 'html';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HomePageProps {
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

export const HomePage: React.FC<HomePageProps> = ({
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

  // Wallpaper selection (listens for changes from UserMenuDropdown)
  const [wallpaperId, setWallpaperId] = useState(() => localStorage.getItem('vivora_wallpaper') || 'space');

  useEffect(() => {
    const handler = () => {
      setWallpaperId(localStorage.getItem('vivora_wallpaper') || 'space');
    };
    window.addEventListener('vivora-wallpaper-change', handler);
    return () => window.removeEventListener('vivora-wallpaper-change', handler);
  }, []);

  const getWallpaperUrl = (id: string): string => {
    return getWallpaperSrc(id);
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const heroBg = getWallpaperUrl(wallpaperId);

  const [prompt, setPrompt] = useState(() => localStorage.getItem('vivora_home_prompt') || '');
  const [selectedFramework, setSelectedFramework] = useState('React');
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Theme selector state
  const [selectedTheme, setSelectedTheme] = useState<{ name: string; colors: string[] } | null>(() => {
    const saved = sessionStorage.getItem('vivora_selected_theme');
    return saved ? JSON.parse(saved) : null;
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const plusButtonRef = useRef<HTMLDivElement>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const COLOR_THEMES = [
    { name: 'Default', colors: ['#4F46E5', '#818CF8', '#C7D2FE'], desc: 'Indigo & Blue' },
    { name: 'Glacier', colors: ['#0EA5E9', '#38BDF8', '#BAE6FD'], desc: 'Cool Blue' },
    { name: 'Harvest', colors: ['#F59E0B', '#FBBF24', '#FDE68A'], desc: 'Warm Amber' },
    { name: 'Lavender', colors: ['#A855F7', '#C084FC', '#E9D5FF'], desc: 'Purple' },
    { name: 'Brutalist', colors: ['#1F2937', '#6B7280', '#F9FAFB'], desc: 'Mono Gray' },
    { name: 'Obsidian', colors: ['#0F172A', '#334155', '#94A3B8'], desc: 'Dark Slate' },
    { name: 'Orchid', colors: ['#EC4899', '#F472B6', '#FBCFE8'], desc: 'Pink' },
    { name: 'Solar', colors: ['#EF4444', '#F97316', '#FCD34D'], desc: 'Red-Orange' },
    { name: 'Forest', colors: ['#059669', '#34D399', '#A7F3D0'], desc: 'Green' },
    { name: 'Coral', colors: ['#F43F5E', '#FB7185', '#FECDD3'], desc: 'Rose' },
  ];

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
    // Support Arabic via browser language detection + explicit mappings
    const langMap: Record<string, string> = { 'ar': 'ar-SA', 'zh': 'zh-CN', 'ja': 'ja-JP', 'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 'pt': 'pt-BR', 'ko': 'ko-KR', 'tr': 'tr-TR', 'hi': 'hi-IN', 'ru': 'ru-RU' };
    const browserLang = navigator.language || 'en-US';
    recognition.lang = langMap[language] || (browserLang.startsWith('ar') ? 'ar-SA' : browserLang);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPrompt(prev => {
        // Replace from the point we started listening
        const base = prev;
        if (event.results[event.resultIndex]?.isFinal) {
          return base + transcript + ' ';
        }
        return base;
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

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

  // Save/clear theme in sessionStorage
  useEffect(() => {
    if (selectedTheme) {
      sessionStorage.setItem('vivora_selected_theme', JSON.stringify(selectedTheme));
    } else {
      sessionStorage.removeItem('vivora_selected_theme');
    }
  }, [selectedTheme]);

  // Persist prompt to localStorage
  useEffect(() => {
    localStorage.setItem('vivora_home_prompt', prompt);
  }, [prompt]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing animation words based on language
  const typingWords = [
    t('typing.dashboard'),
    t('typing.landingPage'),
    t('typing.ecommerce'),
    t('typing.portfolio'),
    t('typing.blog'),
  ];

  // Typing animation effect
  useEffect(() => {
    const word = typingWords[typingIndex];
    const speed = isDeleting ? 50 : 100;
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < word.length) {
          setDisplayText(word.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(word.slice(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setTypingIndex(prev => (prev + 1) % typingWords.length);
        }
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, typingIndex, typingWords]);

  // Reset typing on language change
  useEffect(() => {
    setDisplayText('');
    setTypingIndex(0);
    setIsDeleting(false);
  }, [language]);

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
          toast({ title: 'Upload failed', description: 'Could not upload image. Please try again.', variant: 'destructive' });
          return;
        }
        setUploadedImages(prev => prev.map(img =>
          img.file === entry.file ? { ...img, uploading: false, url } : img
        ));
      }).catch(() => {
        setUploadedImages(prev => prev.filter(img => img.file !== entry.file));
        toast({ title: 'Upload failed', description: 'Could not upload image. Please try again.', variant: 'destructive' });
      });
    }
  }, [uploadFileToR2]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
      return;
    }
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 5 - uploadedImages.length);
    if (files.length === 0) return;
    uploadImmediately(files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
      return;
    }
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

  const handleCloneDesign = async () => {
    if (!cloneUrl.trim()) return;
    setCloneLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-website`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ url: cloneUrl.trim() }),
        }
      );
      if (!res.ok) throw new Error('Scrape failed');
      const result = await res.json();
      if (result.html) {
        setCloneAttachment({ url: cloneUrl.trim(), html: result.html });
        setShowCloneInput(false);
        setCloneUrl('');
        toast({ title: 'Design cloned!', description: `Source code from ${cloneUrl.trim()} attached.` });
      } else {
        throw new Error('No HTML returned');
      }
    } catch {
      toast({ title: 'Clone failed', description: 'Could not scrape the website. Please try again.', variant: 'destructive' });
    } finally {
      setCloneLoading(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_PROMPT_LENGTH) {
      setPrompt(value);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stillUploading = uploadedImages.some(img => img.uploading);
    if (prompt.trim() && !isSubmitting && !stillUploading) {
      const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
      const urls = uploadedImages
        .map(img => normalizePublicImageUrl(img.url || ''))
        .filter((u): u is string => !!u);

      if (uploadedImages.length > 0 && urls.length === 0) {
        toast({ title: 'Upload failed', description: 'Please re-upload your image.', variant: 'destructive' });
        return;
      }

      // Store clone data in sessionStorage (not in the visible prompt)
      // It will be retrieved by the editor and sent only to the AI model
      setIsSubmitting(true);
      localStorage.removeItem('vivora_home_prompt');
      // Store selected color theme for the generation pipeline
      if (selectedTheme) {
        sessionStorage.setItem('vivora_pending_color_theme', JSON.stringify(selectedTheme));
      } else {
        sessionStorage.removeItem('vivora_pending_color_theme');
      }
      onStartBuilding(prompt, projectType, undefined, urls.length > 0 ? urls : undefined);
    }
  };

  // After onStartBuilding creates the project and navigates, store clone data
  // We use a useEffect to detect navigation away
  useEffect(() => {
    if (isSubmitting && cloneAttachment) {
      // Store for the next project that will be created
      sessionStorage.setItem('pending_clone_data', JSON.stringify({
        url: cloneAttachment.url,
        html: cloneAttachment.html
      }));
    }
  }, [isSubmitting, cloneAttachment]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Celebration Effects */}
      <CelebrationEffects />

      {/* Dark overlay */}
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-black/30 via-transparent to-black/50' : 'bg-gradient-to-b from-white/10 via-transparent to-white/30'}`} />

      {/* Header */}
      <header className="relative z-[100] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          {/* Logo Section - Right in AR, Left in EN */}
          <div className={`flex items-center gap-2 ${isRTL ? 'order-3' : 'order-1'}`}>
            <VivoraLogo
              size="sm"
              className="scale-90 origin-left"
            />
            <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full hidden sm:inline text-[10px] font-semibold tracking-widest uppercase">{isRTL ? 'تجريبي' : 'BETA'}</span>
          </div>

          {/* Nav - Center - hidden when logged in */}
          {!user && (
            <nav className={`hidden md:flex items-center gap-0.5 bg-white/[0.08] backdrop-blur-xl rounded-full px-1.5 py-1 absolute left-1/2 -translate-x-1/2 border border-white/[0.08] ${isRTL ? 'flex-row-reverse' : ''}`}>
              <a href="/pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-200 text-sm font-medium">
                {t('nav.pricing')}
              </a>
              <a href="/docs" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-200 text-sm font-medium">
                {t('nav.docs')}
              </a>
              <a href="/blog/ai-for-all" className={`px-4 py-2 text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-200 text-sm font-medium flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Wand2 className="w-3.5 h-3.5" />
                AI for All
              </a>
            </nav>
          )}

          {/* Actions Section */}
          <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'order-1' : 'order-3'}`}>
            {user ? (
              <>
                <div className={`flex items-center gap-1 bg-white/[0.08] backdrop-blur-xl rounded-full p-1 border border-white/[0.08] ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <a href="/docs" className="hidden md:flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-all duration-200" title="Docs">
                    <BookOpen className="w-[18px] h-[18px] text-white/70" />
                  </a>
                  <a href="/faq" className="hidden md:flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-all duration-200" title="Help">
                    <CircleHelp className="w-[18px] h-[18px] text-white/70" />
                  </a>
                  <NotificationInbox />
                </div>

                <UserMenuDropdown user={user} signOut={signOut} />
              </>
            ) : (
              <motion.button
                onClick={() => window.location.href = '/login'}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.12] backdrop-blur-xl border border-white/[0.15] rounded-full text-white hover:bg-white/[0.18] transition-all duration-200 text-sm font-medium shadow-lg shadow-black/10"
              >
                <LogIn className="w-4 h-4" />
                {t('common.signIn')}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32 pointer-events-auto">
        {/* Announcement Badge */}
        <motion.a
          href="/new-vibe-tool"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 cursor-pointer group"
        >
          <div className={`flex items-center gap-2 px-4 md:px-5 py-2.5 bg-white/[0.08] backdrop-blur-xl rounded-full hover:bg-white/[0.12] transition-all duration-300 border border-white/[0.1] shadow-lg shadow-black/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">{t('home.newBadge')}</span>
            <span className="text-white/90 text-xs md:text-sm font-medium">{t('home.mobileAnnouncement')}</span>
            <ArrowUpRight className={`w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </motion.a>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4">
            {t('home.title1')} <span className="text-pink-400">{t('home.title2')}</span> {t('home.title3')}
          </h1>
          <p className="text-base md:text-xl text-white/80">
            {t('home.subtitle')}{' '}
            <span className="text-white font-medium">
              {displayText}
            </span>
            <span className="typing-cursor" />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <form onSubmit={handleSubmit}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative transition-colors ${isDragging ? 'ring-2 ring-pink-400' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-10 bg-pink-50 border-2 border-dashed border-pink-400 rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-2 text-pink-500">
                    <ImageIcon className="w-8 h-8" />
                    <span className="font-medium">{t('home.dropImage')}</span>
                  </div>
                </div>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className={`px-4 pt-4 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group/upload">
                        <div className="relative w-16 h-16">
                          <img
                            src={img.preview}
                            alt={`Upload ${index + 1}`}
                            className={`w-16 h-16 object-cover rounded-lg border border-border transition-opacity ${img.uploading ? 'opacity-50' : ''}`}
                          />
                          {img.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <span className="text-[10px] text-muted-foreground self-end mb-1">{uploadedImages.length}/5</span>
                  </div>
                </div>
              )}

              {/* Clone Attachment Chip */}
              {cloneAttachment && (
                <div className={`px-4 pt-3 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Copy className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-purple-700 font-medium truncate max-w-[200px]">clone-attach</span>
                    <button
                      type="button"
                      onClick={() => setCloneAttachment(null)}
                      className="w-4 h-4 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center transition-colors"
                    >
                      <X className="w-2.5 h-2.5 text-purple-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Clone URL Input Dialog */}
              <AnimatePresence>
                {showCloneInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 overflow-hidden"
                  >
                    <div className={`flex items-center gap-2 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="text"
                        value={cloneUrl}
                        onChange={(e) => setCloneUrl(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                        dir="ltr"
                        disabled={cloneLoading}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCloneDesign(); } }}
                      />
                      <button
                        type="button"
                        onClick={handleCloneDesign}
                        disabled={!cloneUrl.trim() || cloneLoading}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        {cloneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        {cloneLoading ? 'Scraping...' : 'Clone'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCloneInput(false); setCloneUrl(''); }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder={t('home.placeholder')}
                className={`w-full px-4 md:px-8 py-4 md:py-6 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-base md:text-lg ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={3}
              />

              <div className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-100/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="relative" ref={plusButtonRef}>
                  <button
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group"
                    title="Add"
                  >
                    <Plus className={`w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-all duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
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
                          className={`fixed mb-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-200/80 overflow-hidden z-[9999]`}
                          style={{
                            left: plusButtonRef.current ? (isRTL ? plusButtonRef.current.getBoundingClientRect().right - 224 : plusButtonRef.current.getBoundingClientRect().left) : 'auto',
                            top: plusButtonRef.current ? plusButtonRef.current.getBoundingClientRect().top - 210 : 'auto',
                          }}
                        >
                          {/* Attach Images */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusMenu(false);
                              if (!user) {
                                toast({ title: t('common.signIn'), description: 'Please sign in first.', variant: 'destructive' });
                                if (onShowAuth) onShowAuth();
                                return;
                              }
                              if (!isPaidPlan) {
                                toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
                                return;
                              }
                              fileInputRef.current?.click();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-4 h-4 text-pink-500" />
                            </div>
                            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                              <p className="text-sm font-semibold text-gray-700">Attach Images</p>
                              <p className="text-[11px] text-gray-500">{isPaidPlan ? 'Up to 5 images' : 'Pro+ only'}</p>
                            </div>
                            {!isPaidPlan && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">PRO</span>
                            )}
                          </button>

                          {/* Clone Design */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusMenu(false);
                              if (!user) {
                                toast({ title: t('common.signIn'), description: 'Please sign in to use Clone Design.', variant: 'destructive' });
                                if (onShowAuth) onShowAuth();
                                return;
                              }
                              if (cloneAttachment) {
                                toast({ title: 'Limit reached', description: 'Only 1 clone design per prompt.', variant: 'destructive' });
                                return;
                              }
                              setShowCloneInput(true);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                              <Copy className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                              <p className="text-sm font-semibold text-gray-700">Clone Design</p>
                              <p className="text-[11px] text-gray-500">Scrape a website design</p>
                            </div>
                          </button>

                          {/* Themes */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlusMenu(false);
                              setShowThemeMenu(true);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Palette className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                              <p className="text-sm font-semibold text-gray-700">Themes</p>
                              <p className="text-[11px] text-gray-500">Choose color palette</p>
                            </div>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Theme picker dropdown */}
                  <AnimatePresence>
                    {showThemeMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`fixed mb-2 w-60 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-200/80 overflow-hidden z-50 max-h-80 overflow-y-auto`}
                          style={{
                            left: plusButtonRef.current ? (isRTL ? plusButtonRef.current.getBoundingClientRect().right - 240 : plusButtonRef.current.getBoundingClientRect().left) : 'auto',
                            top: plusButtonRef.current ? plusButtonRef.current.getBoundingClientRect().top - 320 : 'auto',
                          }}
                        >
                          <div className="px-4 py-2.5 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default themes</p>
                          </div>
                          {COLOR_THEMES.map((theme) => (
                            <button
                              key={theme.name}
                              type="button"
                              onClick={() => {
                                if (theme.name === 'Default') {
                                  setSelectedTheme(null);
                                } else {
                                  setSelectedTheme(theme);
                                }
                                setShowThemeMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all duration-200 text-left ${(selectedTheme?.name === theme.name || (!selectedTheme && theme.name === 'Default')) ? 'bg-indigo-50' : ''
                                }`}
                            >
                              <div className="flex -space-x-1.5">
                                {theme.colors.map((c, i) => (
                                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected theme chip + voice + controls */}
                <div className={`flex items-center gap-1.5 md:gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Theme chip */}
                  {selectedTheme && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      <div className="flex -space-x-1">
                        {selectedTheme.colors.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span>{selectedTheme.name}</span>
                      <button type="button" onClick={() => setSelectedTheme(null)} className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors">
                        <X className="w-2.5 h-2.5 text-gray-600" />
                      </button>
                    </div>
                  )}
                  {/* Character Count */}
                  <span className={`text-[10px] md:text-xs font-mono tabular-nums ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-destructive font-bold' : 'text-gray-400'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>

                  {/* Visibility indicator removed */}

                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-500" />}
                  </button>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={!prompt.trim() || isSubmitting}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 flex-shrink-0 shadow-lg ${prompt.trim() ? 'bg-primary hover:bg-primary/90 shadow-primary/25' : 'bg-gray-200 hover:bg-gray-300 shadow-none'
                      }`}
                  >
                    <ArrowRight className={`w-4 h-4 md:w-[18px] md:h-[18px] ${prompt.trim() ? 'text-primary-foreground' : 'text-gray-500'}`} />
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Frameworks & Integrations with real logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-3xl"
        >
          <FrameworkBar selectedFramework={selectedFramework} onSelectFramework={setSelectedFramework} />
        </motion.div>
      </main>

      {/* Meet Vivora X Section - only visible for non-logged in users */}
      {!user && (
        <section className="relative z-10 py-12 md:py-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">Meet Vivora X</h2>
            </motion.div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
              {/* Video */}
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"
              >
                <video
                  src="/videos/meet-vivora.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-cover rounded-2xl"
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none" />
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="space-y-10"
              >
                {[
                  {
                    title: isRTL ? 'ابدأ بفكرة' : 'Start with an idea',
                    desc: isRTL ? 'صف التطبيق أو الموقع الذي تريد إنشاءه أو أرفق لقطات شاشة ووثائق' : 'Describe the app or website you want to create or drop in screenshots and docs',
                    step: '01',
                  },
                  {
                    title: isRTL ? 'شاهده ينبض بالحياة' : 'Watch it come to life',
                    desc: isRTL ? 'شاهد رؤيتك تتحول إلى نموذج أولي عامل في الوقت الفعلي بينما يبنيه الذكاء الاصطناعي' : 'See your vision transform into a working prototype in real-time as AI builds it for you',
                    step: '02',
                  },
                  {
                    title: isRTL ? 'حسّن وانشر' : 'Refine and ship',
                    desc: isRTL ? 'كرّر ابتكارك بملاحظات بسيطة وانشره للعالم بنقرة واحدة' : 'Iterate on your creation with simple feedback and deploy it to the world with one click',
                    step: '03',
                  },
                ].map((item, i) => (
                  <div key={i} className={`flex gap-6 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/40 text-sm font-mono">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-white/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Projects Section */}
      {user && projects.length > 0 && (
        <ProjectsSection
          projects={projects}
          loading={projectsLoading}
          onOpenProject={onOpenProject || (() => { })}
          onDeleteProject={onDeleteProject || (() => { })}
          onForkProject={onForkProject || (() => { })}
          onNewProject={() => { }}
        />
      )}

      {/* Templates Section - visible to all users */}
      <TemplatesSection onSelectTemplate={(prompt) => setPrompt(prompt)} />

      {/* Welcome message for new logged-in users with no projects */}
      {user && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 max-w-3xl mx-auto px-4 mb-20 text-center"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vivora X!</h2>
            <p className="text-white/70 mb-6">Start by describing your dream project above.</p>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
};
