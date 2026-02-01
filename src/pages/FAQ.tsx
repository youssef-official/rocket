import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft, HelpCircle, Sparkles, CreditCard, Zap, Shield, Globe } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    question: "What is Vivora X?",
    answer: "Vivora X is an AI-powered web application builder that transforms your ideas into production-ready code. Simply describe what you want to build, and watch as Vivora X generates complete React applications with TypeScript and Tailwind CSS.",
    icon: Sparkles
  },
  {
    question: "How do credits work?",
    answer: "Each successful code generation costs 1 credit. Daily credits reset at midnight UTC, and monthly credits are tied to your billing period. Credits are deducted from daily allowance first, then monthly. You can track your usage in the user menu.",
    icon: CreditCard
  },
  {
    question: "What can I build with Vivora X?",
    answer: "You can build landing pages, e-commerce stores, dashboards, admin panels, portfolios, blogs, and any web application. Our AI generates complete applications with multiple pages, routing, and modern UI components.",
    icon: Zap
  },
  {
    question: "Is my code secure?",
    answer: "Yes! Your code is stored securely and you can make projects private. We use industry-standard encryption and never share your code with third parties. You retain full ownership of everything you create.",
    icon: Shield
  },
  {
    question: "Can I deploy my projects?",
    answer: "Absolutely! You can deploy directly to Vercel with one click. Your projects get a live URL that you can share with anyone. You can also download your project as a ZIP file to host anywhere.",
    icon: Globe
  },
  {
    question: "What frameworks does Vivora X support?",
    answer: "Vivora X generates React applications with TypeScript and Tailwind CSS. The generated code uses modern best practices including Vite for fast development, shadcn/ui components, and Framer Motion for animations.",
    icon: Sparkles
  },
  {
    question: "Can I use my own images?",
    answer: "Yes! You can drag and drop images directly into the chat or use the attachment button. The AI can analyze your images and incorporate them into your designs, or use them as inspiration for generating new layouts.",
    icon: HelpCircle
  },
  {
    question: "How do I get more credits?",
    answer: "You can upgrade your plan to get more monthly credits. All plans include daily credits that reset at midnight UTC. Higher tiers provide more credits and additional features like private projects and priority generation.",
    icon: CreditCard
  }
];

export const FAQ: React.FC = () => {
  const { isRTL } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
              <span className="text-white font-medium">FAQ</span>
            </a>
            <a 
              href="/"
              className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              Back to Home
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <HelpCircle className="w-5 h-5 text-pink-400" />
              <span className="text-white text-sm">Frequently Asked Questions</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Got <span className="text-pink-400">Questions?</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Find answers to the most common questions about Vivora X and how it can help you build amazing web applications.
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className={`w-full flex items-center gap-4 p-6 text-left hover:bg-white/5 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <span className="flex-1 text-lg font-medium text-white">
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-6 pb-6 ${isRTL ? 'pr-24 text-right' : 'pl-24'}`}>
                        <p className="text-white/70 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-white/70 mb-6">
                Can't find the answer you're looking for? Feel free to reach out to our support team.
              </p>
              <a
                href="mailto:support@vivora-x.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-full transition-colors"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
