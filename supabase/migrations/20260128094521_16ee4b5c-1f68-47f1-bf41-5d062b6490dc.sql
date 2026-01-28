-- Create plan types enum
CREATE TYPE public.plan_type AS ENUM ('spark', 'builder', 'creator', 'scale');

-- Create user_plans table
CREATE TABLE public.user_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan plan_type NOT NULL DEFAULT 'spark',
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  daily_credits INTEGER NOT NULL DEFAULT 5,
  max_daily_credits INTEGER NOT NULL DEFAULT 25,
  credits_used_today INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  message_id UUID,
  credits_used NUMERIC(10,2) NOT NULL,
  model_used TEXT,
  work_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_plans
CREATE POLICY "Users can view their own plan" 
ON public.user_plans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan" 
ON public.user_plans FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan" 
ON public.user_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.credit_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.credit_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add is_public column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Function to create user plan on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan, daily_credits, max_daily_credits)
  VALUES (NEW.id, 'spark', 5, 25);
  RETURN NEW;
END;
$$;

-- Trigger to create user plan on signup
CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_plans
  SET credits_used_today = 0, 
      last_daily_reset = now()
  WHERE DATE(last_daily_reset) < CURRENT_DATE;
END;
$$;

-- Create updated_at trigger for user_plans
CREATE TRIGGER update_user_plans_updated_at
BEFORE UPDATE ON public.user_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();