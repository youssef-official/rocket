-- Create project_versions table for version history
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  chat_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_project_versions_version_number ON public.project_versions(project_id, version_number);

-- Enable RLS
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own project versions"
ON public.project_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project versions"
ON public.project_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project versions"
ON public.project_versions FOR DELETE
USING (auth.uid() = user_id);