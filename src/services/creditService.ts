// Credit Service - Simple 1 credit per successful generation
import { supabase } from '@/integrations/supabase/client';

// Deduct exactly 1 credit per successful generation
export async function deductCredits(
  userId: string,
  projectId?: string,
  workDescription?: string
): Promise<{ success: boolean; creditsDeducted: number; error?: string }> {
  try {
    // Get current user plan
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (planError || !userPlan) {
      console.log('[Credits] User plan not found, skipping deduction');
      return { success: false, creditsDeducted: 0, error: 'User plan not found' };
    }

    // Calculate remaining credits
    const dailyRemaining = Math.max(0, userPlan.daily_credits - userPlan.credits_used_today);
    const monthlyRemaining = Math.max(0, userPlan.monthly_credits - (userPlan.total_credits_used || 0));
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
        credits_used_today: userPlan.credits_used_today + dailyDeduct,
        total_credits_used: (userPlan.total_credits_used || 0) + monthlyDeduct
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Credits] Failed to update credits:', updateError);
      return { success: false, creditsDeducted: 0, error: 'Failed to update credits' };
    }

    // Record transaction
    await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        project_id: projectId || null,
        credits_used: 1,
        model_used: 'google/gemini-3-flash',
        work_type: 'code_generation',
        description: workDescription
      }]);

    console.log('[Credits] Successfully deducted 1 credit');
    return { success: true, creditsDeducted: 1 };
  } catch (error) {
    console.error('[Credits] Deduction error:', error);
    return { success: false, creditsDeducted: 0, error: 'Unknown error' };
  }
}
