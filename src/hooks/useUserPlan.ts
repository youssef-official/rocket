import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIG, type PlanType } from '@/lib/plans';
import { api } from '@/services/api';
import { useBackendEvents } from '@/hooks/useBackendEvents';

export { PLAN_CONFIG };
export type { PlanType };

export interface UserPlan {
  id: string; userId: string; plan: PlanType; dailyCredits: number; maxDailyCredits: number;
  creditsUsedToday: number; totalCreditsUsed: number; monthlyCredits: number; monthlyCreditsUsed: number;
  subscriptionExpiresAt: string | null; lastDailyReset: string | null; createdAt: string; updatedAt: string;
}

/**
 * A single shared query powers every credit/plan display in the application.
 * React Query deduplicates calls across components, refreshes on focus, and
 * polls while the app is open so administrator updates reach active sessions.
 */
export function useUserPlan() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['webo-user-plan', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => api<UserPlan>('/account/plan'),
    staleTime: 1_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
  const userPlan = query.data ?? null;
  useBackendEvents(Boolean(user?.id), event => {
    if (event.type === 'account.updated') void query.refetch();
  });
  const getRemainingCredits = useCallback(() => {
    if (!userPlan) return { daily: 0, monthly: 0, total: 0 };
    const dailyCredits = Number(userPlan.dailyCredits) || 0;
    const usedToday = Number(userPlan.creditsUsedToday) || 0;
    const monthlyCredits = Number(userPlan.monthlyCredits) || 0;
    const monthlyUsed = Number(userPlan.monthlyCreditsUsed) || 0;
    const daily = Math.max(0, dailyCredits - usedToday);
    const monthly = Math.max(0, monthlyCredits - monthlyUsed);
    return { daily, monthly, total: daily + monthly };
  }, [userPlan]);
  const shouldShowUpgradeBanner = useCallback(() => getRemainingCredits().daily <= 1, [getRemainingCredits]);
  const canUsePrivateProjects = useCallback(() => userPlan?.plan !== 'free', [userPlan?.plan]);
  const canExportZip = useCallback(() => userPlan?.plan !== 'free', [userPlan?.plan]);

  return {
    userPlan,
    loading: query.isLoading,
    refetch: query.refetch,
    getRemainingCredits,
    shouldShowUpgradeBanner,
    canUsePrivateProjects,
    canExportZip,
  };
}
