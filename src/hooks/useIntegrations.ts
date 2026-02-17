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
    // Save current location so we can redirect back after OAuth
    sessionStorage.setItem('vercel_return_to', window.location.pathname);
    
    try {
      const { data, error } = await supabase.functions.invoke('vercel-oauth', {
        body: { action: 'get-auth-url', redirectUri }
      });

      if (error) throw error;
      if (data?.url) {
        // Store redirect URI for callback
        sessionStorage.setItem('vercel_redirect_uri', redirectUri);
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

    try {
      const { data, error } = await supabase.functions.invoke('vercel-oauth', {
        body: { action: 'exchange-code', code, redirectUri }
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

  return {
    integrations,
    loading,
    saveVercelToken,
    startVercelOAuth,
    handleVercelCallback,
    disconnectVercel,
    refetch: fetchIntegrations,
  };
}
