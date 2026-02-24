import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, Paperclip, Lock, Globe, X, Image as ImageIcon, ChevronDown, Sparkles, BookOpen, CircleHelp, LogIn, Wand2, ArrowUpRight, Plus } from 'lucide-react';
import { UserMenuDropdown } from '@/components/shared/UserMenuDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectsSection } from './ProjectsSection';
import { TemplatesSection } from './TemplatesSection';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { FrameworkBar } from '@/components/shared/FrameworkLogos';
import { Footer } from '@/components/shared/Footer';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { SettingsModal } from '@/components/shared/SettingsModal';
import { NotificationInbox } from '@/components/shared/NotificationInbox';
import { useUserPlan } from '@/hooks/useUserPlan';
import { toast } from '@/hooks/use-toast';
import { useThemePreference } from '@/hooks/useThemePreference';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import lightHeroBg from '@/assets/light-hero-bg.jpg';

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
  onStartBuilding: (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageFiles?: File[]) => void;
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

  // Determine if dark mode is active
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const heroBg = isDark ? spaceHeroBg : lightHeroBg;

  const [prompt, setPrompt] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('React');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{
    file: File;
    preview: string;
    uploading: boolean;
    url?: string;
  }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
    const newEntries = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setUploadedImages(prev => [...prev, ...newEntries]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
      return;
    }
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).slice(0, 5 - uploadedImages.length);
    if (files.length === 0) return;
    const newEntries = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setUploadedImages(prev => [...prev, ...newEntries]);
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
    if (value.length <= MAX_PROMPT_LENGTH) {
      setPrompt(value);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
      const files = uploadedImages.map(img => img.file);
      onStartBuilding(prompt, projectType, undefined, files.length > 0 ? files : undefined);
    }
  };

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
      {/* Dark overlay */}
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-black/30 via-transparent to-black/50' : 'bg-gradient-to-b from-white/10 via-transparent to-white/30'}`} />

      {/* Header */}
      <header className="relative z-[100] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          {/* Logo Section - Right in AR, Left in EN */}
          <div className={`flex items-center gap-2 ${isRTL ? 'order-3' : 'order-1'}`}>
            <VivoraLogo
              size={isRTL ? 'sm' : 'md'}
              className={isRTL ? 'mr-1 origin-right scale-95' : ''}
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

                <UserMenuDropdown
                  user={user}
                  signOut={signOut}
                  onSettingsClick={() => setShowSettingsModal(true)}
                  onUpgradeClick={() => setShowUpgradeModal(true)}
                />
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
                        <img
                          src={img.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
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

              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder={t('home.placeholder')}
                className={`w-full px-4 md:px-8 py-4 md:py-6 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-base md:text-lg ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={3}
              />

              <div className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-100/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-0.5 md:gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 md:p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                    title="Attach file"
                  >
                    <Paperclip className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>
                  <button
                    type="button"
                    className={`hidden md:flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Wand2 className="w-[18px] h-[18px] text-pink-400 group-hover:text-pink-500 transition-colors" />
                    <span className="text-sm text-gray-500 group-hover:text-gray-700 font-medium transition-colors">{t('home.import')}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-1.5 md:gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Character Count */}
                  <span className={`text-[10px] md:text-xs font-mono tabular-nums ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-destructive font-bold' : 'text-gray-400'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>

                  {/* Visibility Toggle */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                      className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all duration-200 text-xs md:text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {isPublic ? <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      <span className="hidden sm:inline">{isPublic ? t('home.public') : t('home.private')}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>

                    <AnimatePresence>
                      {showVisibilityMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowVisibilityMenu(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute bottom-full ${isRTL ? 'left-0' : 'right-0'} mb-2 w-52 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-200/80 overflow-hidden z-50`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(true);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${isPublic ? 'bg-primary/5' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPublic ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                <Globe className={`w-4 h-4 ${isPublic ? 'text-primary' : 'text-gray-400'}`} />
                              </div>
                              <div className={isRTL ? 'text-right' : ''}>
                                <p className={`text-sm font-semibold ${isPublic ? 'text-primary' : 'text-gray-700'}`}>{t('home.public')}</p>
                                <p className="text-[11px] text-gray-500">{t('home.publicDesc')}</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(false);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all duration-200 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${!isPublic ? 'bg-primary/5' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isPublic ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                <Lock className={`w-4 h-4 ${!isPublic ? 'text-primary' : 'text-gray-400'}`} />
                              </div>
                              <div className={isRTL ? 'text-right' : ''}>
                                <p className={`text-sm font-semibold ${!isPublic ? 'text-primary' : 'text-gray-700'}`}>{t('home.private')}</p>
                                <p className="text-[11px] text-gray-500">{t('home.privateDesc')}</p>
                              </div>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={!prompt.trim() || isSubmitting}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 flex-shrink-0 shadow-lg ${
                      prompt.trim() ? 'bg-primary hover:bg-primary/90 shadow-primary/25' : 'bg-gray-200 hover:bg-gray-300 shadow-none'
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
