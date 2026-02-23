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
import { toast } from '@/hooks/use-toast';
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
  const { userPlan, shouldShowUpgradeBanner, canUsePrivateProjects, getRemainingCredits } = useUserPlan();
  const isPaidPlan = userPlan?.plan && userPlan.plan !== 'spark';

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
    // Block image upload for free plan
    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPaidPlan) {
      toast({ title: 'Upgrade Required', description: 'Image upload is available on paid plans only.', variant: 'destructive' });
      return;
    }
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
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
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
            <nav className={`hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 absolute left-1/2 -translate-x-1/2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <a href="/pricing" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                {t('nav.pricing')}
              </a>
              <a href="/docs" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                {t('nav.docs')}
              </a>
              <a href="/blog/ai-for-all" className={`px-4 py-2 text-white/80 hover:text-white transition-colors text-sm flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                AI for All
              </a>
            </nav>
          )}

          {/* Actions Section - Left in AR, Right in EN */}
          <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'order-1' : 'order-3'}`}>
            {user ? (
              <>
                <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <a href="/docs" className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Book className="w-5 h-5 text-white/80" />
                  </a>
                  <a href="/faq" className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors">
                    <HelpCircle className="w-5 h-5 text-white/80" />
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
                className={`w-full px-4 md:px-8 py-4 md:py-6 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-base md:text-lg ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={3}
              />

              <div className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 md:gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    className={`hidden md:flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="text-pink-500">🎨</span>
                    <span className="text-sm text-gray-600">{t('home.import')}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-1.5 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Character Count */}
                  <span className={`text-[10px] md:text-xs ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>

                  {/* Visibility Toggle - Public/Private */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-xs md:text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {isPublic ? <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      <span className="hidden sm:inline">{isPublic ? t('home.public') : t('home.private')}</span>
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
                    disabled={!prompt.trim() || isSubmitting}
                    className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
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
