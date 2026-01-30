import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage } from '@/types';

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
        .select('id, project_id, user_id, role, content, image_url, actions_taken, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: ChatMessage[] = (data || []).map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imageUrl: m.image_url,
        actionsTaken: m.actions_taken as any,
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

  // Add a new message
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string, imageUrl?: string, actionsTaken?: any[]): Promise<ChatMessage | null> => {
    if (!projectId || !user) return null;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      imageUrl,
      actionsTaken,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    try {
      // Include image_url in insert as it exists in types.ts and migrations
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: newMessage.id,
          project_id: projectId,
          user_id: user.id,
          role,
          content,
          image_url: imageUrl || null,
          actions_taken: actionsTaken || null,
        })
        .select('id, project_id, user_id, role, content, image_url, actions_taken, created_at')
        .single();

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

  return {
    messages,
    loading,
    addMessage,
    setMessages: setMessagesDirectly,
    clearMessages,
    refetch: fetchMessages,
  };
}
