import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft, HelpCircle, Sparkles, CreditCard, Zap, Shield, Globe, GitBranch } from 'lucide-react';
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
    question: "How do credits work?",
    answer: "Credits are deducted AFTER each successful generation based on the number of files modified:\n\n• First version (new project): 2 credits\n• 1–2 files modified: 0.5 credits\n• 2–3 files modified: 1 credit\n• 4–5 files modified: 3 credits\n• 6+ files modified: 5 credits\n\nAll plans get 5 daily credits that reset at midnight UTC. Paid plans also receive monthly credits (Builder: 40, Creator: 50, Scale: 70). Daily credits are used first, then monthly credits. If your remaining balance is less than required, whatever you have left is deducted (partial usage allowed).",
    icon: CreditCard
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
  },
  {
    question: "What are the plan differences?",
    answer: "• Free (Spark): 5 daily credits, public projects only, no ZIP export\n• Builder ($9/mo): 5 daily + 40 monthly credits, ZIP export\n• Creator ($15/mo): 5 daily + 50 monthly credits, private projects, ZIP export\n• Scale ($22/mo): 5 daily + 70 monthly credits, private projects, ZIP export, priority access",
    icon: CreditCard
  },
  {
    question: "How do I get more credits?",
    answer: "Upgrade your plan to get monthly credits on top of your daily allowance. Daily credits (5) reset every midnight UTC. Monthly credits renew when you renew your subscription. If you don't renew, you revert to the free plan.",
    icon: CreditCard
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="FAQ — Vivora X Frequently Asked Questions"
        description="Find answers to common questions about Vivora X vibe coding platform. Learn about credits, plans, deployment, GitHub integration, and more."
        keywords="vivora x faq, vibe coding questions, vivorax help, AI web builder faq, credits system, pricing plans"
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

        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">FAQ</span>
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
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
              Find answers to the most common questions about Vivora X.
            </p>
          </motion.div>

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
                  className="w-full flex items-center gap-4 p-6 text-left hover:bg-white/5 transition-colors"
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
                      <div className="px-6 pb-6 pl-24">
                        <p className="text-white/70 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

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
