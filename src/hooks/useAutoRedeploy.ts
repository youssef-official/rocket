import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';

interface AutoRedeployOptions {
  projectId: string;
  userId?: string;
}

interface PendingInngestEvent {
  eventName: string;
  eventData: Record<string, unknown>;
  queuedAt: number;
}

const INNGEST_API_PATH = '/api/inngest';
const PENDING_EVENTS_KEY = 'vivora_inngest_pending_events';

function readPendingEvents(): PendingInngestEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(PENDING_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as PendingInngestEvent[]) : [];
  } catch {
    return [];
  }
}

function writePendingEvents(events: PendingInngestEvent[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(events.slice(-50)));
}

async function sendInngestEvent(eventName: string, eventData: Record<string, unknown>): Promise<boolean> {
  try {
    const resp = await fetch(INNGEST_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-event',
        eventName,
        eventData,
      }),
      keepalive: true,
    });

    return resp.ok;
  } catch {
    return false;
  }
}

async function flushPendingInngestEvents() {
  const pending = readPendingEvents();
  if (!pending.length) return;

  const stillPending: PendingInngestEvent[] = [];
  for (const item of pending) {
    const ok = await sendInngestEvent(item.eventName, item.eventData);
    if (!ok) stillPending.push(item);
  }

  writePendingEvents(stillPending);
}

export function useAutoRedeploy({ projectId, userId }: AutoRedeployOptions) {
  const redeployDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    flushPendingInngestEvents();

    const onOnline = () => {
      void flushPendingInngestEvents();
    };

    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const queueEventForRetry = useCallback((eventName: string, eventData: Record<string, unknown>) => {
    const pending = readPendingEvents();
    pending.push({ eventName, eventData, queuedAt: Date.now() });
    writePendingEvents(pending);
  }, []);

  /**
   * Trigger Vivora auto-redeploy in background via Inngest.
   * Debounced 3s to avoid rapid re-fires during generation.
   */
  const triggerVivoraRedeploy = useCallback(
    async (files: Record<string, ProjectFile>) => {
      if (!userId) return;

      const { data: deployment } = await supabase
        .from('vivora_deployments')
        .select('subdomain, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!deployment || deployment.status !== 'active') return;

      const fileMap: Record<string, string> = {};
      Object.entries(files).forEach(([path, file]) => {
        fileMap[path] = file.content;
      });

      if (redeployDebounceRef.current) clearTimeout(redeployDebounceRef.current);

      redeployDebounceRef.current = setTimeout(async () => {
        const payload = {
          subdomain: deployment.subdomain,
          files: fileMap,
          userId,
          projectId,
          timestamp: Date.now(),
        };

        const ok = await sendInngestEvent('vivora/project.updated', payload);
        if (!ok) {
          queueEventForRetry('vivora/project.updated', payload);
          return;
        }

        toast({
          title: '🔄 Auto-deploying...',
          description: `Updating ${deployment.subdomain}.vivorax.online`,
        });
      }, 3000);
    },
    [projectId, queueEventForRetry, userId],
  );

  /**
   * Trigger Vercel auto-redeploy in background via Inngest.
   */
  const triggerVercelRedeploy = useCallback(
    async (files: Record<string, ProjectFile>, projectName: string) => {
      if (!userId) return;

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('vercel_token, vercel_connected')
        .eq('user_id', userId)
        .maybeSingle();

      if (!integration?.vercel_connected || !integration?.vercel_token) return;

      if (redeployDebounceRef.current) clearTimeout(redeployDebounceRef.current);

      redeployDebounceRef.current = setTimeout(async () => {
        const payload = {
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
        };

        const ok = await sendInngestEvent('vercel/project.updated', payload);
        if (!ok) {
          queueEventForRetry('vercel/project.updated', payload);
          return;
        }

        toast({
          title: '🔄 Auto-deploying to Vercel...',
          description: `Updating ${projectName}`,
        });
      }, 3000);
    },
    [projectId, queueEventForRetry, userId],
  );

  return { triggerVivoraRedeploy, triggerVercelRedeploy };
}
