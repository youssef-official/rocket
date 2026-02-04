-- =====================================================
-- Cleanup: Drop unused columns from user_integrations (GitHub fields)
-- and drop github_repo_url from projects
-- =====================================================

-- 1. Drop unused GitHub columns from user_integrations (Vercel columns stay)
ALTER TABLE public.user_integrations
  DROP COLUMN IF EXISTS github_token,
  DROP COLUMN IF EXISTS github_username,
  DROP COLUMN IF EXISTS github_connected;

-- 2. Drop unused github_repo_url from projects
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS github_repo_url;
