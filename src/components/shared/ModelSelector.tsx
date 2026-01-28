import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Lock, Crown, Sparkles } from 'lucide-react';
import { useUserPlan, ROK_MODELS, PLAN_CONFIG, type RokModel, type PlanType } from '@/hooks/useUserPlan';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onUpgradeClick?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  onUpgradeClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userPlan, canUseModel, getAvailableModels } = useUserPlan();
  const { t, isRTL } = useLanguage();

  const currentModel = ROK_MODELS.find(m => m.id === selectedModel) || ROK_MODELS[0];
  const availableModels = getAvailableModels();

  const getPlanBadge = (minPlan: PlanType) => {
    const badges: Record<PlanType, { color: string; label: string }> = {
      spark: { color: 'bg-gray-500', label: 'Free' },
      builder: { color: 'bg-blue-500', label: 'Builder' },
      creator: { color: 'bg-purple-500', label: 'Creator' },
      scale: { color: 'bg-orange-500', label: 'Scale' }
    };
    return badges[minPlan];
  };

  const renderSpeedQuality = (model: RokModel) => (
    <div className={`flex items-center gap-3 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Zap className="w-3 h-3 text-yellow-400" />
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${isRTL ? 'ml-0.5' : 'mr-0.5'} ${
                i < model.speed ? 'bg-yellow-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Sparkles className="w-3 h-3 text-blue-400" />
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${isRTL ? 'ml-0.5' : 'mr-0.5'} ${
                i < model.quality ? 'bg-blue-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-accent rounded-lg transition-colors text-sm border border-border ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <span className="text-base">{currentModel.icon}</span>
        <span className="text-foreground font-medium">{currentModel.name}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className={`absolute bottom-full ${isRTL ? 'left-0' : 'right-0'} mb-2 w-72 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50`}
            >
              <div className="p-2 border-b border-border">
                <p className={`text-xs font-medium text-muted-foreground px-2 ${isRTL ? 'text-right' : ''}`}>
                  {t('models.selectModel')}
                </p>
              </div>
              
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {ROK_MODELS.map((model) => {
                  const isAvailable = canUseModel(model.id);
                  const badge = getPlanBadge(model.minPlan);

                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        if (isAvailable) {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        } else {
                          onUpgradeClick?.();
                        }
                      }}
                      className={`w-full p-3 rounded-lg transition-all ${isRTL ? 'text-right' : 'text-left'} ${
                        selectedModel === model.id
                          ? 'bg-primary/10 border border-primary'
                          : isAvailable
                            ? 'hover:bg-accent border border-transparent'
                            : 'opacity-60 border border-transparent'
                      }`}
                    >
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xl">{model.icon}</span>
                          <div>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="font-medium text-foreground">{model.name}</span>
                              {!isAvailable && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.color} text-white`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </div>
                        </div>
                        
                        {!isAvailable ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : selectedModel === model.id ? (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      
                      <div className={`mt-2 ${isRTL ? 'mr-9' : 'ml-9'}`}>
                        {renderSpeedQuality(model)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {userPlan?.plan === 'spark' && (
                <div className="p-3 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onUpgradeClick?.();
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Crown className="w-4 h-4" />
                    {t('models.upgradeAccess')}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
