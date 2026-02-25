import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Crown, Rocket, ArrowLeft, Globe, ImageOff, Image, Shield, Star, ChevronRight } from 'lucide-react';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';
import { PayPalButton } from '@/components/shared/PayPalButton';
import { SEOHead } from '@/components/shared/SEOHead';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const plans: { key: PlanType; icon: React.ReactNode; color: string; gradient: string; popular?: boolean }[] = [
  { key: 'free', icon: <Zap className="w-6 h-6" />, color: 'gray', gradient: 'from-slate-500/20 to-slate-600/10' },
  { key: 'pro', icon: <Crown className="w-6 h-6" />, color: 'purple', gradient: 'from-purple-500/30 to-pink-500/10', popular: true },
  { key: 'business', icon: <Rocket className="w-6 h-6" />, color: 'orange', gradient: 'from-orange-500/30 to-amber-500/10' }
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
        description="Choose your Vivora X plan. Free, Pro, or Business — get daily & monthly credits, ZIP export, private projects, and deploy to Vercel. Start vibe coding today."
        keywords="vivora x pricing, vibe coding plans, vivorax credits, AI web builder pricing, free AI coding tool, web app builder plans"
        canonical="https://vivorax.online/pricing"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <VivoraXLogo size="md" />
          </a>
          <a href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToHome')}
          </a>
        </div>
      </header>

      <main className="relative z-10 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm mb-6"
            >
              <Star className="w-4 h-4 text-yellow-400" />
              Choose your plan
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {t('pricing.title')} <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">{t('pricing.subtitle')}</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">{t('pricing.description')}</p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {plans.map(({ key, icon, color, gradient, popular }, index) => {
              const config = PLAN_CONFIG[key];
              const features = [
                { label: 'Image Upload', v: key !== 'free', icon: key !== 'free' ? Image : ImageOff },
                { label: 'Code Editing', v: config.features.codeEditing },
                { label: 'Watermark Removal', v: config.features.watermarkRemoval },
                { label: 'ZIP Export', v: config.features.zipExport },
                { label: 'Private Projects', v: config.features.privateProjects },
                { label: 'Priority Access', v: config.features.priorityAccess },
              ];

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`group relative rounded-2xl overflow-hidden flex flex-col ${
                    popular ? 'md:-mt-4 md:mb-0' : ''
                  }`}
                >
                  {/* Glow effect for popular */}
                  {popular && (
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500 rounded-2xl opacity-70 blur-[1px]" />
                  )}

                  <div className={`relative bg-gradient-to-b ${gradient} backdrop-blur-xl rounded-2xl border flex flex-col flex-1 ${
                    popular ? 'border-purple-400/50' : 'border-white/10'
                  }`}>
                    {popular && (
                      <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold tracking-wider uppercase">
                        <Crown className="w-3.5 h-3.5" />
                        Most Popular
                      </div>
                    )}

                    <div className={`p-6 flex flex-col flex-1 ${popular ? '' : 'pt-6'}`}>
                      {/* Plan Header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          color === 'gray' ? 'bg-slate-500/20 text-slate-300' :
                          color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{config.name}</h3>
                          <p className="text-white/40 text-xs">
                            {key === 'free' ? 'Get started free' : key === 'pro' ? 'For serious builders' : 'Scale your business'}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-white tracking-tight">${config.price}</span>
                          <span className="text-white/40 text-sm font-medium">/{t('upgrade.month')}</span>
                        </div>
                      </div>

                      {/* Credits Stats */}
                      <div className="space-y-2.5 mb-6 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Daily Credits</span>
                          <span className="font-bold text-yellow-400">{config.dailyCredits}/day</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Monthly Credits</span>
                          <span className={`font-bold ${config.monthlyCredits > 0 ? 'text-green-400' : 'text-white/20'}`}>
                            {config.monthlyCredits > 0 ? `+${config.monthlyCredits}/mo` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Vercel Deploy</span>
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {features.map(f => (
                          <li key={f.label} className="flex items-center gap-2.5 text-sm">
                            {f.v ? (
                              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-green-400" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <X className="w-3 h-3 text-red-400/50" />
                              </div>
                            )}
                            <span className={f.v ? 'text-white/80' : 'text-white/30 line-through'}>{f.label}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {key !== 'free' && user ? (
                        <PayPalButton plan={key} onSuccess={() => window.location.reload()} className="!rounded-xl" />
                      ) : key !== 'free' ? (
                        <a href="/login" className={`w-full py-3 rounded-xl font-semibold transition-all text-center text-sm flex items-center justify-center gap-2 ${
                          popular
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}>
                          Get Started <ChevronRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <a href="/login" className="w-full py-3 rounded-xl font-semibold transition-all bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-center text-sm block">
                          Start Free
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              Full Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <thead>
                  <tr className="bg-white/10">
                    <th className="text-left text-white/80 font-semibold px-5 py-4 text-sm">Feature</th>
                    {plans.map(p => (
                      <th key={p.key} className="text-center text-white/80 font-semibold px-4 py-4 text-sm">
                        {PLAN_CONFIG[p.key].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { label: 'Price', vals: ['$0', '$15/mo', '$29/mo'] },
                    { label: 'Daily Credits', vals: ['3', '5', '10'] },
                    { label: 'Monthly Credits', vals: ['—', '+150', '+400'] },
                    { label: 'Clone Design', vals: ['yes', 'yes', 'yes'] },
                    { label: 'Color Themes', vals: ['yes', 'yes', 'yes'] },
                    { label: 'Voice Input', vals: ['yes', 'yes', 'yes'] },
                    { label: 'Push to GitHub', vals: ['yes', 'yes', 'yes'] },
                    { label: 'Image Upload', vals: ['no', 'yes', 'yes'] },
                    { label: 'Code Editing', vals: ['no', 'yes', 'yes'] },
                    { label: 'Watermark Removal', vals: ['no', 'yes', 'yes'] },
                    { label: 'Vercel Deploy', vals: ['yes', 'yes', 'yes'] },
                    { label: 'ZIP Export', vals: ['no', 'yes', 'yes'] },
                    { label: 'Private Projects', vals: ['no', 'yes', 'yes'] },
                    { label: 'Priority Access', vals: ['no', 'no', 'yes'] },
                  ].map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                      <td className="text-white/70 px-5 py-3.5 text-sm font-medium">{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className="text-center px-4 py-3.5 text-sm">
                          {v === 'yes' ? <Check className="w-4 h-4 text-green-400 mx-auto" /> :
                           v === 'no' ? <X className="w-4 h-4 text-red-400/40 mx-auto" /> :
                           <span className="text-white/90">{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Vercel Deploy Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-2xl mx-auto mb-16">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Vercel Deploy</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Connect your Vercel account and deploy to <code className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">yourproject.vercel.app</code>
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited projects (all plans)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Real production URL</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Auto build logs & error detection</li>
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Requires Vercel account</li>
              </ul>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              {t('pricing.faq')}
            </h2>
            <div className="grid md:grid-cols-3 gap-5 text-left max-w-4xl mx-auto">
              {[
                { q: 'How are credits used?', a: 'Each AI generation uses credits based on file count (0.5–3 credits). Simple edits cost less.' },
                { q: 'When do credits reset?', a: 'Daily credits reset at UTC midnight. Monthly credits are granted on subscription renewal.' },
                { q: 'Can I cancel anytime?', a: 'Yes! If you cancel, you keep your plan until the end of the billing cycle, then revert to Free.' },
              ].map((faq) => (
                <div key={faq.q} className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                  <h3 className="font-semibold text-white mb-2 text-sm">{faq.q}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
