import React, { useEffect, useState } from 'react';
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
  FileText, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { AdminBlogEditor } from '@/components/admin/AdminBlogEditor';

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
  const [tab, setTab] = useState<'dashboard' | 'users' | 'plans' | 'transactions' | 'projects' | 'inbox' | 'templates' | 'blog'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      background: #0a0c10;
      color: #e6edf3;
      font-family: 'Geist', sans-serif;
      overflow: hidden;
    }

    /* SIDEBAR - dark */
    .vivora-sidebar {
      width: 260px; background: #010409;
      border-right: 1px solid #21262d;
      display: flex; flex-direction: column;
      height: 100vh; overflow-y: auto;
      flex-shrink: 0;
      transition: width 0.25s ease;
    }
    .vivora-sidebar.collapsed { width: 68px; }
    .vivora-sidebar.collapsed .vivora-nav-label,
    .vivora-sidebar.collapsed .vivora-nav-count,
    .vivora-sidebar.collapsed .vivora-sidebar-logo-text { display: none; }

    .vivora-sidebar-logo {
      padding: 20px; display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 700;
      color: #7dd3fc; letter-spacing: -0.5px;
    }

    .vivora-sidebar-toggle {
      padding: 8px; margin: 0 12px 8px; border-radius: 10px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
      color: #78909c; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .vivora-sidebar-toggle:hover { background: rgba(255,255,255,0.08); color: #e0e0e0; }

    .vivora-nav { flex: 1; padding: 8px 10px; }

    .vivora-nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      cursor: pointer; font-size: 13px; font-weight: 500;
      color: #78909c; margin-bottom: 2px;
      transition: all 0.15s ease;
    }
    .vivora-nav-item:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; }
    .vivora-nav-item.active {
      background: rgba(56,139,253,0.12); color: #58a6ff;
    }
    .vivora-nav-item.active .vivora-nav-count {
      color: #58a6ff; background: rgba(56,139,253,0.15);
    }

    .vivora-nav-count {
      margin-left: auto; font-size: 10px;
      font-weight: 600; color: #546e7a;
      background: rgba(255,255,255,0.06); padding: 2px 7px;
      border-radius: 6px; font-family: 'Geist Mono', monospace;
    }

    .vivora-sidebar-footer { padding: 12px 10px; border-top: 1px solid rgba(255,255,255,0.06); }

    .vivora-logout {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; font-weight: 500; color: #ef5350;
      background: none; border: none; width: 100%;
      cursor: pointer; font-family: 'Geist', sans-serif;
      transition: background 0.15s;
    }
    .vivora-logout:hover { background: rgba(239,83,80,0.08); }

    /* MAIN */
    .vivora-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .vivora-main-inner {
      flex: 1; overflow-y: auto; padding: 24px 28px;
      background: #0d1117;
      border-radius: 20px 0 0 0;
      margin: 0;
    }

    /* TOPBAR */
    .vivora-topbar {
      padding: 16px 28px;
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-shrink: 0; gap: 16px;
      background: #010409;
      border-bottom: 1px solid #21262d;
    }
    .vivora-welcome { font-size: 12px; color: #546e7a; margin-bottom: 2px; }
    .vivora-page-title { font-size: 22px; font-weight: 700; color: #e8eaed; letter-spacing: -0.5px; }

    .vivora-topbar-actions { display: flex; align-items: center; gap: 8px; }

    .vivora-topbar-search {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 8px 12px; width: 220px;
      transition: border-color 0.2s;
    }
    .vivora-topbar-search:focus-within { border-color: #7dd3fc; }
    .vivora-topbar-search input {
      background: none; border: none; outline: none;
      color: #e0e0e0; font-size: 12px; width: 100%;
      font-family: 'Geist', sans-serif;
    }
    .vivora-topbar-search input::placeholder { color: #546e7a; }

    .vivora-icon-btn {
      width: 36px; height: 36px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #78909c;
      transition: all 0.15s ease;
    }
    .vivora-icon-btn:hover { background: rgba(255,255,255,0.08); color: #e0e0e0; }

    .vivora-profile-row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 10px 4px 4px;
      border-radius: 10px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .vivora-user-avatar {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #7dd3fc, #38bdf8);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #0f1117;
    }
    .vivora-user-name { font-size: 12px; font-weight: 600; color: #e0e0e0; }
    .vivora-user-email { font-size: 10px; color: #546e7a; }

    /* STAT CARDS */
    .vivora-stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .vivora-stat-card {
      background: #161b22; border-radius: 14px;
      padding: 18px; border: 1px solid #21262d;
      display: flex; align-items: flex-start; gap: 12px;
      transition: border-color 0.2s;
    }
    .vivora-stat-card:hover { border-color: #30363d; }
    .vivora-stat-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .vivora-stat-icon.purple { background: rgba(130,80,223,0.15); color: #a371f7; }
    .vivora-stat-icon.pink { background: rgba(219,55,99,0.15); color: '#db3763'; }
    .vivora-stat-icon.orange { background: rgba(210,153,34,0.15); color: #d29922; }
    .vivora-stat-icon.teal { background: rgba(56,139,253,0.15); color: #58a6ff; }
    .vivora-stat-label { font-size: 10px; font-weight: 600; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .vivora-stat-value { font-size: 20px; font-weight: 700; color: #e8eaed; }

    /* DASH GRID */
    .vivora-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .vivora-dash-card {
      background: #161b22; border-radius: 14px;
      padding: 20px; border: 1px solid #21262d;
    }
    .vivora-dash-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .vivora-dash-card-title { font-size: 14px; font-weight: 600; color: #e0e0e0; }
    .vivora-dash-card-link { font-size: 11px; color: #7dd3fc; font-weight: 500; cursor: pointer; }
    .vivora-dash-card-link:hover { text-decoration: underline; }

    .vivora-reminder-card {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
      border-radius: 14px; padding: 22px;
      color: #e0e0e0; display: flex; align-items: center; justify-content: space-between;
      border: 1px solid rgba(125,211,252,0.15);
    }
    .vivora-reminder-label { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
    .vivora-reminder-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .vivora-reminder-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px;
      background: #7dd3fc; color: #0f1117; font-size: 12px; font-weight: 600;
      border: none; cursor: pointer; font-family: 'Geist', sans-serif;
      transition: transform 0.15s;
    }
    .vivora-reminder-btn:hover { transform: translateY(-1px); }

    /* FILTER BAR */
    .vivora-filter-bar {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 16px; padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .vivora-tab-btn {
      padding: 7px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 500;
      background: none; border: 1px solid transparent;
      color: #78909c; cursor: pointer;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }
    .vivora-tab-btn:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; }
    .vivora-tab-btn.active { background: rgba(56,139,253,0.12); color: #58a6ff; border-color: rgba(56,139,253,0.3); }

    .vivora-dropdown-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 500;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #78909c; cursor: pointer; font-family: 'Geist', sans-serif;
    }
    .vivora-dropdown-btn:hover { background: rgba(255,255,255,0.06); color: #e0e0e0; }

    /* EMPTY */
    .vivora-empty {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 60px 20px; text-align: center;
    }
    .vivora-empty-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(125,211,252,0.1); display: flex;
      align-items: center; justify-content: center;
      margin-bottom: 14px; color: #7dd3fc;
    }
    .vivora-empty-title { font-size: 15px; font-weight: 600; color: #e0e0e0; margin-bottom: 6px; }
    .vivora-empty-text { font-size: 12px; color: #546e7a; max-width: 320px; line-height: 1.5; margin-bottom: 16px; }

    .vivora-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px;
      font-size: 12px; font-weight: 600;
      cursor: pointer; border: none;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }
    .vivora-btn-primary { background: #388bfd; color: #fff; }
    .vivora-btn-primary:hover:not(:disabled) { background: #58a6ff; }
    .vivora-btn-secondary { background: rgba(255,255,255,0.06); color: #e0e0e0; border: 1px solid rgba(255,255,255,0.1); }
    .vivora-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
    .vivora-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* TABLE */
    .vivora-table-card {
      background: #161b22; border: 1px solid #21262d;
      border-radius: 14px; overflow: hidden;
    }
    .vivora-table { width: 100%; border-collapse: collapse; }
    .vivora-table thead tr { border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    .vivora-table th {
      padding: 12px 16px; text-align: left;
      font-size: 10px; font-weight: 600;
      color: #546e7a; letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .vivora-table td {
      padding: 12px 16px; font-size: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      color: #90a4ae;
    }
    .vivora-table tbody tr:last-child td { border-bottom: none; }
    .vivora-table tbody tr { transition: background 0.12s; }
    .vivora-table tbody tr:hover { background: rgba(255,255,255,0.03); }

    .td-strong { font-weight: 600; color: #e0e0e0; }
    .td-muted { color: #546e7a; font-size: 11px; }
    .td-mono { font-family: 'Geist Mono', monospace; font-size: 11px; color: #7dd3fc; }

    .vivora-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 6px;
      font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .badge-blue { background: rgba(125,211,252,0.12); color: #7dd3fc; }
    .badge-green { background: rgba(74,222,128,0.12); color: #4ade80; }
    .badge-gray { background: rgba(255,255,255,0.06); color: #78909c; }

    /* FORMS */
    .vivora-form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .vivora-form-card {
      background: #161b22; border: 1px solid #21262d;
      border-radius: 14px; padding: 20px;
    }
    .vivora-form-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .vivora-form-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(125,211,252,0.1); display: flex;
      align-items: center; justify-content: center; color: #7dd3fc;
    }
    .vivora-form-title { font-size: 14px; font-weight: 600; color: #e0e0e0; }

    .vivora-field { margin-bottom: 12px; }
    .vivora-field-label {
      display: block; font-size: 10px; font-weight: 600;
      color: #546e7a; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 5px;
    }
    .vivora-field-input {
      width: 100%; padding: 9px 12px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; font-size: 12px;
      color: #e0e0e0; outline: none;
      font-family: 'Geist', sans-serif;
      transition: all 0.15s ease;
    }
    .vivora-field-input:focus { border-color: #7dd3fc; background: rgba(255,255,255,0.06); }
    .vivora-field-input::placeholder { color: #455a64; }
    .vivora-textarea { resize: none; min-height: 80px; font-family: 'Geist', sans-serif; }

    /* NOTIF LIST */
    .vivora-notif-list { display: flex; flex-direction: column; gap: 8px; }
    .vivora-notif-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; background: #1e2030;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      transition: all 0.15s;
    }
    .vivora-notif-item:hover { border-color: rgba(255,255,255,0.1); }
    .vivora-notif-title { font-size: 12px; font-weight: 600; color: #e0e0e0; }
    .vivora-notif-date { font-size: 10px; color: #546e7a; margin-top: 2px; }

    .vivora-del-btn {
      width: 30px; height: 30px; background: rgba(239,83,80,0.08);
      border: 1px solid rgba(239,83,80,0.15); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #ef5350;
      transition: all 0.15s;
    }
    .vivora-del-btn:hover { background: rgba(239,83,80,0.15); border-color: #ef5350; }

    /* TEMPLATES GRID */
    .vivora-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .vivora-tpl-card {
      background: #1e2030; border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px; overflow: hidden;
      transition: all 0.15s; cursor: default;
    }
    .vivora-tpl-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-1px); }
    .vivora-tpl-card:hover .vivora-tpl-del { opacity: 1; }
    .vivora-tpl-thumb {
      aspect-ratio: 16/9; background: rgba(255,255,255,0.03);
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .vivora-tpl-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .vivora-tpl-body { padding: 12px 14px; display: flex; align-items: flex-start; justify-content: space-between; }
    .vivora-tpl-name { font-size: 12px; font-weight: 600; color: #e0e0e0; }
    .vivora-tpl-cat { font-size: 10px; color: #546e7a; margin-top: 2px; }
    .vivora-tpl-del { opacity: 0; transition: opacity 0.15s; }

    /* LOADING / ERROR */
    .vivora-full {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #0f1117;
      font-family: 'Geist', sans-serif;
    }
    .vivora-spin {
      width: 32px; height: 32px;
      border: 2px solid rgba(125,211,252,0.2);
      border-top-color: #7dd3fc; border-radius: 50%;
      animation: vspin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes vspin { to { transform: rotate(360deg); } }
    .vivora-loading-text { font-size: 12px; color: #546e7a; text-align: center; }

    .vivora-err-card {
      background: #1e2030; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 40px; text-align: center;
      max-width: 400px; width: 90%;
    }
    .vivora-err-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(239,83,80,0.1); display: flex;
      align-items: center; justify-content: center;
      margin: 0 auto 14px; color: #ef5350;
    }
    .vivora-err-title { font-size: 17px; font-weight: 700; color: #e0e0e0; margin-bottom: 8px; }
    .vivora-err-msg { font-size: 12px; color: #78909c; margin-bottom: 20px; line-height: 1.6; }

    /* SCROLLBAR */
    .vivora-main-inner::-webkit-scrollbar { width: 6px; }
    .vivora-main-inner::-webkit-scrollbar-track { background: transparent; }
    .vivora-main-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    .vivora-sidebar::-webkit-scrollbar { width: 4px; }
    .vivora-sidebar::-webkit-scrollbar-track { background: transparent; }
    .vivora-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
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
    { key: 'dashboard'    as const, label: 'Dashboard',    icon: LayoutGrid,  count: 0 },
    { key: 'users'        as const, label: 'Users',        icon: Users,       count: data.users.length },
    { key: 'inbox'        as const, label: 'Inbox',        icon: MessageCircle, count: notifications.length },
    { key: 'blog'         as const, label: 'Blog',         icon: FileText,    count: 0 },
    { key: 'transactions' as const, label: 'Statistics',   icon: BarChart2,   count: data.transactions.length },
    { key: 'projects'     as const, label: 'Projects',     icon: FolderOpen,  count: data.projects.length },
    { key: 'plans'        as const, label: 'Plans',       icon: CreditCard,  count: data.plans.length },
    { key: 'templates'    as const, label: 'Templates',    icon: Layers,     count: templates.length },
  ];

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard', users: 'Users', plans: 'Plans', transactions: 'Statistics',
    projects: 'Projects', inbox: 'Inbox', templates: 'Templates', blog: 'Blog Manager',
  };

  const displayName = (data?.users?.find((u: any) => u.id === user?.id)?.display_name) || user?.email?.split('@')[0] || 'Admin';

  return (
    <>
      <style>{css}</style>
      <div className="vivora-root">

        {/* ═══════════════════════════════════════════════════════════════════
            SIDEBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <aside className={`vivora-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="vivora-sidebar-logo">
            <span>⚡</span>
            <span className="vivora-sidebar-logo-text">Vivora</span>
          </div>

          <button className="vivora-sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <nav className="vivora-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <div
                  key={item.key}
                  className={`vivora-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setTab(item.key)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  <span className="vivora-nav-label">{item.label}</span>
                  {item.count > 0 && <span className="vivora-nav-count">{item.count}</span>}
                </div>
              );
            })}
          </nav>

          <div className="vivora-sidebar-footer">
            <button className="vivora-logout" onClick={() => navigate('/')}>
              <LogOut size={16} /> <span className="vivora-nav-label">Logout</span>
            </button>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN AREA
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="vivora-main">

          {/* TOPBAR */}
          <header className="vivora-topbar">
            <div className="vivora-topbar-left">
              <div className="vivora-welcome">Welcome back, {displayName} 👋</div>
              <h1 className="vivora-page-title">{pageTitles[tab]}</h1>
            </div>
            <div className="vivora-topbar-actions">
              <div className="vivora-topbar-search">
                <Search size={16} color="#78909c" />
                <input placeholder="Search..." />
              </div>
              <button className="vivora-icon-btn"><Bell size={18} /></button>
              <div className="vivora-profile-row">
                <div className="vivora-user-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="vivora-user-info">
                  <div className="vivora-user-name">{displayName}</div>
                  <div className="vivora-user-email">{user?.email || 'admin@vivora.ai'}</div>
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="vivora-main-inner">

            {/* ══════════════════════════════════════════════════════════════
                DASHBOARD
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'dashboard' && (
              <>
                {/* Stat Cards */}
                <div className="vivora-stat-cards">
                  <div className="vivora-stat-card">
                    <div className="vivora-stat-icon purple">
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="vivora-stat-label">Total Users</div>
                      <div className="vivora-stat-value">{data.users.length}</div>
                    </div>
                  </div>
                  <div className="vivora-stat-card">
                    <div className="vivora-stat-icon pink">
                      <ShoppingCart size={22} />
                    </div>
                    <div>
                      <div className="vivora-stat-label">Total Projects</div>
                      <div className="vivora-stat-value">{data.projects.length}</div>
                    </div>
                  </div>
                  <div className="vivora-stat-card">
                    <div className="vivora-stat-icon orange">
                      <Coins size={22} />
                    </div>
                    <div>
                      <div className="vivora-stat-label">Total Transactions</div>
                      <div className="vivora-stat-value">{data.transactions.length}</div>
                    </div>
                  </div>
                  <div className="vivora-stat-card">
                    <div className="vivora-stat-icon teal">
                      <Star size={22} />
                    </div>
                    <div>
                      <div className="vivora-stat-label">Active Plans</div>
                      <div className="vivora-stat-value">{data.plans.length}</div>
                    </div>
                  </div>
                </div>

                {/* Main Cards Grid */}
                <div className="vivora-dash-grid">
                  <div className="vivora-dash-card">
                    <div className="vivora-dash-card-header">
                      <div className="vivora-dash-card-title">Recent Users</div>
                      <div className="vivora-dash-card-link" onClick={() => setTab('users')}>View all</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#78909c' }}>
                      {data.users.slice(0, 5).map((u: any) => (
                        <div key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontWeight: 600, color: '#e0e0e0' }}>{u.email || '—'}</div>
                          <div style={{ fontSize: '11px', color: '#78909c', marginTop: '2px' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="vivora-dash-card">
                    <div className="vivora-dash-card-header">
                      <div className="vivora-dash-card-title">Recent Projects</div>
                      <div className="vivora-dash-card-link" onClick={() => setTab('projects')}>View all</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#78909c' }}>
                      {data.projects.slice(0, 5).map((p: any) => (
                        <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontWeight: 600, color: '#e0e0e0' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#78909c', marginTop: '2px' }}>
                            {p.project_type} • {p.is_published ? 'Published' : 'Draft'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reminder Card */}
                <div className="vivora-reminder-card">
                  <div>
                    <div className="vivora-reminder-label">DON'T FORGET</div>
                    <div className="vivora-reminder-title">Review pending notifications</div>
                    <button className="vivora-reminder-btn" onClick={() => setTab('inbox')}>
                      Go to Inbox <ChevronRight size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>📬</div>
                </div>
              </>
            )}

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
                BLOG
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'blog' && <AdminBlogEditor />}

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
