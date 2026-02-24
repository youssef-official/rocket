import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Code, Zap, Palette, Upload, Download, 
  Share2, Settings, MessageSquare, ArrowLeft,
  ChevronRight, Search, Globe, Lock, GitBranch,
  Sparkles, Layers, Rocket, Image as ImageIcon,
  RefreshCw, Languages, CreditCard, Shield, Eye,
  PenTool, Bell, Users, Wand2
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
      icon: Sparkles,
      content: [
        {
          title: 'How AI Generation Works',
          description: 'Vivora X uses advanced AI models (Gemini 3 Flash) to understand your natural language descriptions and convert them into production-ready code. The AI generates clean, maintainable React components with TypeScript type safety, Tailwind CSS styling, and a premium "Classic" design aesthetic with Playfair Display and Plus Jakarta Sans fonts.',
        },
        {
          title: 'What Vivora X Can Generate',
          description: 'Vivora X can create complete applications including:',
          steps: [
            'Multi-page websites with navigation and React Router',
            'E-commerce stores with product catalogs, shopping carts, and checkout',
            'Dashboards with data visualization, charts, and analytics',
            'Landing pages with animations (Framer Motion) and call-to-actions',
            'Admin panels with CRUD forms, data tables, and password protection',
            'Portfolio sites with galleries, animations, and contact forms',
            'Blog and content sites with rich typography and layouts',
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
          description: 'Vivora X can analyze uploaded images (screenshots, mockups, designs) and recreate them as functional code. Simply attach an image to your prompt and describe what you want.',
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
            'Upload one image at a time for best accuracy',
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
        {
          title: 'What Can Be Edited',
          description: 'Visual Edit supports modifying:',
          steps: [
            'Text content (headings, paragraphs, button labels)',
            'Colors (text color, background color)',
            'Font properties (size, weight, family)',
            'Alignment and spacing',
            'Background colors and gradients',
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
            'If you have fewer credits than required, the remaining balance is deducted (partial deduction)',
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
        {
          title: 'Daily & Monthly Credits',
          description: 'Daily credits reset automatically at UTC midnight. Monthly credits are added when your subscription renews. Daily credits are consumed first, then monthly credits.',
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
          description: 'Connect your GitHub account and push your Vivora X projects directly to any repository. Each version can be committed as a new update.',
        },
        {
          title: 'How to Connect GitHub',
          description: 'Follow these steps to set up GitHub integration:',
          steps: [
            'Go to Settings from the top menu',
            'Navigate to the GitHub section',
            'Enter your GitHub Personal Access Token (PAT)',
            'Click Connect — your username will appear once connected',
          ],
        },
        {
          title: 'Publishing a Project',
          description: 'Once connected, you can push any project:',
          steps: [
            'Open your project in the editor',
            'Click the GitHub icon in the header toolbar',
            'Choose to create a new repository or push to an existing one',
            'Enter the repository name and click Push',
            'A README is auto-generated with your project details',
            'Subsequent pushes update the same repo with new commits',
          ],
        },
        {
          title: 'Tips',
          description: 'Keep in mind:',
          steps: [
            'Your GitHub repo link is saved per project for easy re-pushing',
            'The "Update Changes" button appears after the first push for quick updates',
            'You can push after rolling back to a previous version',
            'Your PAT needs the "repo" scope for full access',
          ],
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
          description: 'Vivora X has a built-in notification system. Click the bell icon in the navigation bar to open the Inbox panel and see announcements, updates, and messages from the team.',
        },
        {
          title: 'How It Works',
          description: 'The notification system includes:',
          steps: [
            'A red badge appears on the bell icon when you have unread notifications',
            'Click the bell to open the slide-out Inbox panel',
            'Notifications can include images, text, and links',
            'Click a notification to mark it as read and open any associated link',
            'Notifications can be targeted to specific plan tiers',
          ],
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
            'Browse the Templates section on the homepage (visible to all users)',
            'Click on any template card',
            'The template prompt is automatically filled into the generation input',
            'Press Enter to generate a project based on that design',
            'Customize further by chatting with the AI in the editor',
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
          description: 'Vivora X automatically saves a new version every time the AI generates or modifies code. This gives you a complete history of your project\'s evolution.',
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
            'Confirm the action — this will delete all newer versions',
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
          description: 'Deploy your project to Vercel with one click. Get a live URL instantly that you can share with anyone.',
        },
        {
          title: 'How to Deploy',
          description: 'Follow these steps:',
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
          description: 'After downloading, run your project on your local machine:',
          steps: [
            'Extract the ZIP file to a folder',
            'Open terminal in that folder',
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
        {
          title: 'How to Change Language',
          description: 'Follow these steps:',
          steps: [
            'Click on your profile icon in the header',
            'Find the Language option in the dropdown menu',
            'Select your preferred language',
            'The interface will update immediately including RTL support for Arabic',
          ],
        },
      ],
    },
    {
      id: 'database',
      title: 'Database Integration',
      icon: Code,
      content: [
        {
          title: 'Connect Your Database',
          description: 'Use the DB tab in the editor to connect your Supabase project. Enter your Supabase URL and Anon Key to enable database-backed features.',
        },
        {
          title: 'SQL Migrations',
          description: 'When the AI needs database tables, it generates SQL migration files:',
          steps: [
            'Migrations are saved as migrations/001-ver.sql, 002-ver.sql, etc.',
            'Each migration creates tables, indexes, and RLS policies',
            'You run these migrations in your Supabase SQL Editor',
            'The AI tells you which file to run after each generation',
          ],
        },
        {
          title: 'Edge Functions',
          description: 'For server-side logic, the AI creates Supabase Edge Functions:',
          steps: [
            'Functions are created in supabase/functions/{name}/index.ts',
            'Deploy them using the Supabase CLI: supabase functions deploy {name}',
            'See /supabase-connect for detailed setup instructions',
          ],
        },
      ],
    },
    {
      id: 'ai-gateway',
      title: 'AI Gateway',
      icon: Sparkles,
      content: [
        {
          title: 'Free AI Gateway',
          description: 'Vivora X provides a free AI endpoint for developers at https://ai-gateway.vivorax.online/api/ai/generate — no API key, no billing, no rate limits.',
        },
        {
          title: 'How to Use',
          description: 'Simple HTTP POST request:',
          steps: [
            'Send POST request to https://ai-gateway.vivorax.online/api/ai/generate',
            'Body: { "prompt": "your question", "config": { "stream": false, "temperature": 0.8 } }',
            'Response: { "result": "AI response text" }',
            'No API key needed — works from browser or server',
            'See /ai-for-all for full code examples in JS, Python, cURL, and React',
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
