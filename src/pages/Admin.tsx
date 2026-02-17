import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Mail, Layers, Plus, Trash2, Send, TrendingUp,
  LogOut, ChevronRight, Bell, Search, Settings, Eye,
} from 'lucide-react';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

// ── Circular Progress ─────────────────────────────────────────────────────────
const CircularProgress: React.FC<{ value: number; color: string; size?: number }> = ({
  value, color, size = 60,
}) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f2f5" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BarChart: React.FC<{ data: { earning: number; expense: number; month: string }[] }> = ({ data }) => {
  const max = Math.max(...data.flatMap(d => [d.earning, d.expense]));
  const chartH = 160;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: chartH + 20, width: '100%', paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: chartH }}>
            <div style={{ width: 11, background: '#f59e0b', height: `${(d.earning / max) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: 6 }} />
            <div style={{ width: 11, background: '#3b82f6', height: `${(d.expense / max) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: 6 }} />
          </div>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
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
          if (msg.includes('Unauthorized') || msg.includes('401')) { setError('Unauthorized - Please log in again'); return; }
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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ap-root {
      display: flex; height: 100vh; background: #f4f7fb;
      font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden;
    }

    /* SIDEBAR */
    .ap-sidebar {
      width: 220px; min-width: 220px; background: #fff;
      border-right: 1px solid #eef1f6; display: flex;
      flex-direction: column; height: 100vh; overflow-y: auto;
    }

    .ap-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 18px 16px; border-bottom: 1px solid #f0f3f8;
    }

    .ap-logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 9px; display: flex; align-items: center;
      justify-content: center; color: #fff; font-weight: 800; font-size: 15px;
    }

    .ap-logo-name { font-size: 17px; font-weight: 800; color: #111827; }

    .ap-nav { padding: 14px 10px; flex: 1; }
    .ap-nav-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #d1d5db; padding: 10px 10px 6px;
    }

    .ap-nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 11px; border-radius: 8px; cursor: pointer;
      color: #6b7280; font-size: 13px; font-weight: 600;
      margin-bottom: 2px; transition: all 0.14s;
    }
    .ap-nav-item:hover { background: #f4f7fb; color: #374151; }
    .ap-nav-item.active { background: #3b82f6; color: #fff; }

    .ap-nav-badge {
      margin-left: auto; font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 20px;
      background: rgba(255,255,255,0.22); color: #fff;
    }
    .ap-nav-badge-gray {
      margin-left: auto; font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 20px;
      background: #f0f3f8; color: #6b7280;
    }

    .ap-sidebar-footer { padding: 10px; border-top: 1px solid #f0f3f8; }
    .ap-logout {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 11px; border-radius: 8px; cursor: pointer;
      color: #ef4444; font-size: 13px; font-weight: 600;
      background: none; border: none; width: 100%;
      font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.14s;
    }
    .ap-logout:hover { background: #fef2f2; }

    /* MAIN */
    .ap-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .ap-topbar {
      background: #fff; border-bottom: 1px solid #eef1f6;
      padding: 0 24px; height: 62px; display: flex;
      align-items: center; justify-content: space-between; flex-shrink: 0;
    }

    .ap-page-title { font-size: 19px; font-weight: 800; color: #111827; }

    .ap-topbar-right { display: flex; align-items: center; gap: 8px; }

    .ap-search {
      display: flex; align-items: center; gap: 7px;
      background: #f4f7fb; border: 1px solid #eef1f6;
      border-radius: 8px; padding: 7px 12px; width: 190px;
    }
    .ap-search input {
      background: none; border: none; outline: none;
      font-size: 12.5px; color: #374151; width: 100%;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .ap-search input::placeholder { color: #9ca3af; }

    .ap-icon-btn {
      width: 36px; height: 36px; background: #f4f7fb;
      border: 1px solid #eef1f6; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6b7280; transition: all 0.14s;
    }
    .ap-icon-btn:hover { background: #eef1f6; color: #374151; }

    .ap-avatar {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; color: #fff; font-weight: 700;
      font-size: 12px; cursor: pointer;
    }

    /* CONTENT */
    .ap-content { flex: 1; overflow-y: auto; padding: 22px 24px; }

    /* STATS */
    .ap-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }

    .ap-stat {
      background: #fff; border-radius: 13px; padding: 20px 22px;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid #eef1f6; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .ap-stat-label { font-size: 11.5px; color: #9ca3af; font-weight: 600; margin-bottom: 5px; }
    .ap-stat-num { font-size: 30px; font-weight: 800; color: #111827; letter-spacing: -1px; margin-bottom: 3px; }
    .ap-stat-sub { font-size: 11px; color: #9ca3af; }
    .ap-stat-ring { position: relative; display: flex; align-items: center; justify-content: center; }
    .ap-ring-label { position: absolute; font-size: 11px; font-weight: 700; color: #374151; }

    /* CHART */
    .ap-chart {
      background: #fff; border-radius: 13px; padding: 20px 22px;
      border: 1px solid #eef1f6; margin-bottom: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ap-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .ap-chart-title { font-size: 14px; font-weight: 700; color: #111827; }
    .ap-legend { display: flex; align-items: center; gap: 14px; }
    .ap-legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #6b7280; }
    .ap-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

    /* TABS */
    .ap-tabs {
      display: flex; gap: 3px; background: #fff;
      border: 1px solid #eef1f6; border-radius: 10px;
      padding: 4px; margin-bottom: 18px; width: fit-content;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ap-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 7px; cursor: pointer;
      font-size: 12.5px; font-weight: 600; color: #6b7280;
      background: none; border: none;
      font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.14s;
    }
    .ap-tab:hover { background: #f4f7fb; color: #374151; }
    .ap-tab.active { background: #3b82f6; color: #fff; box-shadow: 0 2px 8px rgba(59,130,246,0.28); }
    .ap-tab-n { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
    .ap-tab.active .ap-tab-n { background: rgba(255,255,255,0.22); color: #fff; }
    .ap-tab:not(.active) .ap-tab-n { background: #f0f3f8; color: #6b7280; }

    /* TABLE CARD */
    .ap-table-card {
      background: #fff; border-radius: 13px;
      border: 1px solid #eef1f6; overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ap-table-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #f4f7fb;
    }
    .ap-table-title { font-size: 14px; font-weight: 700; color: #111827; }
    .ap-see-all {
      font-size: 12px; font-weight: 600; color: #3b82f6;
      background: none; border: none; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .ap-table { width: 100%; border-collapse: collapse; }
    .ap-table thead tr { background: #f9fafb; border-bottom: 1px solid #f0f3f8; }
    .ap-table th {
      padding: 11px 18px; text-align: left;
      font-size: 10.5px; font-weight: 700; color: #9ca3af;
      letter-spacing: 0.5px; text-transform: uppercase;
    }
    .ap-table td { padding: 12px 18px; font-size: 13px; border-bottom: 1px solid #f9fafb; color: #374151; }
    .ap-table tbody tr:last-child td { border-bottom: none; }
    .ap-table tbody tr:hover { background: #fafbfc; }

    .c-strong { font-weight: 600; color: #111827; }
    .c-muted { color: #9ca3af; font-size: 12px; }
    .c-mono { font-size: 11.5px; color: #6b7280; font-family: monospace; }

    .ap-plan-pill {
      display: inline-flex; align-items: center; padding: 2px 9px;
      border-radius: 6px; font-size: 10.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px;
      background: #eff6ff; color: #3b82f6;
    }
    .ap-status-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 9px; border-radius: 6px; font-size: 10.5px; font-weight: 700;
    }
    .ap-pub { background: #f0fdf4; color: #16a34a; }
    .ap-draft { background: #f9fafb; color: #9ca3af; }

    /* FORMS */
    .ap-form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
    .ap-form-card {
      background: #fff; border-radius: 13px;
      border: 1px solid #eef1f6; padding: 22px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ap-form-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .ap-form-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .ap-fi-blue { background: #eff6ff; color: #3b82f6; }
    .ap-fi-purple { background: #f5f3ff; color: #7c3aed; }
    .ap-form-title { font-size: 14px; font-weight: 700; color: #111827; }

    .ap-field { margin-bottom: 13px; }
    .ap-field-label {
      display: block; font-size: 10.5px; font-weight: 700;
      color: #6b7280; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 5px;
    }
    .ap-field-input {
      width: 100%; padding: 9px 13px;
      background: #f9fafb; border: 1.5px solid #eef1f6;
      border-radius: 8px; font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #111827; outline: none; transition: all 0.14s;
    }
    .ap-field-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .ap-field-input::placeholder { color: #c9cdd6; }
    .ap-textarea { resize: none; min-height: 88px; }

    .ap-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border: none; border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all 0.14s; margin-top: 4px;
    }
    .ap-btn-blue { background: #3b82f6; color: #fff; }
    .ap-btn-blue:hover:not(:disabled) { background: #2563eb; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    .ap-btn-purple { background: #7c3aed; color: #fff; }
    .ap-btn-purple:hover:not(:disabled) { background: #6d28d9; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
    .ap-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* NOTIF */
    .ap-notif-card {
      background: #fff; border-radius: 13px;
      border: 1px solid #eef1f6; overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ap-notif-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 18px; border-bottom: 1px solid #f9fafb; transition: background 0.12s;
    }
    .ap-notif-item:last-child { border-bottom: none; }
    .ap-notif-item:hover { background: #fafbfc; }
    .ap-notif-title { font-size: 13px; font-weight: 600; color: #111827; }
    .ap-notif-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    .ap-del-btn {
      width: 28px; height: 28px; background: none;
      border: 1.5px solid #fee2e2; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #fca5a5; transition: all 0.14s;
    }
    .ap-del-btn:hover { background: #fef2f2; border-color: #ef4444; color: #ef4444; }

    /* TEMPLATES */
    .ap-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 13px; }
    .ap-tpl-card {
      background: #fff; border-radius: 12px;
      border: 1px solid #eef1f6; overflow: hidden;
      transition: all 0.18s; cursor: default;
    }
    .ap-tpl-card:hover { border-color: #bfdbfe; box-shadow: 0 4px 16px rgba(59,130,246,0.1); transform: translateY(-2px); }
    .ap-tpl-card:hover .ap-tpl-del { opacity: 1; }
    .ap-tpl-thumb {
      aspect-ratio: 16/9;
      background: linear-gradient(135deg, #eff6ff, #f5f3ff);
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .ap-tpl-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ap-tpl-body { padding: 11px 13px; display: flex; align-items: flex-start; justify-content: space-between; }
    .ap-tpl-name { font-size: 12.5px; font-weight: 700; color: #111827; }
    .ap-tpl-cat { font-size: 10.5px; color: #9ca3af; margin-top: 2px; }
    .ap-tpl-del { opacity: 0; transition: opacity 0.14s; }

    /* EMPTY */
    .ap-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px; }
    .ap-empty-icon { width: 44px; height: 44px; border-radius: 11px; background: #f4f7fb; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .ap-empty-text { font-size: 12.5px; color: #9ca3af; font-weight: 500; }

    /* LOADING / ERROR */
    .ap-full { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f4f7fb; font-family: 'Plus Jakarta Sans', sans-serif; }
    .ap-spin { width: 38px; height: 38px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: aps 0.75s linear infinite; margin: 0 auto 12px; }
    @keyframes aps { to { transform: rotate(360deg); } }
    .ap-loading-text { font-size: 12.5px; color: #6b7280; font-weight: 500; text-align: center; }
    .ap-err-card { background: #fff; border-radius: 16px; padding: 40px; text-align: center; max-width: 360px; width: 90%; border: 1px solid #fee2e2; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .ap-err-icon { width: 48px; height: 48px; border-radius: 13px; background: #fef2f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #ef4444; }
    .ap-err-title { font-size: 19px; font-weight: 800; color: #111827; margin-bottom: 7px; }
    .ap-err-msg { font-size: 12.5px; color: #6b7280; margin-bottom: 22px; }
    .ap-go-home { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; }
    .ap-go-home:hover { background: #2563eb; }
  `;

  if (authLoading || loading) {
    return (
      <>
        <style>{css}</style>
        <div className="ap-full">
          <div>
            <div className="ap-spin" />
            <p className="ap-loading-text">Loading Admin Panel...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="ap-full">
          <div className="ap-err-card">
            <div className="ap-err-icon"><AlertTriangle size={22} /></div>
            <h2 className="ap-err-title">Access Denied</h2>
            <p className="ap-err-msg">{error}</p>
            <button className="ap-go-home" onClick={() => navigate('/')}>
              <ChevronRight size={13} /> Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users, count: data.users.length },
    { key: 'plans' as const, label: 'Plans', icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
    { key: 'inbox' as const, label: 'Inbox', icon: Mail, count: notifications.length },
    { key: 'templates' as const, label: 'Templates', icon: Layers, count: templates.length },
  ];

  const pageTitles: Record<string, string> = {
    users: 'Dashboard', plans: 'Plans', transactions: 'Transactions',
    projects: 'Projects', inbox: 'Inbox', templates: 'Templates',
  };

  const chartData = [
    { month: 'Jan', earning: 120, expense: 80 }, { month: 'Feb', earning: 180, expense: 100 },
    { month: 'Mar', earning: 160, expense: 140 }, { month: 'Apr', earning: 200, expense: 90 },
    { month: 'May', earning: 140, expense: 120 }, { month: 'Jun', earning: 280, expense: 160 },
    { month: 'Jul', earning: 220, expense: 100 }, { month: 'Aug', earning: 160, expense: 130 },
    { month: 'Sep', earning: 190, expense: 110 }, { month: 'Oct', earning: 170, expense: 95 },
    { month: 'Nov', earning: 240, expense: 140 }, { month: 'Dec', earning: 280, expense: 120 },
  ];

  const isDataTab = ['users', 'plans', 'transactions', 'projects'].includes(tab);

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="ap-sidebar">
          <div className="ap-logo">
            <div className="ap-logo-icon">V</div>
            <span className="ap-logo-name">Vivora</span>
          </div>

          <nav className="ap-nav">
            <p className="ap-nav-label">Main Menu</p>
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <div
                  key={t.key}
                  className={`ap-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                  <span className={active ? 'ap-nav-badge' : 'ap-nav-badge-gray'}>{t.count}</span>
                </div>
              );
            })}
          </nav>

          <div className="ap-sidebar-footer">
            <button className="ap-logout" onClick={() => navigate('/')}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div className="ap-main">

          {/* Topbar */}
          <header className="ap-topbar">
            <h1 className="ap-page-title">{pageTitles[tab]}</h1>
            <div className="ap-topbar-right">
              <div className="ap-search">
                <Search size={13} color="#9ca3af" />
                <input placeholder="Search..." />
              </div>
              <button className="ap-icon-btn"><Bell size={14} /></button>
              <button className="ap-icon-btn"><Settings size={14} /></button>
              <div className="ap-avatar">A</div>
            </div>
          </header>

          {/* Content */}
          <div className="ap-content">

            {/* Stats (data tabs only) */}
            {isDataTab && (
              <>
                <div className="ap-stats">
                  {[
                    { label: 'Customers', num: data.users.length, sub: 'Last 90 Days', pct: 75, color: '#3b82f6' },
                    { label: 'Orders', num: data.plans.length, sub: 'Last 90 Days', pct: 65, color: '#f59e0b' },
                    { label: 'Cancel', num: data.transactions.length, sub: 'Last 90 Days', pct: 35, color: '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} className="ap-stat">
                      <div>
                        <p className="ap-stat-label">{s.label}</p>
                        <p className="ap-stat-num">{s.num}</p>
                        <p className="ap-stat-sub">{s.sub}</p>
                      </div>
                      <div className="ap-stat-ring">
                        <CircularProgress value={s.pct} color={s.color} size={62} />
                        <span className="ap-ring-label">{s.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ap-chart">
                  <div className="ap-chart-header">
                    <span className="ap-chart-title">Revenue Report</span>
                    <div className="ap-legend">
                      <div className="ap-legend-item"><div className="ap-legend-dot" style={{ background: '#f59e0b' }} /> Earning</div>
                      <div className="ap-legend-item"><div className="ap-legend-dot" style={{ background: '#3b82f6' }} /> Expenses</div>
                    </div>
                  </div>
                  <BarChart data={chartData} />
                </div>
              </>
            )}

            {/* Tab switcher */}
            <div className="ap-tabs">
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button key={t.key} className={`ap-tab ${active ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                    <Icon size={12} /> {t.label}
                    <span className="ap-tab-n">{t.count}</span>
                  </button>
                );
              })}
            </div>

            {/* ── INBOX ── */}
            {tab === 'inbox' && (
              <div className="ap-form-layout">
                <div className="ap-form-card">
                  <div className="ap-form-header">
                    <div className="ap-form-icon ap-fi-blue"><Send size={14} /></div>
                    <span className="ap-form-title">Send Notification</span>
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">Title *</label>
                    <input value={inboxTitle} onChange={e => setInboxTitle(e.target.value)} className="ap-field-input" placeholder="Notification title..." />
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">Message Body</label>
                    <textarea value={inboxBody} onChange={e => setInboxBody(e.target.value)} className="ap-field-input ap-textarea" placeholder="Write your message..." />
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">Image URL</label>
                    <input value={inboxImage} onChange={e => setInboxImage(e.target.value)} className="ap-field-input" placeholder="https://..." />
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">Link URL</label>
                    <input value={inboxLink} onChange={e => setInboxLink(e.target.value)} className="ap-field-input" placeholder="https://..." />
                  </div>
                  <button className="ap-btn ap-btn-blue" onClick={handleSendNotification} disabled={!inboxTitle.trim() || sendingNotif}>
                    <Send size={12} /> {sendingNotif ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>

                <div className="ap-notif-card">
                  <div className="ap-table-head">
                    <span className="ap-table-title">Sent Notifications</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="ap-empty">
                      <div className="ap-empty-icon"><Mail size={18} color="#d1d5db" /></div>
                      <p className="ap-empty-text">No notifications yet</p>
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} className="ap-notif-item">
                      <div>
                        <p className="ap-notif-title">{n.title}</p>
                        <p className="ap-notif-date">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      <button className="ap-del-btn" onClick={() => handleDeleteNotification(n.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TEMPLATES ── */}
            {tab === 'templates' && (
              <>
                <div className="ap-form-layout" style={{ marginBottom: 18 }}>
                  <div className="ap-form-card">
                    <div className="ap-form-header">
                      <div className="ap-form-icon ap-fi-purple"><Plus size={14} /></div>
                      <span className="ap-form-title">Add New Template</span>
                    </div>
                    <div className="ap-field">
                      <label className="ap-field-label">Template Name *</label>
                      <input value={tplName} onChange={e => setTplName(e.target.value)} className="ap-field-input" placeholder="Template name..." />
                    </div>
                    <div className="ap-field">
                      <label className="ap-field-label">Category</label>
                      <input value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="ap-field-input" placeholder="General, Marketing..." />
                    </div>
                    <div className="ap-field">
                      <label className="ap-field-label">Image URL</label>
                      <input value={tplImage} onChange={e => setTplImage(e.target.value)} className="ap-field-input" placeholder="https://..." />
                    </div>
                    <div className="ap-field">
                      <label className="ap-field-label">Prompt *</label>
                      <textarea value={tplPrompt} onChange={e => setTplPrompt(e.target.value)} className="ap-field-input ap-textarea" placeholder="Enter the AI prompt..." />
                    </div>
                    <button className="ap-btn ap-btn-purple" onClick={handleAddTemplate} disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}>
                      <Plus size={12} /> {savingTpl ? 'Saving...' : 'Add Template'}
                    </button>
                  </div>
                  <div className="ap-form-card" style={{ alignSelf: 'start' }}>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65 }}>
                      Templates help users quickly start with predefined prompts. Add a name, optional category and image, and the AI prompt that will trigger when this template is selected.
                    </p>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="ap-table-card">
                    <div className="ap-empty">
                      <div className="ap-empty-icon"><Layers size={18} color="#d1d5db" /></div>
                      <p className="ap-empty-text">No templates yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="ap-tpl-grid">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="ap-tpl-card">
                        <div className="ap-tpl-thumb">
                          {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} /> : <Layers size={20} color="#c4b5fd" />}
                        </div>
                        <div className="ap-tpl-body">
                          <div>
                            <p className="ap-tpl-name">{tpl.name}</p>
                            <p className="ap-tpl-cat">{tpl.category}</p>
                          </div>
                          <button className="ap-del-btn ap-tpl-del" onClick={() => handleDeleteTemplate(tpl.id)}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── DATA TABLES ── */}
            {isDataTab && (
              <div className="ap-table-card">
                {tab === 'users' && (
                  <>
                    <div className="ap-table-head">
                      <span className="ap-table-title">All Users</span>
                      <button className="ap-see-all">See All</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ap-table">
                        <thead><tr><th>Email</th><th>Display Name</th><th>Created</th></tr></thead>
                        <tbody>
                          {data.users.map(u => (
                            <tr key={u.id}>
                              <td className="c-strong">{u.email || '—'}</td>
                              <td>{u.display_name || '—'}</td>
                              <td className="c-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === 'plans' && (
                  <>
                    <div className="ap-table-head">
                      <span className="ap-table-title">Subscription Plans</span>
                      <button className="ap-see-all">See All</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ap-table">
                        <thead><tr><th>User</th><th>Plan</th><th>Daily Limit</th><th>Used Today</th><th>Monthly</th><th>Total Used</th><th>Updated</th></tr></thead>
                        <tbody>
                          {data.plans.map(p => (
                            <tr key={p.id}>
                              <td className="c-mono">{p.user_id?.slice(0, 8)}…</td>
                              <td><span className="ap-plan-pill">{p.plan}</span></td>
                              <td className="c-strong">{p.daily_credits}</td>
                              <td>{p.credits_used_today}</td>
                              <td className="c-strong">{p.monthly_credits}</td>
                              <td>{p.total_credits_used}</td>
                              <td className="c-muted">{new Date(p.updated_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === 'transactions' && (
                  <>
                    <div className="ap-table-head">
                      <span className="ap-table-title">Transactions</span>
                      <button className="ap-see-all">See All</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ap-table">
                        <thead><tr><th>Date</th><th>User</th><th>Credits</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                          {data.transactions.map(t => (
                            <tr key={t.id}>
                              <td className="c-muted">{new Date(t.created_at).toLocaleString()}</td>
                              <td className="c-mono">{t.user_id?.slice(0, 8)}…</td>
                              <td className="c-strong">{t.credits_used}</td>
                              <td>{t.work_type || '—'}</td>
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>{t.description || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === 'projects' && (
                  <>
                    <div className="ap-table-head">
                      <span className="ap-table-title">Projects</span>
                      <button className="ap-see-all">See All</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ap-table">
                        <thead><tr><th>Project Name</th><th>User</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
                        <tbody>
                          {data.projects.map(p => (
                            <tr key={p.id}>
                              <td className="c-strong">{p.name}</td>
                              <td className="c-mono">{p.user_id?.slice(0, 8)}…</td>
                              <td>{p.project_type}</td>
                              <td>
                                <span className={`ap-status-pill ${p.is_published ? 'ap-pub' : 'ap-draft'}`}>
                                  <Eye size={9} /> {p.is_published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="c-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
