-- Delete a project and all its related rows (messages, versions, transactions)
-- Uses SECURITY DEFINER but enforces ownership check via auth.uid().

CREATE OR REPLACE FUNCTION public.delete_project_cascade(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'project_id_required';
  END IF;

  -- Ensure the caller owns the project
  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = p_project_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  -- Delete related rows first
  DELETE FROM public.chat_messages WHERE project_id = p_project_id;
  DELETE FROM public.project_versions WHERE project_id = p_project_id;
  DELETE FROM public.credit_transactions WHERE project_id = p_project_id;

  -- Finally delete the project
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_project_cascade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_project_cascade(uuid) TO authenticated;
