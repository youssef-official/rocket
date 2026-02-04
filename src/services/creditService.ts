// Credit Service - Simple 1 credit per successful generation
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

// Deduct exactly 1 credit per successful generation
export async function deductCredits(
  userId: string,
  projectId?: string,
  workDescription?: string
): Promise<{ success: boolean; creditsDeducted: number; error?: string }> {
  try {
    // Get current user plan
    let { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If plan missing, create a default one (keeps deduction reliable for new users)
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
    // Monthly remaining is derived from plan config (DB column may be informational)
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
        total_credits_used: totalUsed + monthlyDeduct
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
        model_used: 'google/gemini-3-flash',
        work_type: 'code_generation',
        description: workDescription
      }]);

    if (txError) {
      // Don't fail the whole operation if logging fails.
      console.warn('[Credits] Failed to record transaction:', txError);
    }

    console.log('[Credits] Successfully deducted 1 credit');
    return { success: true, creditsDeducted: 1 };
  } catch (error) {
    console.error('[Credits] Deduction error:', error);
    return { success: false, creditsDeducted: 0, error: 'Unknown error' };
  }
}
