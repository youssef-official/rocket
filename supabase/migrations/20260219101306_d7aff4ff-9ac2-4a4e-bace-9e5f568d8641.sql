-- Add supabase_url and supabase_anon_key columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS supabase_url text,
ADD COLUMN IF NOT EXISTS supabase_anon_key text;