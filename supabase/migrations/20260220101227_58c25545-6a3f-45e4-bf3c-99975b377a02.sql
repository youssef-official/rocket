-- Allow anyone (even anonymous) to view public projects
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view public projects"
ON public.projects
FOR SELECT
USING (is_public = true);