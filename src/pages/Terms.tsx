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

        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">Terms of Service</span>
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
                <FileText className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
                <p className="text-white/60">Last updated: February 15, 2026</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-white/70 leading-relaxed">
                  By accessing or using Vivora X ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. These terms apply to all users, visitors, and others who access or use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p className="text-white/70 leading-relaxed">
                  Vivora X is an AI-powered web application builder that allows users to create web applications through natural language prompts. Our services include AI code generation, project management, version control, visual editing, deployment to Vercel, and project export. The AI generates React applications with TypeScript and Tailwind CSS.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                <p className="text-white/70 leading-relaxed">
                  You must create an account to use Vivora X. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration. You must notify us immediately of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                <p className="text-white/70 leading-relaxed">
                  You retain full ownership of all code and content generated using Vivora X. We claim no intellectual property rights over your creations. You are free to use, modify, distribute, and commercialize any code generated through our platform. The Vivora X platform, branding, logos, and underlying technology remain our exclusive property.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Credits and Billing</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  Usage of Vivora X is governed by a credit system:
                </p>
                <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
                  <li>Each successful AI code generation consumes 1 credit</li>
                  <li>Daily credits reset at UTC midnight automatically</li>
                  <li>Monthly credits are provided based on your subscription plan</li>
                  <li>Credits are non-refundable and expire according to plan terms</li>
                  <li>Paid subscriptions are billed monthly through PayPal</li>
                  <li>We reserve the right to modify pricing with 30 days notice</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Acceptable Use</h2>
                <p className="text-white/70 leading-relaxed">
                  You agree not to use Vivora X for any unlawful purpose, to generate malicious code or malware, to create content that is harmful, threatening, or abusive, to violate any third-party rights, to attempt to gain unauthorized access to our systems, or to interfere with the proper operation of the Service. We reserve the right to terminate accounts that violate these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Service Availability</h2>
                <p className="text-white/70 leading-relaxed">
                  We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may perform maintenance, updates, or modifications that temporarily affect availability. We will make reasonable efforts to notify users of planned downtime.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-white/70 leading-relaxed">
                  Vivora X is provided "as is" without warranties of any kind, express or implied. We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
                <p className="text-white/70 leading-relaxed">
                  We may terminate or suspend your account at any time for violation of these terms. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service ceases immediately. You may export your projects before termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
                <p className="text-white/70 leading-relaxed">
                  For any questions regarding these Terms, please contact us at{' '}
                  <a href="mailto:legal@vivora-x.com" className="text-pink-400 hover:underline">legal@vivora-x.com</a>
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
