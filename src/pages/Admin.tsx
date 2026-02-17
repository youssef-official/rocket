import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CreditCard, FolderOpen, AlertTriangle,
  Mail, Layers, Plus, Trash2, Send, TrendingUp,
  LogOut, ChevronRight, Bell, Search, Settings, Eye, Moon, Sun,
} from 'lucide-react';

interface AdminData {
  users: any[];
  plans: any[];
  transactions: any[];
  projects: any[];
}

// ── Circular Progress ─────────────────────────────────────────────────────────
const CircularProgress: React.FC<{ value: number; color: string; size?: number; dark?: boolean }> = ({
  value, color, size = 60, dark = false,
}) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? '#2a2d3a' : '#f0f2f5'} strokeWidth={6} />
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
const BarChart: React.FC<{ data: { earning: number; expense: number; month: string }[]; dark?: boolean }> = ({ data, dark }) => {
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
          <span style={{ fontSize: 10, color: dark ? '#6b7280' : '#9ca3af', fontWeight: 500 }}>{d.month}</span>
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
  const [dark, setDark] = useState(false);

  // Inbox
  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxBody, setInboxBody] = useState('');
  const [inboxImage, setInboxImage] = useState('');
  const [inboxLink, setInboxLink] = useState('');
  const [inboxPlan, setInboxPlan] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Templates
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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const t = {
    bg:          dark ? '#0f1117' : '#f4f7fb',
    sidebar:     dark ? '#161b27' : '#ffffff',
    sidebarBdr:  dark ? '#1e2535' : '#eef1f6',
    card:        dark ? '#1a2035' : '#ffffff',
    cardBdr:     dark ? '#1e2535' : '#eef1f6',
    topbar:      dark ? '#161b27' : '#ffffff',
    topbarBdr:   dark ? '#1e2535' : '#eef1f6',
    text:        dark ? '#e2e8f0' : '#111827',
    textSec:     dark ? '#8892a4' : '#6b7280',
    textMuted:   dark ? '#4a5568' : '#9ca3af',
    inputBg:     dark ? '#0f1117' : '#f9fafb',
    inputBdr:    dark ? '#1e2535' : '#eef1f6',
    rowHover:    dark ? '#1e2535' : '#fafbfc',
    rowBdr:      dark ? '#1a2035' : '#f4f7fb',
    theadBg:     dark ? '#131825' : '#f9fafb',
    theadBdr:    dark ? '#1e2535' : '#f0f3f8',
    navHover:    dark ? '#1e2535' : '#f4f7fb',
    searchBg:    dark ? '#0f1117' : '#f4f7fb',
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ap-root {
      display: flex; height: 100vh;
      background: ${t.bg};
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
      transition: background 0.3s;
    }

    /* ── SIDEBAR ─────────────────────────────────────── */
    .ap-sidebar {
      width: 228px; min-width: 228px;
      background: ${t.sidebar};
      border-right: 1px solid ${t.sidebarBdr};
      display: flex; flex-direction: column;
      height: 100vh; overflow-y: auto;
      transition: background 0.3s, border-color 0.3s;
    }

    .ap-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 22px 20px 18px;
      border-bottom: 1px solid ${t.sidebarBdr};
    }

    .ap-logo-icon {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 9px; display: flex; align-items: center;
      justify-content: center; color: #fff;
      font-weight: 800; font-size: 16px;
      box-shadow: 0 4px 12px rgba(59,130,246,0.35);
    }

    .ap-logo-name {
      font-size: 17px; font-weight: 800;
      color: ${t.text};
      letter-spacing: -0.3px;
    }

    .ap-nav { padding: 16px 12px; flex: 1; }

    .ap-nav-section {
      font-size: 9.5px; font-weight: 700;
      letter-spacing: 1.2px; text-transform: uppercase;
      color: ${t.textMuted};
      padding: 10px 10px 6px;
    }

    .ap-nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 9px;
      cursor: pointer; color: ${t.textSec};
      font-size: 13.5px; font-weight: 600;
      margin-bottom: 3px;
      transition: all 0.15s;
      border: 1px solid transparent;
    }

    .ap-nav-item:hover {
      background: ${t.navHover};
      color: ${t.text};
    }

    .ap-nav-item.active {
      background: #3b82f6;
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 14px rgba(59,130,246,0.35);
    }

    .ap-nav-count {
      margin-left: auto;
      font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
    }

    .ap-nav-item.active .ap-nav-count {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }

    .ap-nav-item:not(.active) .ap-nav-count {
      background: ${dark ? '#1e2535' : '#f0f3f8'};
      color: ${t.textSec};
    }

    .ap-sidebar-footer {
      padding: 12px;
      border-top: 1px solid ${t.sidebarBdr};
    }

    .ap-logout {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 9px;
      cursor: pointer; color: #ef4444;
      font-size: 13.5px; font-weight: 600;
      background: none; border: none; width: 100%;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: background 0.15s;
    }
    .ap-logout:hover { background: ${dark ? 'rgba(239,68,68,0.1)' : '#fef2f2'}; }

    /* ── MAIN ────────────────────────────────────────── */
    .ap-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── TOPBAR ──────────────────────────────────────── */
    .ap-topbar {
      background: ${t.topbar};
      border-bottom: 1px solid ${t.topbarBdr};
      padding: 0 26px; height: 64px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      transition: background 0.3s, border-color 0.3s;
    }

    .ap-page-title {
      font-size: 20px; font-weight: 800;
      color: ${t.text};
      letter-spacing: -0.3px;
    }

    .ap-topbar-right { display: flex; align-items: center; gap: 8px; }

    .ap-search {
      display: flex; align-items: center; gap: 8px;
      background: ${t.searchBg};
      border: 1px solid ${t.inputBdr};
      border-radius: 9px; padding: 8px 13px; width: 200px;
      transition: border-color 0.2s;
    }
    .ap-search:focus-within { border-color: #3b82f6; }

    .ap-search input {
      background: none; border: none; outline: none;
      font-size: 13px; color: ${t.text}; width: 100%;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .ap-search input::placeholder { color: ${t.textMuted}; }

    .ap-icon-btn {
      width: 38px; height: 38px;
      background: ${t.searchBg};
      border: 1px solid ${t.inputBdr};
      border-radius: 9px; display: flex;
      align-items: center; justify-content: center;
      cursor: pointer; color: ${t.textSec};
      transition: all 0.15s;
    }
    .ap-icon-btn:hover {
      background: ${t.navHover};
      color: ${t.text};
    }

    .ap-theme-btn {
      background: ${dark ? 'rgba(251,191,36,0.12)' : 'rgba(59,130,246,0.08)'};
      border-color: ${dark ? 'rgba(251,191,36,0.25)' : 'rgba(59,130,246,0.2)'};
      color: ${dark ? '#fbbf24' : '#3b82f6'};
    }
    .ap-theme-btn:hover {
      background: ${dark ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.15)'};
    }

    .ap-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; color: #fff;
      font-weight: 700; font-size: 13px; cursor: pointer;
      box-shadow: 0 2px 8px rgba(99,102,241,0.3);
    }

    /* ── CONTENT ─────────────────────────────────────── */
    .ap-content { flex: 1; overflow-y: auto; padding: 24px 26px; }

    /* ── STATS ───────────────────────────────────────── */
    .ap-stats {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 16px; margin-bottom: 18px;
    }

    .ap-stat {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 14px; padding: 20px 22px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: ${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'};
      transition: background 0.3s, border-color 0.3s;
    }

    .ap-stat-label {
      font-size: 12px; color: ${t.textMuted};
      font-weight: 600; margin-bottom: 5px;
    }
    .ap-stat-num {
      font-size: 30px; font-weight: 800;
      color: ${t.text}; letter-spacing: -1px; margin-bottom: 3px;
    }
    .ap-stat-sub { font-size: 11px; color: ${t.textMuted}; }

    .ap-stat-ring {
      position: relative; display: flex;
      align-items: center; justify-content: center;
    }
    .ap-ring-pct {
      position: absolute; font-size: 11px;
      font-weight: 700; color: ${t.textSec};
    }

    /* ── CHART ───────────────────────────────────────── */
    .ap-chart {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 14px; padding: 20px 22px;
      margin-bottom: 20px;
      box-shadow: ${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'};
      transition: background 0.3s, border-color 0.3s;
    }
    .ap-chart-hdr {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 14px;
    }
    .ap-chart-title { font-size: 14px; font-weight: 700; color: ${t.text}; }
    .ap-legend { display: flex; align-items: center; gap: 14px; }
    .ap-legend-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; color: ${t.textSec};
    }
    .ap-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

    /* ── TABLE CARD ──────────────────────────────────── */
    .ap-table-card {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 14px; overflow: hidden;
      box-shadow: ${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'};
      transition: background 0.3s, border-color 0.3s;
    }

    .ap-table-hdr {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid ${t.theadBdr};
    }
    .ap-table-title { font-size: 14px; font-weight: 700; color: ${t.text}; }
    .ap-see-all {
      font-size: 12px; font-weight: 600; color: #3b82f6;
      background: none; border: none; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .ap-table { width: 100%; border-collapse: collapse; }
    .ap-table thead tr {
      background: ${t.theadBg};
      border-bottom: 1px solid ${t.theadBdr};
    }
    .ap-table th {
      padding: 11px 18px; text-align: left;
      font-size: 10.5px; font-weight: 700;
      color: ${t.textMuted}; letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .ap-table td {
      padding: 12px 18px; font-size: 13px;
      border-bottom: 1px solid ${t.rowBdr};
      color: ${t.textSec};
    }
    .ap-table tbody tr:last-child td { border-bottom: none; }
    .ap-table tbody tr:hover { background: ${t.rowHover}; }

    .c-strong { font-weight: 600; color: ${t.text} !important; }
    .c-muted { color: ${t.textMuted} !important; font-size: 12px; }
    .c-mono { font-size: 11.5px; color: ${t.textMuted} !important; font-family: monospace; }

    .ap-plan-pill {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: 6px;
      font-size: 10.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px;
      background: ${dark ? 'rgba(59,130,246,0.15)' : '#eff6ff'};
      color: #3b82f6;
    }

    .ap-status-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 9px; border-radius: 6px;
      font-size: 10.5px; font-weight: 700;
    }
    .ap-pub {
      background: ${dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4'};
      color: #16a34a;
    }
    .ap-draft {
      background: ${dark ? 'rgba(255,255,255,0.05)' : '#f9fafb'};
      color: ${t.textMuted};
    }

    /* ── FORMS ───────────────────────────────────────── */
    .ap-form-layout {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 18px; margin-bottom: 18px;
    }

    .ap-form-card {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 14px; padding: 22px;
      box-shadow: ${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'};
      transition: background 0.3s, border-color 0.3s;
    }

    .ap-form-hdr {
      display: flex; align-items: center;
      gap: 10px; margin-bottom: 18px;
    }

    .ap-form-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .ap-fi-blue {
      background: ${dark ? 'rgba(59,130,246,0.15)' : '#eff6ff'};
      color: #3b82f6;
    }
    .ap-fi-purple {
      background: ${dark ? 'rgba(124,58,237,0.15)' : '#f5f3ff'};
      color: #7c3aed;
    }
    .ap-form-title { font-size: 14px; font-weight: 700; color: ${t.text}; }

    .ap-field { margin-bottom: 13px; }
    .ap-field-label {
      display: block; font-size: 10.5px; font-weight: 700;
      color: ${t.textSec}; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 5px;
    }
    .ap-field-input {
      width: 100%; padding: 9px 13px;
      background: ${t.inputBg};
      border: 1.5px solid ${t.inputBdr};
      border-radius: 8px; font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: ${t.text}; outline: none; transition: all 0.15s;
    }
    .ap-field-input:focus {
      background: ${dark ? '#1a2035' : '#fff'};
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }
    .ap-field-input::placeholder { color: ${t.textMuted}; }
    .ap-textarea { resize: none; min-height: 88px; }

    .ap-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border: none; border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all 0.15s; margin-top: 4px;
    }
    .ap-btn-blue { background: #3b82f6; color: #fff; }
    .ap-btn-blue:hover:not(:disabled) {
      background: #2563eb;
      box-shadow: 0 4px 14px rgba(59,130,246,0.35);
    }
    .ap-btn-purple { background: #7c3aed; color: #fff; }
    .ap-btn-purple:hover:not(:disabled) {
      background: #6d28d9;
      box-shadow: 0 4px 14px rgba(124,58,237,0.35);
    }
    .ap-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── NOTIF ───────────────────────────────────────── */
    .ap-notif-card {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 14px; overflow: hidden;
      box-shadow: ${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'};
    }
    .ap-notif-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 18px;
      border-bottom: 1px solid ${t.rowBdr};
      transition: background 0.12s;
    }
    .ap-notif-item:last-child { border-bottom: none; }
    .ap-notif-item:hover { background: ${t.rowHover}; }
    .ap-notif-title { font-size: 13px; font-weight: 600; color: ${t.text}; }
    .ap-notif-date { font-size: 11px; color: ${t.textMuted}; margin-top: 2px; }

    .ap-del-btn {
      width: 28px; height: 28px; background: none;
      border: 1.5px solid ${dark ? 'rgba(239,68,68,0.2)' : '#fee2e2'};
      border-radius: 7px; display: flex;
      align-items: center; justify-content: center;
      cursor: pointer; color: ${dark ? 'rgba(239,68,68,0.5)' : '#fca5a5'};
      transition: all 0.15s;
    }
    .ap-del-btn:hover {
      background: ${dark ? 'rgba(239,68,68,0.1)' : '#fef2f2'};
      border-color: #ef4444; color: #ef4444;
    }

    /* ── TEMPLATES GRID ──────────────────────────────── */
    .ap-tpl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 14px;
    }
    .ap-tpl-card {
      background: ${t.card};
      border: 1px solid ${t.cardBdr};
      border-radius: 12px; overflow: hidden;
      transition: all 0.2s; cursor: default;
    }
    .ap-tpl-card:hover {
      border-color: ${dark ? '#3b82f6' : '#bfdbfe'};
      box-shadow: 0 4px 16px rgba(59,130,246,${dark ? '0.2' : '0.1'});
      transform: translateY(-2px);
    }
    .ap-tpl-card:hover .ap-tpl-del { opacity: 1; }

    .ap-tpl-thumb {
      aspect-ratio: 16/9;
      background: ${dark ? 'linear-gradient(135deg, #1a2035, #1e2535)' : 'linear-gradient(135deg, #eff6ff, #f5f3ff)'};
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .ap-tpl-thumb img { width: 100%; height: 100%; object-fit: cover; }

    .ap-tpl-body {
      padding: 11px 13px;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .ap-tpl-name { font-size: 12.5px; font-weight: 700; color: ${t.text}; }
    .ap-tpl-cat { font-size: 10.5px; color: ${t.textMuted}; margin-top: 2px; }
    .ap-tpl-del { opacity: 0; transition: opacity 0.15s; }

    /* ── EMPTY ───────────────────────────────────────── */
    .ap-empty {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 44px;
    }
    .ap-empty-icon {
      width: 44px; height: 44px; border-radius: 11px;
      background: ${dark ? '#1e2535' : '#f4f7fb'};
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    .ap-empty-text { font-size: 12.5px; color: ${t.textMuted}; font-weight: 500; }

    /* ── LOADING / ERROR ─────────────────────────────── */
    .ap-full {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
      background: ${t.bg};
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .ap-spin {
      width: 38px; height: 38px;
      border: 3px solid ${dark ? '#1e2535' : '#e5e7eb'};
      border-top-color: #3b82f6; border-radius: 50%;
      animation: aps 0.75s linear infinite; margin: 0 auto 12px;
    }
    @keyframes aps { to { transform: rotate(360deg); } }
    .ap-loading-text { font-size: 13px; color: ${t.textSec}; font-weight: 500; text-align: center; }

    .ap-err-card {
      background: ${t.card};
      border-radius: 16px; padding: 40px; text-align: center;
      max-width: 360px; width: 90%;
      border: 1px solid ${dark ? 'rgba(239,68,68,0.2)' : '#fee2e2'};
      box-shadow: 0 4px 20px rgba(0,0,0,${dark ? '0.3' : '0.06'});
    }
    .ap-err-icon {
      width: 48px; height: 48px; border-radius: 13px;
      background: ${dark ? 'rgba(239,68,68,0.1)' : '#fef2f2'};
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; color: #ef4444;
    }
    .ap-err-title { font-size: 19px; font-weight: 800; color: ${t.text}; margin-bottom: 7px; }
    .ap-err-msg { font-size: 12.5px; color: ${t.textSec}; margin-bottom: 22px; }
    .ap-go-home {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 20px; background: #3b82f6; color: #fff;
      border: none; border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700; font-size: 13px; cursor: pointer;
    }
    .ap-go-home:hover { background: #2563eb; }

    /* ── SCROLLBAR ───────────────────────────────────── */
    .ap-content::-webkit-scrollbar { width: 6px; }
    .ap-content::-webkit-scrollbar-track { background: transparent; }
    .ap-content::-webkit-scrollbar-thumb {
      background: ${dark ? '#2a3045' : '#dde1ea'};
      border-radius: 3px;
    }
  `;

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Error ─────────────────────────────────────────────────────────────────
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

  // ── Config ────────────────────────────────────────────────────────────────
  const navItems = [
    { key: 'users'        as const, label: 'Users',        icon: Users,       count: data.users.length },
    { key: 'plans'        as const, label: 'Plans',        icon: CreditCard,  count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp,  count: data.transactions.length },
    { key: 'projects'     as const, label: 'Projects',     icon: FolderOpen,  count: data.projects.length },
    { key: 'inbox'        as const, label: 'Inbox',        icon: Mail,        count: notifications.length },
    { key: 'templates'    as const, label: 'Templates',    icon: Layers,      count: templates.length },
  ];

  const pageTitles: Record<string, string> = {
    users: 'Users', plans: 'Plans', transactions: 'Transactions',
    projects: 'Projects', inbox: 'Inbox', templates: 'Templates',
  };

  const chartData = [
    { month: 'Jan', earning: 120, expense: 80  }, { month: 'Feb', earning: 180, expense: 100 },
    { month: 'Mar', earning: 160, expense: 140 }, { month: 'Apr', earning: 200, expense: 90  },
    { month: 'May', earning: 140, expense: 120 }, { month: 'Jun', earning: 280, expense: 160 },
    { month: 'Jul', earning: 220, expense: 100 }, { month: 'Aug', earning: 160, expense: 130 },
    { month: 'Sep', earning: 190, expense: 110 }, { month: 'Oct', earning: 170, expense: 95  },
    { month: 'Nov', earning: 240, expense: 140 }, { month: 'Dec', earning: 280, expense: 120 },
  ];

  const isDataTab = ['users', 'plans', 'transactions', 'projects'].includes(tab);

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className="ap-sidebar">
          <div className="ap-logo">
            <div className="ap-logo-icon">V</div>
            <span className="ap-logo-name">Vivora</span>
          </div>

          <nav className="ap-nav">
            <p className="ap-nav-section">Main Menu</p>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <div
                  key={item.key}
                  className={`ap-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setTab(item.key)}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  <span className="ap-nav-count">{item.count}</span>
                </div>
              );
            })}
          </nav>

          <div className="ap-sidebar-footer">
            <button className="ap-logout" onClick={() => navigate('/')}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div className="ap-main">

          {/* Topbar */}
          <header className="ap-topbar">
            <h1 className="ap-page-title">{pageTitles[tab]}</h1>
            <div className="ap-topbar-right">
              <div className="ap-search">
                <Search size={13} color={t.textMuted} />
                <input placeholder="Search..." />
              </div>
              <button className="ap-icon-btn"><Bell size={14} /></button>
              <button className="ap-icon-btn"><Settings size={14} /></button>
              <button
                className="ap-icon-btn ap-theme-btn"
                onClick={() => setDark(d => !d)}
                title={dark ? 'Light mode' : 'Dark mode'}
              >
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <div className="ap-avatar">A</div>
            </div>
          </header>

          {/* Content */}
          <div className="ap-content">

            {/* ── Stats + Chart (data tabs only) ── */}
            {isDataTab && (
              <>
                <div className="ap-stats">
                  {[
                    { label: 'Customers',    num: data.users.length,        sub: 'Total registered',  pct: 75, color: '#3b82f6' },
                    { label: 'Active Plans', num: data.plans.length,        sub: 'Subscriptions',     pct: 65, color: '#f59e0b' },
                    { label: 'Transactions', num: data.transactions.length, sub: 'All time',          pct: 35, color: '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} className="ap-stat">
                      <div>
                        <p className="ap-stat-label">{s.label}</p>
                        <p className="ap-stat-num">{s.num}</p>
                        <p className="ap-stat-sub">{s.sub}</p>
                      </div>
                      <div className="ap-stat-ring">
                        <CircularProgress value={s.pct} color={s.color} size={62} dark={dark} />
                        <span className="ap-ring-pct">{s.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ap-chart">
                  <div className="ap-chart-hdr">
                    <span className="ap-chart-title">Revenue Report</span>
                    <div className="ap-legend">
                      <div className="ap-legend-item">
                        <div className="ap-legend-dot" style={{ background: '#f59e0b' }} />
                        Earning
                      </div>
                      <div className="ap-legend-item">
                        <div className="ap-legend-dot" style={{ background: '#3b82f6' }} />
                        Expenses
                      </div>
                    </div>
                  </div>
                  <BarChart data={chartData} dark={dark} />
                </div>
              </>
            )}

            {/* ── INBOX ── */}
            {tab === 'inbox' && (
              <div className="ap-form-layout">
                <div className="ap-form-card">
                  <div className="ap-form-hdr">
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
                    <Send size={12} />
                    {sendingNotif ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>

                <div className="ap-notif-card">
                  <div className="ap-table-hdr">
                    <span className="ap-table-title">Sent Notifications</span>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="ap-empty">
                      <div className="ap-empty-icon"><Mail size={18} color={t.textMuted} /></div>
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
                    <div className="ap-form-hdr">
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
                      <Plus size={12} />
                      {savingTpl ? 'Saving...' : 'Add Template'}
                    </button>
                  </div>
                  <div className="ap-form-card" style={{ alignSelf: 'start' }}>
                    <p style={{ fontSize: 13, color: t.textSec, lineHeight: 1.7 }}>
                      Templates help users quickly start with predefined prompts. Add a name, optional category and image, and the AI prompt that triggers when this template is selected.
                    </p>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="ap-table-card">
                    <div className="ap-empty">
                      <div className="ap-empty-icon"><Layers size={18} color={t.textMuted} /></div>
                      <p className="ap-empty-text">No templates yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="ap-tpl-grid">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="ap-tpl-card">
                        <div className="ap-tpl-thumb">
                          {tpl.image_url ? <img src={tpl.image_url} alt={tpl.name} /> : <Layers size={20} color={dark ? '#3b4a6b' : '#c4b5fd'} />}
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
                    <div className="ap-table-hdr">
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
                    <div className="ap-table-hdr">
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
                    <div className="ap-table-hdr">
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
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
                                {t.description || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === 'projects' && (
                  <>
                    <div className="ap-table-hdr">
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
                                  <Eye size={9} />
                                  {p.is_published ? 'Published' : 'Draft'}
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
