
-- Drop the overly permissive ALL policy (service role bypasses RLS anyway)
DROP POLICY "Service role can manage sandbox mappings" ON public.sandbox_mappings;
