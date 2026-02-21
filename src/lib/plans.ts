// Shared plan configuration (single source of truth)

export type PlanType = 'spark' | 'builder' | 'creator' | 'scale';

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
    };
  }
> = {
  spark: {
    name: 'Free',
    price: 0,
    dailyCredits: 5,
    monthlyCredits: 0,
    features: {
      zipExport: false,
      privateProjects: false,
      priorityAccess: false,
    },
  },
  builder: {
    name: 'Builder',
    price: 9,
    dailyCredits: 5,
    monthlyCredits: 40,
    features: {
      zipExport: true,
      privateProjects: false,
      priorityAccess: false,
    },
  },
  creator: {
    name: 'Creator',
    price: 15,
    dailyCredits: 5,
    monthlyCredits: 50,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: false,
    },
  },
  scale: {
    name: 'Scale',
    price: 22,
    dailyCredits: 5,
    monthlyCredits: 70,
    features: {
      zipExport: true,
      privateProjects: true,
      priorityAccess: true,
    },
  },
};
