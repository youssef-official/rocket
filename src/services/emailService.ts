import { supabase } from '@/integrations/supabase/client';

type EmailType = 'welcome' | 'plan_upgrade' | 'renewal_reminder';

interface SendEmailParams {
  type: EmailType;
  email: string;
  name?: string;
  plan?: string;
  daysLeft?: number;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: params,
    });
    if (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Email service error:', e);
    return false;
  }
}
