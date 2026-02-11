import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';

export const CreditWarningBanner: React.FC = () => {
  const { userPlan, getRemainingCredits, shouldShowUpgradeBanner } = useUserPlan();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when credits change significantly
  useEffect(() => {
    setDismissed(false);
  }, [userPlan?.plan]);

  if (dismissed || !userPlan || !shouldShowUpgradeBanner()) return null;

  const remaining = getRemainingCredits();

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 flex items-center justify-between gap-3 mx-4 mt-2">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <span className="text-yellow-200">
          You've used 50% of your credits! ({remaining.total} remaining). Upgrade for more.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-yellow-400" />
      </button>
    </div>
  );
};
