import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CreditCard, FolderOpen,
  Layers, Plus, Trash2, Send, Bell, Search,
  BarChart2, Cpu, Home, Rocket, LayoutDashboard,
  Megaphone, BookOpen, Package, ArrowRight,
  Gift, Star, Eye, EyeOff, Copy, Check,
  ChevronLeft, ChevronRight, Menu,
  Activity, Zap, ClipboardList, Shield,
  RefreshCw, Settings, LogOut, MessageCircle, Coins,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';
import { AdminProjectViewer } from '@/components/admin/AdminProjectViewer';
import { toast } from '@/hooks/use-toast';

/* ================================================================
   TYPES
================================================================ */
interface AdminData {
  users: any[]; plans: any[]; transactions: any[];
  projects: any[]; onboarding: any[];
}
type TabKey =
  | 'dashboard' | 'users' | 'plans' | 'transactions' | 'projects'
  | 'inbox' | 'templates' | 'blog' | 'ai-models' | 'promo-codes'
  | 'celebrations' | 'onboarding' | 'feedback' | 'messages' | 'extra-points';

/* ================================================================
   DESIGN SYSTEM
================================================================ */
// Notion-like neutral palette
const C = {
  bg:       '#ffffff',
  bgSub:    '#f7f6f3',
  bgHover:  '#f1f0ed',
  bgActive: '#e9e8e4',
  border:   '#e3e2de',
  borderSub:'#d5d4d0',
  text:     '#191919',
  textSub:  '#6b6b6b',
  textMuted:'#9b9a97',
  sidebar:  '#f7f6f3',
};

// Solid filled KPI colors (Notion-style accent blocks)
const KPI_COLORS = [
  { bg: '#2383e2', text: '#ffffff', label: 'Total Users' },
  { bg: '#0f7b6c', text: '#ffffff', label: 'Projects' },
  { bg: '#9065b0', text: '#ffffff', label: 'Credits Used' },
  { bg: '#e03e3e', text: '#ffffff', label: 'Active Plans' },
];

/* ================================================================
   ATOMS
================================================================ */

/** Notion-style status tag */
const Tag: React.FC<{ color?: 'blue'|'green'|'orange'|'red'|'purple'|'gray'|'teal'; children: React.ReactNode }> = ({ color = 'gray', children }) => {
  const s: Record<string, string> = {
    blue:   'bg-[#dbeafe] text-[#1e40af]',
    green:  'bg-[#dcfce7] text-[#166534]',
    orange: 'bg-[#ffedd5] text-[#9a3412]',
    red:    'bg-[#fee2e2] text-[#991b1b]',
    purple: 'bg-[#ede9fe] text-[#5b21b6]',
    gray:   'bg-[#f3f4f6] text-[#374151]',
    teal:   'bg-[#ccfbf1] text-[#115e59]',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${s[color]}`}>{children}</span>;
};

/** Card shell */
const Card: React.FC<{ children: React.ReactNode; className?: string; pad?: boolean }> = ({ children, className = '', pad = false }) => (
  <div className={`rounded-lg border border-[#e3e2de] bg-white ${pad ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

/** Section header inside a card */
const CardHead: React.FC<{ title: string; sub?: string; count?: number|string; right?: React.ReactNode }> = ({ title, sub, count, right }) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e3e2de]">
    <div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-[#191919]">{title}</span>
        {count !== undefined && (
          <span className="text-[11px] text-[#9b9a97] bg-[#f3f4f6] px-1.5 py-0.5 rounded font-medium">{count}</span>
        )}
      </div>
      {sub && <p className="text-[11px] text-[#9b9a97] mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
);

/** Ghost text button */
const GhostLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="text-[12px] text-[#6b6b6b] hover:text-[#191919] flex items-center gap-1 transition-colors font-medium">
    {children}
  </button>
);

/** Filled button */
const Btn: React.FC<{ onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode; variant?: 'solid'|'ghost'|'danger'; size?: 'sm'|'md' }> = ({
  onClick, disabled, loading, children, variant = 'solid', size = 'md'
}) => {
  const v = {
    solid:  'bg-[#2383e2] text-white hover:bg-[#1a6ec2] disabled:bg-[#93c5fd] disabled:cursor-not-allowed',
    ghost:  'bg-transparent text-[#6b6b6b] border border-[#e3e2de] hover:bg-[#f7f6f3] hover:text-[#191919] disabled:opacity-50',
    danger: 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] disabled:opacity-50',
  };
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-[12px]';
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-all ${v[variant]} ${sz}`}>
      {loading ? <RefreshCw size={11} className="animate-spin" /> : children}
    </button>
  );
};

/** Icon-only button */
const IconBtn: React.FC<{ onClick?: () => void; danger?: boolean; title?: string; children: React.ReactNode }> = ({ onClick, danger, title, children }) => (
  <button onClick={onClick} title={title}
    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${danger ? 'text-[#c0392b] hover:bg-[#fee2e2]' : 'text-[#9b9a97] hover:bg-[#f1f0ed] hover:text-[#191919]'}`}>
    {children}
  </button>
);

/** Form field */
const Field: React.FC<{ label: string; children: React.ReactNode; col?: boolean }> = ({ label, children, col }) => (
  <div className={col ? 'col-span-full' : ''}>
    <label className="block text-[11px] font-semibold text-[#6b6b6b] mb-1.5 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2 bg-white border border-[#e3e2de] rounded-md text-[13px] text-[#191919] placeholder:text-[#c4c3bf] outline-none focus:border-[#2383e2] focus:ring-2 focus:ring-[#2383e2]/20 transition-all';
const selectCls = `${inputCls} cursor-pointer`;
const textareaCls = `${inputCls} resize-none`;

/** Empty state */
const Empty: React.FC<{ icon: any; title: string; desc?: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-xl bg-[#f7f6f3] border border-[#e3e2de] flex items-center justify-center mb-3">
      <Icon size={20} className="text-[#c4c3bf]" />
    </div>
    <p className="text-[13px] font-semibold text-[#6b6b6b] mb-1">{title}</p>
    {desc && <p className="text-[12px] text-[#9b9a97] max-w-xs">{desc}</p>}
  </div>
);

/** Solid filled KPI card */
const KpiCard: React.FC<{ label: string; value: string|number; icon: any; bg: string; textColor: string; delta?: string }> = ({
  label, value, icon: Icon, bg, textColor, delta
}) => (
  <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="rounded-xl p-5 flex flex-col justify-between min-h-[120px] cursor-default select-none"
    style={{ background: bg }}>
    <div className="flex items-start justify-between">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <Icon size={17} style={{ color: textColor }} />
      </div>
      {delta && (
        <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.2)', color: textColor }}>
          {delta}
        </span>
      )}
    </div>
    <div>
      <p className="text-[30px] font-black leading-none tabular-nums" style={{ color: textColor }}>{value}</p>
      <p className="text-[11px] font-semibold mt-1 opacity-80" style={{ color: textColor }}>{label}</p>
    </div>
  </motion.div>
);

/* ================================================================
   TABLE PRIMITIVES
================================================================ */
const THead: React.FC<{ cols: string[] }> = ({ cols }) => (
  <thead>
    <tr className="border-b border-[#e3e2de] bg-[#f7f6f3]">
      {cols.map(c => (
        <th key={c} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider whitespace-nowrap">{c}</th>
      ))}
    </tr>
  </thead>
);
const TRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-[#f1f0ed] hover:bg-[#fafaf9] transition-colors">{children}</tr>
);
const TD: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-[13px] text-[#6b6b6b] ${className}`}>{children}</td>
);

/* ================================================================
   MAIN COMPONENT
================================================================ */
export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Models
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [aiProvider, setAiProvider] = useState('vercel');
  const [aiModelId, setAiModelId] = useState('');
  const [aiDisplayName, setAiDisplayName] = useState('');
  const [aiGatewayUrl, setAiGatewayUrl] = useState('https://ai-gateway.vercel.sh/v1/chat/completions');
  const [aiKeySecretName, setAiKeySecretName] = useState('VERCEL_AI_API_KEY');
  const [aiTargetPlan, setAiTargetPlan] = useState('all');
  const [savingModel, setSavingModel] = useState(false);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // Inbox
  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxBody, setInboxBody] = useState('');
  const [inboxImage, setInboxImage] = useState('');
  const [inboxLink, setInboxLink] = useState('');
  const [inboxPlan, setInboxPlan] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Templates
  const [tplName, setTplName] = useState('');
  const [tplImage, setTplImage] = useState('');
  const [tplPrompt, setTplPrompt] = useState('');
  const [tplCategory, setTplCategory] = useState('general');
  const [templates, setTemplates] = useState<any[]>([]);
  const [savingTpl, setSavingTpl] = useState(false);

  // Promo
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoPlan, setPromoPlan] = useState('all');
  const [promoPublic, setPromoPublic] = useState(false);
  const [promoMaxUses, setPromoMaxUses] = useState('');
  const [promoExpires, setPromoExpires] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Celebrations
  const [celebrations, setCelebrations] = useState<any[]>([]);

  // Feedback
  const [feedbackData, setFeedbackData] = useState<any[]>([]);

  // Site Messages
  const [siteMessages, setSiteMessages] = useState<any[]>([]);
  const [smTitle, setSmTitle] = useState('');
  const [smBody, setSmBody] = useState('');
  const [smCategory, setSmCategory] = useState('info');
  const [smLink, setSmLink] = useState('');
  const [smIcon, setSmIcon] = useState('📢');
  const [smExpires, setSmExpires] = useState('');
  const [savingSm, setSavingSm] = useState(false);

  // Extra Points
  const [epPlan, setEpPlan] = useState('all');
  const [epPoints, setEpPoints] = useState(5);
  const [epUnlimited, setEpUnlimited] = useState(false);
  const [epLoading, setEpLoading] = useState(false);

  // Project Viewer
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);

  /* — Fetch — */
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
    refreshAll();
  }, [user, authLoading, navigate]);

  const refreshAll = () => { fetchNotifs(); fetchTpls(); fetchAiMs(); fetchPromos(); fetchCelebs(); fetchFeedback(); };
  const fetchNotifs = async () => { const { data: d } = await supabase.from('inbox_notifications').select('*').order('created_at', { ascending: false }); if (d) setNotifications(d); };
  const fetchTpls   = async () => { const { data: d } = await supabase.from('templates').select('*').order('sort_order', { ascending: true }); if (d) setTemplates(d); };
  const fetchAiMs   = async () => { const { data: d } = await supabase.from('ai_model_config').select('*').order('created_at', { ascending: false }); if (d) setAiModels(d); };
  const fetchPromos = async () => { const { data: d } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false }); if (d) setPromoCodes(d); };
  const fetchCelebs = async () => { const { data: d } = await supabase.from('site_celebrations').select('*').order('name'); if (d) setCelebrations(d); };
  const fetchFeedback = async () => { const { data: d } = await supabase.from('message_feedback').select('*').order('created_at', { ascending: false }).limit(100); if (d) setFeedbackData(d); };

  /* — Handlers — */
  const sendNotif = async () => {
    if (!inboxTitle.trim()) return; setSendingNotif(true);
    await supabase.from('inbox_notifications').insert({ title: inboxTitle, body: inboxBody||null, image_url: inboxImage||null, link_url: inboxLink||null, target_plan: inboxPlan, created_by: user?.id });
    setInboxTitle(''); setInboxBody(''); setInboxImage(''); setInboxLink(''); setInboxPlan('all');
    await fetchNotifs(); setSendingNotif(false); toast({ title: 'Sent ✓' });
  };
  const deleteNotif = async (id: string) => { await supabase.from('inbox_notifications').delete().eq('id', id); await fetchNotifs(); };
  const addTemplate = async () => {
    if (!tplName.trim() || !tplPrompt.trim()) return; setSavingTpl(true);
    await supabase.from('templates').insert({ name: tplName, image_url: tplImage||null, prompt: tplPrompt, category: tplCategory, created_by: user?.id, sort_order: templates.length });
    setTplName(''); setTplImage(''); setTplPrompt(''); setTplCategory('general');
    await fetchTpls(); setSavingTpl(false); toast({ title: 'Template added ✓' });
  };
  const deleteTpl = async (id: string) => { await supabase.from('templates').delete().eq('id', id); await fetchTpls(); };

  const providerDefs: Record<string, { url: string; key: string; ph: string }> = {
    vercel:     { url: 'https://ai-gateway.vercel.sh/v1/chat/completions',     key: 'VERCEL_AI_API_KEY',  ph: 'google/gemini-3-flash' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',        key: 'OPENROUTER_API_KEY', ph: 'anthropic/claude-sonnet-4' },
    nvidia:     { url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: 'NVIDIA_API_KEY',     ph: 'moonshotai/kimi-k2.5' },
    lovable:    { url: 'https://ai.gateway.lovable.dev/v1/chat/completions',   key: 'LOVABLE_API_KEY',    ph: 'google/gemini-2.5-flash' },
    google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: 'GOOGLE_AI_STUDIO_KEY', ph: 'gemini-2.5-flash' },
    mistral:    { url: 'https://api.mistral.ai/v1/chat/completions',           key: 'MISTRAL_API_KEY',    ph: 'mistral-large-2512' },
    custom:     { url: '',                                                      key: '',                   ph: 'your-model-id' },
  };
  const changeProvider = (p: string) => { setAiProvider(p); const d = providerDefs[p]; if (d) { setAiGatewayUrl(d.url); setAiKeySecretName(d.key); setAiModelId(''); } };
  const addAiModel = async () => {
    if (!aiModelId.trim() || !aiDisplayName.trim()) return; setSavingModel(true);
    await supabase.from('ai_model_config').insert({ provider: aiProvider, model_id: aiModelId, display_name: aiDisplayName, gateway_url: aiGatewayUrl, api_key_secret_name: aiKeySecretName, target_plan: aiTargetPlan, is_active: false, created_by: user?.id });
    setAiModelId(''); setAiDisplayName('');
    await fetchAiMs(); setSavingModel(false); toast({ title: 'Model added ✓' });
  };
  const toggleAiModel = async (id: string, cur: boolean) => {
    if (!cur) {
      const m = aiModels.find(x => x.id === id);
      if (m) { const ids = aiModels.filter(x => x.id !== id && x.is_active && x.target_plan === m.target_plan).map(x => x.id); if (ids.length) await supabase.from('ai_model_config').update({ is_active: false }).in('id', ids); }
    }
    await supabase.from('ai_model_config').update({ is_active: !cur }).eq('id', id); await fetchAiMs();
  };
  const deleteAiModel = async (id: string) => { await supabase.from('ai_model_config').delete().eq('id', id); await fetchAiMs(); };
  const testAiModel = async (model: any) => {
    if (!testInput.trim()) return;
    setTestLoading(true); setTestOutput('');
    try {
      const resp = await supabase.functions.invoke('generate-code', {
        body: { mode: 'chat', messages: [{ role: 'user', content: testInput }], userPlan: model.target_plan === 'all' ? 'free' : model.target_plan, userLanguage: 'en' },
      });
      if (resp.error) throw new Error(resp.error.message);
      const text = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      setTestOutput(text.slice(0, 2000));
    } catch (e: any) {
      setTestOutput(`Error: ${e.message}`);
    } finally { setTestLoading(false); }
  };
  const addPromo = async () => {
    if (!promoCode.trim()) return; setSavingPromo(true);
    await supabase.from('promo_codes').insert({ code: promoCode.toUpperCase().trim(), discount_percent: promoDiscount, target_plan: promoPlan, is_public: promoPublic, max_uses: promoMaxUses ? parseInt(promoMaxUses) : null, expires_at: promoExpires||null, created_by: user?.id });
    setPromoCode(''); setPromoDiscount(10); setPromoPlan('all'); setPromoPublic(false); setPromoMaxUses(''); setPromoExpires('');
    await fetchPromos(); setSavingPromo(false); toast({ title: 'Promo created ✓' });
  };
  const deletePromo = async (id: string) => { await supabase.from('promo_codes').delete().eq('id', id); await fetchPromos(); };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };
  const toggleCeleb = async (id: string, cur: boolean) => {
    await supabase.from('site_celebrations').update({ is_active: !cur, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchCelebs(); toast({ title: `${cur ? 'Deactivated' : 'Activated'} ✓` });
  };

  const activeByPlan = useMemo(() => {
    const m: Record<string, any> = {};
    aiModels.filter(x => x.is_active).forEach(x => { m[x.target_plan] = x; });
    return m;
  }, [aiModels]);

  /* — Loading — */
  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#e3e2de] border-t-[#2383e2] rounded-full animate-spin mx-auto" />
        <p className="text-[12px] text-[#9b9a97] font-medium">Loading workspace…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f6f3]">
      <Card pad className="max-w-sm w-full mx-4 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-[#fee2e2] flex items-center justify-center mx-auto mb-4">
          <Shield size={22} className="text-[#991b1b]" />
        </div>
        <h2 className="text-[16px] font-bold text-[#191919] mb-1">Access Denied</h2>
        <p className="text-[13px] text-[#9b9a97] mb-5 leading-relaxed">{error}</p>
        <Btn onClick={() => navigate('/')} variant="ghost">← Return to App</Btn>
      </Card>
    </div>
  );

  if (!data) return null;

  /* — Nav config — */
  const navSections: { group: string; items: { key: TabKey; label: string; icon: any; count?: number }[] }[] = [
    { group: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { group: 'Data', items: [
      { key: 'users',        label: 'Users',      icon: Users,         count: data.users.length },
      { key: 'projects',     label: 'Projects',   icon: FolderOpen,    count: data.projects.length },
      { key: 'transactions', label: 'Analytics',  icon: BarChart2 },
      { key: 'plans',        label: 'Plans',      icon: CreditCard,    count: data.plans.length },
      { key: 'onboarding',   label: 'Onboarding', icon: ClipboardList, count: data.onboarding?.length || 0 },
      { key: 'feedback',     label: 'Feedback',   icon: Star,          count: feedbackData.length },
    ]},
    { group: 'Configuration', items: [
      { key: 'ai-models',    label: 'AI Models',      icon: Cpu,       count: aiModels.length },
      { key: 'promo-codes',  label: 'Promo Codes',    icon: Gift,      count: promoCodes.length },
      { key: 'celebrations', label: 'Celebrations',   icon: Star },
    ]},
    { group: 'Content', items: [
      { key: 'templates', label: 'Templates',     icon: Package,   count: templates.length },
      { key: 'inbox',     label: 'Notifications', icon: Megaphone, count: notifications.length },
      { key: 'blog',      label: 'Blog',          icon: BookOpen },
    ]},
  ];

  const displayName = data.users.find((u: any) => u.user_id === user?.id)?.display_name || user?.email?.split('@')[0] || 'Admin';
  const totalCredits = data.transactions.reduce((s: number, t: any) => s + (Number(t.credits_used) || 0), 0);
  const activeLabel = navSections.flatMap(g => g.items).find(i => i.key === tab)?.label || 'Dashboard';

  /* — Sidebar inner — */
  const SidebarInner = () => (
    <div className="flex flex-col h-full bg-[#f7f6f3]">
      {/* Brand */}
      <div className={`flex items-center gap-2.5 border-b border-[#e3e2de] ${sidebarCollapsed ? 'justify-center px-0 py-4' : 'px-4 py-4'}`}>
        <div className="w-7 h-7 rounded-lg bg-[#2383e2] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Rocket size={13} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191919] leading-none">Vivora X</p>
            <p className="text-[10px] text-[#9b9a97] mt-0.5">Admin Console</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {navSections.map(section => (
          <div key={section.group}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider px-2 mb-1">{section.group}</p>
            )}
            <div className="space-y-px">
              {section.items.map(item => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setTab(item.key); setMobileOpen(false); }}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all ${sidebarCollapsed ? 'justify-center' : ''}
                      ${active ? 'bg-white text-[#191919] shadow-sm border border-[#e3e2de]' : 'text-[#6b6b6b] hover:bg-[#eeede9] hover:text-[#191919]'}`}
                  >
                    <Icon size={14} className={`flex-shrink-0 ${active ? 'text-[#2383e2]' : ''}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${active ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#e9e8e4] text-[#9b9a97]'}`}>
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

      {/* Bottom */}
      <div className="border-t border-[#e3e2de] p-2 space-y-px">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-[#9b9a97] hover:bg-[#eeede9] hover:text-[#191919] transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <Home size={13} />
          {!sidebarCollapsed && <span>Back to App</span>}
        </button>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-[#9b9a97] hover:bg-[#eeede9] hover:text-[#191919] transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          {sidebarCollapsed ? <ChevronLeft size={13} /> : <><ChevronRight size={13} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  /* ================================================================
     RENDER — Right Sidebar Layout
  ================================================================ */
  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ══════ LEFT SIDEBAR (Desktop) ══════ */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 border-r border-[#e3e2de] transition-all duration-300 ${sidebarCollapsed ? 'w-[52px]' : 'w-[220px]'}`}>
        <SidebarInner />
      </aside>

      {/* ══════ LEFT SIDEBAR (Mobile) ══════ */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 border-r border-[#e3e2de] shadow-xl transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220 }}>
        <SidebarInner />
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex-shrink-0 h-12 flex items-center justify-between px-5 border-b border-[#e3e2de] bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded text-[#9b9a97] hover:bg-[#f7f6f3] transition-colors">
              <Menu size={15} />
            </button>
            <h1 className="text-[14px] font-semibold text-[#191919]">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f7f6f3] border border-[#e3e2de] rounded-md w-48 focus-within:border-[#2383e2] focus-within:ring-2 focus-within:ring-[#2383e2]/20 transition-all">
              <Search size={12} className="text-[#c4c3bf] flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…"
                className="bg-transparent outline-none text-[13px] text-[#191919] w-full placeholder:text-[#c4c3bf]" />
            </div>
            <Btn onClick={refreshAll} variant="ghost" size="sm">
              <RefreshCw size={11} /> Refresh
            </Btn>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-[#fafaf9]">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="p-6 max-w-5xl space-y-5">

              {/* ══ DASHBOARD ══ */}
              {tab === 'dashboard' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[22px] font-bold text-[#191919] leading-tight">Good morning, {displayName} 👋</h2>
                    <p className="text-[13px] text-[#9b9a97] mt-1">Here's what's happening on your platform.</p>
                  </div>

                  {/* KPI Grid — filled solid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard label="Total Users"  value={data.users.length}       icon={Users}    bg="#2383e2" textColor="#fff" delta={data.users.length > 0 ? `+${Math.min(data.users.length,12)}` : undefined} />
                    <KpiCard label="Projects"     value={data.projects.length}    icon={FolderOpen} bg="#0f7b6c" textColor="#fff" />
                    <KpiCard label="Credits Used" value={totalCredits.toFixed(0)} icon={Zap}      bg="#9065b0" textColor="#fff" />
                    <KpiCard label="Active Plans" value={data.plans.length}       icon={Activity} bg="#e03e3e" textColor="#fff" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Active AI Models */}
                    <Card>
                      <CardHead title="Active AI Models" sub="Per-plan routing"
                        right={<GhostLink onClick={() => setTab('ai-models')}>Manage <ArrowRight size={11} /></GhostLink>}
                      />
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {['free','pro','business','all'].map(plan => {
                          const m = activeByPlan[plan];
                          return (
                            <div key={plan} className={`rounded-lg p-3 border transition-all ${m ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#e3e2de] bg-[#f7f6f3]'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wide">{plan === 'all' ? 'All Plans' : plan}</span>
                                {m && <div className="w-2 h-2 rounded-full bg-[#16a34a]" />}
                              </div>
                              {m ? (
                                <><p className="text-[12px] font-semibold text-[#191919] truncate">{m.display_name}</p><p className="text-[10px] text-[#9b9a97] truncate mt-0.5">{m.model_id}</p></>
                              ) : (
                                <p className="text-[11px] text-[#c4c3bf] italic">Not configured</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Recent Users */}
                    <Card>
                      <CardHead title="Recent Users" count={data.users.length}
                        right={<GhostLink onClick={() => setTab('users')}>View all <ArrowRight size={11} /></GhostLink>}
                      />
                      <div className="divide-y divide-[#f1f0ed]">
                        {data.users.slice(0, 5).map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fafaf9] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-[#dbeafe] flex items-center justify-center text-[11px] font-bold text-[#1e40af] flex-shrink-0">
                                {(u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[#191919] truncate">{u.display_name || u.email || '—'}</p>
                                <p className="text-[11px] text-[#9b9a97] truncate">{u.email}</p>
                              </div>
                            </div>
                            <span className="text-[11px] text-[#c4c3bf] flex-shrink-0">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Maintenance Mode */}
                  {(() => {
                    const mc = celebrations.find(c => c.name === 'maintenance');
                    return mc ? (
                      <Card className={mc.is_active ? '!border-[#ef4444]' : ''}>
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mc.is_active ? 'bg-[#fee2e2]' : 'bg-[#f7f6f3]'}`}>
                              <span className="text-xl">🔧</span>
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#191919]">Maintenance Mode</p>
                              <p className="text-[11px] text-[#9b9a97]">{mc.is_active ? 'Site is currently down for all users' : 'Site is live and accessible'}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleCeleb(mc.id, mc.is_active)}
                            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${mc.is_active ? 'bg-[#16a34a] text-white hover:bg-[#15803d]' : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'}`}>
                            {mc.is_active ? '✓ Go Live' : '⚠ Enable Maintenance'}
                          </button>
                        </div>
                      </Card>
                    ) : null;
                  })()}

                  {/* Active Celebrations */}
                  {celebrations.some(c => c.is_active && c.name !== 'maintenance') && (
                    <Card>
                      <CardHead title="Active Celebrations" />
                      <div className="p-4 flex flex-wrap gap-2">
                        {celebrations.filter(c => c.is_active && c.name !== 'maintenance').map(c => (
                          <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fef9c3] border border-[#fde047]">
                            <span className="text-lg">{c.config?.emoji || '🎉'}</span>
                            <span className="text-[12px] font-semibold text-[#713f12]">{c.config?.label || c.name}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Recent Projects */}
                  <Card>
                    <CardHead title="Recent Projects" count={data.projects.length}
                      right={<GhostLink onClick={() => setTab('projects')}>View all <ArrowRight size={11} /></GhostLink>}
                    />
                    <div className="divide-y divide-[#f1f0ed]">
                      {data.projects.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fafaf9] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                              <FolderOpen size={13} className="text-[#166534]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#191919] truncate">{p.name}</p>
                              <p className="text-[11px] text-[#9b9a97] capitalize">{p.project_type}</p>
                            </div>
                          </div>
                          <Tag color={p.is_published ? 'green' : 'gray'}>{p.is_published ? 'Live' : 'Draft'}</Tag>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* ══ ONBOARDING ══ */}
              {tab === 'onboarding' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#191919]">Onboarding Responses</h2>
                    <p className="text-[13px] text-[#9b9a97] mt-0.5">Users from the Get Started flow</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { role: 'founder',  bg: '#2383e2', text: '#fff' },
                      { role: 'engineer', bg: '#0f7b6c', text: '#fff' },
                      { role: 'designer', bg: '#9065b0', text: '#fff' },
                      { role: 'product',  bg: '#e03e3e', text: '#fff' },
                    ].map(({ role, bg, text }) => (
                      <div key={role} className="rounded-xl p-5" style={{ background: bg }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 opacity-80" style={{ color: text }}>{role}</p>
                        <p className="text-[32px] font-black tabular-nums leading-none" style={{ color: text }}>
                          {data.onboarding?.filter((o: any) => o.role === role).length || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                  {(!data.onboarding || !data.onboarding.length)
                    ? <Empty icon={ClipboardList} title="No onboarding data yet" desc="Users appear after completing the Get Started flow" />
                    : <Card>
                        <table className="w-full border-collapse">
                          <THead cols={['Name','Role','Company','Theme','Date']} />
                          <tbody>
                            {data.onboarding.map((o: any) => (
                              <TRow key={o.id}>
                                <TD className="font-medium text-[#191919]">{o.full_name || '—'}</TD>
                                <TD><Tag color="teal">{o.role || '—'}</Tag></TD>
                                <TD>{o.company_size || '—'}</TD>
                                <TD><Tag color={o.preferred_theme === 'dark' ? 'gray' : 'orange'}>{o.preferred_theme || '—'}</Tag></TD>
                                <TD>{new Date(o.created_at).toLocaleDateString()}</TD>
                              </TRow>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                  }
                </div>
              )}

              {/* ══ PROMO CODES ══ */}
              {tab === 'promo-codes' && (
                <div className="space-y-5">
                  <h2 className="text-[20px] font-bold text-[#191919]">Promo Codes</h2>
                  <Card>
                    <CardHead title="Create Promo Code" />
                    <div className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <Field label="Code *"><input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={inputCls} placeholder="SUMMER25" /></Field>
                        <Field label="Discount %"><input type="number" value={promoDiscount} onChange={e => setPromoDiscount(Number(e.target.value))} min={1} max={100} className={inputCls} /></Field>
                        <Field label="Target Plan"><select value={promoPlan} onChange={e => setPromoPlan(e.target.value)} className={selectCls}><option value="all">All Plans</option><option value="pro">Pro Only</option><option value="business">Business Only</option></select></Field>
                        <Field label="Max Uses"><input type="number" value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} className={inputCls} placeholder="100" /></Field>
                        <Field label="Expires At"><input type="datetime-local" value={promoExpires} onChange={e => setPromoExpires(e.target.value)} className={inputCls} /></Field>
                        <Field label="Visibility">
                          <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                            <input type="checkbox" checked={promoPublic} onChange={e => setPromoPublic(e.target.checked)} className="w-4 h-4 rounded border-[#e3e2de] accent-[#2383e2]" />
                            <span className="text-[13px] text-[#6b6b6b]">Make public</span>
                          </label>
                        </Field>
                      </div>
                      <Btn onClick={addPromo} disabled={!promoCode.trim()} loading={savingPromo}><Plus size={12} /> Create Code</Btn>
                    </div>
                  </Card>
                  {!promoCodes.length ? <Empty icon={Gift} title="No promo codes yet" /> : (
                    <Card>
                      <table className="w-full border-collapse">
                        <THead cols={['Code','Discount','Plan','Type','Uses','Expires','']} />
                        <tbody>
                          {promoCodes.map(p => (
                            <TRow key={p.id}>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#191919]">{p.code}</span>
                                  <button onClick={() => copyCode(p.code)} className="text-[#c4c3bf] hover:text-[#6b6b6b] transition-colors">
                                    {copiedCode === p.code ? <Check size={12} className="text-[#16a34a]" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </TD>
                              <TD><span className="font-bold text-[#0f7b6c]">{p.discount_percent}%</span></TD>
                              <TD><Tag color="blue">{p.target_plan}</Tag></TD>
                              <TD><Tag color={p.is_public ? 'green' : 'gray'}>{p.is_public ? 'Public' : 'Private'}</Tag></TD>
                              <TD>{p.current_uses}{p.max_uses ? `/${p.max_uses}` : ''}</TD>
                              <TD>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '∞'}</TD>
                              <TD><IconBtn onClick={() => deletePromo(p.id)} danger><Trash2 size={13} /></IconBtn></TD>
                            </TRow>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </div>
              )}

              {/* ══ CELEBRATIONS ══ */}
              {tab === 'celebrations' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#191919]">Seasonal Celebrations</h2>
                    <p className="text-[13px] text-[#9b9a97] mt-0.5">Toggle seasonal overlays for all users</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {celebrations.map(c => (
                      <Card key={c.id} className={c.is_active ? '!border-[#fde047]' : ''}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[#fef9c3] border border-[#fde047] flex items-center justify-center text-2xl">
                                {c.config?.emoji || '🎉'}
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-[#191919]">{c.config?.label || c.name}</p>
                                <p className="text-[11px] text-[#9b9a97] mt-0.5">{c.name}</p>
                              </div>
                            </div>
                            {c.is_active && <Tag color="orange">Active</Tag>}
                          </div>
                          <button onClick={() => toggleCeleb(c.id, c.is_active)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${c.is_active ? 'bg-[#f7f6f3] text-[#6b6b6b] border border-[#e3e2de] hover:bg-[#f1f0ed]' : 'bg-[#2383e2] text-white hover:bg-[#1a6ec2] shadow-sm'}`}>
                            {c.is_active ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ INBOX ══ */}
              {tab === 'inbox' && (
                <div className="space-y-5">
                  <h2 className="text-[20px] font-bold text-[#191919]">Notifications</h2>
                  <Card>
                    <CardHead title="Send Notification" />
                    <div className="p-5 space-y-4">
                      <Field label="Title *"><input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={inputCls} placeholder="Notification title…" /></Field>
                      <Field label="Body"><textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={`${textareaCls} h-20`} placeholder="Message body…" /></Field>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Image URL"><input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={inputCls} placeholder="https://…" /></Field>
                        <Field label="Link URL"><input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={inputCls} placeholder="https://…" /></Field>
                        <Field label="Target Plan"><select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={selectCls}><option value="all">All</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></Field>
                      </div>
                      <Btn onClick={sendNotif} disabled={!inboxTitle.trim()} loading={sendingNotif}><Send size={12} /> Send Notification</Btn>
                    </div>
                  </Card>
                  {!notifications.length ? <Empty icon={Bell} title="No notifications sent yet" /> : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <Card key={n.id}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell size={13} className="text-[#5b21b6]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[#191919] truncate">{n.title}</p>
                                {n.body && <p className="text-[12px] text-[#6b6b6b] mt-0.5 truncate">{n.body}</p>}
                                <p className="text-[11px] text-[#c4c3bf] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <IconBtn onClick={() => deleteNotif(n.id)} danger><Trash2 size={13} /></IconBtn>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ TEMPLATES ══ */}
              {tab === 'templates' && (
                <div className="space-y-5">
                  <h2 className="text-[20px] font-bold text-[#191919]">Templates</h2>
                  <Card>
                    <CardHead title="Add Template" />
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Name *"><input value={tplName} onChange={e => setTplName(e.target.value)} className={inputCls} placeholder="Template name…" /></Field>
                        <Field label="Category"><input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={inputCls} placeholder="general" /></Field>
                        <Field label="Image URL"><input value={tplImage} onChange={e => setTplImage(e.target.value)} className={inputCls} placeholder="https://…" /></Field>
                      </div>
                      <Field label="Prompt *"><textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={`${textareaCls} h-24`} placeholder="AI prompt…" /></Field>
                      <Btn onClick={addTemplate} disabled={!tplName.trim() || !tplPrompt.trim()} loading={savingTpl}><Plus size={12} /> Add Template</Btn>
                    </div>
                  </Card>
                  {!templates.length ? <Empty icon={Layers} title="No templates yet" /> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {templates.map(tpl => (
                        <motion.div key={tpl.id} whileHover={{ y: -2 }} className="group">
                          <Card className="overflow-hidden hover:border-[#c4c3bf] transition-colors">
                            <div className="aspect-video bg-[#f7f6f3] flex items-center justify-center overflow-hidden">
                              {tpl.image_url
                                ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <Layers size={20} className="text-[#c4c3bf]" />
                              }
                            </div>
                            <div className="px-3 py-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-[#191919] truncate">{tpl.name}</p>
                                <p className="text-[10px] text-[#9b9a97] capitalize mt-0.5">{tpl.category}</p>
                              </div>
                              <IconBtn onClick={() => deleteTpl(tpl.id)} danger><Trash2 size={12} /></IconBtn>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ BLOG ══ */}
              {tab === 'blog' && <AdminBlogEditor />}

              {/* ══ AI MODELS ══ */}
              {tab === 'ai-models' && (
                <div className="space-y-5">
                  <h2 className="text-[20px] font-bold text-[#191919]">AI Models</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { plan: 'free',     bg: '#2383e2', text: '#fff' },
                      { plan: 'pro',      bg: '#9065b0', text: '#fff' },
                      { plan: 'business', bg: '#e03e3e', text: '#fff' },
                      { plan: 'all',      bg: '#0f7b6c', text: '#fff' },
                    ].map(({ plan, bg, text }) => {
                      const m = activeByPlan[plan];
                      return (
                        <div key={plan} className="rounded-xl p-4" style={{ background: m ? bg : '#f7f6f3', border: m ? 'none' : '1px solid #e3e2de' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: m ? `${text}cc` : '#9b9a97' }}>{plan === 'all' ? 'All Plans' : plan}</span>
                            {m && <div className="w-2 h-2 rounded-full bg-white/60" />}
                          </div>
                          {m
                            ? <><p className="text-[12px] font-bold truncate" style={{ color: text }}>{m.display_name}</p><p className="text-[10px] truncate mt-0.5" style={{ color: `${text}99` }}>{m.model_id}</p></>
                            : <p className="text-[11px] text-[#c4c3bf] italic">Not configured</p>
                          }
                        </div>
                      );
                    })}
                  </div>

                  <Card>
                    <CardHead title="Add AI Model" />
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Provider"><select value={aiProvider} onChange={e => changeProvider(e.target.value)} className={selectCls}><option value="vercel">Vercel AI</option><option value="openrouter">OpenRouter</option><option value="nvidia">NVIDIA NIM</option><option value="lovable">Lovable AI</option><option value="google">Google AI Studio</option><option value="mistral">Mistral AI</option><option value="custom">Custom Provider</option></select></Field>
                            <Field label="Target Plan"><select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className={selectCls}><option value="all">All Plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></Field>
                          </div>
                          <Field label="Model ID *"><input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className={inputCls} placeholder={providerDefs[aiProvider]?.ph} /></Field>
                          <Field label="Display Name *"><input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className={inputCls} placeholder="e.g. Gemini Flash" /></Field>
                          <Field label="Gateway URL"><input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className={inputCls} /></Field>
                          <Field label="API Key Secret"><input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className={inputCls} /></Field>
                          <Btn onClick={addAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim()} loading={savingModel}><Plus size={12} /> Add Model</Btn>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] p-4">
                            <p className="text-[11px] font-semibold text-[#166534] uppercase tracking-wide mb-1.5">Priority Logic</p>
                            <p className="text-[12px] text-[#6b6b6b] leading-relaxed">Specific plan match takes priority over "All Plans" fallback. Only one model can be active per plan slot.</p>
                          </div>
                          <div className="rounded-lg bg-[#f7f6f3] border border-[#e3e2de] p-4">
                            <p className="text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide mb-3">Provider Keys</p>
                            <div className="space-y-2">
                              {Object.entries(providerDefs).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center">
                                  <span className="text-[12px] text-[#6b6b6b] capitalize">{k}</span>
                                  <span className="text-[11px] text-[#9b9a97] font-mono">{v.key}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {!aiModels.length ? <Empty icon={Cpu} title="No models configured" /> : (
                    <Card>
                      <table className="w-full border-collapse">
                        <THead cols={['Status','Provider','Model ID','Name','Plan','Fallback','']} />
                        <tbody>
                          {aiModels.map(m => (
                            <React.Fragment key={m.id}>
                            <TRow>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-[#16a34a]' : 'bg-[#e3e2de]'}`} />
                                  <span className="text-[12px]">{m.is_active ? 'Active' : 'Off'}</span>
                                </div>
                              </TD>
                              <TD className="capitalize">{m.provider}</TD>
                              <TD className="font-mono text-[#9b9a97]">{m.model_id}</TD>
                              <TD className="font-medium text-[#191919]">{m.display_name}</TD>
                              <TD><Tag color="blue">{m.target_plan === 'all' ? 'All' : m.target_plan}</Tag></TD>
                              <TD>
                                <select
                                  value={(m as any).fallback_model_id || ''}
                                  onChange={async (e) => {
                                    const val = e.target.value || null;
                                    await supabase.from('ai_model_config').update({ fallback_model_id: val } as any).eq('id', m.id);
                                    await fetchAiMs();
                                    toast({ title: 'Fallback updated ✓' });
                                  }}
                                  className="px-2 py-1 bg-white border border-[#e3e2de] rounded text-[11px] text-[#6b6b6b] outline-none focus:border-[#2383e2] max-w-[140px]"
                                >
                                  <option value="">None</option>
                                  {aiModels.filter(x => x.id !== m.id).map(x => (
                                    <option key={x.id} value={x.id}>{x.display_name} ({x.provider})</option>
                                  ))}
                                </select>
                              </TD>
                              <TD>
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setTestingModel(testingModel === m.id ? null : m.id); setTestOutput(''); setTestInput(''); }}
                                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[#ede9fe] text-[#5b21b6] hover:bg-[#ddd6fe] transition-all">
                                    {testingModel === m.id ? 'Close' : 'Test'}
                                  </button>
                                  <button onClick={() => toggleAiModel(m.id, m.is_active)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${m.is_active ? 'bg-[#f7f6f3] text-[#6b6b6b] border border-[#e3e2de] hover:bg-[#f1f0ed]' : 'bg-[#2383e2] text-white hover:bg-[#1a6ec2]'}`}>
                                    {m.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <IconBtn onClick={() => deleteAiModel(m.id)} danger><Trash2 size={13} /></IconBtn>
                                </div>
                              </TD>
                            </TRow>
                            {testingModel === m.id && (
                              <tr>
                                <td colSpan={7} className="px-4 py-4 bg-[#f7f6f3] border-b border-[#e3e2de]">
                                  <div className="space-y-3 max-w-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Zap size={14} className="text-[#5b21b6]" />
                                      <span className="text-[12px] font-semibold text-[#191919]">Test: {m.display_name}</span>
                                      <Tag color="purple">{m.model_id}</Tag>
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        value={testInput}
                                        onChange={e => setTestInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && testAiModel(m)}
                                        className={inputCls + ' flex-1'}
                                        placeholder="Type a message to test…"
                                      />
                                      <button onClick={() => testAiModel(m)} disabled={testLoading || !testInput.trim()}
                                        className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-[12px] font-semibold hover:bg-[#4c1d95] disabled:opacity-50 transition-all flex items-center gap-2">
                                        {testLoading ? <><RefreshCw size={12} className="animate-spin" /> Testing…</> : <><Send size={12} /> Send</>}
                                      </button>
                                    </div>
                                    {testOutput && (
                                      <div className="rounded-lg bg-white border border-[#e3e2de] p-3 max-h-48 overflow-y-auto">
                                        <pre className="text-[12px] text-[#191919] whitespace-pre-wrap font-mono leading-relaxed">{testOutput}</pre>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                  {/* ══ FALLBACK MODELS OVERVIEW ══ */}
                  <Card>
                    <CardHead title="النماذج الاحتياطية — Fallback Models" sub="Automatic failover when primary model fails" />
                    <div className="p-5">
                      {aiModels.filter(m => m.is_active).length === 0 ? (
                        <p className="text-[13px] text-[#9b9a97] text-center py-6">No active models configured yet</p>
                      ) : (
                        <div className="space-y-3">
                          {aiModels.filter(m => m.is_active).map(m => {
                            const fb = aiModels.find(x => x.id === (m as any).fallback_model_id);
                            return (
                              <div key={m.id} className="flex items-center gap-3 p-4 rounded-xl border border-[#e3e2de] bg-[#fafaf9] hover:bg-[#f7f6f3] transition-colors">
                                {/* Primary */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                                    <span className="text-[12px] font-bold text-[#191919]">{m.display_name}</span>
                                    <Tag color="blue">{m.target_plan === 'all' ? 'All' : m.target_plan}</Tag>
                                  </div>
                                  <p className="text-[11px] text-[#9b9a97] font-mono truncate">{m.provider} / {m.model_id}</p>
                                </div>

                                {/* Arrow */}
                                <div className="flex flex-col items-center gap-0.5 px-2">
                                  <ArrowRight size={16} className={fb ? 'text-[#2383e2]' : 'text-[#e3e2de]'} />
                                  <span className="text-[9px] font-semibold text-[#9b9a97] uppercase">Fallback</span>
                                </div>

                                {/* Fallback */}
                                <div className="flex-1 min-w-0">
                                  {fb ? (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                                        <span className="text-[12px] font-bold text-[#191919]">{fb.display_name}</span>
                                      </div>
                                      <p className="text-[11px] text-[#9b9a97] font-mono truncate">{fb.provider} / {fb.model_id}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#e3e2de]" />
                                      <span className="text-[12px] text-[#c4c3bf] italic">No fallback set</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-4 rounded-lg bg-[#fef3c7] border border-[#fde68a] p-3">
                        <p className="text-[11px] text-[#92400e] leading-relaxed">
                          <strong>How it works:</strong> When the primary model returns an error (500, 502, 429), the system automatically retries with the configured fallback model. Set fallbacks from the table above using the "Fallback" dropdown.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* ══ FEEDBACK ══ */}
              {tab === 'feedback' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#191919]">User Feedback</h2>
                    <p className="text-[13px] text-[#9b9a97] mt-0.5">AI response ratings from users</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-5 bg-[#0f7b6c]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-2">Total</p>
                      <p className="text-[32px] font-black tabular-nums leading-none text-white">{feedbackData.length}</p>
                    </div>
                    <div className="rounded-xl p-5 bg-[#2383e2]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-2">👍 Likes</p>
                      <p className="text-[32px] font-black tabular-nums leading-none text-white">{feedbackData.filter(f => f.feedback === 'like').length}</p>
                    </div>
                    <div className="rounded-xl p-5 bg-[#e03e3e]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-2">👎 Dislikes</p>
                      <p className="text-[32px] font-black tabular-nums leading-none text-white">{feedbackData.filter(f => f.feedback === 'dislike').length}</p>
                    </div>
                  </div>
                  {!feedbackData.length ? <Empty icon={Star} title="No feedback yet" desc="Users can rate AI responses with like/dislike" /> : (
                    <Card>
                      <table className="w-full border-collapse">
                        <THead cols={['Rating','User','Message ID','Project','Date']} />
                        <tbody>
                          {feedbackData.map(f => (
                            <TRow key={f.id}>
                              <TD><Tag color={f.feedback === 'like' ? 'green' : 'red'}>{f.feedback === 'like' ? '👍 Like' : '👎 Dislike'}</Tag></TD>
                              <TD className="font-mono text-[#9b9a97]">{f.user_id?.slice(0, 8)}</TD>
                              <TD className="font-mono text-[#9b9a97]">{f.message_id?.slice(0, 8)}</TD>
                              <TD className="font-mono text-[#9b9a97]">{f.project_id?.slice(0, 8) || '—'}</TD>
                              <TD>{new Date(f.created_at).toLocaleString()}</TD>
                            </TRow>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </div>
              )}

              {/* ══ DATA TABLES ══ */}
              {(['users','plans','transactions','projects'] as TabKey[]).includes(tab) && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-bold text-[#191919]">{activeLabel}</h2>
                    <Tag color="gray">
                      {tab==='users'?data.users.length:tab==='plans'?data.plans.length:tab==='projects'?data.projects.length:data.transactions.length} records
                    </Tag>
                  </div>
                  <Card>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#e3e2de] bg-[#f7f6f3]">
                          {tab==='users'&&['','Email','Name','Joined','Projects'].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider">{h}</th>)}
                          {tab==='plans'&&['User','Plan','Daily','Used Today','Total','Expires'].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider">{h}</th>)}
                          {tab==='transactions'&&['User','Credits','Model','Type','Date'].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider">{h}</th>)}
                          {tab==='projects'&&['Name','Owner','Type','Status','Created',''].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tab==='users'&&data.users.filter(u=>!searchQuery||JSON.stringify(u).toLowerCase().includes(searchQuery.toLowerCase())).map((u:any)=>{
                          const userProjects = data.projects.filter((p:any) => p.user_id === u.user_id);
                          return (
                          <TRow key={u.id}>
                            <TD><div className="w-7 h-7 rounded-full bg-[#dbeafe] flex items-center justify-center text-[10px] font-bold text-[#1e40af]">{(u.email||'?')[0].toUpperCase()}</div></TD>
                            <TD className="text-[#6b6b6b]">{u.email||'—'}</TD>
                            <TD className="font-medium text-[#191919]">{u.display_name||'—'}</TD>
                            <TD>{new Date(u.created_at).toLocaleDateString()}</TD>
                            <TD>
                              {userProjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {userProjects.slice(0, 3).map((p:any) => (
                                    <button key={p.id} onClick={() => setViewingProjectId(p.id)}
                                      className="px-2 py-1 rounded text-[10px] font-semibold bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0] transition-colors truncate max-w-[100px]" title={p.name}>
                                      {p.name}
                                    </button>
                                  ))}
                                  {userProjects.length > 3 && <span className="text-[10px] text-[#9b9a97] self-center">+{userProjects.length - 3}</span>}
                                </div>
                              ) : <span className="text-[11px] text-[#c4c3bf]">—</span>}
                            </TD>
                          </TRow>
                        );})}
                        {tab==='plans'&&data.plans.filter(p=>!searchQuery||JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p:any)=>(
                          <TRow key={p.id}>
                            <TD className="font-mono text-[#9b9a97]">{p.user_id?.slice(0,8)}</TD>
                            <TD><Tag color={p.plan==='pro'?'purple':p.plan==='business'?'orange':'blue'}>{p.plan}</Tag></TD>
                            <TD>{p.daily_credits}</TD>
                            <TD>{p.credits_used_today}</TD>
                            <TD>{p.total_credits_used}</TD>
                            <TD>{p.subscription_expires_at?new Date(p.subscription_expires_at).toLocaleDateString():'—'}</TD>
                          </TRow>
                        ))}
                        {tab==='transactions'&&data.transactions.filter(t=>!searchQuery||JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())).map((t:any)=>(
                          <TRow key={t.id}>
                            <TD className="font-mono text-[#9b9a97]">{t.user_id?.slice(0,8)}</TD>
                            <TD><span className="font-bold text-[#9065b0]">{t.credits_used}</span></TD>
                            <TD className="text-[#9b9a97]">{t.model_used||'—'}</TD>
                            <TD><Tag color="gray">{t.work_type||'—'}</Tag></TD>
                            <TD>{new Date(t.created_at).toLocaleString()}</TD>
                          </TRow>
                        ))}
                        {tab==='projects'&&data.projects.filter(p=>!searchQuery||JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map((p:any)=>{
                          const ownerProfile = data.users.find((u:any) => u.user_id === p.user_id);
                          return (
                          <TRow key={p.id}>
                            <TD className="font-medium text-[#191919]">{p.name}</TD>
                            <TD className="text-[#9b9a97]">{ownerProfile?.display_name || ownerProfile?.email || p.user_id?.slice(0,8)}</TD>
                            <TD className="capitalize text-[#9b9a97]">{p.project_type}</TD>
                            <TD><Tag color={p.is_published?'green':'gray'}>{p.is_published?'Published':'Draft'}</Tag></TD>
                            <TD>{new Date(p.created_at).toLocaleDateString()}</TD>
                            <TD>
                              <button onClick={() => setViewingProjectId(p.id)}
                                className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[#dbeafe] text-[#1e40af] hover:bg-[#bfdbfe] transition-all flex items-center gap-1.5">
                                <Eye size={12} /> View
                              </button>
                            </TD>
                          </TRow>
                        );})}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Project Viewer Modal */}
      {viewingProjectId && (
        <AdminProjectViewer projectId={viewingProjectId} onClose={() => setViewingProjectId(null)} />
      )}
    </div>
  );
};

export default AdminPanel;
