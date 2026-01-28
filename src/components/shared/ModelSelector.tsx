import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Lock, Crown, Sparkles, Check } from 'lucide-react';
import { useUserPlan, ROK_MODELS, type RokModel, type PlanType } from '@/hooks/useUserPlan';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onUpgradeClick?: () => void;
  variant?: 'light' | 'dark';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  onUpgradeClick,
  variant = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userPlan, canUseModel } = useUserPlan();
  const { t, isRTL } = useLanguage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('top');

  const currentModel = ROK_MODELS.find(m => m.id === selectedModel) || ROK_MODELS[0];
  const isLight = variant === 'light';

  // Calculate best position for dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Need at least 400px for dropdown
      if (spaceAbove < 400 && spaceBelow > spaceAbove) {
        setDropdownPosition('bottom');
      } else {
        setDropdownPosition('top');
      }
    }
  }, [isOpen]);

  const getPlanBadge = (minPlan: PlanType) => {
    const badges: Record<PlanType, { bg: string; text: string; label: string }> = {
      spark: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Free' },
      builder: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Builder' },
      creator: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Creator' },
      scale: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Scale' }
    };
    return badges[minPlan];
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border ${isRTL ? 'flex-row-reverse' : ''
          } ${isLight
            ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
          }`}
      >
        <span className="text-base">{currentModel.icon}</span>
        <span className="hidden sm:inline">{currentModel.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown - Using Portal-like fixed positioning */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: buttonRef.current ? buttonRef.current.getBoundingClientRect().right - 360 : 0,
                ...(dropdownPosition === 'top'
                  ? { bottom: buttonRef.current ? window.innerHeight - buttonRef.current.getBoundingClientRect().top + 8 : 0 }
                  : { top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0 }
                ),
                width: '360px',
                zIndex: 101,
              }}
              className={`rounded-2xl overflow-hidden ${isLight
                  ? 'bg-white border border-gray-200 shadow-2xl'
                  : 'bg-zinc-900 border border-zinc-700 shadow-2xl'
                }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-100 bg-gray-50' : 'border-zinc-800'
                }`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-zinc-500'
                  } ${isRTL ? 'text-right' : ''}`}>
                  🤖 {t('models.selectModel')}
                </h3>
              </div>

              {/* Models List - Scrollable */}
              <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                <div className="p-2 space-y-2">
                  {ROK_MODELS.map((model) => {
                    const isAvailable = canUseModel(model.id);
                    const isSelected = selectedModel === model.id;
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
                        className={`w-full p-3 rounded-xl transition-all ${isRTL ? 'text-right' : 'text-left'
                          } ${isSelected
                            ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-400 shadow-md shadow-pink-100'
                            : isAvailable
                              ? isLight
                                ? 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
                              : isLight
                                ? 'bg-gray-50/50 border border-gray-100 opacity-60'
                                : 'bg-zinc-900 border border-zinc-800 opacity-50'
                          }`}
                      >
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {/* Model Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isSelected
                              ? 'bg-gradient-to-br from-pink-200 to-purple-200'
                              : isLight
                                ? 'bg-gray-100'
                                : 'bg-zinc-700'
                            }`}>
                            {model.icon}
                          </div>

                          {/* Model Info */}
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className={`font-bold text-base ${isLight ? 'text-gray-800' : 'text-white'
                                }`}>
                                {model.name}
                              </span>

                              {!isAvailable && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>

                            <p className={`text-xs mb-2 ${isLight ? 'text-gray-500' : 'text-zinc-400'
                              }`}>
                              {model.description}
                            </p>

                            {/* Speed & Quality */}
                            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${i < model.speed
                                          ? 'bg-amber-400'
                                          : isLight ? 'bg-gray-200' : 'bg-zinc-600'
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                <div className="flex gap-0.5">
                                  {[...Array(6)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${i < model.quality
                                          ? 'bg-blue-400'
                                          : isLight ? 'bg-gray-200' : 'bg-zinc-600'
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </div>
                            ) : !isAvailable ? (
                              <Lock className={`w-5 h-5 ${isLight ? 'text-gray-300' : 'text-zinc-500'}`} />
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upgrade Footer */}
              {userPlan?.plan === 'spark' && (
                <div className={`p-3 border-t ${isLight
                    ? 'border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50'
                    : 'border-zinc-800 bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-orange-900/30'
                  }`}>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onUpgradeClick?.();
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${isRTL ? 'flex-row-reverse' : ''
                      } bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <Crown className="w-5 h-5" />
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
