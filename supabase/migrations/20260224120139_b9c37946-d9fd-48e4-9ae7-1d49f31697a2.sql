
-- Table to map sandbox IDs to their Modal preview URLs
CREATE TABLE public.sandbox_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sandbox_id TEXT NOT NULL UNIQUE,
  preview_url TEXT NOT NULL,
  api_url TEXT NOT NULL,
  project_id TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '2 hours')
);

-- Enable RLS
ALTER TABLE public.sandbox_mappings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (the Cloudflare Worker needs to look up mappings)
CREATE POLICY "Anyone can read sandbox mappings"
ON public.sandbox_mappings
FOR SELECT
USING (true);

-- Allow the edge function (service role) to insert/update/delete
CREATE POLICY "Service role can manage sandbox mappings"
ON public.sandbox_mappings
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups by sandbox_id
CREATE INDEX idx_sandbox_mappings_sandbox_id ON public.sandbox_mappings (sandbox_id);

-- Auto-cleanup old entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_sandboxes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.sandbox_mappings WHERE expires_at < now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_expired_sandboxes
AFTER INSERT ON public.sandbox_mappings
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_sandboxes();
