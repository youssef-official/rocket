-- Normalize user plans to free/pro/business only and enforce free defaults
ALTER TABLE public.user_plans ALTER COLUMN plan DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'plan_type_new' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.plan_type_new AS ENUM ('free', 'pro', 'business');
  END IF;
END $$;

UPDATE public.user_plans
SET plan = 'free'
WHERE plan::text IN ('spark', 'builder', 'creator', 'scale');

ALTER TABLE public.user_plans
ALTER COLUMN plan TYPE public.plan_type_new
USING (
  CASE
    WHEN plan::text IN ('free', 'pro', 'business') THEN plan::text::public.plan_type_new
    ELSE 'free'::public.plan_type_new
  END
);

DROP TYPE IF EXISTS public.plan_type;
ALTER TYPE public.plan_type_new RENAME TO plan_type;

ALTER TABLE public.user_plans
  ALTER COLUMN plan SET DEFAULT 'free'::public.plan_type,
  ALTER COLUMN daily_credits SET DEFAULT 3,
  ALTER COLUMN max_daily_credits SET DEFAULT 3,
  ALTER COLUMN monthly_credits SET DEFAULT 0,
  ALTER COLUMN credits_used_today SET DEFAULT 0,
  ALTER COLUMN total_credits_used SET DEFAULT 0;

UPDATE public.user_plans
SET
  daily_credits = 3,
  max_daily_credits = 3,
  monthly_credits = 0
WHERE plan = 'free';

ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_plans_subscription_expires_at
ON public.user_plans(subscription_expires_at);

CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_plans (
    user_id,
    plan,
    daily_credits,
    max_daily_credits,
    monthly_credits,
    credits_used_today,
    total_credits_used,
    subscription_expires_at
  )
  VALUES (NEW.id, 'free', 3, 3, 0, 0, 0, NULL);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_reset_user_credits(p_user_id uuid)
 RETURNS TABLE(should_reset boolean, credits_available integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_daily_credits INTEGER;
  v_credits_used_today INTEGER;
  current_time_utc TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- Downgrade to free when paid plan expired and no renewal happened
  UPDATE public.user_plans
  SET
    plan = 'free',
    daily_credits = 3,
    max_daily_credits = 3,
    monthly_credits = 0,
    credits_used_today = 0,
    total_credits_used = 0,
    subscription_expires_at = NULL,
    updated_at = current_time_utc
  WHERE user_id = p_user_id
    AND plan IN ('pro', 'business')
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at <= current_time_utc;

  SELECT
    last_daily_reset,
    daily_credits,
    credits_used_today
  INTO v_last_reset, v_daily_credits, v_credits_used_today
  FROM public.user_plans
  WHERE user_id = p_user_id;

  IF v_last_reset IS NULL OR DATE(v_last_reset AT TIME ZONE 'UTC') < DATE(current_time_utc) THEN
    UPDATE public.user_plans
    SET
      credits_used_today = 0,
      last_daily_reset = current_time_utc,
      updated_at = current_time_utc
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT TRUE, v_daily_credits;
  ELSE
    RETURN QUERY SELECT FALSE, GREATEST(0, v_daily_credits - v_credits_used_today);
  END IF;
END;
$function$;