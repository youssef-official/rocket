
-- Promo Codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 10 CHECK (discount_percent > 0 AND discount_percent <= 100),
  target_plan text NOT NULL DEFAULT 'all',
  is_public boolean NOT NULL DEFAULT false,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT NULL
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public promos" ON public.promo_codes FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage promos" ON public.promo_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Site Celebrations table (for Ramadan, Eid, etc.)
CREATE TABLE IF NOT EXISTS public.site_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

ALTER TABLE public.site_celebrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view celebrations" ON public.site_celebrations FOR SELECT USING (true);
CREATE POLICY "Admins can manage celebrations" ON public.site_celebrations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed celebration modes
INSERT INTO public.site_celebrations (name, is_active, config) VALUES
  ('ramadan', false, '{"emoji": "🌙", "label": "Ramadan Mode"}'::jsonb),
  ('eid', false, '{"emoji": "🎉", "label": "Eid Mode"}'::jsonb)
ON CONFLICT (name) DO NOTHING;
