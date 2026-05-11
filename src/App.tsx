import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { HomePage } from "@/components/home/HomePage";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ThemeInitializer } from "@/components/shared/ThemeInitializer";
import SettingsPage from "@/pages/Settings";
import { useProjects } from "@/hooks/useProjects";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useVersions } from "@/hooks/useVersions";
import { FloatingMusicPlayer } from "@/components/shared/MusicPlayer";
import { useState, useEffect, useRef } from "react";
import {
  streamAICodeGeneration,
  parseAIResponse,
  generateExplanation,
  generateProjectName,
  type Suggestion,
} from "@/services/aiService";
import type { ProjectData, ChatMessage, ProjectFile } from "@/types";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

interface FileActivity { name: string; status: 'editing' | 'done'; action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted'; }
interface GenerationPhase {
  phase: 'thinking' | 'planning' | 'generating' | 'complete';
  message: string;
  thinkingTime?: number;
  plan?: string[];
  completedSteps?: number[];
  currentStep?: number;
  stepFiles?: Record<number, string[]>;
  status?: string;
  summary?: string;
}

const ProjectEditorRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { projects, loading: projectsLoading, updateProject } = useProjects();

  const [localProject, setLocalProject] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [fileActivities, setFileActivities] = useState<FileActivity[]>([]);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [suggestions] = useState<Suggestion[]>([]);
  const isCancelled = useRef(false);

  const { messages, loading: messagesLoading, addMessage, updateMessage, setMessages } = useChatMessages(id || null);
  useVersions(id || null);

  useEffect(() => {
    if (id && !projectsLoading) {
      const p = projects.find(x => x.id === id);
      if (p) {
        setLocalProject({
          id: p.id, name: p.name, description: p.description,
          projectType: p.projectType, files: p.files,
          isPublished: p.isPublished, publishedSlug: p.publishedSlug,
          createdAt: p.createdAt, updatedAt: p.updatedAt,
        });
      } else if (projects.length > 0) {
        navigate('/');
      }
    }
  }, [id, projects, projectsLoading, navigate]);

  // Auto-start initial generation
  useEffect(() => {
    if (!localProject || hasStartedGeneration || messagesLoading || messages.length > 0) return;
    if (!localProject.description || Object.keys(localProject.files).length > 0) return;

    const run = async () => {
      setHasStartedGeneration(true);
      const prompt = localProject.description!;
      await addMessage('user', prompt);
      setIsGenerating(true);
      setGenerationPhase({ phase: 'thinking', message: t('chat.thinking') });

      generateProjectName(prompt).then(name => {
        if (name) updateProject(localProject.id, { name }).then(() =>
          setLocalProject(prev => prev ? { ...prev, name } : null));
      }).catch(() => {});

      let explanation = '';
      try { explanation = await generateExplanation(prompt, localProject.projectType, language); } catch {}
      const assistantId = crypto.randomUUID();
      await addMessage('assistant', explanation || `**${t('chat.generating')}**`, undefined, undefined, undefined, assistantId);

      setGenerationPhase({ phase: 'generating', message: t('chat.generating') });
      let full = '';
      await streamAICodeGeneration(
        [{ role: 'user', content: prompt }],
        localProject.projectType,
        {
          onChunk: c => { full += c; setStreamingContent(full); },
          onComplete: async (response) => {
            const { files, fileList, actionsTaken, summary } = parseAIResponse(response);
            const finalFiles = Object.keys(files).length > 0 ? { ...localProject.files, ...files } : localProject.files;
            await updateProject(localProject.id, { files: finalFiles, generationStatus: 'complete' });
            setLocalProject(prev => prev ? { ...prev, files: finalFiles } : null);
            await updateMessage(assistantId, {
              content: (explanation || '') + `\n\n<!--SUMMARY-->✅ ${summary || `Created ${fileList.length} file(s)`}<!--/SUMMARY-->`,
              actionsTaken: actionsTaken || [],
            });
            setIsGenerating(false);
            setStreamingContent('');
            setCurrentVersion(1);
            setGenerationPhase({ phase: 'complete', message: t('chat.complete') });
          },
          onError: err => {
            console.error('Generation error:', err);
            setIsGenerating(false);
            setGenerationPhase(null);
          },
        }
      );
    };
    run().catch(console.error);
  }, [localProject, hasStartedGeneration, messagesLoading, messages.length, addMessage, updateMessage, updateProject, t, language]);

  const handleSendMessage = async (content: string, isChatOnly?: boolean) => {
    if (!localProject) return;
    await addMessage('user', content);
    setIsGenerating(true);
    setGenerationPhase({ phase: 'generating', message: t('chat.generating') });
    const assistantId = crypto.randomUUID();
    await addMessage('assistant', '', undefined, undefined, undefined, assistantId);
    let full = '';
    const fileList = Object.keys(localProject.files).join(', ');
    await streamAICodeGeneration(
      [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content }],
      localProject.projectType,
      {
        onChunk: c => { full += c; setStreamingContent(full); },
        onComplete: async (resp) => {
          const { files, actionsTaken, summary } = parseAIResponse(resp);
          if (Object.keys(files).length > 0 && !isChatOnly) {
            const finalFiles = { ...localProject.files, ...files };
            await updateProject(localProject.id, { files: finalFiles });
            setLocalProject(prev => prev ? { ...prev, files: finalFiles } : null);
          }
          await updateMessage(assistantId, {
            content: summary ? `<!--SUMMARY-->${summary}<!--/SUMMARY-->` : full.slice(0, 500),
            actionsTaken: actionsTaken || [],
          });
          setIsGenerating(false);
          setStreamingContent('');
          setGenerationPhase({ phase: 'complete', message: t('chat.complete') });
        },
        onError: () => { setIsGenerating(false); setGenerationPhase(null); },
      },
      fileList,
      language,
    );
  };

  const handleVersionRestore = (files: Record<string, ProjectFile>, restoredMessages: ChatMessage[]) => {
    if (!localProject) return;
    setLocalProject(prev => prev ? { ...prev, files } : null);
    updateProject(localProject.id, { files });
    setMessages(restoredMessages);
  };

  if (projectsLoading || !localProject) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading…</div>;
  }

  return (
    <EditorLayout
      project={localProject}
      messages={messages}
      onSendMessage={handleSendMessage}
      isGenerating={isGenerating}
      onNewProject={() => navigate('/')}
      onUpdateProject={(updates) => {
        setLocalProject(prev => prev ? { ...prev, ...updates } : null);
        updateProject(localProject.id, updates as any);
      }}
      onViewDashboard={() => navigate('/')}
      streamingContent={streamingContent}
      onVersionRestore={handleVersionRestore}
      onGoHome={() => navigate('/')}
      fileActivities={fileActivities}
      generationPhase={generationPhase}
      statusMessage={statusMessage}
      onStop={() => { isCancelled.current = true; setIsGenerating(false); }}
      currentVersion={currentVersion}
      suggestions={suggestions}
    />
  );
};

const HomeRoute = () => {
  const navigate = useNavigate();
  const { projects, loading, createProject, deleteProject, forkProject } = useProjects();

  const handleStartBuilding = async (prompt: string, projectType: 'vite' | 'html') => {
    const project = await createProject('Untitled Project', projectType, {}, prompt);
    if (project) navigate(`/projects/${project.id}`);
  };

  return (
    <HomePage
      onStartBuilding={handleStartBuilding}
      onViewDashboard={() => {}}
      onOpenProject={(id) => navigate(`/projects/${id}`)}
      onDeleteProject={deleteProject}
      onForkProject={async (id) => { const p = await forkProject(id); if (p) navigate(`/projects/${p.id}`); }}
      projects={projects}
      projectsLoading={loading}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <ThemeInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/projects/:id" element={<ProjectEditorRoute />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<HomeRoute />} />
            </Routes>
            <FloatingMusicPlayer />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
