-- Add actions_taken column to project_versions table
ALTER TABLE public.project_versions 
ADD COLUMN IF NOT EXISTS actions_taken jsonb DEFAULT '[]'::jsonb;