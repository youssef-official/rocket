import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { ChatMessage, FileActivity } from '@/types';
import { useBackendEvents } from '@/hooks/useBackendEvents';

export function useChatMessages(projectId: string | null) {
  const { user } = useAuth(); const [messages,setMessages] = useState<ChatMessage[]>([]); const [loading,setLoading] = useState(false);
  const fetchMessages = useCallback(async()=>{ if(!projectId||!user){setMessages([]);return;} setLoading(true);try{setMessages(await api<ChatMessage[]>(`/projects/${projectId}/messages`));}finally{setLoading(false);}},[projectId,user]);
  useEffect(()=>{fetchMessages();},[fetchMessages]);
  useBackendEvents(Boolean(user && projectId), event => {
    if (event.type === 'message.updated' && event.projectId === projectId) void fetchMessages();
  });
  const addMessage = useCallback(async(role:'user'|'assistant',content:string,imageUrl?:string,actionsTaken?:FileActivity[],creditsUsed?:number,customId?:string)=>{ if(!projectId||!user)return null;const message:ChatMessage={id:customId||crypto.randomUUID(),role,content,imageUrl,actionsTaken,creditsUsed,createdAt:new Date().toISOString()};setMessages(all=>[...all,message]);try{await api(`/projects/${projectId}/messages/${message.id}`,{method:'PUT',body:JSON.stringify(message)});return message;}catch{setMessages(all=>all.filter(item=>item.id!==message.id));return null;}},[projectId,user]);
  const updateMessage = useCallback(async(id:string,updates:Partial<ChatMessage>)=>{if(!projectId||!user)return;const current=messages.find(item=>item.id===id);if(!current)return;const next={...current,...updates};setMessages(all=>all.map(item=>item.id===id?next:item));await api(`/projects/${projectId}/messages/${id}`,{method:'PUT',body:JSON.stringify(next)});},[projectId,user,messages]);
  return {messages,loading,addMessage,updateMessage,setMessages,clearMessages:()=>setMessages([]),deleteMessagesAfter:async(timestamp:string)=>setMessages(all=>all.filter(item=>item.createdAt<=timestamp)),refetch:fetchMessages};
}
