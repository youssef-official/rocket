import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, FileActivity } from '@/types';

export function useChatMessages(projectId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch messages from database
  const fetchMessages = useCallback(async () => {
    if (!projectId || !user) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, project_id, user_id, role, content, image_url, credits_used, actions_taken, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: ChatMessage[] = (data || []).map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imageUrl: m.image_url ?? undefined,
        creditsUsed: m.credits_used ?? undefined,
        actionsTaken: m.actions_taken as unknown as FileActivity[] | undefined,
        createdAt: m.created_at,
      }));

      setMessages(mapped);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  // Load messages when project changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Refetch messages when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && projectId && user) {
        fetchMessages();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [projectId, user, fetchMessages]);

  // Add a new message
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    imageUrl?: string,
    actionsTaken?: FileActivity[],
    creditsUsed?: number,
    customId?: string
  ): Promise<ChatMessage | null> => {
    if (!projectId || !user) return null;

    const newMessage: ChatMessage = {
      id: customId || crypto.randomUUID(),
      role,
      content,
      imageUrl,
      actionsTaken,
      creditsUsed,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: newMessage.id,
          project_id: projectId,
          user_id: user.id,
          role,
          content,
          image_url: imageUrl || null,
          credits_used: creditsUsed || null,
          actions_taken: (actionsTaken || []) as any,
        });

      if (error) {
        console.error('Supabase error saving message:', error);
        throw error;
      }

      return newMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
      return null;
    }
  }, [projectId, user]);

  // Set messages directly (for restoring from version)
  const setMessagesDirectly = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Delete messages created after a certain timestamp
  const deleteMessagesAfter = useCallback(async (timestamp: string) => {
    if (!projectId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('project_id', projectId)
        .gt('created_at', timestamp);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.filter(m => m.createdAt && m.createdAt <= timestamp));
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  }, [projectId, user]);

  // Update an existing message
  const updateMessage = useCallback(async (id: string, updates: Partial<ChatMessage>) => {
    if (!projectId || !user) return;

    try {
      // Update local state
      setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

      // Update in Supabase
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: updates.content,
          actions_taken: updates.actionsTaken as any,
          credits_used: updates.creditsUsed
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }, [projectId, user]);

  return {
    messages,
    loading,
    addMessage,
    updateMessage,
    setMessages: setMessagesDirectly,
    clearMessages,
    deleteMessagesAfter,
    refetch: fetchMessages,
  };
}
