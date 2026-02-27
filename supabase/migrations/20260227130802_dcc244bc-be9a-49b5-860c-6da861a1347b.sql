CREATE TABLE IF NOT EXISTS public.supabase_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.supabase_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sb connection"
  ON public.supabase_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sb connection"
  ON public.supabase_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sb connection"
  ON public.supabase_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sb connection"
  ON public.supabase_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages sb connections"
  ON public.supabase_connections FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_supabase_connections_updated_at
  BEFORE UPDATE ON public.supabase_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();