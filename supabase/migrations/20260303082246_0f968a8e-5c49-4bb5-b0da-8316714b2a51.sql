
-- Create message_feedback table for like/dislike ratings
CREATE TABLE public.message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  feedback text NOT NULL CHECK (feedback IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.message_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.message_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.message_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.message_feedback
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Drop unused tables
DROP TABLE IF EXISTS public.oauth_pkce_store CASCADE;

-- Drop related function
DROP FUNCTION IF EXISTS public.cleanup_old_pkce_entries() CASCADE;
