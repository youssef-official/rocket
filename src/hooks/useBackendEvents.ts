import { useEffect, useRef } from 'react';
import { apiUrl, getToken } from '@/services/api';

export type BackendEvent = {
  type: 'project.created' | 'project.updated' | 'project.deleted' | 'message.updated' | 'version.created' | 'account.updated';
  projectId?: string;
  messageId?: string;
  versionId?: string;
  at: string;
};

/**
 * Authenticated server-sent events. EventSource cannot send the bearer token,
 * so this uses fetch and keeps tokens out of query strings and server logs.
 */
export function useBackendEvents(enabled: boolean, onEvent: (event: BackendEvent) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !getToken()) return;
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      try {
        const response = await fetch(apiUrl('/events'), {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error('Realtime connection failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventType = '';
        let data = '';

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf('\n');
          while (boundary !== -1) {
            const line = buffer.slice(0, boundary).replace(/\r$/, '');
            buffer = buffer.slice(boundary + 1);
            boundary = buffer.indexOf('\n');
            if (line.startsWith('event:')) eventType = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
            else if (line === '' && data) {
              try {
                callbackRef.current({ ...JSON.parse(data), type: eventType || JSON.parse(data).type });
              } catch { /* Ignore a malformed event and stay connected. */ }
              eventType = '';
              data = '';
            }
          }
        }
      } catch {
        // Reconnect quietly. The REST state remains available if SSE is blocked.
      }
      if (!controller.signal.aborted) retryTimer = setTimeout(connect, 1500);
    };

    void connect();
    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [enabled]);
}
