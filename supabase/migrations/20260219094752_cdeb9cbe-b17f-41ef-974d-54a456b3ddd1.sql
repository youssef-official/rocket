
-- Create generation_jobs table for background processing
CREATE TABLE public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending | processing | done | error
  mode text NOT NULL DEFAULT 'code',        -- code | chat | explanation
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_files jsonb,
  result_message text,
  result_actions jsonb,
  credits_used numeric,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own jobs
CREATE POLICY "Users can insert their own jobs"
  ON public.generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own jobs (for cancel)
CREATE POLICY "Users can update their own jobs"
  ON public.generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can update any job (for edge function processing)
CREATE POLICY "Service role can manage all jobs"
  ON public.generation_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;

-- Auto-update updated_at
CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
