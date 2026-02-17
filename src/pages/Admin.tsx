import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import {
  Users,
  CreditCard,
  FolderOpen,
  AlertTriangle,
  Loader2,
  Mail,
  Layers,
  Plus,
  Trash2,
  Send,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates'>('users');

  // Inbox form
  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxBody, setInboxBody] = useState('');
  const [inboxImage, setInboxImage] = useState('');
  const [inboxLink, setInboxLink] = useState('');
  const [inboxPlan, setInboxPlan] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Templates form
  const [tplName, setTplName] = useState('');
  const [tplImage, setTplImage] = useState('');
  const [tplPrompt, setTplPrompt] = useState('');
  const [tplCategory, setTplCategory] = useState('general');
  const [templates, setTemplates] = useState<any[]>([]);
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const checkCurrentSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
        }
      };
      checkCurrentSession();
      return;
    }

    const fetchData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          navigate('/login');
          return;
        }
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
        if (fnError) {
          const errorMsg = fnError.message || '';
          if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
            setError('Unauthorized - Please log in again');
            return;
          }
          throw new Error(errorMsg);
        }
        if (result?.error) {
          setError(result.error);
          return;
        }
        setData(result);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchNotifications();
    fetchTemplates();
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
      title: inboxTitle,
      body: inboxBody || null,
      image_url: inboxImage || null,
      link_url: inboxLink || null,
      target_plan: inboxPlan,
      created_by: user?.id,
    });
    setInboxTitle('');
    setInboxBody('');
    setInboxImage('');
    setInboxLink('');
    setInboxPlan('all');
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
      name: tplName,
      image_url: tplImage || null,
      prompt: tplPrompt,
      category: tplCategory,
      created_by: user?.id,
      sort_order: templates.length,
    });
    setTplName('');
    setTplImage('');
    setTplPrompt('');
    setTplCategory('general');
    await fetchTemplates();
    setSavingTpl(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    await fetchTemplates();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-destructive/20">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users, count: data.users.length },
    { key: 'plans' as const, label: 'Plans', icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
    { key: 'inbox' as const, label: 'Notifications', icon: Mail, count: notifications.length },
    { key: 'templates' as const, label: 'Templates', icon: Layers, count: templates.length },
  ];

  const inputClass =
    'w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all';
  const labelClass = 'text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2 block';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Administration Panel</h1>
              <p className="text-sm text-muted-foreground mt-1">Vivora X Management Console</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-all shadow-sm border border-border"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tabs.slice(0, 4).map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{t.count}</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <Icon className="w-6 h-6 text-secondary-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 overflow-hidden">
          <div className="flex flex-wrap gap-0 border-b border-border">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    tab === t.key
                      ? 'text-foreground border-b-primary bg-secondary/30'
                      : 'text-muted-foreground border-b-transparent hover:text-foreground hover:bg-secondary/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                  <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded ml-1">
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          {tab === 'inbox' && (
            <div className="p-6 lg:p-8">
              {/* Send Notification Form */}
              <div className="bg-secondary/10 rounded-lg border border-border p-6 mb-8">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Notification
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Title *</label>
                    <input
                      value={inboxTitle}
                      onChange={(e) => setInboxTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Enter notification title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Message Body</label>
                    <textarea
                      value={inboxBody}
                      onChange={(e) => setInboxBody(e.target.value)}
                      className={`${inputClass} h-24 resize-none`}
                      placeholder="Enter notification message..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input
                      value={inboxImage}
                      onChange={(e) => setInboxImage(e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Link URL</label>
                    <input
                      value={inboxLink}
                      onChange={(e) => setInboxLink(e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendNotification}
                  disabled={!inboxTitle.trim() || sendingNotif}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sendingNotif ? 'Sending...' : 'Send Notification'}
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Recent Notifications</h4>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between p-4 bg-secondary/5 border border-border rounded-lg hover:bg-secondary/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="ml-4 p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'templates' && (
            <div className="p-6 lg:p-8">
              {/* Add Template Form */}
              <div className="bg-secondary/10 rounded-lg border border-border p-6 mb-8">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Template
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Template Name *</label>
                    <input
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      className={inputClass}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <input
                      value={tplCategory}
                      onChange={(e) => setTplCategory(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., General, Marketing"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Image URL</label>
                    <input
                      value={tplImage}
                      onChange={(e) => setTplImage(e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Prompt *</label>
                    <textarea
                      value={tplPrompt}
                      onChange={(e) => setTplPrompt(e.target.value)}
                      className={`${inputClass} h-28 resize-none`}
                      placeholder="Enter the prompt that will be used when users select this template..."
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddTemplate}
                  disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  {savingTpl ? 'Saving...' : 'Add Template'}
                </button>
              </div>

              {/* Templates Grid */}
              {templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No templates created yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-secondary/5 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-video bg-secondary/20 flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? (
                          <img
                            src={tpl.image_url}
                            alt={tpl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Layers className="w-8 h-8 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="p-4 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{tpl.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{tpl.category}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="ml-2 p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data Tables */}
          <div className="overflow-x-auto">
            {tab === 'users' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/10">
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Display Name
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-card' : 'bg-secondary/5'
                      } hover:bg-secondary/10 transition-colors`}
                    >
                      <td className="px-6 py-4 text-foreground font-medium">{u.email || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.display_name || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'plans' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/10">
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Daily Limit
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Used Today
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Monthly Limit
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Total Used
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-card' : 'bg-secondary/5'
                      } hover:bg-secondary/10 transition-colors`}
                    >
                      <td className="px-6 py-4 text-muted-foreground text-sm font-mono">{p.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full uppercase">
                          {p.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">{p.daily_credits}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.credits_used_today}</td>
                      <td className="px-6 py-4 text-foreground font-medium">{p.monthly_credits}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.total_credits_used}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'transactions' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/10">
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Credits
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-card' : 'bg-secondary/5'
                      } hover:bg-secondary/10 transition-colors`}
                    >
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm font-mono">{t.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-foreground font-semibold">{t.credits_used}</td>
                      <td className="px-6 py-4 text-muted-foreground">{t.work_type || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm max-w-xs truncate" title={t.description}>
                        {t.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'projects' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/10">
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Project Name
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Published
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground text-sm uppercase tracking-wide">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-card' : 'bg-secondary/5'
                      } hover:bg-secondary/10 transition-colors`}
                    >
                      <td className="px-6 py-4 text-foreground font-medium">{p.name}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm font-mono">{p.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.project_type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            p.is_published
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {p.is_published ? '✓ Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
