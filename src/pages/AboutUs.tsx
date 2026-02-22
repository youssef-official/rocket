import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Target, Users, Lightbulb, Globe, Rocket, Shield, Code, Zap } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { Footer } from '@/components/shared/Footer';
import { SEOHead } from '@/components/shared/SEOHead';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const milestones = [
  { year: '2026', title: 'Founded', desc: 'Vivora X was established with a bold vision — to democratize web development through artificial intelligence.' },
  { year: '2026', title: 'Platform Launch', desc: 'Released the first public version of Vivora X, enabling users to build production-ready React applications from natural language prompts.' },
  { year: '2026', title: 'AI Gateway', desc: 'Launched the free AI Gateway, providing developers worldwide with unlimited access to powerful AI models at zero cost.' },
];

const values = [
  { icon: Lightbulb, title: 'Innovation First', desc: 'We push the boundaries of what AI can do for software development, constantly exploring new paradigms in code generation and automation.' },
  { icon: Users, title: 'Accessibility', desc: 'Technology should be available to everyone. Our platform removes the barriers between ideas and execution, regardless of technical background.' },
  { icon: Shield, title: 'Trust & Security', desc: 'Your code and data are yours. We employ industry-standard encryption and never share your intellectual property with third parties.' },
  { icon: Globe, title: 'Global Reach', desc: 'Built for a worldwide audience with multi-language support, our platform serves developers and creators across every continent.' },
];

const stats = [
  { value: '2026', label: 'Founded' },
  { value: '10+', label: 'AI Models' },
  { value: '4', label: 'Subscription Plans' },
  { value: '∞', label: 'Possibilities' },
];

export const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="About Us — Vivora X"
        description="Vivora X is a technology company founded in 2026, dedicated to building AI-powered tools that transform how the world creates software. Learn about our mission, values, and vision."
        keywords="about vivora x, vivorax company, AI coding company, vibe coding founders, technology startup 2026, AI web development company"
        canonical="https://vivorax.online/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Vivora X',
          url: 'https://vivorax.online',
          logo: 'https://vivorax.online/og-image.png',
          foundingDate: '2026',
          description: 'AI-powered vibe coding platform that transforms ideas into production-ready web applications.',
          sameAs: [
            'https://twitter.com/vivorax',
            'https://linkedin.com/company/vivorax',
            'https://github.com/vivorax'
          ]
        }}
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
        <div className="absolute inset-0 bg-black/75" />

        {/* Header */}
        <header className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <VivoraLogo size="md" />
              <span className="text-white/60">|</span>
              <span className="text-white font-medium">About</span>
            </a>
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <Building2 className="w-5 h-5 text-pink-400" />
              <span className="text-white text-sm">About Vivora X</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Building the Future of<br />
              <span className="text-pink-400">Software Creation</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Vivora X is a technology company founded in 2026, dedicated to building 
              AI-powered tools that transform how the world creates software. We believe 
              that everyone deserves the ability to bring their digital ideas to life — 
              without writing a single line of code.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-pink-400 mb-1">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-20"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                At Vivora X, our mission is to eliminate the gap between imagination and implementation. 
                We are building an ecosystem where artificial intelligence serves as a bridge — translating 
                human intent into fully functional, production-grade web applications in seconds.
              </p>
              <p className="text-white/70 text-lg leading-relaxed">
                We envision a world where entrepreneurs, designers, students, and creators can 
                ship professional software without needing years of programming experience. Through 
                our proprietary AI engine, we generate complete React, TypeScript, and Tailwind CSS 
                applications from simple natural language descriptions — complete with routing, 
                state management, and modern UI patterns.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <value.icon className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                      <p className="text-white/60 leading-relaxed">{value.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10" />
              {milestones.map((ms, i) => (
                <motion.div
                  key={ms.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className={`relative flex items-start gap-6 mb-8 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-row`}
                >
                  <div className="hidden md:block md:w-1/2" />
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-pink-400 rounded-full -translate-x-1.5 mt-2 z-10" />
                  <div className="ml-10 md:ml-0 md:w-1/2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <span className="text-pink-400 text-sm font-mono font-bold">{ms.year}</span>
                    <h3 className="text-lg font-semibold text-white mt-1 mb-2">{ms.title}</h3>
                    <p className="text-white/60 leading-relaxed">{ms.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What We Build */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">What We Build</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Code, title: 'Vivora X Platform', desc: 'Our flagship AI-powered web application builder. Describe your vision, and watch production-ready React code materialize in seconds.' },
                  { icon: Zap, title: 'AI Gateway', desc: 'A free, unlimited AI API gateway that gives developers worldwide access to state-of-the-art language models — no API key required.' },
                  { icon: Rocket, title: 'Deployment Pipeline', desc: 'Seamless integration with Vercel and GitHub, enabling one-click deployment from idea to live production URL.' },
                ].map((product) => (
                  <div key={product.title} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <product.icon className="w-7 h-7 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{product.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{product.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Join thousands of creators who are already using Vivora X to turn their ideas into reality.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/"
                className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-full transition-colors"
              >
                Start Building
              </a>
              <a
                href="/pricing"
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-colors border border-white/10"
              >
                View Plans
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
