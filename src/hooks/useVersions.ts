import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ProjectFile, ChatMessage, FileActivity } from '@/types';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!user || !projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('version_number', { ascending: false });

      if (error) throw error;

      const mapped: ProjectVersion[] = (data || []).map((v: any) => ({
        id: v.id,
        projectId: v.project_id,
        userId: v.user_id,
        versionNumber: v.version_number,
        name: v.name,
        files: v.files as Record<string, ProjectFile>,
        chatMessages: v.chat_messages as ChatMessage[],
        actionsTaken: v.actions_taken as FileActivity[] | undefined,
        creditsUsed: v.credits_used ?? undefined,
        createdAt: v.created_at,
      }));

      setVersions(mapped);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // Auto-fetch versions on mount and when projectId changes
  useEffect(() => {
    if (user && projectId) {
      fetchVersions();
    }
  }, [user, projectId, fetchVersions]);

  // Refetch versions when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && projectId && user) {
        fetchVersions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [projectId, user, fetchVersions]);

  const createVersion = useCallback(async (
    files: Record<string, ProjectFile>,
    chatMessages: ChatMessage[],
    name?: string,
    actionsTaken?: FileActivity[],
    creditsUsed?: number
  ): Promise<ProjectVersion | null> => {
    if (!user || !projectId) return null;

    try {
      // Get current max version number
      const { data: existing } = await supabase
        .from('project_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = existing && existing.length > 0
        ? (existing[0] as any).version_number + 1
        : 1;

      const { data, error } = await supabase
        .from('project_versions')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          version_number: nextVersion,
          name: name || `Version ${nextVersion}`,
          files: files as any,
          chat_messages: chatMessages as any,
          actions_taken: actionsTaken as any || [],
          credits_used: creditsUsed,
        }])
        .select()
        .single();

      if (error) throw error;

      const newVersion: ProjectVersion = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        versionNumber: data.version_number,
        name: data.name ?? undefined,
        files: data.files as unknown as Record<string, ProjectFile>,
        chatMessages: data.chat_messages as unknown as ChatMessage[],
        actionsTaken: data.actions_taken as unknown as FileActivity[] | undefined,
        creditsUsed: data.credits_used ?? undefined,
        createdAt: data.created_at,
      };

      setVersions(prev => [newVersion, ...prev]);

      toast({
        title: 'Version saved',
        description: `Version ${nextVersion} created successfully`,
      });

      return newVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to save version',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, projectId]);

  const getVersion = useCallback((versionNumber: number): ProjectVersion | undefined => {
    return versions.find(v => v.versionNumber === versionNumber);
  }, [versions]);

  const rollbackToVersion = useCallback(async (
    versionNumber: number
  ): Promise<{ files: Record<string, ProjectFile>; messages: ChatMessage[] } | null> => {
    if (!user || !projectId) return null;

    try {
      const targetVersion = versions.find(v => v.versionNumber === versionNumber);
      if (!targetVersion) return null;

      // Delete all versions after the target version
      const versionsToDelete = versions
        .filter(v => v.versionNumber > versionNumber)
        .map(v => v.id);

      if (versionsToDelete.length > 0) {
        const { error } = await supabase
          .from('project_versions')
          .delete()
          .in('id', versionsToDelete);

        if (error) throw error;
      }

      // 2. Delete all chat messages after the target version's creation time
      const { error: msgError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('project_id', projectId)
        .gt('created_at', targetVersion.createdAt);

      if (msgError) throw msgError;

      // Update local state
      setVersions(prev => prev.filter(v => v.versionNumber <= versionNumber));

      toast({
        title: 'Rollback successful',
        description: `Restored to version ${versionNumber}`,
      });

      return {
        files: targetVersion.files,
        messages: targetVersion.chatMessages,
      };
    } catch (error) {
      console.error('Error rolling back:', error);
      toast({
        title: 'Error',
        description: 'Failed to rollback to version',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, projectId, versions]);

  return {
    versions,
    loading,
    fetchVersions,
    createVersion,
    getVersion,
    rollbackToVersion,
  };
}
