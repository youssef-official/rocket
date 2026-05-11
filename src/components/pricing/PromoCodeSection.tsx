import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check, Tag, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  target_plan: string;
  is_public: boolean;
  expires_at: string | null;
}

interface PromoCodeSectionProps {
  onApplyCode?: (code: string, discount: number) => void;
}

export const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({ onApplyCode }) => {
  const [publicPromos, setPublicPromos] = useState<PromoCode[]>([]);
  const [inputCode, setInputCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<{ code: string; discount: number } | null>(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchPublicPromos = async () => {
      const { data } = await supabase
        .from('promo_codes')
        .select('id, code, discount_percent, target_plan, is_public, expires_at')
        .eq('is_public', true);
      if (data) {
        // Filter out expired
        const valid = data.filter(p => !p.expires_at || new Date(p.expires_at) > new Date());
        setPublicPromos(valid);
      }
    };
    fetchPublicPromos();
  }, []);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setVerifying(true);
    setError('');

    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', inputCode.toUpperCase().trim())
      .single();

    if (!data) {
      setError('Invalid promo code');
      setVerifying(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError('This code has expired');
      setVerifying(false);
      return;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      setError('This code has reached its usage limit');
      setVerifying(false);
      return;
    }

    setAppliedCode({ code: data.code, discount: data.discount_percent });
    onApplyCode?.(data.code, data.discount_percent);
    setVerifying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="max-w-2xl mx-auto mb-16"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Promo Code</h3>
            <p className="text-xs text-white/40">Have a discount code? Enter it below</p>
          </div>
        </div>

        {/* Input field */}
        <div className="flex gap-2 mb-4">
          <input
            value={inputCode}
            onChange={e => { setInputCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="Enter code..."
            className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white text-sm font-mono uppercase placeholder:text-white/20 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
            disabled={!!appliedCode}
          />
          {appliedCode ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">{appliedCode.discount}% OFF</span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={!inputCode.trim() || verifying}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {verifying ? 'Verifying...' : 'Apply'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {/* Public promos removed from here - shown on plan cards instead */}
      </div>
    </motion.div>
  );
};
