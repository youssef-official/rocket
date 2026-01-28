import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Zap, Star, Rocket, ArrowRight } from 'lucide-react';
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
    const features = [];

    if (planKey === 'spark') {
      features.push(`${config.dailyCredits} Credits / day (Max ${config.maxDailyCredits})`);
    } else {
      features.push(`${config.monthlyCredits.toLocaleString()} Credits / month`);
    }

    features.push(`${config.models.length} AI Models`);

    if (config.features.zipExport) features.push('ZIP Export');
    if (config.features.privateProjects) features.push('Private Projects');
    if (config.features.noWatermark) features.push('No Watermark');
    if (config.features.aiMemory) features.push('AI Memory');
    if (config.features.autoRefactor) features.push('Auto Refactor');
    if (config.features.teamWorkspace) features.push('Team Workspace (5 Users)');
    if (config.features.apiAccess) features.push('API Access');
    if (config.features.whiteLabel) features.push('White Label');
    if (config.features.customDomain) features.push('Custom Domain');

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
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl"
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
                      isHighlighted || popular
                        ? `border-${color}-500 bg-${color}-500/5`
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/20 text-${color}-500`}>
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
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-foreground/80">{feature}</span>
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
