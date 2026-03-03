import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Layers, Plus, Trash2, Send, Bell, Search,
  BarChart2, Cpu, Power,
  Home, Rocket, LayoutDashboard,
  Settings2, Megaphone, BookOpen, Package, ArrowRight,
  Gift, Moon, Star, Calendar, Eye, EyeOff,
  Copy, Check, ChevronLeft, ChevronRight, Menu, X,
  TrendingUp, Activity, Zap, UserCheck, ClipboardList,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';
import { toast } from '@/hooks/use-toast';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
  onboarding: any[];
}

type TabKey = 'dashboard' | 'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates' | 'blog' | 'ai-models' | 'promo-codes' | 'celebrations' | 'onboarding';

/* ═══════════════════════════════════════
   Empty State
═══════════════════════════════════════ */
const EmptyState: React.FC<{ icon: any; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
      <Icon size={22} className="text-white/15" />
    </div>
    <h3 className="text-sm font-semibold text-white/40 mb-1">{title}</h3>
    <p className="text-xs text-white/20">{desc}</p>
  </div>
);

/* ═══════════════════════════════════════
   Stat Card
═══════════════════════════════════════ */
const StatCard: React.FC<{ label: string; value: string | number; icon: any; trend?: string; color: string }> = ({ label, value, icon: Icon, trend, color }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.01 }}
    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 group hover:border-white/[0.1] transition-all"
  >
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-8 translate-x-8" style={{ background: color }} />
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
          <TrendingUp size={10} /> {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</p>
    <p className="text-[11px] font-medium text-white/25 uppercase tracking-widest mt-1">{label}</p>
  </motion.div>
);

/* ═══════════════════════════════════════
   MAIN ADMIN PANEL
═══════════════════════════════════════ */
export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Model Config state
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [aiProvider, setAiProvider] = useState('vercel');
  const [aiModelId, setAiModelId] = useState('');
  const [aiDisplayName, setAiDisplayName] = useState('');
  const [aiGatewayUrl, setAiGatewayUrl] = useState('https://ai-gateway.vercel.sh/v1/chat/completions');
  const [aiKeySecretName, setAiKeySecretName] = useState('VERCEL_AI_API_KEY');
  const [aiTargetPlan, setAiTargetPlan] = useState('all');
  const [savingModel, setSavingModel] = useState(false);

  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxBody, setInboxBody] = useState('');
  const [inboxImage, setInboxImage] = useState('');
  const [inboxLink, setInboxLink] = useState('');
  const [inboxPlan, setInboxPlan] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  const [tplName, setTplName] = useState('');
  const [tplImage, setTplImage] = useState('');
  const [tplPrompt, setTplPrompt] = useState('');
  const [tplCategory, setTplCategory] = useState('general');
  const [templates, setTemplates] = useState<any[]>([]);
  const [savingTpl, setSavingTpl] = useState(false);

  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoPlan, setPromoPlan] = useState('all');
  const [promoPublic, setPromoPublic] = useState(false);
  const [promoMaxUses, setPromoMaxUses] = useState('');
  const [promoExpires, setPromoExpires] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [celebrations, setCelebrations] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) navigate('/login');
      });
      return;
    }
    const fetchData = async () => {
      try {
        let { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          sessionData = refreshed;
        }
        if (!sessionData?.session) { navigate('/login'); return; }
        const accessToken = sessionData.session.access_token;
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fnError) {
          const msg = fnError.message || '';
          if (msg.includes('Unauthorized') || msg.includes('401')) { setError('Unauthorized'); return; }
          throw new Error(msg);
        }
        if (result?.error) { setError(result.error); return; }
        setData(result);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data');
      } finally { setLoading(false); }
    };
    fetchData();
    fetchNotifications();
    fetchTemplates();
    fetchAiModels();
    fetchPromoCodes();
    fetchCelebrations();
  }, [user, authLoading, navigate]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('inbox_notifications').select('*').order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };
  const fetchTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('sort_order', { ascending: true });
    if (data) setTemplates(data);
  };
  const fetchAiModels = async () => {
    const { data } = await supabase.from('ai_model_config').select('*').order('created_at', { ascending: false });
    if (data) setAiModels(data);
  };
  const fetchPromoCodes = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (data) setPromoCodes(data);
  };
  const fetchCelebrations = async () => {
    const { data } = await supabase.from('site_celebrations').select('*').order('name');
    if (data) setCelebrations(data);
  };

  // ─── Handlers ─────────────────────────────────
  const handleSendNotification = async () => {
    if (!inboxTitle.trim()) return;
    setSendingNotif(true);
    await supabase.from('inbox_notifications').insert({
      title: inboxTitle, body: inboxBody || null,
      image_url: inboxImage || null, link_url: inboxLink || null,
      target_plan: inboxPlan, created_by: user?.id,
    });
    setInboxTitle(''); setInboxBody(''); setInboxImage(''); setInboxLink(''); setInboxPlan('all');
    await fetchNotifications();
    setSendingNotif(false);
    toast({ title: 'Notification sent ✓' });
  };
  const handleDeleteNotification = async (id: string) => {
    await supabase.from('inbox_notifications').delete().eq('id', id);
    await fetchNotifications();
  };
  const handleAddTemplate = async () => {
    if (!tplName.trim() || !tplPrompt.trim()) return;
    setSavingTpl(true);
    await supabase.from('templates').insert({
      name: tplName, image_url: tplImage || null,
      prompt: tplPrompt, category: tplCategory,
      created_by: user?.id, sort_order: templates.length,
    });
    setTplName(''); setTplImage(''); setTplPrompt(''); setTplCategory('general');
    await fetchTemplates();
    setSavingTpl(false);
    toast({ title: 'Template added ✓' });
  };
  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    await fetchTemplates();
  };

  const providerDefaults: Record<string, { url: string; key: string; placeholder: string }> = {
    vercel: { url: 'https://ai-gateway.vercel.sh/v1/chat/completions', key: 'VERCEL_AI_API_KEY', placeholder: 'google/gemini-3-flash' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', key: 'OPENROUTER_API_KEY', placeholder: 'anthropic/claude-sonnet-4' },
    nvidia: { url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: 'NVIDIA_API_KEY', placeholder: 'moonshotai/kimi-k2.5' },
    lovable: { url: 'https://ai.gateway.lovable.dev/v1/chat/completions', key: 'LOVABLE_API_KEY', placeholder: 'google/gemini-2.5-flash' },
  };
  const handleProviderChange = (provider: string) => {
    setAiProvider(provider);
    const defaults = providerDefaults[provider];
    if (defaults) { setAiGatewayUrl(defaults.url); setAiKeySecretName(defaults.key); setAiModelId(''); }
  };
  const handleAddAiModel = async () => {
    if (!aiModelId.trim() || !aiDisplayName.trim()) return;
    setSavingModel(true);
    await supabase.from('ai_model_config').insert({
      provider: aiProvider, model_id: aiModelId, display_name: aiDisplayName,
      gateway_url: aiGatewayUrl, api_key_secret_name: aiKeySecretName,
      target_plan: aiTargetPlan, is_active: false, created_by: user?.id,
    });
    setAiModelId(''); setAiDisplayName('');
    await fetchAiModels();
    setSavingModel(false);
    toast({ title: 'Model added ✓' });
  };
  const handleToggleAiModel = async (id: string, currentActive: boolean) => {
    if (!currentActive) {
      const model = aiModels.find(m => m.id === id);
      if (model) {
        const idsToDeactivate = aiModels.filter(m => m.id !== id && m.is_active && m.target_plan === model.target_plan).map(m => m.id);
        if (idsToDeactivate.length > 0) await supabase.from('ai_model_config').update({ is_active: false }).in('id', idsToDeactivate);
      }
    }
    await supabase.from('ai_model_config').update({ is_active: !currentActive }).eq('id', id);
    await fetchAiModels();
  };
  const handleDeleteAiModel = async (id: string) => {
    await supabase.from('ai_model_config').delete().eq('id', id);
    await fetchAiModels();
  };

  const handleAddPromo = async () => {
    if (!promoCode.trim()) return;
    setSavingPromo(true);
    await supabase.from('promo_codes').insert({
      code: promoCode.toUpperCase().trim(),
      discount_percent: promoDiscount,
      target_plan: promoPlan,
      is_public: promoPublic,
      max_uses: promoMaxUses ? parseInt(promoMaxUses) : null,
      expires_at: promoExpires || null,
      created_by: user?.id,
    });
    setPromoCode(''); setPromoDiscount(10); setPromoPlan('all'); setPromoPublic(false); setPromoMaxUses(''); setPromoExpires('');
    await fetchPromoCodes();
    setSavingPromo(false);
    toast({ title: 'Promo code created ✓' });
  };
  const handleDeletePromo = async (id: string) => {
    await supabase.from('promo_codes').delete().eq('id', id);
    await fetchPromoCodes();
  };
  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleCelebration = async (id: string, currentActive: boolean) => {
    await supabase.from('site_celebrations').update({ is_active: !currentActive, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchCelebrations();
    toast({ title: `Celebration ${currentActive ? 'deactivated' : 'activated'}` });
  };

  const activeModelsByPlan = useMemo(() => {
    const map: Record<string, any> = {};
    aiModels.filter(m => m.is_active).forEach(m => { map[m.target_plan] = m; });
    return map;
  }, [aiModels]);

  // ─── Loading / Error ─────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060a]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase font-medium">Loading Console</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060a]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d0d14] border border-white/[0.06] rounded-3xl p-10 text-center max-w-sm shadow-2xl shadow-black/50">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-white/30 mb-8 leading-relaxed">{error}</p>
          <button onClick={() => navigate('/')} className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/25">
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const navSections: { title: string; items: { key: TabKey; label: string; icon: any; count?: number }[] }[] = [
    {
      title: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Data',
      items: [
        { key: 'users', label: 'Users', icon: Users, count: data.users.length },
        { key: 'projects', label: 'Projects', icon: FolderOpen, count: data.projects.length },
        { key: 'transactions', label: 'Analytics', icon: BarChart2 },
        { key: 'plans', label: 'Plans', icon: CreditCard, count: data.plans.length },
        { key: 'onboarding', label: 'Onboarding', icon: ClipboardList, count: data.onboarding?.length || 0 },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { key: 'ai-models', label: 'AI Models', icon: Cpu, count: aiModels.length },
        { key: 'promo-codes', label: 'Promo Codes', icon: Gift, count: promoCodes.length },
        { key: 'celebrations', label: 'Celebrations', icon: Star },
      ],
    },
    {
      title: 'Content',
      items: [
        { key: 'templates', label: 'Templates', icon: Package, count: templates.length },
        { key: 'inbox', label: 'Notifications', icon: Megaphone, count: notifications.length },
        { key: 'blog', label: 'Blog', icon: BookOpen },
      ],
    },
  ];

  const displayName = (data?.users?.find((u: any) => u.user_id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';
  const totalCreditsUsed = data.transactions.reduce((sum: number, t: any) => sum + (Number(t.credits_used) || 0), 0);
  const tabTitle = navSections.flatMap(s => s.items).find(n => n.key === tab)?.label || 'Dashboard';

  // ─── Design Tokens ─────────────────
  const glassCls = "rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm";
  const inputCls = "w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/90 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all placeholder:text-white/15";
  const labelCls = "block text-[11px] font-semibold text-white/30 mb-1.5 uppercase tracking-wider";
  const btnPrimary = "px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20";

  return (
    <div className="flex h-screen overflow-hidden bg-[#06060a] text-white/90">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
      </AnimatePresence>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:relative z-50 md:z-10
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
        bg-[#08080e]/95 backdrop-blur-xl border-r border-white/[0.04] flex flex-col h-screen flex-shrink-0 transition-all duration-300
      `}>
        {/* Brand */}
        <div className={`h-16 flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-5 gap-3'} flex-shrink-0 border-b border-white/[0.04]`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-600/30">
            <Rocket size={14} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-white tracking-tight">Vivora X</span>
              <p className="text-[10px] text-white/15 font-medium">Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-5 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.25em] px-3 mb-2">{section.title}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setTab(item.key); setMobileMenuOpen(false); }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-violet-500/15 to-indigo-500/10 text-white font-medium shadow-sm'
                          : 'text-white/25 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                    >
                      <Icon size={16} className={active ? 'text-violet-400' : ''} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.04] text-white/15'}`}>
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/[0.04] space-y-0.5">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-all`}>
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button onClick={() => navigate('/')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-all`}>
            <Home size={14} />
            {!sidebarCollapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-white/[0.04] bg-[#06060a]/80 backdrop-blur-xl flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] text-white/25">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-white/12 font-medium">Admin</span>
              <span className="text-white/8">/</span>
              <span className="font-semibold text-white/80">{tabTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl w-56">
              <Search size={13} className="text-white/12 flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-white/80 w-full placeholder:text-white/12" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-violet-300 border border-violet-400/10">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>

                {/* ══════════════ DASHBOARD ══════════════ */}
                {tab === 'dashboard' && (
                  <div className="space-y-6 max-w-7xl">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Welcome back, {displayName}</h1>
                      <p className="text-sm text-white/25">Here's your platform overview.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard label="Total Users" value={data.users.length} icon={Users} color="#3b82f6" trend={data.users.length > 0 ? '+' + Math.min(data.users.length, 12) + ' this week' : undefined} />
                      <StatCard label="Projects" value={data.projects.length} icon={FolderOpen} color="#10b981" />
                      <StatCard label="Credits Used" value={totalCreditsUsed.toFixed(0)} icon={Zap} color="#a855f7" />
                      <StatCard label="Active Plans" value={data.plans.length} icon={Activity} color="#6366f1" />
                    </div>

                    {/* Active AI Models */}
                    <div className={`${glassCls} p-6`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                          <Cpu size={16} className="text-violet-400" />
                          <h3 className="text-sm font-bold text-white/80">Active AI Models</h3>
                        </div>
                        <button onClick={() => setTab('ai-models')} className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1.5 transition-colors">
                          Manage <ArrowRight size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['free', 'pro', 'business', 'all'].map(plan => {
                          const m = activeModelsByPlan[plan];
                          return (
                            <div key={plan} className={`rounded-xl p-4 border transition-all ${m ? 'bg-violet-500/[0.06] border-violet-500/10' : 'bg-white/[0.01] border-white/[0.05]'}`}>
                              <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-2">{plan === 'all' ? 'All Plans' : plan}</p>
                              {m ? (
                                <>
                                  <p className="text-xs font-bold text-white/80 truncate">{m.display_name}</p>
                                  <p className="text-[10px] text-white/20 font-mono truncate mt-0.5">{m.model_id}</p>
                                </>
                              ) : (
                                <p className="text-xs text-white/10 italic">Not configured</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Celebrations */}
                    {celebrations.some(c => c.is_active) && (
                      <div className={`${glassCls} p-6 border-violet-500/10`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Star size={16} className="text-amber-400" />
                          <h3 className="text-sm font-bold text-white/80">Active Celebrations</h3>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {celebrations.filter(c => c.is_active).map(c => (
                            <div key={c.id} className="flex items-center gap-2 px-4 py-2 bg-violet-500/[0.08] border border-violet-500/10 rounded-xl">
                              <span className="text-lg">{c.config?.emoji || '🎉'}</span>
                              <span className="text-sm font-semibold text-violet-300">{c.config?.label || c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Users & Projects */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className={`${glassCls} p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-white/80">Recent Users</h3>
                          <button onClick={() => setTab('users')} className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">View all</button>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {data.users.slice(0, 5).map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-[11px] font-bold text-blue-400 border border-blue-500/10">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white/80 leading-tight">{u.display_name || u.email || '—'}</p>
                                  <p className="text-[11px] text-white/15 leading-tight">{u.email}</p>
                                </div>
                              </div>
                              <p className="text-[11px] text-white/10 tabular-nums">{new Date(u.created_at).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${glassCls} p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-white/80">Recent Projects</h3>
                          <button onClick={() => setTab('projects')} className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">View all</button>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {data.projects.slice(0, 5).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center border border-emerald-500/10">
                                  <FolderOpen size={13} className="text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white/80 leading-tight">{p.name}</p>
                                  <p className="text-[11px] text-white/15 leading-tight">{p.project_type}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/15'}`}>
                                {p.is_published ? 'Live' : 'Draft'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════ ONBOARDING ══════════════ */}
                {tab === 'onboarding' && (
                  <div className="space-y-5 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Onboarding Responses</h2>
                        <p className="text-sm text-white/25 mt-1">User responses from the Get Started flow</p>
                      </div>
                      <span className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/30">{data.onboarding?.length || 0} responses</span>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['founder', 'engineer', 'designer', 'product'].map(role => {
                        const count = data.onboarding?.filter((o: any) => o.role === role).length || 0;
                        return (
                          <div key={role} className={`${glassCls} p-4`}>
                            <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-1">{role}</p>
                            <p className="text-xl font-bold text-white tabular-nums">{count}</p>
                          </div>
                        );
                      })}
                    </div>

                    {(!data.onboarding || data.onboarding.length === 0) ? (
                      <EmptyState icon={ClipboardList} title="No onboarding data yet" desc="Users will appear here after completing the Get Started flow." />
                    ) : (
                      <div className={`${glassCls} overflow-x-auto`}>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-white/[0.04]">
                              {['Name', 'Role', 'Company Size', 'Theme', 'Date'].map(h => (
                                <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.onboarding.map((o: any) => (
                              <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                                <td className="px-5 py-4 text-sm font-medium text-white/80">{o.full_name || '—'}</td>
                                <td className="px-5 py-4">
                                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 capitalize">{o.role || '—'}</span>
                                </td>
                                <td className="px-5 py-4 text-sm text-white/40">{o.company_size || '—'}</td>
                                <td className="px-5 py-4">
                                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${o.preferred_theme === 'dark' ? 'bg-white/[0.06] text-white/40' : 'bg-amber-500/10 text-amber-300'}`}>
                                    {o.preferred_theme || '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-xs text-white/15 tabular-nums">{new Date(o.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ PROMO CODES ══════════════ */}
                {tab === 'promo-codes' && (
                  <div className="space-y-5 max-w-5xl">
                    <div className={`${glassCls} p-6`}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <Gift size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-white/80">Create Promo Code</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div><label className={labelCls}>Code *</label><input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={`${inputCls} font-mono uppercase`} placeholder="RAMADAN25" /></div>
                        <div><label className={labelCls}>Discount %</label><input type="number" value={promoDiscount} onChange={e => setPromoDiscount(Number(e.target.value))} min={1} max={100} className={inputCls} /></div>
                        <div><label className={labelCls}>Target Plan</label><select value={promoPlan} onChange={e => setPromoPlan(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="all">All Plans</option><option value="pro">Pro Only</option><option value="business">Business Only</option></select></div>
                        <div><label className={labelCls}>Max Uses</label><input type="number" value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} className={inputCls} placeholder="100" /></div>
                        <div><label className={labelCls}>Expires At</label><input type="datetime-local" value={promoExpires} onChange={e => setPromoExpires(e.target.value)} className={inputCls} /></div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer py-2.5"><input type="checkbox" checked={promoPublic} onChange={e => setPromoPublic(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-violet-600 focus:ring-violet-500/30" /><span className="text-sm text-white/25">Public</span></label>
                        </div>
                      </div>
                      <button onClick={handleAddPromo} disabled={!promoCode.trim() || savingPromo} className={`${btnPrimary} mt-4`}><Plus size={13} /> {savingPromo ? 'Creating...' : 'Create Code'}</button>
                    </div>

                    {promoCodes.length === 0 ? (
                      <EmptyState icon={Gift} title="No promo codes yet" desc="Create your first promo code above." />
                    ) : (
                      <div className={`${glassCls} overflow-x-auto`}>
                        <table className="w-full border-collapse">
                          <thead><tr className="border-b border-white/[0.04]">{['Code', 'Discount', 'Plan', 'Type', 'Uses', 'Expires', ''].map(h => (<th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>))}</tr></thead>
                          <tbody>
                            {promoCodes.map(p => (
                              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                                <td className="px-5 py-3.5"><div className="flex items-center gap-2"><span className="text-sm font-mono font-bold text-violet-400">{p.code}</span><button onClick={() => copyPromoCode(p.code)} className="text-white/15 hover:text-white/40 transition-colors">{copiedCode === p.code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}</button></div></td>
                                <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">{p.discount_percent}%</td>
                                <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 capitalize">{p.target_plan}</span></td>
                                <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${p.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/15'}`}>{p.is_public ? 'Public' : 'Private'}</span></td>
                                <td className="px-5 py-3.5 text-sm text-white/25 tabular-nums">{p.current_uses}{p.max_uses ? `/${p.max_uses}` : ''}</td>
                                <td className="px-5 py-3.5 text-sm text-white/15 tabular-nums">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '∞'}</td>
                                <td className="px-5 py-3.5"><button onClick={() => handleDeletePromo(p.id)} className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={13} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ CELEBRATIONS ══════════════ */}
                {tab === 'celebrations' && (
                  <div className="space-y-5 max-w-4xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Seasonal Celebrations</h2>
                        <p className="text-sm text-white/25 mt-1">Toggle seasonal overlays for all users</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {celebrations.map(c => (
                        <div key={c.id} className={`${glassCls} p-6 ${c.is_active ? 'border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] to-indigo-500/[0.03]' : ''}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{c.config?.emoji || '🎉'}</span>
                            <div>
                              <h4 className="font-bold text-white text-sm">{c.config?.label || c.name}</h4>
                              <p className="text-[11px] text-white/20">{c.name}</p>
                            </div>
                          </div>
                          <button onClick={() => handleToggleCelebration(c.id, c.is_active)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${c.is_active ? 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/20'}`}>
                            {c.is_active ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════ INBOX ══════════════ */}
                {tab === 'inbox' && (
                  <div className="space-y-5 max-w-4xl">
                    <div className={`${glassCls} p-6`}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <Send size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-white/80">Send Notification</h3>
                      </div>
                      <div className="space-y-4">
                        <div><label className={labelCls}>Title *</label><input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={inputCls} placeholder="Notification title..." /></div>
                        <div><label className={labelCls}>Body</label><textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={`${inputCls} resize-none h-20`} placeholder="Message body..." /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div><label className={labelCls}>Image URL</label><input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={inputCls} placeholder="https://..." /></div>
                          <div><label className={labelCls}>Link URL</label><input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={inputCls} placeholder="https://..." /></div>
                          <div><label className={labelCls}>Target Plan</label><select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="all">All Plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></div>
                        </div>
                        <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif} className={btnPrimary}><Send size={13} /> {sendingNotif ? 'Sending...' : 'Send'}</button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <EmptyState icon={Bell} title="No notifications yet" desc="Send your first notification above." />
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <div key={n.id} className={`flex items-center justify-between p-4 ${glassCls} hover:border-white/[0.1] transition-colors`}>
                            <div>
                              <p className="text-sm font-semibold text-white/80">{n.title}</p>
                              {n.body && <p className="text-xs text-white/25 mt-0.5">{n.body}</p>}
                              <p className="text-[10px] text-white/10 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDeleteNotification(n.id)} className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ TEMPLATES ══════════════ */}
                {tab === 'templates' && (
                  <div className="space-y-5 max-w-6xl">
                    <div className={`${glassCls} p-6`}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <Plus size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-white/80">Add Template</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div><label className={labelCls}>Name *</label><input value={tplName} onChange={e => setTplName(e.target.value)} className={inputCls} placeholder="Template name..." /></div>
                          <div><label className={labelCls}>Category</label><input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={inputCls} placeholder="general" /></div>
                          <div><label className={labelCls}>Image URL</label><input value={tplImage} onChange={e => setTplImage(e.target.value)} className={inputCls} placeholder="https://..." /></div>
                        </div>
                        <div><label className={labelCls}>Prompt *</label><textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={`${inputCls} resize-none h-24`} placeholder="AI prompt..." /></div>
                        <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl} className={btnPrimary}><Plus size={13} /> {savingTpl ? 'Saving...' : 'Add Template'}</button>
                      </div>
                    </div>
                    {templates.length === 0 ? (
                      <EmptyState icon={Layers} title="No templates yet" desc="Create your first template above." />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {templates.map(tpl => (
                          <motion.div key={tpl.id} whileHover={{ y: -3 }} className={`group ${glassCls} overflow-hidden hover:border-white/[0.1] transition-all`}>
                            <div className="aspect-video bg-white/[0.01] flex items-center justify-center overflow-hidden">
                              {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Layers size={20} className="text-white/10" />}
                            </div>
                            <div className="p-4 flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white/80">{tpl.name}</p>
                                <p className="text-[11px] text-white/15 mt-0.5">{tpl.category}</p>
                              </div>
                              <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 transition-all"><Trash2 size={12} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ BLOG ══════════════ */}
                {tab === 'blog' && <AdminBlogEditor />}

                {/* ══════════════ AI MODELS ══════════════ */}
                {tab === 'ai-models' && (
                  <div className="space-y-5 max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['free', 'pro', 'business', 'all'].map(plan => {
                        const m = activeModelsByPlan[plan];
                        return (
                          <div key={plan} className={`${glassCls} p-4 ${m ? 'border-violet-500/10' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{plan === 'all' ? 'All Plans' : plan}</span>
                              {m && <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50" />}
                            </div>
                            {m ? (
                              <>
                                <p className="text-sm font-bold text-white/80 truncate">{m.display_name}</p>
                                <p className="text-[10px] text-white/15 font-mono truncate mt-0.5">{m.model_id}</p>
                                <span className="inline-block text-[10px] mt-2 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 font-semibold capitalize">{m.provider}</span>
                              </>
                            ) : (
                              <p className="text-xs text-white/10 italic mt-1">No active model</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className={`${glassCls} p-6`}>
                      <div className="flex items-center gap-2.5 mb-5">
                        <Cpu size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-white/80">Add AI Model</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelCls}>Provider</label><select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="vercel">Vercel AI</option><option value="openrouter">OpenRouter</option><option value="nvidia">NVIDIA NIM</option><option value="lovable">Lovable AI</option></select></div>
                            <div><label className={labelCls}>Target Plan</label><select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="all">All Plans</option><option value="free">Free Only</option><option value="pro">Pro Only</option><option value="business">Business Only</option></select></div>
                          </div>
                          <div><label className={labelCls}>Model ID *</label><input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className={`${inputCls} font-mono`} placeholder={providerDefaults[aiProvider]?.placeholder} /></div>
                          <div><label className={labelCls}>Display Name *</label><input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className={inputCls} placeholder="e.g. Gemini 3 Flash" /></div>
                          <div><label className={labelCls}>Gateway URL</label><input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className={`${inputCls} text-xs font-mono`} /></div>
                          <div><label className={labelCls}>API Key Secret</label><input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className={`${inputCls} font-mono`} /></div>
                          <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel} className={`${btnPrimary} w-full justify-center`}><Plus size={13} /> {savingModel ? 'Saving...' : 'Add Model'}</button>
                        </div>
                        <div className="space-y-4">
                          <div className={`${glassCls} p-4`}>
                            <p className="text-xs text-violet-400 font-bold mb-1">Priority Logic</p>
                            <p className="text-xs text-white/25 leading-relaxed">Specific plan match → "All Plans" fallback.</p>
                          </div>
                          <div className={`${glassCls} p-4`}>
                            <p className="text-xs text-white/60 font-bold mb-2">Providers</p>
                            <div className="space-y-1.5">
                              {Object.entries(providerDefaults).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-xs text-white/25 font-semibold capitalize">{key}</span>
                                  <span className="text-[10px] text-white/10 font-mono">{val.key}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {aiModels.length === 0 ? (
                      <EmptyState icon={Cpu} title="No models configured" desc="Add your first AI model above." />
                    ) : (
                      <div className={`${glassCls} overflow-x-auto`}>
                        <table className="w-full border-collapse">
                          <thead><tr className="border-b border-white/[0.04]">{['Status', 'Provider', 'Model', 'Name', 'Plan', ''].map(h => (<th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>))}</tr></thead>
                          <tbody>
                            {aiModels.map(m => (
                              <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${m.is_active ? 'bg-violet-500/10 text-violet-300' : 'bg-white/[0.04] text-white/15'}`}>
                                    {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                    {m.is_active ? 'Active' : 'Off'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-xs font-semibold text-white/25 capitalize">{m.provider}</td>
                                <td className="px-5 py-3.5 text-xs font-mono text-violet-400">{m.model_id}</td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-white/80">{m.display_name}</td>
                                <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/25 capitalize">{m.target_plan === 'all' ? 'All' : m.target_plan}</span></td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleToggleAiModel(m.id, m.is_active)} className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${m.is_active ? 'bg-white/[0.04] text-white/25 hover:bg-white/[0.08]' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'}`}>
                                      {m.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => handleDeleteAiModel(m.id)} className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ DATA TABLES ══════════════ */}
                {['users', 'plans', 'transactions', 'projects'].includes(tab) && (
                  <div className="space-y-5 max-w-7xl">
                    <div className={`${glassCls} overflow-x-auto`}>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04]">
                            {tab === 'users' && ['Email', 'Name', 'Joined'].map(h => <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>)}
                            {tab === 'plans' && ['User', 'Plan', 'Daily', 'Used Today', 'Total Used', 'Expires'].map(h => <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>)}
                            {tab === 'transactions' && ['User', 'Credits', 'Model', 'Type', 'Date'].map(h => <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>)}
                            {tab === 'projects' && ['Name', 'Type', 'Status', 'Created'].map(h => <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {tab === 'users' && data.users.filter(u => !searchQuery || JSON.stringify(u).toLowerCase().includes(searchQuery.toLowerCase())).map((u: any) => (
                            <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-[11px] font-bold text-blue-400">{(u.email || '?')[0].toUpperCase()}</div>
                                  <span className="text-sm text-white/60 font-mono">{u.email || '—'}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-sm font-medium text-white/80">{u.display_name || '—'}</td>
                              <td className="px-5 py-3.5 text-xs text-white/15 tabular-nums">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {tab === 'plans' && data.plans.filter(p => !searchQuery || JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p: any) => (
                            <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                              <td className="px-5 py-3.5 text-xs font-mono text-white/30 max-w-[120px] truncate">{p.user_id?.slice(0, 8)}</td>
                              <td className="px-5 py-3.5"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${p.plan === 'pro' ? 'bg-violet-500/10 text-violet-300' : p.plan === 'business' ? 'bg-amber-500/10 text-amber-300' : 'bg-white/[0.04] text-white/25'}`}>{p.plan}</span></td>
                              <td className="px-5 py-3.5 text-sm text-white/40 tabular-nums">{p.daily_credits}</td>
                              <td className="px-5 py-3.5 text-sm text-white/40 tabular-nums">{p.credits_used_today}</td>
                              <td className="px-5 py-3.5 text-sm text-white/40 tabular-nums">{p.total_credits_used}</td>
                              <td className="px-5 py-3.5 text-xs text-white/15 tabular-nums">{p.subscription_expires_at ? new Date(p.subscription_expires_at).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                          {tab === 'transactions' && data.transactions.filter(t => !searchQuery || JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())).map((t: any) => (
                            <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                              <td className="px-5 py-3.5 text-xs font-mono text-white/25 max-w-[120px] truncate">{t.user_id?.slice(0, 8)}</td>
                              <td className="px-5 py-3.5 text-sm font-bold text-violet-400 tabular-nums">{t.credits_used}</td>
                              <td className="px-5 py-3.5 text-xs font-mono text-white/25">{t.model_used || '—'}</td>
                              <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/25">{t.work_type || '—'}</span></td>
                              <td className="px-5 py-3.5 text-xs text-white/15 tabular-nums">{new Date(t.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                          {tab === 'projects' && data.projects.filter(p => !searchQuery || JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p: any) => (
                            <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold text-white/80">{p.name}</td>
                              <td className="px-5 py-3.5 text-xs text-white/25 capitalize">{p.project_type}</td>
                              <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/15'}`}>{p.is_published ? 'Published' : 'Draft'}</span></td>
                              <td className="px-5 py-3.5 text-xs text-white/15 tabular-nums">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
