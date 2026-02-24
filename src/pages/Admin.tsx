import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Layers, Plus, Trash2, Send, Bell, Search, Eye,
  BarChart2, Download, Filter, FileText,
  PanelLeftClose, PanelLeftOpen, Cpu, Power, PowerOff,
  Zap, Shield, Home, Rocket, ChevronRight, LayoutDashboard,
  Settings2, Megaphone, BookOpen, Package, ArrowRight,
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

  // ─── Loading / Error ─────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ─── Nav ───────────────────────────────────────────
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

  const tabTitle = tab === 'dashboard' ? 'Dashboard' : tab === 'ai-models' ? 'AI Models' : tab === 'transactions' ? 'Analytics' : navSections.flatMap(s => s.items).find(n => n.key === tab)?.label || '';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-60'} bg-card flex flex-col h-screen flex-shrink-0 transition-all duration-300 border-r border-border`}>

        {/* Brand */}
        <div className="h-14 flex items-center px-4 gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Rocket size={16} className="text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-foreground tracking-tight">Admin Console</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] px-2.5 mb-1.5">{section.title}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150
                        ${active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      <Icon size={16} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className={`text-[10px] font-mono font-bold min-w-[22px] text-center px-1.5 py-0.5 rounded-md ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
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
        <div className="p-2.5 border-t border-border space-y-0.5">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all">
            <Home size={16} />
            {!sidebarCollapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-14 px-6 flex items-center justify-between border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 size={14} />
            <span>/</span>
            <span className="text-foreground font-medium">{tabTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg w-52">
              <Search size={13} className="text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium text-foreground">{displayName}</span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">

          {/* ══════════════ DASHBOARD ══════════════ */}
          {tab === 'dashboard' && (
            <div className="space-y-5 max-w-6xl">
              {/* Welcome banner */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground">Welcome back, {displayName} 👋</h2>
                <p className="text-sm text-muted-foreground mt-1">Here's an overview of your platform activity.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Users', value: data.users.length, icon: Users, color: 'text-primary' },
                  { label: 'Projects', value: data.projects.length, icon: FolderOpen, color: 'text-primary' },
                  { label: 'Credits Used', value: totalCreditsUsed.toFixed(0), icon: Zap, color: 'text-primary' },
                  { label: 'Active Plans', value: data.plans.length, icon: Shield, color: 'text-primary' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Icon size={18} className={stat.color} />
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Active AI Models */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Active AI Models</h3>
                  </div>
                  <button onClick={() => setTab('ai-models')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                    Manage <ArrowRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {['free', 'pro', 'business', 'all'].map(plan => {
                    const m = activeModelsByPlan[plan];
                    return (
                      <div key={plan} className={`rounded-lg p-3 border transition-colors ${m ? 'bg-primary/5 border-primary/15' : 'bg-muted/30 border-border'}`}>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">{plan === 'all' ? 'All Plans' : plan}</p>
                        {m ? (
                          <>
                            <p className="text-xs font-semibold text-foreground truncate">{m.display_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{m.model_id}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground/40 italic">Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Users & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Recent Users</h3>
                    <button onClick={() => setTab('users')} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">View all</button>
                  </div>
                  <div className="divide-y divide-border">
                    {data.users.slice(0, 5).map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {(u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">{u.display_name || u.email || '—'}</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">{u.email}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground tabular-nums">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Recent Projects</h3>
                    <button onClick={() => setTab('projects')} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">View all</button>
                  </div>
                  <div className="divide-y divide-border">
                    {data.projects.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                            <FolderOpen size={12} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">{p.project_type}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${p.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
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
            <div className="space-y-5 max-w-4xl">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Send size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Send Notification</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                    <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/40" placeholder="Notification title..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Body</label>
                    <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/40 resize-none h-20" placeholder="Message body..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Image URL</label>
                      <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Link URL</label>
                      <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Target Plan</label>
                      <select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                    <Send size={13} /> {sendingNotif ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications yet" desc="Send your first notification above." />
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-3.5 bg-card border border-border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDeleteNotification(n.id)} className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors">
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
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Plus size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Add Template</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                      <input value={tplName} onChange={e => setTplName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="Template name..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                      <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="general" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Image URL</label>
                      <input value={tplImage} onChange={e => setTplImage(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="https://..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Prompt *</label>
                    <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none h-20" placeholder="AI prompt..." />
                  </div>
                  <button onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                    <Plus size={13} /> {savingTpl ? 'Saving...' : 'Add Template'}
                  </button>
                </div>
              </div>

              {templates.length === 0 ? (
                <EmptyState icon={Layers} title="No templates yet" desc="Create your first template above." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted/50 flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover" /> : <Layers size={18} className="text-muted-foreground/30" />}
                      </div>
                      <div className="p-3 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.category}</p>
                        </div>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center text-destructive transition-opacity">
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
              {/* Active models summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['free', 'pro', 'business', 'all'].map(plan => {
                  const m = activeModelsByPlan[plan];
                  return (
                    <div key={plan} className={`bg-card border rounded-xl p-4 transition-colors ${m ? 'border-primary/20' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                          {plan === 'all' ? 'All Plans' : plan}
                        </span>
                        {m && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      {m ? (
                        <>
                          <p className="text-sm font-semibold text-foreground truncate">{m.display_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{m.model_id}</p>
                          <span className="inline-block text-[10px] mt-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-semibold capitalize">{m.provider}</span>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground/40 italic mt-1">No active model</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add model */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Cpu size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Add AI Model</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Provider</label>
                        <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                          <option value="vercel">Vercel AI</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="nvidia">NVIDIA NIM</option>
                          <option value="lovable">Lovable AI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Target Plan</label>
                        <select value={aiTargetPlan} onChange={e => setAiTargetPlan(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                          <option value="all">All Plans</option>
                          <option value="free">Free Only</option>
                          <option value="pro">Pro Only</option>
                          <option value="business">Business Only</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Model ID *</label>
                      <input value={aiModelId} onChange={e => setAiModelId(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder={providerDefaults[aiProvider]?.placeholder} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name *</label>
                      <input value={aiDisplayName} onChange={e => setAiDisplayName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" placeholder="e.g. Gemini 3 Flash" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Gateway URL</label>
                      <input value={aiGatewayUrl} onChange={e => setAiGatewayUrl(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">API Key Secret</label>
                      <input value={aiKeySecretName} onChange={e => setAiKeySecretName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <button onClick={handleAddAiModel} disabled={!aiModelId.trim() || !aiDisplayName.trim() || savingModel} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 w-full justify-center">
                      <Plus size={13} /> {savingModel ? 'Saving...' : 'Add Model'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3.5">
                      <p className="text-xs text-primary font-semibold mb-1">Priority Logic</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The system first looks for a model matching the user's exact plan. If none found, falls back to "All Plans" model.
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-3.5">
                      <p className="text-xs text-foreground font-semibold mb-1">Multi-Plan Support</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You can have different models active for different plans simultaneously. Only one model per plan scope.
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-3.5">
                      <p className="text-xs text-foreground font-semibold mb-2">Providers</p>
                      <div className="space-y-1">
                        {Object.entries(providerDefaults).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-foreground font-medium capitalize">{key}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{val.key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Models table */}
              {aiModels.length === 0 ? (
                <EmptyState icon={Cpu} title="No models configured" desc="Add your first AI model above." />
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Provider</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Model</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${m.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {m.is_active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                              {m.is_active ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-foreground capitalize">{m.provider}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-primary">{m.model_id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{m.display_name}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                              {m.target_plan === 'all' ? 'All' : m.target_plan}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleAiModel(m.id, m.is_active)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${m.is_active ? 'bg-muted text-muted-foreground hover:bg-accent' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                              >
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDeleteAiModel(m.id)} className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors">
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
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  {tab === 'users' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map(u => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-foreground">{u.display_name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.email || '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'plans' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Daily</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Used Today</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Monthly</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.plans.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-primary">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary capitalize">{p.plan}</span></td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground tabular-nums">{p.daily_credits}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{p.credits_used_today}</td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground tabular-nums">{p.monthly_credits}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{p.total_credits_used}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'transactions' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Credits</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map(t => (
                          <tr key={t.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs font-mono text-primary">{t.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground tabular-nums">{t.credits_used}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{t.work_type || '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{t.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {tab === 'projects' && (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.projects.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{p.name}</td>
                            <td className="px-4 py-3 text-xs font-mono text-primary">{p.user_id?.slice(0, 8)}…</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{p.project_type}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${p.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {p.is_published ? 'Live' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{new Date(p.created_at).toLocaleDateString()}</td>
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

// ─── Empty State Component ────────────────────────────
const EmptyState: React.FC<{ icon: any; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
      <Icon size={20} className="text-muted-foreground" />
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground">{desc}</p>
  </div>
);
