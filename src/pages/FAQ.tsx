import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft, HelpCircle, Sparkles, Zap, Shield, Globe, GitBranch, Mail } from 'lucide-react';
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
    answer: "Vivora X is an AI-powered web application builder that transforms your ideas into production-ready code. Simply describe what you want to build, and watch as Vivora X generates complete React applications with TypeScript and Tailwind CSS.",
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
    question: "Can I deploy my projects?",
    answer: "Absolutely! You can deploy directly to Vercel with one click, or push your code to a GitHub repository. Your projects get a live URL that you can share with anyone. Paid plans can also download projects as ZIP files.",
    icon: Globe
  },
  {
    question: "Can I push my code to GitHub?",
    answer: "Yes! Connect your GitHub account in the editor, then push your project to any repository. Each new version can be pushed as a new commit. Your repo link is saved per project for easy updates.",
    icon: GitBranch
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="FAQ — Vivora X Frequently Asked Questions"
        description="Find answers to common questions about Vivora X vibe coding platform. Learn about deployment, GitHub integration, and more."
        keywords="vivora x faq, vibe coding questions, vivorax help, AI web builder faq"
        canonical="https://vivorax.online/faq"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <VivoraLogo size="md" />
            <div className="h-5 w-px bg-border" />
            <span className="text-foreground/70 font-medium text-sm">FAQ</span>
          </a>
          <a 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-20">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
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
                        ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5'
                        : 'border-border bg-card hover:border-primary/20 hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 font-semibold text-foreground">
                        {item.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
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
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
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
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Still have questions?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Our support team is happy to help you with anything.
                </p>
                <a
                  href="mailto:support@vivorax.online"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
