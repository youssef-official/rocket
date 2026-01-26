import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, FolderOpen, Paperclip, Lock, Globe, User, Bell, HelpCircle, MessageSquare, X, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { UserMenuDropdown } from '@/components/shared/UserMenuDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsSection } from './ProjectsSection';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { FrameworkBar } from '@/components/shared/FrameworkLogos';
import { Footer } from '@/components/shared/Footer';
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
  onStartBuilding: (prompt: string, projectType: 'vite' | 'html') => void;
  onViewDashboard?: () => void;
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onForkProject?: (id: string) => void;
  onShowAuth?: () => void;
  projects?: Project[];
  projectsLoading?: boolean;
}

// Typing animation words
const typingWords = ['dashboard.', 'landing page.', 'e-commerce site.', 'portfolio.', 'blog.'];
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
  const {
    user,
    signOut
  } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('React');
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
  }, [displayText, isDeleting, typingIndex]);

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
      setUploadedImage({
        file,
        preview
      });
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({
        file,
        preview
      });
    }
  };
  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
      setUploadedImage(null);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const projectType = selectedFramework === 'React' || selectedFramework === 'Next.js' ? 'vite' : 'html';
      onStartBuilding(prompt, projectType);
    }
  };
  return <div className="min-h-screen relative overflow-hidden" style={{
    backgroundImage: `url(${spaceHeroBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Header */}
      <header className="relative z-10 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <RocketLogo size="md" />
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full hidden sm:inline text-xs">BETA</span>
          </div>

          {/* Nav - hidden when logged in */}
          {!user && <nav className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1">
              <a href="/pricing" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                Pricing
              </a>
              <a href="/docs" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
                Docs
              </a>
              <a href="/pricing" className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm flex items-center gap-1">
                Resources
                <ArrowRight className="w-3 h-3 rotate-90" />
              </a>
            </nav>}

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? <>
                <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1">
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
                
                <UserMenuDropdown user={user} signOut={signOut} />
              </> : <button onClick={() => window.location.href = '/login'} className="px-4 md:px-5 py-2 md:py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors text-sm md:text-base">
                Sign in
              </button>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32">
        {/* Announcement Badge */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">New</span>
            <span className="text-white text-xs md:text-sm">Rocket Mobile for iPhone is here</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        {/* Hero Title */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4">
            Think It. <span className="text-pink-400">Type It.</span> Launch It.
          </h1>
          <p className="text-base md:text-xl text-white/80">
            Build production-ready{' '}
            <span className="text-white underline decoration-pink-400 decoration-2 underline-offset-4">
              {displayText}
            </span>
            <span className="typing-cursor" />
          </p>
        </motion.div>

        {/* Main Input Card */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="w-full max-w-3xl">
          <form onSubmit={handleSubmit}>
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden relative transition-colors ${isDragging ? 'ring-2 ring-pink-400' : ''}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
              {/* Drag overlay */}
              {isDragging && <div className="absolute inset-0 z-10 bg-pink-50 border-2 border-dashed border-pink-400 rounded-2xl flex items-center justify-center pointer-events-none">
                  <div className="text-pink-500 font-medium flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Drop image here</span>
                  </div>
                </div>}

              {/* Uploaded Image Preview */}
              {uploadedImage && <div className="px-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={uploadedImage.preview} alt="Uploaded" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={removeUploadedImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">
                      {uploadedImage.file.name}
                    </span>
                  </div>
                </div>}

              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="What can I build for you today?" className="w-full px-6 py-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-lg" rows={4} />
              
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  <button type="button" className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className="text-pink-500">🎨</span>
                    <span className="text-sm text-gray-600">Import</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Visibility Toggle - Public/Private */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {isPublic ? 'Public' : 'Private'}
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
                            className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(true);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isPublic ? 'bg-pink-50' : ''}`}
                            >
                              <Globe className={`w-4 h-4 ${isPublic ? 'text-pink-500' : 'text-gray-400'}`} />
                              <div>
                                <p className={`text-sm font-medium ${isPublic ? 'text-pink-600' : 'text-gray-700'}`}>Public</p>
                                <p className="text-xs text-gray-500">Anyone can view & fork</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPublic(false);
                                setShowVisibilityMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${!isPublic ? 'bg-pink-50' : ''}`}
                            >
                              <Lock className={`w-4 h-4 ${!isPublic ? 'text-pink-500' : 'text-gray-400'}`} />
                              <div>
                                <p className={`text-sm font-medium ${!isPublic ? 'text-pink-600' : 'text-gray-700'}`}>Private</p>
                                <p className="text-xs text-gray-500">Only you can access</p>
                              </div>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.button type="submit" whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }} disabled={!prompt.trim()} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors disabled:opacity-50">
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Frameworks & Integrations with real logos */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="mt-8 w-full max-w-3xl">
          <FrameworkBar selectedFramework={selectedFramework} onSelectFramework={setSelectedFramework} />
        </motion.div>
      </main>

      {/* Projects Section */}
      {projects.length > 0 && <ProjectsSection projects={projects} loading={projectsLoading} onOpenProject={onOpenProject || (() => {})} onDeleteProject={onDeleteProject || (() => {})} onForkProject={onForkProject || (() => {})} onNewProject={() => {}} />}

      {/* Footer */}
      <Footer />
    </div>;
};