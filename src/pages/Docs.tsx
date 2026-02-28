import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Code, Zap, Palette, Upload, Download, 
  Share2, Settings, MessageSquare, ArrowLeft,
  ChevronRight, Search, Globe, Lock, GitBranch,
  Layers, Rocket, Image as ImageIcon,
  RefreshCw, Languages, CreditCard, Shield, Eye,
  PenTool, Bell, Users, Copy, Mail, Database
} from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { SEOHead } from '@/components/shared/SEOHead';

import { useLanguage } from '@/contexts/LanguageContext';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const Docs: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: [
        {
          title: 'Welcome to Vivora X',
          description: 'Vivora X is an AI-powered web application builder that transforms your ideas into production-ready React applications with TypeScript and Tailwind CSS. Simply describe what you want, and Vivora X generates a complete multi-page project in seconds.',
        },
        {
          title: 'Quick Start Guide',
          description: 'Create your first project in under a minute:',
          steps: [
            'Sign up for a free Vivora X account',
            'Navigate to the homepage input field',
            'Describe your project (e.g., "Modern e-commerce store with product catalog, cart, and checkout")',
            'Press Enter or click the send button to start generation',
            'Watch as Vivora X creates your complete application with multiple pages, components, and styling!',
          ],
        },
        {
          title: 'Understanding the Editor',
          description: 'The Vivora X editor is split into three main areas for maximum productivity:',
          steps: [
            'Chat Panel — Communicate with AI to modify, iterate, and improve your project',
            'Preview Panel — See live updates rendered in real-time as AI generates code',
            'Code Panel — View, browse, and manually edit generated source files',
          ],
        },
      ],
    },
    {
      id: 'ai-generation',
      title: 'AI Code Generation',
      icon: Code,
      content: [
        {
          title: 'How AI Generation Works',
          description: 'Vivora X uses advanced AI models to understand your natural language descriptions and convert them into production-ready code. The AI generates clean, maintainable React components with TypeScript type safety, Tailwind CSS styling, and a premium "Classic" design aesthetic.',
        },
        {
          title: 'What Vivora X Can Generate',
          description: 'Vivora X can create complete applications including:',
          steps: [
            'Multi-page websites with navigation and routing',
            'E-commerce stores with product catalogs, shopping carts, and checkout',
            'Dashboards with data visualization, charts, and analytics',
            'Landing pages with animations (Framer Motion) and call-to-actions',
            'Admin panels with CRUD forms, data tables, and password protection',
            'Portfolio sites with galleries, animations, and contact forms',
            'Blog and content sites with rich typography and layouts',
            '3D immersive experiences using Three.js',
          ],
        },
        {
          title: 'Admin Dashboard Generation',
          description: 'When you ask for an admin panel, Vivora X builds a fully functional dashboard — not a mockup:',
          steps: [
            'Centralized state management with React Context + useReducer',
            'Full CRUD operations: Create, Read, Update, Delete — all working',
            'Real statistics calculated from actual data in state',
            'Form validation with error messages for all inputs',
            'Password-protected admin login',
            'Responsive sidebar with icon navigation',
            'Minimum 5-10 sample data items pre-loaded',
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
            'Reference design: You can upload an image/screenshot and say "Build something like this"',
          ],
        },
      ],
    },
    {
      id: 'image-analysis',
      title: 'Image Analysis',
      icon: ImageIcon,
      content: [
        {
          title: 'Upload Images for Design Reference',
          description: 'Vivora X supports multimodal analysis — upload up to 5 images per prompt (screenshots, mockups, designs) and the AI recreates them as functional code.',
        },
        {
          title: 'How Image Analysis Works',
          description: 'When you upload an image:',
          steps: [
            'The image is uploaded to secure cloud storage',
            'The AI model analyzes the visual design, layout, colors, and components',
            'It generates matching React code with accurate styling and structure',
            'You can further refine by chatting with the AI about specific changes',
          ],
        },
        {
          title: 'Tips for Best Results',
          description: 'For optimal image analysis:',
          steps: [
            'Use clear, high-resolution screenshots',
            'Crop to the specific section you want recreated',
            'Add a text prompt describing any modifications you want',
            'Upload up to 5 images at once for multi-reference analysis',
          ],
        },
      ],
    },
    {
      id: 'visual-edit',
      title: 'Visual Editing',
      icon: PenTool,
      content: [
        {
          title: 'Visual Edit Mode',
          description: 'Visual Edit mode lets you click on elements directly in the preview and modify them visually — changing text, colors, fonts, alignment, and more without writing code.',
        },
        {
          title: 'How to Use Visual Edit',
          description: 'Follow these steps:',
          steps: [
            'Open your project in the editor',
            'Click the "Visual Edit" button in the toolbar',
            'A sidebar panel appears next to the live preview',
            'Click on any element in the preview to select it',
            'Modify properties like text content, colors, font size, alignment',
            'Click "Save Changes" to apply — the AI updates your source code precisely',
          ],
        },
      ],
    },
    {
      id: 'credits',
      title: 'Credits & Plans',
      icon: CreditCard,
      content: [
        {
          title: 'Credit System',
          description: 'Credits are deducted based on the number of files modified — not by AI estimation. This ensures transparent and fair billing.',
        },
        {
          title: 'How Credits Are Calculated',
          description: 'The credit cost depends on file count:',
          steps: [
            'First version (new project): 2 credits',
            '1-2 files modified: 0.5 credits',
            '3-5 files modified: 1 credit',
            '6-10 files modified: 1.5 credits',
            '10+ files modified: 3 credits',
          ],
        },
        {
          title: 'Available Plans',
          description: 'Choose the plan that fits your needs:',
          steps: [
            'Free ($0) — 3 daily credits, public projects only, no ZIP export',
            'Pro ($15/mo) — 5 daily + 150 monthly credits, ZIP export, private projects',
            'Business ($29/mo) — 10 daily + 400 monthly credits, ZIP export, private projects, priority access',
          ],
        },
      ],
    },
    {
      id: 'github',
      title: 'GitHub Publishing',
      icon: GitBranch,
      content: [
        {
          title: 'Push to GitHub',
          description: 'Connect your GitHub account and push your Vivora X projects directly to any repository.',
        },
        {
          title: 'How to Connect GitHub',
          description: 'Follow these steps:',
          steps: [
            'Go to Settings from the top menu',
            'Navigate to the GitHub section',
            'Enter your GitHub Personal Access Token (PAT)',
            'Click Connect — your username will appear once connected',
          ],
        },
        {
          title: 'Publishing a Project',
          description: 'Once connected:',
          steps: [
            'Open your project in the editor',
            'Click the GitHub icon in the header toolbar',
            'Choose to create a new repository or push to an existing one',
            'Enter the repository name and click Push',
            'A README is auto-generated with your project details',
          ],
        },
      ],
    },
    {
      id: 'database',
      title: 'Database Integration',
      icon: Database,
      content: [
        {
          title: 'Connect Your Supabase Database',
          description: 'Use the DB tab in the editor to connect your own Supabase project via OAuth. Click "Sign in with Supabase" to authenticate, then select your project from the list or enter your Project ID manually.',
        },
        {
          title: 'How Database Connection Works',
          description: 'The connection flow:',
          steps: [
            'Click the DB tab in the editor',
            'Click "Sign in with Supabase" — this uses secure OAuth (no credentials stored)',
            'Your Supabase projects appear in a list — select one to connect',
            'If projects don\'t appear, enter your Supabase Project ID manually',
            'Vivora X saves the project URL and Anon Key to your project record',
            'The AI generates a Supabase client, migrations, and Edge Functions',
          ],
        },
        {
          title: 'SQL Migrations',
          description: 'When the AI needs database tables, it generates SQL migration files that are auto-executed on your connected Supabase project.',
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      content: [
        {
          title: 'Inbox Notifications',
          description: 'Vivora X has a built-in notification system. Click the bell icon in the navigation bar to see announcements, updates, and messages from the team.',
        },
      ],
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: Layers,
      content: [
        {
          title: 'Pre-Built Templates',
          description: 'Vivora X offers a curated collection of templates — pre-designed project prompts that generate professional applications with one click.',
        },
        {
          title: 'Using Templates',
          description: 'To use a template:',
          steps: [
            'Browse the Templates section on the homepage',
            'Click on any template card',
            'The template prompt is filled into the generation input',
            'Press Enter to generate a project based on that design',
            'Customize further by chatting with the AI',
          ],
        },
      ],
    },
    {
      id: 'versions',
      title: 'Version History',
      icon: GitBranch,
      content: [
        {
          title: 'Automatic Versioning',
          description: 'Vivora X automatically saves a new version every time the AI generates or modifies code, giving you a complete history.',
        },
        {
          title: 'Rollback Feature',
          description: 'You can rollback to any previous version:',
          steps: [
            'Open the version selector in the chat panel',
            'Find the version you want to restore',
            'Click the "Rollback" button and confirm',
            'Your project will be restored to that exact state',
          ],
        },
      ],
    },
    {
      id: 'vercel',
      title: 'Vercel Deployment',
      icon: Upload,
      content: [
        {
          title: 'Deploy to Vercel',
          description: 'Deploy your project to Vercel with one click. Get a live URL instantly.',
        },
        {
          title: 'How to Deploy',
          description: 'Steps:',
          steps: [
            'Go to Settings and add your Vercel API Token',
            'Click the "Publish" button in the editor header',
            'Enter a project name (optional)',
            'Click "Deploy to Vercel"',
            'Wait for deployment to complete and get your live URL',
          ],
        },
      ],
    },
    {
      id: 'export',
      title: 'Export & Download',
      icon: Download,
      content: [
        {
          title: 'Download as ZIP',
          description: 'Export your entire project as a downloadable ZIP file containing all source code, assets, and configuration files.',
        },
        {
          title: 'Running Locally',
          description: 'After downloading:',
          steps: [
            'Extract the ZIP file to a folder',
            'Run: npm install',
            'Run: npm run dev',
            'Open http://localhost:5173 in your browser',
          ],
        },
      ],
    },
    {
      id: 'multilingual',
      title: 'Multi-Language',
      icon: Languages,
      content: [
        {
          title: 'Multi-language Support',
          description: 'Vivora X supports multiple languages including English, Arabic (RTL), Chinese, Japanese, and French. The interface automatically adapts to your selected language.',
        },
      ],
    },
    {
      id: 'clone-design',
      title: 'Clone Design',
      icon: Copy,
      content: [
        {
          title: 'Clone Any Website Design',
          description: 'Clone Design lets you enter any website URL and Vivora X will scrape its HTML, analyze its design, and recreate it as a fully functional React project.',
        },
        {
          title: 'How to Use',
          description: 'Steps:',
          steps: [
            'Find the "Clone Design" input on the homepage',
            'Enter any website URL',
            'Add an optional description of changes you want',
            'Press Enter — the AI scrapes and generates a matching React project',
          ],
        },
      ],
    },
    {
      id: 'email-notifications',
      title: 'Email Notifications',
      icon: Mail,
      content: [
        {
          title: 'Automatic Email Notifications',
          description: 'Vivora X sends professional branded emails at key moments — welcome emails on signup, congratulations on plan upgrades, and renewal reminders.',
        },
      ],
    },
    {
      id: '3d-immersive',
      title: '3D & Immersive Web',
      icon: Globe,
      content: [
        {
          title: '3D Web Experiences',
          description: 'Vivora X can generate immersive 3D websites using Three.js. Ask for 3D product showcases, interactive scenes, particle systems, or game-like interfaces.',
        },
        {
          title: 'What You Can Build',
          description: '3D capabilities include:',
          steps: [
            'Rotating 3D product viewers with orbit controls',
            'Animated particle systems and floating geometries for hero backgrounds',
            'Interactive 3D scenes with mouse-following objects',
            'Simple browser-based 3D games with scoring',
            'PBR materials, shadows, and post-processing effects',
          ],
        },
      ],
    },
    {
      id: 'hero-videos',
      title: 'Hero Video Backgrounds',
      icon: Eye,
      content: [
        {
          title: 'CDN Video Backgrounds',
          description: 'Vivora X automatically adds cinematic hero video backgrounds from a CDN library. The AI selects the most relevant video category and embeds it directly.',
        },
        {
          title: 'Available Categories',
          description: 'Videos are available for:',
          steps: [
            'AI / Machine Learning websites',
            'Business / Corporate websites',
            'Education / Learning platforms',
            'Gaming websites',
            'Restaurant / Food websites',
            'Technology / SaaS platforms',
          ],
        },
      ],
    },
    {
      id: 'voice-input',
      title: 'Voice Input',
      icon: MessageSquare,
      content: [
        {
          title: 'Speech-to-Text Input',
          description: 'Use the microphone button on the homepage to dictate your project description. Supports English, Arabic, Chinese, Japanese, and French.',
        },
      ],
    },
    {
      id: 'ai-gateway',
      title: 'AI Gateway',
      icon: Rocket,
      content: [
        {
          title: 'Free AI Gateway',
          description: 'Vivora X provides a free AI endpoint for developers at https://ai-gateway.vivorax.online/api/ai/generate — no API key, no billing.',
        },
        {
          title: 'How to Use',
          description: 'Simple HTTP POST request:',
          steps: [
            'Send POST to https://ai-gateway.vivorax.online/api/ai/generate',
            'Body: { "prompt": "your question", "config": { "stream": false } }',
            'Response: { "result": "AI response text" }',
            'No API key needed — works from browser or server',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      content: [
        {
          title: 'Data Protection',
          description: 'Your data is encrypted and stored securely. We never share your code or personal information with third parties.',
        },
        {
          title: 'Account Security',
          description: 'Security features include:',
          steps: [
            'Email-based authentication with password hashing',
            'Session management with automatic token refresh',
            'Row-Level Security (RLS) on all database tables',
            'Private projects visible only to owners',
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
      <SEOHead
        title="Documentation — Vivora X Guide"
        description="Complete guide to using Vivora X vibe coding platform. Learn how to build React apps with AI, deploy to Vercel, manage credits, and integrate GitHub."
        keywords="vivora x docs, vibe coding documentation, vivorax guide, AI web builder tutorial, React app builder guide, how to use vivora x"
        canonical="https://vivorax.online/docs"
      />
      <div 
        className="flex-1 relative"
        style={{
          backgroundImage: `url(${spaceHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />

        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="/" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">Documentation</span>
            </a>
            <a href="/" className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              Back to Home
            </a>
          </div>
        </header>

        <div className={`relative z-10 flex max-w-7xl mx-auto min-h-[calc(100vh-200px)] ${isRTL ? 'flex-row-reverse' : ''}`}>
          <aside className={`w-64 min-h-full border-white/10 p-4 hidden md:block ${isRTL ? 'border-l' : 'border-r'}`}>
            <div className="relative mb-6 sticky top-4">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40`} />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400`}
              />
            </div>
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeSection === section.id
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="md:hidden w-full p-4 border-b border-white/10">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-pink-400"
            >
              {sections.map(section => (
                <option key={section.id} value={section.id} className="bg-gray-900">
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <main className="flex-1 p-6 md:p-10">
            {currentSection && (
              <motion.div
                key={currentSection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <currentSection.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">{currentSection.title}</h1>
                </div>

                <div className="space-y-8">
                  {currentSection.content.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h2 className="text-xl font-semibold text-white mb-3">{item.title}</h2>
                      <p className="text-white/70 mb-4 leading-relaxed">{item.description}</p>
                      {item.steps && (
                        <ol className="space-y-3">
                          {item.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                                {stepIndex + 1}
                              </span>
                              <span className="text-white/80">{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                  {sections.findIndex(s => s.id === activeSection) > 0 && (
                    <button
                      onClick={() => {
                        const idx = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[idx - 1].id);
                      }}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>
                  )}
                  {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                    <button
                      onClick={() => {
                        const idx = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[idx + 1].id);
                      }}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors ml-auto"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
