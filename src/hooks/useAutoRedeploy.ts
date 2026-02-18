import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AutoRedeployOptions {
  projectId: string;
  userId?: string;
}

/**
 * Sends an event to self-hosted Inngest via the inngest edge function.
 * This ensures background redeployment even if the user closes the tab.
 */
async function sendInngestEvent(
  eventName: string,
  eventData: Record<string, unknown>
): Promise<boolean> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/inngest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'send-event',
        eventName,
        eventData,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export function useAutoRedeploy({ projectId, userId }: AutoRedeployOptions) {
  const redeployDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Trigger Vivora auto-redeploy in background via Inngest.
   * Debounced 3s to avoid rapid re-fires during generation.
   */
  const triggerVivoraRedeploy = useCallback(
    async (files: Record<string, ProjectFile>) => {
      if (!userId) return;

      // Check if project has an active Vivora deployment
      const { data: deployment } = await supabase
        .from('vivora_deployments')
        .select('subdomain, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!deployment || deployment.status !== 'active') return;

      // Convert files to flat string map for edge function
      const fileMap: Record<string, string> = {};
      Object.entries(files).forEach(([path, file]) => {
        fileMap[path] = file.content;
      });

      if (redeployDebounceRef.current) clearTimeout(redeployDebounceRef.current);

      redeployDebounceRef.current = setTimeout(async () => {
        // Send to Inngest for background processing
        const ok = await sendInngestEvent('vivora/project.updated', {
          subdomain: deployment.subdomain,
          files: fileMap,
          userId,
          projectId,
          timestamp: Date.now(),
        });

        if (ok) {
          toast({
            title: '🔄 Auto-deploying...',
            description: `Updating ${deployment.subdomain}.vivorax.online`,
          });
        }
      }, 3000);
    },
    [userId, projectId]
  );

  /**
   * Trigger Vercel auto-redeploy in background via Inngest.
   */
  const triggerVercelRedeploy = useCallback(
    async (files: Record<string, ProjectFile>, projectName: string) => {
      if (!userId) return;

      // Get Vercel token from user integrations
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('vercel_token, vercel_connected')
        .eq('user_id', userId)
        .maybeSingle();

      if (!integration?.vercel_connected || !integration?.vercel_token) return;

      if (redeployDebounceRef.current) clearTimeout(redeployDebounceRef.current);

      redeployDebounceRef.current = setTimeout(async () => {
        const ok = await sendInngestEvent('vercel/project.updated', {
          token: integration.vercel_token,
          projectName: projectName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100),
          files,
          userId,
          projectId,
          timestamp: Date.now(),
        });

        if (ok) {
          toast({
            title: '🔄 Auto-deploying to Vercel...',
            description: `Updating ${projectName}`,
          });
        }
      }, 3000);
    },
    [userId, projectId]
  );

  return { triggerVivoraRedeploy, triggerVercelRedeploy };
}
