import React, { useState } from 'react';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { createPayPalOrder, capturePayPalOrder } from '@/services/paypalService';
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
  const [status, setStatus] = useState<'idle' | 'creating' | 'redirecting' | 'success' | 'error'>('idle');

  const config = PLAN_CONFIG[plan];

  const handlePayment = async () => {
    if (!user || disabled || plan === 'spark') return;

    setLoading(true);
    setStatus('creating');

    try {
      const orderId = await createPayPalOrder(plan);
      setStatus('redirecting');

      // For sandbox, we'll capture directly (in production, redirect to PayPal)
      const captureStatus = await capturePayPalOrder(orderId, plan, user.id);

      if (captureStatus === 'COMPLETED') {
        setStatus('success');
        toast({
          title: '🎉 Payment Successful!',
          description: `You've been upgraded to ${config.name} plan.`,
        });
        onSuccess?.();
      } else {
        throw new Error(`Payment status: ${captureStatus}`);
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

  if (plan === 'spark') return null;

  return (
    <button
      onClick={handlePayment}
      disabled={loading || disabled}
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
          {status === 'creating' ? 'Creating order...' : 'Processing...'}
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
