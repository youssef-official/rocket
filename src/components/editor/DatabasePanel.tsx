import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DatabasePanelProps {
  projectId: string | null;
  onSendMessage: (content: string, isChatOnly?: boolean) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ projectId, onSendMessage }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  // Load existing credentials if any
  useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('supabase_url, supabase_anon_key')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.supabase_url) {
          setSupabaseUrl(data.supabase_url);
          setAnonKey(data.supabase_anon_key || '');
          setIsConnected(true);
        }
      });
  }, [projectId]);

  const handleConnect = async () => {
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      setError('Please fill in both fields');
      return;
    }
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      setError('Invalid Supabase URL. It should look like: https://xxxx.supabase.co');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Save credentials to project in DB
      if (projectId) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            supabase_url: supabaseUrl.trim(),
            supabase_anon_key: anonKey.trim(),
          })
          .eq('id', projectId);

        if (updateError) throw updateError;
      }

      setIsConnected(true);

      // Send message to AI to update the project
      const msg = `Db Connected
Supabase URL: ${supabaseUrl.trim()}
Supabase Anon Key: ${anonKey.trim()}

The user has connected their Supabase database. Please:
1. Create/update src/lib/supabase.ts with the correct client using these credentials
2. Update existing data operations in the project to use Supabase instead of local state
3. Generate needed SQL migrations in migrations/001-init.sql
4. If you need Edge Functions, create them in supabase/functions/{name}/index.ts and tell the user to deploy them
5. Tell the user which migration files to run in their Supabase SQL Editor`;

      onSendMessage(msg, false);
    } catch (e: any) {
      setError(e.message || 'Failed to save credentials');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!projectId) return;
    await supabase
      .from('projects')
      .update({ supabase_url: null, supabase_anon_key: null })
      .eq('id', projectId);
    setSupabaseUrl('');
    setAnonKey('');
    setIsConnected(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Connect Supabase Database</h2>
            <p className="text-sm text-muted-foreground">Add a real backend to your generated project</p>
          </div>
        </div>

        {isConnected && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Database connected! AI has been notified and will update your project files.</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your Supabase project to add persistent storage, authentication, and real-time features. Credentials are saved securely to this project.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Supabase Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={e => { setSupabaseUrl(e.target.value); setError(''); }}
                placeholder="https://xxxx.supabase.co"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Anon (Public) Key</label>
              <input
                type="text"
                value={anonKey}
                onChange={e => { setAnonKey(e.target.value); setError(''); }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {isConnected ? 'Reconnect Database' : 'Connect Database'}
            </button>
            {isConnected && (
              <button
                className="px-4 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <a
              href="/supabase-connect"
              target="_blank"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>How to get your Supabase URL & Anon Key</span>
            </a>
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold mb-3">What happens after connecting?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> AI updates your files to use the real Supabase client</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> SQL migration files created in <code className="text-green-500 bg-green-500/10 px-1 rounded">migrations/001-init.sql</code></li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Run migrations in your Supabase SQL Editor</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Edge functions appear in <code className="text-green-500 bg-green-500/10 px-1 rounded">supabase/functions/</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
