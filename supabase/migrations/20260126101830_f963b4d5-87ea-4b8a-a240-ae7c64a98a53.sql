-- Add columns to store generation state in projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS generated_name TEXT,
ADD COLUMN IF NOT EXISTS building_plan TEXT[],
ADD COLUMN IF NOT EXISTS generation_status TEXT;