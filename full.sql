-- ============================================================================
-- Vivora X — Full Database Schema (Updated 2026-02-25)
-- Run this on a fresh Supabase/PostgreSQL database to create everything.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_type AS ENUM ('free', 'pro', 'business');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Project',
  description text,
  project_type text NOT NULL DEFAULT 'vite',
  files jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  published_slug text,
  generated_name text,
  building_plan text[],
  generation_status text,
  github_repo_url text,
  vercel_url text,
  supabase_url text,
  supabase_anon_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL,
  version_number integer NOT NULL,
  files jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  credits_used numeric DEFAULT 0,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  image_url text,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  credits_used numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  plan public.plan_type NOT NULL DEFAULT 'free',
  daily_credits numeric NOT NULL DEFAULT 3,
  max_daily_credits numeric NOT NULL DEFAULT 3,
  monthly_credits numeric NOT NULL DEFAULT 0,
  credits_used_today numeric NOT NULL DEFAULT 0,
  total_credits_used numeric NOT NULL DEFAULT 0,
  last_daily_reset timestamptz DEFAULT now(),
  subscription_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id),
  message_id uuid,
  credits_used numeric NOT NULL,
  model_used text,
  work_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  github_connected boolean DEFAULT false,
  github_token text,
  github_username text,
  vercel_connected boolean DEFAULT false,
  vercel_token text,
  vercel_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mode text NOT NULL DEFAULT 'code',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_message text,
  result_files jsonb,
  result_actions jsonb,
  credits_used numeric,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sandbox_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  project_id text,
  sandbox_id text NOT NULL,
  preview_url text NOT NULL,
  api_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '2 hours')
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category text NOT NULL DEFAULT 'general',
  author_name text NOT NULL DEFAULT 'Vivora Team',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inbox_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text,
  image_url text,
  link_url text,
  target_plan text DEFAULT 'all',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.inbox_notifications(id),
  read_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  prompt text NOT NULL,
  image_url text,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_model_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL DEFAULT 'vercel',
  model_id text NOT NULL DEFAULT 'google/gemini-3-flash',
  display_name text NOT NULL DEFAULT 'Default Model',
  gateway_url text NOT NULL DEFAULT 'https://ai-gateway.vercel.sh/v1/chat/completions',
  api_key_secret_name text NOT NULL DEFAULT 'VERCEL_AI_API_KEY',
  target_plan text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oauth_pkce_store (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  code_verifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vivora_deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subdomain text NOT NULL,
  url text NOT NULL,
  cloudflare_deployment_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.user_plans (
    user_id, plan, daily_credits, max_daily_credits,
    monthly_credits, credits_used_today, total_credits_used,
    subscription_expires_at
  )
  VALUES (NEW.id, 'free', 3, 3, 0, 0, 0, NULL);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  current_time_utc TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'UTC';
BEGIN
  UPDATE user_plans
  SET credits_used_today = 0, last_daily_reset = current_time_utc, updated_at = current_time_utc
  WHERE last_daily_reset IS NULL OR DATE(last_daily_reset AT TIME ZONE 'UTC') < DATE(current_time_utc);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_reset_user_credits(p_user_id uuid)
RETURNS TABLE(should_reset boolean, credits_available integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_daily_credits INTEGER;
  v_credits_used_today INTEGER;
  current_time_utc TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- Auto-downgrade expired paid plans to free
  UPDATE public.user_plans
  SET plan = 'free', daily_credits = 3, max_daily_credits = 3,
      monthly_credits = 0, credits_used_today = 0, total_credits_used = 0,
      subscription_expires_at = NULL, updated_at = current_time_utc
  WHERE user_id = p_user_id
    AND plan IN ('pro', 'business')
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at <= current_time_utc;

  SELECT last_daily_reset, daily_credits, credits_used_today
  INTO v_last_reset, v_daily_credits, v_credits_used_today
  FROM user_plans WHERE user_id = p_user_id;

  IF v_last_reset IS NULL OR DATE(v_last_reset AT TIME ZONE 'UTC') < DATE(current_time_utc) THEN
    UPDATE user_plans
    SET credits_used_today = 0, last_daily_reset = current_time_utc, updated_at = current_time_utc
    WHERE user_id = p_user_id;
    RETURN QUERY SELECT TRUE, v_daily_credits;
  ELSE
    RETURN QUERY SELECT FALSE, GREATEST(0, v_daily_credits - v_credits_used_today);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_project_cascade(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF p_project_id IS NULL THEN RAISE EXCEPTION 'project_id_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  DELETE FROM public.chat_messages WHERE project_id = p_project_id;
  DELETE FROM public.project_versions WHERE project_id = p_project_id;
  DELETE FROM public.credit_transactions WHERE project_id = p_project_id;
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_pkce_entries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  DELETE FROM public.oauth_pkce_store WHERE created_at < now() - interval '10 minutes';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sandboxes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  DELETE FROM public.sandbox_mappings WHERE expires_at < now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS (create on auth.users for new user provisioning)
-- Note: Run these manually if auth schema triggers are blocked.
-- ─────────────────────────────────────────────────────────────────────────────

-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- CREATE TRIGGER on_auth_user_plan AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects"  ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public projects"    ON public.projects FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own project versions" ON public.project_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own project versions" ON public.project_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own project versions" ON public.project_versions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own plan"  ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plan" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan" ON public.user_plans FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own integrations"  ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own integrations" ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles"      ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles"        ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"        ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own jobs"   ON public.generation_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON public.generation_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.generation_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all jobs" ON public.generation_jobs FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.sandbox_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sandbox mappings" ON public.sandbox_mappings FOR SELECT USING (true);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blog posts"         ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blog categories"    ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories"  ON public.blog_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.inbox_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view notifications"     ON public.inbox_notifications FOR SELECT USING (true);
CREATE POLICY "Admins can create notifications"  ON public.inbox_notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete notifications"  ON public.inbox_notifications FOR DELETE USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reads" ON public.user_notification_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark as read"   ON public.user_notification_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active templates" ON public.templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all templates"    ON public.templates FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create templates"      ON public.templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update templates"      ON public.templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete templates"      ON public.templates FOR DELETE USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active configs"    ON public.ai_model_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ai_model_config" ON public.ai_model_config FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.vivora_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check subdomain availability" ON public.vivora_deployments FOR SELECT USING (true);
CREATE POLICY "Users can view their own deployments"    ON public.vivora_deployments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deployments"  ON public.vivora_deployments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON public.user_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON public.generation_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_model_config_updated_at BEFORE UPDATE ON public.ai_model_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vivora_deployments_updated_at BEFORE UPDATE ON public.vivora_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
