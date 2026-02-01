import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const Terms: React.FC = () => {
  const { isRTL } = useLanguage();

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
        <div className="absolute inset-0 bg-black/80" />

        {/* Header */}
        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="/" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">Terms of Service</span>
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

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
                <p className="text-white/60">Last updated: February 2026</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-white/70 leading-relaxed">
                  By accessing or using Vivora X, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p className="text-white/70 leading-relaxed">
                  Vivora X is an AI-powered web application builder that allows users to create 
                  web applications through natural language prompts. We provide code generation, 
                  hosting, and deployment services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                <p className="text-white/70 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account. You must notify us immediately 
                  of any unauthorized use.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                <p className="text-white/70 leading-relaxed">
                  You retain full ownership of all code and content generated using Vivora X. 
                  We claim no intellectual property rights over your creations. The Vivora X 
                  platform, branding, and underlying technology remain our property.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h2>
                <p className="text-white/70 leading-relaxed">
                  You agree not to use Vivora X for any unlawful purpose or to generate content 
                  that is harmful, threatening, abusive, or violates any third-party rights. 
                  We reserve the right to terminate accounts that violate these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Credits and Billing</h2>
                <p className="text-white/70 leading-relaxed">
                  Usage of Vivora X is governed by a credit system. Credits are non-refundable 
                  and expire according to your plan terms. We reserve the right to modify pricing 
                  with reasonable notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                <p className="text-white/70 leading-relaxed">
                  Vivora X is provided "as is" without warranties of any kind. We are not liable 
                  for any indirect, incidental, or consequential damages arising from your use 
                  of the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Contact</h2>
                <p className="text-white/70 leading-relaxed">
                  For any questions regarding these Terms, please contact us at{' '}
                  <a href="mailto:legal@vivora-x.com" className="text-pink-400 hover:underline">
                    legal@vivora-x.com
                  </a>
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
