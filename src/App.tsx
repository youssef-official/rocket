import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AuthPage } from "@/components/auth/AuthPage";
import { HomePage } from "@/components/home/HomePage";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ProjectsDashboard } from "@/components/dashboard/ProjectsDashboard";
import { AdminPanel } from "@/pages/Admin";
import { ThemeInitializer } from "@/components/shared/ThemeInitializer";
import { useProjects } from "@/hooks/useProjects";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useVersions } from "@/hooks/useVersions";
import { useBackgroundJobs, type GenerationJob } from "@/hooks/useBackgroundJobs";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  streamAICodeGeneration,
  parseAIResponse,
  generateDefaultViteProject,
  generateExplanation,
  stopGeneration,
  generateProjectName,
  generateSuggestions,
  deductPointsAfterGeneration,
  type Suggestion
} from "@/services/aiService";
import { calculateRequestCredits } from "@/services/directAiService";
import type { ProjectData, ChatMessage, ProjectFile } from "@/types";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image';
}

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

// Project Editor wrapper component for route /projects/:id
const ProjectEditorRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading, updateProject, getProject } = useProjects();

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
  const isCancelled = useRef(false);
  const lastAssistantMessageId = useRef<string | null>(null);

  // Use chat messages hook for persistence
  const {
    messages,
    loading: messagesLoading,
    addMessage,
    updateMessage,
    setMessages,
    clearMessages
  } = useChatMessages(id || null);

  const { createVersion } = useVersions(id || null);

  // Background jobs - handles generation when tab is closed
  const handleJobComplete = useCallback(async (job: GenerationJob) => {
    if (!job.resultFiles || !localProject) return;
    // Apply the result files to local project
    setLocalProject(prev => prev ? { ...prev, files: job.resultFiles as any } : null);
    // Add completion message to chat
    if (job.resultMessage) {
      await addMessage('assistant', job.resultMessage, undefined, job.resultActions || []);
    }
    clearActiveJob();
  }, [localProject, addMessage]);

  const { activeJob, isBackgroundProcessing, createBackgroundJob, clearActiveJob } = useBackgroundJobs({
    projectId: id || null,
    onJobComplete: handleJobComplete,
  });


  useEffect(() => {
    if (id && !projectsLoading && projects.length > 0) {
      const dbProject = projects.find(p => p.id === id);
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
      } else {
        // Project not found, redirect to home
        navigate('/');
      }
    }
  }, [id, projects, projectsLoading, navigate]);

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

        // Get the selected model from sessionStorage
        const savedModelId = sessionStorage.getItem(`project_model_${localProject.id}`) || 'rok-fast';

        // Get any uploaded image URL from sessionStorage
        const savedImageUrl = sessionStorage.getItem(`project_image_${localProject.id}`);
        if (savedImageUrl) {
          sessionStorage.removeItem(`project_image_${localProject.id}`);
        }

        // Add user message and AWAIT it to ensure it's saved in the database
        await addMessage('user', prompt, savedImageUrl || undefined);
        setIsGenerating(true);
        setStreamingContent('');
        setFileActivities([]);
        setStatusMessage(t('chat.analyzing'));
        setGenerationPhase({ phase: 'planning', message: t('chat.analyzing') });

        // Generate project name in background (don't block UI)
        generateProjectName(prompt).then(async (generatedName) => {
          try {
            await updateProject(localProject.id, { name: generatedName });
            setLocalProject(prev => prev ? { ...prev, name: generatedName } : null);
          } catch (e) {
            console.error('Failed to update project name:', e);
          }
        }).catch((e) => {
          console.error('Failed to generate project name:', e);
        });

        try {
          // Step 1: Thinking phase
          const thinkingStartTime = Date.now();
          setStatusMessage(t('chat.thinking'));
          setGenerationPhase({ phase: 'thinking', message: t('chat.thinking'), thinkingTime: 0 });

          // Update thinking time every second
          const thinkingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
            setGenerationPhase(prev => prev ? { ...prev, thinkingTime: elapsed } : null);
          }, 1000);

          let explanation = '';
          try {
            explanation = await generateExplanation(prompt, localProject.projectType);
          } catch (e) {
            explanation = "I'll create something amazing for you!";
          }

          clearInterval(thinkingInterval);
          const finalThinkingTime = Math.floor((Date.now() - thinkingStartTime) / 1000);

          // Parse plan from explanation
          const planLines = explanation.split('\n')
            .filter(line => /^\d+\.|^•|^\*/.test(line.trim()))
            .map(line => line.replace(/^\d+\.\s*|^•\s*|^\*\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 6);

          // Save plan to database
          await updateProject(localProject.id, {
            description: prompt,
            buildingPlan: planLines,
            generationStatus: 'generating',
          });

          setGenerationPhase({
            phase: 'thinking',
            message: t('chat.thinkingComplete'),
            thinkingTime: finalThinkingTime,
            plan: planLines,
            completedSteps: [],
            currentStep: 0,
            stepFiles: {}
          });

          if (isCancelled.current) return;

          // Add explanation message for initial generation (keep it SHORT)
          const assistantId = crypto.randomUUID();
           const planIntro = '### **What I will build:**';
           const planContent = planLines.length > 0
             ? `${planIntro}\n${planLines.slice(0, 4).map((line) => `- ${line}`).join('\n')}\n\n`
             : '';
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

          // Add "Analyzing image" activity if image was uploaded
          if (savedImageUrl) {
            const isDesignRef = prompt.toLowerCase().includes('design') || prompt.toLowerCase().includes('تصميم') || prompt.toLowerCase().includes('mockup') || prompt.toLowerCase().includes('صفحة');
            const imgFileName = savedImageUrl.split('/').pop() || 'uploaded-image';
            setFileActivities([{
              name: isDesignRef ? `Design Reference: ${imgFileName}` : imgFileName,
              status: 'done',
              action: 'analyzed_image'
            }]);
          }

          // DEDUCT CREDITS BEFORE generation (first version = 2 credits)
          if (user) {
            try {
              const { calculateCreditsByFileCount } = await import('@/services/directAiService');
              const creditsToDeduct = calculateCreditsByFileCount(0, true); // isFirstVersion = true → 2 credits
              await deductPointsAfterGeneration(
                user.id,
                localProject.id,
                `Initial generation`,
                creditsToDeduct
              );
              queryClient.invalidateQueries({ queryKey: ['userPlan'] });
            } catch (e) {
              console.error('Failed to pre-deduct credits:', e);
            }
          }

          // Build prompt with safety rules
          const userPrompt = `${prompt}\n\n[STRICT RULE: Every component used MUST be imported. If you use <AnimatePresence>, you MUST add: import { motion, AnimatePresence } from "framer-motion"; at the top of the file. NO EXCEPTIONS.]`;

          const aiMessages: any[] = [{ role: 'user', content: userPrompt }];
          if (savedImageUrl) {
            aiMessages[0].imageUrls = [savedImageUrl];
          }

          await streamAICodeGeneration(
            aiMessages,
            localProject.projectType,
            {
              onChunk: (chunk) => {
                if (isCancelled.current) return;
                fullResponse += chunk;
                setStreamingContent(fullResponse);

                // Live file detection (JSON + <FILE> blocks)
                const markFile = (fileNameRaw: string) => {
                  const fileName = (fileNameRaw || '').trim();
                  if (!fileName || detectedFiles.has(fileName)) return;
                  detectedFiles.add(fileName);

                  setFileActivities(prev => {
                    const exists = prev.find(f => f.name === fileName);
                    if (exists) return prev;
                    return [
                      ...prev.map(f => ({ ...f, status: 'done' as const })),
                      { name: fileName, status: 'editing' as const, action: 'created' as const }
                    ];
                  });
                };

                const jsonPathMatches = fullResponse.match(/"([^"]+\.(tsx?|jsx?|css|json|html|md))"\s*:/g);
                if (jsonPathMatches) {
                  jsonPathMatches.forEach(m => markFile(m.replace(/["':]/g, '')));
                }

                const fileBlockMatches = Array.from(fullResponse.matchAll(/<FILE\s+path=("|')([^"']+)\1>/g));
                if (fileBlockMatches.length > 0) {
                  fileBlockMatches.forEach(m => markFile(m[2]));
                }
              },
              onComplete: async (response) => {
                if (isCancelled.current) return;

                const { files, fileList, actionsTaken } = parseAIResponse(response);

                const activities = actionsTaken && actionsTaken.length > 0
                  ? actionsTaken
                  : fileList.map(name => ({
                    name,
                    status: 'done' as const,
                    action: 'created' as const
                  }));
                // Preserve initial "Analyzing" activities at the top
                setFileActivities(prev => {
                  const analyzingActivities = prev.filter(a => a.action === 'analyzed_image');
                  return [...analyzingActivities, ...activities];
                });

                // Distribute files across plan steps
                const filesPerStep = Math.ceil(fileList.length / Math.max(planLines.length, 1));
                const stepFilesMap: Record<number, string[]> = {};
                fileList.forEach((file, idx) => {
                  const stepIdx = Math.min(Math.floor(idx / filesPerStep), planLines.length - 1);
                  if (!stepFilesMap[stepIdx]) stepFilesMap[stepIdx] = [];
                  stepFilesMap[stepIdx].push(file);
                });

                let finalFiles = Object.keys(files).length > 0
                  ? { ...localProject.files, ...files }
                  : localProject.files;

                await updateProject(localProject.id, {
                  files: finalFiles,
                  generationStatus: 'complete'
                });
                setLocalProject(prev => prev ? { ...prev, files: finalFiles } : null);

                // Mark all steps as complete
                const allStepsComplete = planLines.map((_, i) => i);

                // Create summary
                const summary = `✅ Project created successfully! Created ${activities.length} file${activities.length > 1 ? 's' : ''}. Your project is ready to use!`;

                // Update original explanation message instead of adding a new one
                if (assistantId) {
                  const finalContent = explanationMessage
                    .replace(/\*\*Now I['']ll start building\.\.\.\*\*/gi, '')
                    .replace(/Now I['']ll start building\.\.\./gi, '')
                    .trim() + '\n\n' + summary;

                  await updateMessage(assistantId, {
                    content: finalContent,
                    actionsTaken: activities
                  });
                } else {
                  await addMessage('assistant', summary, undefined, activities);
                }

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

                // Credits already deducted before generation started

                // Generate suggestions after completion
                if (localProject.description) {
                  generateSuggestions(localProject.description).then(setSuggestions);
                }
              },
              onError: async (error) => {
                console.error('AI error:', error);
                await addMessage('assistant', `I encountered an error: ${error.message}. I've created a starter template for you.`);
                setIsGenerating(false);
                setStreamingContent('');
                setStatusMessage('');
                setGenerationPhase(null);
                setFileActivities([]);
              },
              onFileStart: (fileName) => {
                if (isCancelled.current) return;

                // Calculate which step we're on based on file count
                setGenerationPhase(prev => {
                  if (!prev || !prev.plan) return prev;

                  const currentFiles = prev.stepFiles || {};
                  const totalFiles = Object.values(currentFiles).flat().length;
                  const filesPerStep = Math.ceil(15 / Math.max(prev.plan.length, 1)); // Estimate 15 files
                  const currentStepIdx = Math.min(Math.floor(totalFiles / filesPerStep), prev.plan.length - 1);

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
                if (isCancelled.current) return;
                setStatusMessage(status);
              },
            }
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
  }, [localProject, messages, hasStartedGeneration, addMessage, updateProject]);

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

    const imageUrls = imageUrl ? imageUrl.split(',').filter(Boolean) : [];

    isCancelled.current = false;

    // Get the selected model from sessionStorage
    const savedModelId = sessionStorage.getItem(`project_model_${localProject.id}`) || 'rok-fast';

    // Add user message and AWAIT it to ensure it's saved in the database
    await addMessage('user', content, imageUrl);

    // If chat-only mode, just respond conversationally without code generation
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

    // Build mode - check credits BEFORE generating
    if (user) {
      const { checkCreditsAvailable } = await import('@/services/creditService');
      const hasCredits = await checkCreditsAvailable(user.id);
      if (!hasCredits) {
        const { toast } = await import('sonner');
        toast.error(t('credits.noCredits'));
        return;
      }
    }

    setIsChatMode(false);
    setIsGenerating(true);
    setStreamingContent('');
    setStatusMessage(t('chat.analyzing'));
    setGenerationPhase({ phase: 'planning', message: t('chat.analyzing') });

    // Add "Analyzing image/file" activities for uploaded files
    const initialActivities: FileActivity[] = [];
    if (imageUrl) {
      const urls = imageUrl.split(',').filter(Boolean);
      urls.forEach(url => {
        const fileMetaMatch = url.match(/\[FILE:(\w+):([^\]]+)\]/);
        if (fileMetaMatch) {
          initialActivities.push({
            name: `Analyzing: ${fileMetaMatch[2]}`,
            status: 'done',
            action: 'analyzed_image'
          });
        } else {
          const imgName = url.split('/').pop() || 'uploaded-image';
          const isDesignRef = content.toLowerCase().includes('design') || content.toLowerCase().includes('تصميم') || content.toLowerCase().includes('mockup') || content.toLowerCase().includes('مثل');
          initialActivities.push({
            name: isDesignRef ? `Analyzing design: ${imgName}` : `Analyzing image: ${imgName}`,
            status: 'done',
            action: 'analyzed_image'
          });
        }
      });
    }
    setFileActivities(initialActivities);

    try {
      // Step 1: Thinking phase
      const thinkingStartTime = Date.now();
      if (isCancelled.current) return;
      setStatusMessage(t('chat.thinking'));
      setGenerationPhase({ phase: 'thinking', message: t('chat.thinking'), thinkingTime: 0 });

      // Update thinking time every second
      const thinkingInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
        setGenerationPhase(prev => prev ? { ...prev, thinkingTime: elapsed } : null);
      }, 1000);

      let explanation = '';
      try {
        explanation = await generateExplanation(content, localProject.projectType);
      } catch (e) {
        explanation = "I'll make those changes for you!";
      }

      clearInterval(thinkingInterval);
      const finalThinkingTime = Math.floor((Date.now() - thinkingStartTime) / 1000);

      // Parse plan from explanation
      const planLines = explanation.split('\n')
        .filter(line => /^\d+\.|^•|^\*/.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*|^•\s*|^\*\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 6);

      setGenerationPhase({
        phase: 'thinking',
        message: t('chat.thinkingComplete'),
        thinkingTime: finalThinkingTime,
        plan: planLines,
        completedSteps: [],
        currentStep: 0,
        stepFiles: {}
      });

      if (isCancelled.current) return;

      // Add the explanation message (keep it SHORT)
      const assistantId = crypto.randomUUID();
      const planContent = planLines.length > 0
        ? `### **What I'm Building (Short):**\n${planLines.slice(0, 4).map((line, i) => `${i + 1}. ${line}`).join('\n')}\n\n`
        : '';
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
          imageUrls: m.imageUrl ? m.imageUrl.split(',').filter(Boolean) : undefined
        })),
        {
          role: 'user' as const,
          content: localProject.files['public/logo.png']
            ? `${content}\n\nNOTE: The project logo is available at "/public/logo.png".`
            : content,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        },
      ];

      let fullResponse = '';
      const detectedFiles = new Set<string>();

      // DEDUCT CREDITS BEFORE generation (1 credit pre-deduct, adjusted after by file count)
      if (user) {
        try {
          await deductPointsAfterGeneration(user.id, localProject.id, `Pre-deduct: ${content.slice(0, 50)}`, 1);
          queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        } catch (e) {
          console.error('Failed to pre-deduct credits:', e);
        }
      }

      // Pass existing file list so AI knows what files exist and can do targeted edits
      const existingFilesList = Object.keys(localProject.files);

      await streamAICodeGeneration(
        conversationHistory,
        localProject.projectType,
        {
          onChunk: (chunk) => {
            if (isCancelled.current) return;
            fullResponse += chunk;
            setStreamingContent(fullResponse);

            // Live file detection (JSON + <FILE> blocks)
            const markFile = (fileNameRaw: string) => {
              const fileName = (fileNameRaw || '').trim();
              if (!fileName || detectedFiles.has(fileName)) return;
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

            const jsonPathMatches = fullResponse.match(/"([^"]+\.(tsx?|jsx?|css|json|html|md))"\s*:/g);
            if (jsonPathMatches) jsonPathMatches.forEach(m => markFile(m.replace(/["':]/g, '')));

            const fileBlockMatches = Array.from(fullResponse.matchAll(/<FILE\s+path=("|')([^"']+)\1>/g));
            if (fileBlockMatches.length > 0) fileBlockMatches.forEach(m => markFile(m[2]));
          },
          onComplete: async (response) => {
            if (isCancelled.current) return;

            const { files: newFiles, fileList, actionsTaken } = parseAIResponse(response);

            // Update file activities
            const activities = actionsTaken && actionsTaken.length > 0
              ? actionsTaken.map(a => ({ ...a, status: 'done' as const }))
              : fileList.map(name => ({
                name,
                status: 'done' as const,
                action: (localProject.files[name] ? 'edited' : 'created') as 'edited' | 'created'
              }));
            // Preserve initial "Analyzing" activities at the top
            setFileActivities(prev => {
              const analyzingActivities = prev.filter(a => a.action === 'analyzed_image');
              return [...analyzingActivities, ...activities];
            });

            // Distribute files across plan steps
            const filesPerStep = Math.ceil(fileList.length / Math.max(planLines.length, 1));
            const stepFilesMap: Record<number, string[]> = {};
            fileList.forEach((file, idx) => {
              const stepIdx = Math.min(Math.floor(idx / filesPerStep), planLines.length - 1);
              if (!stepFilesMap[stepIdx]) stepFilesMap[stepIdx] = [];
              stepFilesMap[stepIdx].push(file);
            });

            if (Object.keys(newFiles).length > 0) {
              const mergedFiles = { ...localProject.files, ...newFiles };
              await updateProject(localProject.id, { files: mergedFiles });
              setLocalProject(prev => prev ? { ...prev, files: mergedFiles } : null);
            }

            // Credits already deducted before generation started

            // Mark all steps as complete
            const allStepsComplete = planLines.map((_, i) => i);

            // Create summary
            const editedCount = activities.filter(a => a.action === 'edited').length;
            const createdCount = activities.filter(a => a.action === 'created').length;
            const summary = `✅ Completed! ${createdCount > 0 ? `Created ${createdCount} file${createdCount > 1 ? 's' : ''}` : ''}${createdCount > 0 && editedCount > 0 ? ' and ' : ''}${editedCount > 0 ? `edited ${editedCount} file${editedCount > 1 ? 's' : ''}` : ''}. Your project is ready!`;

            // Update original explanation message instead of adding a new one
            if (assistantId) {
              const finalContent = explanationMessage
                .replace(/\*\*Now I['']ll start building\.\.\.\*\*/gi, '')
                .replace(/Now I['']ll start building\.\.\./gi, '')
                .trim() + '\n\n' + summary;

              await updateMessage(assistantId, {
                content: finalContent,
                actionsTaken: activities
              });
            } else {
              await addMessage('assistant', summary, undefined, activities);
            }

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

            // Version creation is handled by EditorLayout's auto-create on generation complete

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
            await addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
            setIsGenerating(false);
            setStreamingContent('');
            setStatusMessage('');
            setGenerationPhase(null);
            setFileActivities([]);
          },
          onFileStart: (fileName) => {
            if (isCancelled.current) return;

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
            if (isCancelled.current) return;
            setStatusMessage(status);
          },
        },
        existingFilesList.join(', ')
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
  }, [localProject, messages, updateProject, addMessage]);

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
      onViewDashboard={() => navigate('/dashboard')}
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
      isBackgroundProcessing={isBackgroundProcessing}
      backgroundJobStatus={activeJob?.status}
    />
  );
};

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    projects,
    loading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    forkProject,
    getProject
  } = useProjects();

  const [showAuth, setShowAuth] = useState(false);
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

  const handleStartBuilding = useCallback(async (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageFile?: File) => {
    if (!user) return;

    isCancelled.current = false;

    // Create project in DB first
    const projectName = prompt.slice(0, 50) || 'New Project';
    const defaultFiles = projectType === 'vite'
      ? generateDefaultViteProject()
      : {};

    const newProject = await createProject(projectName, projectType, defaultFiles, prompt);

    if (!newProject) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return;
    }

    // Store selectedModel in sessionStorage so it can be used when generating
    if (modelId) {
      sessionStorage.setItem(`project_model_${newProject.id}`, modelId);
    }

    // Upload image and store URL in sessionStorage for initial generation
    if (imageFile) {
      try {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile);

        if (!error) {
          const { data: urlData } = supabase.storage
            .from('chat-images')
            .getPublicUrl(fileName);
          sessionStorage.setItem(`project_image_${newProject.id}`, urlData.publicUrl);
        }
      } catch (e) {
        console.error('Failed to upload image:', e);
      }
    }

    // Navigate to project page
    navigate(`/projects/${newProject.id}`);
  }, [user, createProject, navigate]);

  const handleOpenProject = useCallback((id: string) => {
    navigate(`/projects/${id}`);
  }, [navigate]);

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
  const handleBuildAttempt = async (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageFile?: File) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    await handleStartBuilding(prompt, projectType, modelId, imageFile);
  };

  // Show auth page only if explicitly requested
  if (showAuth && !user) {
    return <AuthPage onSuccess={() => setShowAuth(false)} />;
  }

  // Home view
  return (
    <HomePage
      onStartBuilding={handleBuildAttempt}
      onViewDashboard={() => navigate('/dashboard')}
      onOpenProject={handleOpenProject}
      onDeleteProject={deleteProject}
      onForkProject={async (id) => {
        const forked = await forkProject(id);
        if (forked) {
          handleOpenProject(forked.id);
        }
      }}
      onShowAuth={() => setShowAuth(true)}
      projects={projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        projectType: p.projectType,
        isPublished: p.isPublished,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))}
      projectsLoading={projectsLoading}
    />
  );
};

// Dashboard wrapper
const DashboardRoute = () => {
  const navigate = useNavigate();
  const { projects, loading, deleteProject, forkProject } = useProjects();

  return (
    <ProjectsDashboard
      projects={projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        projectType: p.projectType,
        isPublished: p.isPublished,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))}
      onNewProject={() => navigate('/')}
      onOpenProject={(id) => navigate(`/projects/${id}`)}
      onDeleteProject={deleteProject}
      onForkProject={async (id) => {
        const forked = await forkProject(id);
        if (forked) {
          navigate(`/projects/${forked.id}`);
        }
      }}
    />
  );
};

import { Pricing } from "@/pages/Pricing";
import { Docs } from "@/pages/Docs";
import Settings from "@/pages/Settings";
import { ProjectView } from "@/pages/ProjectView";
import { OAuthConsent } from "@/pages/OAuthConsent";
import { VercelOAuthCallback } from "@/pages/VercelCallback";
import FAQ from "@/pages/FAQ";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import { NewVibeTool } from "@/pages/NewVibeTool";
import AiForAll from "@/pages/AiForAll";
import SupabaseConnect from "@/pages/SupabaseConnect";
// AdminPanel already imported at the top

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <ThemeInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage onSuccess={() => window.location.href = '/'} />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/projects/:id" element={<ProjectEditorRoute />} />
              <Route path="/view/:projectId" element={<ProjectView />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/new-vibe-tool" element={<NewVibeTool />} />
              <Route path="/oauth/consent" element={<OAuthConsent />} />
              <Route path="/oauth/vercel/callback" element={<VercelOAuthCallback />} />
              <Route path="/ai-for-all" element={<AiForAll />} />
              <Route path="/supabase-connect" element={<SupabaseConnect />} />
              <Route path="/" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
