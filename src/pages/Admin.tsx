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
  Copy, Check, ChevronDown, ChevronUp, Menu, X,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';
import { toast } from '@/hooks/use-toast';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

type TabKey = 'dashboard' | 'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates' | 'blog' | 'ai-models' | 'promo-codes' | 'celebrations';

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

  // Promo Codes state
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoPlan, setPromoPlan] = useState('all');
  const [promoPublic, setPromoPublic] = useState(false);
  const [promoMaxUses, setPromoMaxUses] = useState('');
  const [promoExpires, setPromoExpires] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Celebrations state
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
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) { navigate('/login'); return; }
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
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

  // ─── Data Fetchers ─────────────────────────────────
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
    toast({ title: 'Notification sent' });
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
    toast({ title: 'Template added' });
  };
  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    await fetchTemplates();
  };

  // AI Models
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
    toast({ title: 'Model added' });
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

  // Promo Codes
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
    toast({ title: 'Promo code created' });
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

  // Celebrations
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
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-900/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-stone-500 font-serif tracking-widest uppercase">Loading Console</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="bg-[#111116] border border-stone-800/50 rounded-xl p-10 text-center max-w-sm">
          <AlertTriangle size={28} className="text-red-500/70 mx-auto mb-4" />
          <h2 className="text-lg font-serif font-semibold text-stone-200 mb-2">Access Denied</h2>
          <p className="text-sm text-stone-500 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500 transition-colors">
            Return Home
          </button>
        </div>
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

  const displayName = (data?.users?.find((u: any) => u.id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';
  const totalCreditsUsed = data.transactions.reduce((sum: number, t: any) => sum + (Number(t.credits_used) || 0), 0);
  const tabTitle = navSections.flatMap(s => s.items).find(n => n.key === tab)?.label || 'Dashboard';

  // ─── Next-gen Design Tokens ─────────────────
  const cardCls = "rounded-2xl border border-indigo-400/20 bg-slate-950/70 backdrop-blur-xl shadow-[0_18px_50px_-24px_rgba(59,130,246,.65)]";
  const inputCls = "w-full px-3.5 py-2.5 bg-slate-900/70 border border-indigo-300/15 rounded-xl text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-400/35 focus:border-cyan-300/40 transition-all placeholder:text-slate-500 font-sans";
  const labelCls = "block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-1.5";
  const btnPrimary = "px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-[0_12px_25px_-12px_rgba(56,189,248,.8)]";

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.26),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.16),transparent_30%)]" />

      {/* ═══════════════ MOBILE OVERLAY ═══════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:relative z-50 md:z-10
        ${sidebarCollapsed ? 'w-[74px]' : 'w-72'}
        bg-slate-950/80 border-r border-indigo-400/15 backdrop-blur-2xl flex flex-col h-screen flex-shrink-0 transition-all duration-300
      `}>

        {/* Brand */}
        <div className="h-20 flex items-center px-5 gap-3 flex-shrink-0 border-b border-indigo-400/15">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
            <Rocket size={14} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="text-sm font-semibold text-white tracking-wide">Admin Nexus</span>
              <p className="text-[11px] text-slate-400">Vivora X Operations</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] px-3 mb-2">{section.title}</p>
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 font-medium border border-cyan-300/20 shadow-[0_8px_20px_-14px_rgba(34,211,238,.9)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                        }`}
                    >
                      <Icon size={15} className={active ? 'text-cyan-300' : 'text-slate-500'} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className={`text-[10px] font-mono min-w-[22px] text-center px-1.5 py-0.5 rounded ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-500'}`}>
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
        <div className="p-3 border-t border-indigo-400/15 space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all"
          >
            {sidebarCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all">
            <Home size={15} />
            {!sidebarCollapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-indigo-400/15 bg-slate-950/60 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Settings2 size={13} className="text-cyan-300" />
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-white">{tabTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900/75 border border-indigo-300/15 rounded-xl w-56">
              <Search size={13} className="text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search modules..." className="bg-transparent border-none outline-none text-sm text-slate-100 w-full placeholder:text-slate-500" />
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-indigo-400/15">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-cyan-300 border border-cyan-300/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 hidden md:inline">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* ══════════════ DASHBOARD ══════════════ */}
          {tab === 'dashboard' && (
            <div className="space-y-5 max-w-6xl">
              <div className={`${cardCls} p-6`}>
                <h2 className="text-xl font-serif font-bold text-stone-100">Welcome back, {displayName}</h2>
                <p className="text-sm text-stone-500 mt-1 font-serif">Platform overview and system status.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Users', value: data.users.length, icon: Users, accent: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
                  { label: 'Projects', value: data.projects.length, icon: FolderOpen, accent: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                  { label: 'Credits Used', value: totalCreditsUsed.toFixed(0), icon: CreditCard, accent: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                  { label: 'Active Plans', value: data.plans.length, icon: Star, accent: 'text-purple-400', bg: 'bg-purple-500/5 border-purple-500/10' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={`${cardCls} p-4 ${stat.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <Icon size={16} className={stat.accent} />
                        <span className="text-[10px] font-serif font-bold text-stone-600 uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-serif font-bold text-stone-100 tabular-nums">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Active AI Models */}
              <div className={`${cardCls} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu size={15} className="text-amber-500" />
                    <h3 className="text-sm font-serif font-semibold text-stone-200">Active AI Models</h3>
                  </div>
                  <button onClick={() => setTab('ai-models')} className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 transition-colors">
                    Manage <ArrowRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {['free', 'pro', 'business', 'all'].map(plan => {
                    const m = activeModelsByPlan[plan];
                    return (
                      <div key={plan} className={`rounded-lg p-3 border transition-colors ${m ? 'bg-amber-500/5 border-amber-500/10' : 'bg-stone-900/50 border-stone-800/30'}`}>
                        <p className="text-[10px] font-serif font-bold text-stone-600 uppercase tracking-widest mb-1">{plan === 'all' ? 'All Plans' : plan}</p>
                        {m ? (
                          <>
                            <p className="text-xs font-semibold text-stone-200 truncate">{m.display_name}</p>
                            <p className="text-[10px] text-stone-600 font-mono truncate mt-0.5">{m.model_id}</p>
                          </>
                        ) : (
                          <p className="text-xs text-stone-700 italic">Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Celebrations */}
              {celebrations.some(c => c.is_active) && (
                <div className={`${cardCls} p-5 bg-amber-500/5 border-amber-500/10`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={15} className="text-amber-400" />
                    <h3 className="text-sm font-serif font-semibold text-stone-200">Active Celebrations</h3>
                  </div>
                  <div className="flex gap-3">
                    {celebrations.filter(c => c.is_active).map(c => (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-lg">
                        <span className="text-lg">{c.config?.emoji || '🎉'}</span>
                        <span className="text-sm font-medium text-amber-300">{c.config?.label || c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Users & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${cardCls} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-serif font-semibold text-stone-200">Recent Users</h3>
                    <button onClick={() => setTab('users')} className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors">View all</button>
                  </div>
                  <div className="divide-y divide-stone-800/30">
                    {data.users.slice(0, 5).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/10">
                            {(u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-200 leading-tight">{u.display_name || u.email || '—'}</p>
                            <p className="text-[11px] text-stone-600 leading-tight">{u.email}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-700 tabular-nums">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${cardCls} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-serif font-semibold text-stone-200">Recent Projects</h3>
                    <button onClick={() => setTab('projects')} className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors">View all</button>
                  </div>
                  <div className="divide-y divide-stone-800/30">
                    {data.projects.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                            <FolderOpen size={12} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-200 leading-tight">{p.name}</p>
                            <p className="text-[11px] text-stone-600 leading-tight">{p.project_type}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800/50 text-stone-600'}`}>
                          {p.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ PROMO CODES ══════════════ */}
          {tab === 'promo-codes' && (
            <div className="space-y-5 max-w-5xl">
              <div className={`${cardCls} p-5`}>
                <div className="flex items-center gap-2 mb-5">
                  <Gift size={15} className="text-amber-500" />
                  <h3 className="text-sm font-serif font-semibold text-stone-200">Create Promo Code</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Code *</label>
                    <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={`${inputCls} font-mono uppercase`} placeholder="RAMADAN25" />
                  </div>
                  <div>
                    <label className={labelCls}>Discount %</label>
                    <input type="number" value={promoDiscount} onChange={e => setPromoDiscount(Number(e.target.value))} min={1} max={100} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Target Plan</label>
                    <select value={promoPlan} onChange={e => setPromoPlan(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="all">All Plans</option>
                      <option value="pro">Pro Only</option>
                      <option value="business">Business Only</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Max Uses</label>
                    <input type="number" value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} className={inputCls} placeholder="100" />
                  </div>
                  <div>
                    <label className={labelCls}>Expires At</label>
                    <input type="datetime-local" value={promoExpires} onChange={e => setPromoExpires(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2.5">
                      <input type="checkbox" checked={promoPublic} onChange={e => setPromoPublic(e.target.checked)} className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-600 focus:ring-amber-500/30" />
                      <span className="text-sm text-stone-500">Public</span>
                    </label>
                  </div>
                </div>
                <button onClick={handleAddPromo} disabled={!promoCode.trim() || savingPromo} className={`${btnPrimary} mt-4`}>
                  <Plus size={13} /> {savingPromo ? 'Creating...' : 'Create Code'}
                </button>
              </div>

              {promoCodes.length === 0 ? (
                <EmptyState icon={Gift} title="No promo codes yet" desc="Create your first promo code above." />
              ) : (
                <div className={`${cardCls} overflow-x-auto`}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800/30">
                        {['Code', 'Discount', 'Plan', 'Type', 'Uses', 'Expires', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map(p => (
                        <tr key={p.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-amber-500">{p.code}</span>
                              <button onClick={() => copyPromoCode(p.code)} className="text-stone-600 hover:text-stone-400 transition-colors">
                                {copiedCode === p.code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-400">{p.discount_percent}%</td>
                          <td className="px-4 py-3"><span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 capitalize">{p.target_plan}</span></td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${p.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800/50 text-stone-600'}`}>
                              {p.is_public ? 'Public' : 'Private'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-500 tabular-nums">{p.current_uses}{p.max_uses ? `/${p.max_uses}` : ''}</td>
                          <td className="px-4 py-3 text-sm text-stone-600 tabular-nums">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '∞'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeletePromo(p.id)} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
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
              <div className={`${cardCls} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <Star size={15} className="text-amber-500" />
                  <h3 className="text-sm font-serif font-semibold text-stone-200">Celebration Modes</h3>
                </div>
                <p className="text-sm text-stone-500 mb-6 font-serif">Toggle celebration overlays on the homepage.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {celebrations.map(c => {
                    const config = c.config || {};
                    return (
                      <div key={c.id} className={`${cardCls} p-5 ${c.is_active ? 'bg-amber-500/5 border-amber-500/15' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.emoji || '🎉'}</span>
                            <div>
                              <h4 className="text-sm font-serif font-bold text-stone-200">{config.label || c.name}</h4>
                              <p className="text-xs text-stone-600">Themed celebration effect</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleCelebration(c.id, c.is_active)}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            c.is_active
                              ? 'bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20'
                              : 'bg-amber-600 text-white hover:bg-amber-500'
                          }`}
                        >
                          {c.is_active ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ INBOX ══════════════ */}
          {tab === 'inbox' && (
            <div className="space-y-5 max-w-4xl">
              <div className={`${cardCls} p-5`}>
                <div className="flex items-center gap-2 mb-5">
                  <Send size={15} className="text-amber-500" />
                  <h3 className="text-sm font-serif font-semibold text-stone-200">Send Notification</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={inputCls} placeholder="Notification title..." />
                  </div>
                  <div>
                    <label className={labelCls}>Body</label>
                    <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={`${inputCls} resize-none h-20`} placeholder="Message body..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Image URL</label>
                      <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={inputCls} placeholder="https://..." />
                    </div>
                    <div>
                      <label className={labelCls}>Link URL</label>
                      <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={inputCls} placeholder="https://..." />
                    </div>
                    <div>
                      <label className={labelCls}>Target Plan</label>
                      <select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={`${inputCls} cursor-pointer`}>
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif} className={btnPrimary}>
                    <Send size={13} /> {sendingNotif ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications yet" desc="Send your first notification above." />
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className={`flex items-center justify-between p-3.5 ${cardCls}`}>
                      <div>
                        <p className="text-sm font-medium text-stone-200">{n.title}</p>
                        {n.body && <p className="text-xs text-stone-500 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-stone-700 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDeleteNotification(n.id)} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TEMPLATES ══════════════ */}
          {tab === 'templates' && (
            <div className="space-y-5 max-w-5xl">
              <div className={`${cardCls} p-5`}>
                <div className="flex items-center gap-2 mb-5">
                  <Plus size={15} className="text-amber-500" />
                  <h3 className="text-sm font-serif font-semibold text-stone-200">Add Template</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Name *</label>
                      <input value={tplName} onChange={e => setTplName(e.target.value)} className={inputCls} placeholder="Template name..." />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={inputCls} placeholder="general" />
                    </div>
                    <div>
                      <label className={labelCls}>Image URL</label>
                      <input value={tplImage} onChange={e => setTplImage(e.target.value)} className={inputCls} placeholder="https://..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Prompt *</label>
                    <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={`${inputCls} resize-none h-20`} placeholder="AI prompt..." />
                  </div>
                  <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl} className={btnPrimary}>
                    <Plus size={13} /> {savingTpl ? 'Saving...' : 'Add Template'}
                  </button>
                </div>
              </div>
              {templates.length === 0 ? (
                <EmptyState icon={Layers} title="No templates yet" desc="Create your first template above." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {templates.map(tpl => (
                    <div key={tpl.id} className={`group ${cardCls} overflow-hidden hover:border-stone-700/50 transition-colors`}>
                      <div className="aspect-video bg-stone-900/50 flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Layers size={18} className="text-stone-700" />}
                      </div>
                      <div className="p-3 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-stone-200">{tpl.name}</p>
                          <p className="text-[11px] text-stone-600 mt-0.5">{tpl.category}</p>
                        </div>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 transition-opacity">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ BLOG ══════════════ */}
          {tab === 'blog' && <AdminBlogEditor />}

          {/* ══════════════ AI MODELS ══════════════ */}
          {tab === 'ai-models' && (
            <div className="space-y-5 max-w-5xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['free', 'pro', 'business', 'all'].map(plan => {
                  const m = activeModelsByPlan[plan];
                  return (
                    <div key={plan} className={`${cardCls} p-4 ${m ? 'bg-amber-500/5 border-amber-500/10' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-serif font-bold text-stone-600 uppercase tracking-widest">{plan === 'all' ? 'All Plans' : plan}</span>
                        {m && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                      </div>
                      {m ? (
                        <>
                          <p className="text-sm font-semibold text-stone-200 truncate">{m.display_name}</p>
                          <p className="text-[10px] text-stone-600 font-mono truncate mt-0.5">{m.model_id}</p>
                          <span className="inline-block text-[10px] mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium capitalize">{m.provider}</span>
                        </>
                      ) : (
                        <p className="text-xs text-stone-700 italic mt-1">No active model</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={`${cardCls} p-5`}>
                <div className="flex items-center gap-2 mb-5">
                  <Cpu size={15} className="text-amber-500" />
                  <h3 className="text-sm font-serif font-semibold text-stone-200">Add AI Model</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Provider</label>
                        <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
                          <option value="vercel">Vercel AI</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="nvidia">NVIDIA NIM</option>
                          <option value="lovable">Lovable AI</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Target Plan</label>
                        <select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className={`${inputCls} cursor-pointer`}>
                          <option value="all">All Plans</option>
                          <option value="free">Free Only</option>
                          <option value="pro">Pro Only</option>
                          <option value="business">Business Only</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Model ID *</label>
                      <input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className={`${inputCls} font-mono`} placeholder={providerDefaults[aiProvider]?.placeholder} />
                    </div>
                    <div>
                      <label className={labelCls}>Display Name *</label>
                      <input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className={inputCls} placeholder="e.g. Gemini 3 Flash" />
                    </div>
                    <div>
                      <label className={labelCls}>Gateway URL</label>
                      <input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className={`${inputCls} text-xs font-mono`} />
                    </div>
                    <div>
                      <label className={labelCls}>API Key Secret</label>
                      <input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className={`${inputCls} font-mono`} />
                    </div>
                    <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel} className={`${btnPrimary} w-full justify-center`}>
                      <Plus size={13} /> {savingModel ? 'Saving...' : 'Add Model'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className={`${cardCls} p-3.5`}>
                      <p className="text-xs text-amber-500 font-serif font-semibold mb-1">Priority Logic</p>
                      <p className="text-xs text-stone-500 leading-relaxed">Specific plan match first → "All Plans" fallback.</p>
                    </div>
                    <div className={`${cardCls} p-3.5`}>
                      <p className="text-xs text-stone-200 font-serif font-semibold mb-2">Providers</p>
                      <div className="space-y-1">
                        {Object.entries(providerDefaults).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-stone-500 font-medium capitalize">{key}</span>
                            <span className="text-[10px] text-stone-700 font-mono">{val.key}</span>
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
                <div className={`${cardCls} overflow-x-auto`}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800/30">
                        {['Status', 'Provider', 'Model', 'Name', 'Plan', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map(m => (
                        <tr key={m.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${m.is_active ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-800/50 text-stone-600'}`}>
                              {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                              {m.is_active ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-stone-500 capitalize">{m.provider}</td>
                          <td className="px-4 py-3 text-xs font-mono text-amber-500">{m.model_id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-stone-200">{m.display_name}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-800/50 text-stone-500 capitalize">{m.target_plan === 'all' ? 'All' : m.target_plan}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleToggleAiModel(m.id, m.is_active)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${m.is_active ? 'bg-stone-800/50 text-stone-500 hover:bg-stone-800' : 'bg-amber-600 text-white hover:bg-amber-500'}`}>
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDeleteAiModel(m.id)} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                                <Trash2 size={12} />
                              </button>
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
            <div className="space-y-4 max-w-6xl">
              <div className={`${cardCls} overflow-x-auto`}>
                <table className="w-full border-collapse">
                  {tab === 'users' && (
                    <>
                      <thead>
                        <tr className="border-b border-stone-800/30">
                          {['User', 'Email', 'Joined'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map(u => (
                          <tr key={u.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-stone-200">{u.display_name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-stone-500">{u.email || '—'}</td>
                            <td className="px-4 py-3 text-sm text-stone-600 tabular-nums">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'plans' && (
                    <>
                      <thead>
                        <tr className="border-b border-stone-800/30">
                          {['User', 'Plan', 'Daily', 'Used Today', 'Monthly', 'Total'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.plans.map(p => (
                          <tr key={p.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-amber-500">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3"><span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 capitalize">{p.plan}</span></td>
                            <td className="px-4 py-3 text-sm font-medium text-stone-200 tabular-nums">{p.daily_credits}</td>
                            <td className="px-4 py-3 text-sm text-stone-500 tabular-nums">{p.credits_used_today}</td>
                            <td className="px-4 py-3 text-sm font-medium text-stone-200 tabular-nums">{p.monthly_credits}</td>
                            <td className="px-4 py-3 text-sm text-stone-500 tabular-nums">{p.total_credits_used}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'transactions' && (
                    <>
                      <thead>
                        <tr className="border-b border-stone-800/30">
                          {['Date', 'User', 'Credits', 'Type', 'Description'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map(t => (
                          <tr key={t.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                            <td className="px-4 py-3 text-sm text-stone-600 tabular-nums">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs font-mono text-amber-500">{t.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-sm font-medium text-stone-200 tabular-nums">{t.credits_used}</td>
                            <td className="px-4 py-3 text-sm text-stone-500">{t.work_type || '—'}</td>
                            <td className="px-4 py-3 text-sm text-stone-600 max-w-[200px] truncate">{t.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'projects' && (
                    <>
                      <thead>
                        <tr className="border-b border-stone-800/30">
                          {['Project', 'User', 'Type', 'Status', 'Created'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-serif font-semibold text-stone-600 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.projects.map(p => (
                          <tr key={p.id} className="border-b border-stone-800/20 hover:bg-stone-800/10 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-stone-200">{p.name}</td>
                            <td className="px-4 py-3 text-xs font-mono text-amber-500">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-sm text-stone-500">{p.project_type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800/50 text-stone-600'}`}>
                                {p.is_published ? 'Live' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-stone-600 tabular-nums">{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: any; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-xl bg-[#111116] border border-stone-800/40 flex items-center justify-center mb-3">
      <Icon size={22} className="text-stone-700" />
    </div>
    <h3 className="text-sm font-serif font-semibold text-stone-300 mb-1">{title}</h3>
    <p className="text-xs text-stone-600">{desc}</p>
  </div>
);
