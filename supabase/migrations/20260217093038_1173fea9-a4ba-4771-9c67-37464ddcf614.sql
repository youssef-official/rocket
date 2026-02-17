
CREATE TABLE public.oauth_pkce_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed - accessed only by edge function via service role
ALTER TABLE public.oauth_pkce_store ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup entries older than 10 minutes
CREATE OR REPLACE FUNCTION public.cleanup_old_pkce_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.oauth_pkce_store WHERE created_at < now() - interval '10 minutes';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_pkce
BEFORE INSERT ON public.oauth_pkce_store
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_pkce_entries();
