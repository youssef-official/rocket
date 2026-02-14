import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Project, ProjectFile } from '@/types';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching projects:', error);
        setLoading(false);
        return;
      }

      const mapped: Project[] = (data || []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        description: p.description || undefined,
        projectType: p.project_type as 'vite' | 'html',
        files: (p.files as unknown as Record<string, ProjectFile>) || {},
        isPublished: p.is_published,
        publishedSlug: p.published_slug || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        generatedName: p.generated_name || undefined,
        buildingPlan: p.building_plan || undefined,
        generationStatus: p.generation_status || undefined,
      }));

      setProjects(mapped);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (
    name: string,
    projectType: 'vite' | 'html',
    files: Record<string, ProjectFile> = {},
    description?: string
  ): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          project_type: projectType,
          files: files as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || undefined,
        projectType: data.project_type as 'vite' | 'html',
        files: (data.files as unknown as Record<string, ProjectFile>) || {},
        isPublished: data.is_published,
        publishedSlug: data.published_slug || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        generatedName: data.generated_name || undefined,
        buildingPlan: data.building_plan || undefined,
        generationStatus: data.generation_status || undefined,
      };

      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'files' | 'isPublished' | 'buildingPlan' | 'generationStatus'>>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.files !== undefined) dbUpdates.files = updates.files as unknown as Json;
      if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
      if (updates.buildingPlan !== undefined) dbUpdates.building_plan = updates.buildingPlan;
      if (updates.generationStatus !== undefined) dbUpdates.generation_status = updates.generationStatus;

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
      );

      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      // Use backend-side cascade deletion to ensure ALL related data is removed.
      const { error } = await supabase.rpc('delete_project_cascade', {
        p_project_id: id,
      });

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Deleted',
        description: 'Project deleted successfully',
      });
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      return false;
    }
  };

  const forkProject = async (id: string): Promise<Project | null> => {
    const original = projects.find((p) => p.id === id);
    if (!original) return null;

    return createProject(
      `${original.name} (Copy)`,
      original.projectType,
      { ...original.files },
      original.description
    );
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
  };

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
