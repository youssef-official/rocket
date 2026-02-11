import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Star, Crown, Rocket, ArrowLeft } from 'lucide-react';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';
import { PayPalButton } from '@/components/shared/PayPalButton';
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

  features.push({ text: 'ZIP Export', included: config.features.zipExport });

  return features;
};

export const Pricing: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

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
            <VivoraXLogo size="md" />
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

                    {key !== 'spark' && user ? (
                      <PayPalButton
                        plan={key}
                        onSuccess={() => window.location.reload()}
                        className="!rounded-xl"
                      />
                    ) : key !== 'spark' ? (
                      <a
                        href="/login"
                        className="w-full py-3 rounded-xl font-medium transition-colors bg-white/10 hover:bg-white/20 text-white block text-center"
                      >
                        {t('auth.goToLogin')}
                      </a>
                    ) : (
                      <button
                        className="w-full py-3 rounded-xl font-medium transition-colors bg-white/10 hover:bg-white/20 text-white"
                      >
                        {t('pricing.getStarted')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Credit System Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-4">💳 Credit System</h2>
            <p className="text-white/70 mb-6">
              Each successful code generation costs 1 credit. Daily credits reset at UTC midnight.
            </p>

            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(PLAN_CONFIG).map(([key, config]) => (
                <div key={key} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{config.dailyCredits}/day</div>
                  {config.monthlyCredits > 0 && (
                    <div className="text-green-400 font-medium">+{config.monthlyCredits}/month</div>
                  )}
                  <div className="text-white/60 text-sm mt-1">{config.name}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">❓ {t('pricing.faq')}</h2>
            <p className="text-white/70 mb-8">{t('pricing.faqSubtitle')}</p>
            
            <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              {[
                { q: 'How are credits used?', a: 'Each successful generation uses 1 credit.' },
                { q: 'When do credits reset?', a: 'Daily credits reset at UTC midnight.' },
                { q: 'Can I buy more credits?', a: 'Extra credits can be purchased at any time.' },
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
