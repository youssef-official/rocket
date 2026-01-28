import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { PreviewView } from '@/components/editor/PreviewView';
import { CodeView } from '@/components/editor/CodeView';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectData, ProjectFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Eye, Code2, Loader2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ProjectView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        // Check visibility
        if (!data.is_public) {
           // We might want to check auth here too, but for now we assume public view is strictly for public projects
           // or we rely on RLS. If RLS blocks it, we get an error.
        }

        const projectData: ProjectData = {
            id: data.id,
            name: data.name,
            description: data.description,
            projectType: data.project_type,
            files: data.files as Record<string, ProjectFile>,
            isPublished: data.is_public,
            publishedSlug: data.slug,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            generatedName: data.generated_name
        };

        setProject(projectData);
      } catch (err: any) {
        console.error('Error fetching project:', err);
        setError('Project not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <RocketLogo size="lg" className="mb-6 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The project you're looking for doesn't exist or is private."}</p>
        <Button onClick={() => navigate('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
             <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <RocketLogo size="sm" showText={false} />
            <h1 className="font-bold text-lg truncate max-w-[200px]">{project.generatedName || project.name}</h1>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-secondary rounded-full p-1 border border-border">
          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'preview'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'code'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        <div className="w-[100px] flex justify-end">
           <Button variant="outline" size="sm" onClick={() => navigate('/')}>
             Build Your Own
           </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'preview' ? (
          <PreviewView
            files={project.files}
            projectType={project.projectType}
            isLoading={false}
          />
        ) : (
          <CodeView
            files={project.files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onUpdateFile={() => {}} // Read only
            readOnly={true}
          />
        )}
      </div>
    </div>
  );
};
