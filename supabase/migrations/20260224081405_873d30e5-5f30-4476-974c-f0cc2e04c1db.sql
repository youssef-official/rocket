
-- Step 2: Migrate existing user data from old plans to new plans
UPDATE public.user_plans SET plan = 'free', daily_credits = 3, max_daily_credits = 3, monthly_credits = 0 WHERE plan = 'spark';
UPDATE public.user_plans SET plan = 'pro', daily_credits = 5, max_daily_credits = 5, monthly_credits = 150 WHERE plan = 'builder';
UPDATE public.user_plans SET plan = 'pro', daily_credits = 5, max_daily_credits = 5, monthly_credits = 150 WHERE plan = 'creator';
UPDATE public.user_plans SET plan = 'business', daily_credits = 10, max_daily_credits = 10, monthly_credits = 400 WHERE plan = 'scale';
