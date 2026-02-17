import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, Loader2, Check, X, Link2, 
  Upload, RefreshCw, AlertCircle, Globe, Copy,
  ChevronRight, Terminal, Coins
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
import { useUserPlan } from '@/hooks/useUserPlan';
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
  onSendErrorToChat?: (errorLog: string) => void;
}

type DeployStep = 'input' | 'deploying' | 'success' | 'error';

interface DeployLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const VercelDeployDialog: React.FC<VercelDeployDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  projectFiles,
  onDeployed,
  onSendErrorToChat,
}) => {
  const { integrations } = useIntegrations();
  const { t } = useLanguage();
  const { userPlan, getRemainingCredits } = useUserPlan();
  const [step, setStep] = useState<DeployStep>('input');
  const [customName, setCustomName] = useState('');
  const [productionUrl, setProductionUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('input');
      setProductionUrl(null);
      setLogs([]);
      setShowLogs(false);
      setShowPricing(false);
      setErrorMessage(null);
      setCustomName(projectName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 100));
    }
  }, [open, projectName]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: DeployLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const hasCredits = () => {
    if (!userPlan) return false;
    const remaining = getRemainingCredits();
    return remaining.total > 0;
  };

  const handleDeploy = async () => {
    // Check credits first
    if (!hasCredits()) {
      setShowPricing(true);
      return;
    }

    if (!integrations?.vercel_token) {
      toast({
        title: t('integrations.vercelNotConnected'),
        description: t('integrations.vercelConnectSettings'),
        variant: 'destructive',
      });
      return;
    }

    if (!customName.trim()) return;

    setStep('deploying');
    setShowLogs(true);
    setErrorMessage(null);

    addLog('Starting deployment...', 'info');
    addLog(`Project: ${customName}`, 'info');
    addLog(`Files: ${Object.keys(projectFiles).length} files`, 'info');

    try {
      addLog('Creating Vercel project...', 'info');
      
      const deployment = await deployToVercel(
        integrations.vercel_token,
        customName,
        projectFiles
      );

      if (!deployment) {
        throw new Error('Failed to create deployment');
      }

      addLog('Deployment created successfully', 'success');
      addLog(`Build ID: ${deployment.id.substring(0, 12)}...`, 'info');
      addLog('Waiting for build to complete...', 'info');

      // Poll for deployment status
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        const status = await getDeploymentStatus(
          integrations.vercel_token!,
          deployment.id
        );

        if (status) {
          if (status.readyState === 'READY') {
            // Get production URL (alias or main URL)
            const finalUrl = status.alias && status.alias.length > 0
              ? `https://${status.alias[0]}`
              : status.url;
            
            addLog('Build completed successfully!', 'success');
            addLog(`Production URL: ${finalUrl}`, 'success');
            
            setProductionUrl(finalUrl);
            setStep('success');
            onDeployed?.(finalUrl);
            
            toast({
              title: t('integrations.vercelDeployed'),
              description: t('integrations.live'),
            });
            return;
          } else if (status.readyState === 'ERROR') {
            addLog('Build failed!', 'error');
            throw new Error('Deployment build failed');
          } else {
            if (attempts % 5 === 0) {
              addLog(`Status: ${status.readyState}...`, 'info');
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      throw new Error('Deployment timed out after 2 minutes');
    } catch (err: any) {
      const errMsg = err.message || 'Unknown deployment error';
      addLog(`Error: ${errMsg}`, 'error');
      setErrorMessage(errMsg);
      setStep('error');

      toast({
        title: t('common.error'),
        description: errMsg,
        variant: 'destructive',
      });
    }
  };

  const handleSendErrorToChat = () => {
    if (onSendErrorToChat && logs.length > 0) {
      const logText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
      onSendErrorToChat(`Deploy error log:\n${logText}`);
      onOpenChange(false);
    }
  };

  const handleCopyUrl = () => {
    if (productionUrl) {
      navigator.clipboard.writeText(productionUrl);
      toast({ title: 'Copied!', description: 'URL copied to clipboard' });
    }
  };

  const safeName = customName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
  const previewUrl = safeName ? `${safeName}.vercel.app` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <img src={vercelLogo} alt="Vercel" className="w-5 h-5 dark:invert" />
              {step === 'success' ? 'Deployed Successfully' : 'Publish'}
            </DialogTitle>
            <DialogDescription>
              {step === 'input' && "Choose your app's URL and deploy to production"}
              {step === 'deploying' && 'Building and deploying your project...'}
              {step === 'success' && 'Your app is live and ready!'}
              {step === 'error' && 'Something went wrong during deployment'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Not connected warning */}
          {!integrations?.vercel_connected && step === 'input' && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('integrations.vercelNotConnected')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('integrations.goToSettingsVercel')}
                </p>
              </div>
            </div>
          )}

          {/* Credits check - show pricing */}
          {showPricing && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No credits remaining</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upgrade your plan to deploy projects
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onOpenChange(false);
                    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
                  }}
                >
                  View Plans
                </Button>
              </div>
            </div>
          )}

          {/* Step: Input */}
          {step === 'input' && integrations?.vercel_connected && !showPricing && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Website address</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Choose your app's URL or use the generated one
                </p>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="my-project"
                    className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
                  />
                  <span className="text-xs text-muted-foreground flex-shrink-0">.vercel.app</span>
                </div>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={!customName.trim()}
                className="w-full"
                size="lg"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {/* Step: Deploying */}
          {step === 'deploying' && (
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Building your project...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This usually takes 30-60 seconds</p>
                </div>
              </div>

              {/* Logs */}
              {showLogs && (
                <DeployLogs logs={logs} logsEndRef={logsEndRef} />
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && productionUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your app is live!</p>
                </div>
              </div>

              {/* Production URL */}
              <div
                className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => window.open(productionUrl, '_blank')}
              >
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{productionUrl}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }}
                    className="p-1.5 rounded hover:bg-background transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Logs toggle */}
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                {showLogs ? 'Hide logs' : 'Show deploy logs'}
              </button>

              {showLogs && <DeployLogs logs={logs} logsEndRef={logsEndRef} />}

              <div className="flex gap-2">
                <Button
                  onClick={handleDeploy}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Redeploy
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  size="sm"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <X className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Deployment failed</p>
                  {errorMessage && (
                    <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>
                  )}
                </div>
              </div>

              {/* Logs */}
              <DeployLogs logs={logs} logsEndRef={logsEndRef} />

              <div className="flex gap-2">
                <Button
                  onClick={handleDeploy}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
                {onSendErrorToChat && (
                  <Button
                    onClick={handleSendErrorToChat}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    Send to AI for Fix
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Deploy Logs Component
const DeployLogs: React.FC<{ logs: DeployLog[]; logsEndRef: React.RefObject<HTMLDivElement> }> = ({ logs, logsEndRef }) => (
  <div className="bg-zinc-950 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
    {logs.map((log, i) => (
      <div key={i} className="flex items-start gap-2">
        <span className="text-zinc-500 flex-shrink-0">{log.time}</span>
        <span className={
          log.type === 'error' ? 'text-red-400' :
          log.type === 'success' ? 'text-emerald-400' :
          log.type === 'warning' ? 'text-amber-400' :
          'text-zinc-300'
        }>
          {log.message}
        </span>
      </div>
    ))}
    <div ref={logsEndRef} />
  </div>
);
