import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Layers, Plus, Trash2, Send, Bell, Search,
  BarChart2, Cpu, Home, Rocket, LayoutDashboard,
  Megaphone, BookOpen, Package, ArrowRight,
  Gift, Star, Eye, EyeOff, Copy, Check,
  ChevronLeft, ChevronRight, Menu, X,
  TrendingUp, Activity, Zap, ClipboardList, Shield,
  RefreshCw,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';
import { toast } from '@/hooks/use-toast';

/* ╔══════════════════════════════════════════════════════════╗
   ║                        TYPES                            ║
   ╚══════════════════════════════════════════════════════════╝ */
interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
  onboarding: any[];
}
type TabKey =
  | 'dashboard' | 'users' | 'plans' | 'transactions' | 'projects'
  | 'inbox' | 'templates' | 'blog' | 'ai-models' | 'promo-codes'
  | 'celebrations' | 'onboarding';

/* ╔══════════════════════════════════════════════════════════╗
   ║                    SMALL ATOMS                          ║
   ╚══════════════════════════════════════════════════════════╝ */

const Pill: React.FC<{ color?: 'blue'|'green'|'amber'|'red'|'teal'|'purple'|'muted'; children: React.ReactNode }> = ({ color = 'muted', children }) => {
  const map = {
    blue:   'bg-[#1e3a5f] text-[#60a5fa] ring-1 ring-[#1d4ed8]/30',
    green:  'bg-[#14332a] text-[#34d399] ring-1 ring-[#059669]/30',
    amber:  'bg-[#3b2700] text-[#fbbf24] ring-1 ring-[#d97706]/30',
    red:    'bg-[#3b1515] text-[#f87171] ring-1 ring-[#dc2626]/30',
    teal:   'bg-[#0f2e35] text-[#2dd4bf] ring-1 ring-[#0d9488]/30',
    purple: 'bg-[#2d1b4e] text-[#c084fc] ring-1 ring-[#7c3aed]/30',
    muted:  'bg-[#1a1a1a] text-[#555] ring-1 ring-[#333]/60',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${map[color]}`}>
      {children}
    </span>
  );
};

const Block: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden ${className}`}>
    {children}
  </div>
);

const BlockHeader: React.FC<{ title: string; sub?: string; count?: number; action?: React.ReactNode }> = ({ title, sub, count, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
    <div className="flex items-center gap-3 min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[13px] font-bold text-[#e5e5e5] tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className="text-[10px] font-mono text-[#444] bg-[#151515] border border-[#1f1f1f] px-1.5 py-0.5 rounded">
              {count}
            </span>
          )}
        </div>
        {sub && <p className="text-[11px] text-[#444] mt-0.5">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-mono font-bold text-[#444] uppercase tracking-widest mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-lg text-[13px] text-[#ccc] font-mono placeholder:text-[#333] outline-none focus:border-[#444] focus:ring-1 focus:ring-[#333] transition-colors';
const selectCls = `${inputCls} cursor-pointer`;
const textareaCls = `${inputCls} resize-none`;

const Btn: React.FC<{ onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode; variant?: 'primary'|'danger'|'ghost' }> = ({ onClick, disabled, loading, children, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-[#e5e5e5] text-[#0a0a0a] hover:bg-white disabled:bg-[#1f1f1f] disabled:text-[#444]',
    danger:  'bg-[#1a0808] text-[#f87171] border border-[#2a1010] hover:bg-[#220d0d] disabled:opacity-40',
    ghost:   'bg-transparent text-[#555] border border-[#1f1f1f] hover:bg-[#111] hover:text-[#ccc] disabled:opacity-40',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${styles[variant]} disabled:cursor-not-allowed`}>
      {loading ? <RefreshCw size={12} className="animate-spin" /> : children}
    </button>
  );
};

const IconBtn: React.FC<{ onClick?: () => void; variant?: 'ghost'|'danger'; children: React.ReactNode; title?: string }> = ({ onClick, variant = 'ghost', children, title }) => {
  const styles = { ghost: 'text-[#444] hover:bg-[#151515] hover:text-[#888]', danger: 'text-[#3b1515] hover:bg-[#1c0909] hover:text-[#f87171]' };
  return (
    <button title={title} onClick={onClick} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${styles[variant]}`}>
      {children}
    </button>
  );
};

const Empty: React.FC<{ icon: any; title: string; desc?: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-10 h-10 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-center mb-3">
      <Icon size={18} className="text-[#2a2a2a]" />
    </div>
    <p className="text-[12px] font-bold text-[#333] mb-1">{title}</p>
    {desc && <p className="text-[11px] text-[#282828] text-center max-w-xs">{desc}</p>}
  </div>
);

const KPI: React.FC<{ label: string; value: string|number; icon: any; delta?: string; accent: string }> = ({ label, value, icon: Icon, delta, accent }) => (
  <div className="relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#252525] transition-colors">
    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />
    <div className="pl-5 pr-4 py-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg border border-[#1a1a1a] flex items-center justify-center" style={{ background: `${accent}10` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        {delta && <span className="text-[10px] font-mono text-[#34d399] bg-[#14332a] px-1.5 py-0.5 rounded">{delta}</span>}
      </div>
      <p className="text-[28px] font-black text-[#e5e5e5] leading-none tabular-nums mb-1">{value}</p>
      <p className="text-[10px] font-mono text-[#3a3a3a] uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const THead: React.FC<{ cols: string[] }> = ({ cols }) => (
  <thead>
    <tr className="border-b border-[#151515]">
      {cols.map(c => (
        <th key={c} className="px-4 py-3 text-left text-[9px] font-mono font-bold text-[#333] uppercase tracking-[0.2em] whitespace-nowrap">{c}</th>
      ))}
    </tr>
  </thead>
);
const TRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-[#0f0f0f] hover:bg-[#0f0f0f] transition-colors">{children}</tr>
);
const TD: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-[12px] text-[#555] ${className}`}>{children}</td>
);

/* ╔══════════════════════════════════════════════════════════╗
   ║                   MAIN COMPONENT                        ║
   ╚══════════════════════════════════════════════════════════╝ */
export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      supabase.auth.getSession().then(({ data: d }) => { if (!d.session) navigate('/login'); });
      return;
    }
    (async () => {
      try {
        let { data: sd } = await supabase.auth.getSession();
        if (!sd?.session) { const { data: r } = await supabase.auth.refreshSession(); sd = r; }
        if (!sd?.session) { navigate('/login'); return; }
        const { data: result, error: fnErr } = await supabase.functions.invoke('admin-data', {
          headers: { Authorization: `Bearer ${sd.session.access_token}` },
        });
        if (fnErr) {
          if (fnErr.message?.includes('Unauthorized') || fnErr.message?.includes('401')) { setError('Unauthorized'); return; }
          throw new Error(fnErr.message);
        }
        if (result?.error) { setError(result.error); return; }
        setData(result);
      } catch (e: any) { setError(e.message || 'Failed'); }
      finally { setLoading(false); }
    })();
    fetchAll();
  }, [user, authLoading, navigate]);

  const fetchAll = () => { fetchNotifs(); fetchTpls(); fetchAiMs(); fetchPromos(); fetchCelebs(); };
  const fetchNotifs  = async () => { const { data: d } = await supabase.from('inbox_notifications').select('*').order('created_at', { ascending: false }); if (d) setNotifications(d); };
  const fetchTpls    = async () => { const { data: d } = await supabase.from('templates').select('*').order('sort_order', { ascending: true }); if (d) setTemplates(d); };
  const fetchAiMs    = async () => { const { data: d } = await supabase.from('ai_model_config').select('*').order('created_at', { ascending: false }); if (d) setAiModels(d); };
  const fetchPromos  = async () => { const { data: d } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false }); if (d) setPromoCodes(d); };
  const fetchCelebs  = async () => { const { data: d } = await supabase.from('site_celebrations').select('*').order('name'); if (d) setCelebrations(d); };

  const sendNotif = async () => {
    if (!inboxTitle.trim()) return;
    setSendingNotif(true);
    await supabase.from('inbox_notifications').insert({ title: inboxTitle, body: inboxBody || null, image_url: inboxImage || null, link_url: inboxLink || null, target_plan: inboxPlan, created_by: user?.id });
    setInboxTitle(''); setInboxBody(''); setInboxImage(''); setInboxLink(''); setInboxPlan('all');
    await fetchNotifs(); setSendingNotif(false);
    toast({ title: 'Sent ✓' });
  };
  const deleteNotif  = async (id: string) => { await supabase.from('inbox_notifications').delete().eq('id', id); await fetchNotifs(); };
  const addTemplate  = async () => {
    if (!tplName.trim() || !tplPrompt.trim()) return;
    setSavingTpl(true);
    await supabase.from('templates').insert({ name: tplName, image_url: tplImage || null, prompt: tplPrompt, category: tplCategory, created_by: user?.id, sort_order: templates.length });
    setTplName(''); setTplImage(''); setTplPrompt(''); setTplCategory('general');
    await fetchTpls(); setSavingTpl(false);
    toast({ title: 'Template added ✓' });
  };
  const deleteTpl = async (id: string) => { await supabase.from('templates').delete().eq('id', id); await fetchTpls(); };

  const providerDefs: Record<string, { url: string; key: string; ph: string }> = {
    vercel:     { url: 'https://ai-gateway.vercel.sh/v1/chat/completions',     key: 'VERCEL_AI_API_KEY',  ph: 'google/gemini-3-flash' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',        key: 'OPENROUTER_API_KEY', ph: 'anthropic/claude-sonnet-4' },
    nvidia:     { url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: 'NVIDIA_API_KEY',     ph: 'moonshotai/kimi-k2.5' },
    lovable:    { url: 'https://ai.gateway.lovable.dev/v1/chat/completions',   key: 'LOVABLE_API_KEY',    ph: 'google/gemini-2.5-flash' },
  };
  const changeProvider = (p: string) => { setAiProvider(p); const d = providerDefs[p]; if (d) { setAiGatewayUrl(d.url); setAiKeySecretName(d.key); setAiModelId(''); } };
  const addAiModel = async () => {
    if (!aiModelId.trim() || !aiDisplayName.trim()) return;
    setSavingModel(true);
    await supabase.from('ai_model_config').insert({ provider: aiProvider, model_id: aiModelId, display_name: aiDisplayName, gateway_url: aiGatewayUrl, api_key_secret_name: aiKeySecretName, target_plan: aiTargetPlan, is_active: false, created_by: user?.id });
    setAiModelId(''); setAiDisplayName('');
    await fetchAiMs(); setSavingModel(false);
    toast({ title: 'Model added ✓' });
  };
  const toggleAiModel = async (id: string, cur: boolean) => {
    if (!cur) {
      const m = aiModels.find(x => x.id === id);
      if (m) {
        const ids = aiModels.filter(x => x.id !== id && x.is_active && x.target_plan === m.target_plan).map(x => x.id);
        if (ids.length) await supabase.from('ai_model_config').update({ is_active: false }).in('id', ids);
      }
    }
    await supabase.from('ai_model_config').update({ is_active: !cur }).eq('id', id);
    await fetchAiMs();
  };
  const deleteAiModel = async (id: string) => { await supabase.from('ai_model_config').delete().eq('id', id); await fetchAiMs(); };
  const addPromo = async () => {
    if (!promoCode.trim()) return;
    setSavingPromo(true);
    await supabase.from('promo_codes').insert({ code: promoCode.toUpperCase().trim(), discount_percent: promoDiscount, target_plan: promoPlan, is_public: promoPublic, max_uses: promoMaxUses ? parseInt(promoMaxUses) : null, expires_at: promoExpires || null, created_by: user?.id });
    setPromoCode(''); setPromoDiscount(10); setPromoPlan('all'); setPromoPublic(false); setPromoMaxUses(''); setPromoExpires('');
    await fetchPromos(); setSavingPromo(false);
    toast({ title: 'Promo created ✓' });
  };
  const deletePromo  = async (id: string) => { await supabase.from('promo_codes').delete().eq('id', id); await fetchPromos(); };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };
  const toggleCeleb  = async (id: string, cur: boolean) => {
    await supabase.from('site_celebrations').update({ is_active: !cur, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchCelebs();
    toast({ title: `${cur ? 'Deactivated' : 'Activated'} ✓` });
  };

  const activeByPlan = useMemo(() => {
    const m: Record<string, any> = {};
    aiModels.filter(x => x.is_active).forEach(x => { m[x.target_plan] = x; });
    return m;
  }, [aiModels]);

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#080808]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border border-[#222] border-t-[#555] rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono text-[#2a2a2a] uppercase tracking-[0.4em]">Loading</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#080808]">
      <div className="max-w-sm w-full mx-4">
        <Block className="p-8 text-center">
          <div className="w-12 h-12 rounded-xl border border-[#2a1010] bg-[#150808] flex items-center justify-center mx-auto mb-5">
            <Shield size={20} className="text-[#f87171]" />
          </div>
          <p className="text-[10px] font-mono text-[#f87171] uppercase tracking-widest mb-2">Access Denied</p>
          <h2 className="text-[16px] font-black text-[#e5e5e5] mb-2">{error}</h2>
          <p className="text-[12px] text-[#333] mb-6 leading-relaxed">You don't have permission to access this console.</p>
          <Btn onClick={() => navigate('/')} variant="ghost">Return to App</Btn>
        </Block>
      </div>
    </div>
  );

  if (!data) return null;

  const nav: { group: string; items: { key: TabKey; label: string; icon: any; count?: number }[] }[] = [
    { group: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { group: 'Data', items: [
      { key: 'users',        label: 'Users',      icon: Users,         count: data.users.length },
      { key: 'projects',     label: 'Projects',   icon: FolderOpen,    count: data.projects.length },
      { key: 'transactions', label: 'Analytics',  icon: BarChart2 },
      { key: 'plans',        label: 'Plans',      icon: CreditCard,    count: data.plans.length },
      { key: 'onboarding',   label: 'Onboarding', icon: ClipboardList, count: data.onboarding?.length || 0 },
    ]},
    { group: 'Config', items: [
      { key: 'ai-models',    label: 'AI Models',  icon: Cpu,      count: aiModels.length },
      { key: 'promo-codes',  label: 'Promos',     icon: Gift,     count: promoCodes.length },
      { key: 'celebrations', label: 'Seasons',    icon: Star },
    ]},
    { group: 'Content', items: [
      { key: 'templates', label: 'Templates',     icon: Package,   count: templates.length },
      { key: 'inbox',     label: 'Notifications', icon: Megaphone, count: notifications.length },
      { key: 'blog',      label: 'Blog',          icon: BookOpen },
    ]},
  ];

  const displayName = data.users.find((u: any) => u.user_id === user?.id)?.display_name || user?.email?.split('@')[0] || 'Admin';
  const totalCredits = data.transactions.reduce((s: number, t: any) => s + (Number(t.credits_used) || 0), 0);
  const activeTabLabel = nav.flatMap(g => g.items).find(i => i.key === tab)?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#111]">
        <div className="w-7 h-7 rounded-lg bg-[#e5e5e5] flex items-center justify-center flex-shrink-0">
          <Rocket size={12} className="text-[#0a0a0a]" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-[13px] font-black text-[#e5e5e5] leading-none">Vivora X</p>
            <p className="text-[9px] font-mono text-[#333] uppercase tracking-wider mt-0.5">Console</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {nav.map(group => (
          <div key={group.group}>
            {sidebarOpen && (
              <p className="text-[8px] font-mono font-black text-[#252525] uppercase tracking-[0.35em] px-2 mb-1.5">{group.group}</p>
            )}
            <div className="space-y-px">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setTab(item.key); setMobileOpen(false); }}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                      active ? 'bg-[#e5e5e5] text-[#0a0a0a]' : 'text-[#3a3a3a] hover:bg-[#111] hover:text-[#aaa]'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <Icon size={13} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${active ? 'bg-[#0a0a0a]/10 text-[#0a0a0a]' : 'bg-[#151515] text-[#333]'}`}>
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

      <div className="border-t border-[#111] p-2 space-y-px">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-[#2a2a2a] hover:bg-[#111] hover:text-[#555] transition-all ${!sidebarOpen ? 'justify-center' : ''}`}>
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          {sidebarOpen && <span>Collapse</span>}
        </button>
        <button onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-[#2a2a2a] hover:bg-[#111] hover:text-[#555] transition-all ${!sidebarOpen ? 'justify-center' : ''}`}>
          <Home size={12} />
          {sidebarOpen && <span>Back to App</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080808] text-[#e5e5e5] overflow-hidden" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" }}>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 w-56 bg-[#080808] border-r border-[#111] flex flex-col transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 border-r border-[#111] bg-[#080808] transition-all duration-300 ${sidebarOpen ? 'w-[200px]' : 'w-[52px]'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-[#111] bg-[#080808]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg text-[#333] hover:text-[#666] hover:bg-[#111] transition-colors">
              <Menu size={14} />
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-[#222]">admin</span>
              <span className="text-[#1a1a1a]">/</span>
              <span className="text-[#555] font-bold">{activeTabLabel.toLowerCase().replace(' ', '_')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg w-44 focus-within:border-[#2a2a2a] transition-colors">
              <Search size={11} className="text-[#2a2a2a] flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="search..."
                className="bg-transparent outline-none text-[11px] font-mono text-[#666] w-full placeholder:text-[#222]" />
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
              <div className="w-5 h-5 rounded-md bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-[9px] font-black text-[#666]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-mono text-[#444] hidden sm:block">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="p-5 md:p-7 max-w-7xl">

              {/* ══════ DASHBOARD ══════ */}
              {tab === 'dashboard' && (
                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-[#2a2a2a] uppercase tracking-[0.35em] mb-1">vivora_x / console</p>
                      <h1 className="text-[22px] font-black text-[#e5e5e5] leading-none">
                        gm, <span className="text-[#555]">{displayName}</span>
                      </h1>
                    </div>
                    <Btn variant="ghost" onClick={fetchAll}><RefreshCw size={11} /> Refresh</Btn>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KPI label="Total Users"  value={data.users.length}       icon={Users}    accent="#3b82f6" delta={data.users.length > 0 ? `+${Math.min(data.users.length,12)}` : undefined} />
                    <KPI label="Projects"     value={data.projects.length}    icon={FolderOpen} accent="#10b981" />
                    <KPI label="Credits Used" value={totalCredits.toFixed(0)} icon={Zap}      accent="#a855f7" />
                    <KPI label="Active Plans" value={data.plans.length}       icon={Activity} accent="#f59e0b" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Block>
                      <BlockHeader title="Active Models" sub="Per-plan AI routing"
                        action={<button onClick={() => setTab('ai-models')} className="flex items-center gap-1 text-[10px] font-mono text-[#333] hover:text-[#666] transition-colors">manage <ArrowRight size={10} /></button>}
                      />
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {['free','pro','business','all'].map(plan => {
                          const m = activeByPlan[plan];
                          return (
                            <div key={plan} className={`rounded-lg p-3 border transition-colors ${m ? 'border-[#1f2a1f] bg-[#0d150d]' : 'border-[#111] bg-[#0a0a0a]'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[8px] font-mono font-black text-[#2a2a2a] uppercase tracking-widest">{plan === 'all' ? 'all plans' : plan}</span>
                                {m && <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />}
                              </div>
                              {m
                                ? <><p className="text-[11px] font-bold text-[#888] truncate">{m.display_name}</p><p className="text-[9px] font-mono text-[#333] truncate mt-0.5">{m.model_id}</p></>
                                : <p className="text-[10px] text-[#222] italic">not configured</p>
                              }
                            </div>
                          );
                        })}
                      </div>
                    </Block>

                    <Block>
                      <BlockHeader title="Recent Users" count={data.users.length}
                        action={<button onClick={() => setTab('users')} className="text-[10px] font-mono text-[#333] hover:text-[#666] transition-colors flex items-center gap-1">all <ArrowRight size={10} /></button>}
                      />
                      <div className="divide-y divide-[#0f0f0f]">
                        {data.users.slice(0, 5).map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#0c0c0c] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-[10px] font-black text-[#444] flex-shrink-0">
                                {(u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-[#666] truncate">{u.display_name || u.email || '—'}</p>
                                <p className="text-[10px] font-mono text-[#2a2a2a] truncate">{u.email}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-[#222] flex-shrink-0">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </Block>
                  </div>

                  {celebrations.some(c => c.is_active) && (
                    <Block>
                      <BlockHeader title="Active Celebrations" />
                      <div className="p-4 flex flex-wrap gap-2">
                        {celebrations.filter(c => c.is_active).map(c => (
                          <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2500] bg-[#150f00]">
                            <span className="text-lg">{c.config?.emoji || '🎉'}</span>
                            <span className="text-[12px] font-bold text-[#fbbf24]">{c.config?.label || c.name}</span>
                          </div>
                        ))}
                      </div>
                    </Block>
                  )}

                  <Block>
                    <BlockHeader title="Recent Projects" count={data.projects.length}
                      action={<button onClick={() => setTab('projects')} className="text-[10px] font-mono text-[#333] hover:text-[#666] transition-colors flex items-center gap-1">all <ArrowRight size={10} /></button>}
                    />
                    <div className="divide-y divide-[#0f0f0f]">
                      {data.projects.slice(0, 4).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#0c0c0c] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                              <FolderOpen size={11} className="text-[#333]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-[#666] truncate">{p.name}</p>
                              <p className="text-[10px] font-mono text-[#2a2a2a] capitalize">{p.project_type}</p>
                            </div>
                          </div>
                          <Pill color={p.is_published ? 'green' : 'muted'}>{p.is_published ? 'live' : 'draft'}</Pill>
                        </div>
                      ))}
                    </div>
                  </Block>
                </div>
              )}

              {/* ══════ ONBOARDING ══════ */}
              {tab === 'onboarding' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">Onboarding Responses</h1>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['founder','engineer','designer','product'].map(role => (
                      <Block key={role} className="p-4">
                        <p className="text-[8px] font-mono font-black text-[#2a2a2a] uppercase tracking-widest mb-2">{role}</p>
                        <p className="text-[28px] font-black text-[#e5e5e5] tabular-nums">{data.onboarding?.filter((o:any)=>o.role===role).length||0}</p>
                      </Block>
                    ))}
                  </div>
                  {(!data.onboarding || !data.onboarding.length)
                    ? <Empty icon={ClipboardList} title="No onboarding data yet" />
                    : <Block>
                        <table className="w-full border-collapse">
                          <THead cols={['Name','Role','Company','Theme','Date']} />
                          <tbody>
                            {data.onboarding.map((o:any)=>(
                              <TRow key={o.id}>
                                <TD className="text-[#888] font-semibold">{o.full_name||'—'}</TD>
                                <TD><Pill color="teal">{o.role||'—'}</Pill></TD>
                                <TD>{o.company_size||'—'}</TD>
                                <TD><Pill color={o.preferred_theme==='dark'?'muted':'amber'}>{o.preferred_theme||'—'}</Pill></TD>
                                <TD className="font-mono">{new Date(o.created_at).toLocaleDateString()}</TD>
                              </TRow>
                            ))}
                          </tbody>
                        </table>
                      </Block>
                  }
                </div>
              )}

              {/* ══════ PROMO CODES ══════ */}
              {tab === 'promo-codes' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">Promo Codes</h1>
                  <Block>
                    <BlockHeader title="Create Code" />
                    <div className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <Field label="Code *"><input value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} className={inputCls} placeholder="SUMMER25" /></Field>
                        <Field label="Discount %"><input type="number" value={promoDiscount} onChange={e=>setPromoDiscount(Number(e.target.value))} min={1} max={100} className={inputCls} /></Field>
                        <Field label="Target Plan"><select value={promoPlan} onChange={e=>setPromoPlan(e.target.value)} className={selectCls}><option value="all">All Plans</option><option value="pro">Pro Only</option><option value="business">Business Only</option></select></Field>
                        <Field label="Max Uses"><input type="number" value={promoMaxUses} onChange={e=>setPromoMaxUses(e.target.value)} className={inputCls} placeholder="100" /></Field>
                        <Field label="Expires At"><input type="datetime-local" value={promoExpires} onChange={e=>setPromoExpires(e.target.value)} className={inputCls} /></Field>
                        <Field label="Visibility">
                          <label className="flex items-center gap-2.5 cursor-pointer h-[40px]">
                            <input type="checkbox" checked={promoPublic} onChange={e=>setPromoPublic(e.target.checked)} className="w-3.5 h-3.5 rounded border-[#222] bg-[#0a0a0a] accent-[#e5e5e5]" />
                            <span className="text-[12px] font-mono text-[#444]">Make public</span>
                          </label>
                        </Field>
                      </div>
                      <Btn onClick={addPromo} disabled={!promoCode.trim()} loading={savingPromo}><Plus size={11}/> Create Code</Btn>
                    </div>
                  </Block>
                  {!promoCodes.length ? <Empty icon={Gift} title="No codes yet" /> : (
                    <Block>
                      <table className="w-full border-collapse">
                        <THead cols={['Code','Discount','Plan','Type','Uses','Expires','']} />
                        <tbody>
                          {promoCodes.map(p=>(
                            <TRow key={p.id}>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-[#888]">{p.code}</span>
                                  <button onClick={()=>copyCode(p.code)} className="text-[#2a2a2a] hover:text-[#555] transition-colors">
                                    {copiedCode===p.code?<Check size={10} className="text-[#34d399]"/>:<Copy size={10}/>}
                                  </button>
                                </div>
                              </TD>
                              <TD><span className="font-black text-[#34d399]">{p.discount_percent}%</span></TD>
                              <TD><Pill color="teal">{p.target_plan}</Pill></TD>
                              <TD><Pill color={p.is_public?'green':'muted'}>{p.is_public?'public':'private'}</Pill></TD>
                              <TD className="font-mono">{p.current_uses}{p.max_uses?`/${p.max_uses}`:''}</TD>
                              <TD className="font-mono text-[#2a2a2a]">{p.expires_at?new Date(p.expires_at).toLocaleDateString():'∞'}</TD>
                              <TD><IconBtn onClick={()=>deletePromo(p.id)} variant="danger"><Trash2 size={12}/></IconBtn></TD>
                            </TRow>
                          ))}
                        </tbody>
                      </table>
                    </Block>
                  )}
                </div>
              )}

              {/* ══════ CELEBRATIONS ══════ */}
              {tab === 'celebrations' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">Seasonal Celebrations</h1>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {celebrations.map(c=>(
                      <Block key={c.id} className={c.is_active ? '!border-[#2a2500]' : ''}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{c.config?.emoji||'🎉'}</span>
                              <div>
                                <p className="text-[13px] font-bold text-[#ccc]">{c.config?.label||c.name}</p>
                                <p className="text-[10px] font-mono text-[#333] mt-0.5">{c.name}</p>
                              </div>
                            </div>
                            {c.is_active && <Pill color="amber">active</Pill>}
                          </div>
                          <button onClick={()=>toggleCeleb(c.id,c.is_active)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all ${c.is_active?'bg-[#111] text-[#444] border border-[#1a1a1a] hover:border-[#222] hover:text-[#666]':'bg-[#e5e5e5] text-[#0a0a0a] hover:bg-white'}`}>
                            {c.is_active?<><EyeOff size={12}/> Deactivate</>:<><Eye size={12}/> Activate</>}
                          </button>
                        </div>
                      </Block>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════ INBOX ══════ */}
              {tab === 'inbox' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">Notifications</h1>
                  <Block>
                    <BlockHeader title="Send Notification" />
                    <div className="p-5 space-y-4">
                      <Field label="Title *"><input value={inboxTitle} onChange={e=>setInboxTitle(e.target.value)} className={inputCls} placeholder="Notification title..." /></Field>
                      <Field label="Body"><textarea value={inboxBody} onChange={e=>setInboxBody(e.target.value)} className={`${textareaCls} h-20`} placeholder="Message..." /></Field>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Image URL"><input value={inboxImage} onChange={e=>setInboxImage(e.target.value)} className={inputCls} placeholder="https://..." /></Field>
                        <Field label="Link URL"><input value={inboxLink} onChange={e=>setInboxLink(e.target.value)} className={inputCls} placeholder="https://..." /></Field>
                        <Field label="Target"><select value={inboxPlan} onChange={e=>setInboxPlan(e.target.value)} className={selectCls}><option value="all">All</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></Field>
                      </div>
                      <Btn onClick={sendNotif} disabled={!inboxTitle.trim()} loading={sendingNotif}><Send size={11}/> Send</Btn>
                    </div>
                  </Block>
                  {!notifications.length ? <Empty icon={Bell} title="No notifications sent yet" /> : (
                    <div className="space-y-1.5">
                      {notifications.map(n=>(
                        <Block key={n.id}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell size={11} className="text-[#333]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold text-[#888] truncate">{n.title}</p>
                                {n.body && <p className="text-[11px] text-[#333] mt-0.5 truncate">{n.body}</p>}
                                <p className="text-[9px] font-mono text-[#222] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <IconBtn onClick={()=>deleteNotif(n.id)} variant="danger"><Trash2 size={11}/></IconBtn>
                          </div>
                        </Block>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════ TEMPLATES ══════ */}
              {tab === 'templates' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">Templates</h1>
                  <Block>
                    <BlockHeader title="Add Template" />
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Name *"><input value={tplName} onChange={e=>setTplName(e.target.value)} className={inputCls} placeholder="Template name..." /></Field>
                        <Field label="Category"><input value={tplCategory} onChange={e=>setTplCategory(e.target.value)} className={inputCls} placeholder="general" /></Field>
                        <Field label="Image URL"><input value={tplImage} onChange={e=>setTplImage(e.target.value)} className={inputCls} placeholder="https://..." /></Field>
                      </div>
                      <Field label="Prompt *"><textarea value={tplPrompt} onChange={e=>setTplPrompt(e.target.value)} className={`${textareaCls} h-24`} placeholder="AI prompt..." /></Field>
                      <Btn onClick={addTemplate} disabled={!tplName.trim()||!tplPrompt.trim()} loading={savingTpl}><Plus size={11}/> Add Template</Btn>
                    </div>
                  </Block>
                  {!templates.length ? <Empty icon={Layers} title="No templates yet" /> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {templates.map(tpl=>(
                        <motion.div key={tpl.id} whileHover={{ y: -2 }} className="group">
                          <Block className="overflow-hidden hover:!border-[#252525] transition-colors">
                            <div className="aspect-video bg-[#090909] flex items-center justify-center overflow-hidden">
                              {tpl.image_url
                                ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"/>
                                : <Layers size={18} className="text-[#1a1a1a]"/>
                              }
                            </div>
                            <div className="px-3 py-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[#666] truncate">{tpl.name}</p>
                                <p className="text-[9px] font-mono text-[#2a2a2a] capitalize mt-0.5">{tpl.category}</p>
                              </div>
                              <IconBtn onClick={()=>deleteTpl(tpl.id)} variant="danger"><Trash2 size={11}/></IconBtn>
                            </div>
                          </Block>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════ BLOG ══════ */}
              {tab === 'blog' && <AdminBlogEditor />}

              {/* ══════ AI MODELS ══════ */}
              {tab === 'ai-models' && (
                <div className="space-y-5">
                  <h1 className="text-[18px] font-black text-[#e5e5e5]">AI Models</h1>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['free','pro','business','all'].map(plan=>{
                      const m = activeByPlan[plan];
                      return (
                        <Block key={plan} className={m ? '!border-[#1f2a1f]' : ''}>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-mono font-black text-[#2a2a2a] uppercase tracking-widest">{plan==='all'?'all plans':plan}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${m?'bg-[#34d399]':'bg-[#1a1a1a]'}`} />
                            </div>
                            {m?<><p className="text-[11px] font-bold text-[#666] truncate">{m.display_name}</p><p className="text-[9px] font-mono text-[#2a2a2a] truncate mt-0.5">{m.model_id}</p></>
                              :<p className="text-[10px] text-[#222] italic">not set</p>}
                          </div>
                        </Block>
                      );
                    })}
                  </div>

                  <Block>
                    <BlockHeader title="Add AI Model" />
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Provider"><select value={aiProvider} onChange={e=>changeProvider(e.target.value)} className={selectCls}><option value="vercel">Vercel AI</option><option value="openrouter">OpenRouter</option><option value="nvidia">NVIDIA NIM</option><option value="lovable">Lovable AI</option></select></Field>
                            <Field label="Target Plan"><select value={aiTargetPlan} onChange={e=>setAiTargetPlan(e.target.value)} className={selectCls}><option value="all">All Plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></Field>
                          </div>
                          <Field label="Model ID *"><input value={aiModelId} onChange={e=>setAiModelId(e.target.value)} className={inputCls} placeholder={providerDefs[aiProvider]?.ph} /></Field>
                          <Field label="Display Name *"><input value={aiDisplayName} onChange={e=>setAiDisplayName(e.target.value)} className={inputCls} placeholder="Gemini 3 Flash" /></Field>
                          <Field label="Gateway URL"><input value={aiGatewayUrl} onChange={e=>setAiGatewayUrl(e.target.value)} className={inputCls} /></Field>
                          <Field label="API Key Secret"><input value={aiKeySecretName} onChange={e=>setAiKeySecretName(e.target.value)} className={inputCls} /></Field>
                          <Btn onClick={addAiModel} disabled={!aiModelId.trim()||!aiDisplayName.trim()} loading={savingModel}><Plus size={11}/> Add Model</Btn>
                        </div>
                        <div className="space-y-3">
                          <Block className="!bg-[#090909]">
                            <div className="p-4">
                              <p className="text-[9px] font-mono font-black text-[#34d399] uppercase tracking-widest mb-2">Priority Logic</p>
                              <p className="text-[11px] text-[#2a2a2a] leading-relaxed">Specific plan match → "all plans" fallback. Only one model active per plan slot.</p>
                            </div>
                          </Block>
                          <Block className="!bg-[#090909]">
                            <div className="p-4">
                              <p className="text-[9px] font-mono font-black text-[#333] uppercase tracking-widest mb-3">Providers</p>
                              <div className="space-y-2">
                                {Object.entries(providerDefs).map(([k,v])=>(
                                  <div key={k} className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-[#2a2a2a] capitalize">{k}</span>
                                    <span className="text-[9px] font-mono text-[#1e1e1e]">{v.key}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Block>
                        </div>
                      </div>
                    </div>
                  </Block>

                  {!aiModels.length ? <Empty icon={Cpu} title="No models configured" /> : (
                    <Block>
                      <table className="w-full border-collapse">
                        <THead cols={['Status','Provider','Model ID','Name','Plan','']} />
                        <tbody>
                          {aiModels.map(m=>(
                            <TRow key={m.id}>
                              <TD>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${m.is_active?'bg-[#34d399]':'bg-[#1f1f1f]'}`} />
                                  <span className="text-[10px] font-mono text-[#333]">{m.is_active?'active':'off'}</span>
                                </div>
                              </TD>
                              <TD className="capitalize font-mono">{m.provider}</TD>
                              <TD><span className="font-mono text-[#555]">{m.model_id}</span></TD>
                              <TD className="text-[#888] font-semibold">{m.display_name}</TD>
                              <TD><Pill color="muted">{m.target_plan==='all'?'all':m.target_plan}</Pill></TD>
                              <TD>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={()=>toggleAiModel(m.id,m.is_active)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${m.is_active?'bg-[#111] text-[#333] hover:text-[#666]':'bg-[#e5e5e5] text-[#0a0a0a] hover:bg-white'}`}>
                                    {m.is_active?'deactivate':'activate'}
                                  </button>
                                  <IconBtn onClick={()=>deleteAiModel(m.id)} variant="danger"><Trash2 size={11}/></IconBtn>
                                </div>
                              </TD>
                            </TRow>
                          ))}
                        </tbody>
                      </table>
                    </Block>
                  )}
                </div>
              )}

              {/* ══════ DATA TABLES ══════ */}
              {(['users','plans','transactions','projects'] as TabKey[]).includes(tab) && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h1 className="text-[18px] font-black text-[#e5e5e5]">{activeTabLabel}</h1>
                    <Pill color="muted">
                      {tab==='users'?data.users.length:tab==='plans'?data.plans.length:tab==='projects'?data.projects.length:data.transactions.length} rows
                    </Pill>
                  </div>
                  <Block>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#151515]">
                          {tab==='users'&&['','Email','Name','Joined'].map(h=><th key={h} className="px-4 py-3 text-left text-[9px] font-mono font-black text-[#2a2a2a] uppercase tracking-[0.2em]">{h}</th>)}
                          {tab==='plans'&&['User','Plan','Daily','Used Today','Total','Expires'].map(h=><th key={h} className="px-4 py-3 text-left text-[9px] font-mono font-black text-[#2a2a2a] uppercase tracking-[0.2em]">{h}</th>)}
                          {tab==='transactions'&&['User','Credits','Model','Type','Date'].map(h=><th key={h} className="px-4 py-3 text-left text-[9px] font-mono font-black text-[#2a2a2a] uppercase tracking-[0.2em]">{h}</th>)}
                          {tab==='projects'&&['Name','Type','Status','Created'].map(h=><th key={h} className="px-4 py-3 text-left text-[9px] font-mono font-black text-[#2a2a2a] uppercase tracking-[0.2em]">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tab==='users'&&data.users.filter(u=>!searchQuery||JSON.stringify(u).toLowerCase().includes(searchQuery.toLowerCase())).map((u:any)=>(
                          <TRow key={u.id}>
                            <TD><div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-[9px] font-black text-[#444]">{(u.email||'?')[0].toUpperCase()}</div></TD>
                            <TD className="font-mono text-[#555]">{u.email||'—'}</TD>
                            <TD className="text-[#888] font-semibold">{u.display_name||'—'}</TD>
                            <TD className="font-mono">{new Date(u.created_at).toLocaleDateString()}</TD>
                          </TRow>
                        ))}
                        {tab==='plans'&&data.plans.filter(p=>!searchQuery||JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p:any)=>(
                          <TRow key={p.id}>
                            <TD className="font-mono">{p.user_id?.slice(0,8)}</TD>
                            <TD><Pill color={p.plan==='pro'?'blue':p.plan==='business'?'amber':'muted'}>{p.plan}</Pill></TD>
                            <TD className="font-mono">{p.daily_credits}</TD>
                            <TD className="font-mono">{p.credits_used_today}</TD>
                            <TD className="font-mono">{p.total_credits_used}</TD>
                            <TD className="font-mono">{p.subscription_expires_at?new Date(p.subscription_expires_at).toLocaleDateString():'—'}</TD>
                          </TRow>
                        ))}
                        {tab==='transactions'&&data.transactions.filter(t=>!searchQuery||JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())).map((t:any)=>(
                          <TRow key={t.id}>
                            <TD className="font-mono">{t.user_id?.slice(0,8)}</TD>
                            <TD><span className="font-black text-[#a855f7] font-mono">{t.credits_used}</span></TD>
                            <TD className="font-mono text-[#333]">{t.model_used||'—'}</TD>
                            <TD><Pill color="muted">{t.work_type||'—'}</Pill></TD>
                            <TD className="font-mono">{new Date(t.created_at).toLocaleString()}</TD>
                          </TRow>
                        ))}
                        {tab==='projects'&&data.projects.filter(p=>!searchQuery||JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p:any)=>(
                          <TRow key={p.id}>
                            <TD className="text-[#888] font-bold">{p.name}</TD>
                            <TD className="capitalize">{p.project_type}</TD>
                            <TD><Pill color={p.is_published?'green':'muted'}>{p.is_published?'published':'draft'}</Pill></TD>
                            <TD className="font-mono">{new Date(p.created_at).toLocaleDateString()}</TD>
                          </TRow>
                        ))}
                      </tbody>
                    </table>
                  </Block>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
