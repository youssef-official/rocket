import type { ProjectFile } from '@/types';

export interface LocalProject {
  id: string;
  name: string;
  description?: string;
  files: Record<string, ProjectFile>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
}

const PROJECTS_KEY = 'vivora_projects';
const MESSAGES_KEY = (id: string) => `vivora_messages_${id}`;

export function getProjects(): LocalProject[] {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getProject(id: string): LocalProject | null {
  return getProjects().find(p => p.id === id) || null;
}

export function saveProject(p: LocalProject): void {
  const all = getProjects().filter(x => x.id !== p.id);
  all.unshift(p);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  const all = getProjects().filter(x => x.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
  localStorage.removeItem(MESSAGES_KEY(id));
}

export function getMessages(projectId: string): LocalMessage[] {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY(projectId)) || '[]');
  } catch {
    return [];
  }
}

export function saveMessages(projectId: string, messages: LocalMessage[]): void {
  localStorage.setItem(MESSAGES_KEY(projectId), JSON.stringify(messages));
}

export function newId(): string {
  return crypto.randomUUID();
}
