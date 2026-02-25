
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_plans (user_id, plan, daily_credits, max_daily_credits)
  VALUES (NEW.id, 'free', 3, 3);
  RETURN NEW;
END;
$function$;
