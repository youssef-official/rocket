// Shared plan configuration (single source of truth)

export type PlanType = 'spark' | 'builder' | 'creator' | 'scale';

export const PLAN_CONFIG: Record<
  PlanType,
  {
    name: string;
    price: number;
    dailyCredits: number;
    monthlyCredits: number;
    maxTokens: number;
    vivoraProjects: number; // max Vivora hosted projects (0 = 1 for free)
    features: {
      zipExport: boolean;
      privateProjects: boolean;
      priorityAccess: boolean;
      allCalls: boolean;
    };
  }
> = {
  spark: {
    name: 'Free',
    price: 0,
    dailyCredits: 3,
    monthlyCredits: 0,
    maxTokens: 8000,
    vivoraProjects: 1,
    features: {
      zipExport: false,
      privateProjects: false,
      priorityAccess: false,
      allCalls: false,
    },
  },
  builder: {
    name: 'Builder',
    price: 9,
    dailyCredits: 40,
    monthlyCredits: 0,
    maxTokens: 30000,
    vivoraProjects: 5,
    features: {
      zipExport: true,
      privateProjects: false,
      priorityAccess: false,
      allCalls: true,
    },
  },
  creator: {
    name: 'Creator',
    price: 15,
    dailyCredits: 50,
    monthlyCredits: 0,
    maxTokens: 40000,
    vivoraProjects: 10,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: false,
      allCalls: true,
    },
  },
  scale: {
    name: 'Scale',
    price: 22,
    dailyCredits: 70,
    monthlyCredits: 0,
    maxTokens: 60000,
    vivoraProjects: 15,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: true,
      allCalls: true,
    },
  },
};
