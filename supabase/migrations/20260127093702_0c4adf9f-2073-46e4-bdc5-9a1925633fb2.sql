-- Add github_repo_url and vercel_url columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS vercel_url TEXT;

-- Add display_name and avatar_url columns to profiles if not exists
-- (These already exist based on schema but ensuring they're there)

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON public.project_versions(project_id);