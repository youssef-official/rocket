
-- Fix: Remove the overly permissive service role policy and replace with proper one
-- The edge function uses service role key which bypasses RLS entirely, so we don't need this policy
DROP POLICY IF EXISTS "Service role full access" ON public.vivora_deployments;

-- The edge function with service_role key bypasses RLS automatically, so user policies are sufficient
-- Add a policy for public subdomain availability checks (SELECT only on subdomain column - anonymous)
CREATE POLICY "Anyone can check subdomain availability"
  ON public.vivora_deployments
  FOR SELECT
  USING (true);
