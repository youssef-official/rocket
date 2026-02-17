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
  Search,
  Settings,
  Bell,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
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
    'w-full px-4 py-3 bg-white/5 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all';
  const labelClass = 'text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vivora Admin</h1>
                <p className="text-xs text-slate-400 mt-0.5">Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white border border-slate-600"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-3xl border border-slate-700/50 p-8 mb-8 backdrop-blur-sm">
          <h2 className="text-white font-semibold mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tabs.slice(0, 4).map((t) => {
              const Icon = t.icon;
              const colors = [
                'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                'from-purple-500/20 to-purple-600/20 border-purple-500/30',
                'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
                'from-pink-500/20 to-pink-600/20 border-pink-500/30',
              ];
              const iconColors = [
                'text-blue-400',
                'text-purple-400',
                'text-emerald-400',
                'text-pink-400',
              ];
              const bgColors = [
                'bg-blue-500/10',
                'bg-purple-500/10',
                'bg-emerald-500/10',
                'bg-pink-500/10',
              ];
              const idx = tabs.indexOf(t);
              return (
                <div
                  key={t.key}
                  className={`bg-gradient-to-br ${colors[idx]} border rounded-2xl p-6 backdrop-blur-sm hover:border-opacity-100 transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${bgColors[idx]} rounded-xl`}>
                      <Icon className={`w-6 h-6 ${iconColors[idx]}`} />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm uppercase tracking-wide font-medium">{t.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{t.count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/5 rounded-2xl border border-slate-700/50 mb-6 overflow-hidden backdrop-blur-sm">
          <div className="flex flex-wrap gap-0 border-b border-slate-700/50 p-2">
            {tabs.map((t, idx) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ml-1 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/95 dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {tab === 'inbox' && (
            <div className="p-8">
              {/* Send Notification Form */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 p-8 mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
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
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  {sendingNotif ? 'Sending...' : 'Send Notification'}
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Recent Notifications</h4>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No notifications sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="ml-4 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
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
            <div className="p-8">
              {/* Add Template Form */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 p-8 mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
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
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  {savingTpl ? 'Saving...' : 'Add Template'}
                </button>
              </div>

              {/* Templates Grid */}
              {templates.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No templates created yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                    >
                      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden">
                        {tpl.image_url ? (
                          <img
                            src={tpl.image_url}
                            alt={tpl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Layers className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                      <div className="p-5 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{tpl.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tpl.category}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="ml-2 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100"
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Display Name
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-200 dark:border-slate-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-800/30'
                      } hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{u.email || '—'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{u.display_name || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Daily Limit
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Used Today
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Total Used
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-200 dark:border-slate-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-800/30'
                      } hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors`}
                    >
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono">{p.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg uppercase">
                          {p.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{p.daily_credits}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.credits_used_today}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{p.monthly_credits}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.total_credits_used}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-200 dark:border-slate-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-800/30'
                      } hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors`}
                    >
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono">{t.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{t.credits_used}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.work_type || '—'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm max-w-xs truncate" title={t.description}>
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Published
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-200 dark:border-slate-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50 dark:bg-slate-800/30'
                      } hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono">{p.user_id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.project_type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            p.is_published
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p.is_published ? '✓ Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
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
