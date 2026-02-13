import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Code2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import type { ProjectFile } from '@/types';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError(t('project.notFound'));
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (fetchError || !data) {
          setError(t('project.notFound'));
          setLoading(false);
          return;
        }

        // Check if project is private
        if (!data.is_public && data.user_id !== user?.id) {
          setError(t('project.private'));
          setLoading(false);
          return;
        }

        // If user owns the project, redirect to editor
        if (data.user_id === user?.id) {
          navigate(`/projects/${projectId}`);
          return;
        }

        setProject(data);
      } catch (err) {
        setError(t('project.notFound'));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user, navigate, t]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${spaceHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white/80">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${spaceHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
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
            {error === t('project.private') 
              ? 'This project is set to private and can only be viewed by its owner.'
              : 'The project you are looking for does not exist or has been deleted.'
            }
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors"
          >
            {t('nav.backToHome')}
          </a>
        </motion.div>
      </div>
    );
  }

  // Simple view-only display
  return (
    <div className="h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <a href="/"><VivoraXLogo size="sm" /></a>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-medium text-foreground">{project?.name || 'Untitled Project'}</h1>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-full">
            {t('project.viewOnly')}
          </span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Preview coming soon...</p>
      </div>
    </div>
  );
};