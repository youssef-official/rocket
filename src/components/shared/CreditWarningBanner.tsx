import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';

const BANNER_DISMISSED_KEY = 'vivora_credit_banner_dismissed';

export const CreditWarningBanner: React.FC = () => {
  const { userPlan, getRemainingCredits, shouldShowUpgradeBanner } = useUserPlan();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (!stored) return false;
      const { dismissedAt, plan } = JSON.parse(stored);
      // Only keep dismissed for 24 hours and same plan
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      return hoursSince < 24 && plan === userPlan?.plan;
    } catch { return false; }
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify({
      dismissedAt: Date.now(),
      plan: userPlan?.plan,
    }));
  };

  if (dismissed || !userPlan || !shouldShowUpgradeBanner()) return null;

  const remaining = getRemainingCredits();

  return (
    <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg px-4 py-2 flex items-center justify-between gap-3 mx-4 mt-2">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-pink-400 flex-shrink-0" />
        <span className="text-pink-100">
          You've used 50% of your credits! ({remaining.total} remaining). Upgrade for more.
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-pink-300" />
      </button>
    </div>
  );
};
