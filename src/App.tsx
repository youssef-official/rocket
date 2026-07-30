import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AuthPage } from "@/components/auth/AuthPage";
import { HomePage } from "@/components/home/HomePage";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { AdminPanel } from "@/pages/Admin";
import Storefront from "@/pages/Storefront";
import StoreAdmin from "@/pages/StoreAdmin";
import StoreHub from "@/pages/StoreHub";
import { ThemeInitializer } from "@/components/shared/ThemeInitializer";
import { useProjects } from "@/hooks/useProjects";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useVersions } from "@/hooks/useVersions";
import { FloatingMusicPlayer } from "@/components/shared/MusicPlayer";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  streamAICodeGeneration,
  parseAIResponse,
  stopGeneration,
  generateSuggestions,
  generateExplanation,
  type Suggestion
} from "@/services/aiService";
import type { ProjectData, ChatMessage, ProjectFile } from "@/types";
import { toast } from "@/hooks/use-toast";
import { browserFileLanguage, isBrowserProjectFile, normalizeBrowserProjectPath } from "@/lib/browserProject";
import { generateStoreBlueprint, storeApi } from "@/services/storeService";

const queryClient = new QueryClient();
const isNativeGenerationStatus = (status: string) =>
  !/(?:package\.json|\.tsx?\b|\.jsx?\b|react|vite|tailwind|next\.js|node_modules)/i.test(status);

const normalizePublicImageUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

// Keep the editor and preview useful before the model has closed its final
// response. The server receives a debounced snapshot of these partial files,
// so another Vivora X tab can join the same build in progress.
const extractLiveFiles = (response: string): Record<string, ProjectFile> => {
  const files: Record<string, ProjectFile> = {};
  // Only expose a file after its closing marker arrives. Showing an open block
  // made the editor persist partial content (often just the starter fallback)
  // while the model was still streaming the rest of the file.
  const blocks = response.matchAll(/<FILE\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/FILE>/gi);
  for (const block of blocks) {
    const path = normalizeBrowserProjectPath(block[1] || block[2] || '');
    if (!isBrowserProjectFile(path)) continue;
    const content = (block[3] || '').replace(/\n?<\/FILE>\s*$/i, '');
    files[path] = { name: path.split('/').pop() || path, path, content, language: browserFileLanguage(path) };
  }
  return files;
};

const fallbackPlan = (editing = false, request = '') => {
  const goal = request.replace(/\s+/g, ' ').trim().slice(0, 90);
  return editing
    ? `I’ll apply the requested update${goal ? ` for “${goal}”` : ''}, then verify the affected experience.`
    : `I’ll turn ${goal ? `“${goal}”` : 'your brief'} into a responsive browser-native experience and verify it end to end.`;
};

const generatePlanLine = async (editing: boolean, request: string, language: string, theme?: { name: string; colors: string[] } | null) => {
  const themeContext = theme ? ` The selected design system is ${theme.name} with colors ${theme.colors.join(', ')} and it must drive the final UI.` : '';
  const generated = await generateExplanation(
    `${editing ? 'Describe the concrete change you are about to implement' : 'Describe the concrete website you are about to build'} for this request: ${request}.${themeContext}`,
    'html',
    language,
  );
  const line = generated
    .replace(/^[\s\-*•\d.)]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return [line || fallbackPlan(editing, request)];
};

const runtimeFile = (path: string, content: string, language: string): ProjectFile => ({
  name: path.split('/').pop() || path, path, content, language,
});

const ensureStaticWebsiteFiles = (files: Record<string, ProjectFile>) => {
  const next: Record<string, ProjectFile> = {};
  for (const [rawPath, file] of Object.entries(files)) {
    const path = normalizeBrowserProjectPath(rawPath);
    if (isBrowserProjectFile(path)) next[path] = { ...file, name: path.split('/').pop() || path, path, language: browserFileLanguage(path) };
  }
  if (!next['index.html']) {
    next['index.html'] = runtimeFile(
      'index.html',
      '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Vivora X Website</title>\n</head>\n<body>\n  <main><h1>Your website is ready</h1></main>\n</body>\n</html>',
      'html',
    );
  }
  return next;
};

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
}

interface GenerationPhase {
  phase: 'thinking' | 'planning' | 'generating' | 'complete';
  message: string;
  thinkingTime?: number;
  plan?: string[];
  completedSteps?: number[];
  agentStep?: 'planning' | 'generating' | 'validating' | 'fixing' | 'streaming' | 'done' | 'error';
  agentConfidence?: number;
  agentIssuesCount?: number;
  currentStep?: number;
  stepFiles?: Record<number, string[]>;
  status?: string;
  summary?: string;
}

// Project Editor wrapper component for route /projects/:id
const ProjectEditorRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading, updateProject, getProject, fetchProject } = useProjects();

  const [localProject, setLocalProject] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [fileActivities, setFileActivities] = useState<FileActivity[]>([]);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [clarifyQuestions, setClarifyQuestions] = useState<{ question: string; options: string[] }[] | null>(null);
  const [pendingClarifyPrompt, setPendingClarifyPrompt] = useState<string | null>(null);
  const [pendingClarifyImageUrl, setPendingClarifyImageUrl] = useState<string | undefined>(undefined);
  const isCancelled = useRef(false);
  const lastAssistantMessageId = useRef<string | null>(null);
  const projectLoadAttempt = useRef<string | null>(null);

  // Use chat messages hook for persistence
  const {
    messages,
    loading: messagesLoading,
    addMessage,
    updateMessage,
    setMessages,
    clearMessages
  } = useChatMessages(id || null);

  const { snapshotVersion } = useVersions(id || null);

  const backgroundFallbackTriggered = useRef(false);
  const currentGenerationMessages = useRef<any[]>([]);


  useEffect(() => {
    if (id && !projectsLoading) {
      const dbProject = getProject(id);
      if (dbProject) {
        projectLoadAttempt.current = id;
        setLocalProject({
          id: dbProject.id,
          name: dbProject.name,
          description: dbProject.description,
          projectType: dbProject.projectType,
          files: dbProject.files,
          isPublished: dbProject.isPublished,
          publishedSlug: dbProject.publishedSlug,
          createdAt: dbProject.createdAt,
          updatedAt: dbProject.updatedAt,
        });

        // Restore generation state from database if available
        if (dbProject.buildingPlan && dbProject.buildingPlan.length > 0) {
          const isComplete = dbProject.generationStatus === 'complete';
          const allStepsComplete = dbProject.buildingPlan.map((_, i) => i);

          setGenerationPhase({
            phase: isComplete ? 'complete' : 'generating',
            message: isComplete ? t('chat.complete') : t('chat.generating'),
            plan: dbProject.buildingPlan,
            completedSteps: isComplete ? allStepsComplete : [],
            currentStep: isComplete ? undefined : 0,
            stepFiles: {},
            summary: isComplete ? `✅ Project created successfully!` : undefined
          });

          if (isComplete) {
            setHasStartedGeneration(true);
          }
        }
      } else if (projectLoadAttempt.current !== id) {
        projectLoadAttempt.current = id;
        void fetchProject(id).then(found => {
          if (!found) {
            toast({ title: 'Project not found', description: 'The project could not be loaded. Try creating it again.', variant: 'destructive' });
            navigate('/');
          }
        });
      }
    }
  }, [id, projects, projectsLoading, navigate, getProject, fetchProject]);

  // Auto-start generation for new projects (description = prompt, no messages yet)
  useEffect(() => {
    // Only start if: 
    // 1. Project exists
    // 2. Not already started
    // 3. Not currently loading messages from DB
    // 4. No messages exist yet
    // 5. Project has NO files (true initial state)
    const hasFiles = localProject && Object.keys(localProject.files).length > 0;

    if (localProject && !hasStartedGeneration && !messagesLoading && messages.length === 0 && localProject.description && !hasFiles) {
      // This is a newly created project, start generation
      const startInitialGeneration = async () => {
        setHasStartedGeneration(true);
        isCancelled.current = false;

        const prompt = localProject.description || '';

        // Get any uploaded image URL from sessionStorage
        const savedImageUrl = sessionStorage.getItem(`project_image_${localProject.id}`);
        if (savedImageUrl) {
          sessionStorage.removeItem(`project_image_${localProject.id}`);
        }

        await addMessage('user', prompt, savedImageUrl || undefined);
        setIsGenerating(true);
        setStreamingContent('');
        setFileActivities([]);
        setStatusMessage(t('chat.analyzing'));
        setGenerationPhase({ phase: 'planning', message: t('chat.analyzing') });

        try {
          const selectedDesignSystem = (() => {
            try {
              const saved = sessionStorage.getItem(`project_color_theme_${localProject.id}`);
              return saved ? JSON.parse(saved) as { name: string; colors: string[] } : null;
            } catch { return null; }
          })();
          const planLines = await generatePlanLine(false, prompt, language, selectedDesignSystem);
          setGenerationPhase({ phase: 'planning', message: t('chat.analyzing'), thinkingTime: 0, plan: planLines, completedSteps: [], currentStep: 0, stepFiles: {} });

          // Save plan to database
          await updateProject(localProject.id, {
            description: prompt,
            buildingPlan: planLines,
            generationStatus: 'generating',
          });

          setGenerationPhase({
            phase: 'generating',
            message: t('chat.generating'),
            thinkingTime: 0,
            plan: planLines,
            completedSteps: [],
            currentStep: 0,
            stepFiles: {}
          });

          if (isCancelled.current) return;

          // Add explanation message for initial generation (keep it SHORT)
          const assistantId = crypto.randomUUID();
          const planContent = planLines.length > 0 ? `${planLines[0]}\n\n` : '';
          const explanationMessage = `${planContent}**${t('chat.generating')}**`;
          await addMessage('assistant', explanationMessage, undefined, undefined, undefined, assistantId);
          lastAssistantMessageId.current = assistantId;

          // Step 2: Start code generation (no logo generation)
          const currentStepText = planLines[0] || t('chat.makingChanges');
          setGenerationPhase(prev => ({
            ...prev!,
            phase: 'generating',
            message: t('chat.generating'),
            currentStep: 0,
            status: currentStepText
          }));

          let fullResponse = '';
          const detectedFiles = new Set<string>();
          let liveSaveTimer: ReturnType<typeof setTimeout> | undefined;
          let liveSaveChain: Promise<unknown> = Promise.resolve();
          let lastLiveSnapshot = '';
          const persistLiveFiles = (immediate = false) => {
            const liveFiles = extractLiveFiles(fullResponse);
            const snapshot = JSON.stringify(liveFiles);
            const flushPendingSave = immediate && Boolean(liveSaveTimer);
            if (immediate && liveSaveTimer) clearTimeout(liveSaveTimer);
            if (!Object.keys(liveFiles).length || (snapshot === lastLiveSnapshot && !flushPendingSave)) return;
            lastLiveSnapshot = snapshot;
            const save = () => {
              const files = { ...localProject.files, ...liveFiles };
              setLocalProject(prev => prev ? { ...prev, files } : null);
              liveSaveChain = liveSaveChain.catch(() => undefined).then(() => updateProject(localProject.id, {
                files,
                generationStatus: 'generating',
              }));
            };
            if (immediate) {
              save();
            } else {
              if (liveSaveTimer) clearTimeout(liveSaveTimer);
              liveSaveTimer = setTimeout(save, 450);
            }
          };

          // Add "Analyzing image" activity if image was uploaded
          if (savedImageUrl) {
            const isDesignRef = prompt.toLowerCase().includes('design') || prompt.toLowerCase().includes('تصميم') || prompt.toLowerCase().includes('mockup') || prompt.toLowerCase().includes('صفحة');
            const imgFileName = savedImageUrl.startsWith('data:') ? 'uploaded-image' : savedImageUrl.split('/').pop() || 'uploaded-image';
            setFileActivities([{
              name: isDesignRef ? `Design Reference: ${imgFileName}` : imgFileName,
              status: 'done',
              action: 'analyzed_image'
            }]);
          }

          // Credits will be deducted AFTER generation completes (in onComplete)

          // Build prompt with the chosen design system as an enforceable input.
          let userPrompt = `${prompt}\n\n[OUTPUT RULE: Build this as a browser-native multi-page website. Keep index.html as the entry point and create any additional HTML, CSS, JavaScript, JSON, SVG, text, or Markdown files and folders the product genuinely needs. Do not use React, JSX, TypeScript, Vite, packages, or frameworks.]`;
          if (selectedDesignSystem) {
            userPrompt += `\n\n[SELECTED DESIGN SYSTEM: ${selectedDesignSystem.name}. Use these palette colors as the actual interface tokens: ${selectedDesignSystem.colors.join(', ')}. Apply them consistently to backgrounds, surfaces, text hierarchy, borders, focus states, and actions; do not silently replace this palette.]`;
          }

          const aiMessages: any[] = [{ role: 'user', content: userPrompt }];
          if (savedImageUrl) {
            aiMessages[0].imageUrls = [savedImageUrl];
          }
          // Store for background fallback
          currentGenerationMessages.current = aiMessages;
          backgroundFallbackTriggered.current = false;

          await streamAICodeGeneration(
            aiMessages,
            localProject.projectType,
            {
              projectId: localProject.id,
              generationKind: 'initial',
              onChunk: (chunk) => {
                if (isCancelled.current) return;
                fullResponse += chunk;
                setStreamingContent(fullResponse);
                persistLiveFiles();

                // Live file detection (JSON + <FILE> blocks)
                const markFile = (fileNameRaw: string) => {
                  const fileName = (fileNameRaw || '').trim().replace(/^\/+/, '');
                  if (!isBrowserProjectFile(fileName) || detectedFiles.has(fileName)) return;
                  detectedFiles.add(fileName);
                  const planStep = 0;
                  setGenerationPhase(prev => prev ? {
                    ...prev,
                    currentStep: planStep,
                    completedSteps: Array.from({ length: planStep }, (_, index) => index),
                    status: planLines[planStep],
                    stepFiles: { ...(prev.stepFiles || {}), [planStep]: [fileName] },
                  } : prev);

                  setFileActivities(prev => {
                    const exists = prev.find(f => f.name === fileName);
                    if (exists) return prev;
                    return [
                      ...prev.map(f => ({ ...f, status: 'done' as const })),
                      { name: fileName, status: 'editing' as const, action: 'created' as const }
                    ];
                  });
                };

                const jsonPathMatches = fullResponse.match(/"([^"]+\.(?:html|css|js|json|svg|txt|md))"\s*:/gi);
                if (jsonPathMatches) {
                  jsonPathMatches.forEach(m => markFile(m.replace(/["':]/g, '')));
                }

                const fileBlockMatches = Array.from(fullResponse.matchAll(/<FILE\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)')/gi));
                if (fileBlockMatches.length > 0) {
                  fileBlockMatches.forEach(m => markFile((m[1] ?? m[2] ?? '').trim()));
                }
              },
              onComplete: async (response, usage) => {
                if (isCancelled.current) return;

                fullResponse = response;
                persistLiveFiles(true);
                await liveSaveChain;

                const { files, summary: aiSummary } = parseAIResponse(response);

                let finalFiles = Object.keys(files).length > 0
                  ? { ...localProject.files, ...files }
                  : localProject.files;
                finalFiles = ensureStaticWebsiteFiles(finalFiles);
                const generatedPaths = Object.keys(finalFiles);
                const activities: FileActivity[] = generatedPaths.map(name => ({
                  name,
                  status: 'done',
                  action: 'created',
                }));
                setFileActivities(prev => {
                  const analyzingActivities = prev.filter(a => a.action === 'analyzed_image');
                  return [...analyzingActivities, ...activities];
                });

                const stepFilesMap: Record<number, string[]> = {};
                generatedPaths.forEach(path => {
                  const step = 0;
                  stepFilesMap[step] = [...(stepFilesMap[step] || []), path];
                });

                const projectSaved = await updateProject(localProject.id, {
                  files: finalFiles,
                  generationStatus: 'complete'
                });
                if (!projectSaved) throw new Error('The generated files could not be saved. Check the server connection and try again.');
                setLocalProject(prev => prev ? { ...prev, files: finalFiles } : null);

                // Mark all steps as complete
                const allStepsComplete = planLines.map((_, i) => i);

                const summary = aiSummary
                  ? `✅ ${aiSummary}`
                  : `✅ Created ${generatedPaths.length} browser-native file${generatedPaths.length === 1 ? '' : 's'} with working page navigation.`;

                // Update original explanation message instead of adding a new one
                if (assistantId) {
                  const finalContent = explanationMessage
                    .replace(/\*\*Now I['']ll start building\.\.\.\*\*/gi, '')
                    .replace(/Now I['']ll start building\.\.\./gi, '')
                    .replace(/\*\*.*?Generating.*?\*\*/gi, '')
                    .trim() + `\n\n<!--SUMMARY-->${summary}<!--/SUMMARY-->`;

                  await updateMessage(assistantId, {
                    content: finalContent,
                    actionsTaken: activities
                  });
                } else {
                  await addMessage('assistant', summary, undefined, activities);
                }

                currentGenerationMessages.current = [];
                backgroundFallbackTriggered.current = false;
                setIsGenerating(false);
                setStreamingContent('');
                setStatusMessage('');
                setCurrentVersion(1);
                setGenerationPhase(prev => ({
                  ...prev!,
                  phase: 'complete',
                  message: t('chat.complete'),
                  status: t('chat.complete'),
                  completedSteps: allStepsComplete,
                  currentStep: undefined,
                  stepFiles: stepFilesMap,
                  summary
                }));

                // The server commits the initial 2-credit reservation only after
                // the generation stream completes successfully.
                if (user) {
                  try {
                    const creditsToDeduct = 2;
                    queryClient.invalidateQueries({ queryKey: ['webo-user-plan', user.id] });
                    // Save credits used to the assistant message
                    if (assistantId) {
                      await updateMessage(assistantId, { creditsUsed: creditsToDeduct, tokensUsed: usage?.total_tokens || null });
                    }
                  } catch (e) {
                    console.error('Credit deduction failed:', e);
                  }
                }

                const savedVersion = await snapshotVersion('Initial Build', activities, 2);
                if (!savedVersion) throw new Error('The project was saved, but its first version could not be created.');

                // Generate suggestions after completion
                if (localProject.description) {
                  generateSuggestions(localProject.description).then(setSuggestions);
                }
              },
              onError: async (error) => {
                // Do NOT deduct credits on error
                console.error('AI error:', error);
                await addMessage('assistant', `I encountered an error: ${error.message}. I've created a starter template for you.`);
                setIsGenerating(false);
                setStreamingContent('');
                setStatusMessage('');
                setGenerationPhase(null);
                setFileActivities([]);
              },
              onFileStart: (fileName) => {
                if (isCancelled.current || !isBrowserProjectFile(fileName)) return;

                setGenerationPhase(prev => {
                  if (!prev || !prev.plan) return prev;

                  const currentFiles = prev.stepFiles || {};
                  const extension = fileName.split('.').pop()?.toLowerCase();
                  const currentStepIdx = Math.min(
                    extension === 'html' ? 1 : extension === 'css' ? 2 : 3,
                    prev.plan.length - 1,
                  );

                  // Add file to current step
                  const updatedStepFiles = { ...currentFiles };
                  if (!updatedStepFiles[currentStepIdx]) updatedStepFiles[currentStepIdx] = [];
                  if (!updatedStepFiles[currentStepIdx].includes(fileName)) {
                    updatedStepFiles[currentStepIdx].push(fileName);
                  }

                  // Mark previous steps as complete
                  const completedSteps = Array.from({ length: currentStepIdx }, (_, i) => i);

                  const currentStepText = prev.plan[currentStepIdx] || 'Building components';

                  return {
                    ...prev,
                    status: currentStepText,
                    currentStep: currentStepIdx,
                    completedSteps,
                    stepFiles: updatedStepFiles
                  };
                });

                setFileActivities(prev => {
                  const exists = prev.find(f => f.name === fileName);
                  if (exists) {
                    return prev.map(f => f.name === fileName ? { ...f, status: 'editing' as const } : { ...f, status: 'done' as const });
                  }
                  const updated = prev.map(f => ({ ...f, status: 'done' as const }));
                  return [...updated, { name: fileName, status: 'editing' as const, action: 'created' as const }];
                });
              },
              onStatusUpdate: (status) => {
                if (isCancelled.current || !isNativeGenerationStatus(status)) return;
                setStatusMessage(status);
              },
              onAgentStep: (event) => {
                if (isCancelled.current) return;
                setGenerationPhase(prev => prev ? {
                  ...prev,
                  agentStep: event.step,
                  agentConfidence: event.confidence ?? prev.agentConfidence,
                  agentIssuesCount: event.issues_count ?? prev.agentIssuesCount,
                  message: event.message && isNativeGenerationStatus(event.message) ? event.message : prev.message,
                } : null);
              },
            },
            undefined,
            language,
            selectedDesignSystem
          );
        } catch (error) {
          if (isCancelled.current) return;
          console.error('Generation error:', error);
          await addMessage('assistant', "I'm working on your project with the starter template!");
          setIsGenerating(false);
          setStreamingContent('');
          setStatusMessage('');
          setGenerationPhase(null);
          setFileActivities([]);
        }
      };

      startInitialGeneration();
    }
  }, [localProject, messages, hasStartedGeneration, addMessage, updateProject, snapshotVersion, language]);

  const handleVersionRestore = useCallback(async (files: Record<string, ProjectFile>, restoredMessages: ChatMessage[]) => {
    if (localProject) {
      setLocalProject(prev => prev ? { ...prev, files } : null);
      setMessages(restoredMessages); await updateProject(localProject.id, { files });
    }
  }, [localProject, setMessages, updateProject]);

  const handleStopGeneration = useCallback(() => {
    isCancelled.current = true;
    stopGeneration();
    setIsGenerating(false);
    setStatusMessage('');
    setGenerationPhase({ phase: 'complete', message: t('chat.generationStopped') });
    toast({
      title: t('chat.generationStopped'),
      description: t('chat.generationCancelled'),
    });
  }, [t]);

  const handleSendMessage = useCallback(async (content: string, isChatOnly: boolean = false, imageUrl?: string) => {
    if (!localProject) return;

    const imageUrls = imageUrl ? [normalizePublicImageUrl(imageUrl)].filter(Boolean) : [];

    let userMessageAlreadySaved = false;
    isCancelled.current = false;

    // Vivora X always uses the single approved model path on the server.
    // AUTO-DETECT: Call clarify mode to determine intent before code gen
    const isAutoFix = content.startsWith('[AUTO-FIX]');
    const hasReferencedFiles = content.includes('[Referenced Files:');
    const shouldSkipClarify = isAutoFix || hasReferencedFiles || imageUrls.length > 0 || isChatOnly;

    if (!shouldSkipClarify) {
      // Show user message IMMEDIATELY (don't wait for clarify)
      await addMessage('user', content, imageUrl);
      userMessageAlreadySaved = true;
      setIsGenerating(true);
      setStatusMessage(t('chat.thinking'));

      try {
        const { clarifyRequest } = await import('@/services/aiService');
        const clarifyResult = await clarifyRequest(content, messages, language);

        if (clarifyResult.type === 'chat') {
          setIsChatMode(true);
          try {
            const { generateChatResponse } = await import('@/services/aiService');
            const response = await generateChatResponse(content, messages);
            addMessage('assistant', response);
          } catch (error) {
            addMessage('assistant', "I'm here to help!");
          }
          setIsGenerating(false);
          setStatusMessage('');
          return;
        }

        if (clarifyResult.type === 'clarify' && clarifyResult.questions && clarifyResult.questions.length > 0) {
          setIsGenerating(false);
          setStatusMessage('');
          setClarifyQuestions(clarifyResult.questions);
          setPendingClarifyPrompt(content);
          setPendingClarifyImageUrl(imageUrl);
          return;
        }

        // type === 'build' → fall through to code generation below
        setIsGenerating(false);
        setStatusMessage('');
      } catch (e) {
        console.error('Clarify failed, proceeding with build:', e);
        setIsGenerating(false);
        setStatusMessage('');
      }
    }

    // The Node API owns credit reservation and finalization. This keeps the
    // balance authoritative and releases a reservation if generation fails.

    // Save the message (skip if already saved during clarify)
    if (!userMessageAlreadySaved) {
      await addMessage('user', content, imageUrl);
    }

    // If chat-only mode, respond conversationally
    if (isChatOnly) {
      setIsChatMode(true);
      setIsGenerating(true);
      setStatusMessage(t('chat.thinking'));
      try {
        const { generateChatResponse } = await import('@/services/aiService');
        const response = await generateChatResponse(content, messages);
        addMessage('assistant', response);
      } catch (error) {
        addMessage('assistant', "I'm here to help! Ask me anything about your project or web development.");
      }
      setIsGenerating(false);
      setStatusMessage('');
      return;
    }

    setIsChatMode(false);
    setIsGenerating(true);
    setStreamingContent('');
    setStatusMessage(t('chat.analyzing'));
    setGenerationPhase({ phase: 'planning', message: t('chat.analyzing') });

    // Add "Analyzing image/file" activities for uploaded files
    const initialActivities: FileActivity[] = [];
    if (imageUrl) {
      const urls = [imageUrl].filter(Boolean);
      urls.forEach(url => {
        const fileMetaMatch = url.match(/\[FILE:(\w+):([^\]]+)\]/);
        if (fileMetaMatch) {
          initialActivities.push({
            name: `Analyzing: ${fileMetaMatch[2]}`,
            status: 'done',
            action: 'analyzed_image'
          });
        } else {
          const imgName = url.startsWith('data:') ? 'uploaded-image' : url.split('/').pop() || 'uploaded-image';
          const isDesignRef = content.toLowerCase().includes('design') || content.toLowerCase().includes('تصميم') || content.toLowerCase().includes('mockup') || content.toLowerCase().includes('مثل');
          const isLogoUpload = content.toLowerCase().includes('logo') || content.toLowerCase().includes('لوجو') || content.toLowerCase().includes('شعار');
          initialActivities.push({
            name: isLogoUpload ? `Logo: ${imgName}` : isDesignRef ? `Analyzing design: ${imgName}` : `Analyzing image: ${imgName}`,
            status: 'done',
            action: 'analyzed_image'
          });

        }
      });
    }

    // Note: Read activities will come from the AI's <ACTIONS> block, not hardcoded

    setFileActivities(initialActivities);

    try {
      if (isCancelled.current) return;
      const selectedDesignSystem = (() => {
        try {
          const saved = sessionStorage.getItem(`project_color_theme_${localProject.id}`);
          return saved ? JSON.parse(saved) as { name: string; colors: string[] } : null;
        } catch { return null; }
      })();
      const planLines = isAutoFix
        ? ['Locate and repair the reported preview error, then verify the affected file.']
        : await generatePlanLine(true, content, language, selectedDesignSystem);
      setGenerationPhase({ phase: 'planning', message: t('chat.analyzing'), thinkingTime: 0, plan: planLines, completedSteps: [], currentStep: 0, stepFiles: {} });

      setGenerationPhase({
        phase: 'generating',
        message: t('chat.generating'),
        thinkingTime: 0,
        plan: planLines,
        completedSteps: [],
        currentStep: 0,
        stepFiles: {}
      });

      if (isCancelled.current) return;

      // Add the explanation message (keep it SHORT)
      const assistantId = crypto.randomUUID();
      const planContent = planLines.length > 0 ? `${planLines[0]}\n\n` : '';
      const explanationMessage = `${planContent}**${t('chat.generating')}**`;
      await addMessage('assistant', explanationMessage, undefined, undefined, undefined, assistantId);
      lastAssistantMessageId.current = assistantId;

      // Step 2: Generate code (goes to code view, not shown in chat)
      if (isCancelled.current) return;
      const currentStepText = planLines[0] || t('chat.makingChanges');
      setGenerationPhase(prev => ({
        ...prev!,
        phase: 'generating',
        message: t('chat.generating'),
        currentStep: 0,
        status: currentStepText
      }));

      const conversationHistory = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          imageUrls: m.imageUrl ? [normalizePublicImageUrl(m.imageUrl)].filter(Boolean) : undefined
        })),
        {
          role: 'user' as const,
          content: localProject.files['public/logo.png']
            ? `${content}\n\nNOTE: The project logo is available at "/public/logo.png".`
            : content,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        },
      ];

      // Store for background fallback
      currentGenerationMessages.current = conversationHistory;
      backgroundFallbackTriggered.current = false;

      let fullResponse = '';
      const detectedFiles = new Set<string>();
      let liveSaveTimer: ReturnType<typeof setTimeout> | undefined;
      let liveSaveChain: Promise<unknown> = Promise.resolve();
      let lastLiveSnapshot = '';
      const persistLiveFiles = (immediate = false) => {
        const liveFiles = extractLiveFiles(fullResponse);
        const snapshot = JSON.stringify(liveFiles);
        const flushPendingSave = immediate && Boolean(liveSaveTimer);
        if (immediate && liveSaveTimer) clearTimeout(liveSaveTimer);
        if (!Object.keys(liveFiles).length || (snapshot === lastLiveSnapshot && !flushPendingSave)) return;
        lastLiveSnapshot = snapshot;
        const save = () => {
          const files = { ...localProject.files, ...liveFiles };
          setLocalProject(prev => prev ? { ...prev, files } : null);
          liveSaveChain = liveSaveChain.catch(() => undefined).then(() => updateProject(localProject.id, {
            files,
            generationStatus: 'generating',
          }));
        };
        if (immediate) save();
        else {
          if (liveSaveTimer) clearTimeout(liveSaveTimer);
          liveSaveTimer = setTimeout(save, 450);
        }
      };

      // Credits will be deducted AFTER generation completes (in onComplete)

      // Pass existing file list so AI knows what files exist and can do targeted edits
      const browserFiles = Object.entries(localProject.files)
        .filter(([path]) => isBrowserProjectFile(path));
      const explicitlyRelevantPaths = browserFiles
        .map(([path]) => path)
        .filter(path => content.includes(path));
      const autoFixSource = isAutoFix
        ? content.match(/(?:error in|source file:?|patch only)\s+(?:webo-preview:\/\/)?([^\s:]+\.(?:js|css|html))/i)?.[1]
        : undefined;
      const relevantPaths = new Set(autoFixSource ? [autoFixSource] : explicitlyRelevantPaths);
      const existingFilesList = browserFiles
        .filter(([path]) => relevantPaths.size === 0 || relevantPaths.has(path))
        .map(([path, file]) => `<CURRENT_FILE path="${path}">\n${file.content}\n</CURRENT_FILE>`)
        .join('\n\n');

      await streamAICodeGeneration(
        conversationHistory,
        localProject.projectType,
        {
          projectId: localProject.id,
          generationKind: 'edit',
          onChunk: (chunk) => {
            if (isCancelled.current) return;
            fullResponse += chunk;
            setStreamingContent(fullResponse);
            persistLiveFiles();

            // Live file detection (JSON + <FILE> blocks)
            const markFile = (fileNameRaw: string) => {
              const fileName = (fileNameRaw || '').trim().replace(/^\/+/, '');
              if (!isBrowserProjectFile(fileName) || detectedFiles.has(fileName)) return;
              detectedFiles.add(fileName);

              const isEdit = localProject.files[fileName] !== undefined;
              setFileActivities(prev => {
                const exists = prev.find(f => f.name === fileName);
                if (exists) return prev;
                return [
                  ...prev.map(f => ({ ...f, status: 'done' as const })),
                  { name: fileName, status: 'editing' as const, action: isEdit ? 'edited' : 'created' }
                ];
              });
            };

            const jsonPathMatches = fullResponse.match(/"([^"]+\.(?:html|css|js|json|svg|txt|md))"\s*:/gi);
            if (jsonPathMatches) jsonPathMatches.forEach(m => markFile(m.replace(/["':]/g, '')));

            const fileBlockMatches = Array.from(fullResponse.matchAll(/<FILE\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)')/gi));
            if (fileBlockMatches.length > 0) fileBlockMatches.forEach(m => markFile((m[1] ?? m[2] ?? '').trim()));

            const patchBlockMatches = Array.from(fullResponse.matchAll(/<PATCH\s+[^>]*(?:path|name)=(?:"([^"]+)"|'([^']+)')/gi));
            if (patchBlockMatches.length > 0) patchBlockMatches.forEach(m => markFile((m[1] ?? m[2] ?? '').trim()));
          },
          onComplete: async (response, usage) => {
            if (isCancelled.current) return;

            fullResponse = response;
            persistLiveFiles(true);
            await liveSaveChain;

            const { files: newFiles, fileList, actionsTaken, deletedFiles, summary: aiSummary } = parseAIResponse(response, localProject.files);
            const hasFileChanges = Object.keys(newFiles).length > 0 || Boolean(deletedFiles?.length);

            if (!hasFileChanges) {
              const noChangeMessage = isAutoFix
                ? 'The automatic repair did not return a file change, so Vivora X stopped it instead of creating an empty version.'
                : 'No file changes were returned for this request.';
              if (assistantId) {
                await updateMessage(assistantId, { content: noChangeMessage, actionsTaken: [] });
              } else {
                await addMessage('assistant', noChangeMessage, undefined, []);
              }
              setFileActivities([]);
              setIsGenerating(false);
              setStreamingContent('');
              setStatusMessage('');
              setGenerationPhase(null);
              currentGenerationMessages.current = [];
              backgroundFallbackTriggered.current = false;
              return;
            }

            // Use AI's actions_taken for read/edit/create activities
            const imageActivities: FileActivity[] = fileActivities.filter(a => a.action === 'analyzed_image');

            let fileActivitiesList: FileActivity[];
            if (actionsTaken && actionsTaken.length > 0) {
              // AI provided its own actions (reads + edits + creates)
              fileActivitiesList = actionsTaken.map(a => ({ ...a, status: 'done' as const }));
            } else {
              // Fallback: derive from fileList
              fileActivitiesList = fileList.map(name => ({
                name,
                status: 'done' as const,
                action: (localProject.files[name] ? 'edited' : 'created') as 'edited' | 'created'
              }));
            }

            // Add delete activities
            const deleteActivities: FileActivity[] = (deletedFiles || []).map(name => ({
              name,
              status: 'done' as const,
              action: 'deleted' as const
            }));

            const activities = [...imageActivities, ...fileActivitiesList, ...deleteActivities];

            setFileActivities(activities);

            // Distribute files across plan steps
            const filesPerStep = Math.ceil(fileList.length / Math.max(planLines.length, 1));
            const stepFilesMap: Record<number, string[]> = {};
            fileList.forEach((file, idx) => {
              const stepIdx = Math.min(Math.floor(idx / filesPerStep), planLines.length - 1);
              if (!stepFilesMap[stepIdx]) stepFilesMap[stepIdx] = [];
              stepFilesMap[stepIdx].push(file);
            });

            if (Object.keys(newFiles).length > 0 || (deletedFiles && deletedFiles.length > 0)) {
              let mergedFiles = { ...localProject.files, ...newFiles };
              if (deletedFiles) {
                deletedFiles.forEach(f => delete mergedFiles[f]);
              }
              mergedFiles = ensureStaticWebsiteFiles(mergedFiles);
              const projectSaved = await updateProject(localProject.id, { files: mergedFiles, generationStatus: 'complete' });
              if (!projectSaved) throw new Error('The updated files could not be saved. Check the server connection and try again.');
              setLocalProject(prev => prev ? { ...prev, files: mergedFiles } : null);
            }

            // The server commits the 1-credit edit reservation only when the
            // streamed generation succeeds; errors automatically release it.
            if (user) {
              try {
                const totalCredits = 1;
                queryClient.invalidateQueries({ queryKey: ['webo-user-plan', user.id] });
                // Save credits used to the assistant message
                const totalDeducted = totalCredits;
                if (assistantId) {
                  await updateMessage(assistantId, { creditsUsed: totalDeducted, tokensUsed: usage?.total_tokens || null });
                }
              } catch (e) {
                console.error('Credit deduction failed:', e);
              }
            }

            // Mark all steps as complete
            const allStepsComplete = planLines.map((_, i) => i);

            // Use AI-generated summary if available, otherwise create a basic one
            const summary = aiSummary
              ? `✅ ${aiSummary}`
              : `✅ Updated ${fileList.length} file${fileList.length !== 1 ? 's' : ''}. Your project is ready!`;

            // Update original explanation message instead of adding a new one
            if (assistantId) {
              const finalContent = explanationMessage
                .replace(/\*\*Now I['']ll start building\.\.\.\*\*/gi, '')
                .replace(/Now I['']ll start building\.\.\./gi, '')
                .replace(/\*\*.*?Generating.*?\*\*/gi, '')
                .trim() + `\n\n<!--SUMMARY-->${summary}<!--/SUMMARY-->`;

              await updateMessage(assistantId, {
                content: finalContent,
                actionsTaken: activities
              });
            } else {
              await addMessage('assistant', summary, undefined, activities);
            }

            const savedVersion = await snapshotVersion(undefined, activities, 1);
            if (!savedVersion) throw new Error('The project changes were saved, but the new version could not be created.');

            currentGenerationMessages.current = [];
            backgroundFallbackTriggered.current = false;
            setIsGenerating(false);
            setStreamingContent('');
            setStatusMessage('');
            setCurrentVersion(prev => (prev || 0) + 1);
            setGenerationPhase(prev => ({
              ...prev!,
              phase: 'complete',
              message: t('chat.changesApplied'),
              status: t('chat.complete'),
              completedSteps: allStepsComplete,
              currentStep: undefined,
              stepFiles: stepFilesMap,
              summary
            }));

            // Note: Preview is already the default view in EditorLayout

            // Refresh suggestions after update
            try {
              const { generateSuggestions } = await import('@/services/aiService');
              const newSuggestions = await generateSuggestions(content);
              setSuggestions(newSuggestions);
            } catch (e) {
              console.error('Failed to update suggestions:', e);
            }
          },
          onError: async (error) => {
            // Do NOT deduct credits on error
            await addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
            setIsGenerating(false);
            setStreamingContent('');
            setStatusMessage('');
            setGenerationPhase(null);
            setFileActivities([]);
          },
          onFileStart: (fileName) => {
            if (isCancelled.current || !isBrowserProjectFile(fileName)) return;

            // Calculate which step we're on based on file count
            setGenerationPhase(prev => {
              if (!prev || !prev.plan) return prev;

              const currentFiles = prev.stepFiles || {};
              const totalFiles = Object.values(currentFiles).flat().length;
              const filesPerStep = Math.ceil(10 / Math.max(prev.plan.length, 1)); // Estimate
              const currentStepIdx = Math.min(Math.floor(totalFiles / filesPerStep), prev.plan.length - 1);

              // Add file to current step
              const updatedStepFiles = { ...currentFiles };
              if (!updatedStepFiles[currentStepIdx]) updatedStepFiles[currentStepIdx] = [];
              if (!updatedStepFiles[currentStepIdx].includes(fileName)) {
                updatedStepFiles[currentStepIdx].push(fileName);
              }

              // Mark previous steps as complete
              const completedSteps = Array.from({ length: currentStepIdx }, (_, i) => i);

              const currentStepText = prev.plan[currentStepIdx] || t('chat.makingChanges');

              return {
                ...prev,
                status: `${t('chat.makingChanges')}: ${currentStepText}`,
                currentStep: currentStepIdx,
                completedSteps,
                stepFiles: updatedStepFiles
              };
            });

            setFileActivities(prev => {
              const exists = prev.find(f => f.name === fileName);
              if (exists) {
                return prev.map(f => f.name === fileName ? { ...f, status: 'editing' as const } : { ...f, status: 'done' as const });
              }
              const updated = prev.map(f => ({ ...f, status: 'done' as const }));
              const action = localProject.files[fileName] ? 'edited' : 'created';
              return [...updated, { name: fileName, status: 'editing' as const, action: action as 'edited' | 'created' }];
            });
          },
          onStatusUpdate: (status) => {
            if (isCancelled.current || !isNativeGenerationStatus(status)) return;
            setStatusMessage(status);
          },
          onAgentStep: (event) => {
            if (isCancelled.current) return;
            setGenerationPhase(prev => prev ? {
              ...prev,
              agentStep: event.step,
              agentConfidence: event.confidence ?? prev.agentConfidence,
              agentIssuesCount: event.issues_count ?? prev.agentIssuesCount,
              message: event.message && isNativeGenerationStatus(event.message) ? event.message : prev.message,
            } : null);
          },
        },
        existingFilesList,
        language,
        selectedDesignSystem
      );
    } catch (error) {
      if (isCancelled.current) return;
      console.error('Generation error:', error);
      setIsGenerating(false);
      setStreamingContent('');
      setStatusMessage('');
      setGenerationPhase(null);
      setFileActivities([]);
    }
  }, [localProject, messages, updateProject, addMessage, snapshotVersion, language]);

  // Handle clarify complete - user answered all questions
  const handleClarifyComplete = useCallback((answers: Record<number, string>) => {
    if (!pendingClarifyPrompt) return;

    // Build enhanced prompt with Q&A context
    const qaContext = clarifyQuestions?.map((q, i) => 
      `Q: ${q.question}\nA: ${answers[i] || 'N/A'}`
    ).join('\n') || '';

    const enhancedPrompt = `${pendingClarifyPrompt}\n\n[User Preferences]\n${qaContext}`;

    // Clear clarify state
    setClarifyQuestions(null);
    setPendingClarifyPrompt(null);
    const savedImageUrl = pendingClarifyImageUrl;
    setPendingClarifyImageUrl(undefined);

    // Re-send as a build request (skip clarify this time)
    // We add a marker so clarify is skipped
    handleSendMessage(`${enhancedPrompt}\n\n[Referenced Files: skip-clarify]`, false, savedImageUrl);
  }, [pendingClarifyPrompt, pendingClarifyImageUrl, clarifyQuestions, handleSendMessage]);

  const handleDismissClarify = useCallback(() => {
    setClarifyQuestions(null);
    setPendingClarifyPrompt(null);
    setPendingClarifyImageUrl(undefined);
  }, []);

  const handleUpdateProject = useCallback((updates: Partial<ProjectData>) => {
    if (!localProject) return;

    setLocalProject(prev => prev ? { ...prev, ...updates } : null);

    const dbUpdates: Partial<{ name: string; description: string; files: Record<string, ProjectFile> }> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.files) dbUpdates.files = updates.files;

    if (Object.keys(dbUpdates).length > 0) {
      updateProject(localProject.id, dbUpdates);
    }
  }, [localProject, updateProject]);

  if (authLoading || projectsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('auth.loginRequired')}</h2>
        <p className="text-muted-foreground mb-6">{t('auth.loginToAccess')}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {t('auth.goToLogin')}
        </button>
      </div>
    );
  }

  if (!localProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading project...</h2>
          <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <EditorLayout
      project={localProject}
      messages={messages}
      onSendMessage={handleSendMessage}
      isGenerating={isGenerating}
      onNewProject={() => navigate('/')}
      onUpdateProject={handleUpdateProject}
      streamingContent={streamingContent}
      onVersionRestore={handleVersionRestore}
      onGoHome={() => navigate('/')}
      fileActivities={fileActivities}
      generationPhase={generationPhase}
      statusMessage={statusMessage}
      onStop={handleStopGeneration}
      currentVersion={currentVersion}
      isChatMode={isChatMode}
      suggestions={suggestions}
      clarifyQuestions={clarifyQuestions}
      onClarifyComplete={handleClarifyComplete}
      onDismissClarify={handleDismissClarify}
    />
  );
};

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    projects,
    loading: projectsLoading,
    createProject,
    updateProject,
    getProject
  } = useProjects();

  const [showAuth, setShowAuth] = useState(false);
  const [pendingBuild, setPendingBuild] = useState<{ prompt:string; projectType:'vite'|'html'; imageUrls?:string[]; buildKind:'website'|'store' } | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [localProject, setLocalProject] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [fileActivities, setFileActivities] = useState<FileActivity[]>([]);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const isCancelled = useRef(false);

  // Use chat messages hook for persistence
  const {
    messages,
    addMessage,
    setMessages,
    clearMessages
  } = useChatMessages(currentProjectId);

  // Theme is handled globally via ThemeInitializer + user toggles

  // Sync local project with DB project
  useEffect(() => {
    if (currentProjectId && !localProject) {
      const dbProject = projects.find(p => p.id === currentProjectId);
      if (dbProject) {
        setLocalProject({
          id: dbProject.id,
          name: dbProject.name,
          description: dbProject.description,
          projectType: dbProject.projectType,
          files: dbProject.files,
          isPublished: dbProject.isPublished,
          publishedSlug: dbProject.publishedSlug,
          createdAt: dbProject.createdAt,
          updatedAt: dbProject.updatedAt,
        });
      }
    }
  }, [currentProjectId, projects, localProject]);

  const handleVersionRestore = useCallback(async (files: Record<string, ProjectFile>, restoredMessages: ChatMessage[]) => {
    if (localProject) {
      setLocalProject(prev => prev ? { ...prev, files } : null);
      setMessages(restoredMessages);
      await updateProject(localProject.id, { files });
    }
  }, [localProject, setMessages, updateProject]);

  const handleStopGeneration = useCallback(() => {
    isCancelled.current = true;
    stopGeneration();
    setIsGenerating(false);
    setStatusMessage('');
    setGenerationPhase({ phase: 'complete', message: 'Generation stopped.' });
    toast({
      title: 'Generation Stopped',
      description: 'Code generation was cancelled.',
    });
  }, []);

  const handleStartBuilding = useCallback(async (prompt: string, projectType: 'vite' | 'html', _modelId?: string, imageUrls?: string[], buildKind: 'website' | 'store' = 'website') => {
    if (!user) return false;

    isCancelled.current = false;

    if (buildKind === 'store') {
      const pendingThemeRaw = sessionStorage.getItem('vivora_pending_color_theme');
      let pendingTheme: { name:string; colors:string[] } | null = null;
      try { pendingTheme = pendingThemeRaw ? JSON.parse(pendingThemeRaw) : null; } catch { pendingTheme = null; }
      toast({ title:'بنجهز محرك متجرك', description:'Vivora X بيحوّل وصفك لهوية متجر كاملة ولوحة تشغيل جاهزة.' });
      const blueprint = await generateStoreBlueprint(prompt, language, pendingTheme);
      const createdStore = await storeApi.create(prompt, blueprint);
      sessionStorage.removeItem('vivora_pending_color_theme');
      localStorage.removeItem('vivora_home_prompt');
      navigate(`/stores/${createdStore.id}/admin`);
      return true;
    }

    // The server assigns a random system name; prompts are never used as names.
    const newProject = await createProject('', 'html', {}, prompt);

    if (!newProject) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return false;
    }


    // Store pre-uploaded image URLs in sessionStorage for initial generation
    if (imageUrls && imageUrls.length > 0) {
      const normalizedImageUrls = imageUrls
        .map((u) => normalizePublicImageUrl(u))
        .filter(Boolean);

      if (normalizedImageUrls.length > 0) {
        sessionStorage.setItem(`project_image_${newProject.id}`, normalizedImageUrls[0]);
      }
    }

    // Transfer pending color theme to project-specific key
    const pendingTheme = sessionStorage.getItem('vivora_pending_color_theme');
    if (pendingTheme) {
      sessionStorage.setItem(`project_color_theme_${newProject.id}`, pendingTheme);
      sessionStorage.removeItem('vivora_pending_color_theme');
    }

    // Navigate to project page
    localStorage.removeItem('vivora_home_prompt');
    navigate(`/projects/${newProject.id}`);
    return true;
  }, [user, createProject, navigate, language]);

  useEffect(() => {
    if (!user || !pendingBuild) return;
    const request = pendingBuild;
    setPendingBuild(null);
    void handleStartBuilding(request.prompt, request.projectType, undefined, request.imageUrls, request.buildKind);
  }, [user, pendingBuild, handleStartBuilding]);

  const handleNewProject = useCallback(() => {
    setCurrentProjectId(null);
    setLocalProject(null);
    clearMessages();
    setCurrentVersion(null);
    navigate('/');
  }, [clearMessages, navigate]);

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle build attempt - require login if not authenticated
  const handleBuildAttempt = async (prompt: string, projectType: 'vite' | 'html', _modelId?: string, imageUrls?: string[], buildKind: 'website' | 'store' = 'website') => {
    if (!user) {
      setPendingBuild({ prompt, projectType, imageUrls, buildKind });
      setShowAuth(true);
      return false;
    }
    try { return await handleStartBuilding(prompt, projectType, undefined, imageUrls, buildKind); }
    catch (error) { toast({ title:'تعذّر إنشاء المتجر', description:(error as Error).message, variant:'destructive' }); return false; }
  };

  // Show auth page only if explicitly requested
  if (showAuth && !user) {
    return <AuthPage onSuccess={() => setShowAuth(false)} />;
  }

  // Home view
  return (
    <HomePage
      onStartBuilding={handleBuildAttempt}
      onShowAuth={() => setShowAuth(true)}
    />
  );
};

import Settings from "@/pages/Settings";
import FAQ from "@/pages/FAQ";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
// AdminPanel already imported at the top

import { MaintenanceScreen } from "@/components/shared/MaintenanceScreen";
import { SiteMessagePopup } from "@/components/shared/SiteMessagePopup";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <MaintenanceScreen>
          <ThemeInitializer />
          <FloatingMusicPlayer />
          <SiteMessagePopup />
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<AuthPage onSuccess={() => {
                const onboardingDone = localStorage.getItem('onboarding_completed');
                window.location.href = onboardingDone ? '/' : '/get-started';
              }} />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/projects/:id" element={<ProjectEditorRoute />} />
              <Route path="/projects/:id/settings" element={<Navigate to="/" replace />} />
              <Route path="/view/:projectId" element={<Navigate to="/" replace />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/shop/:slug" element={<Storefront />} />
              <Route path="/stores/:id/admin" element={<StoreAdmin />} />
              <Route path="/stores" element={<StoreHub />} />
              <Route path="/blog" element={<Navigate to="/" replace />} />
              <Route path="/blog/:slug" element={<Navigate to="/" replace />} />
              <Route path="/get-started" element={<Navigate to="/" replace />} />
              <Route path="/" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
          </MaintenanceScreen>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
