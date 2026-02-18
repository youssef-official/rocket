
-- Create vivora_deployments table for tracking Vivora hosting deployments
CREATE TABLE IF NOT EXISTS public.vivora_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  cloudflare_deployment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vivora_deployments ENABLE ROW LEVEL SECURITY;

-- Users can view their own deployments
CREATE POLICY "Users can view their own deployments"
  ON public.vivora_deployments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own deployments
CREATE POLICY "Users can insert their own deployments"
  ON public.vivora_deployments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON public.vivora_deployments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_vivora_deployments_subdomain ON public.vivora_deployments(subdomain);
CREATE INDEX IF NOT EXISTS idx_vivora_deployments_user_id ON public.vivora_deployments(user_id);

-- Auto-update updated_at
CREATE TRIGGER update_vivora_deployments_updated_at
  BEFORE UPDATE ON public.vivora_deployments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
