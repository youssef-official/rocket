// Local-first project storage. All projects live in localStorage — no backend.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Project, ProjectFile } from '@/types';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'vivora_local_projects';

function readAll(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(items: Project[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const all = readAll();
    const mine = user ? all.filter(p => !p.userId || p.userId === user.id) : all;
    mine.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    setProjects(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const persist = (next: Project[]) => {
    const all = readAll();
    const others = user ? all.filter(p => p.userId && p.userId !== user.id) : [];
    writeAll([...others, ...next]);
    setProjects(next);
  };

  const createProject = async (
    name: string,
    projectType: 'vite' | 'html',
    files: Record<string, ProjectFile> = {},
    description?: string
  ): Promise<Project | null> => {
    try {
      const now = new Date().toISOString();
      const newProject: Project = {
        id: uid(),
        userId: user?.id || 'local',
        name,
        description,
        projectType,
        files,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
      };
      persist([newProject, ...projects]);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
      return null;
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'files' | 'isPublished' | 'buildingPlan' | 'generationStatus'>>
  ): Promise<boolean> => {
    const next = projects.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    persist(next);
    return true;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    persist(projects.filter(p => p.id !== id));
    toast({ title: 'Deleted', description: 'Project deleted successfully' });
    return true;
  };

  const forkProject = async (id: string): Promise<Project | null> => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    return createProject(`${original.name} (Copy)`, original.projectType, { ...original.files }, original.description);
  };

  const getProject = (id: string): Project | undefined => projects.find(p => p.id === id);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    forkProject,
    getProject,
    refetch: fetchProjects,
  };
}
