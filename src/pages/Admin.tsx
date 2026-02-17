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
  ChevronRight,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

export default function App() {
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
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          navigate('/login');
        }
      };
      checkCurrentSession();
      return;
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
        if (fnError) throw new Error(fnError.message);
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
      name: tplName,
      image_url: tplImage || null,
      prompt: tplPrompt,
      category: tplCategory,
      created_by: user?.id,
      sort_order: templates.length,
    });
    setTplName(''); setTplImage(''); setTplPrompt(''); setTplCategory('general');
    await fetchTemplates();
    setSavingTpl(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <Loader2 className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
        <div className="bg-[#121214] border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all active:scale-95">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'users', label: 'Users', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'plans', label: 'Plans', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'transactions', label: 'Billing', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { id: 'inbox', label: 'Inbox', icon: Mail, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { id: 'templates', label: 'Templates', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#121214] border-r border-zinc-800 flex flex-col fixed h-full z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            VIVORA <span className="text-indigo-500">PRO</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[2px] mb-4">Main Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                tab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${tab === item.id ? 'text-white' : item.color}`} />
              <span className="font-semibold text-sm">{item.label}</span>
              {tab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-800 bg-[#121214]">
           <button 
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 transition-colors mb-4"
           >
             {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
             <span className="text-xs font-medium">Switch Theme</span>
           </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors">
             <LogOut className="w-4 h-4" />
             <span className="text-xs font-bold">Logout Session</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        {/* Top Header */}
        <header className="h-24 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40">
           <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold tracking-tight">
               {navItems.find(i => i.id === tab)?.label}
             </h2>
             <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-[10px] font-bold">ADMIN VIEW</span>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="relative group hidden md:block">
               <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search global data..." 
                 className="bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
               />
             </div>
             <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 relative transition-colors">
               <Bell className="w-5 h-5 text-zinc-400" />
               <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#09090b]"></span>
             </button>
             <div className="h-10 w-[1px] bg-zinc-800 mx-2"></div>
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <p className="text-sm font-bold truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Super Admin</p>
               </div>
               <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg shadow-indigo-500/20">
                 {user?.email?.[0].toUpperCase()}
               </div>
             </div>
           </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="p-10">
          
          {/* Stats Summary Grid */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Users', value: data.users.length, icon: Users, color: 'blue' },
                { label: 'Revenue Streams', value: data.plans.length, icon: TrendingUp, color: 'emerald' },
                { label: 'Transactions', value: data.transactions.length, icon: CreditCard, color: 'purple' },
                { label: 'Projects Host', value: data.projects.length, icon: FolderOpen, color: 'orange' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#121214] border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-zinc-700 transition-all">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-${stat.color}-500/10 transition-all`}></div>
                   <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-2xl bg-${stat.color}-500/10`}>
                       <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                     </div>
                     <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full uppercase">Monthly</span>
                   </div>
                   <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.label}</h4>
                   <p className="text-3xl font-black mt-1 text-white tabular-nums">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className="bg-[#121214] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px]">
            
            {/* INBOX SECTION */}
            {tab === 'inbox' && (
              <div className="flex h-full min-h-[600px]">
                <div className="w-1/3 border-r border-zinc-800 p-8 bg-[#0d0d0f]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-500" /> Dispatcher
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block">Subject</label>
                      <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Announcement Title" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block">Content</label>
                      <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all h-32 resize-none" placeholder="Message details..." />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block">Action Link</label>
                      <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" placeholder="https://..." />
                    </div>
                    <button 
                      onClick={handleSendNotification}
                      disabled={!inboxTitle.trim() || sendingNotif}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {sendingNotif ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                      Push Notification
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto max-h-[700px]">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Dispatch History</h3>
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex items-center justify-between">
                         <div>
                           <p className="font-bold text-lg mb-1">{n.title}</p>
                           <p className="text-zinc-500 text-xs flex items-center gap-2 italic">
                             {new Date(n.created_at).toLocaleString()} 
                             {n.link_url && <span className="text-indigo-400 not-italic font-bold flex items-center gap-1 cursor-pointer"><ExternalLink className="w-3 h-3"/> {new Date(n.created_at).toLocaleDateString()}</span>}
                           </p>
                         </div>
                         <button onClick={() => handleDeleteNotification(n.id)} className="p-3 rounded-xl bg-red-500/5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATES SECTION */}
            {tab === 'templates' && (
              <div className="p-8">
                <div className="flex justify-between items-end mb-10">
                   <div>
                     <h3 className="text-2xl font-black mb-1">Creative Assets</h3>
                     <p className="text-zinc-500 text-sm">Manage AI Generation Templates</p>
                   </div>
                   <button onClick={handleAddTemplate} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/10 flex items-center gap-2">
                     <Plus className="w-5 h-5" /> New Template
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Create New Inline Card */}
                  <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group hover:border-indigo-500/50 transition-all">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-all">
                      <Layers className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="font-bold text-zinc-400 group-hover:text-zinc-100 transition-colors">Create Template</p>
                    <p className="text-[10px] text-zinc-600 uppercase mt-2">Add to Library</p>
                  </div>

                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden group hover:border-zinc-700 transition-all relative">
                      <div className="h-48 bg-zinc-800 overflow-hidden relative">
                        {tpl.image_url ? (
                          <img src={tpl.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={tpl.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                            <Layers className="w-12 h-12 text-indigo-500/40" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {tpl.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-bold mb-1 truncate">{tpl.name}</h4>
                        <p className="text-zinc-500 text-xs line-clamp-2 italic mb-4">"{tpl.prompt}"</p>
                        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                               <Settings className="w-4 h-4 text-zinc-500" />
                             </div>
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Edit Asset</span>
                           </div>
                           <button className="text-red-500 hover:text-red-400 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DATA TABLES SECTION */}
            {['users', 'plans', 'transactions', 'projects'].includes(tab) && (
              <div className="p-0">
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-[#0d0d0f]">
                  <div className="flex items-center gap-4">
                     <Filter className="w-4 h-4 text-zinc-500" />
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-[2px]">Data Filtering</span>
                  </div>
                  <div className="flex gap-2">
                    {['Active', 'Pending', 'Archived'].map(f => (
                      <button key={f} className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors">{f}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#121214] border-b border-zinc-800">
                        {tab === 'users' && (
                          <>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">User Entity</th>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Identification</th>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Registration Date</th>
                            <th className="text-right p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Action</th>
                          </>
                        )}
                        {tab === 'plans' && (
                          <>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subscriber ID</th>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subscription Tier</th>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Credit Balance</th>
                            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Daily Consumption</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {tab === 'users' && data?.users.map((u, idx) => (
                        <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-bold text-indigo-400">
                                 {u.email?.[0].toUpperCase()}
                               </div>
                               <div>
                                 <p className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{u.display_name || 'Anonymous User'}</p>
                                 <p className="text-xs text-zinc-500">{u.email}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="font-mono text-[10px] bg-zinc-900 px-3 py-1.5 rounded-lg text-zinc-400 border border-zinc-800">
                              {u.id.slice(0, 16)}...
                            </span>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-medium text-zinc-300">{new Date(u.created_at).toLocaleDateString()}</p>
                            <p className="text-[10px] text-zinc-600 uppercase font-bold">{new Date(u.created_at).toLocaleTimeString()}</p>
                          </td>
                          <td className="p-6 text-right">
                             <button className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                               <Settings className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}

                      {tab === 'plans' && data?.plans.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="p-6">
                             <span className="font-mono text-[10px] text-zinc-500">{p.user_id}</span>
                          </td>
                          <td className="p-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                p.plan === 'premium' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.plan === 'premium' ? 'bg-indigo-400' : 'bg-zinc-400'}`}></span>
                              {p.plan}
                            </div>
                          </td>
                          <td className="p-6 text-sm font-bold text-white">
                             {p.monthly_credits} <span className="text-zinc-500 font-normal text-xs ml-1">Limit</span>
                          </td>
                          <td className="p-6">
                             <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.credits_used_today / p.daily_credits) * 100}%` }}></div>
                             </div>
                             <p className="text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-widest">{p.credits_used_today} / {p.daily_credits} Units Used</p>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Fallback empty message */}
                      {((tab === 'users' && data?.users.length === 0) || (tab === 'plans' && data?.plans.length === 0)) && (
                        <tr>
                          <td colSpan={4} className="p-20 text-center">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                              <Search className="w-6 h-6 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[3px]">No records found in current view</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
