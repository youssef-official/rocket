import { supabase } from '@/integrations/supabase/client';
import type { PlanType } from '@/lib/plans';
import { PLAN_CONFIG } from '@/lib/plans';

export async function createPayPalOrder(plan: PlanType): Promise<string> {
  const config = PLAN_CONFIG[plan];
  
  const { data, error } = await supabase.functions.invoke('paypal-create-order', {
    body: { plan, price: config.price },
  });

  if (error) throw new Error(error.message || 'Failed to create PayPal order');
  if (data?.error) throw new Error(data.error);
  
  return data.id;
}

export async function capturePayPalOrder(orderId: string, plan: PlanType, userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('paypal-capture-order', {
    body: { orderId, plan, userId },
  });

  if (error) throw new Error(error.message || 'Failed to capture PayPal order');
  if (data?.error) throw new Error(data.error);
  
  return data.status;
}
