import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, CreditCard, FolderOpen, AlertTriangle, Loader2 } from 'lucide-react';

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
  const [tab, setTab] = useState<'users' | 'plans' | 'transactions' | 'projects'>('users');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-data');
        if (fnError) throw new Error(fnError.message);
        if (result?.error) throw new Error(result.error);
        setData(result);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
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
    { key: 'transactions' as const, label: 'Transactions', icon: CreditCard, count: data.transactions.length },
    { key: 'projects' as const, label: 'Projects', icon: FolderOpen, count: data.projects.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {tabs.map(t => (
            <div key={t.key} className="bg-card border border-border rounded-xl p-4 text-center">
              <t.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold text-foreground">{t.count}</div>
              <div className="text-sm text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Display Name</th>
                    <th className="text-left p-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3">{u.email || '—'}</td>
                      <td className="p-3">{u.display_name || '—'}</td>
                      <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'plans' && (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">User ID</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Daily Credits</th>
                    <th className="text-left p-3 font-medium">Used Today</th>
                    <th className="text-left p-3 font-medium">Monthly</th>
                    <th className="text-left p-3 font-medium">Total Used</th>
                    <th className="text-left p-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{p.user_id?.slice(0, 8)}...</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase">{p.plan}</span></td>
                      <td className="p-3">{p.daily_credits}</td>
                      <td className="p-3">{p.credits_used_today}</td>
                      <td className="p-3">{p.monthly_credits}</td>
                      <td className="p-3">{p.total_credits_used}</td>
                      <td className="p-3">{new Date(p.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'transactions' && (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">User ID</th>
                    <th className="text-left p-3 font-medium">Credits</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Model</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map(t => (
                    <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{t.user_id?.slice(0, 8)}...</td>
                      <td className="p-3">{t.credits_used}</td>
                      <td className="p-3">{t.work_type || '—'}</td>
                      <td className="p-3 text-xs">{t.model_used || '—'}</td>
                      <td className="p-3 text-xs max-w-[200px] truncate">{t.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'projects' && (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">User ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Published</th>
                    <th className="text-left p-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 font-mono text-xs">{p.user_id?.slice(0, 8)}...</td>
                      <td className="p-3">{p.project_type}</td>
                      <td className="p-3">{p.is_published ? '✅' : '❌'}</td>
                      <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
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
