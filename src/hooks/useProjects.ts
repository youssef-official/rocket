import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectFile } from '@/types';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useBackendEvents } from '@/hooks/useBackendEvents';
export function useProjects() {
  const { user } = useAuth(); const [projects,setProjects] = useState<Project[]>([]); const [loading,setLoading] = useState(true);
  const fetchProjects = useCallback(async()=>{ if(!user){setProjects([]);setLoading(false);return;} try{setProjects(await api<Project[]>('/projects'));}catch(error){toast({title:'تعذر تحميل المشاريع',description:(error as Error).message,variant:'destructive'});}finally{setLoading(false);}},[user]);
  useEffect(()=>{fetchProjects();},[fetchProjects]);
  // Server push keeps the dashboard, editor title and generated files in sync
  // across tabs/devices. A light fallback refresh also covers proxies that
  // buffer SSE connections.
  useBackendEvents(Boolean(user), event => {
    if (event.type.startsWith('project.')) void fetchProjects();
  });
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchProjects();
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [user, fetchProjects]);
  const createProject=async(name:string,projectType:'vite'|'html',files:Record<string,ProjectFile>={},description?:string)=>{
    // A non-empty system fallback keeps project creation compatible with older
    // server processes. The current server ignores it and assigns its own
    // cryptographically random name; no AI naming request is involved.
    const systemFallbackName = name.trim() || `Webo ${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try{
      const p=await api<Project>('/projects',{method:'POST',body:JSON.stringify({name:systemFallbackName,projectType:'html',files,description})});
      setProjects(v=>[p,...v]);
      return p;
    }catch(error){
      toast({title:'تعذر إنشاء المشروع',description:(error as Error).message,variant:'destructive'});
      return null;
    }
  };
  const updateProject=async(id:string,updates:Partial<Pick<Project,'name'|'description'|'files'|'isPublished'|'buildingPlan'|'generationStatus'>>)=>{try{const p=await api<Project>(`/projects/${id}`,{method:'PATCH',body:JSON.stringify(updates)});setProjects(v=>v.map(x=>x.id===id?p:x));return true;}catch{return false;}};
  const deleteProject=async(id:string)=>{try{await api(`/projects/${id}`,{method:'DELETE'});setProjects(v=>v.filter(x=>x.id!==id));return true;}catch{return false;}};
  const forkProject=async(id:string)=>{const p=projects.find(x=>x.id===id);return p?createProject('', 'html', p.files, p.description):null;};
  return {projects,loading,createProject,updateProject,deleteProject,forkProject,getProject:(id:string)=>projects.find(p=>p.id===id),refetch:fetchProjects};
}
