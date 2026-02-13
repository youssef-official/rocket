import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, Loader2, Check, X, Link2, 
  Upload, RefreshCw, AlertCircle
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
import { useLanguage } from '@/contexts/LanguageContext';
import { deployToVercel, getDeploymentStatus } from '@/services/vercelService';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';
import vercelLogo from '@/assets/logos/vercel.svg';

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
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nameHint, setNameHint] = useState<string | null>(null);

  // Validate project name format
  useEffect(() => {
    if (!customName.trim()) {
      setNameHint(null);
      return;
    }
    const safeName = customName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
    if (safeName !== customName) {
      setNameHint(`سيتم تحويل الاسم إلى: ${safeName}`);
    } else {
      setNameHint(null);
    }
  }, [customName]);

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
                    className={nameHint ? 'border-amber-500/50' : ''}
                  />
                  {nameHint && (
                    <p className="text-xs text-amber-500">{nameHint}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    اسم فريد للمشروع على Vercel (حروف صغيرة وأرقام وشرطات فقط)
                  </p>
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
