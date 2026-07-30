import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft, HelpCircle, Sparkles, Zap, Shield, Globe, Mail } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { SEOHead } from '@/components/shared/SEOHead';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    question: "What is Vivora X?",
    answer: "Vivora X is an AI-powered website builder. Describe what you want and Vivora X generates a complete browser-native website with linked HTML pages, CSS, JavaScript, and organized folders.",
    icon: Sparkles
  },
  {
    question: "What can I build with Vivora X?",
    answer: "You can build landing pages, e-commerce stores, dashboards, admin panels, portfolios, blogs, and any web application. Our AI generates complete applications with multiple pages, routing, and modern UI components.",
    icon: Zap
  },
  {
    question: "Is my code secure?",
    answer: "Yes! Your code is stored securely and you can make projects private (paid plans). We use industry-standard encryption and never share your code with third parties. You retain full ownership of everything you create.",
    icon: Shield
  },
  {
    question: "Can I export my projects?",
    answer: "Yes. Paid plans can download the complete project as a ZIP file, including every page, asset, and folder.",
    icon: Globe
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="FAQ — Vivora X Frequently Asked Questions"
        description="Find answers to common questions about Vivora X website generation, project files, and data."
        keywords="vivora x faq, vibe coding questions, vivorax help, AI web builder faq"
        canonical="https://vivorax.online/faq"
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

        {/* Header */}
        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium text-sm">FAQ</span>
            </a>
            <a 
              href="/"
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4 text-pink-400" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Got <span className="text-pink-400">Questions?</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Everything you need to know about Vivora X.
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {faqData.map((item, index) => {
              const isOpen = openIndex === index;
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  <div
                    className={`rounded-2xl border transition-all duration-200 ${
                      isOpen
                        ? 'border-pink-500/30 bg-white/10 shadow-lg shadow-pink-500/10'
                        : 'border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOpen ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 font-semibold text-white">
                        {item.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-white/50" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pl-[4.75rem]">
                            <p className="text-white/70 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl p-10 text-center">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Still have questions?
                </h2>
                <p className="text-white/70 mb-8 max-w-md mx-auto">
                  Our support team is happy to help you with anything.
                </p>
                <a
                  href="mailto:support@vivorax.online"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-full transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
