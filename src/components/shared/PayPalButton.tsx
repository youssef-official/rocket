import React, { useState } from 'react';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PlanType } from '@/lib/plans';
import { PLAN_CONFIG } from '@/lib/plans';
import { toast } from '@/hooks/use-toast';

interface PayPalButtonProps {
  plan: PlanType;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ plan, onSuccess, disabled, className }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'approving' | 'capturing' | 'success' | 'error'>('idle');

  const config = PLAN_CONFIG[plan];

  const handlePayment = async () => {
    if (!user || disabled || plan === 'free') return;

    setLoading(true);
    setStatus('creating');

    try {
      // Step 1: Create order
      const { data: createData, error: createError } = await supabase.functions.invoke('paypal-create-order', {
        body: { plan, price: config.price },
      });

      if (createError || createData?.error) throw new Error(createData?.error || createError?.message || 'Failed to create order');

      const orderId = createData.id;
      const approveUrl = createData.approveUrl;

      if (!approveUrl) throw new Error('No PayPal approval URL returned');

      // Step 2: Open PayPal approval in popup
      setStatus('approving');
      const approved = await openPayPalPopup(approveUrl);

      if (!approved) {
        setStatus('idle');
        setLoading(false);
        return; // User closed popup without approving
      }

      // Step 3: Capture order after approval
      setStatus('capturing');
      const { data: captureData, error: captureError } = await supabase.functions.invoke('paypal-capture-order', {
        body: { orderId, plan, userId: user.id },
      });

      if (captureError || captureData?.error) throw new Error(captureData?.error || captureError?.message || 'Capture failed');

      if (captureData.status === 'COMPLETED') {
        setStatus('success');
        toast({
          title: '🎉 Payment Successful!',
          description: `You've been upgraded to ${config.name} plan.`,
        });
        onSuccess?.();
      } else {
        throw new Error(`Payment status: ${captureData.status}`);
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      setStatus('error');
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (plan === 'free') return null;

  return (
    <button
      onClick={handlePayment}
      disabled={loading || disabled || !user}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
        status === 'success'
          ? 'bg-green-500 text-white'
          : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-[#0070ba] hover:bg-[#005ea6] text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {status === 'creating' ? 'Creating order...' : status === 'approving' ? 'Waiting for approval...' : 'Capturing...'}
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Upgraded!
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-4 h-4" />
          Try Again
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Pay ${config.price}/mo with PayPal
        </>
      )}
    </button>
  );
};

// Open PayPal in popup and wait for approval
function openPayPalPopup(approveUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      approveUrl,
      'paypal_approval',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      // Popup blocked, fallback to redirect
      window.location.href = approveUrl;
      resolve(false);
      return;
    }

    // Poll for popup close
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        // Assume approved if popup closed (PayPal redirects back then closes)
        resolve(true);
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (!popup.closed) popup.close();
      resolve(false);
    }, 300000);
  });
}
