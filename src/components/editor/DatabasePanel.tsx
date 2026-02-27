import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, Loader2, ExternalLink, LogIn, List, Plug, Play, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SB_CLIENT_ID = 'bb4087af-31a0-4921-8418-d1eb743291d9';

interface SupabaseProject {
  id: string;
  name: string;
  region: string;
}

interface DatabasePanelProps {
  projectId: string | null;
  onSendMessage: (content: string, isChatOnly?: boolean) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ projectId, onSendMessage }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sbProjects, setSbProjects] = useState<SupabaseProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedProjectRef, setConnectedProjectRef] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'auth' | 'select' | 'connected'>('auth');
  const [manualMode, setManualMode] = useState(false);
  const [manualProjectRef, setManualProjectRef] = useState('');

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Check if project already has supabase_url set
  useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('supabase_url, supabase_anon_key')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.supabase_url) {
          // Extract project ref from URL
          const match = data.supabase_url.match(/https:\/\/([^.]+)\.supabase\.co/);
          if (match) {
            setConnectedProjectRef(match[1]);
            setStep('connected');
          }
        }
      });
  }, [projectId]);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await supabase.functions.invoke('supabase-oauth', {
        body: { action: 'status' },
      });
      if (res.data?.connected) {
        setIsConnected(true);
        if (step === 'auth') setStep('select');
      }
    } catch (e) {
      // Not connected
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // Save current project ID so callback knows where to return
    if (projectId) {
      sessionStorage.setItem('sb_oauth_return_project', projectId);
    }

    const redirectUri = `${window.location.origin}/supabase-callback`;
    const authUrl = `https://api.supabase.com/v1/oauth/authorize?client_id=${SB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = authUrl;
  };

  const handleLoadProjects = async () => {
    setIsLoadingProjects(true);
    setError('');
    try {
      const res = await supabase.functions.invoke('supabase-oauth', {
        body: { action: 'list-projects' },
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      setSbProjects(res.data?.projects || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Auto-load projects when entering select step
  useEffect(() => {
    if (step === 'select' && isConnected && sbProjects.length === 0) {
      handleLoadProjects();
    }
  }, [step, isConnected]);

  const handleConnectProject = async () => {
    if (!selectedProject || !projectId) return;
    setIsConnecting(true);
    setError('');

    try {
      // Get project keys
      const res = await supabase.functions.invoke('supabase-oauth', {
        body: { action: 'get-keys', project_ref: selectedProject },
      });

      if (res.data?.error) {
        setError(res.data.error);
        return;
      }

      const { url, anon_key } = res.data;

      // Save to project record
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          supabase_url: url,
          supabase_anon_key: anon_key,
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setConnectedProjectRef(selectedProject);
      setStep('connected');

      // Send message to AI
      const msg = `Database Connected ✅
Supabase URL: ${url}
Supabase Anon Key: ${anon_key}
Project Ref: ${selectedProject}

The user connected their Supabase database via OAuth. Please:
1. Create/update src/lib/supabase.ts with createClient using these credentials
2. Generate SQL migrations in supabase/migrations/001-init.sql for any needed tables
3. Update data operations to use the real Supabase client
4. If Edge Functions are needed, create them in supabase/functions/{name}/index.ts
5. The migrations will be auto-executed on the connected project`;

      onSendMessage(msg, false);
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
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
    setConnectedProjectRef(null);
    setStep(isConnected ? 'select' : 'auth');
  };

  const handleDisconnectAccount = async () => {
    await supabase.functions.invoke('supabase-oauth', {
      body: { action: 'disconnect' },
    });
    setIsConnected(false);
    setSbProjects([]);
    setConnectedProjectRef(null);
    setStep('auth');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Connect Supabase Database</h2>
            <p className="text-sm text-muted-foreground">Link your Supabase project via OAuth</p>
          </div>
        </div>

        {/* Step: Auth */}
        {step === 'auth' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in with your Supabase account to connect your database. This uses secure OAuth — your credentials are never stored.
            </p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Supabase
            </button>
          </div>
        )}

        {/* Step: Select Project */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Supabase account connected! Select a project below.</span>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Your Supabase Projects</h3>
                <button
                  onClick={handleLoadProjects}
                  disabled={isLoadingProjects}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLoadingProjects ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
                </button>
              </div>

              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : sbProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No projects found. Try entering your Project ID manually below.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sbProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => { setSelectedProject(proj.id); setManualMode(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors text-sm ${
                        selectedProject === proj.id && !manualMode
                          ? 'border-green-500 bg-green-500/10 text-foreground'
                          : 'border-border hover:border-muted-foreground/30 text-foreground'
                      }`}
                    >
                      <Database className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{proj.name}</p>
                        <p className="text-xs text-muted-foreground">{proj.id} · {proj.region}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual Project ID Input */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setManualMode(!manualMode)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {manualMode ? 'Hide manual input' : 'Enter Project ID manually'}
                </button>
                {manualMode && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={manualProjectRef}
                      onChange={(e) => {
                        setManualProjectRef(e.target.value.trim());
                        if (e.target.value.trim()) setSelectedProject(e.target.value.trim());
                      }}
                      placeholder="e.g. abcdefghijklmnop"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-green-500/30 placeholder:text-muted-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Find your Project ID in your Supabase dashboard → Settings → General
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConnectProject}
                  disabled={!selectedProject || isConnecting}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                  Connect Project
                </button>
                <button
                  onClick={handleDisconnectAccount}
                  className="px-4 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Connected */}
        {step === 'connected' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Database connected! Project: <code className="font-mono bg-green-500/10 px-1 rounded">{connectedProjectRef}</code></span>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">What happens now?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> AI generates Supabase client with your project credentials</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> SQL migrations created in <code className="text-green-500 bg-green-500/10 px-1 rounded">supabase/migrations/</code></li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Migrations auto-executed on your connected project</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Edge Functions in <code className="text-green-500 bg-green-500/10 px-1 rounded">supabase/functions/</code></li>
              </ul>

              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
              >
                Disconnect Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
