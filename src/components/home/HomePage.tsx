import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, FolderOpen, Paperclip, Lock, Globe, User, Bell, HelpCircle, MessageSquare, X, Image as ImageIcon, ChevronDown, Zap, Crown } from 'lucide-react';
import { UserMenuDropdown } from '@/components/shared/UserMenuDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectsSection } from './ProjectsSection';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { FrameworkBar } from '@/components/shared/FrameworkLogos';
import { Footer } from '@/components/shared/Footer';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { SettingsModal } from '@/components/shared/SettingsModal';
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
  onStartBuilding: (prompt: string, projectType: 'vite' | 'html', modelId?: string) => void;
  onViewDashboard?: () => void;
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onForkProject?: (id: string) => void;
  onShowAuth?: () => void;
  projects?: Project[];
  projectsLoading?: boolean;
}

const MAX_PROMPT_LENGTH = 50000;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
      onStartBuilding(prompt, projectType);
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
      <header className="relative z-50 px-4 md:px-6 py-4">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <RocketLogo size="md" className={isRTL ? 'ml-1' : ''} />
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full hidden sm:inline text-xs">BETA</span>
          </div>

          {/* Nav - hidden when logged in */}
          {!user && (
            <nav className={`hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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

          {/* Right actions */}
          <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {user ? (
              <>
                <div className={`hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <MessageSquare className="w-5 h-5 text-white/80" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <HelpCircle className="w-5 h-5 text-white/80" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Bell className="w-5 h-5 text-white/80" />
                  </button>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className={`flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-md rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">{t('home.newBadge')}</span>
            <span className="text-white text-xs md:text-sm">{t('home.mobileAnnouncement')}</span>
            <ArrowRight className={`w-4 h-4 text-white ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </motion.div>

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
            <span className="text-white underline decoration-pink-400 decoration-2 underline-offset-4">
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

              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className={`px-4 pt-4 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="relative">
                      <img
                        src={uploadedImage.preview}
                        alt="Uploaded"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">
                      {uploadedImage.file.name}
                    </span>
                  </div>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder={t('home.placeholder')}
                className={`w-full px-8 py-6 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-lg ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={4}
              />

              <div className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="text-pink-500">🎨</span>
                    <span className="text-sm text-gray-600">{t('home.import')}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Character Count */}
                  <span className={`text-xs ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>

                  {/* Visibility Toggle - Public/Private */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {isPublic ? t('home.public') : t('home.private')}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    <AnimatePresence>
                      {showVisibilityMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowVisibilityMenu(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className={`absolute bottom-full ${isRTL ? 'left-0' : 'right-0'} mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(true);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${isPublic ? 'bg-pink-50' : ''}`}
                            >
                              <Globe className={`w-4 h-4 ${isPublic ? 'text-pink-500' : 'text-gray-400'}`} />
                              <div className={isRTL ? 'text-right' : ''}>
                                <p className={`text-sm font-medium ${isPublic ? 'text-pink-600' : 'text-gray-700'}`}>{t('home.public')}</p>
                                <p className="text-xs text-gray-500">{t('home.publicDesc')}</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(false);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${!isPublic ? 'bg-pink-50' : ''}`}
                            >
                              <Lock className={`w-4 h-4 ${!isPublic ? 'text-pink-500' : 'text-gray-400'}`} />
                              <div className={isRTL ? 'text-right' : ''}>
                                <p className={`text-sm font-medium ${!isPublic ? 'text-pink-600' : 'text-gray-700'}`}>{t('home.private')}</p>
                                <p className="text-xs text-gray-500">{t('home.privateDesc')}</p>
                              </div>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!prompt.trim()}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className={`w-5 h-5 text-gray-600 ${isRTL ? 'rotate-180' : ''}`} />
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

      {/* Upgrade Banner - Show when 50% credits used */}
      {user && shouldShowUpgradeBanner() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-white font-medium">{t('upgrade.banner')}</span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-purple-600 rounded-full font-bold text-sm hover:bg-white/90 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          </div>
        </motion.div>
      )}

      {/* Projects Section */}
      {projects.length > 0 && (
        <ProjectsSection
          projects={projects}
          loading={projectsLoading}
          onOpenProject={onOpenProject || (() => { })}
          onDeleteProject={onDeleteProject || (() => { })}
          onForkProject={onForkProject || (() => { })}
          onNewProject={() => { }}
        />
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
