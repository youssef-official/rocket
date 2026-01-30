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

  const validateVercelToken = async (token: string): Promise<{ valid: boolean; username?: string }> => {
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, username: data.user?.username || data.user?.name };
      }
      return { valid: false };
    } catch (error) {
      console.error('Vercel validation error:', error);
      return { valid: false };
    }
  };

  const saveVercelToken = async (token: string): Promise<boolean> => {
    if (!user) return false;

    const validation = await validateVercelToken(token);
    if (!validation.valid) {
      toast({
        title: 'Invalid Token',
        description: 'The Vercel token is invalid. Please check and try again.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          vercel_token: token,
          vercel_username: validation.username,
          vercel_connected: true,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Vercel Connected',
        description: `Connected as ${validation.username}`,
      });

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error saving Vercel token:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Vercel token',
        variant: 'destructive',
      });
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

      toast({
        title: 'Vercel Disconnected',
        description: 'Your Vercel account has been disconnected.',
      });

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
    disconnectVercel,
    validateVercelToken,
    refetch: fetchIntegrations,
  };
}
