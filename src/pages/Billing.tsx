import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, Coins, TrendingUp, AlertCircle, Crown, Zap, Rocket } from 'lucide-react';
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
  const planGradient = plan === 'business' ? 'from-orange-500 to-amber-500' : plan === 'pro' ? 'from-purple-500 to-pink-500' : 'from-slate-500 to-slate-600';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Billing — Vivora X" description="Manage your subscription and view credit usage." />

      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <VivoraXLogo size="md" />
          </a>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToHome')}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Usage</h1>
          <p className="text-muted-foreground">Manage your plan, view transactions, and track usage.</p>
        </motion.div>

        {/* Current Plan Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className={`p-6 bg-gradient-to-r ${planGradient} text-white`}>
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
              <p className="text-xs text-muted-foreground">Daily Remaining</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{remaining.monthly.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Monthly Remaining</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{totalCreditsUsed.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Used</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
          </div>

          {/* Renewal / Upgrade CTA */}
          <div className="p-6 border-t border-border">
            {isFree ? (
              <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">You're on the Free plan</p>
                  <p className="text-xs text-muted-foreground">Upgrade to access more credits, features, and priority access.</p>
                </div>
                <a href="/pricing" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
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
            className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Usage by Project
            </h3>
            <div className="space-y-3">
              {Object.entries(projectUsage)
                .sort(([, a], [, b]) => b.credits - a.credits)
                .map(([key, data]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground text-sm">{data.name}</p>
                      <p className="text-xs text-muted-foreground">{data.count} generations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-foreground">{data.credits.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        {!isFree && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Transaction History
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.description || tx.work_type || 'Code Generation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
            className="rounded-2xl border border-border bg-card p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No billing history</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Upgrade to a paid plan to access detailed transaction history, project usage breakdown, and more credits.
            </p>
            <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity">
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
