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
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  MoreVertical
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

  // Inbox form state
  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxBody, setInboxBody] = useState('');
  const [inboxImage, setInboxImage] = useState('');
  const [inboxLink, setInboxLink] = useState('');
  const [inboxPlan, setInboxPlan] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Templates form state
  const [tplName, setTplName] = useState('');
  const [tplImage, setTplImage] = useState('');
  const [tplPrompt, setTplPrompt] = useState('');
  const [tplCategory, setTplCategory] = useState('general');
  const [templates, setTemplates] = useState<any[]>([]);
  const [savingTpl, setSavingTpl] = useState(false);

  // --- Logic & Effects (Kept exactly as original) ---
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

  // --- Render Helpers ---

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden border border-red-100 dark:border-red-900/30">
          <div className="h-2 bg-red-500 w-full"></div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'users' as const, label: 'User Base', icon: Users, count: data.users.length },
    { key: 'plans' as const, label: 'Subscriptions', icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
    { key: 'inbox' as const, label: 'Inbox & Push', icon: Mail, count: notifications.length },
    { key: 'templates' as const, label: 'AI Templates', icon: Layers, count: templates.length },
  ];

  // --- New Design Components ---

  const SidebarItem = ({ t, isActive }: { t: typeof tabs[0], isActive: boolean }) => {
    const Icon = t.icon;
    return (
      <button
        onClick={() => setTab(t.key)}
        className={`w-full flex items-center justify-between px-4 py-3.5 mb-1 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
          <span className="font-medium text-sm">{t.label}</span>
        </div>
        {t.count > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300'
          }`}>
            {t.count}
          </span>
        )}
      </button>
    );
  };

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700/50 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col z-20">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">Vivora</h1>
              <p className="text-xs text-gray-400">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-2">Overview</p>
          {tabs.slice(0, 3).map((t) => (
            <SidebarItem key={t.key} t={t} isActive={tab === t.key} />
          ))}

          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">Management</p>
          {tabs.slice(3).map((t) => (
            <SidebarItem key={t.key} t={t} isActive={tab === t.key} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-neutral-700">
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                 AD
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">Admin</p>
                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                   {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                 </button>
               </div>
             </div>
             <button className="text-gray-400 hover:text-red-500 transition-colors">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-semibold text-gray-800 dark:text-white capitalize flex items-center gap-2">
               {tabs.find(t => t.key === tab)?.icon && React.createElement(tabs.find(t => t.key === tab)!.icon, { className: "w-5 h-5 text-indigo-500" })}
               {tabs.find(t => t.key === tab)?.label}
             </h2>
             <span className="h-4 w-px bg-gray-300 dark:bg-neutral-600"></span>
             <span className="text-sm text-gray-500">Updated just now</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global Search..." 
                className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-neutral-900 border-none rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
              />
            </div>
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* Quick Stats Row (Optional, shown on Users tab or top of all) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Users" value={data.users.length} icon={Users} colorClass="bg-blue-500 text-blue-500" />
            <StatCard label="Active Projects" value={data.projects.length} icon={FolderOpen} colorClass="bg-emerald-500 text-emerald-500" />
            <StatCard label="Transactions" value={data.transactions.length} icon={TrendingUp} colorClass="bg-indigo-500 text-indigo-500" />
            <StatCard label="Templates" value={templates.length} icon={Layers} colorClass="bg-purple-500 text-purple-500" />
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden min-h-[500px]">
            
            {/* INBOX VIEW */}
            {tab === 'inbox' && (
              <div className="flex flex-col lg:flex-row h-full">
                <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-neutral-700 p-6 bg-gray-50/50 dark:bg-neutral-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-500" /> Compose Notification
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                      <input
                        value={inboxTitle}
                        onChange={(e) => setInboxTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Notification Title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                      <textarea
                        value={inboxBody}
                        onChange={(e) => setInboxBody(e.target.value)}
                        className="w-full px-4 py-2 h-24 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Type your message..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={inboxImage}
                        onChange={(e) => setInboxImage(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                        placeholder="Image URL"
                      />
                      <input
                        value={inboxLink}
                        onChange={(e) => setInboxLink(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                        placeholder="Target Link"
                      />
                    </div>
                    <button
                      onClick={handleSendNotification}
                      disabled={!inboxTitle.trim() || sendingNotif}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Push
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 bg-white dark:bg-neutral-800">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-900 dark:text-white">History</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded-md">{notifications.length} Sent</span>
                   </div>
                   <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                     {notifications.map((n) => (
                       <div key={n.id} className="group flex items-start justify-between p-4 rounded-xl border border-gray-100 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
                         <div className="flex items-start gap-3">
                           <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                             <Mail className="w-4 h-4" />
                           </div>
                           <div>
                             <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{n.title}</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{n.body || 'No content'}</p>
                             <div className="flex items-center gap-2 mt-2">
                               <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-600">
                                 {new Date(n.created_at).toLocaleDateString()}
                               </span>
                               {n.link_url && <span className="text-[10px] text-indigo-500">Has Link</span>}
                             </div>
                           </div>
                         </div>
                         <button onClick={() => handleDeleteNotification(n.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                     {notifications.length === 0 && (
                       <div className="text-center py-20 text-gray-400">
                         <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                         <p>No notifications history</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            )}

            {/* TEMPLATES VIEW */}
            {tab === 'templates' && (
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-neutral-700">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New Template
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                      <input value={tplName} onChange={(e) => setTplName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Template Name" />
                    </div>
                    <div className="lg:col-span-1">
                      <input value={tplCategory} onChange={(e) => setTplCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Category" />
                    </div>
                    <div className="lg:col-span-1">
                      <input value={tplImage} onChange={(e) => setTplImage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Cover Image URL" />
                    </div>
                    <div className="lg:col-span-4">
                      <textarea value={tplPrompt} onChange={(e) => setTplPrompt(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20" placeholder="AI System Prompt..." />
                    </div>
                    <div className="lg:col-span-1">
                      <button onClick={handleAddTemplate} disabled={!tplName || !tplPrompt || savingTpl} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                        {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Template
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="group relative bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="h-32 bg-gray-200 dark:bg-neutral-700 relative overflow-hidden">
                        {tpl.image_url ? (
                          <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Layers className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 dark:text-white truncate pr-2">{tpl.name}</h4>
                          <span className="text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg border border-gray-100 dark:border-neutral-700">
                          {tpl.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLE VIEWS */}
            {(tab === 'users' || tab === 'plans' || tab === 'transactions' || tab === 'projects') && (
              <div className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-200 dark:border-neutral-700">
                      {tab === 'users' && (
                        <>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Identity</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                        </>
                      )}
                      {tab === 'plans' && (
                        <>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Plan</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily Usage</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Usage</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sync</th>
                        </>
                      )}
                      {tab === 'transactions' && (
                        <>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost (Credits)</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operation</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                        </>
                      )}
                      {tab === 'projects' && (
                        <>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Name</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-700/50">
                    
                    {/* USERS ROWS */}
                    {tab === 'users' && data.users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                              {u.email ? u.email.substring(0, 2) : '??'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{u.email || 'No Email'}</span>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-gray-500 dark:text-gray-400">{u.display_name || '—'}</td>
                        <td className="p-5 text-sm text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-5 text-right">
                          <button className="text-gray-400 hover:text-indigo-600 transition-colors"><MoreVertical className="w-4 h-4 ml-auto" /></button>
                        </td>
                      </tr>
                    ))}

                    {/* PLANS ROWS */}
                    {tab === 'plans' && data.plans.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-5 text-xs font-mono text-gray-400">{p.user_id?.slice(0, 8)}...</td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            p.plan === 'pro' || p.plan === 'premium' 
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          }`}>
                            {p.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (p.credits_used_today / p.daily_credits) * 100)}%` }}></div>
                             </div>
                             <span className="text-xs text-gray-600 dark:text-gray-400">{p.credits_used_today}/{p.daily_credits}</span>
                          </div>
                        </td>
                         <td className="p-5">
                           <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.total_credits_used}</span>
                           <span className="text-xs text-gray-400 ml-1">/ {p.monthly_credits}</span>
                        </td>
                        <td className="p-5 text-xs text-gray-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}

                    {/* TRANSACTIONS ROWS */}
                    {tab === 'transactions' && data.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-5 text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="p-5 text-xs font-mono text-gray-400" title={t.user_id}>{t.user_id?.slice(0, 8)}...</td>
                        <td className="p-5 font-bold text-red-500 text-sm">-{t.credits_used}</td>
                        <td className="p-5 text-sm text-gray-700 dark:text-gray-300 capitalize">{t.work_type || 'System'}</td>
                        <td className="p-5 text-xs text-gray-400 max-w-[200px] truncate">{t.description || '-'}</td>
                      </tr>
                    ))}

                    {/* PROJECTS ROWS */}
                    {tab === 'projects' && data.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-5">
                           <div className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</div>
                        </td>
                        <td className="p-5 text-xs font-mono text-gray-400">{p.user_id?.slice(0, 8)}...</td>
                        <td className="p-5">
                          {p.is_published ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> PUBLISHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                              DRAFT
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-xs uppercase tracking-wider text-gray-500">{p.project_type}</td>
                        <td className="p-5 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
