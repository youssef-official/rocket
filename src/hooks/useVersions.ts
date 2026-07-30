import { useState, useCallback, useEffect } from 'react';
import type { ProjectFile, ChatMessage, FileActivity } from '@/types';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useBackendEvents } from '@/hooks/useBackendEvents';

export interface ProjectVersion {
  id: string;
  projectId: string;
  userId: string;
  versionNumber: number;
  name?: string;
  files: Record<string, ProjectFile>;
  chatMessages: ChatMessage[];
  actionsTaken?: FileActivity[];
  creditsUsed?: number;
  createdAt: string;
}

export function useVersions(projectId: string | null) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!projectId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    try {
      setVersions(await api<ProjectVersion[]>(`/projects/${projectId}/versions`));
    } catch (error) {
      toast({ title: 'تعذر تحميل الإصدارات', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions]);

  useBackendEvents(Boolean(projectId), event => {
    if (event.type === 'version.created' && event.projectId === projectId) void fetchVersions();
  });

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void fetchVersions();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [fetchVersions]);

  const createVersion = useCallback(async (
    files: Record<string, ProjectFile>,
    chatMessages: ChatMessage[],
    name?: string,
    actionsTaken?: FileActivity[],
    creditsUsed?: number,
  ) => {
    if (!projectId) return null;
    try {
      const version = await api<ProjectVersion>(`/projects/${projectId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ files, chatMessages, name, actionsTaken, creditsUsed }),
      });
      setVersions(all => all.some(item => item.id === version.id) ? all : [version, ...all]);
      toast({ title: 'Version saved', description: `Version ${version.versionNumber} is ready.` });
      return version;
    } catch (error) {
      toast({ title: 'تعذر حفظ الإصدار', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  }, [projectId]);

  const rollbackToVersion = useCallback(async (number: number) => {
    if (!projectId) return null;
    try {
      const version = await api<ProjectVersion>(`/projects/${projectId}/versions/${number}/rollback`, { method: 'POST' });
      setVersions(all => all.filter(item => item.versionNumber <= number));
      toast({ title: 'Rollback successful', description: `Restored version ${number}.` });
      return { files: version.files, messages: version.chatMessages };
    } catch (error) {
      toast({ title: 'تعذر استرجاع الإصدار', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  }, [projectId]);

  const snapshotVersion = useCallback(async (name?: string, actionsTaken?: FileActivity[], creditsUsed?: number) => {
    if (!projectId) return null;
    try {
      const version = await api<ProjectVersion>(`/projects/${projectId}/versions/snapshot`, {
        method: 'POST',
        body: JSON.stringify({ name, actionsTaken, creditsUsed }),
      });
      setVersions(all => all.some(item => item.id === version.id) ? all : [version, ...all]);
      return version;
    } catch (error) {
      toast({ title: 'تعذر حفظ الإصدار', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  }, [projectId]);

  return {
    versions,
    loading,
    fetchVersions,
    createVersion,
    snapshotVersion,
    getVersion: (number: number) => versions.find(item => item.versionNumber === number),
    rollbackToVersion,
  };
}
