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
  ToggleLeft, ToggleRight, Sparkles, Database, Rocket, Home,
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

  const handleToggleAiModel = async (id: string, currentActive: boolean) => {
    if (!currentActive) {
      const model = aiModels.find(m => m.id === id);
      if (model) {
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

  const activeModelsByPlan = useMemo(() => {
    const map: Record<string, any> = {};
    aiModels.filter(m => m.is_active).forEach(m => {
      map[m.target_plan] = m;
    });
    return map;
  }, [aiModels]);

  // ─── Styles ─────────────────────────────────────────
  const inputClass = "w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";
  const cardClass = "bg-card border border-border rounded-xl p-6 shadow-sm";
  const btnPrimary = "px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm";
  const btnDanger = "w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors";
  const thClass = "px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdClass = "px-5 py-3.5";

  // ─── Loading / Error ─────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className={`${cardClass} text-center max-w-sm`}>
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button onClick={() => navigate('/')} className={btnPrimary + ' w-full'}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ─── Nav ───────────────────────────────────────────
  const navItems: { key: TabKey; label: string; icon: any; count?: number; section?: string }[] = [
    { key: 'dashboard', label: 'Overview', icon: LayoutGrid, section: 'General' },
    { key: 'users', label: 'Users', icon: Users, count: data.users.length, section: 'General' },
    { key: 'projects', label: 'Projects', icon: FolderOpen, count: data.projects.length, section: 'General' },
    { key: 'transactions', label: 'Analytics', icon: BarChart2, count: data.transactions.length, section: 'Management' },
    { key: 'plans', label: 'Plans', icon: CreditCard, count: data.plans.length, section: 'Management' },
    { key: 'ai-models', label: 'AI Models', icon: Cpu, count: aiModels.length, section: 'Configuration' },
    { key: 'templates', label: 'Templates', icon: Layers, count: templates.length, section: 'Content' },
    { key: 'inbox', label: 'Notifications', icon: Bell, count: notifications.length, section: 'Content' },
    { key: 'blog', label: 'Blog', icon: FileText, section: 'Content' },
  ];

  const displayName = (data?.users?.find((u: any) => u.id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';
  const sections = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const s = item.section || 'Other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {});
  const totalCreditsUsed = data.transactions.reduce((sum: number, t: any) => sum + (Number(t.credits_used) || 0), 0);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif" }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col h-screen flex-shrink-0 transition-all duration-300`}>

        {/* Brand */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Rocket size={18} className="text-primary" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-semibold text-foreground tracking-tight">Admin</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-5">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] px-3 mb-2">{section}</p>
              )}
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
                        ${active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                    >
                      <Icon size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className={`text-[10px] font-mono font-semibold min-w-[20px] text-center px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
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
        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <Home size={18} />
            {!sidebarCollapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {tab === 'dashboard' ? 'Overview' : tab === 'ai-models' ? 'AI Models' : tab === 'transactions' ? 'Analytics' : navItems.find(n => n.key === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg w-56">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border border-border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ══════════════ DASHBOARD ══════════════ */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Welcome back, {displayName}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your platform.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: data.users.length, icon: Users, desc: 'Registered accounts' },
                  { label: 'Projects', value: data.projects.length, icon: FolderOpen, desc: 'Created projects' },
                  { label: 'Credits Used', value: totalCreditsUsed.toFixed(1), icon: Zap, desc: 'All-time usage' },
                  { label: 'Active Plans', value: data.plans.length, icon: Shield, desc: 'Subscribed users' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon size={20} className="text-primary" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Active AI Models */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Cpu size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Active AI Models</h3>
                  </div>
                  <button onClick={() => setTab('ai-models')} className="text-xs text-primary hover:underline font-medium">Manage →</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['free', 'pro', 'business', 'all'].map(plan => {
                    const m = activeModelsByPlan[plan];
                    return (
                      <div key={plan} className={`rounded-lg p-3.5 border transition-colors ${m ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{plan === 'all' ? 'All Plans' : plan}</p>
                        {m ? (
                          <>
                            <p className="text-sm font-semibold text-foreground truncate">{m.display_name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{m.model_id}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground/60">Not configured</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Users & Projects */}
              <div className="grid grid-cols-2 gap-5">
                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Recent Users</h3>
                    <button onClick={() => setTab('users')} className="text-xs text-primary hover:underline font-medium">View all</button>
                  </div>
                  <div className="space-y-0">
                    {data.users.slice(0, 5).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {(u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.display_name || u.email || '—'}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Recent Projects</h3>
                    <button onClick={() => setTab('projects')} className="text-xs text-primary hover:underline font-medium">View all</button>
                  </div>
                  <div className="space-y-0">
                    {data.projects.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <FolderOpen size={14} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground">{p.project_type}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {p.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ INBOX ══════════════ */}
          {tab === 'inbox' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className={cardClass}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <Send size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Send Notification</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Title *</label>
                      <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={inputClass} placeholder="Notification title..." />
                    </div>
                    <div>
                      <label className={labelClass}>Body</label>
                      <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={inputClass + ' resize-none h-20'} placeholder="Optional message body..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Image URL</label>
                        <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={inputClass} placeholder="https://..." />
                      </div>
                      <div>
                        <label className={labelClass}>Link URL</label>
                        <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={inputClass} placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Target Plan</label>
                      <select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={inputClass + ' cursor-pointer'}>
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif} className={btnPrimary + ' w-full'}>
                      <Send size={14} /> {sendingNotif ? 'Sending...' : 'Send Notification'}
                    </button>
                  </div>
                </div>
                <div className={cardClass}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">How it works</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Send push notifications to all users or target specific plans. Notifications appear in the user's inbox bell icon.
                  </p>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Bell size={22} className="text-muted-foreground" /></div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No notifications yet</h3>
                  <p className="text-sm text-muted-foreground">Send your first notification to reach your users.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDeleteNotification(n.id)} className={btnDanger}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TEMPLATES ══════════════ */}
          {tab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className={cardClass}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <Plus size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Add Template</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Name *</label>
                      <input value={tplName} onChange={e => setTplName(e.target.value)} className={inputClass} placeholder="Template name..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Category</label>
                        <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={inputClass} placeholder="general" />
                      </div>
                      <div>
                        <label className={labelClass}>Image URL</label>
                        <input value={tplImage} onChange={e => setTplImage(e.target.value)} className={inputClass} placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Prompt *</label>
                      <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={inputClass + ' resize-none h-20'} placeholder="AI prompt..." />
                    </div>
                    <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl} className={btnPrimary + ' w-full'}>
                      <Plus size={14} /> {savingTpl ? 'Saving...' : 'Add Template'}
                    </button>
                  </div>
                </div>
                <div className={cardClass}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">About Templates</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Templates help users quickly start with predefined prompts. Add a name, optional category and image, and the AI prompt.
                  </p>
                </div>
              </div>

              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Layers size={22} className="text-muted-foreground" /></div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No templates yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first template to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted/50 flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover" /> : <Layers size={20} className="text-muted-foreground/40" />}
                      </div>
                      <div className="p-3 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.category}</p>
                        </div>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center text-destructive transition-opacity">
                          <Trash2 size={12} />
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
            <div className="space-y-6">
              {/* Active models summary */}
              <div className="grid grid-cols-4 gap-4">
                {['free', 'pro', 'business', 'all'].map(plan => {
                  const m = activeModelsByPlan[plan];
                  return (
                    <div key={plan} className={`${cardClass} transition-colors ${m ? 'ring-1 ring-primary/20' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {plan === 'all' ? 'All Plans' : plan}
                        </span>
                        {m && <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                      {m ? (
                        <>
                          <p className="text-sm font-semibold text-foreground truncate">{m.display_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{m.model_id}</p>
                          <span className="inline-block text-[10px] mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold capitalize">{m.provider}</span>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 mt-1">No active model</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add model + info */}
              <div className="grid grid-cols-2 gap-5">
                <div className={cardClass}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <Cpu size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Add AI Model</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Provider</label>
                        <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className={inputClass + ' cursor-pointer'}>
                          <option value="vercel">Vercel AI Gateway</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="nvidia">NVIDIA NIM</option>
                          <option value="lovable">Lovable AI</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Target Plan</label>
                        <select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className={inputClass + ' cursor-pointer'}>
                          <option value="all">All Plans</option>
                          <option value="free">Free Only</option>
                          <option value="pro">Pro Only</option>
                          <option value="business">Business Only</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Model ID *</label>
                      <input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className={inputClass + ' font-mono'} placeholder={providerDefaults[aiProvider]?.placeholder} />
                    </div>
                    <div>
                      <label className={labelClass}>Display Name *</label>
                      <input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className={inputClass} placeholder="e.g. Gemini 3 Flash" />
                    </div>
                    <div>
                      <label className={labelClass}>Gateway URL</label>
                      <input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className={inputClass + ' font-mono text-xs'} />
                    </div>
                    <div>
                      <label className={labelClass}>API Key Secret</label>
                      <input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className={inputClass + ' font-mono'} />
                    </div>
                    <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel} className={btnPrimary + ' w-full'}>
                      <Plus size={14} /> {savingModel ? 'Saving...' : 'Add Model'}
                    </button>
                  </div>
                </div>
                <div className={cardClass}>
                  <h4 className="text-sm font-semibold text-foreground mb-4">How Model Routing Works</h4>
                  <div className="space-y-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <p className="text-xs text-primary font-semibold mb-1">Priority Logic</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The system first looks for a model matching the user's exact plan (free/pro/business). If none found, falls back to "All Plans" model.
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <p className="text-xs text-foreground font-semibold mb-1">Multi-Plan Support</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You can have different models active for different plans simultaneously. Only one model per plan scope.
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <p className="text-xs text-foreground font-semibold mb-2">Providers</p>
                      <div className="space-y-1.5">
                        {Object.entries(providerDefaults).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-foreground font-medium capitalize">{key}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{val.key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Models table */}
              {aiModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Cpu size={22} className="text-muted-foreground" /></div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No models configured</h3>
                  <p className="text-sm text-muted-foreground">Add your first AI model to start.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Provider</th>
                        <th className={thClass}>Model</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Plan</th>
                        <th className={thClass}>Key</th>
                        <th className={thClass + ' text-right'}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className={tdClass}>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                              {m.is_active ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-foreground capitalize">{m.provider}</span>
                          </td>
                          <td className={tdClass + ' text-xs font-mono text-primary'}>{m.model_id}</td>
                          <td className={tdClass + ' text-sm font-medium text-foreground'}>{m.display_name}</td>
                          <td className={tdClass}>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                              {m.target_plan === 'all' ? 'All' : m.target_plan}
                            </span>
                          </td>
                          <td className={tdClass + ' text-xs font-mono text-muted-foreground'}>{m.api_key_secret_name}</td>
                          <td className={tdClass}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleAiModel(m.id, m.is_active)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${m.is_active ? 'bg-muted text-muted-foreground hover:bg-accent' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                              >
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDeleteAiModel(m.id)} className={btnDanger}>
                                <Trash2 size={13} />
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
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted/50 border border-border text-muted-foreground hover:bg-accent transition-colors">
                  <Filter size={14} /> All {navItems.find(n => n.key === tab)?.label}
                </button>
                <div className="flex-1" />
                <button className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
                  <Download size={16} />
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  {tab === 'users' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className={thClass}>User</th>
                          <th className={thClass}>Email</th>
                          <th className={thClass}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map(u => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className={tdClass}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-foreground">{u.display_name || '—'}</span>
                              </div>
                            </td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{u.email || '—'}</td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'plans' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className={thClass}>User</th>
                          <th className={thClass}>Plan</th>
                          <th className={thClass}>Daily</th>
                          <th className={thClass}>Used Today</th>
                          <th className={thClass}>Monthly</th>
                          <th className={thClass}>Total Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.plans.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className={tdClass + ' text-xs font-mono text-primary'}>{p.user_id?.slice(0, 8)}…</td>
                            <td className={tdClass}><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">{p.plan}</span></td>
                            <td className={tdClass + ' text-sm font-medium text-foreground'}>{p.daily_credits}</td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{p.credits_used_today}</td>
                            <td className={tdClass + ' text-sm font-medium text-foreground'}>{p.monthly_credits}</td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{p.total_credits_used}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'transactions' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className={thClass}>Date</th>
                          <th className={thClass}>User</th>
                          <th className={thClass}>Credits</th>
                          <th className={thClass}>Type</th>
                          <th className={thClass}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map(t => (
                          <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{new Date(t.created_at).toLocaleString()}</td>
                            <td className={tdClass + ' text-xs font-mono text-primary'}>{t.user_id?.slice(0, 8)}…</td>
                            <td className={tdClass + ' text-sm font-medium text-foreground'}>{t.credits_used}</td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{t.work_type || '—'}</td>
                            <td className={tdClass + ' text-sm text-muted-foreground max-w-[200px] truncate'}>{t.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'projects' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className={thClass}>Project</th>
                          <th className={thClass}>User</th>
                          <th className={thClass}>Type</th>
                          <th className={thClass}>Status</th>
                          <th className={thClass}>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.projects.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className={tdClass + ' text-sm font-medium text-foreground'}>{p.name}</td>
                            <td className={tdClass + ' text-xs font-mono text-primary'}>{p.user_id?.slice(0, 8)}…</td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{p.project_type}</td>
                            <td className={tdClass}>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${p.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Eye size={10} /> {p.is_published ? 'Live' : 'Draft'}
                              </span>
                            </td>
                            <td className={tdClass + ' text-sm text-muted-foreground'}>{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
