
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'pageview',
  path text,
  device text,
  referrer text,
  country text,
  screen_w integer,
  screen_h integer,
  duration integer,
  pages_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_project ON public.analytics_events(project_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view project analytics"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = analytics_events.project_id
        AND projects.user_id = auth.uid()
    )
  );
