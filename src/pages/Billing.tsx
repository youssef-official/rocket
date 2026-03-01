import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, Coins, TrendingUp, AlertCircle, Crown, Zap, Rocket, Sparkles, Gauge, Layers } from 'lucide-react';
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

  useEffect(() => {
    if (!user) return;
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch subscription expiry
      const { data: planData } = await supabase
        .from('user_plans')
        .select('subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (planData?.subscription_expires_at) {
        setSubscriptionExpiry(planData.subscription_expires_at);
      }

      // Fetch credit transactions with project names
      const { data: txns } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (txns && txns.length > 0) {
        // Get unique project IDs
        const projectIds = [...new Set(txns.filter(t => t.project_id).map(t => t.project_id!))];

        let projectMap: Record<string, string> = {};
        if (projectIds.length > 0) {
          const { data: projects } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', projectIds);

          if (projects) {
            projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
          }
        }

        setTransactions(txns.map(t => ({
          ...t,
          projectName: t.project_id ? projectMap[t.project_id] || 'Unknown Project' : undefined
        })));
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const plan = userPlan?.plan || 'free';
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const remaining = getRemainingCredits();
  const isFree = plan === 'free';

  const totalCreditsUsed = transactions.reduce((sum, t) => sum + Number(t.credits_used), 0);

  // Group transactions by project
  const projectUsage: Record<string, { name: string; credits: number; count: number }> = {};
  transactions.forEach(t => {
    const key = t.project_id || 'no-project';
    if (!projectUsage[key]) {
      projectUsage[key] = { name: t.projectName || 'General', credits: 0, count: 0 };
    }
    projectUsage[key].credits += Number(t.credits_used);
    projectUsage[key].count += 1;
  });

  const planIcon = plan === 'business' ? <Rocket className="w-6 h-6" /> : plan === 'pro' ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />;
  const planGradient = plan === 'business' ? 'from-fuchsia-500 via-indigo-500 to-cyan-500' : plan === 'pro' ? 'from-violet-500 via-indigo-500 to-sky-500' : 'from-slate-600 via-slate-500 to-slate-700';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.16),transparent_32%)]" />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      />
      <SEOHead title="Billing — Vivora X" description="Manage your subscription and view credit usage." />

      <header className="relative z-10 border-b border-indigo-300/15 bg-slate-950/70 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <VivoraXLogo size="md" />
          </a>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToHome')}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-4xl font-black tracking-tight text-white">Billing Command Center</h1>
          <p className="text-slate-300">Track credits, monitor spending velocity, and manage your plan in one premium cockpit.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-indigo-300/15 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Gauge className="h-3.5 w-3.5 text-cyan-300" />Velocity</div>
            <p className="text-2xl font-bold text-white">{totalCreditsUsed.toFixed(1)}</p>
            <p className="text-xs text-slate-400">credits consumed</p>
          </div>
          <div className="rounded-2xl border border-indigo-300/15 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Layers className="h-3.5 w-3.5 text-fuchsia-300" />Projects</div>
            <p className="text-2xl font-bold text-white">{Object.keys(projectUsage).length}</p>
            <p className="text-xs text-slate-400">active usage buckets</p>
          </div>
          <div className="rounded-2xl border border-indigo-300/15 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Sparkles className="h-3.5 w-3.5 text-emerald-300" />Transactions</div>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
            <p className="text-xs text-slate-400">entries in log</p>
          </div>
        </motion.div>

        {/* Current Subscription Tier Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-3xl border border-indigo-300/15 bg-slate-950/70 shadow-[0_30px_60px_-35px_rgba(56,189,248,.7)] backdrop-blur-xl">
          <div className={`p-7 bg-gradient-to-r ${planGradient} text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  {planIcon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{planConfig.name} Plan</h2>
                  <p className="text-white/80 text-sm">${planConfig.price}/month</p>
                </div>
              </div>
              {!isFree && subscriptionExpiry && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Expires</span>
                  </div>
                  <p className="font-semibold">{new Date(subscriptionExpiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{remaining.daily.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Daily Remaining</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{remaining.monthly.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Monthly Remaining</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{totalCreditsUsed.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Total Burned</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-xs text-slate-400">Ops Logs</p>
            </div>
          </div>

          {/* Renewal / Upgrade CTA */}
          <div className="border-t border-indigo-300/15 p-6">
            {isFree ? (
              <div className="flex items-center gap-4 rounded-2xl border border-indigo-300/15 bg-slate-900/70 p-4">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">You're on the Free plan</p>
                  <p className="text-xs text-slate-300">Upgrade for higher limits, deeper analytics, and priority generation speed.</p>
                </div>
                <a href="/pricing" className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                  View Plans
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Renew or change your plan</p>
                <PayPalButton plan={plan} onSuccess={() => window.location.reload()} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Project Usage Breakdown */}
        {!isFree && Object.keys(projectUsage).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-3xl border border-indigo-300/15 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <TrendingUp className="h-5 w-5 text-cyan-300" />
              Usage by Project
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(projectUsage)
                .sort(([, a], [, b]) => b.credits - a.credits)
                .map(([key, data]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-indigo-300/10 bg-slate-900/70 p-3 hover:border-cyan-300/25 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{data.name}</p>
                      <p className="text-xs text-slate-400">{data.count} generations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-cyan-200">{data.credits.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        {!isFree && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="overflow-hidden rounded-3xl border border-indigo-300/15 bg-slate-950/70 shadow-[0_30px_60px_-35px_rgba(56,189,248,.7)] backdrop-blur-xl">
            <div className="border-b border-indigo-300/15 p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <CreditCard className="h-5 w-5 text-cyan-300" />
                Transaction History
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No transactions yet.
              </div>
            ) : (
              <div className="max-h-[500px] divide-y divide-indigo-300/10 overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-900/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {tx.description || tx.work_type || 'Code Generation'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {tx.projectName && <span>{tx.projectName} · </span>}
                        {new Date(tx.created_at).toLocaleString()}
                        
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-destructive font-semibold text-sm flex-shrink-0 ml-4">
                      <Coins className="w-3.5 h-3.5" />
                      -{Number(tx.credits_used).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Free plan message */}
        {isFree && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-3xl border border-indigo-300/15 bg-slate-950/70 p-8 text-center backdrop-blur-xl">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-cyan-300" />
            <h3 className="mb-2 text-lg font-bold text-white">No billing history</h3>
            <p className="mb-6 text-sm text-slate-300">
              Upgrade to a paid plan to access detailed transaction history, project usage breakdown, and more credits.
            </p>
            <a href="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
              <Crown className="w-4 h-4" />
              View Plans
            </a>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Billing;
