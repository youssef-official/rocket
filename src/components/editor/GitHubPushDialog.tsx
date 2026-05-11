import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink, Loader2, Check, X,
  Upload, RefreshCw, AlertCircle, Copy, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/types';
import githubLogo from '@/assets/logos/github.svg';

interface GitHubPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectFiles: Record<string, ProjectFile>;
  projectId: string | null;
  existingRepoUrl: string | null;
}

type PushStep = 'input' | 'pushing' | 'success' | 'error';

export const GitHubPushDialog: React.FC<GitHubPushDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  projectFiles,
  projectId,
  existingRepoUrl,
}) => {
  const { integrations, pushToGitHub } = useIntegrations();
  const [step, setStep] = useState<PushStep>('input');
  const [repoName, setRepoName] = useState('');
  const [repoUrl, setRepoUrl] = useState<string | null>(existingRepoUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('input');
      setErrorMessage(null);
      setRepoUrl(existingRepoUrl);
      const slug = projectName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40);
      setRepoName(slug);
    }
  }, [open, projectName, existingRepoUrl]);

  const handlePush = async () => {
    if (!integrations?.github_token) {
      toast({ title: 'GitHub Not Connected', description: 'Connect GitHub in Settings first.', variant: 'destructive' });
      return;
    }
    if (!repoName.trim()) return;

    setStep('pushing');
    setErrorMessage(null);

    try {
      const filesPayload: Record<string, { content: string }> = {};
      Object.entries(projectFiles).forEach(([path, file]) => {
        filesPayload[path] = { content: file.content };
      });

      const commitMsg = existingRepoUrl ? 'Update from Vivora X' : 'Initial commit from Vivora X';
      const result = await pushToGitHub(repoName, filesPayload, commitMsg);

      if (result) {
        setRepoUrl(result.repo_url);
        setStep('success');

        if (projectId) {
          await supabase.from('projects').update({ github_repo_url: result.repo_url }).eq('id', projectId);
        }
      } else {
        throw new Error('Push failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unknown error');
      setStep('error');
    }
  };

  const handleCopyUrl = () => {
    if (repoUrl) {
      navigator.clipboard.writeText(repoUrl);
      toast({ title: 'Copied!', description: 'Repository URL copied to clipboard' });
    }
  };

  const isUpdate = !!existingRepoUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/40 shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border/40" style={{ background: 'linear-gradient(180deg, hsl(var(--foreground) / 0.04) 0%, transparent 100%)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--foreground) / 0.1), hsl(var(--foreground) / 0.03))', border: '1px solid hsl(var(--foreground) / 0.1)' }}>
                <img src={githubLogo} alt="GitHub" className="w-5 h-5 dark:invert" />
              </div>
              <div>
                <span>{step === 'success' ? '🎉 Pushed!' : isUpdate ? 'Update Repository' : 'Push to GitHub'}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {step === 'input' && (isUpdate ? 'Push latest changes to your repository' : 'Create a new repository and push your code')}
                  {step === 'pushing' && 'Pushing your code...'}
                  {step === 'success' && 'Your code is on GitHub!'}
                  {step === 'error' && 'Something went wrong'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {step === 'input' && !integrations?.github_connected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">GitHub not connected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add your GitHub token in Settings → Integrations</p>
                </div>
              </div>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full gap-2 rounded-xl">
                Go to Settings to connect GitHub
              </Button>
            </div>
          )}

          {step === 'input' && integrations?.github_connected && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repository name</Label>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/60 bg-secondary/40 focus-within:border-primary/40 focus-within:bg-secondary/60 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 2px hsl(var(--foreground) / 0.03)' }}>
                  <img src={githubLogo} alt="GitHub" className="w-4 h-4 dark:invert flex-shrink-0 opacity-60" />
                  <span className="text-sm text-muted-foreground font-mono">{integrations.github_username}/</span>
                  <Input
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-project"
                    className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 shadow-none"
                  />
                </div>
              </div>
              <Button onClick={handlePush} disabled={!repoName.trim()} className="w-full gap-2.5 rounded-xl h-12 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200">
                <GitBranch className="w-4 h-4" />
                {isUpdate ? 'Update Repository' : 'Create & Push'}
              </Button>
            </div>
          )}

          {step === 'pushing' && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Pushing to GitHub...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Creating commits and uploading files</p>
              </div>
            </div>
          )}

          {step === 'success' && repoUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-foreground">Code pushed successfully! 🎉</p>
              </div>
              <div
                className="flex items-center gap-3 p-4 bg-secondary/60 rounded-xl border border-border/60 cursor-pointer hover:bg-accent transition-colors group"
                onClick={() => window.open(repoUrl, '_blank')}
              >
                <img src={githubLogo} alt="GitHub" className="w-5 h-5 dark:invert flex-shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{repoUrl}</span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }} className="p-1.5 rounded-lg hover:bg-background transition-colors">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep('input')} variant="outline" className="flex-1 rounded-xl" size="sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Push Again
                </Button>
                <Button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl" size="sm">Done</Button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Push failed</p>
                  {errorMessage && <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>}
                </div>
              </div>
              <Button onClick={() => setStep('input')} variant="outline" className="w-full rounded-xl" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
