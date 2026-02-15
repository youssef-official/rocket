import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, CreditCard, FolderOpen, AlertTriangle, Loader2, Mail, Layers, Plus, Trash2, Send } from 'lucide-react';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

export const AdminPanel: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
    if (!user) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        // Refresh session to ensure valid token
        const { data: sessionData } = await supabase.auth.refreshSession();
        if (!sessionData?.session) {
          navigate('/login');
          return;
        }
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
        if (fnError) throw new Error(fnError.message);
        if (result?.error) throw new Error(result.error);
        setData(result);
      } catch (e: any) {
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          navigate('/login');
          return;
        }
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
      title: inboxTitle, body: inboxBody || null, image_url: inboxImage || null,
      link_url: inboxLink || null, target_plan: inboxPlan, created_by: user?.id
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
      name: tplName, image_url: tplImage || null, prompt: tplPrompt,
      category: tplCategory, created_by: user?.id, sort_order: templates.length
    });
    setTplName(''); setTplImage(''); setTplPrompt(''); setTplCategory('general');
    await fetchTemplates();
    setSavingTpl(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    await fetchTemplates();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-white/50">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-pink-500 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users, count: data.users.length },
    { key: 'plans' as const, label: 'Plans', icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: CreditCard, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
    { key: 'inbox' as const, label: 'Inbox', icon: Mail, count: notifications.length },
    { key: 'templates' as const, label: 'Templates', icon: Layers, count: templates.length },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 text-sm";
  const labelClass = "text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Panel</h1>
            <p className="text-xs text-white/30">Vivora X Management Console</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {tabs.slice(0, 4).map(t => (
            <div key={t.key} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center hover:bg-white/[0.05] transition-colors">
              <t.icon className="w-5 h-5 mx-auto mb-2 text-pink-400/60" />
              <div className="text-2xl font-bold">{t.count}</div>
              <div className="text-xs text-white/40">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="text-xs opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          {tab === 'inbox' && (
            <div className="p-4 md:p-6">
              {/* Send Notification Form */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Send Notification</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Title *</label>
                    <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className={inputClass} placeholder="Notification title" />
                  </div>
                  <div>
                    <label className={labelClass}>Target Plan</label>
                    <select value={inboxPlan} onChange={e => setInboxPlan(e.target.value)} className={inputClass}>
                      <option value="all">All Plans</option>
                      <option value="spark">Spark</option>
                      <option value="builder">Builder</option>
                      <option value="creator">Creator</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Body</label>
                    <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Notification body text..." />
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>Link URL</label>
                    <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                </div>
                <button
                  onClick={handleSendNotification}
                  disabled={!inboxTitle.trim() || sendingNotif}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> {sendingNotif ? 'Sending...' : 'Send Notification'}
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{n.title}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/40">{n.target_plan}</span>
                      </div>
                      <span className="text-xs text-white/30">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <button onClick={() => handleDeleteNotification(n.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'templates' && (
            <div className="p-4 md:p-6">
              {/* Add Template Form */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Add Template</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Name *</label>
                    <input value={tplName} onChange={e => setTplName(e.target.value)} className={inputClass} placeholder="Template name" />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className={inputClass} placeholder="general" />
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input value={tplImage} onChange={e => setTplImage(e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Prompt *</label>
                    <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="The auto-generated prompt when user clicks this template..." />
                  </div>
                </div>
                <button
                  onClick={handleAddTemplate}
                  disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> {savingTpl ? 'Saving...' : 'Add Template'}
                </button>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map(tpl => (
                  <div key={tpl.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden group">
                    <div className="aspect-video bg-white/5 flex items-center justify-center">
                      {tpl.image_url ? (
                        <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Layers className="w-6 h-6 text-white/20" />
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{tpl.name}</h4>
                        <p className="text-xs text-white/30">{tpl.category}</p>
                      </div>
                      <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing tabs */}
          <div className="overflow-x-auto">
            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Display Name</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 text-white/80">{u.email || '—'}</td>
                      <td className="p-3 text-white/60">{u.display_name || '—'}</td>
                      <td className="p-3 text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'plans' && (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">User ID</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Plan</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Daily</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Used</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Monthly</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Total Used</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map(p => (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-xs text-white/40">{p.user_id?.slice(0, 8)}...</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 text-xs font-medium uppercase">{p.plan}</span></td>
                      <td className="p-3 text-white/60">{p.daily_credits}</td>
                      <td className="p-3 text-white/60">{p.credits_used_today}</td>
                      <td className="p-3 text-white/60">{p.monthly_credits}</td>
                      <td className="p-3 text-white/60">{p.total_credits_used}</td>
                      <td className="p-3 text-white/40">{new Date(p.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'transactions' && (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">User ID</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Credits</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map(t => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 text-white/40">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs text-white/40">{t.user_id?.slice(0, 8)}...</td>
                      <td className="p-3 text-white/80">{t.credits_used}</td>
                      <td className="p-3 text-white/60">{t.work_type || '—'}</td>
                      <td className="p-3 text-xs text-white/40 max-w-[200px] truncate">{t.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'projects' && (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">User ID</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Published</th>
                    <th className="text-left p-3 font-medium text-white/50 text-xs uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map(p => (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-white/80">{p.name}</td>
                      <td className="p-3 font-mono text-xs text-white/40">{p.user_id?.slice(0, 8)}...</td>
                      <td className="p-3 text-white/60">{p.project_type}</td>
                      <td className="p-3">{p.is_published ? '✅' : '❌'}</td>
                      <td className="p-3 text-white/40">{new Date(p.created_at).toLocaleDateString()}</td>
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
