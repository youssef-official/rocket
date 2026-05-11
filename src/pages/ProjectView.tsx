import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { PreviewView } from '@/components/editor/PreviewView';
import type { ProjectFile } from '@/types';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      try {
        // Use maybeSingle to handle RLS - public projects are accessible via "Anyone can view published projects" policy
        // We need to check is_public directly
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (fetchError || !data) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        // If private and not owner → deny
        if (!data.is_public && data.user_id !== user?.id) {
          setError('Private project');
          setLoading(false);
          return;
        }

        // If user owns the project, redirect to editor
        if (user && data.user_id === user.id) {
          navigate(`/projects/${projectId}`);
          return;
        }

        setProject(data);
      } catch (err) {
        setError('Project not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user, navigate]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-12 text-center max-w-md"
        >
          <VivoraXLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <p className="text-white/70 mb-6">
            {error === 'Private project' 
              ? 'This project is set to private and can only be viewed by its owner.'
              : 'The project you are looking for does not exist or has been deleted.'
            }
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  // Parse project files for preview
  const projectFiles: Record<string, ProjectFile> = project?.files || {};

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <a href="/"><VivoraXLogo size="sm" /></a>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-medium text-foreground">{project?.name || 'Untitled Project'}</h1>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-full">
            View Only
          </span>
        </div>
      </header>
      <div className="flex-1">
        <PreviewView
          files={projectFiles}
          projectType={project?.project_type || 'vite'}
        />
      </div>
    </div>
  );
};