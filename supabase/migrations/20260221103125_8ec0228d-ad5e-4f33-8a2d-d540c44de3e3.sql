-- Add GitHub columns to user_integrations
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS github_token text,
ADD COLUMN IF NOT EXISTS github_username text,
ADD COLUMN IF NOT EXISTS github_connected boolean DEFAULT false;

-- Add github_repo_url to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS github_repo_url text;