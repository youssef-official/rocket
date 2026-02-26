import React, { useState } from 'react';
import { Loader2, CreditCard, CheckCircle, AlertCircle, Tag, X } from 'lucide-react';
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);

  const config = PLAN_CONFIG[plan];

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoError('');
    setPromoDiscount(null);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .single();

      if (error || !data) {
        setPromoError('Invalid promo code');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError('This code has expired');
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromoError('This code has reached its usage limit');
        return;
      }

      if (data.target_plan !== 'all' && data.target_plan !== plan) {
        setPromoError(`This code is only valid for the ${data.target_plan} plan`);
        return;
      }

      setPromoDiscount(data.discount_percent);
      toast({ title: `🎉 ${data.discount_percent}% discount applied!` });
    } catch {
      setPromoError('Failed to validate code');
    } finally {
      setCheckingPromo(false);
    }
  };

  const finalPrice = promoDiscount
    ? (config.price * (1 - promoDiscount / 100)).toFixed(2)
    : config.price.toFixed(2);

  const handleConfirmAndPay = async () => {
    if (!user || disabled || plan === 'free') return;

    setShowConfirm(false);
    setLoading(true);
    setStatus('creating');

    try {
      // Increment promo usage if used
      if (promoCode.trim() && promoDiscount) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: (await supabase.from('promo_codes').select('current_uses').eq('code', promoCode.toUpperCase().trim()).single()).data?.current_uses + 1 || 1 })
          .eq('code', promoCode.toUpperCase().trim());
      }

      const { data: createData, error: createError } = await supabase.functions.invoke('paypal-create-order', {
        body: { plan, price: parseFloat(finalPrice) },
      });

      if (createError || createData?.error) throw new Error(createData?.error || createError?.message || 'Failed to create order');

      const orderId = createData.id;
      const approveUrl = createData.approveUrl;

      if (!approveUrl) throw new Error('No PayPal approval URL returned');

      setStatus('approving');
      const approved = await openPayPalPopup(approveUrl);

      if (!approved) {
        setStatus('idle');
        setLoading(false);
        return;
      }

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
    <>
      <button
        onClick={() => setShowConfirm(true)}
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

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div
            className="bg-[#12121a] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Confirm Payment</h3>
              <button onClick={() => setShowConfirm(false)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Plan</span>
                <span className="text-sm font-bold text-white">{config.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Price</span>
                <span className={`text-sm font-bold ${promoDiscount ? 'text-white/30 line-through' : 'text-white'}`}>${config.price}/mo</span>
              </div>
              {promoDiscount && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-400">Discount</span>
                    <span className="text-sm font-bold text-green-400">-{promoDiscount}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-sm font-bold text-white">Total</span>
                    <span className="text-lg font-bold text-green-400">${finalPrice}/mo</span>
                  </div>
                </>
              )}
            </div>

            {/* Promo Code Input */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Promo Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoDiscount(null); }}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono uppercase outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 placeholder:text-white/15 transition-all"
                    placeholder="ENTER CODE"
                  />
                </div>
                <button
                  onClick={validatePromo}
                  disabled={!promoCode.trim() || checkingPromo}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-400 mt-1.5">{promoError}</p>}
              {promoDiscount && <p className="text-xs text-green-400 mt-1.5">✓ {promoDiscount}% discount applied!</p>}
            </div>

            <button
              onClick={handleConfirmAndPay}
              className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Confirm & Pay ${finalPrice}/mo
            </button>

            <p className="text-[10px] text-white/20 text-center mt-3">You'll be redirected to PayPal to complete payment</p>
          </div>
        </div>
      )}
    </>
  );
};

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
      window.location.href = approveUrl;
      resolve(false);
      return;
    }

    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        resolve(true);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      if (!popup.closed) popup.close();
      resolve(false);
    }, 300000);
  });
}