// Shared plan configuration (single source of truth)

export type PlanType = 'free' | 'pro' | 'business';

export const PLAN_CONFIG: Record<
  PlanType,
  {
    name: string;
    price: number;
    dailyCredits: number;
    monthlyCredits: number;
    features: {
      zipExport: boolean;
      privateProjects: boolean;
      priorityAccess: boolean;
      watermarkRemoval: boolean;
      codeEditing: boolean;
      githubPush: boolean;
    };
  }
> = {
  free: {
    name: 'Free',
    price: 0,
    dailyCredits: 3,
    monthlyCredits: 0,
    features: {
      zipExport: false,
      privateProjects: false,
      priorityAccess: false,
      watermarkRemoval: false,
      codeEditing: false,
      githubPush: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 15,
    dailyCredits: 5,
    monthlyCredits: 150,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: false,
      watermarkRemoval: true,
      codeEditing: true,
      githubPush: true,
    },
  },
  business: {
    name: 'Business',
    price: 29,
    dailyCredits: 10,
    monthlyCredits: 400,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: true,
      watermarkRemoval: true,
      codeEditing: true,
      githubPush: true,
    },
  },
};

/** Safely resolve any plan string to a valid PlanType (handles legacy values) */
export function normalizePlan(plan: string | null | undefined): PlanType {
  if (plan === 'pro' || plan === 'business') return plan;
  return 'free';
}
