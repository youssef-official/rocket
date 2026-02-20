import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface GenerationJob {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  mode: string;
  resultFiles?: Record<string, any>;
  resultMessage?: string;
  resultActions?: any[];
  creditsUsed?: number;
  errorMessage?: string;
  createdAt: string;
}

interface UseBackgroundJobsOptions {
  projectId: string | null;
  onJobComplete?: (job: GenerationJob) => void;
}

export function useBackgroundJobs({ projectId, onJobComplete }: UseBackgroundJobsOptions) {
  const { user } = useAuth();
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  const onJobCompleteRef = useRef(onJobComplete);
  onJobCompleteRef.current = onJobComplete;

  // Check for any pending/processing jobs when project loads
  const checkExistingJobs = useCallback(async () => {
    if (!projectId || !user) return;

    try {
      const { data } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const job = data[0];
        setActiveJob(mapJob(job));
        setIsBackgroundProcessing(true);
      }
    } catch (e) {
      console.error('Error checking existing jobs:', e);
    }
  }, [projectId, user]);

  // Subscribe to realtime updates for this project's jobs
  useEffect(() => {
    if (!projectId || !user) return;

    // Check for existing jobs first
    checkExistingJobs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`generation_jobs_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const jobData = payload.new as any;
          if (!jobData) return;

          const job = mapJob(jobData);
          setActiveJob(job);

          if (job.status === 'processing') {
            setIsBackgroundProcessing(true);
          } else if (job.status === 'done') {
            setIsBackgroundProcessing(false);
            // Notify user if tab was in background
            if (document.visibilityState === 'hidden') {
              try {
                new Notification('✅ VivoraX - اكتملت المهمة!', {
                  body: 'تم توليد الكود بنجاح في الخلفية.',
                  icon: '/favicon.svg',
                });
              } catch {}
            }
            toast({
              title: '✅ اكتملت المهمة',
              description: job.resultMessage?.slice(0, 100) || 'تم توليد الكود في الخلفية',
            });
            onJobCompleteRef.current?.(job);
          } else if (job.status === 'error') {
            setIsBackgroundProcessing(false);
            toast({
              title: '❌ خطأ في التوليد',
              description: job.errorMessage || 'حدث خطأ أثناء التوليد في الخلفية',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user, checkExistingJobs]);

  // Create a new background job and trigger the edge function
  const createBackgroundJob = useCallback(async (
    messages: any[],
    mode: string = 'code'
  ): Promise<string | null> => {
    if (!projectId || !user) return null;

    try {
      // Insert job record
      const { data: job, error } = await supabase
        .from('generation_jobs')
        .insert({
          user_id: user.id,
          project_id: projectId,
          status: 'pending',
          mode,
          messages: messages as any,
        })
        .select()
        .single();

      if (error || !job) {
        console.error('Error creating job:', error);
        return null;
      }

      setActiveJob(mapJob(job));
      setIsBackgroundProcessing(true);

      // Trigger the edge function asynchronously (fire and forget)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Use keepalive to ensure request survives tab close
      fetch(`${supabaseUrl}/functions/v1/background-generate`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ job_id: job.id }),
      }).catch(e => console.error('Background job trigger error:', e));

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return job.id;
    } catch (e) {
      console.error('Error creating background job:', e);
      return null;
    }
  }, [projectId, user]);

  // Clear active job (after results are applied)
  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
    setIsBackgroundProcessing(false);
  }, []);

  return {
    activeJob,
    isBackgroundProcessing,
    createBackgroundJob,
    clearActiveJob,
  };
}

function mapJob(data: any): GenerationJob {
  return {
    id: data.id,
    projectId: data.project_id,
    status: data.status,
    mode: data.mode,
    resultFiles: data.result_files,
    resultMessage: data.result_message,
    resultActions: data.result_actions,
    creditsUsed: data.credits_used,
    errorMessage: data.error_message,
    createdAt: data.created_at,
  };
}
