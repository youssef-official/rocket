// Credit Service - Simple 1 credit per successful generation
// Includes automatic daily credit reset check
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

/**
 * Check and reset daily credits if needed (called before deduction)
 * This ensures users get their daily credits even without a cron job
 */
async function checkAndResetDailyCredits(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('check_and_reset_user_credits', {
      p_user_id: userId
    });

    if (error) {
      console.warn('[Credits] Could not check daily reset:', error.message);
      return;
    }

    if (data && data[0]?.should_reset) {
      console.log('[Credits] Daily credits have been reset for user');
    }
  } catch (e) {
    console.warn('[Credits] Daily reset check failed:', e);
  }
}

// Deduct exactly 1 credit per successful generation
export async function deductCredits(
  userId: string,
  projectId?: string,
  workDescription?: string
): Promise<{ success: boolean; creditsDeducted: number; error?: string }> {
  try {
    // First, check if daily credits need to be reset
    await checkAndResetDailyCredits(userId);

    // Get current user plan
    let { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If plan missing, create a default one
    if ((planError as any)?.code === 'PGRST116' || !userPlan) {
      const { data: created, error: createError } = await supabase
        .from('user_plans')
        .insert([
          {
            user_id: userId,
            plan: 'spark',
            daily_credits: 5,
            max_daily_credits: 5,
            credits_used_today: 0,
            total_credits_used: 0,
            monthly_credits: 0,
            last_daily_reset: new Date().toISOString(),
          },
        ])
        .select('*')
        .single();

      if (createError || !created) {
        console.error('[Credits] Failed to create user plan:', createError);
        return { success: false, creditsDeducted: 0, error: 'User plan not found' };
      }

      userPlan = created;
      planError = null;
    }

    if (planError || !userPlan) {
      console.log('[Credits] User plan not found, skipping deduction');
      return { success: false, creditsDeducted: 0, error: 'User plan not found' };
    }

    // Calculate remaining credits
    const dailyCredits = toNumber(userPlan.daily_credits);
    const usedToday = toNumber(userPlan.credits_used_today);
    const totalUsed = toNumber(userPlan.total_credits_used);

    const plan = (userPlan.plan as PlanType) || 'spark';
    const monthlyMax = PLAN_CONFIG[plan]?.monthlyCredits ?? 0;

    const dailyRemaining = Math.max(0, dailyCredits - usedToday);
    const monthlyRemaining = Math.max(0, monthlyMax - totalUsed);
    const totalRemaining = dailyRemaining + monthlyRemaining;

    if (totalRemaining < 1) {
      console.log('[Credits] Insufficient credits');
      return { success: false, creditsDeducted: 0, error: 'Insufficient credits' };
    }

    // Deduct 1 credit - from daily first, then monthly
    const dailyDeduct = Math.min(1, dailyRemaining);
    const monthlyDeduct = 1 - dailyDeduct;

    // Update user plan
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        credits_used_today: usedToday + dailyDeduct,
        total_credits_used: totalUsed + monthlyDeduct,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Credits] Failed to update credits:', updateError);
      return { success: false, creditsDeducted: 0, error: 'Failed to update credits' };
    }

    // Record transaction
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        project_id: projectId || null,
        credits_used: 1,
        model_used: 'google/gemini-3-flash-preview',
        work_type: 'code_generation',
        description: workDescription
      }]);

    if (txError) {
      console.warn('[Credits] Failed to record transaction:', txError);
    }

    console.log('[Credits] Successfully deducted 1 credit');
    return { success: true, creditsDeducted: 1 };
  } catch (error) {
    console.error('[Credits] Deduction error:', error);
    return { success: false, creditsDeducted: 0, error: 'Unknown error' };
  }
}
