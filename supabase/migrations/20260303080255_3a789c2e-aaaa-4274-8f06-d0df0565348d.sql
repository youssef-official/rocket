
-- Create onboarding_responses table for GetStarted form data
CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT,
  role TEXT,
  company_size TEXT,
  preferred_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own responses
CREATE POLICY "Users can insert their own onboarding"
  ON public.onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses  
CREATE POLICY "Users can view their own onboarding"
  ON public.onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all responses
CREATE POLICY "Admins can view all onboarding"
  ON public.onboarding_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
