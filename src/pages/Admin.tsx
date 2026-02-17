import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Mail, Layers, Plus, Trash2, Send, TrendingUp,
  LogOut, ChevronRight, Bell, Search, Settings, Eye,
  BarChart2, Download, ChevronDown, Filter, Code,
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
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates'>('users');

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

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { font-family: 'Geist', -apple-system, sans-serif; }

    .vivora-root {
      display: flex; height: 100vh;
      background: #000; color: #fff;
      font-family: 'Geist', sans-serif;
      overflow: hidden;
    }

    /* ═══════════════════════════════════════════════════════
       SIDEBAR
    ═══════════════════════════════════════════════════════ */
    .vivora-sidebar {
      width: 240px; background: #0a0a0a;
      border-right: 1px solid #1a1a1a;
      display: flex; flex-direction: column;
      height: 100vh; overflow-y: auto;
      flex-shrink: 0;
    }

    .vivora-user {
      padding: 16px 14px; border-bottom: 1px solid #1a1a1a;
      display: flex; align-items: center; gap: 10px;
      cursor: pointer; transition: background 0.15s;
    }
    .vivora-user:hover { background: #111; }

    .vivora-user-avatar {
      width: 28px; height: 28px; border-radius: 6px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
    }

    .vivora-user-info { flex: 1; min-width: 0; }
    .vivora-user-name {
      font-size: 13px; font-weight: 600; color: #e5e5e5;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vivora-user-email {
      font-size: 11px; color: #666;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .vivora-nav { flex: 1; padding: 20px 12px; }

    .vivora-nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 6px;
      cursor: pointer; font-size: 13px; font-weight: 500;
      color: #888; margin-bottom: 2px;
      transition: all 0.15s ease;
      position: relative;
    }

    .vivora-nav-item:hover { background: #111; color: #e5e5e5; }

    .vivora-nav-item.active {
      background: #161616; color: #fff;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }

    .vivora-nav-item.active::before {
      content: ''; position: absolute; left: 0; top: 50%;
      transform: translateY(-50%); width: 2px; height: 16px;
      background: #3b82f6; border-radius: 0 2px 2px 0;
    }

    .vivora-nav-count {
      margin-left: auto; font-size: 11px;
      font-weight: 600; color: #666;
      background: #161616; padding: 1px 6px;
      border-radius: 4px; font-family: 'Geist Mono', monospace;
    }

    .vivora-nav-item.active .vivora-nav-count {
      color: #999; background: #1f1f1f;
    }

    .vivora-sidebar-footer {
      padding: 12px; border-top: 1px solid #1a1a1a;
    }

    .vivora-logout {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 6px;
      font-size: 13px; font-weight: 500; color: #ef4444;
      background: none; border: none; width: 100%;
      cursor: pointer; font-family: 'Geist', sans-serif;
      transition: background 0.15s;
    }
    .vivora-logout:hover { background: rgba(239,68,68,0.1); }

    /* ═══════════════════════════════════════════════════════
       MAIN AREA
    ═══════════════════════════════════════════════════════ */
    .vivora-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* TOPBAR */
    .vivora-topbar {
      background: #0a0a0a; border-bottom: 1px solid #1a1a1a;
      padding: 0 24px; height: 60px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }

    .vivora-page-title {
      font-size: 18px; font-weight: 700; color: #fff;
      letter-spacing: -0.3px;
    }

    .vivora-topbar-actions {
      display: flex; align-items: center; gap: 6px;
    }

    .vivora-topbar-search {
      display: flex; align-items: center; gap: 8px;
      background: #111; border: 1px solid #1f1f1f;
      border-radius: 6px; padding: 6px 10px; width: 220px;
      transition: border-color 0.2s;
    }
    .vivora-topbar-search:focus-within { border-color: #333; }

    .vivora-topbar-search input {
      background: none; border: none; outline: none;
      color: #e5e5e5; font-size: 13px; width: 100%;
      font-family: 'Geist', sans-serif;
    }
    .vivora-topbar-search input::placeholder { color: #555; }

    .vivora-icon-btn {
      width: 32px; height: 32px; background: #111;
      border: 1px solid #1f1f1f; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #888;
      transition: all 0.15s ease;
    }
    .vivora-icon-btn:hover { background: #161616; color: #e5e5e5; border-color: #2a2a2a; }

    /* CONTENT */
    .vivora-content {
      flex: 1; overflow-y: auto; padding: 24px;
      background: #000;
    }

    /* FILTER BAR */
    .vivora-filter-bar {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 20px; padding-bottom: 16px;
      border-bottom: 1px solid #1a1a1a;
    }

    .vivora-tab-btn {
      padding: 6px 12px; border-radius: 6px;
      font-size: 13px; font-weight: 500;
      background: none; border: 1px solid transparent;
      color: #888; cursor: pointer;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }

    .vivora-tab-btn:hover { background: #111; color: #e5e5e5; }

    .vivora-tab-btn.active {
      background: #161616; color: #fff;
      border-color: #2a2a2a;
    }

    .vivora-dropdown-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 6px;
      font-size: 13px; font-weight: 500;
      background: #111; border: 1px solid #1f1f1f;
      color: #888; cursor: pointer;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }
    .vivora-dropdown-btn:hover { background: #161616; color: #e5e5e5; border-color: #2a2a2a; }

    /* EMPTY STATE */
    .vivora-empty {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 80px 20px; text-align: center;
    }

    .vivora-empty-icon {
      width: 48px; height: 48px; border-radius: 10px;
      background: #111; display: flex;
      align-items: center; justify-content: center;
      margin-bottom: 16px; color: #444;
    }

    .vivora-empty-title {
      font-size: 16px; font-weight: 600; color: #e5e5e5;
      margin-bottom: 6px;
    }

    .vivora-empty-text {
      font-size: 13px; color: #666; max-width: 360px;
      line-height: 1.5; margin-bottom: 20px;
    }

    .vivora-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 6px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; border: none;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }

    .vivora-btn-primary {
      background: #fff; color: #000;
    }
    .vivora-btn-primary:hover:not(:disabled) {
      background: #e5e5e5;
    }

    .vivora-btn-secondary {
      background: #161616; color: #e5e5e5;
      border: 1px solid #2a2a2a;
    }
    .vivora-btn-secondary:hover:not(:disabled) {
      background: #1f1f1f; border-color: #333;
    }

    .vivora-btn:disabled {
      opacity: 0.5; cursor: not-allowed;
    }

    /* TABLE */
    .vivora-table-card {
      background: #0a0a0a; border: 1px solid #1a1a1a;
      border-radius: 8px; overflow: hidden;
    }

    .vivora-table {
      width: 100%; border-collapse: collapse;
    }

    .vivora-table thead tr {
      border-bottom: 1px solid #1a1a1a;
    }

    .vivora-table th {
      padding: 12px 16px; text-align: left;
      font-size: 11px; font-weight: 600;
      color: #666; letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Geist Mono', monospace;
    }

    .vivora-table td {
      padding: 14px 16px; font-size: 13px;
      border-bottom: 1px solid #111; color: #e5e5e5;
    }

    .vivora-table tbody tr:last-child td { border-bottom: none; }

    .vivora-table tbody tr {
      transition: background 0.12s ease;
    }
    .vivora-table tbody tr:hover {
      background: #0d0d0d;
    }

    .td-strong { font-weight: 600; color: #fff; }
    .td-muted { color: #666; font-size: 12px; }
    .td-mono { font-family: 'Geist Mono', monospace; font-size: 11.5px; color: #888; }

    .vivora-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 600;
      font-family: 'Geist Mono', monospace;
      text-transform: uppercase; letter-spacing: 0.3px;
    }

    .badge-blue { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
    .badge-green { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge-gray { background: #161616; color: #666; border: 1px solid #1f1f1f; }

    /* FORMS */
    .vivora-form-layout {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; margin-bottom: 24px;
    }

    .vivora-form-card {
      background: #0a0a0a; border: 1px solid #1a1a1a;
      border-radius: 8px; padding: 24px;
    }

    .vivora-form-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
    }

    .vivora-form-icon {
      width: 32px; height: 32px; border-radius: 6px;
      background: #161616; display: flex;
      align-items: center; justify-content: center;
      color: #888;
    }

    .vivora-form-title {
      font-size: 15px; font-weight: 600; color: #fff;
    }

    .vivora-field { margin-bottom: 14px; }

    .vivora-field-label {
      display: block; font-size: 11px; font-weight: 600;
      color: #888; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 6px;
      font-family: 'Geist Mono', monospace;
    }

    .vivora-field-input {
      width: 100%; padding: 8px 12px;
      background: #111; border: 1px solid #1f1f1f;
      border-radius: 6px; font-size: 13px;
      color: #e5e5e5; outline: none;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }

    .vivora-field-input:focus {
      background: #161616; border-color: #333;
      box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
    }

    .vivora-field-input::placeholder { color: #555; }

    .vivora-textarea {
      resize: none; min-height: 90px;
      font-family: 'Geist', sans-serif;
    }

    /* NOTIF LIST */
    .vivora-notif-list { display: flex; flex-direction: column; gap: 1px; }

    .vivora-notif-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; background: #0a0a0a;
      border: 1px solid #1a1a1a; border-radius: 6px;
      transition: all 0.15s ease;
    }
    .vivora-notif-item:hover { background: #0d0d0d; border-color: #222; }

    .vivora-notif-title {
      font-size: 13px; font-weight: 600; color: #e5e5e5;
    }
    .vivora-notif-date {
      font-size: 11px; color: #666; margin-top: 2px;
      font-family: 'Geist Mono', monospace;
    }

    .vivora-del-btn {
      width: 28px; height: 28px; background: none;
      border: 1px solid rgba(239,68,68,0.2); border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: rgba(239,68,68,0.5);
      transition: all 0.15s ease;
    }
    .vivora-del-btn:hover {
      background: rgba(239,68,68,0.1);
      border-color: #ef4444; color: #ef4444;
    }

    /* TEMPLATES GRID */
    .vivora-tpl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .vivora-tpl-card {
      background: #0a0a0a; border: 1px solid #1a1a1a;
      border-radius: 8px; overflow: hidden;
      transition: all 0.2s ease; cursor: default;
    }
    .vivora-tpl-card:hover {
      border-color: #2a2a2a;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    .vivora-tpl-card:hover .vivora-tpl-del { opacity: 1; }

    .vivora-tpl-thumb {
      aspect-ratio: 16/9; background: #111;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .vivora-tpl-thumb img { width: 100%; height: 100%; object-fit: cover; }

    .vivora-tpl-body {
      padding: 12px 14px; display: flex;
      align-items: flex-start; justify-content: space-between;
    }

    .vivora-tpl-name {
      font-size: 13px; font-weight: 600; color: #e5e5e5;
    }
    .vivora-tpl-cat {
      font-size: 11px; color: #666; margin-top: 2px;
    }
    .vivora-tpl-del { opacity: 0; transition: opacity 0.15s; }

    /* LOADING / ERROR */
    .vivora-full {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #000;
      font-family: 'Geist', sans-serif;
    }

    .vivora-spin {
      width: 36px; height: 36px;
      border: 2px solid #1f1f1f;
      border-top-color: #fff; border-radius: 50%;
      animation: vspin 0.7s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes vspin { to { transform: rotate(360deg); } }

    .vivora-loading-text {
      font-size: 13px; color: #888; text-align: center;
    }

    .vivora-err-card {
      background: #0a0a0a; border: 1px solid #1f1f1f;
      border-radius: 10px; padding: 40px; text-align: center;
      max-width: 400px; width: 90%;
    }

    .vivora-err-icon {
      width: 48px; height: 48px; border-radius: 10px;
      background: rgba(239,68,68,0.1); display: flex;
      align-items: center; justify-content: center;
      margin: 0 auto 16px; color: #ef4444;
    }

    .vivora-err-title {
      font-size: 18px; font-weight: 700; color: #fff;
      margin-bottom: 8px;
    }

    .vivora-err-msg {
      font-size: 13px; color: #888; margin-bottom: 24px;
      line-height: 1.6;
    }

    /* SCROLLBAR */
    .vivora-content::-webkit-scrollbar { width: 8px; }
    .vivora-content::-webkit-scrollbar-track { background: #000; }
    .vivora-content::-webkit-scrollbar-thumb {
      background: #1a1a1a; border-radius: 4px;
    }
    .vivora-content::-webkit-scrollbar-thumb:hover { background: #222; }

    .vivora-sidebar::-webkit-scrollbar { width: 6px; }
    .vivora-sidebar::-webkit-scrollbar-track { background: #0a0a0a; }
    .vivora-sidebar::-webkit-scrollbar-thumb {
      background: #1a1a1a; border-radius: 3px;
    }
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (authLoading || loading) {
    return (
      <>
        <style>{css}</style>
        <div className="vivora-full">
          <div>
            <div className="vivora-spin" />
            <p className="vivora-loading-text">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR
  // ═══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="vivora-full">
          <div className="vivora-err-card">
            <div className="vivora-err-icon"><AlertTriangle size={22} /></div>
            <h2 className="vivora-err-title">Access Denied</h2>
            <p className="vivora-err-msg">{error}</p>
            <button className="vivora-btn vivora-btn-primary" onClick={() => navigate('/')}>
              <ChevronRight size={14} /> Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  const navItems = [
    { key: 'users'        as const, label: 'Users',        icon: Users,      count: data.users.length },
    { key: 'plans'        as const, label: 'Plans',        icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp, count: data.transactions.length },
    { key: 'projects'     as const, label: 'Projects',     icon: FolderOpen, count: data.projects.length },
    { key: 'inbox'        as const, label: 'Inbox',        icon: Mail,       count: notifications.length },
    { key: 'templates'    as const, label: 'Templates',    icon: Layers,     count: templates.length },
  ];

  const pageTitles: Record<string, string> = {
    users: 'Users', plans: 'Plans', transactions: 'Transactions',
    projects: 'Projects', inbox: 'Inbox', templates: 'Templates',
  };

  return (
    <>
      <style>{css}</style>
      <div className="vivora-root">

        {/* ═══════════════════════════════════════════════════════════════════
            SIDEBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <aside className="vivora-sidebar">
          <div className="vivora-user">
            <div className="vivora-user-avatar">V</div>
            <div className="vivora-user-info">
              <div className="vivora-user-name">Vivora Admin</div>
              <div className="vivora-user-email">{user?.email || 'admin@vivora.ai'}</div>
            </div>
            <ChevronDown size={14} color="#666" />
          </div>

          <nav className="vivora-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <div
                  key={item.key}
                  className={`vivora-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setTab(item.key)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  <span className="vivora-nav-count">{item.count}</span>
                </div>
              );
            })}
          </nav>

          <div className="vivora-sidebar-footer">
            <button className="vivora-logout" onClick={() => navigate('/')}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN AREA
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="vivora-main">

          {/* TOPBAR */}
          <header className="vivora-topbar">
            <h1 className="vivora-page-title">{pageTitles[tab]}</h1>
            <div className="vivora-topbar-actions">
              <div className="vivora-topbar-search">
                <Search size={14} color="#666" />
                <input placeholder="Search..." />
              </div>
              <button className="vivora-icon-btn"><Code size={16} /></button>
              <button className="vivora-icon-btn"><Bell size={16} /></button>
              <button className="vivora-icon-btn"><Settings size={16} /></button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="vivora-content">

            {/* ══════════════════════════════════════════════════════════════
                INBOX
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'inbox' && (
              <>
                <div className="vivora-filter-bar">
                  <button className="vivora-tab-btn active">Sending</button>
                  <button className="vivora-tab-btn">Receiving</button>
                  <div style={{ flex: 1 }} />
                  <button className="vivora-dropdown-btn">
                    Last 15 days <ChevronDown size={14} />
                  </button>
                  <button className="vivora-dropdown-btn">
                    All Statuses <ChevronDown size={14} />
                  </button>
                  <button className="vivora-icon-btn"><Download size={16} /></button>
                </div>

                {notifications.length === 0 ? (
                  <div className="vivora-empty">
                    <div className="vivora-empty-icon"><Mail size={22} /></div>
                    <h3 className="vivora-empty-title">No sent emails yet</h3>
                    <p className="vivora-empty-text">
                      Start sending notifications to see insights and previews for every message.
                    </p>
                    <button className="vivora-btn vivora-btn-primary">
                      Send Notification
                    </button>
                  </div>
                ) : (
                  <div className="vivora-notif-list">
                    {notifications.map(n => (
                      <div key={n.id} className="vivora-notif-item">
                        <div>
                          <p className="vivora-notif-title">{n.title}</p>
                          <p className="vivora-notif-date">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        <button className="vivora-del-btn" onClick={() => handleDeleteNotification(n.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 32 }}>
                  <div className="vivora-form-card">
                    <div className="vivora-form-header">
                      <div className="vivora-form-icon"><Send size={16} /></div>
                      <span className="vivora-form-title">Send Notification</span>
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Title *</label>
                      <input
                        value={inboxTitle}
                        onChange={e => setInboxTitle(e.target.value)}
                        className="vivora-field-input"
                        placeholder="Notification title..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Message Body</label>
                      <textarea
                        value={inboxBody}
                        onChange={e => setInboxBody(e.target.value)}
                        className="vivora-field-input vivora-textarea"
                        placeholder="Write your message..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Image URL</label>
                      <input
                        value={inboxImage}
                        onChange={e => setInboxImage(e.target.value)}
                        className="vivora-field-input"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Link URL</label>
                      <input
                        value={inboxLink}
                        onChange={e => setInboxLink(e.target.value)}
                        className="vivora-field-input"
                        placeholder="https://..."
                      />
                    </div>
                    <button
                      className="vivora-btn vivora-btn-primary"
                      onClick={handleSendNotification}
                      disabled={!inboxTitle.trim() || sendingNotif}
                      style={{ marginTop: 8 }}
                    >
                      <Send size={14} />
                      {sendingNotif ? 'Sending...' : 'Send Notification'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TEMPLATES
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'templates' && (
              <>
                <div className="vivora-form-layout" style={{ marginBottom: 24 }}>
                  <div className="vivora-form-card">
                    <div className="vivora-form-header">
                      <div className="vivora-form-icon"><Plus size={16} /></div>
                      <span className="vivora-form-title">Add Template</span>
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Template Name *</label>
                      <input
                        value={tplName}
                        onChange={e => setTplName(e.target.value)}
                        className="vivora-field-input"
                        placeholder="Template name..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Category</label>
                      <input
                        value={tplCategory}
                        onChange={e => setTplCategory(e.target.value)}
                        className="vivora-field-input"
                        placeholder="General, Marketing..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Image URL</label>
                      <input
                        value={tplImage}
                        onChange={e => setTplImage(e.target.value)}
                        className="vivora-field-input"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="vivora-field">
                      <label className="vivora-field-label">Prompt *</label>
                      <textarea
                        value={tplPrompt}
                        onChange={e => setTplPrompt(e.target.value)}
                        className="vivora-field-input vivora-textarea"
                        placeholder="Enter the AI prompt..."
                      />
                    </div>
                    <button
                      className="vivora-btn vivora-btn-primary"
                      onClick={handleAddTemplate}
                      disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}
                      style={{ marginTop: 8 }}
                    >
                      <Plus size={14} />
                      {savingTpl ? 'Saving...' : 'Add Template'}
                    </button>
                  </div>
                  <div className="vivora-form-card">
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
                      Templates help users quickly start with predefined prompts. Add a name,
                      optional category and image, and the AI prompt that will be used.
                    </p>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="vivora-empty">
                    <div className="vivora-empty-icon"><Layers size={22} /></div>
                    <h3 className="vivora-empty-title">No templates yet</h3>
                    <p className="vivora-empty-text">
                      Create your first template to help users get started quickly.
                    </p>
                  </div>
                ) : (
                  <div className="vivora-tpl-grid">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="vivora-tpl-card">
                        <div className="vivora-tpl-thumb">
                          {tpl.image_url ? (
                            <img src={tpl.image_url} alt={tpl.name} />
                          ) : (
                            <Layers size={20} color="#444" />
                          )}
                        </div>
                        <div className="vivora-tpl-body">
                          <div>
                            <p className="vivora-tpl-name">{tpl.name}</p>
                            <p className="vivora-tpl-cat">{tpl.category}</p>
                          </div>
                          <button
                            className="vivora-del-btn vivora-tpl-del"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                DATA TABLES
            ══════════════════════════════════════════════════════════════ */}
            {['users', 'plans', 'transactions', 'projects'].includes(tab) && (
              <>
                <div className="vivora-filter-bar">
                  <button className="vivora-dropdown-btn">
                    <Filter size={14} /> All {pageTitles[tab]}
                  </button>
                  <div style={{ flex: 1 }} />
                  <button className="vivora-icon-btn"><Download size={16} /></button>
                </div>

                <div className="vivora-table-card">
                  <table className="vivora-table">
                    {tab === 'users' && (
                      <>
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Display Name</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.users.map(u => (
                            <tr key={u.id}>
                              <td className="td-strong">{u.email || '—'}</td>
                              <td>{u.display_name || '—'}</td>
                              <td className="td-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </>
                    )}

                    {tab === 'plans' && (
                      <>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Daily Limit</th>
                            <th>Used Today</th>
                            <th>Monthly</th>
                            <th>Total Used</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.plans.map(p => (
                            <tr key={p.id}>
                              <td className="td-mono">{p.user_id?.slice(0, 8)}…</td>
                              <td><span className="vivora-badge badge-blue">{p.plan}</span></td>
                              <td className="td-strong">{p.daily_credits}</td>
                              <td>{p.credits_used_today}</td>
                              <td className="td-strong">{p.monthly_credits}</td>
                              <td>{p.total_credits_used}</td>
                              <td className="td-muted">{new Date(p.updated_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </>
                    )}

                    {tab === 'transactions' && (
                      <>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Credits</th>
                            <th>Type</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.transactions.map(t => (
                            <tr key={t.id}>
                              <td className="td-muted">{new Date(t.created_at).toLocaleString()}</td>
                              <td className="td-mono">{t.user_id?.slice(0, 8)}…</td>
                              <td className="td-strong">{t.credits_used}</td>
                              <td>{t.work_type || '—'}</td>
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.description || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </>
                    )}

                    {tab === 'projects' && (
                      <>
                        <thead>
                          <tr>
                            <th>Project Name</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.projects.map(p => (
                            <tr key={p.id}>
                              <td className="td-strong">{p.name}</td>
                              <td className="td-mono">{p.user_id?.slice(0, 8)}…</td>
                              <td>{p.project_type}</td>
                              <td>
                                <span className={`vivora-badge ${p.is_published ? 'badge-green' : 'badge-gray'}`}>
                                  <Eye size={9} />
                                  {p.is_published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="td-muted">{new Date(p.created_at).toLocaleDateString()}</td>
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
    </>
  );
};
