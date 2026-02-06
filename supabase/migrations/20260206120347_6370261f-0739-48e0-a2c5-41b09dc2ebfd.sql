-- Create a function to reset daily credits for all users
-- This function should be called by a cron job or scheduled task

CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_time_utc TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- Reset credits_used_today to 0 for all users where:
  -- 1. last_daily_reset is NULL (never reset), OR
  -- 2. last_daily_reset is from a previous day (comparing dates in UTC)
  UPDATE user_plans
  SET 
    credits_used_today = 0,
    last_daily_reset = current_time_utc,
    updated_at = current_time_utc
  WHERE 
    last_daily_reset IS NULL 
    OR DATE(last_daily_reset AT TIME ZONE 'UTC') < DATE(current_time_utc);
    
  RAISE NOTICE 'Daily credits reset completed at %', current_time_utc;
END;
$$;

-- Also create a function that can be called when a user makes a request
-- to check and reset their credits if needed (for real-time reset)
CREATE OR REPLACE FUNCTION public.check_and_reset_user_credits(p_user_id UUID)
RETURNS TABLE(
  should_reset BOOLEAN,
  credits_available INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_daily_credits INTEGER;
  v_credits_used_today INTEGER;
  current_time_utc TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- Get current user plan info
  SELECT 
    last_daily_reset,
    daily_credits,
    credits_used_today
  INTO v_last_reset, v_daily_credits, v_credits_used_today
  FROM user_plans
  WHERE user_id = p_user_id;
  
  -- Check if we need to reset (different day in UTC)
  IF v_last_reset IS NULL OR DATE(v_last_reset AT TIME ZONE 'UTC') < DATE(current_time_utc) THEN
    -- Reset the credits
    UPDATE user_plans
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reset_daily_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_reset_user_credits(UUID) TO authenticated;