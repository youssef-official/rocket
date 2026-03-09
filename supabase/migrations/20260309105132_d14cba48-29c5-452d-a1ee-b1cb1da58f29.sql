
-- Site messages table for admin popup messages
CREATE TABLE public.site_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'info',
  link_url text,
  icon text DEFAULT '📢',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site_messages" ON public.site_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active site_messages" ON public.site_messages FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- User dismissed messages tracking
CREATE TABLE public.user_dismissed_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.site_messages(id) ON DELETE CASCADE,
  dismissed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE public.user_dismissed_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can dismiss messages" ON public.user_dismissed_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own dismissals" ON public.user_dismissed_messages FOR SELECT USING (auth.uid() = user_id);
