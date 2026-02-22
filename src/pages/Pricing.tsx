import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Star, Crown, Rocket, ArrowLeft, Globe } from 'lucide-react';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';
import { PayPalButton } from '@/components/shared/PayPalButton';
import { SEOHead } from '@/components/shared/SEOHead';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const plans: { key: PlanType; icon: React.ReactNode; color: string; emoji: string; popular?: boolean }[] = [
  { key: 'spark',   icon: <Zap className="w-5 h-5" />,    color: 'gray',   emoji: '🆓' },
  { key: 'builder', icon: <Star className="w-5 h-5" />,   color: 'blue',   emoji: '🔨' },
  { key: 'creator', icon: <Crown className="w-5 h-5" />,  color: 'purple', emoji: '⚡', popular: true },
  { key: 'scale',   icon: <Rocket className="w-5 h-5" />, color: 'orange', emoji: '🚀' }
];

export const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${spaceHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <SEOHead
        title="Pricing — Vivora X Plans & Credits"
        description="Choose your Vivora X plan. Free, Builder, Creator, or Scale — get daily & monthly credits, ZIP export, private projects, and deploy to Vercel. Start vibe coding today."
        keywords="vivora x pricing, vibe coding plans, vivorax credits, AI web builder pricing, free AI coding tool, web app builder plans"
        canonical="https://vivorax.online/pricing"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <VivoraXLogo size="md" />
          </a>
          <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToHome')}
          </a>
        </div>
      </header>

      <main className="relative z-10 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              🚀 {t('pricing.title')} <span className="text-pink-400">{t('pricing.subtitle')}</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('pricing.description')}</p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {plans.map(({ key, icon, color, emoji, popular }, index) => {
              const config = PLAN_CONFIG[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white/10 backdrop-blur-md rounded-2xl border overflow-hidden flex flex-col ${
                    popular ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-white/10'
                  }`}
                >
                  {popular && (
                    <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-xs font-bold py-1 text-center">
                      ⭐ {t('pricing.popular')}
                    </div>
                  )}
                  <div className={`p-5 flex flex-col flex-1 ${popular ? 'pt-9' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        color === 'gray' ? 'bg-gray-500/20 text-gray-400' :
                        color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {icon}
                      </div>
                      <h3 className="text-lg font-bold text-white">{emoji} {config.name}</h3>
                    </div>

                    <div className="mb-3">
                      <span className="text-3xl font-bold text-white">${config.price}</span>
                      <span className="text-white/60 text-sm">/{t('upgrade.month')}</span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between text-white/70">
                        <span>Daily Credits</span>
                        <span className="font-bold text-yellow-400">{config.dailyCredits}/day</span>
                      </div>
                      {config.monthlyCredits > 0 && (
                        <div className="flex justify-between text-white/70">
                          <span>Monthly Credits</span>
                          <span className="font-bold text-green-400">+{config.monthlyCredits}/mo</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/70">
                        <span>Publishing</span>
                        <span className="font-bold text-purple-400 text-xs">Vercel ✅</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5 mb-5 text-sm flex-1">
                      {[
                        { label: 'ZIP Export', v: config.features.zipExport },
                        { label: 'Private Projects', v: config.features.privateProjects },
                        { label: 'Priority Access', v: config.features.priorityAccess },
                      ].map(f => (
                        <li key={f.label} className="flex items-center gap-2">
                          {f.v ? <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-red-400/50 flex-shrink-0" />}
                          <span className={f.v ? 'text-white/80' : 'text-white/40 line-through'}>{f.label}</span>
                        </li>
                      ))}
                    </ul>

                    {key !== 'spark' && user ? (
                      <PayPalButton plan={key} onSuccess={() => window.location.reload()} className="!rounded-xl" />
                    ) : key !== 'spark' ? (
                      <a href="/login" className="w-full py-2.5 rounded-xl font-medium transition-colors bg-white/10 hover:bg-white/20 text-white block text-center text-sm">
                        {t('auth.goToLogin')}
                      </a>
                    ) : (
                      <button className="w-full py-2.5 rounded-xl font-medium transition-colors bg-white/10 hover:bg-white/20 text-white text-sm">
                        {t('pricing.getStarted')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">📊 Full Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                <thead>
                  <tr className="bg-white/10">
                    <th className="text-left text-white/80 font-semibold px-5 py-4 text-sm">Feature</th>
                    {plans.map(p => (
                      <th key={p.key} className="text-center text-white/80 font-semibold px-4 py-4 text-sm">
                        {p.emoji} {PLAN_CONFIG[p.key].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { label: 'Price', vals: ['$0', '$9/mo', '$15/mo', '$22/mo'] },
                    { label: 'Daily Credits', vals: ['5', '5', '5', '5'] },
                    { label: 'Monthly Credits', vals: ['—', '+40', '+50', '+70'] },
                    { label: 'Vercel Deploy', vals: ['✅', '✅', '✅', '✅'] },
                    { label: 'ZIP Export', vals: ['❌', '✅', '✅', '✅'] },
                    { label: 'Private Projects', vals: ['❌', '❌', '✅', '✅'] },
                    { label: 'Priority Access', vals: ['❌', '❌', '❌', '✅'] },
                  ].map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? '' : 'bg-white/3'}>
                      <td className="text-white/70 px-5 py-3.5 text-sm font-medium">{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className="text-center text-white/90 px-4 py-3.5 text-sm">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Publishing - Vercel Only */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-2xl mx-auto mb-12">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Vercel Deploy</h3>
              </div>
              <p className="text-white/70 text-sm mb-4">Connect your Vercel account and deploy to <code className="text-green-400">yourproject.vercel.app</code> with production URLs.</p>
              <ul className="space-y-2 text-sm text-white/70">
                <li>✅ Unlimited projects (all plans)</li>
                <li>✅ Real production URL</li>
                <li>✅ Auto build logs & error detection</li>
                <li>⚡ Requires Vercel account</li>
              </ul>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">❓ {t('pricing.faq')}</h2>
            <div className="grid md:grid-cols-3 gap-5 text-left max-w-4xl mx-auto">
              {[
                { q: 'How are credits used?', a: 'Each AI generation uses credits based on file count (0.5–3 credits). Simple edits cost less.' },
                { q: 'When do credits reset?', a: 'Daily credits (5/day) reset at UTC midnight. Monthly credits are granted on subscription renewal.' },
                { q: 'Can I cancel anytime?', a: 'Yes! If you cancel, you keep your plan until the end of the billing cycle, then revert to Free.' },
              ].map((faq) => (
                <div key={faq.q} className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2 text-sm">{faq.q}</h3>
                  <p className="text-white/70 text-xs leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
