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
    };
  }
> = {
  spark: {
    name: 'Spark',
    price: 0,
    dailyCredits: 5,
    monthlyCredits: 0,
    features: {
      zipExport: false,
    },
  },
  builder: {
    name: 'Builder',
    price: 8,
    dailyCredits: 5,
    monthlyCredits: 100,
    features: {
      zipExport: true,
    },
  },
  creator: {
    name: 'Creator',
    price: 19,
    dailyCredits: 5,
    monthlyCredits: 300,
    features: {
      zipExport: true,
    },
  },
  scale: {
    name: 'Scale',
    price: 49,
    dailyCredits: 5,
    monthlyCredits: 700,
    features: {
      zipExport: true,
    },
  },
};
