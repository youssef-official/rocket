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
  Shield,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';
import { toast } from '@/hooks/use-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────────────────── */
const T = {
  card:     'relative rounded-2xl border border-white/[0.07] bg-[#0e0e1a]/80 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden',
  input:    'w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/90 outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all placeholder:text-white/20 font-mono',
  label:    'block text-[10px] font-bold text-white/30 mb-1.5 uppercase tracking-[0.18em]',
  btnPrimary: 'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all',
};

/* ─────────────────────────────────────────────────────────────────────────────
   NEON GLOW ACCENT  (reusable inline shimmer strip at top of cards)
───────────────────────────────────────────────────────────────────────────── */
const NeonStrip: React.FC<{ color?: string }> = ({ color = '#22d3ee' }) => (
  <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
);

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */
const EmptyState: React.FC<{ icon: any; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/5">
      <Icon size={24} className="text-cyan-500/30" />
    </div>
    <h3 className="text-sm font-bold text-white/30 mb-1 tracking-wide">{title}</h3>
    <p className="text-xs text-white/15">{desc}</p>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────────────── */
const StatCard: React.FC<{ label: string; value: string | number; icon: any; trend?: string; color: string; glowColor: string }> = ({ label, value, icon: Icon, trend, color, glowColor }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={`${T.card} p-5 group cursor-default`}
    style={{ boxShadow: `0 0 40px -20px ${glowColor}30` }}
  >
    <NeonStrip color={color} />
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20" style={{ background: color }} />
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06]" style={{ background: `${color}12` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: `${color}15`, color }}>
            <TrendingUp size={9} /> {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight tabular-nums leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em]">{label}</p>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────────────────────── */
const SectionHeader: React.FC<{ title: string; desc?: string; badge?: string | number; action?: React.ReactNode }> = ({ title, desc, badge, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
        {badge !== undefined && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 font-mono">
            {badge}
          </span>
        )}
      </div>
      {desc && <p className="text-sm text-white/25 mt-1 font-medium">{desc}</p>}
    </div>
    {action}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   TABLE WRAPPER
───────────────────────────────────────────────────────────────────────────── */
const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={`${T.card} overflow-x-auto`}>
    <NeonStrip color="#22d3ee" />
    <table className="w-full border-collapse">{children}</table>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-5 py-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.25em] border-b border-white/[0.04]">{children}</th>
);

const Tr: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-white/[0.03] hover:bg-cyan-500/[0.02] transition-colors group">{children}</tr>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-5 py-3.5 ${className}`}>{children}</td>
);

/* ─────────────────────────────────────────────────────────────────────────────
   BADGE
───────────────────────────────────────────────────────────────────────────── */
const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'cyan' | 'green' | 'amber' | 'red' | 'purple' }> = ({ children, variant = 'default' }) => {
  const styles: Record<string, string> = {
    default: 'bg-white/[0.05] text-white/25',
    cyan:    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15',
    green:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15',
    amber:   'bg-amber-500/10 text-amber-400 border border-amber-500/15',
    red:     'bg-red-500/10 text-red-400 border border-red-500/15',
    purple:  'bg-purple-500/10 text-purple-400 border border-purple-500/15',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize ${styles[variant]}`}>
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ADMIN PANEL
───────────────────────────────────────────────────────────────────────────── */
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

  // AI Model Config
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [aiProvider, setAiProvider] = useState('vercel');
  const [aiModelId, setAiModelId] = useState('');
  const [aiDisplayName, setAiDisplayName] = useState('');
  const [aiGatewayUrl, setAiGatewayUrl] = useState('https://ai-gateway.vercel.sh/v1/chat/completions');
  const [aiKeySecretName, setAiKeySecretName] = useState('VERCEL_AI_API_KEY');
  const [aiTargetPlan, setAiTargetPlan] = useState('all');
  const [savingModel, setSavingModel] = useState(false);

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

  // Promo Codes
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

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
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

  /* ── Handlers ──────────────────────────────────────────────────────────── */
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
    vercel:     { url: 'https://ai-gateway.vercel.sh/v1/chat/completions',       key: 'VERCEL_AI_API_KEY',    placeholder: 'google/gemini-3-flash' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',          key: 'OPENROUTER_API_KEY',   placeholder: 'anthropic/claude-sonnet-4' },
    nvidia:     { url: 'https://integrate.api.nvidia.com/v1/chat/completions',   key: 'NVIDIA_API_KEY',       placeholder: 'moonshotai/kimi-k2.5' },
    lovable:    { url: 'https://ai.gateway.lovable.dev/v1/chat/completions',     key: 'LOVABLE_API_KEY',      placeholder: 'google/gemini-2.5-flash' },
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
        const idsToDeactivate = aiModels
          .filter(m => m.id !== id && m.is_active && m.target_plan === model.target_plan)
          .map(m => m.id);
        if (idsToDeactivate.length > 0)
          await supabase.from('ai_model_config').update({ is_active: false }).in('id', idsToDeactivate);
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
    await supabase
      .from('site_celebrations')
      .update({ is_active: !currentActive, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq('id', id);
    await fetchCelebrations();
    toast({ title: `Celebration ${currentActive ? 'deactivated' : 'activated'}` });
  };

  /* ── Memos ─────────────────────────────────────────────────────────────── */
  const activeModelsByPlan = useMemo(() => {
    const map: Record<string, any> = {};
    aiModels.filter(m => m.is_active).forEach(m => { map[m.target_plan] = m; });
    return map;
  }, [aiModels]);

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070710]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border border-transparent border-t-cyan-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
            <div className="absolute inset-0 rounded-full blur-lg bg-cyan-500/10" />
          </div>
          <p className="text-[9px] text-white/15 tracking-[0.5em] uppercase font-bold">INITIALIZING CONSOLE</p>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070710]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${T.card} p-12 text-center max-w-sm`}
          style={{ boxShadow: '0 0 80px -30px #ef444440' }}
        >
          <NeonStrip color="#ef4444" />
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">Access Denied</h2>
          <p className="text-sm text-white/30 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/')}
            className={`${T.btnPrimary} w-full justify-center bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-lg shadow-cyan-600/20`}
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  /* ── Nav Config ─────────────────────────────────────────────────────────── */
  const navSections: { title: string; items: { key: TabKey; label: string; icon: any; count?: number; accent?: string }[] }[] = [
    {
      title: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: '#22d3ee' },
      ],
    },
    {
      title: 'Data',
      items: [
        { key: 'users',        label: 'Users',       icon: Users,         count: data.users.length,          accent: '#3b82f6' },
        { key: 'projects',     label: 'Projects',    icon: FolderOpen,    count: data.projects.length,       accent: '#10b981' },
        { key: 'transactions', label: 'Analytics',   icon: BarChart2,                                        accent: '#a855f7' },
        { key: 'plans',        label: 'Plans',       icon: CreditCard,    count: data.plans.length,          accent: '#6366f1' },
        { key: 'onboarding',   label: 'Onboarding',  icon: ClipboardList, count: data.onboarding?.length || 0, accent: '#f59e0b' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { key: 'ai-models',   label: 'AI Models',    icon: Cpu,   count: aiModels.length,   accent: '#22d3ee' },
        { key: 'promo-codes', label: 'Promo Codes',  icon: Gift,  count: promoCodes.length,  accent: '#10b981' },
        { key: 'celebrations',label: 'Celebrations', icon: Star,                             accent: '#f59e0b' },
      ],
    },
    {
      title: 'Content',
      items: [
        { key: 'templates', label: 'Templates',     icon: Package,   count: templates.length,     accent: '#8b5cf6' },
        { key: 'inbox',     label: 'Notifications', icon: Megaphone, count: notifications.length,  accent: '#ec4899' },
        { key: 'blog',      label: 'Blog',          icon: BookOpen,                               accent: '#06b6d4' },
      ],
    },
  ];

  const displayName = (data?.users?.find((u: any) => u.user_id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';
  const totalCreditsUsed = data.transactions.reduce((sum: number, t: any) => sum + (Number(t.credits_used) || 0), 0);
  const tabTitle = navSections.flatMap(s => s.items).find(n => n.key === tab)?.label || 'Dashboard';
  const tabAccent = navSections.flatMap(s => s.items).find(n => n.key === tab)?.accent || '#22d3ee';

  /* ── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-[#070710] text-white">
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.06]" style={{ background: 'radial-gradient(circle, #22d3ee, #6366f1)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.05]" style={{ background: 'radial-gradient(circle, #a855f7, #ec4899)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:relative z-50 md:z-10
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[248px]'}
        flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out
        bg-[#080814]/95 backdrop-blur-2xl border-r border-white/[0.05]
      `}>
        {/* Brand */}
        <div className={`h-[60px] flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4 gap-3'} flex-shrink-0 border-b border-white/[0.05]`}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Rocket size={14} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-40 -z-10" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-black text-white tracking-tight">Vivora X</span>
              <p className="text-[9px] text-white/20 font-bold tracking-[0.2em] uppercase">Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-4 scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p className="text-[8px] font-black text-white/12 uppercase tracking-[0.35em] px-3 mb-2">{section.title}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setTab(item.key as TabKey); setMobileMenuOpen(false); }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 relative overflow-hidden
                        ${active ? 'text-white' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.02]'}
                      `}
                      style={active ? { background: `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)`, border: `1px solid ${item.accent}20` } : {}}
                    >
                      {active && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full" style={{ background: item.accent }} />
                      )}
                      <Icon size={14} style={active ? { color: item.accent } : {}} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono"
                              style={active ? { background: `${item.accent}20`, color: item.accent } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}
                            >
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

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-white/[0.04] space-y-0.5">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-[11px] text-white/15 hover:text-white/35 hover:bg-white/[0.02] transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={12} /> : <><ChevronLeft size={12} /><span>Collapse</span></>}
          </button>
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[11px] text-white/15 hover:text-white/35 hover:bg-white/[0.02] transition-all`}
          >
            <Home size={12} />
            {!sidebarCollapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-[60px] px-4 md:px-8 flex items-center justify-between border-b border-white/[0.04] bg-[#070710]/80 backdrop-blur-xl flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] text-white/25 transition-colors">
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/15 font-medium text-xs">Admin</span>
              <span className="text-white/8">/</span>
              <span className="font-black text-white/80 tracking-tight" style={{ color: tabAccent }}>{tabTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl w-48 focus-within:border-cyan-500/25 transition-colors">
              <Search size={12} className="text-white/15 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-xs text-white/70 w-full placeholder:text-white/15 font-mono"
              />
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-xs font-black text-cyan-300 border border-cyan-500/15 cursor-default">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#070710]" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >

                {/* ══════════════════════════════════════════
                    DASHBOARD
                ══════════════════════════════════════════ */}
                {tab === 'dashboard' && (
                  <div className="space-y-6 max-w-7xl">
                    {/* Welcome */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.3em] mb-1">Admin Console</p>
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{displayName}</span>
                        </h1>
                        <p className="text-sm text-white/20 mt-2 font-medium">Platform overview — all systems nominal.</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard label="Total Users"   value={data.users.length}          icon={Users}    color="#3b82f6" glowColor="#3b82f6" trend={data.users.length > 0 ? `+${Math.min(data.users.length, 12)} this week` : undefined} />
                      <StatCard label="Projects"      value={data.projects.length}       icon={FolderOpen} color="#10b981" glowColor="#10b981" />
                      <StatCard label="Credits Used"  value={totalCreditsUsed.toFixed(0)} icon={Zap}      color="#a855f7" glowColor="#a855f7" />
                      <StatCard label="Active Plans"  value={data.plans.length}          icon={Activity} color="#22d3ee" glowColor="#22d3ee" />
                    </div>

                    {/* Active AI Models */}
                    <div className={`${T.card} p-6`}>
                      <NeonStrip color="#22d3ee" />
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                            <Cpu size={14} className="text-cyan-400" />
                          </div>
                          <h3 className="text-sm font-black text-white tracking-tight">Active AI Models</h3>
                        </div>
                        <button onClick={() => setTab('ai-models')} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors">
                          Manage <ArrowRight size={11} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['free', 'pro', 'business', 'all'].map(plan => {
                          const m = activeModelsByPlan[plan];
                          return (
                            <div key={plan} className={`rounded-xl p-4 border transition-all ${m ? 'bg-cyan-500/[0.05] border-cyan-500/10' : 'bg-white/[0.01] border-white/[0.04]'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black text-white/15 uppercase tracking-[0.25em]">{plan === 'all' ? 'All Plans' : plan}</p>
                                {m && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />}
                              </div>
                              {m ? (
                                <>
                                  <p className="text-xs font-bold text-white/80 truncate">{m.display_name}</p>
                                  <p className="text-[9px] text-white/20 font-mono truncate mt-0.5">{m.model_id}</p>
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
                      <div className={`${T.card} p-6`} style={{ borderColor: 'rgba(251,191,36,0.08)' }}>
                        <NeonStrip color="#f59e0b" />
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                            <Star size={14} className="text-amber-400" />
                          </div>
                          <h3 className="text-sm font-black text-white">Active Celebrations</h3>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {celebrations.filter(c => c.is_active).map(c => (
                            <div key={c.id} className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/[0.07] border border-amber-500/10 rounded-xl">
                              <span className="text-xl">{c.config?.emoji || '🎉'}</span>
                              <span className="text-sm font-bold text-amber-300">{c.config?.label || c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Users & Projects */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Recent Users */}
                      <div className={`${T.card} p-6`}>
                        <NeonStrip color="#3b82f6" />
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-black text-white">Recent Users</h3>
                          <button onClick={() => setTab('users')} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">View all</button>
                        </div>
                        <div className="space-y-1">
                          {data.users.slice(0, 5).map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-[11px] font-black text-blue-400 border border-blue-500/10 flex-shrink-0">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white/80 leading-tight truncate">{u.display_name || u.email || '—'}</p>
                                  <p className="text-[10px] text-white/15 leading-tight font-mono truncate">{u.email}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-white/10 tabular-nums flex-shrink-0">{new Date(u.created_at).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Projects */}
                      <div className={`${T.card} p-6`}>
                        <NeonStrip color="#10b981" />
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-black text-white">Recent Projects</h3>
                          <button onClick={() => setTab('projects')} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors">View all</button>
                        </div>
                        <div className="space-y-1">
                          {data.projects.slice(0, 5).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center border border-emerald-500/10 flex-shrink-0">
                                  <FolderOpen size={12} className="text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white/80 leading-tight truncate">{p.name}</p>
                                  <p className="text-[10px] text-white/15 leading-tight capitalize truncate">{p.project_type}</p>
                                </div>
                              </div>
                              <Badge variant={p.is_published ? 'green' : 'default'}>{p.is_published ? 'Live' : 'Draft'}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    ONBOARDING
                ══════════════════════════════════════════ */}
                {tab === 'onboarding' && (
                  <div className="space-y-6 max-w-6xl">
                    <SectionHeader title="Onboarding Responses" desc="User responses from the Get Started flow" badge={data.onboarding?.length || 0} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['founder', 'engineer', 'designer', 'product'].map(role => {
                        const count = data.onboarding?.filter((o: any) => o.role === role).length || 0;
                        return (
                          <div key={role} className={`${T.card} p-5`}>
                            <NeonStrip color="#f59e0b" />
                            <p className="text-[9px] font-black text-white/15 uppercase tracking-[0.25em] mb-1.5">{role}</p>
                            <p className="text-3xl font-black text-white tabular-nums leading-none">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                    {(!data.onboarding || data.onboarding.length === 0) ? (
                      <EmptyState icon={ClipboardList} title="No onboarding data yet" desc="Users will appear here after completing the Get Started flow." />
                    ) : (
                      <TableWrap>
                        <thead><tr>{['Name', 'Role', 'Company Size', 'Theme', 'Date'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                        <tbody>
                          {data.onboarding.map((o: any) => (
                            <Tr key={o.id}>
                              <Td><span className="text-sm font-semibold text-white/80">{o.full_name || '—'}</span></Td>
                              <Td><Badge variant="cyan">{o.role || '—'}</Badge></Td>
                              <Td><span className="text-sm text-white/40">{o.company_size || '—'}</span></Td>
                              <Td><Badge variant={o.preferred_theme === 'dark' ? 'default' : 'amber'}>{o.preferred_theme || '—'}</Badge></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{new Date(o.created_at).toLocaleDateString()}</span></Td>
                            </Tr>
                          ))}
                        </tbody>
                      </TableWrap>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    PROMO CODES
                ══════════════════════════════════════════ */}
                {tab === 'promo-codes' && (
                  <div className="space-y-6 max-w-5xl">
                    <SectionHeader title="Promo Codes" desc="Create and manage discount codes" badge={promoCodes.length} />
                    <div className={`${T.card} p-6`}>
                      <NeonStrip color="#10b981" />
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                          <Gift size={14} className="text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-black text-white">Create Promo Code</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div><label className={T.label}>Code *</label><input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={`${T.input} uppercase`} placeholder="RAMADAN25" /></div>
                        <div><label className={T.label}>Discount %</label><input type="number" value={promoDiscount} onChange={e => setPromoDiscount(Number(e.target.value))} min={1} max={100} className={T.input} /></div>
                        <div><label className={T.label}>Target Plan</label><select value={promoPlan} onChange={e => setPromoPlan(e.target.value)} className={`${T.input} cursor-pointer`}><option value="all">All Plans</option><option value="pro">Pro Only</option><option value="business">Business Only</option></select></div>
                        <div><label className={T.label}>Max Uses</label><input type="number" value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} className={T.input} placeholder="100" /></div>
                        <div><label className={T.label}>Expires At</label><input type="datetime-local" value={promoExpires} onChange={e => setPromoExpires(e.target.value)} className={T.input} /></div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={promoPublic} onChange={e => setPromoPublic(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-600 focus:ring-cyan-500/30" />
                            <span className="text-sm text-white/30 font-semibold">Public</span>
                          </label>
                        </div>
                      </div>
                      <button onClick={handleAddPromo} disabled={!promoCode.trim() || savingPromo}
                        className={`${T.btnPrimary} bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-600/15`}>
                        <Plus size={13} /> {savingPromo ? 'Creating...' : 'Create Code'}
                      </button>
                    </div>

                    {promoCodes.length === 0 ? <EmptyState icon={Gift} title="No promo codes yet" desc="Create your first promo code above." /> : (
                      <TableWrap>
                        <thead><tr>{['Code', 'Discount', 'Plan', 'Type', 'Uses', 'Expires', ''].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                        <tbody>
                          {promoCodes.map(p => (
                            <Tr key={p.id}>
                              <Td>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-cyan-400 font-mono">{p.code}</span>
                                  <button onClick={() => copyPromoCode(p.code)} className="text-white/15 hover:text-white/50 transition-colors">
                                    {copiedCode === p.code ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </Td>
                              <Td><span className="text-sm font-black text-emerald-400">{p.discount_percent}%</span></Td>
                              <Td><Badge variant="cyan">{p.target_plan}</Badge></Td>
                              <Td><Badge variant={p.is_public ? 'green' : 'default'}>{p.is_public ? 'Public' : 'Private'}</Badge></Td>
                              <Td><span className="text-sm text-white/30 tabular-nums font-mono">{p.current_uses}{p.max_uses ? `/${p.max_uses}` : ''}</span></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '∞'}</span></Td>
                              <Td>
                                <button onClick={() => handleDeletePromo(p.id)} className="w-8 h-8 rounded-xl bg-red-500/8 border border-red-500/10 flex items-center justify-center text-red-400/60 hover:bg-red-500/15 hover:text-red-400 transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </Td>
                            </Tr>
                          ))}
                        </tbody>
                      </TableWrap>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    CELEBRATIONS
                ══════════════════════════════════════════ */}
                {tab === 'celebrations' && (
                  <div className="space-y-6 max-w-4xl">
                    <SectionHeader title="Seasonal Celebrations" desc="Toggle seasonal overlays for all users" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {celebrations.map(c => (
                        <motion.div key={c.id} whileHover={{ y: -2 }} className={`${T.card} p-6 transition-all`}
                          style={c.is_active ? { borderColor: 'rgba(251,191,36,0.12)', boxShadow: '0 0 60px -20px rgba(251,191,36,0.1)' } : {}}>
                          {c.is_active && <NeonStrip color="#f59e0b" />}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-3xl">
                              {c.config?.emoji || '🎉'}
                            </div>
                            <div>
                              <h4 className="font-black text-white text-base">{c.config?.label || c.name}</h4>
                              <p className="text-[11px] text-white/20 font-mono mt-0.5">{c.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCelebration(c.id, c.is_active)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              c.is_active
                                ? 'bg-white/[0.04] text-white/40 hover:bg-white/[0.07] border border-white/[0.06]'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-600/15'
                            }`}
                          >
                            {c.is_active ? <><EyeOff size={13} /> Deactivate</> : <><Eye size={13} /> Activate</>}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    INBOX / NOTIFICATIONS
                ══════════════════════════════════════════ */}
                {tab === 'inbox' && (
                  <div className="space-y-6 max-w-4xl">
                    <SectionHeader title="Notifications" desc="Send messages to your users" badge={notifications.length} />
                    <div className={`${T.card} p-6`}>
                      <NeonStrip color="#ec4899" />
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/15 flex items-center justify-center">
                          <Send size={13} className="text-pink-400" />
                        </div>
                        <h3 className="text-sm font-black text-white">Send Notification</h3>
                      </div>
                      <div className="space-y-4">
                        <div><label className={T.label}>Title *</label><input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={T.input} placeholder="Notification title..." /></div>
                        <div><label className={T.label}>Body</label><textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={`${T.input} resize-none h-20`} placeholder="Message body..." /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div><label className={T.label}>Image URL</label><input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={T.input} placeholder="https://..." /></div>
                          <div><label className={T.label}>Link URL</label><input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={T.input} placeholder="https://..." /></div>
                          <div><label className={T.label}>Target Plan</label><select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={`${T.input} cursor-pointer`}><option value="all">All Plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></div>
                        </div>
                        <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif}
                          className={`${T.btnPrimary} bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-600/15`}>
                          <Send size={13} /> {sendingNotif ? 'Sending...' : 'Send Notification'}
                        </button>
                      </div>
                    </div>
                    {notifications.length === 0 ? <EmptyState icon={Bell} title="No notifications yet" desc="Send your first notification above." /> : (
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <div key={n.id} className={`${T.card} flex items-center justify-between p-4 hover:border-white/[0.09] transition-colors`}>
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell size={12} className="text-pink-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white/80 truncate">{n.title}</p>
                                {n.body && <p className="text-xs text-white/25 mt-0.5 truncate">{n.body}</p>}
                                <p className="text-[10px] text-white/10 mt-1.5 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteNotification(n.id)} className="w-8 h-8 rounded-xl bg-red-500/8 border border-red-500/10 flex items-center justify-center text-red-400/50 hover:bg-red-500/15 hover:text-red-400 transition-all ml-3 flex-shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    TEMPLATES
                ══════════════════════════════════════════ */}
                {tab === 'templates' && (
                  <div className="space-y-6 max-w-6xl">
                    <SectionHeader title="Templates" desc="Manage AI prompt templates" badge={templates.length} />
                    <div className={`${T.card} p-6`}>
                      <NeonStrip color="#8b5cf6" />
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                          <Plus size={13} className="text-purple-400" />
                        </div>
                        <h3 className="text-sm font-black text-white">Add Template</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div><label className={T.label}>Name *</label><input value={tplName} onChange={e => setTplName(e.target.value)} className={T.input} placeholder="Template name..." /></div>
                          <div><label className={T.label}>Category</label><input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={T.input} placeholder="general" /></div>
                          <div><label className={T.label}>Image URL</label><input value={tplImage} onChange={e => setTplImage(e.target.value)} className={T.input} placeholder="https://..." /></div>
                        </div>
                        <div><label className={T.label}>Prompt *</label><textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={`${T.input} resize-none h-24`} placeholder="AI prompt..." /></div>
                        <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}
                          className={`${T.btnPrimary} bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/15`}>
                          <Plus size={13} /> {savingTpl ? 'Saving...' : 'Add Template'}
                        </button>
                      </div>
                    </div>
                    {templates.length === 0 ? <EmptyState icon={Layers} title="No templates yet" desc="Create your first template above." /> : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {templates.map(tpl => (
                          <motion.div key={tpl.id} whileHover={{ y: -4, scale: 1.01 }} className={`group ${T.card} overflow-hidden hover:border-purple-500/15 transition-all`}>
                            <div className="aspect-video bg-white/[0.01] flex items-center justify-center overflow-hidden">
                              {tpl.image_url
                                ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <Layers size={20} className="text-white/10" />
                              }
                            </div>
                            <div className="p-4 flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white/80 truncate">{tpl.name}</p>
                                <p className="text-[10px] text-white/20 mt-0.5 capitalize">{tpl.category}</p>
                              </div>
                              <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400/70 transition-all hover:text-red-400 flex-shrink-0 ml-2">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    BLOG
                ══════════════════════════════════════════ */}
                {tab === 'blog' && <AdminBlogEditor />}

                {/* ══════════════════════════════════════════
                    AI MODELS
                ══════════════════════════════════════════ */}
                {tab === 'ai-models' && (
                  <div className="space-y-6 max-w-6xl">
                    <SectionHeader title="AI Models" desc="Configure AI providers for each plan" badge={aiModels.length} />
                    {/* Active Models Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['free', 'pro', 'business', 'all'].map(plan => {
                        const m = activeModelsByPlan[plan];
                        return (
                          <div key={plan} className={`${T.card} p-4 transition-all ${m ? '' : ''}`}
                            style={m ? { borderColor: 'rgba(34,211,238,0.1)', boxShadow: '0 0 30px -15px rgba(34,211,238,0.1)' } : {}}>
                            {m && <NeonStrip color="#22d3ee" />}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.25em]">{plan === 'all' ? 'All Plans' : plan}</span>
                              {m && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />}
                            </div>
                            {m ? (
                              <>
                                <p className="text-sm font-bold text-white/80 truncate">{m.display_name}</p>
                                <p className="text-[9px] text-white/15 font-mono truncate mt-0.5">{m.model_id}</p>
                                <Badge variant="cyan" >{m.provider}</Badge>
                              </>
                            ) : (
                              <p className="text-xs text-white/10 italic mt-1">No active model</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Model Form */}
                    <div className={`${T.card} p-6`}>
                      <NeonStrip color="#22d3ee" />
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                          <Cpu size={13} className="text-cyan-400" />
                        </div>
                        <h3 className="text-sm font-black text-white">Add AI Model</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className={T.label}>Provider</label>
                              <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className={`${T.input} cursor-pointer`}>
                                <option value="vercel">Vercel AI</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="nvidia">NVIDIA NIM</option>
                                <option value="lovable">Lovable AI</option>
                              </select>
                            </div>
                            <div><label className={T.label}>Target Plan</label>
                              <select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className={`${T.input} cursor-pointer`}>
                                <option value="all">All Plans</option>
                                <option value="free">Free Only</option>
                                <option value="pro">Pro Only</option>
                                <option value="business">Business Only</option>
                              </select>
                            </div>
                          </div>
                          <div><label className={T.label}>Model ID *</label><input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className={T.input} placeholder={providerDefaults[aiProvider]?.placeholder} /></div>
                          <div><label className={T.label}>Display Name *</label><input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className={T.input} placeholder="e.g. Gemini 3 Flash" /></div>
                          <div><label className={T.label}>Gateway URL</label><input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className={`${T.input} text-xs`} /></div>
                          <div><label className={T.label}>API Key Secret</label><input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className={T.input} /></div>
                          <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel}
                            className={`${T.btnPrimary} w-full justify-center bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-600/15`}>
                            <Plus size={13} /> {savingModel ? 'Saving...' : 'Add Model'}
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className={`${T.card} p-4`}>
                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Priority Logic</p>
                            <p className="text-xs text-white/25 leading-relaxed">Specific plan match → "All Plans" fallback.</p>
                          </div>
                          <div className={`${T.card} p-4`}>
                            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Providers</p>
                            <div className="space-y-2">
                              {Object.entries(providerDefaults).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-xs text-white/25 font-bold capitalize">{key}</span>
                                  <span className="text-[9px] text-white/10 font-mono">{val.key}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Models Table */}
                    {aiModels.length === 0 ? <EmptyState icon={Cpu} title="No models configured" desc="Add your first AI model above." /> : (
                      <TableWrap>
                        <thead><tr>{['Status', 'Provider', 'Model', 'Name', 'Plan', ''].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                        <tbody>
                          {aiModels.map(m => (
                            <Tr key={m.id}>
                              <Td>
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${m.is_active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'bg-white/[0.03] text-white/15'}`}>
                                  {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                                  {m.is_active ? 'Active' : 'Off'}
                                </span>
                              </Td>
                              <Td><span className="text-xs font-bold text-white/25 capitalize">{m.provider}</span></Td>
                              <Td><span className="text-xs font-mono text-cyan-400">{m.model_id}</span></Td>
                              <Td><span className="text-sm font-semibold text-white/80">{m.display_name}</span></Td>
                              <Td><Badge variant="default">{m.target_plan === 'all' ? 'All' : m.target_plan}</Badge></Td>
                              <Td>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleAiModel(m.id, m.is_active)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                      m.is_active
                                        ? 'bg-white/[0.04] text-white/25 hover:bg-white/[0.07]'
                                        : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm hover:from-cyan-500 hover:to-indigo-500'
                                    }`}
                                  >
                                    {m.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button onClick={() => handleDeleteAiModel(m.id)} className="w-8 h-8 rounded-xl bg-red-500/8 border border-red-500/10 flex items-center justify-center text-red-400/50 hover:bg-red-500/15 hover:text-red-400 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </Td>
                            </Tr>
                          ))}
                        </tbody>
                      </TableWrap>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    DATA TABLES (users / plans / transactions / projects)
                ══════════════════════════════════════════ */}
                {(['users', 'plans', 'transactions', 'projects'] as TabKey[]).includes(tab) && (
                  <div className="space-y-6 max-w-7xl">
                    <SectionHeader
                      title={tabTitle}
                      badge={
                        tab === 'users' ? data.users.length
                        : tab === 'plans' ? data.plans.length
                        : tab === 'projects' ? data.projects.length
                        : data.transactions.length
                      }
                    />
                    <TableWrap>
                      <thead>
                        <tr>
                          {tab === 'users'        && ['Email', 'Name', 'Joined'].map(h => <Th key={h}>{h}</Th>)}
                          {tab === 'plans'        && ['User', 'Plan', 'Daily', 'Used Today', 'Total Used', 'Expires'].map(h => <Th key={h}>{h}</Th>)}
                          {tab === 'transactions' && ['User', 'Credits', 'Model', 'Type', 'Date'].map(h => <Th key={h}>{h}</Th>)}
                          {tab === 'projects'     && ['Name', 'Type', 'Status', 'Created'].map(h => <Th key={h}>{h}</Th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tab === 'users' && data.users
                          .filter(u => !searchQuery || JSON.stringify(u).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((u: any) => (
                            <Tr key={u.id}>
                              <Td>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/10 flex-shrink-0">
                                    {(u.email || '?')[0].toUpperCase()}
                                  </div>
                                  <span className="text-sm text-white/60 font-mono truncate max-w-[200px]">{u.email || '—'}</span>
                                </div>
                              </Td>
                              <Td><span className="text-sm font-semibold text-white/80">{u.display_name || '—'}</span></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{new Date(u.created_at).toLocaleDateString()}</span></Td>
                            </Tr>
                          ))}

                        {tab === 'plans' && data.plans
                          .filter(p => !searchQuery || JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((p: any) => (
                            <Tr key={p.id}>
                              <Td><span className="text-xs font-mono text-white/30 max-w-[100px] truncate block">{p.user_id?.slice(0, 8)}</span></Td>
                              <Td><Badge variant={p.plan === 'pro' ? 'cyan' : p.plan === 'business' ? 'amber' : 'default'}>{p.plan}</Badge></Td>
                              <Td><span className="text-sm text-white/40 tabular-nums">{p.daily_credits}</span></Td>
                              <Td><span className="text-sm text-white/40 tabular-nums">{p.credits_used_today}</span></Td>
                              <Td><span className="text-sm text-white/40 tabular-nums">{p.total_credits_used}</span></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{p.subscription_expires_at ? new Date(p.subscription_expires_at).toLocaleDateString() : '—'}</span></Td>
                            </Tr>
                          ))}

                        {tab === 'transactions' && data.transactions
                          .filter(t => !searchQuery || JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((t: any) => (
                            <Tr key={t.id}>
                              <Td><span className="text-xs font-mono text-white/25 max-w-[100px] truncate block">{t.user_id?.slice(0, 8)}</span></Td>
                              <Td><span className="text-sm font-black text-purple-400 tabular-nums">{t.credits_used}</span></Td>
                              <Td><span className="text-xs font-mono text-white/25">{t.model_used || '—'}</span></Td>
                              <Td><Badge variant="default">{t.work_type || '—'}</Badge></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{new Date(t.created_at).toLocaleString()}</span></Td>
                            </Tr>
                          ))}

                        {tab === 'projects' && data.projects
                          .filter(p => !searchQuery || JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((p: any) => (
                            <Tr key={p.id}>
                              <Td><span className="text-sm font-bold text-white/80">{p.name}</span></Td>
                              <Td><span className="text-xs text-white/25 capitalize">{p.project_type}</span></Td>
                              <Td><Badge variant={p.is_published ? 'green' : 'default'}>{p.is_published ? 'Published' : 'Draft'}</Badge></Td>
                              <Td><span className="text-xs text-white/15 tabular-nums font-mono">{new Date(p.created_at).toLocaleDateString()}</span></Td>
                            </Tr>
                          ))}
                      </tbody>
                    </TableWrap>
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
