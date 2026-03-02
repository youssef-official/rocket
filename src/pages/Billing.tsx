import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, Coins, TrendingUp, AlertCircle, Crown, Zap, Rocket, Sparkles, Gauge, Layers, BarChart2, Clock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/shared/SEOHead';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { PayPalButton } from '@/components/shared/PayPalButton';
import { useNavigate } from 'react-router-dom';

interface CreditTransaction {
  id: string;
  credits_used: number;
  model_used: string | null;
  work_type: string | null;
  description: string | null;
  project_id: string | null;
  created_at: string;
  projectName?: string;
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { userPlan, getRemainingCredits } = useUserPlan();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'projects'>('overview');

  useEffect(() => {
    if (!user) return;
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: planData } = await supabase
        .from('user_plans')
        .select('subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (planData?.subscription_expires_at) {
        setSubscriptionExpiry(planData.subscription_expires_at);
      }

      const { data: txns } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (txns && txns.length > 0) {
        const projectIds = [...new Set(txns.filter(t => t.project_id).map(t => t.project_id!))];
        let projectMap: Record<string, string> = {};
        if (projectIds.length > 0) {
          const { data: projects } = await supabase.from('projects').select('id, name').in('id', projectIds);
          if (projects) { projectMap = Object.fromEntries(projects.map(p => [p.id, p.name])); }
        }
        setTransactions(txns.map(t => ({ ...t, projectName: t.project_id ? projectMap[t.project_id] || 'Unknown Project' : undefined })));
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally { setLoading(false); }
  };

  if (!user) { navigate('/login'); return null; }

  const plan = userPlan?.plan || 'free';
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const remaining = getRemainingCredits();
  const isFree = plan === 'free';
  const totalCreditsUsed = transactions.reduce((sum, t) => sum + Number(t.credits_used), 0);

  const projectUsage: Record<string, { name: string; credits: number; count: number }> = {};
  transactions.forEach(t => {
    const key = t.project_id || 'no-project';
    if (!projectUsage[key]) { projectUsage[key] = { name: t.projectName || 'General', credits: 0, count: 0 }; }
    projectUsage[key].credits += Number(t.credits_used);
    projectUsage[key].count += 1;
  });

  const planColors = {
    free: { gradient: 'from-slate-500 to-slate-600', badge: 'bg-slate-500/15 text-slate-300', glow: 'shadow-slate-500/20' },
    pro: { gradient: 'from-violet-500 to-indigo-600', badge: 'bg-violet-500/15 text-violet-300', glow: 'shadow-violet-500/30' },
    business: { gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-500/15 text-amber-300', glow: 'shadow-amber-500/30' },
  }[plan] || { gradient: 'from-slate-500 to-slate-600', badge: 'bg-slate-500/15 text-slate-300', glow: 'shadow-slate-500/20' };

  const cardCls = "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl";

  // Today stats
  const todayTx = transactions.filter(t => {
    const d = new Date(t.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayCredits = todayTx.reduce((s, t) => s + Number(t.credits_used), 0);

  return (
    <div className="relative min-h-screen bg-[#08080c]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
      </div>

      <SEOHead title="Billing — Vivora X" description="Manage your subscription and view credit usage." />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#08080c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2"><VivoraXLogo size="md" /></a>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />{t('nav.backToHome')}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* Title + Plan Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Billing</h1>
            <p className="text-white/40 text-sm mt-1">Track usage, manage your plan, and view transaction history.</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${planColors.badge}`}>
            {plan === 'business' ? <Rocket className="w-4 h-4" /> : plan === 'pro' ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            <span className="text-sm font-semibold capitalize">{plan} Plan</span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Daily Remaining', value: remaining.daily.toFixed(1), icon: Gauge, color: 'text-cyan-400', sub: `of ${planConfig.dailyCredits}` },
            { label: 'Monthly Remaining', value: remaining.monthly.toFixed(1), icon: Layers, color: 'text-violet-400', sub: `of ${planConfig.monthlyCredits}` },
            { label: 'Today Used', value: todayCredits.toFixed(1), icon: Clock, color: 'text-amber-400', sub: `${todayTx.length} generations` },
            { label: 'Total Consumed', value: totalCreditsUsed.toFixed(1), icon: TrendingUp, color: 'text-emerald-400', sub: `${transactions.length} transactions` },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`${cardCls} p-5 group hover:border-white/[0.12] transition-colors`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-white/25 mt-0.5">{stat.sub}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Plan Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`${cardCls} overflow-hidden shadow-2xl ${planColors.glow}`}>
          <div className={`p-6 bg-gradient-to-r ${planColors.gradient}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  {plan === 'business' ? <Rocket className="w-7 h-7 text-white" /> : plan === 'pro' ? <Crown className="w-7 h-7 text-white" /> : <Zap className="w-7 h-7 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{planConfig.name} Plan</h2>
                  <p className="text-white/70 text-sm">${planConfig.price}/month</p>
                </div>
              </div>
              {!isFree && subscriptionExpiry && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-white/70 text-xs"><Calendar className="w-3.5 h-3.5" />Expires</div>
                  <p className="font-semibold text-white">{new Date(subscriptionExpiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Credit bars */}
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/40">Daily Credits</span>
                <span className="text-xs font-mono text-white/60">{remaining.daily.toFixed(1)} / {planConfig.dailyCredits}</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${planColors.gradient}`}
                  initial={{ width: 0 }} animate={{ width: `${Math.min((remaining.daily / planConfig.dailyCredits) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }} />
              </div>
            </div>
            {planConfig.monthlyCredits > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/40">Monthly Credits</span>
                  <span className="text-xs font-mono text-white/60">{remaining.monthly.toFixed(1)} / {planConfig.monthlyCredits}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full bg-gradient-to-r ${planColors.gradient}`}
                    initial={{ width: 0 }} animate={{ width: `${Math.min((remaining.monthly / planConfig.monthlyCredits) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} />
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-white/[0.06] p-6">
            {isFree ? (
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <AlertCircle className="w-5 h-5 text-white/30 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Upgrade for more power</p>
                  <p className="text-xs text-white/40">Unlock higher limits, code editing, and priority generation.</p>
                </div>
                <a href="/pricing" className={`rounded-xl bg-gradient-to-r ${planColors.gradient} px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-1`}>
                  View Plans <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/30">Renew or change your plan</p>
                <PayPalButton plan={plan} onSuccess={() => window.location.reload()} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        {!isFree && (
          <>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
              {(['overview', 'transactions', 'projects'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/60'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview: Project Usage */}
            {activeTab === 'overview' && Object.keys(projectUsage).length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${cardCls} p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <BarChart2 className="h-4 w-4 text-cyan-400" /> Usage by Project
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(projectUsage).sort(([, a], [, b]) => b.credits - a.credits).map(([key, data]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:border-white/[0.1] transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{data.name}</p>
                        <p className="text-[11px] text-white/25">{data.count} generations</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
                        <Coins className="w-3.5 h-3.5" />{data.credits.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Transactions */}
            {activeTab === 'transactions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${cardCls} overflow-hidden`}>
                <div className="border-b border-white/[0.06] p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <CreditCard className="h-4 w-4 text-violet-400" /> Transaction History
                  </h3>
                </div>
                {loading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mx-auto" /></div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-white/20 text-sm">No transactions yet.</div>
                ) : (
                  <div className="max-h-[500px] divide-y divide-white/[0.04] overflow-y-auto">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white/80">{tx.description || tx.work_type || 'Code Generation'}</p>
                          <p className="text-[11px] text-white/20">
                            {tx.projectName && <span>{tx.projectName} · </span>}
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-400 font-semibold text-sm flex-shrink-0 ml-4">
                          <Coins className="w-3 h-3" />-{Number(tx.credits_used).toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Projects breakdown */}
            {activeTab === 'projects' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${cardCls} p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Project Breakdown
                </h3>
                {Object.keys(projectUsage).length === 0 ? (
                  <p className="text-sm text-white/20 text-center py-8">No project usage data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(projectUsage).sort(([, a], [, b]) => b.credits - a.credits).map(([key, data]) => {
                      const pct = totalCreditsUsed > 0 ? (data.credits / totalCreditsUsed) * 100 : 0;
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">{data.name}</span>
                            <span className="text-xs font-mono text-white/40">{data.credits.toFixed(1)} credits ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* Free plan */}
        {isFree && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`${cardCls} p-10 text-center`}>
            <CreditCard className="mx-auto mb-4 h-10 w-10 text-white/15" />
            <h3 className="mb-2 text-lg font-bold text-white">No billing history</h3>
            <p className="mb-6 text-sm text-white/30">Upgrade to a paid plan to access transaction history and detailed analytics.</p>
            <a href="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
              <Crown className="w-4 h-4" /> View Plans
            </a>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Billing;
