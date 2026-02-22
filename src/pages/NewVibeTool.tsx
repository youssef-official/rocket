import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Star, Shield, Layers, Globe, Rocket, Crown, Check, ArrowRight } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { SEOHead } from '@/components/shared/SEOHead';

import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const features = [
  { icon: Zap, title: 'AI-Powered Generation', desc: 'Describe your project in plain language and watch as our AI transforms your vision into production-ready code in seconds.' },
  { icon: Layers, title: 'Multi-File Architecture', desc: 'Complete React + TypeScript + Tailwind CSS applications with routing, state management, and responsive design — all generated automatically.' },
  { icon: Shield, title: 'Version Control Built-In', desc: 'Every change is tracked. Roll back to any previous version instantly. Your project history is always safe.' },
  { icon: Globe, title: 'One-Click Deployment', desc: 'Deploy to Vercel with a single click. Get a live URL in seconds and share your creation with the world.' },
];

const plans = [
  { name: 'Spark', price: 'Free', daily: '5/day', monthly: '—', color: 'from-gray-400 to-gray-500' },
  { name: 'Builder', price: '$9/mo', daily: '5/day', monthly: '+40/mo', color: 'from-blue-400 to-blue-600' },
  { name: 'Creator', price: '$15/mo', daily: '5/day', monthly: '+50/mo', color: 'from-pink-400 to-pink-600', popular: true },
  { name: 'Scale', price: '$22/mo', daily: '5/day', monthly: '+70/mo', color: 'from-purple-400 to-purple-600' },
];

const whyDifferent = [
  { title: 'No Learning Curve', desc: 'Unlike traditional coding tools, Vivora X requires zero technical knowledge. Just describe what you want.' },
  { title: 'Real Production Code', desc: 'We don\'t generate templates. Every project is unique, clean, and ready for deployment.' },
  { title: 'Iterative Building', desc: 'Chat with AI to refine your project. Add features, change designs, fix bugs — all through conversation.' },
  { title: 'Visual Edit Mode', desc: 'See your changes in real-time. Click on elements to modify them visually without touching code.' },
];

export const NewVibeTool: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <SEOHead
        title="New Vibe Tool — Build Web Apps with AI"
        description="Discover Vivora X, the new vibe coding tool that transforms your ideas into production-ready React apps. AI-powered web development with no coding required."
        keywords="vibe coding tool, vivora x features, AI web builder, new coding tool, AI app generator, build apps with AI, vivorax tool"
        canonical="https://vivorax.online/new-vibe-tool"
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2"><VivoraLogo size="md" /></a>
          <a href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full mb-6">
              <Rocket className="w-4 h-4 text-pink-400" />
              <span className="text-pink-300 text-sm font-medium">A New Era of Web Development</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Vivora <span className="text-pink-400">X</span><br />
              <span className="text-3xl md:text-5xl text-white/80">The Vibe Coding Revolution</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              Stop writing code. Start describing ideas. Vivora X is the AI-powered platform that transforms your words into stunning, production-ready web applications.
            </p>
            <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-pink-500/30 transition-all">
              Start Building for Free <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Different */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
            Why Vivora X is <span className="text-pink-400">Different</span>
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            {whyDifferent.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
            Powerful <span className="text-pink-400">Features</span>
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-3xl md:text-4xl font-bold text-white text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Simple <span className="text-pink-400">Pricing</span>
          </motion.h2>
          <p className="text-white/60 text-center mb-12 max-w-xl mx-auto">Start free. Upgrade when you need more power. No hidden fees, no surprises.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 relative ${plan.popular ? 'border-pink-500/50 ring-1 ring-pink-500/30' : 'border-white/10'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="text-2xl font-bold text-white mb-4">{plan.price}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/70"><Check className="w-4 h-4 text-green-400" /> {plan.daily} daily credits</div>
                  {plan.monthly !== '—' && (
                    <div className="flex items-center gap-2 text-white/70"><Check className="w-4 h-4 text-green-400" /> {plan.monthly} monthly bonus</div>
                  )}
                  <div className="flex items-center gap-2 text-white/70"><Check className="w-4 h-4 text-green-400" /> Vercel Deploy</div>
                </div>
                <a href="/pricing" className={`mt-6 block text-center py-2.5 rounded-xl font-medium text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {plan.price === 'Free' ? 'Get Started' : 'Upgrade Now'}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Build Something <span className="text-pink-400">Amazing</span>?
            </h2>
            <p className="text-white/60 mb-8 text-lg">Join thousands of creators who are building the future with Vivora X.</p>
            <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-pink-500/30 transition-all">
              <Star className="w-5 h-5" /> Start Building Now
            </a>
          </motion.div>
        </div>
      </section>

      
    </div>
  );
};
