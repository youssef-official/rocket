import { useState, useCallback } from 'react';
import type { ProjectFile, ChatMessage, FileActivity } from '@/types';
import { api } from '@/services/api';

export interface ProjectVersion { id:string; projectId:string; userId:string; versionNumber:number; name?:string; files:Record<string,ProjectFile>; chatMessages:ChatMessage[]; actionsTaken?:FileActivity[]; creditsUsed?:number; createdAt:string; }
export function useVersions(projectId:string|null) {
  const [versions,setVersions]=useState<ProjectVersion[]>([]);
  const fetchVersions=useCallback(async()=>{if(!projectId){setVersions([]);return;}try{setVersions(await api<ProjectVersion[]>(`/projects/${projectId}/versions`));}catch{setVersions([]);}},[projectId]);
  const createVersion=useCallback(async(files:Record<string,ProjectFile>,chatMessages:ChatMessage[],name?:string,actionsTaken?:FileActivity[],creditsUsed?:number)=>{
    if(!projectId)return null;
    const version=await api<ProjectVersion>(`/projects/${projectId}/versions`,{method:'POST',body:JSON.stringify({files,chatMessages,name,actionsTaken,creditsUsed})});
    setVersions(all=>all.some(item=>item.id===version.id)?all:[version,...all]);
    return version;
  },[projectId]);
  const rollbackToVersion=useCallback(async(number:number)=>{const version=versions.find(item=>item.versionNumber===number);if(!version)return null;setVersions(all=>all.filter(item=>item.versionNumber<=number));return {files:version.files,messages:version.chatMessages};},[versions]);
  return {versions,loading:false,fetchVersions,createVersion,getVersion:(number:number)=>versions.find(item=>item.versionNumber===number),rollbackToVersion};
}
