import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, FolderOpen, Paperclip, Lock, Globe, User, Bell, HelpCircle, Book, X, Image as ImageIcon, ChevronDown, Zap, Crown, Sparkles } from 'lucide-react';
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
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

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
  onStartBuilding: (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageFile?: File) => void;
  onViewDashboard?: () => void;
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onForkProject?: (id: string) => void;
  onShowAuth?: () => void;
  projects?: Project[];
  projectsLoading?: boolean;
}

const MAX_PROMPT_LENGTH = 2000;

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
  const { userPlan, shouldShowUpgradeBanner, canUsePrivateProjects, getRemainingCredits } = useUserPlan();

  const [prompt, setPrompt] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('React');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
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
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };
  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
      setUploadedImage(null);
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
    if (prompt.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
      onStartBuilding(prompt, projectType, undefined, uploadedImage?.file);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: `url(${spaceHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Header */}
      <header className="relative z-[100] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Section - Right in AR, Left in EN */}
          <div className={`flex items-center gap-2 ${isRTL ? 'order-3' : 'order-1'}`}>
            <VivoraLogo
              size={isRTL ? 'sm' : 'md'}
              className={isRTL ? 'mr-1 origin-right scale-95' : ''}
            />
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full hidden sm:inline text-xs">{isRTL ? 'تجريبي' : 'BETA'}</span>
          </div>

          {/* Nav - Center - hidden when logged in */}
          {!user && (
            <nav className={`hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 order-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <a href="/pricing" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                {t('nav.pricing')}
              </a>
              <a href="/docs" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                {t('nav.docs')}
              </a>
              <a href="/pricing" className={`px-4 py-2 text-white/80 hover:text-white transition-colors text-sm flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {t('nav.resources')}
                <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : 'rotate-90'}`} />
              </a>
            </nav>
          )}

          {/* Actions Section - Left in AR, Right in EN */}
          <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'order-1' : 'order-3'}`}>
            {user ? (
              <>
                <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="hidden md:flex items-center gap-2">
                    <a href="/docs" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <Book className="w-5 h-5 text-white/80" />
                    </a>
                    <a href="/faq" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <HelpCircle className="w-5 h-5 text-white/80" />
                    </a>
                  </div>
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
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 md:px-5 py-2 md:py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors text-sm md:text-base"
              >
                {t('common.signIn')}
              </button>
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
          className="mb-6 md:mb-8 cursor-pointer"
        >
          <div className={`flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/15 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">{t('home.newBadge')}</span>
            <span className="text-white text-xs md:text-sm">{t('home.mobileAnnouncement')}</span>
            <ArrowRight className={`w-4 h-4 text-white ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </motion.a>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight">
            {t('home.heroTitle')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
              {displayText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto px-4">
            {t('home.heroSubtitle')}
          </p>
        </motion.div>

        {/* Prompt Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <div 
            className={`relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl transition-all duration-300 ${isDragging ? 'scale-[1.02] border-pink-500/50 bg-white/15' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <form onSubmit={handleSubmit} className="p-2 md:p-3">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder={t('home.promptPlaceholder')}
                  className="w-full bg-transparent text-white placeholder-white/40 border-none focus:ring-0 text-lg md:text-xl p-4 md:p-6 min-h-[120px] md:min-h-[160px] resize-none custom-scrollbar"
                />
                
                {/* Uploaded Image Preview */}
                <AnimatePresence>
                  {uploadedImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bottom-20 left-6 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <img src={uploadedImage.preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={`flex flex-col md:flex-row items-center justify-between gap-4 p-2 md:p-4 border-t border-white/10 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 w-full md:w-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/70 hover:text-white transition-all group relative"
                  >
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {t('home.attachImage')}
                    </span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/70 hover:text-white transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span className="text-sm font-medium">{isPublic ? t('home.public') : t('home.private')}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showVisibilityMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showVisibilityMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full mb-2 left-0 w-48 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          <button
                            type="button"
                            onClick={() => { setIsPublic(true); setShowVisibilityMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Globe className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{t('home.public')}</div>
                              <div className="text-[10px] text-white/40">{t('home.publicDesc')}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (canUsePrivateProjects) {
                                setIsPublic(false);
                                setShowVisibilityMenu(false);
                              } else {
                                setShowUpgradeModal(true);
                                setShowVisibilityMenu(false);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white/70 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Lock className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t('home.private')}</span>
                                {!canUsePrivateProjects && <Crown className="w-3 h-3 text-pink-500" />}
                              </div>
                              <div className="text-[10px] text-white/40">{t('home.privateDesc')}</div>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!prompt.trim() || isSubmitting}
                  className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('home.generateButton')}</span>
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Framework Selection */}
          <div className={`mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {['React', 'Next.js', 'HTML/Tailwind'].map((fw) => (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedFramework === fw
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Projects Section */}
      {user && (
        <div className="relative z-10 bg-black/40 backdrop-blur-3xl border-t border-white/10">
          <ProjectsSection
            projects={projects}
            loading={projectsLoading}
            onOpenProject={onOpenProject}
            onDeleteProject={onDeleteProject}
            onForkProject={onForkProject}
            onViewDashboard={onViewDashboard}
          />
        </div>
      )}

      {/* Templates Section */}
      <div className="relative z-10">
        <TemplatesSection onSelectTemplate={(t) => setPrompt(t)} />
      </div>

      {/* Framework Bar */}
      <FrameworkBar />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
};
