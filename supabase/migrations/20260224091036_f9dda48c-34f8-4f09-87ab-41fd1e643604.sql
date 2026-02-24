
-- Create AI model configuration table
CREATE TABLE public.ai_model_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'vercel',
  model_id TEXT NOT NULL DEFAULT 'google/gemini-3-flash',
  display_name TEXT NOT NULL DEFAULT 'Default Model',
  gateway_url TEXT NOT NULL DEFAULT 'https://ai-gateway.vercel.sh/v1/chat/completions',
  api_key_secret_name TEXT NOT NULL DEFAULT 'VERCEL_AI_API_KEY',
  target_plan TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage model configs
CREATE POLICY "Admins can manage ai_model_config"
ON public.ai_model_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can read active configs (needed by edge function via service role)
CREATE POLICY "Anyone can read active configs"
ON public.ai_model_config
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_ai_model_config_updated_at
BEFORE UPDATE ON public.ai_model_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config
INSERT INTO public.ai_model_config (provider, model_id, display_name, gateway_url, api_key_secret_name, target_plan, is_active)
VALUES ('vercel', 'google/gemini-3-flash', 'Gemini 3 Flash (Default)', 'https://ai-gateway.vercel.sh/v1/chat/completions', 'VERCEL_AI_API_KEY', 'all', true);
