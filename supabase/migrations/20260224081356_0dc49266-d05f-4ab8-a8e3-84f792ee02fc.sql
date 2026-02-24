
-- Step 1: Add new enum values only
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'business';
