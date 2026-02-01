import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Code, Zap, Palette, Upload, Download, 
  Share2, Settings, MessageSquare, ArrowLeft,
  ChevronRight, Search, Globe, Lock, GitBranch,
  Sparkles, Layers, Rocket, Image as ImageIcon,
  RefreshCw, Languages
} from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const Docs: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'getting-started',
      title: t('docs.gettingStarted'),
      icon: Zap,
      content: [
        {
          title: 'Welcome to Vivora X',
          description: 'Vivora X is an AI-powered web application builder that transforms your ideas into production-ready code. Simply describe what you want to build, and watch as Vivora X generates complete React applications with TypeScript and Tailwind CSS.',
        },
        {
          title: 'Quick Start Guide',
          description: 'Create your first project in under a minute:',
          steps: [
            'Sign up for a free Vivora X account',
            'Navigate to the homepage input field',
            'Describe your project (e.g., "e-commerce site with product catalog and shopping cart")',
            'Press Enter or click the arrow button to start generation',
            'Watch as Vivora X creates your complete application with multiple pages and components!',
          ],
        },
        {
          title: 'Understanding the Editor',
          description: 'The Vivora X editor is split into three main areas for maximum productivity:',
          steps: [
            'Chat Panel - Communicate with AI to modify your project',
            'Preview Panel - See live updates to your application',
            'Code Panel - View and edit generated files directly',
          ],
        },
      ],
    },
    {
      id: 'ai-generation',
      title: t('docs.aiGeneration'),
      icon: Sparkles,
      content: [
        {
          title: 'How AI Generation Works',
          description: 'Vivora X uses advanced AI models to understand your natural language descriptions and convert them into production-ready code. The AI is trained to generate clean, maintainable React components with TypeScript type safety and modern Tailwind CSS styling.',
        },
        {
          title: 'What Vivora X Can Generate',
          description: 'Vivora X can create complete applications including:',
          steps: [
            'Multi-page websites with navigation and routing',
            'E-commerce stores with product catalogs and carts',
            'Dashboards with data visualization and charts',
            'Landing pages with animations and call-to-actions',
            'Admin panels with forms and data tables',
            'Portfolio sites with galleries and contact forms',
          ],
        },
        {
          title: 'Best Practices for Prompts',
          description: 'Get better results by being specific in your descriptions:',
          steps: [
            'Be specific: "Create a blue navbar with logo on left, menu items centered, and login button on right"',
            'Include functionality: "Add a contact form that validates email and shows success message"',
            'Describe the style: "Modern, minimalist design with subtle hover animations and gradient backgrounds"',
            'Mention components: "Use cards for product display with image, title, price, and add-to-cart button"',
          ],
        },
      ],
    },
    {
      id: 'vercel',
      title: t('docs.vercel'),
      icon: Upload,
      content: [
        {
          title: 'Vercel Deployment',
          description: 'Deploy your project to Vercel with one click. Get a live URL instantly that you can share with anyone.',
        },
        {
          title: 'How to Deploy',
          description: 'Follow these steps to deploy to Vercel:',
          steps: [
            'Go to Settings and add your Vercel API Token',
            'Click the "Publish" button in the editor header',
            'Enter a project name (optional)',
            'Click "Deploy to Vercel"',
            'Wait for deployment to complete and get your live URL',
          ],
        },
        {
          title: 'Benefits',
          description: 'Vercel deployment provides:',
          steps: [
            'Instant global CDN distribution',
            'Automatic HTTPS/SSL certificates',
            'Continuous deployment on code changes',
            'Preview deployments for testing',
            'Analytics and performance monitoring',
          ],
        },
      ],
    },
    {
      id: 'multilingual',
      title: t('docs.multilingual'),
      icon: Languages,
      content: [
        {
          title: 'Multi-language Support',
          description: 'Rocket supports multiple languages including English, Arabic (RTL), Chinese, Japanese, and French. The interface automatically adapts to your selected language.',
        },
        {
          title: 'How to Change Language',
          description: 'Follow these steps to change the interface language:',
          steps: [
            'Click on your profile icon in the header',
            'Find the Language option in the dropdown menu',
            'Select your preferred language',
            'The interface will update immediately',
          ],
        },
        {
          title: 'RTL Support',
          description: 'For Arabic language:',
          steps: [
            'The entire interface flips to Right-to-Left',
            'Text alignment adjusts automatically',
            'Icons and navigation adapt to RTL layout',
            'All components support bidirectional text',
          ],
        },
      ],
    },
    {
      id: 'versions',
      title: t('docs.versions'),
      icon: GitBranch,
      content: [
        {
          title: 'Automatic Versioning',
          description: 'Rocket automatically saves a new version every time the AI generates or modifies code. This gives you a complete history of your project\'s evolution.',
        },
        {
          title: 'Version Selector',
          description: 'Use the version badge in the editor to browse through your project history. Each version shows:',
          steps: [
            'Version number for easy reference',
            'Timestamp of when the version was created',
            'The prompt that triggered the generation',
            'All files that were modified',
          ],
        },
        {
          title: 'Rollback Feature',
          description: 'You can rollback to any previous version:',
          steps: [
            'Open the version selector in the chat panel',
            'Find the version you want to restore',
            'Click the "Rollback" button',
            'Confirm the action - this will delete all newer versions',
            'Your project will be restored to that exact state',
          ],
        },
      ],
    },
    {
      id: 'export',
      title: t('docs.exporting'),
      icon: Download,
      content: [
        {
          title: 'Download as ZIP',
          description: 'Export your entire project as a downloadable ZIP file containing all source code, assets, and configuration files.',
        },
        {
          title: 'Running Locally',
          description: 'After downloading, run your project on your local machine:',
          steps: [
            'Extract the ZIP file to a folder',
            'Open terminal/command prompt in that folder',
            'Run: npm install (or yarn install)',
            'Run: npm run dev (or yarn dev)',
            'Open http://localhost:5173 in your browser',
          ],
        },
        {
          title: 'Project Structure',
          description: 'Downloaded projects include all necessary files for a production React application with Vite, TypeScript, Tailwind CSS, and more.',
        },
      ],
    },
    {
      id: 'publishing',
      title: t('docs.publishing'),
      icon: Share2,
      content: [
        {
          title: 'Publishing Your Project',
          description: 'Make your project live on the web with one click:',
          steps: [
            'Click the "Publish" button in the editor toolbar',
            'Rocket will deploy your project to Vercel',
            'Get a unique URL to share with anyone',
            'Updates are deployed instantly when you republish',
          ],
        },
        {
          title: 'Sharing Options',
          description: 'Depending on your visibility settings:',
          steps: [
            'Public: Share the URL for anyone to view and fork',
            'Private: Only you can access the published URL',
          ],
        },
      ],
    },
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div 
        className="flex-1 relative"
        style={{
          backgroundImage: `url(${spaceHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Header */}
        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="/" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">{t('docs.title')}</span>
            </a>
            <a 
              href="/"
              className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('nav.backToHome')}
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className={`relative z-10 flex max-w-7xl mx-auto min-h-[calc(100vh-200px)] ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Sidebar */}
          <aside className={`w-64 min-h-full border-white/10 p-4 hidden md:block ${isRTL ? 'border-l' : 'border-r'}`}>
            {/* Search */}
            <div className="relative mb-6 sticky top-4">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40`} />
              <input
                type="text"
                placeholder={t('docs.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${
                    activeSection === section.id
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile Nav */}
          <div className="md:hidden w-full p-4 border-b border-white/10">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className={`w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-pink-400 ${isRTL ? 'text-right' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {sections.map(section => (
                <option key={section.id} value={section.id} className="bg-gray-900">
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <main className="flex-1 p-6 md:p-10">
            {currentSection && (
              <motion.div
                key={currentSection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <currentSection.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">{currentSection.title}</h1>
                </div>

                <div className="space-y-8">
                  {currentSection.content.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h2 className={`text-xl font-semibold text-white mb-3 ${isRTL ? 'text-right' : ''}`}>{item.title}</h2>
                      <p className={`text-white/70 mb-4 leading-relaxed ${isRTL ? 'text-right' : ''}`}>{item.description}</p>
                      
                      {item.steps && (
                        <ol className="space-y-3">
                          {item.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                                {stepIndex + 1}
                              </span>
                              <span className={`text-white/80 ${isRTL ? 'text-right' : ''}`}>{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className={`flex justify-between mt-10 pt-6 border-t border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {sections.findIndex(s => s.id === activeSection) > 0 && (
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[currentIndex - 1].id);
                      }}
                      className={`flex items-center gap-2 text-white/60 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      Previous
                    </button>
                  )}
                  {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[currentIndex + 1].id);
                      }}
                      className={`flex items-center gap-2 text-white/60 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''} ${isRTL ? '' : 'ml-auto'}`}
                    >
                      Next
                      <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};
