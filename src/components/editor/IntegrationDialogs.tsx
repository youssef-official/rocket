import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, ExternalLink, Loader2, Check, X, Link2, 
  Upload, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useLanguage } from '@/contexts/LanguageContext';
import { createGitHubRepo, uploadFilesToGitHub } from '@/services/githubService';
import { deployToVercel, getDeploymentStatus } from '@/services/vercelService';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';
import vercelLogo from '@/assets/logos/vercel.svg';

interface GitHubConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectFiles: Record<string, ProjectFile>;
  onConnected?: (repoUrl: string) => void;
}

export const GitHubConnectDialog: React.FC<GitHubConnectDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  projectFiles,
  onConnected,
}) => {
  const { integrations } = useIntegrations();
  const { t } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [customRepoName, setCustomRepoName] = useState(projectName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!integrations?.github_token) {
      toast({
        title: t('integrations.githubNotConnected'),
        description: t('integrations.githubConnectSettings'),
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create repo
      const repo = await createGitHubRepo(
        integrations.github_token,
        customRepoName,
        `Built with Rocket 🚀 - ${projectName}`
      );

      if (!repo) {
        throw new Error('Failed to create repository');
      }

      // Upload files
      const success = await uploadFilesToGitHub(
        integrations.github_token,
        repo.full_name,
        projectFiles,
        'Initial commit from Rocket 🚀'
      );

      if (!success) {
        throw new Error('Failed to upload files');
      }

      setRepoUrl(repo.html_url);
      onConnected?.(repo.html_url);

      toast({
        title: t('integrations.githubConnected'),
        description: t('integrations.syncDesc'),
      });
    } catch (err: any) {
      setError(err.message || t('common.error'));
      toast({
        title: t('common.error'),
        description: err.message || t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            {t('editor.connectGitHub')}
          </DialogTitle>
          <DialogDescription>
            {repoUrl ? (
              t('integrations.githubConnected')
            ) : (
              t('integrations.githubConnectDesc')
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!integrations?.github_connected ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('integrations.githubNotConnected')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('integrations.goToSettingsGithub')}
                </p>
              </div>
            </div>
          ) : repoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Check className="w-5 h-5 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('integrations.connected')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.syncAuto')}
                  </p>
                </div>
              </div>

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">{repoUrl.split('/').slice(-2).join('/')}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>

              <p className="text-xs text-muted-foreground text-center">
                {t('integrations.syncDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">@{integrations?.github_username}</p>
                    <p className="text-xs text-muted-foreground">{t('integrations.connectedAccount')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('editor.repoName')}</Label>
                  <Input
                    value={customRepoName}
                    onChange={(e) => setCustomRepoName(e.target.value)}
                    placeholder={t('editor.repoName')}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('integrations.creatingRepo')}
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    {t('integrations.connectProject')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface VercelDeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectFiles: Record<string, ProjectFile>;
  onDeployed?: (url: string) => void;
}

export const VercelDeployDialog: React.FC<VercelDeployDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  projectFiles,
  onDeployed,
}) => {
  const { integrations } = useIntegrations();
  const { t } = useLanguage();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);
  const [customName, setCustomName] = useState(projectName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustomName(projectName);
  }, [projectName]);

  const handleDeploy = async () => {
    if (!integrations?.vercel_token) {
      toast({
        title: t('integrations.vercelNotConnected'),
        description: t('integrations.vercelConnectSettings'),
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentStatus(t('integrations.deploying'));

    try {
      const deployment = await deployToVercel(
        integrations.vercel_token,
        customName,
        projectFiles
      );

      if (!deployment) {
        throw new Error('Failed to create deployment');
      }

      setDeploymentUrl(deployment.url);
      setDeploymentStatus(t('common.loading'));

      // Poll for deployment status
      const pollStatus = async () => {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max

        while (attempts < maxAttempts) {
          const status = await getDeploymentStatus(
            integrations.vercel_token!,
            deployment.id
          );

          if (status) {
            if (status.readyState === 'READY') {
              setDeploymentStatus('Ready');
              setDeploymentUrl(status.url);
              onDeployed?.(status.url);
              toast({
                title: t('integrations.vercelDeployed'),
                description: t('integrations.live'),
              });
              break;
            } else if (status.readyState === 'ERROR') {
              throw new Error('Deployment failed');
            }
            setDeploymentStatus(status.readyState);
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      };

      pollStatus();
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setDeploymentStatus(null);
      toast({
        title: t('common.error'),
        description: err.message || t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={vercelLogo} alt="Vercel" className="w-5 h-5 dark:invert" />
            {t('editor.deployVercel')}
          </DialogTitle>
          <DialogDescription>
            {deploymentUrl ? t('integrations.vercelDeployed') : t('integrations.vercelDeployDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!integrations?.vercel_connected ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('integrations.vercelNotConnected')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('integrations.goToSettingsVercel')}
                </p>
              </div>
            </div>
          ) : deploymentUrl && deploymentStatus === 'Ready' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Check className="w-5 h-5 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('integrations.deployedVercel')}</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.live')}</p>
                </div>
              </div>

              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={vercelLogo} alt="Vercel" className="w-5 h-5 dark:invert" />
                  <span className="text-sm font-medium truncate">{deploymentUrl}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </a>

              <Button
                onClick={handleDeploy}
                variant="outline"
                className="w-full"
                disabled={isDeploying}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isDeploying ? 'animate-spin' : ''}`} />
                {t('integrations.redeploy')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <img src={vercelLogo} alt="Vercel" className="w-5 h-5 invert" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{integrations?.vercel_username}</p>
                    <p className="text-xs text-muted-foreground">{t('integrations.connectedAccount')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-name">{t('integrations.projectName')}</Label>
                  <Input
                    id="project-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="my-awesome-project"
                  />
                </div>
              </div>

              {deploymentStatus && deploymentStatus !== 'Ready' && (
                <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{deploymentStatus}</p>
                    {deploymentUrl && (
                      <a 
                        href={deploymentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {deploymentUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-secondary rounded">Framework: Vite</span>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !customName.trim()}
                className="w-full"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('integrations.deploying')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('integrations.deploy')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
