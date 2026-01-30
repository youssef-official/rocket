// Credit Deduction Service - Handles real credit calculation and deduction
import { supabase } from '@/integrations/supabase/client';
import { ROK_MODELS, PLAN_CONFIG, type PlanType } from '@/hooks/useUserPlan';

// Credit cost examples based on work complexity
export const CREDIT_EXAMPLES = {
  'Change color': { type: 'Small edit', cost: 0.4 },
  'Remove footer': { type: 'Section edit', cost: 0.8 },
  'Add auth': { type: 'Login system', cost: 1.3 },
  'Landing page': { type: 'Full layout', cost: 2.0 },
  'Dashboard': { type: 'Admin panel', cost: 4.0 },
};

// Calculate credits based on ACTUAL work done (ignoring user claims)
export function calculateCredits(
  filesChanged: number,
  linesOfCode: number,
  modelMultiplier: number = 1,
  isFirstVersion: boolean = false
): number {
  if (isFirstVersion) {
    return 2.0;
  }

  let baseCredits = 0.2;

  // Files changed
  if (filesChanged >= 15) {
    baseCredits = 4.0; // Dashboard/Admin panel level
  } else if (filesChanged >= 10) {
    baseCredits = 2.5; // Full layout
  } else if (filesChanged >= 5) {
    baseCredits = 1.5; // Component work
  } else if (filesChanged >= 3) {
    baseCredits = 0.8; // Section edit
  } else if (filesChanged >= 1) {
    baseCredits = 0.4; // Small edit
  }

  // Lines of code multiplier
  if (linesOfCode > 1500) {
    baseCredits *= 1.6;
  } else if (linesOfCode > 800) {
    baseCredits *= 1.3;
  } else if (linesOfCode > 400) {
    baseCredits *= 1.15;
  }

  // Apply model multiplier
  const finalCredits = baseCredits * modelMultiplier;

  // Cap between 0.2 and 6.0
  return Math.round(Math.min(Math.max(finalCredits, 0.2), 6.0) * 10) / 10;
}

// Deduct credits from user's account (daily first, then monthly)
export async function deductCredits(
  userId: string,
  credits: number,
  modelId: string,
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
      return { success: false, creditsDeducted: 0, error: 'User plan not found' };
    }

    const planConfig = PLAN_CONFIG[userPlan.plan as PlanType];
    
    // Calculate remaining credits
    const dailyRemaining = Math.max(0, userPlan.daily_credits - userPlan.credits_used_today);
    const monthlyRemaining = Math.max(0, planConfig.monthlyCredits - (userPlan.total_credits_used || 0));
    const totalRemaining = dailyRemaining + monthlyRemaining;

    if (totalRemaining < credits) {
      return { success: false, creditsDeducted: 0, error: 'Insufficient credits' };
    }

    // Deduct from daily first, then monthly
    const dailyDeduct = Math.min(credits, dailyRemaining);
    const monthlyDeduct = credits - dailyDeduct;

    // Update user plan
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        credits_used_today: userPlan.credits_used_today + dailyDeduct,
        total_credits_used: (userPlan.total_credits_used || 0) + monthlyDeduct
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
      return { success: false, creditsDeducted: 0, error: 'Failed to update credits' };
    }

    // Record transaction
    await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        project_id: projectId || null,
        credits_used: credits,
        model_used: modelId,
        work_type: 'code_generation',
        description: workDescription
      }]);

    return { success: true, creditsDeducted: credits };
  } catch (error) {
    console.error('Credit deduction error:', error);
    return { success: false, creditsDeducted: 0, error: 'Unknown error' };
  }
}

// Get model multiplier
export function getModelMultiplier(modelId: string): number {
  const model = ROK_MODELS.find(m => m.id === modelId);
  return model?.multiplier || 1;
