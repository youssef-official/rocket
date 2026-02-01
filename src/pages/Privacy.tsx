import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const Privacy: React.FC = () => {
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
              <span className="text-white font-medium">Privacy Policy</span>
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
                <Shield className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                <p className="text-white/60">Last updated: February 2026</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p className="text-white/70 leading-relaxed">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support. This includes your email address, 
                  profile information, and any content you create using Vivora X.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p className="text-white/70 leading-relaxed">
                  We use the information we collect to provide, maintain, and improve our services, 
                  process transactions, send you technical notices and support messages, and respond 
                  to your comments and questions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
                <p className="text-white/70 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your 
                  personal data against unauthorized access, alteration, disclosure, or destruction. 
                  Your code and projects are encrypted and stored securely.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
                <p className="text-white/70 leading-relaxed">
                  You have the right to access, correct, or delete your personal information. 
                  You can also export your projects at any time. To exercise these rights, 
                  please contact us at privacy@vivora-x.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Cookies</h2>
                <p className="text-white/70 leading-relaxed">
                  We use cookies and similar technologies to remember your preferences, 
                  authenticate users, and analyze traffic. You can control cookies through 
                  your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
                <p className="text-white/70 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@vivora-x.com" className="text-pink-400 hover:underline">
                    privacy@vivora-x.com
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

export default Privacy;
