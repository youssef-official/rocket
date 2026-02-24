import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Mail, Layers, Plus, Trash2, Send, TrendingUp,
  LogOut, ChevronRight, Bell, Search, Settings, Eye,
  BarChart2, Download, ChevronDown, Filter, Code,
  LayoutGrid, MessageCircle, Calendar, DollarSign,
  ArrowLeftRight, GraduationCap, ShoppingCart, Star, Coins,
  FileText, PanelLeftClose, PanelLeftOpen, Cpu, Save, Power, PowerOff,
  Activity, Zap, Globe, Shield, Hash, Clock, ChevronUp,
  ToggleLeft, ToggleRight, Sparkles, Database, Rocket,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

type TabKey = 'dashboard' | 'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates' | 'blog' | 'ai-models';

export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
          if (msg.includes('Unauthorized') || msg.includes('401')) {
            setError('Unauthorized - Please log in again');
            return;
          }
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
  }, [user, authLoading, navigate]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('inbox_notifications').select('*').order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('sort_order', { ascending: true });
    if (data) setTemplates(data);
  };

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
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    await fetchTemplates();
  };

  // AI Models
  const fetchAiModels = async () => {
    const { data } = await supabase.from('ai_model_config').select('*').order('created_at', { ascending: false });
    if (data) setAiModels(data);
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
    if (defaults) {
      setAiGatewayUrl(defaults.url);
      setAiKeySecretName(defaults.key);
      setAiModelId('');
    }
  };

  const handleAddAiModel = async () => {
    if (!aiModelId.trim() || !aiDisplayName.trim()) return;
    setSavingModel(true);
    await supabase.from('ai_model_config').insert({
      provider: aiProvider,
      model_id: aiModelId,
      display_name: aiDisplayName,
      gateway_url: aiGatewayUrl,
      api_key_secret_name: aiKeySecretName,
      target_plan: aiTargetPlan,
      is_active: false,
      created_by: user?.id,
    });
    setAiModelId(''); setAiDisplayName('');
    await fetchAiModels();
    setSavingModel(false);
  };

  // FIXED: Only deactivate models with the SAME target_plan
  const handleToggleAiModel = async (id: string, currentActive: boolean) => {
    if (!currentActive) {
      const model = aiModels.find(m => m.id === id);
      if (model) {
        // Only deactivate other models with the EXACT same target_plan
        const idsToDeactivate = aiModels
          .filter(m => m.id !== id && m.is_active && m.target_plan === model.target_plan)
          .map(m => m.id);
        if (idsToDeactivate.length > 0) {
          await supabase.from('ai_model_config').update({ is_active: false }).in('id', idsToDeactivate);
        }
      }
    }
    await supabase.from('ai_model_config').update({ is_active: !currentActive }).eq('id', id);
    await fetchAiModels();
  };

  const handleDeleteAiModel = async (id: string) => {
    await supabase.from('ai_model_config').delete().eq('id', id);
    await fetchAiModels();
  };

  // Computed: active model per plan
  const activeModelsByPlan = useMemo(() => {
    const map: Record<string, any> = {};
    aiModels.filter(m => m.is_active).forEach(m => {
      map[m.target_plan] = m;
    });
    return map;
  }, [aiModels]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING / ERROR / NULL
  // ═══════════════════════════════════════════════════════════════════════════
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06080c]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06080c]">
        <div className="bg-[#111318] border border-white/10 rounded-2xl p-10 text-center max-w-md">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // NAV CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  const navItems: { key: TabKey; label: string; icon: any; count?: number; section?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, section: 'Overview' },
    { key: 'users', label: 'Users', icon: Users, count: data.users.length, section: 'Overview' },
    { key: 'projects', label: 'Projects', icon: FolderOpen, count: data.projects.length, section: 'Overview' },
    { key: 'transactions', label: 'Analytics', icon: BarChart2, count: data.transactions.length, section: 'Data' },
    { key: 'plans', label: 'Plans', icon: CreditCard, count: data.plans.length, section: 'Data' },
    { key: 'ai-models', label: 'AI Models', icon: Cpu, count: aiModels.length, section: 'Config' },
    { key: 'templates', label: 'Templates', icon: Layers, count: templates.length, section: 'Content' },
    { key: 'inbox', label: 'Notifications', icon: Bell, count: notifications.length, section: 'Content' },
    { key: 'blog', label: 'Blog', icon: FileText, section: 'Content' },
  ];

  const displayName = (data?.users?.find((u: any) => u.id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';

  // Group nav by section
  const sections = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const s = item.section || 'Other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {});

  const totalCreditsUsed = data.transactions.reduce((sum: number, t: any) => sum + (Number(t.credits_used) || 0), 0);

  return (
    <div className="flex h-screen bg-[#06080c] text-gray-200 overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[250px]'} bg-[#0a0d12] border-r border-white/[0.06] flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out`}>
        
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Rocket size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-bold text-white tracking-tight">Vivora</span>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-3 mb-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all flex items-center justify-center"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-1.5">{section}</p>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 mb-0.5
                      ${active
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                      }`}
                  >
                    <Icon size={17} className={active ? 'text-blue-400' : ''} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${active ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.05] text-gray-600'}`}>
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/[0.08] transition-all">
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="px-7 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0d12]/80 backdrop-blur-sm flex-shrink-0">
          <div>
            <p className="text-[11px] text-gray-600 mb-0.5">Welcome back, {displayName} 👋</p>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {tab === 'dashboard' ? 'Dashboard' : tab === 'ai-models' ? 'AI Models' : tab === 'transactions' ? 'Analytics' : navItems.find(n => n.key === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl w-52">
              <Search size={14} className="text-gray-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-xs text-gray-300 w-full placeholder:text-gray-600"
              />
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {<div className="pr-1">
                <p className="text-xs font-semibold text-gray-200">{displayName}</p>
                <p className="text-[10px] text-gray-600">{user?.email}</p>
              </div>}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-7 bg-[#0b0e14]">

          {/* ══════════════ DASHBOARD ══════════════ */}
          {tab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Users', value: data.users.length, icon: Users, color: 'from-violet-500/20 to-purple-500/10', iconColor: 'text-violet-400', borderColor: 'border-violet-500/20' },
                  { label: 'Projects', value: data.projects.length, icon: FolderOpen, color: 'from-blue-500/20 to-cyan-500/10', iconColor: 'text-blue-400', borderColor: 'border-blue-500/20' },
                  { label: 'Credits Used', value: totalCreditsUsed.toFixed(1), icon: Zap, color: 'from-amber-500/20 to-orange-500/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20' },
                  { label: 'Active Plans', value: data.plans.length, icon: Shield, color: 'from-emerald-500/20 to-green-500/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={`bg-[#111419] border ${stat.borderColor} rounded-2xl p-5 flex items-start gap-4 hover:border-white/10 transition-colors`}>
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={20} className={stat.iconColor} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active AI Models Summary */}
              <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Active AI Models</h3>
                  </div>
                  <button onClick={() => setTab('ai-models')} className="text-[11px] text-blue-400 hover:underline">Manage →</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['free', 'pro', 'business', 'all'].map(plan => {
                    const m = activeModelsByPlan[plan];
                    return (
                      <div key={plan} className={`rounded-xl p-3 border ${m ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{plan === 'all' ? 'All Plans' : plan}</p>
                        {m ? (
                          <>
                            <p className="text-xs font-semibold text-white truncate">{m.display_name}</p>
                            <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">{m.model_id}</p>
                          </>
                        ) : (
                          <p className="text-[11px] text-gray-600">Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two column grid */}
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Recent Users</h3>
                    <button onClick={() => setTab('users')} className="text-[11px] text-blue-400 hover:underline">View all</button>
                  </div>
                  <div className="space-y-1">
                    {data.users.slice(0, 6).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                            {(u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-200">{u.display_name || u.email || '—'}</p>
                            <p className="text-[10px] text-gray-600">{u.email}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-600">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Recent Projects</h3>
                    <button onClick={() => setTab('projects')} className="text-[11px] text-blue-400 hover:underline">View all</button>
                  </div>
                  <div className="space-y-1">
                    {data.projects.slice(0, 6).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                            <FolderOpen size={12} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-200">{p.name}</p>
                            <p className="text-[10px] text-gray-600">{p.project_type}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.05] text-gray-500'}`}>
                          {p.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════ INBOX ══════════════ */}
          {tab === 'inbox' && (
            <>
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Send size={14} className="text-blue-400" /></div>
                    <h3 className="text-sm font-semibold text-white">Send Notification</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Title *</label>
                      <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="Notification title..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Body</label>
                      <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600 resize-none h-20" placeholder="Optional message body..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                        <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Link URL</label>
                        <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Plan</label>
                      <select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 cursor-pointer">
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Send size={13} /> {sendingNotif ? 'Sending...' : 'Send Notification'}
                    </button>
                  </div>
                </div>
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-2">How it works</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Send push notifications to all users or target specific plans. Notifications appear in the user's inbox bell icon.
                  </p>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3"><Bell size={20} className="text-blue-400" /></div>
                  <h3 className="text-sm font-semibold text-white mb-1">No notifications</h3>
                  <p className="text-xs text-gray-500 max-w-xs">Send your first notification to reach all users.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-4 bg-[#111419] border border-white/[0.06] rounded-xl hover:border-white/10 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-gray-200">{n.title}</p>
                        {n.body && <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-gray-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDeleteNotification(n.id)} className="w-8 h-8 rounded-lg bg-red-500/[0.08] border border-red-500/15 flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════════ TEMPLATES ══════════════ */}
          {tab === 'templates' && (
            <>
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Plus size={14} className="text-blue-400" /></div>
                    <h3 className="text-sm font-semibold text-white">Add Template</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                      <input value={tplName} onChange={e => setTplName(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="Template name..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                        <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="general" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                        <input value={tplImage} onChange={e => setTplImage(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Prompt *</label>
                      <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600 resize-none h-20" placeholder="AI prompt..." />
                    </div>
                    <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Plus size={13} /> {savingTpl ? 'Saving...' : 'Add Template'}
                    </button>
                  </div>
                </div>
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-2">Templates</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Templates help users quickly start with predefined prompts. Add a name, optional category and image, and the AI prompt.
                  </p>
                </div>
              </div>

              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3"><Layers size={20} className="text-blue-400" /></div>
                  <h3 className="text-sm font-semibold text-white mb-1">No templates</h3>
                  <p className="text-xs text-gray-500 max-w-xs">Create your first template.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="group bg-[#111419] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-all">
                      <div className="aspect-video bg-white/[0.02] flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover" /> : <Layers size={18} className="text-gray-700" />}
                      </div>
                      <div className="p-3 flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-200">{tpl.name}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{tpl.category}</p>
                        </div>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-red-500/[0.08] flex items-center justify-center text-red-400 transition-opacity">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════════ BLOG ══════════════ */}
          {tab === 'blog' && <AdminBlogEditor />}

          {/* ══════════════ AI MODELS ══════════════ */}
          {tab === 'ai-models' && (
            <>
              {/* Active models summary cards */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {['free', 'pro', 'business', 'all'].map(plan => {
                  const m = activeModelsByPlan[plan];
                  return (
                    <div key={plan} className={`rounded-2xl p-4 border transition-colors ${m ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-[#111419] border-white/[0.06]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {plan === 'all' ? '🌐 All Plans' : plan === 'free' ? '🆓 Free' : plan === 'pro' ? '⭐ Pro' : '🏢 Business'}
                        </span>
                        {m && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      {m ? (
                        <>
                          <p className="text-sm font-bold text-white truncate">{m.display_name}</p>
                          <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">{m.model_id}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold capitalize">{m.provider}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-600 mt-1">No active model</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add model form */}
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Cpu size={14} className="text-blue-400" /></div>
                    <h3 className="text-sm font-semibold text-white">Add AI Model</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Provider</label>
                        <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 cursor-pointer">
                          <option value="vercel">Vercel AI Gateway</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="nvidia">NVIDIA NIM</option>
                          <option value="lovable">Lovable AI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Plan</label>
                        <select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 cursor-pointer">
                          <option value="all">🌐 All Plans</option>
                          <option value="free">🆓 Free Only</option>
                          <option value="pro">⭐ Pro Only</option>
                          <option value="business">🏢 Business Only</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Model ID *</label>
                      <input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors font-mono placeholder:text-gray-600" placeholder={providerDefaults[aiProvider]?.placeholder} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Display Name *</label>
                      <input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600" placeholder="e.g. Gemini 3 Flash" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Gateway URL</label>
                      <input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[10px] text-gray-200 outline-none focus:border-blue-500/40 transition-colors font-mono placeholder:text-gray-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">API Key Secret</label>
                      <input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-200 outline-none focus:border-blue-500/40 transition-colors font-mono placeholder:text-gray-600" />
                    </div>
                    <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Plus size={13} /> {savingModel ? 'Saving...' : 'Add Model'}
                    </button>
                  </div>
                </div>
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-3">How Model Routing Works</h4>
                  <div className="space-y-3">
                    <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-xl p-3">
                      <p className="text-[11px] text-blue-400 font-semibold mb-1">🎯 Priority Logic</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        The system first looks for a model matching the user's exact plan (free/pro/business). If none found, falls back to "All Plans" model.
                      </p>
                    </div>
                    <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3">
                      <p className="text-[11px] text-emerald-400 font-semibold mb-1">✅ Multi-Plan Support</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        You can have different models active for different plans simultaneously. Only one model per plan scope.
                      </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-[11px] text-gray-300 font-semibold mb-2">Providers</p>
                      <div className="space-y-1.5">
                        {Object.entries(providerDefaults).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-300 font-medium capitalize">{key}</span>
                            <span className="text-[10px] text-gray-600 font-mono">{val.key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Models table */}
              {aiModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3"><Cpu size={20} className="text-blue-400" /></div>
                  <h3 className="text-sm font-semibold text-white mb-1">No models configured</h3>
                  <p className="text-xs text-gray-500 max-w-xs">Add your first AI model to start.</p>
                </div>
              ) : (
                <div className="bg-[#111419] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Key</th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map(m => (
                        <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md ${m.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-gray-500'}`}>
                              {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              {m.is_active ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 capitalize">{m.provider}</span>
                          </td>
                          <td className="px-4 py-3 text-[11px] font-mono text-blue-300">{m.model_id}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-200">{m.display_name}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white/[0.04] text-gray-400 capitalize">
                              {m.target_plan === 'all' ? '🌐 All' : m.target_plan === 'free' ? '🆓 Free' : m.target_plan === 'pro' ? '⭐ Pro' : '🏢 Biz'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-gray-500">{m.api_key_secret_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleAiModel(m.id, m.is_active)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${m.is_active ? 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                              >
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDeleteAiModel(m.id)} className="w-7 h-7 rounded-lg bg-red-500/[0.08] border border-red-500/15 flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-colors">
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
            </>
          )}

          {/* ══════════════ DATA TABLES ══════════════ */}
          {['users', 'plans', 'transactions', 'projects'].includes(tab) && (
            <>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:bg-white/[0.06] transition-colors">
                  <Filter size={13} /> All {navItems.find(n => n.key === tab)?.label}
                </button>
                <div className="flex-1" />
                <button className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:bg-white/[0.06] hover:text-gray-300 transition-colors">
                  <Download size={15} />
                </button>
              </div>

              <div className="bg-[#111419] border border-white/[0.06] rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  {tab === 'users' && (
                    <>
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map(u => (
                          <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-gray-200">{u.display_name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{u.email || '—'}</td>
                            <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'plans' && (
                    <>
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Daily</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Used Today</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Monthly</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.plans.map(p => (
                          <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-[11px] font-mono text-blue-300">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 capitalize">{p.plan}</span></td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-200">{p.daily_credits}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{p.credits_used_today}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-200">{p.monthly_credits}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{p.total_credits_used}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'transactions' && (
                    <>
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map(t => (
                          <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-[11px] font-mono text-blue-300">{t.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-200">{t.credits_used}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{t.work_type || '—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{t.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'projects' && (
                    <>
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.projects.map(p => (
                          <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-xs font-semibold text-gray-200">{p.name}</td>
                            <td className="px-4 py-3 text-[11px] font-mono text-blue-300">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{p.project_type}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-gray-500'}`}>
                                <Eye size={9} /> {p.is_published ? 'Live' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
