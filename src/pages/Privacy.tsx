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

        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">Privacy Policy</span>
            </a>
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </a>
          </div>
        </header>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                <p className="text-white/60">Last updated: February 15, 2026</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  We collect information you provide directly to us when you create an account, use our services, or contact us. This includes:
                </p>
                <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
                  <li>Email address used for account registration</li>
                  <li>Display name and profile information</li>
                  <li>Projects and code generated through Vivora X</li>
                  <li>Chat messages and prompts sent to the AI</li>
                  <li>Usage data including credit consumption and feature usage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p className="text-white/70 leading-relaxed mb-3">We use collected information to:</p>
                <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
                  <li>Provide, maintain, and improve our AI code generation services</li>
                  <li>Process transactions and manage your subscription plan</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Monitor and analyze usage trends to improve the platform</li>
                  <li>Detect, prevent, and address technical issues and abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Security</h2>
                <p className="text-white/70 leading-relaxed">
                  All data is stored securely using industry-standard encryption. Your projects and code are protected with Row-Level Security (RLS) policies ensuring only you can access your private data. We use secure cloud infrastructure with automatic backups and data redundancy. Authentication tokens are refreshed automatically and sessions are encrypted end-to-end.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
                <p className="text-white/70 leading-relaxed">
                  We integrate with the following third-party services to provide our platform:
                </p>
                <ul className="list-disc list-inside text-white/70 space-y-1 ml-4 mt-2">
                  <li>Google Gemini AI — for code generation and image analysis</li>
                  <li>Vercel — for project deployment (optional, user-initiated)</li>
                  <li>PayPal — for payment processing of subscription plans</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
                <p className="text-white/70 leading-relaxed">
                  You have the right to access, correct, or delete your personal information at any time. You can export your projects as ZIP files. You can delete your account and all associated data. To exercise these rights, contact us at <a href="mailto:privacy@vivora-x.com" className="text-pink-400 hover:underline">privacy@vivora-x.com</a>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
                <p className="text-white/70 leading-relaxed">
                  We use essential cookies for authentication and session management. We do not use tracking cookies or share data with advertisers. You can control cookies through your browser settings, though disabling them may affect platform functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                <p className="text-white/70 leading-relaxed">
                  We retain your data for as long as your account is active. If you delete your account, all personal data and projects are permanently removed within 30 days. Credit transaction records may be retained for legal and accounting purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
                <p className="text-white/70 leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@vivora-x.com" className="text-pink-400 hover:underline">privacy@vivora-x.com</a>
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
