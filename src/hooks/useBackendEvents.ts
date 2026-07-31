import { useEffect, useRef } from 'react';
import { subscribeLocalEvents } from '@/services/localBackend';

export type BackendEvent = {
  type: 'project.created' | 'project.updated' | 'project.deleted' | 'message.updated' | 'version.created' | 'store.created' | 'store.updated' | 'account.updated';
  projectId?: string;
  messageId?: string;
  versionId?: string;
  storeId?: string;
  at: string;
};

/**
 * Local event bus. There is no server to stream from: the local backend emits
 * DOM events whenever data changes, and every hook stays in sync from them.
 */
export function useBackendEvents(enabled: boolean, onEvent: (event: BackendEvent) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    return subscribeLocalEvents(event => callbackRef.current(event as BackendEvent));
  }, [enabled]);
}
