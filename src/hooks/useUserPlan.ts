// Local stub — credits/plans are removed in the open-source build.
// Returns "unlimited" so all gated features are unlocked.

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const PLAN_CONFIG = {
  free: {
    name: 'Local',
    monthlyCredits: 999_999,
    features: { zipExport: true, privateProjects: true, advancedModels: true },
  },
  pro: {
    name: 'Local',
    monthlyCredits: 999_999,
    features: { zipExport: true, privateProjects: true, advancedModels: true },
  },
  business: {
    name: 'Local',
    monthlyCredits: 999_999,
    features: { zipExport: true, privateProjects: true, advancedModels: true },
  },
} as const;

export type PlanType = 'free' | 'pro' | 'business';

export interface UserPlan {
  id: string;
  userId: string;
  plan: PlanType;
  dailyCredits: number;
  maxDailyCredits: number;
  creditsUsedToday: number;
  totalCreditsUsed: number;
  monthlyCredits: number;
  lastDailyReset: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useUserPlan() {
  const { user } = useAuth();
  const [userPlan] = useState<UserPlan>(() => ({
    id: 'local',
    userId: user?.id || 'local-user',
    plan: 'business',
    dailyCredits: 999_999,
    maxDailyCredits: 999_999,
    creditsUsedToday: 0,
    totalCreditsUsed: 0,
    monthlyCredits: 999_999,
    lastDailyReset: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    userPlan,
    loading: false,
    refetch: async () => {},
    getRemainingCredits: () => ({ daily: 999_999, monthly: 999_999, total: 999_999 }),
    shouldShowUpgradeBanner: () => false,
    canUsePrivateProjects: () => true,
    canExportZip: () => true,
  };
}
