// Credit Service - Smart credit deduction based on complexity
import { supabase } from '@/integrations/supabase/client';
import { PLAN_CONFIG, type PlanType } from '@/lib/plans';

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

async function checkAndResetDailyCredits(userId: string): Promise<void> {
  try {
    await supabase.rpc('check_and_reset_user_credits', { p_user_id: userId });
  } catch {
    // silently ignore
  }
}

export async function checkCreditsAvailable(userId: string): Promise<boolean> {
  try {
    await checkAndResetDailyCredits(userId);

    const { data: userPlan, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !userPlan) return true;

    const dailyCredits = toNumber(userPlan.daily_credits);
    const usedToday = toNumber(userPlan.credits_used_today);
    const totalUsed = toNumber(userPlan.total_credits_used);
    const plan = (userPlan.plan as PlanType) || 'spark';
    const monthlyMax = PLAN_CONFIG[plan]?.monthlyCredits ?? 0;

    const dailyRemaining = Math.max(0, dailyCredits - usedToday);
    const monthlyRemaining = Math.max(0, monthlyMax - totalUsed);

    return (dailyRemaining + monthlyRemaining) >= 0.5;
  } catch {
    return true;
  }
}

/**
 * Deduct credits based on actual complexity (0.5 / 1 / 2 / 3)
 * creditsToDeduct: determined by the AI credit analyzer
 */
export async function deductCredits(
  userId: string,
  projectId?: string,
  workDescription?: string,
  creditsToDeduct: number = 1
): Promise<{ success: boolean; creditsDeducted: number; error?: string }> {
  try {
    await checkAndResetDailyCredits(userId);

    let { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if ((planError as any)?.code === 'PGRST116' || !userPlan) {
      const { data: created, error: createError } = await supabase
        .from('user_plans')
        .insert([{
          user_id: userId,
          plan: 'spark',
          daily_credits: 5,
          max_daily_credits: 5,
          credits_used_today: 0,
          total_credits_used: 0,
          monthly_credits: 0,
          last_daily_reset: new Date().toISOString(),
        }])
        .select('*')
        .single();

      if (createError || !created) {
        return { success: false, creditsDeducted: 0, error: 'User plan not found' };
      }
      userPlan = created;
      planError = null;
    }

    if (planError || !userPlan) {
      return { success: false, creditsDeducted: 0, error: 'User plan not found' };
    }

    const dailyCredits = toNumber(userPlan.daily_credits);
    const usedToday = toNumber(userPlan.credits_used_today);
    const totalUsed = toNumber(userPlan.total_credits_used);
    const plan = (userPlan.plan as PlanType) || 'spark';
    const monthlyMax = PLAN_CONFIG[plan]?.monthlyCredits ?? 0;

    const dailyRemaining = Math.max(0, dailyCredits - usedToday);
    const monthlyRemaining = Math.max(0, monthlyMax - totalUsed);
    const totalRemaining = dailyRemaining + monthlyRemaining;

    // Use minimum 0.5 credits
    const actual = Math.max(0.5, creditsToDeduct);

    if (totalRemaining < actual) {
      return { success: false, creditsDeducted: 0, error: 'Insufficient credits' };
    }

    // Deduct from daily first, then monthly
    const dailyDeduct = Math.min(actual, dailyRemaining);
    const monthlyDeduct = actual - dailyDeduct;

    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        credits_used_today: usedToday + dailyDeduct,
        total_credits_used: totalUsed + monthlyDeduct,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, creditsDeducted: 0, error: 'Failed to update credits' };
    }

    await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        project_id: projectId || null,
        credits_used: actual,
        model_used: 'google/gemini-3-flash-preview',
        work_type: 'code_generation',
        description: workDescription
      }]);

    return { success: true, creditsDeducted: actual };
  } catch {
    return { success: false, creditsDeducted: 0, error: 'Unknown error' };
  }
}
