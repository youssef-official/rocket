import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIG, type PlanType } from '@/lib/plans';

// re-export for existing imports across the app
export { PLAN_CONFIG };
export type { PlanType };

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
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPlan = useCallback(async () => {
    if (!user) {
      setUserPlan(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No plan exists, create default
          const { data: newPlan, error: createError } = await supabase
            .from('user_plans')
            .insert([{
              user_id: user.id,
              plan: 'spark',
              daily_credits: 5,
              max_daily_credits: 5,
              credits_used_today: 0,
              total_credits_used: 0,
              monthly_credits: 0,
            }])
            .select()
            .single();

          if (createError) throw createError;
          
          setUserPlan({
            id: newPlan.id,
            userId: newPlan.user_id,
            plan: newPlan.plan as PlanType,
            dailyCredits: newPlan.daily_credits,
            maxDailyCredits: newPlan.max_daily_credits,
            creditsUsedToday: newPlan.credits_used_today,
            totalCreditsUsed: newPlan.total_credits_used,
            monthlyCredits: newPlan.monthly_credits,
            lastDailyReset: newPlan.last_daily_reset,
            createdAt: newPlan.created_at,
            updatedAt: newPlan.updated_at,
          });
        } else {
          throw error;
        }
      } else if (data) {
        setUserPlan({
          id: data.id,
          userId: data.user_id,
          plan: data.plan as PlanType,
          dailyCredits: data.daily_credits,
          maxDailyCredits: data.max_daily_credits,
          creditsUsedToday: data.credits_used_today,
          totalCreditsUsed: data.total_credits_used,
          monthlyCredits: data.monthly_credits,
          lastDailyReset: data.last_daily_reset,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserPlan();
  }, [fetchUserPlan]);

  // Get remaining credits
  const getRemainingCredits = useCallback(() => {
    if (!userPlan) return { daily: 0, monthly: 0, total: 0 };
    
    const dailyRemaining = Math.max(0, userPlan.dailyCredits - userPlan.creditsUsedToday);
    const planConfig = PLAN_CONFIG[userPlan.plan];
    const monthlyRemaining = Math.max(0, planConfig.monthlyCredits - userPlan.totalCreditsUsed);
    
    return {
      daily: dailyRemaining,
      monthly: monthlyRemaining,
      total: dailyRemaining + monthlyRemaining
    };
  }, [userPlan]);

  // Check if user should see upgrade banner
  const shouldShowUpgradeBanner = useCallback(() => {
    if (!userPlan) return false;
    const remaining = getRemainingCredits();
    const totalAllowed = userPlan.dailyCredits + PLAN_CONFIG[userPlan.plan].monthlyCredits;
    return remaining.total < totalAllowed * 0.5;
  }, [userPlan, getRemainingCredits]);

  // Check if user can use private projects
  const canUsePrivateProjects = useCallback(() => {
    if (!userPlan) return false;
    return userPlan.plan === 'creator' || userPlan.plan === 'scale';
  }, [userPlan]);

  // Check if user can export ZIP
  const canExportZip = useCallback(() => {
    if (!userPlan) return false;
    return PLAN_CONFIG[userPlan.plan].features.zipExport;
  }, [userPlan]);

  return {
    userPlan,
    loading,
    refetch: fetchUserPlan,
    getRemainingCredits,
    shouldShowUpgradeBanner,
    canUsePrivateProjects,
    canExportZip,
  };
}
