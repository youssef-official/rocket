import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Star, Crown, Rocket, ArrowLeft, Sparkles, Bot } from 'lucide-react';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROK_MODELS, PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const plans: { key: PlanType; icon: React.ReactNode; color: string; popular?: boolean }[] = [
  { key: 'spark', icon: <Zap className="w-5 h-5" />, color: 'gray' },
  { key: 'builder', icon: <Star className="w-5 h-5" />, color: 'blue', },
  { key: 'creator', icon: <Crown className="w-5 h-5" />, color: 'purple', popular: true },
  { key: 'scale', icon: <Rocket className="w-5 h-5" />, color: 'orange' }
];

const getFeaturesList = (planKey: PlanType) => {
  const config = PLAN_CONFIG[planKey];
  const features: { text: string; included: boolean }[] = [];

  if (planKey === 'spark') {
    features.push({ text: `${config.dailyCredits} Credits / day`, included: true });
  } else {
    features.push({ text: `${config.dailyCredits} Credits / day + ${config.monthlyCredits} / month`, included: true });
  }

  // Models - show only name without real model
  const modelNames = config.models.map(id => {
    const model = ROK_MODELS.find(m => m.id === id);
    return model ? `${model.icon} ${model.name}` : id;
  });
  modelNames.forEach(name => {
    features.push({ text: name, included: true });
  });

  // Features
  features.push({ text: 'ZIP Export', included: config.features.zipExport });
  features.push({ text: 'No Watermark', included: config.features.noWatermark });
  features.push({ text: 'Private Projects', included: config.features.privateProjects });
  features.push({ text: 'AI Memory', included: config.features.aiMemory });
  features.push({ text: 'Auto Refactor', included: config.features.autoRefactor });
  features.push({ text: 'Team Workspace (5 Users)', included: config.features.teamWorkspace });
  features.push({ text: 'API Access', included: config.features.apiAccess });
  features.push({ text: 'White Label', included: config.features.whiteLabel });
  features.push({ text: 'Custom Domain', included: config.features.customDomain });

  return features;
};

export const Pricing: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: `url(${spaceHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <a href="/" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <RocketLogo size="md" />
          </a>
          <a 
            href="/"
            className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('nav.backToHome')}
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              🚀 {t('pricing.title')} <span className="text-pink-400">{t('pricing.subtitle')}</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {t('pricing.description')}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map(({ key, icon, color, popular }, index) => {
              const config = PLAN_CONFIG[key];
              const features = getFeaturesList(key);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white/10 backdrop-blur-md rounded-2xl border overflow-hidden ${
                    popular ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-white/10'
                  }`}
                >
                  {popular && (
                    <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-xs font-bold py-1 text-center">
                      ⭐ {t('pricing.popular')}
                    </div>
                  )}

                  <div className={`p-6 ${popular ? 'pt-10' : ''}`}>
                    <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        color === 'gray' ? 'bg-gray-500/20 text-gray-400' :
                        color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{config.name}</h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">${config.price}</span>
                      <span className="text-white/60">/{t('upgrade.month')}</span>
                    </div>

                    <p className="text-white/70 mb-6 text-sm">
                      {key === 'spark' && 'Perfect for testing & learning'}
                      {key === 'builder' && 'For indie developers'}
                      {key === 'creator' && 'For serious builders'}
                      {key === 'scale' && 'For teams & startups'}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-red-400/50 flex-shrink-0" />
                          )}
                          <span className={feature.included ? 'text-white/80' : 'text-white/40 line-through'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-3 rounded-xl font-medium transition-colors ${
                        popular
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {key === 'spark' ? t('pricing.getStarted') : 
                       key === 'scale' ? t('pricing.contactSales') : 
                       t('pricing.startTrial')}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rok AI Engines Section - WITHOUT Real Model column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Bot className="w-6 h-6 text-pink-400" />
              🤖 Rok AI Engines
            </h2>
            <p className="text-white/70 mb-6">Powered by top global models.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`py-3 ${isRTL ? 'text-right' : 'text-left'} text-white/60`}>Rok Name</th>
                    <th className={`py-3 ${isRTL ? 'text-right' : 'text-left'} text-white/60`}>Best For</th>
                    <th className="py-3 text-center text-white/60">Speed</th>
                    <th className="py-3 text-center text-white/60">Quality</th>
                    <th className="py-3 text-center text-white/60">Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {ROK_MODELS.map((model) => (
                    <tr key={model.id} className="border-b border-white/5">
                      <td className="py-3 text-white font-medium">
                        {model.icon} {model.name}
                      </td>
                      <td className="py-3 text-white/80">{model.description}</td>
                      <td className="py-3">
                        <div className="flex justify-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Sparkles key={i} className={`w-3 h-3 ${i < model.speed ? 'text-yellow-400' : 'text-white/20'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-center gap-0.5">
                          {[...Array(6)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < model.quality ? 'text-blue-400' : 'text-white/20'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-pink-400 font-bold">×{model.multiplier}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Smart Credit System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">💳 Smart Credit System</h2>
              <p className="text-white/70 mb-6">You only pay for real work done. Credits are calculated based on actual complexity.</p>

              <h3 className="text-lg font-semibold text-white mb-4">Example Costs</h3>
              <div className="space-y-3">
                {[
                  { request: 'Change color', work: 'Small edit', credits: '~0.4' },
                  { request: 'Remove footer', work: 'Section edit', credits: '~0.8' },
                  { request: 'Add auth', work: 'Login system', credits: '~1.3' },
                  { request: 'Landing page', work: 'Full layout', credits: '~2.0' },
                  { request: 'Dashboard', work: 'Admin panel', credits: '~4.0' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <p className="text-white font-medium">{item.request}</p>
                      <p className="text-white/60 text-sm">{item.work}</p>
                    </div>
                    <span className="text-yellow-400 font-bold">{item.credits}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-sm text-white/60">
                <p>💡 Bigger work = more credits</p>
                <p>💡 Small edits = very cheap</p>
                <p>⚠️ Credits are based on actual output, not your description</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">📊 Engine Cost Multipliers</h2>
              <p className="text-white/70 mb-6">Different engines have different costs.</p>

              <div className="space-y-3">
                {ROK_MODELS.map((model) => (
                  <div key={model.id} className={`flex items-center justify-between py-2 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-white">
                      {model.icon} {model.name}
                    </span>
                    <span className="text-pink-400 font-bold">×{model.multiplier}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">➕ Extra Credits</h3>
                <div className="space-y-2">
                  <p className="text-white/80">+500 Credits → <span className="text-green-400 font-bold">$4</span></p>
                  <p className="text-white/80">+2000 Credits → <span className="text-green-400 font-bold">$12</span></p>
                </div>
                <p className="text-white/60 text-sm mt-3">Instant activation.</p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">❓ {t('pricing.faq')}</h2>
            <p className="text-white/70 mb-8">{t('pricing.faqSubtitle')}</p>
            
            <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              {[
                { q: 'Can I choose my engine?', a: 'Yes. Based on your plan.' },
                { q: 'Why Spark is limited?', a: 'To let you test before upgrading.' },
                { q: 'How are credits calculated?', a: 'Based on actual work complexity (files changed, lines of code), not your description.' },
              ].map((faq) => (
                <div key={faq.q} className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-white/70 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
