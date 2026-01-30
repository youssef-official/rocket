import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlanType = 'spark' | 'builder' | 'creator' | 'scale';

export interface UserPlan {
  id: string;
  userId: string;
  plan: PlanType;
  monthlyCredits: number;
  dailyCredits: number;
  maxDailyCredits: number;
  creditsUsedToday: number;
  totalCreditsUsed: number;
  lastDailyReset: string;
}

export interface RokModel {
  id: string;
  name: string;
  realModel: string;
  description: string;
  speed: number;
  quality: number;
  multiplier: number;
  minPlan: PlanType;
  icon: string;
}

// Rok AI Models configuration
export const ROK_MODELS: RokModel[] = [
  {
    id: 'rok-fast',
    name: 'Rok-Fast',
    realModel: 'google/gemini-2.0-flash',
    description: 'Quick edits',
    speed: 5,
    quality: 2,
    multiplier: 1,
    minPlan: 'spark',
    icon: '🤖'
  },
  {
    id: 'rok-smart',
    name: 'Rok-Smart',
    realModel: 'xai/grok-4.1-fast-reasoning',
    description: 'Stable coding',
    speed: 4,
    quality: 3,
    multiplier: 1.3,
    minPlan: 'spark',
    icon: '🧠'
  },
  {
    id: 'rok-turbo',
    name: 'Rok-Turbo',
    realModel: 'google/gemini-3-flash',
    description: 'Production apps',
    speed: 3,
    quality: 4,
    multiplier: 2.2,
    minPlan: 'builder',
    icon: '⚡'
  },
  {
    id: 'rok-ultra',
    name: 'Rok-Ultra',
    realModel: 'anthropic/claude-haiku-4.5',
    description: 'Smart logic',
    speed: 2,
    quality: 5,
    multiplier: 3,
    minPlan: 'creator',
    icon: '👑'
  },
  {
    id: 'rok-reson',
    name: 'Rok-Reson',
    realModel: 'anthropic/claude-opus-4.5',
    description: 'Deep systems',
    speed: 1,
    quality: 6,
    multiplier: 4,
    minPlan: 'scale',
    icon: '🧠'
  }
];

// Plan configurations - Updated credits
export const PLAN_CONFIG = {
  spark: {
    name: 'Spark',
    price: 0,
    monthlyCredits: 0,
    dailyCredits: 5,
    maxDailyCredits: 5, // Only 5 daily, no monthly
    models: ['rok-fast', 'rok-smart'],
    features: {
      zipExport: false,
      privateProjects: false,
      noWatermark: false,
      aiMemory: false,
      autoRefactor: false,
      teamWorkspace: false,
      apiAccess: false,
      whiteLabel: false,
      customDomain: false
    }
  },
  builder: {
    name: 'Builder',
    price: 8,
    monthlyCredits: 100, // 100 monthly + 5 daily
    dailyCredits: 5,
    maxDailyCredits: 5,
    models: ['rok-fast', 'rok-smart', 'rok-turbo'],
    features: {
      zipExport: true,
      privateProjects: false,
      noWatermark: true,
      aiMemory: false,
      autoRefactor: false,
      teamWorkspace: false,
      apiAccess: false,
      whiteLabel: false,
      customDomain: false
    }
  },
  creator: {
    name: 'Creator',
    price: 19,
    monthlyCredits: 300, // 300 monthly + 5 daily
    dailyCredits: 5,
    maxDailyCredits: 5,
    models: ['rok-fast', 'rok-smart', 'rok-turbo', 'rok-ultra'],
    features: {
      zipExport: true,
      privateProjects: true,
      noWatermark: true,
      aiMemory: true,
      autoRefactor: true,
      teamWorkspace: false,
      apiAccess: false,
      whiteLabel: false,
      customDomain: false
    }
  },
  scale: {
    name: 'Scale',
    price: 49,
    monthlyCredits: 700, // 700 monthly + 5 daily
    dailyCredits: 5,
    maxDailyCredits: 5,
    models: ['rok-fast', 'rok-smart', 'rok-turbo', 'rok-ultra', 'rok-reson'],
    features: {
      zipExport: true,
      privateProjects: true,
      noWatermark: true,
      aiMemory: true,
      autoRefactor: true,
      teamWorkspace: true,
      apiAccess: true,
      whiteLabel: true,
      customDomain: true
    }
  }
};

// Smart credit estimation based on actual work complexity
export function estimateCredits(
  prompt: string,
  filesChanged: number,
  linesOfCode: number
): number {
  // Base credit calculation
  let baseCredits = 0.2;
  
  // Analyze prompt complexity (ignore user claims like "small edit")
  const promptLower = prompt.toLowerCase();
  
  // Complex features detection
  const complexKeywords = [
    'dashboard', 'admin', 'authentication', 'auth', 'login', 'signup',
    'database', 'api', 'backend', 'game', 'animation', 'chart', 'graph',
    'e-commerce', 'shop', 'cart', 'payment', 'stripe'
  ];
  
  const mediumKeywords = [
    'page', 'component', 'form', 'table', 'list', 'modal', 'dialog',
    'navigation', 'menu', 'header', 'footer', 'layout'
  ];
  
  const simpleKeywords = [
    'color', 'text', 'font', 'size', 'margin', 'padding', 'border',
    'icon', 'button', 'link', 'image'
  ];
  
  // Check for complex features
  const hasComplex = complexKeywords.some(k => promptLower.includes(k));
  const hasMedium = mediumKeywords.some(k => promptLower.includes(k));
  const hasSimple = simpleKeywords.some(k => promptLower.includes(k));
  
  if (hasComplex) {
    baseCredits = 2.5;
  } else if (hasMedium) {
    baseCredits = 1.0;
  } else if (hasSimple) {
    baseCredits = 0.4;
  }
  
  // Adjust based on files changed
  if (filesChanged > 10) {
    baseCredits *= 1.5;
  } else if (filesChanged > 5) {
    baseCredits *= 1.2;
  }
  
  // Adjust based on lines of code
  if (linesOfCode > 1000) {
    baseCredits *= 1.8;
  } else if (linesOfCode > 500) {
    baseCredits *= 1.4;
  } else if (linesOfCode > 200) {
    baseCredits *= 1.2;
  }
  
  // Cap at reasonable max
  return Math.min(Math.max(baseCredits, 0.2), 6.0);
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
        // If no plan exists, create one
        if (error.code === 'PGRST116') {
          const { data: newPlan, error: insertError } = await supabase
            .from('user_plans')
            .insert([{
              user_id: user.id,
              plan: 'spark',
              daily_credits: 5,
              max_daily_credits: 5,
              monthly_credits: 0
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          
          setUserPlan({
            id: newPlan.id,
            userId: newPlan.user_id,
            plan: newPlan.plan as PlanType,
            monthlyCredits: newPlan.monthly_credits,
            dailyCredits: newPlan.daily_credits,
            maxDailyCredits: newPlan.max_daily_credits,
            creditsUsedToday: newPlan.credits_used_today,
            totalCreditsUsed: newPlan.total_credits_used,
            lastDailyReset: newPlan.last_daily_reset
          });
        } else {
          throw error;
        }
      } else {
        setUserPlan({
          id: data.id,
          userId: data.user_id,
          plan: data.plan as PlanType,
          monthlyCredits: data.monthly_credits,
          dailyCredits: data.daily_credits,
          maxDailyCredits: data.max_daily_credits,
          creditsUsedToday: data.credits_used_today,
          totalCreditsUsed: data.total_credits_used,
          lastDailyReset: data.last_daily_reset
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

  // Get remaining credits - daily first, then monthly
  const getRemainingCredits = useCallback((): { daily: number; monthly: number; total: number } => {
    if (!userPlan) return { daily: 0, monthly: 0, total: 0 };
    
    const planConfig = PLAN_CONFIG[userPlan.plan];
    const dailyRemaining = Math.max(0, userPlan.dailyCredits - userPlan.creditsUsedToday);
    const monthlyRemaining = Math.max(0, planConfig.monthlyCredits - userPlan.totalCreditsUsed);
    
    return {
      daily: dailyRemaining,
      monthly: monthlyRemaining,
      total: dailyRemaining + monthlyRemaining
    };
  }, [userPlan]);

  const getAvailableModels = useCallback((): RokModel[] => {
    if (!userPlan) return ROK_MODELS.filter(m => m.minPlan === 'spark');
    
    const planOrder: PlanType[] = ['spark', 'builder', 'creator', 'scale'];
    const userPlanIndex = planOrder.indexOf(userPlan.plan);
    
    return ROK_MODELS.filter(model => {
      const modelPlanIndex = planOrder.indexOf(model.minPlan);
      return modelPlanIndex <= userPlanIndex;
    });
  }, [userPlan]);

  const canUseModel = useCallback((modelId: string): boolean => {
    if (!userPlan) return false;
    
    const model = ROK_MODELS.find(m => m.id === modelId);
    if (!model) return false;
    
    const planOrder: PlanType[] = ['spark', 'builder', 'creator', 'scale'];
    const userPlanIndex = planOrder.indexOf(userPlan.plan);
    const modelPlanIndex = planOrder.indexOf(model.minPlan);
    
    return modelPlanIndex <= userPlanIndex;
  }, [userPlan]);

  // Use credits - daily first, then monthly
  const useCredits = useCallback(async (
    credits: number,
    modelId: string,
    projectId?: string,
    messageId?: string,
    workType?: string,
    description?: string
  ): Promise<boolean> => {
    if (!user || !userPlan) return false;

    const model = ROK_MODELS.find(m => m.id === modelId);
    const finalCredits = credits * (model?.multiplier || 1);
    
    const remaining = getRemainingCredits();
    if (remaining.total < finalCredits) return false;

    // Deduct from daily first, then monthly
    let dailyDeduct = Math.min(finalCredits, remaining.daily);
    let monthlyDeduct = finalCredits - dailyDeduct;

    try {
      // Update user plan credits
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          credits_used_today: userPlan.creditsUsedToday + dailyDeduct,
          total_credits_used: userPlan.totalCreditsUsed + monthlyDeduct
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert([{
          user_id: user.id,
          project_id: projectId,
          message_id: messageId,
          credits_used: finalCredits,
          model_used: modelId,
          work_type: workType,
          description: description
        }]);

      // Refresh user plan
      await fetchUserPlan();
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  }, [user, userPlan, fetchUserPlan, getRemainingCredits]);

  const shouldShowUpgradeBanner = useCallback((): boolean => {
    if (!userPlan) return false;
    const remaining = getRemainingCredits();
    const planConfig = PLAN_CONFIG[userPlan.plan];
    const total = userPlan.dailyCredits + planConfig.monthlyCredits;
    return remaining.total <= total * 0.5;
  }, [userPlan, getRemainingCredits]);

  const canUsePrivateProjects = useCallback((): boolean => {
    if (!userPlan) return false;
    return PLAN_CONFIG[userPlan.plan].features.privateProjects;
  }, [userPlan]);

  const canExportZip = useCallback((): boolean => {
    if (!userPlan) return false;
    return PLAN_CONFIG[userPlan.plan].features.zipExport;
  }, [userPlan]);

  return {
    userPlan,
    loading,
    fetchUserPlan,
    getRemainingCredits,
    getAvailableModels,
    canUseModel,
    useCredits,
    shouldShowUpgradeBanner,
    canUsePrivateProjects,
    canExportZip,
    estimateCredits,
    ROK_MODELS,
    PLAN_CONFIG
  };
}
