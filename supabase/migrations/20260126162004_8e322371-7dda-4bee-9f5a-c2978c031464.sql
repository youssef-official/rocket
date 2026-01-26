-- Create user_integrations table to store GitHub and Vercel tokens
CREATE TABLE public.user_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  github_token TEXT,
  github_username TEXT,
  github_connected BOOLEAN DEFAULT false,
  vercel_token TEXT,
  vercel_username TEXT,
  vercel_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own integrations" 
ON public.user_integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" 
ON public.user_integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" 
ON public.user_integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_integrations_updated_at
BEFORE UPDATE ON public.user_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();