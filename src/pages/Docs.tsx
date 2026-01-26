import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Code, Zap, Palette, Upload, Download, 
  Share2, Settings, MessageSquare, ArrowLeft,
  ChevronRight, Search, Globe, Lock, GitBranch,
  Sparkles, Layers, Rocket, Image as ImageIcon
} from 'lucide-react';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { Footer } from '@/components/shared/Footer';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    content: [
      {
        title: 'Welcome to Rocket',
        description: 'Rocket is an AI-powered web application builder that transforms your ideas into production-ready code. Simply describe what you want to build, and watch as Rocket generates complete React applications with TypeScript and Tailwind CSS.',
      },
      {
        title: 'Quick Start Guide',
        description: 'Create your first project in under a minute:',
        steps: [
          'Sign up for a free Rocket account',
          'Navigate to the homepage input field',
          'Describe your project (e.g., "e-commerce site with product catalog and shopping cart")',
          'Press Enter or click the arrow button to start generation',
          'Watch as Rocket creates your complete application with multiple pages and components!',
        ],
      },
      {
        title: 'Understanding the Editor',
        description: 'The Rocket editor is split into three main areas for maximum productivity:',
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
    title: 'AI Code Generation',
    icon: Sparkles,
    content: [
      {
        title: 'How AI Generation Works',
        description: 'Rocket uses advanced AI models to understand your natural language descriptions and convert them into production-ready code. The AI is trained to generate clean, maintainable React components with TypeScript type safety and modern Tailwind CSS styling.',
      },
      {
        title: 'What Rocket Can Generate',
        description: 'Rocket can create complete applications including:',
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
    id: 'public-private',
    title: 'Public & Private Projects',
    icon: Globe,
    content: [
      {
        title: 'Project Visibility',
        description: 'Rocket supports two visibility modes for your projects, giving you control over who can access your work.',
      },
      {
        title: 'Public Projects',
        description: 'Public projects are perfect for sharing your work with the community:',
        steps: [
          'Anyone with the link can view the live preview',
          'Other users can fork (copy) your project to their own account',
          'Great for showcasing portfolios, demos, and open-source templates',
          'Forking creates a completely independent copy that the new owner controls',
        ],
      },
      {
        title: 'Private Projects',
        description: 'Private projects keep your work secure and confidential:',
        steps: [
          'Only you (the project owner) can access the project',
          'Others cannot view or fork your project',
          'Perfect for client work, personal projects, and proprietary code',
          'You can switch from private to public at any time',
        ],
      },
      {
        title: 'Forking Public Projects',
        description: 'When you visit a public project link, you\'ll see the live preview with a "Fork" button. Clicking Fork creates your own copy of the project with all the code, which you can then modify freely without affecting the original.',
      },
    ],
  },
  {
    id: 'editing',
    title: 'Editing Your Project',
    icon: Palette,
    content: [
      {
        title: 'Using the Code Editor',
        description: 'The built-in Monaco editor provides a professional coding experience:',
        steps: [
          'Syntax highlighting for TypeScript, JSX, CSS, and more',
          'File tree navigation to browse all project files',
          'Real-time preview updates as you type',
          'Multi-file editing with tabs',
        ],
      },
      {
        title: 'AI-Assisted Editing',
        description: 'Use natural language to modify your project through the chat interface. Simply describe the changes you want, and Rocket will update the code automatically.',
      },
      {
        title: 'Build Mode',
        description: 'In Build mode, every AI response modifies your code and creates a new version. This is the default mode for making changes to your project.',
      },
    ],
  },
  {
    id: 'images',
    title: 'Working with Images',
    icon: ImageIcon,
    content: [
      {
        title: 'Uploading Images',
        description: 'Rocket supports image uploads to help the AI understand your vision:',
        steps: [
          'Drag and drop images directly into the chat input',
          'Click the paperclip icon to select files from your computer',
          'Supported formats: PNG, JPG, GIF, WebP, and SVG',
        ],
      },
      {
        title: 'Using Images in Prompts',
        description: 'When you upload an image, you can reference it in your prompt. For example: "Create a landing page that matches this design" or "Use this logo in the navbar".',
      },
      {
        title: 'AI Image Analysis',
        description: 'The AI can analyze uploaded images to understand layouts, color schemes, and design patterns, then generate matching code.',
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
        title: 'Restoring Previous Versions',
        description: 'Click on any version to instantly restore your project to that state. Both the code and preview will update immediately. This is perfect for undoing unwanted changes or experimenting freely.',
      },
    ],
  },
  {
    id: 'export',
    title: 'Exporting Projects',
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
    title: 'Publishing & Sharing',
    icon: Share2,
    content: [
      {
        title: 'Publishing Your Project',
        description: 'Make your project live on the web with one click:',
        steps: [
          'Click the "Publish" button in the editor toolbar',
          'Rocket will deploy your project to our hosting infrastructure',
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

export const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen flex flex-col">
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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <RocketLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">Documentation</span>
            </a>
            <a 
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 flex max-w-7xl mx-auto min-h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <aside className="w-64 min-h-full border-r border-white/10 p-4 hidden md:block">
            {/* Search */}
            <div className="relative mb-6 sticky top-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
              />
            </div>

            {/* Navigation */}
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
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-pink-400"
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

                {/* Navigation */}
                <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                  {sections.findIndex(s => s.id === activeSection) > 0 && (
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[currentIndex - 1].id);
                      }}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </button>
                  )}
                  {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                        setActiveSection(sections[currentIndex + 1].id);
                      }}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors ml-auto"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Docs;
