import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UserIntegrations {
  id: string;
  user_id: string;
  vercel_token: string | null;
  vercel_username: string | null;
  vercel_connected: boolean;
  github_token: string | null;
  github_username: string | null;
  github_connected: boolean;
}

export function useIntegrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegrations | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    if (!user) {
      setIntegrations(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Start Vercel OAuth flow
  const startVercelOAuth = async () => {
    const redirectUri = `${window.location.origin}/oauth/vercel/callback`;
    sessionStorage.setItem('vercel_return_to', window.location.pathname);
    
    try {
      const { data, error } = await supabase.functions.invoke('vercel-oauth', {
        body: { action: 'get-auth-url', redirectUri }
      });

      if (error) throw error;
      if (data?.url) {
        sessionStorage.setItem('vercel_redirect_uri', redirectUri);
        // Store the state for PKCE flow
        if (data.state) {
          sessionStorage.setItem('vercel_oauth_state', data.state);
        }
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting Vercel OAuth:', error);
      toast({
        title: 'Error',
        description: 'Failed to start Vercel login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle OAuth callback
  const handleVercelCallback = async (code: string): Promise<boolean> => {
    if (!user) return false;

    const redirectUri = sessionStorage.getItem('vercel_redirect_uri') || `${window.location.origin}/oauth/vercel/callback`;
    const state = sessionStorage.getItem('vercel_oauth_state');

    try {
      const { data, error } = await supabase.functions.invoke('vercel-oauth', {
        body: { action: 'exchange-code', code, redirectUri, state }
      });

      if (error) throw error;

      if (data?.access_token) {
        const { error: dbError } = await supabase
          .from('user_integrations')
          .upsert({
            user_id: user.id,
            vercel_token: data.access_token,
            vercel_username: data.username,
            vercel_connected: true,
          }, { onConflict: 'user_id' });

        if (dbError) throw dbError;

        toast({
          title: 'Vercel Connected',
          description: `Connected as ${data.username}`,
        });

        sessionStorage.removeItem('vercel_redirect_uri');
        sessionStorage.removeItem('vercel_oauth_state');
        await fetchIntegrations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error exchanging Vercel code:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect Vercel account',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Legacy: save token directly (kept for backward compat)
  const saveVercelToken = async (token: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        toast({ title: 'Invalid Token', description: 'The Vercel token is invalid.', variant: 'destructive' });
        return false;
      }

      const userData = await response.json();
      const username = userData.user?.username || userData.user?.name;

      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          vercel_token: token,
          vercel_username: username,
          vercel_connected: true,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: 'Vercel Connected', description: `Connected as ${username}` });
      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error saving Vercel token:', error);
      toast({ title: 'Error', description: 'Failed to save Vercel token', variant: 'destructive' });
      return false;
    }
  };

  const disconnectVercel = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          vercel_token: null,
          vercel_username: null,
          vercel_connected: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Vercel Disconnected', description: 'Your Vercel account has been disconnected.' });
      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error disconnecting Vercel:', error);
      return false;
    }
  };

  // Start GitHub OAuth flow
  const startGitHubOAuth = async () => {
    const redirectUri = `${window.location.origin}/oauth/github/callback`;
    sessionStorage.setItem('github_return_to', window.location.pathname);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: 'get-auth-url', redirectUri }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting GitHub OAuth:', error);
      toast({ title: 'Error', description: 'Failed to start GitHub login.', variant: 'destructive' });
    }
  };

  // Handle GitHub OAuth callback
  const handleGitHubCallback = async (code: string, state: string): Promise<boolean> => {
    if (!user) return false;
    const redirectUri = `${window.location.origin}/oauth/github/callback`;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: 'exchange-code', code, state, redirectUri }),
      });
      const data = await response.json();
      
      if (data.token) {
        await supabase.from('user_integrations').upsert({
          user_id: user.id,
          github_token: data.token,
          github_username: data.username,
          github_connected: true,
        }, { onConflict: 'user_id' });
        
        toast({ title: 'GitHub Connected', description: `Connected as ${data.username}` });
        await fetchIntegrations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error exchanging GitHub code:', error);
      toast({ title: 'Error', description: 'Failed to connect GitHub', variant: 'destructive' });
      return false;
    }
  };

  // Push to GitHub
  const pushToGitHub = async (repoName: string, files: Record<string, { content: string }>, commitMessage?: string): Promise<{ repo_url: string; full_name: string } | null> => {
    if (!integrations?.github_token) return null;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          action: 'push',
          token: integrations.github_token,
          repoName,
          files,
          commitMessage: commitMessage || 'Update from Vivora X',
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Pushed to GitHub', description: `Code pushed to ${data.full_name}` });
        return { repo_url: data.repo_url, full_name: data.full_name };
      }
      throw new Error(data.error);
    } catch (error: any) {
      toast({ title: 'Push Failed', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const disconnectGitHub = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await supabase.from('user_integrations').update({
        github_token: null,
        github_username: null,
        github_connected: false,
      }).eq('user_id', user.id);
      toast({ title: 'GitHub Disconnected' });
      await fetchIntegrations();
      return true;
    } catch { return false; }
  };

  return {
    integrations,
    loading,
    saveVercelToken,
    startVercelOAuth,
    handleVercelCallback,
    disconnectVercel,
    startGitHubOAuth,
    handleGitHubCallback,
    pushToGitHub,
    disconnectGitHub,
    refetch: fetchIntegrations,
  };
}
