import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Star, Crown, Rocket } from 'lucide-react';
import { useUserPlan, PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';
import { useLanguage } from '@/contexts/LanguageContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPlan?: PlanType;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  highlightPlan
}) => {
  const { userPlan } = useUserPlan();
  const { t, isRTL } = useLanguage();

  const plans: { key: PlanType; icon: React.ReactNode; color: string; popular?: boolean }[] = [
    { key: 'spark', icon: <Zap className="w-5 h-5" />, color: 'gray' },
    { key: 'builder', icon: <Star className="w-5 h-5" />, color: 'blue' },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl"
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <h2 className={`text-2xl font-bold text-foreground ${isRTL ? 'text-right' : ''}`}>
                  {t('upgrade.title')}
                </h2>
                <p className={`text-muted-foreground mt-1 ${isRTL ? 'text-right' : ''}`}>
                  {t('upgrade.subtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Plans Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map(({ key, icon, color, popular }) => {
                const config = PLAN_CONFIG[key];
                const isCurrentPlan = userPlan?.plan === key;
                const isHighlighted = highlightPlan === key;
                const features = getFeaturesList(key);

                return (
                  <div
                    key={key}
                    className={`relative rounded-xl border p-5 transition-all ${
                      popular || isHighlighted
                        ? 'border-purple-500 bg-purple-500/5'
                        : isCurrentPlan
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-foreground/20'
                    }`}
                  >
                    {popular && (
                      <div className={`absolute -top-3 ${isRTL ? 'left-4' : 'right-4'} px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full`}>
                        {t('upgrade.popular')}
                      </div>
                    )}

                    <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        color === 'gray' ? 'bg-gray-500/20 text-gray-400' :
                        color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{config.name}</h3>
                        {isCurrentPlan && (
                          <span className="text-xs text-primary">{t('upgrade.currentPlan')}</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-foreground">${config.price}</span>
                      <span className="text-muted-foreground">/{t('upgrade.month')}</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-red-400/50 flex-shrink-0" />
                          )}
                          <span className={feature.included ? 'text-foreground/80' : 'text-muted-foreground line-through'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={isCurrentPlan}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                        isCurrentPlan
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : popular || isHighlighted
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-foreground hover:bg-accent'
                      }`}
                    >
                      {isCurrentPlan ? t('upgrade.currentPlan') : t('upgrade.selectPlan')}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Credit System Info */}
            <div className="px-6 pb-6">
              <div className="bg-accent/30 rounded-xl border border-border p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">💳 Credit System</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Each successful generation costs 1 credit. Daily credits reset at UTC midnight.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(PLAN_CONFIG).map(([key, config]) => (
                    <div key={key} className="bg-background/50 rounded-lg p-3 border border-border/50 text-center">
                      <div className="text-yellow-400 font-bold text-lg">{config.dailyCredits}/day</div>
                      {config.monthlyCredits > 0 && (
                        <div className="text-green-400 text-sm">+{config.monthlyCredits}/mo</div>
                      )}
                      <div className="text-xs text-muted-foreground">{config.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t border-border bg-muted/50 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm text-muted-foreground text-center">
                {t('upgrade.footer')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
