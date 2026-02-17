import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import {
  Users, CreditCard, FolderOpen, AlertTriangle, Loader2,
  Mail, Layers, Plus, Trash2, Send, TrendingUp,
  Sun, Moon, Search, Settings, Bell, Activity,
  ChevronRight, Zap, Database, Eye
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
      const checkCurrentSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) navigate('/login');
      };
      checkCurrentSession();
      return;
    }
    const fetchData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) { navigate('/login'); return; }
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
        if (fnError) {
          const errorMsg = fnError.message || '';
          if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
            setError('Unauthorized - Please log in again');
            return;
          }
          throw new Error(errorMsg);
        }
        if (result?.error) { setError(result.error); return; }
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

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

    .admin-root {
      min-height: 100vh;
      background: #040408;
      color: #e2e8f0;
      font-family: 'Syne', sans-serif;
      overflow-x: hidden;
      position: relative;
    }

    .admin-root::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,40,255,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 80%, rgba(0,212,255,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,30,120,0.06) 0%, transparent 60%);
      pointer-events: none;
      z-index: 0;
    }

    .grid-overlay {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      z-index: 0;
      pointer-events: none;
    }

    .content-layer {
      position: relative;
      z-index: 1;
    }

    /* Header */
    .admin-header {
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(4,4,8,0.85);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 32px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-badge {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #6328ff, #00d4ff);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      color: white;
      letter-spacing: -1px;
      box-shadow: 0 0 30px rgba(99,40,255,0.5);
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      background: linear-gradient(90deg, #fff 40%, #6328ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .logo-sub {
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 2px;
      text-transform: uppercase;
      display: block;
      margin-top: 1px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(255,255,255,0.4);
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.9);
      border-color: rgba(255,255,255,0.15);
    }

    .theme-btn {
      background: rgba(99,40,255,0.15);
      border-color: rgba(99,40,255,0.3);
      color: #a78bfa;
    }

    .theme-btn:hover {
      background: rgba(99,40,255,0.25);
      border-color: rgba(99,40,255,0.5);
      color: #c4b5fd;
    }

    /* Main layout */
    .main-layout {
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px;
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 24px;
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 94px;
      height: fit-content;
    }

    .sidebar-section {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 12px;
      backdrop-filter: blur(10px);
    }

    .sidebar-label {
      font-size: 9px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
      font-family: 'JetBrains Mono', monospace;
      padding: 6px 8px 10px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      font-weight: 500;
      position: relative;
      border: 1px solid transparent;
      margin-bottom: 2px;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.8);
    }

    .nav-item.active {
      background: linear-gradient(135deg, rgba(99,40,255,0.2), rgba(0,212,255,0.08));
      border-color: rgba(99,40,255,0.25);
      color: #fff;
    }

    .nav-item.active .nav-icon {
      color: #a78bfa;
    }

    .nav-badge {
      margin-left: auto;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.4);
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .nav-item.active .nav-badge {
      background: rgba(99,40,255,0.3);
      color: #c4b5fd;
    }

    /* Stats row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 22px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      cursor: default;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .stat-card:hover {
      border-color: rgba(255,255,255,0.12);
      transform: translateY(-2px);
    }

    .stat-card:hover::before { opacity: 1; }

    .stat-card-0::before { background: radial-gradient(ellipse at top left, rgba(99,40,255,0.12), transparent 70%); }
    .stat-card-1::before { background: radial-gradient(ellipse at top left, rgba(0,212,255,0.1), transparent 70%); }
    .stat-card-2::before { background: radial-gradient(ellipse at top left, rgba(0,255,163,0.1), transparent 70%); }
    .stat-card-3::before { background: radial-gradient(ellipse at top left, rgba(255,100,30,0.1), transparent 70%); }

    .stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .stat-chip-0 { background: rgba(99,40,255,0.15); color: #a78bfa; border: 1px solid rgba(99,40,255,0.25); }
    .stat-chip-1 { background: rgba(0,212,255,0.12); color: #67e8f9; border: 1px solid rgba(0,212,255,0.2); }
    .stat-chip-2 { background: rgba(0,255,163,0.1); color: #6ee7b7; border: 1px solid rgba(0,255,163,0.2); }
    .stat-chip-3 { background: rgba(255,100,30,0.1); color: #fb923c; border: 1px solid rgba(255,100,30,0.2); }

    .stat-num {
      font-size: 42px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -2px;
      color: #fff;
    }

    .stat-label {
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      margin-top: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-accent-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
    }

    .stat-accent-0 { background: linear-gradient(90deg, #6328ff, transparent); }
    .stat-accent-1 { background: linear-gradient(90deg, #00d4ff, transparent); }
    .stat-accent-2 { background: linear-gradient(90deg, #00ffa3, transparent); }
    .stat-accent-3 { background: linear-gradient(90deg, #ff641e, transparent); }

    /* Content panel */
    .content-panel {
      background: rgba(255,255,255,0.015);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.02);
    }

    .panel-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      font-family: 'JetBrains Mono', monospace;
    }

    .panel-count {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #6328ff;
      background: rgba(99,40,255,0.12);
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(99,40,255,0.2);
    }

    /* Table styles */
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead tr {
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .data-table th {
      padding: 14px 20px;
      text-align: left;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
    }

    .data-table td {
      padding: 14px 20px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }

    .data-table tbody tr {
      transition: background 0.15s;
    }

    .data-table tbody tr:hover {
      background: rgba(255,255,255,0.03);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .cell-primary {
      color: rgba(255,255,255,0.9);
      font-weight: 500;
    }

    .cell-secondary {
      color: rgba(255,255,255,0.45);
    }

    .cell-mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }

    .plan-tag {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: rgba(99,40,255,0.15);
      color: #a78bfa;
      border: 1px solid rgba(99,40,255,0.25);
    }

    .published-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }

    .published-yes {
      background: rgba(0,255,163,0.1);
      color: #34d399;
      border: 1px solid rgba(0,255,163,0.2);
    }

    .published-no {
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.3);
      border: 1px solid rgba(255,255,255,0.08);
    }

    /* Inbox / Templates forms */
    .form-section {
      padding: 28px;
    }

    .form-card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 28px;
    }

    .form-heading {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .form-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-icon-blue { background: rgba(99,40,255,0.2); color: #a78bfa; }
    .form-icon-cyan { background: rgba(0,212,255,0.15); color: #67e8f9; }

    .form-title {
      font-size: 16px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      letter-spacing: -0.3px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-grid-full { grid-column: 1 / -1; }

    .field-label {
      display: block;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 8px;
    }

    .field-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: rgba(255,255,255,0.85);
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .field-input::placeholder { color: rgba(255,255,255,0.2); }

    .field-input:focus {
      background: rgba(255,255,255,0.06);
      border-color: rgba(99,40,255,0.5);
      box-shadow: 0 0 0 3px rgba(99,40,255,0.1);
    }

    .field-textarea {
      resize: none;
      min-height: 100px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      border-radius: 10px;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      margin-top: 20px;
    }

    .btn-purple {
      background: linear-gradient(135deg, #6328ff, #8b5cf6);
      color: white;
      box-shadow: 0 4px 24px rgba(99,40,255,0.35);
    }

    .btn-purple:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 30px rgba(99,40,255,0.5);
    }

    .btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Notification items */
    .notif-list { display: flex; flex-direction: column; gap: 10px; }

    .notif-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      transition: all 0.2s;
    }

    .notif-item:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.08);
    }

    .notif-title { font-weight: 600; font-size: 14px; color: rgba(255,255,255,0.85); }
    .notif-date { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }

    .delete-btn {
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid rgba(255,80,80,0.15);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(255,80,80,0.5);
      transition: all 0.2s;
    }

    .delete-btn:hover {
      background: rgba(255,80,80,0.1);
      border-color: rgba(255,80,80,0.4);
      color: #f87171;
    }

    .section-label {
      font-size: 9px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 14px;
    }

    /* Template grid */
    .tpl-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .tpl-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.25s;
      position: relative;
    }

    .tpl-card:hover {
      border-color: rgba(99,40,255,0.3);
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }

    .tpl-card:hover .delete-btn { opacity: 1; }

    .tpl-thumb {
      aspect-ratio: 16/9;
      background: linear-gradient(135deg, rgba(99,40,255,0.15), rgba(0,212,255,0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .tpl-thumb img { width: 100%; height: 100%; object-fit: cover; }

    .tpl-info {
      padding: 14px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .tpl-name { font-weight: 700; font-size: 13px; color: rgba(255,255,255,0.85); }
    .tpl-cat { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }

    .tpl-del { opacity: 0; transition: opacity 0.2s; }

    /* Empty states */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      color: rgba(255,255,255,0.2);
    }

    .empty-icon {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-text { font-size: 13px; font-family: 'JetBrains Mono', monospace; }

    /* Loading */
    .loading-screen {
      min-height: 100vh;
      background: #040408;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', sans-serif;
    }

    .loading-inner {
      text-align: center;
    }

    .loader-ring {
      width: 48px;
      height: 48px;
      border: 2px solid rgba(99,40,255,0.2);
      border-top-color: #6328ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-text {
      font-size: 13px;
      color: rgba(255,255,255,0.3);
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 2px;
    }

    /* Error */
    .error-screen {
      min-height: 100vh;
      background: #040408;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', sans-serif;
    }

    .error-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,80,80,0.2);
      border-radius: 20px;
      padding: 48px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    .error-icon-box {
      width: 56px;
      height: 56px;
      background: rgba(255,80,80,0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: #f87171;
    }

    .error-title { font-size: 22px; font-weight: 800; color: white; margin-bottom: 10px; }
    .error-msg { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }

    .btn-home {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #6328ff, #8b5cf6);
      color: white;
      border: none;
      border-radius: 10px;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-home:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,40,255,0.4); }
  `;

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-inner">
            <div className="loader-ring" />
            <p className="loading-text">INITIALIZING CONSOLE</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="error-screen">
          <div className="error-card">
            <div className="error-icon-box">
              <AlertTriangle size={24} />
            </div>
            <h2 className="error-title">Access Denied</h2>
            <p className="error-msg">{error}</p>
            <button className="btn-home" onClick={() => navigate('/')}>
              <ChevronRight size={14} /> Return Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  // ─── Tab config ──────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users, count: data.users.length },
    { key: 'plans' as const, label: 'Plans', icon: CreditCard, count: data.plans.length },
    { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
    { key: 'inbox' as const, label: 'Inbox', icon: Mail, count: notifications.length },
    { key: 'templates' as const, label: 'Templates', icon: Layers, count: templates.length },
  ];

  const chipLabels = ['MEMBERS', 'SUBSCRIPTIONS', 'REVENUE', 'PROJECTS'];
  const statIcons = [Users, CreditCard, TrendingUp, FolderOpen];
  const statCounts = [data.users.length, data.plans.length, data.transactions.length, data.projects.length];
  const statLabels = ['Total Users', 'Active Plans', 'Transactions', 'Total Projects'];

  const activeTab = tabs.find(t => t.key === tab)!;

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="admin-root">
        <div className="grid-overlay" />
        <div className="content-layer">

          {/* Header */}
          <header className="admin-header">
            <div className="header-inner">
              <div className="logo-area">
                <div className="logo-badge">V</div>
                <div>
                  <div className="logo-text">Vivora</div>
                  <span className="logo-sub">Admin Console</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="icon-btn"><Search size={15} /></button>
                <button className="icon-btn"><Bell size={15} /></button>
                <button className="icon-btn"><Settings size={15} /></button>
                <button
                  className="icon-btn theme-btn"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </div>
          </header>

          {/* Main */}
          <div className="main-layout">

            {/* Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-section">
                <p className="sidebar-label">Navigation</p>
                {tabs.map(t => {
                  const Icon = t.icon;
                  const isActive = tab === t.key;
                  return (
                    <div
                      key={t.key}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setTab(t.key)}
                    >
                      <Icon size={14} className="nav-icon" />
                      <span>{t.label}</span>
                      <span className="nav-badge">{t.count}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Right column */}
            <div>

              {/* Stats */}
              <div className="stats-row">
                {statCounts.map((count, i) => {
                  const Icon = statIcons[i];
                  return (
                    <div key={i} className={`stat-card stat-card-${i}`}>
                      <div className={`stat-chip stat-chip-${i}`}>
                        <Activity size={9} />
                        {chipLabels[i]}
                      </div>
                      <div className="stat-num">{count.toString().padStart(2, '0')}</div>
                      <div className="stat-label">{statLabels[i]}</div>
                      <div className={`stat-accent-line stat-accent-${i}`} />
                    </div>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="content-panel">
                <div className="panel-header">
                  <span className="panel-title">{activeTab.label}</span>
                  <span className="panel-count">{activeTab.count} records</span>
                </div>

                {/* ── Inbox ─────────────────────────────────────────────────── */}
                {tab === 'inbox' && (
                  <div className="form-section">
                    <div className="form-card">
                      <div className="form-heading">
                        <div className="form-icon-box form-icon-blue">
                          <Send size={16} />
                        </div>
                        <span className="form-title">Broadcast Notification</span>
                      </div>
                      <div className="form-grid">
                        <div className="form-grid-full">
                          <label className="field-label">Title *</label>
                          <input
                            value={inboxTitle}
                            onChange={e => setInboxTitle(e.target.value)}
                            className="field-input"
                            placeholder="Notification title..."
                          />
                        </div>
                        <div className="form-grid-full">
                          <label className="field-label">Message Body</label>
                          <textarea
                            value={inboxBody}
                            onChange={e => setInboxBody(e.target.value)}
                            className="field-input field-textarea"
                            placeholder="Write your message..."
                          />
                        </div>
                        <div>
                          <label className="field-label">Image URL</label>
                          <input
                            value={inboxImage}
                            onChange={e => setInboxImage(e.target.value)}
                            className="field-input"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="field-label">Link URL</label>
                          <input
                            value={inboxLink}
                            onChange={e => setInboxLink(e.target.value)}
                            className="field-input"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <button
                        className="btn-primary btn-purple"
                        onClick={handleSendNotification}
                        disabled={!inboxTitle.trim() || sendingNotif}
                      >
                        <Send size={13} />
                        {sendingNotif ? 'Sending...' : 'Send Notification'}
                      </button>
                    </div>

                    <p className="section-label">Recent Notifications</p>
                    {notifications.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon"><Mail size={22} /></div>
                        <p className="empty-text">no_notifications_yet</p>
                      </div>
                    ) : (
                      <div className="notif-list">
                        {notifications.map(n => (
                          <div key={n.id} className="notif-item">
                            <div>
                              <p className="notif-title">{n.title}</p>
                              <p className="notif-date">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            <button className="delete-btn" onClick={() => handleDeleteNotification(n.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Templates ─────────────────────────────────────────────── */}
                {tab === 'templates' && (
                  <div className="form-section">
                    <div className="form-card">
                      <div className="form-heading">
                        <div className="form-icon-box form-icon-cyan">
                          <Plus size={16} />
                        </div>
                        <span className="form-title">New Template</span>
                      </div>
                      <div className="form-grid">
                        <div>
                          <label className="field-label">Template Name *</label>
                          <input
                            value={tplName}
                            onChange={e => setTplName(e.target.value)}
                            className="field-input"
                            placeholder="Template name..."
                          />
                        </div>
                        <div>
                          <label className="field-label">Category</label>
                          <input
                            value={tplCategory}
                            onChange={e => setTplCategory(e.target.value)}
                            className="field-input"
                            placeholder="General, Marketing..."
                          />
                        </div>
                        <div className="form-grid-full">
                          <label className="field-label">Image URL</label>
                          <input
                            value={tplImage}
                            onChange={e => setTplImage(e.target.value)}
                            className="field-input"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="form-grid-full">
                          <label className="field-label">Prompt *</label>
                          <textarea
                            value={tplPrompt}
                            onChange={e => setTplPrompt(e.target.value)}
                            className="field-input field-textarea"
                            placeholder="Enter the AI prompt for this template..."
                          />
                        </div>
                      </div>
                      <button
                        className="btn-primary btn-purple"
                        onClick={handleAddTemplate}
                        disabled={!tplName.trim() || !tplPrompt.trim() || savingTpl}
                      >
                        <Plus size={13} />
                        {savingTpl ? 'Saving...' : 'Add Template'}
                      </button>
                    </div>

                    {templates.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon"><Layers size={22} /></div>
                        <p className="empty-text">no_templates_yet</p>
                      </div>
                    ) : (
                      <div className="tpl-grid">
                        {templates.map(tpl => (
                          <div key={tpl.id} className="tpl-card">
                            <div className="tpl-thumb">
                              {tpl.image_url
                                ? <img src={tpl.image_url} alt={tpl.name} />
                                : <Layers size={24} color="rgba(255,255,255,0.2)" />
                              }
                            </div>
                            <div className="tpl-info">
                              <div>
                                <p className="tpl-name">{tpl.name}</p>
                                <p className="tpl-cat">{tpl.category}</p>
                              </div>
                              <button className="delete-btn tpl-del" onClick={() => handleDeleteTemplate(tpl.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Data Tables ───────────────────────────────────────────── */}
                <div style={{ overflowX: 'auto' }}>
                  {tab === 'users' && (
                    <table className="data-table">
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
                            <td className="cell-primary">{u.email || '—'}</td>
                            <td className="cell-secondary">{u.display_name || '—'}</td>
                            <td className="cell-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === 'plans' && (
                    <table className="data-table">
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
                            <td className="cell-mono">{p.user_id?.slice(0, 8)}…</td>
                            <td><span className="plan-tag">{p.plan}</span></td>
                            <td className="cell-primary">{p.daily_credits}</td>
                            <td className="cell-secondary">{p.credits_used_today}</td>
                            <td className="cell-primary">{p.monthly_credits}</td>
                            <td className="cell-secondary">{p.total_credits_used}</td>
                            <td className="cell-mono">{new Date(p.updated_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === 'transactions' && (
                    <table className="data-table">
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
                            <td className="cell-mono">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="cell-mono">{t.user_id?.slice(0, 8)}…</td>
                            <td className="cell-primary" style={{ fontWeight: 700 }}>{t.credits_used}</td>
                            <td className="cell-secondary">{t.work_type || '—'}</td>
                            <td className="cell-secondary" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
                              {t.description || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === 'projects' && (
                    <table className="data-table">
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
                            <td className="cell-primary">{p.name}</td>
                            <td className="cell-mono">{p.user_id?.slice(0, 8)}…</td>
                            <td className="cell-secondary">{p.project_type}</td>
                            <td>
                              <span className={`published-tag ${p.is_published ? 'published-yes' : 'published-no'}`}>
                                <Eye size={9} />
                                {p.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="cell-mono">{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
