
-- Create inbox_notifications table for admin to send notifications to users
CREATE TABLE public.inbox_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  link_url TEXT,
  target_plan TEXT DEFAULT 'all', -- 'all', 'spark', 'builder', 'creator', 'scale'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.inbox_notifications ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read notifications
CREATE POLICY "Users can view notifications" ON public.inbox_notifications
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "Admins can create notifications" ON public.inbox_notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete notifications" ON public.inbox_notifications
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Track which notifications a user has read
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.inbox_notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads" ON public.user_notification_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark as read" ON public.user_notification_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create templates table for admin-managed project templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active templates (even non-authenticated)
CREATE POLICY "Anyone can view active templates" ON public.templates
  FOR SELECT USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can create templates" ON public.templates
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates" ON public.templates
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates" ON public.templates
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can also view inactive templates
CREATE POLICY "Admins can view all templates" ON public.templates
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
