// Local stub — credits/plans removed. PLAN_CONFIG retains legacy keys for back-compat.
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const FEATURES = {
  zipExport: true, privateProjects: true, advancedModels: true,
  codeEditing: true, watermarkRemoval: true, priorityAccess: true, githubPush: true,
};

const TIER = {
  name: 'Local', price: 0, dailyCredits: 999_999, monthlyCredits: 999_999, features: FEATURES,
};

export const PLAN_CONFIG = { free: TIER, pro: TIER, business: TIER } as const;
export type PlanType = 'free' | 'pro' | 'business';

export interface UserPlan {
  id: string; userId: string; plan: PlanType;
  dailyCredits: number; maxDailyCredits: number;
  creditsUsedToday: number; totalCreditsUsed: number;
  monthlyCredits: number; lastDailyReset: string | null;
  createdAt: string; updatedAt: string;
}

export function useUserPlan() {
  const { user } = useAuth();
  const [userPlan] = useState<UserPlan>(() => ({
    id: 'local', userId: user?.id || 'local-user', plan: 'business',
    dailyCredits: 999_999, maxDailyCredits: 999_999,
    creditsUsedToday: 0, totalCreditsUsed: 0, monthlyCredits: 999_999,
    lastDailyReset: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  return {
    userPlan, loading: false,
    refetch: async () => {},
    getRemainingCredits: () => ({ daily: 999_999, monthly: 999_999, total: 999_999 }),
    shouldShowUpgradeBanner: () => false,
    canUsePrivateProjects: () => true,
    canExportZip: () => true,
  };
}
