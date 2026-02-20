import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, Loader2, Check, X,
  Upload, RefreshCw, AlertCircle, Globe, Copy,
  ChevronRight, Terminal, Coins, Server, ArrowRight
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
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { toast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types';
import vercelLogo from '@/assets/logos/vercel.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectFiles: Record<string, ProjectFile>;
  onDeployed?: (url: string) => void;
  onSendErrorToChat?: (errorLog: string) => void;
}

export type { PublishDialogProps as VercelDeployDialogProps };

type DeployStep = 'input' | 'deploying' | 'success' | 'error';

interface DeployLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// ─── Deploy Services (server-side via edge functions) ─────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function vercelEdgeDeploy(
  token: string,
  projectName: string,
  files: Record<string, ProjectFile>
): Promise<{ id: string; url: string; readyState: string; alias?: string[] }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'deploy', token, projectName, files }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Deploy failed' }));
    throw new Error(err.error || `Vercel deploy failed: ${response.status}`);
  }
  return response.json();
}

async function vercelEdgeStatus(
  token: string,
  deploymentId: string
): Promise<{ readyState: string; url: string; alias?: string[] } | null> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'status', token, deploymentId }),
  });
  if (!response.ok) return null;
  return response.json();
}

// ─── Main Dialog (Vercel Only) ────────────────────────────────────────────────

export const VercelDeployDialog: React.FC<PublishDialogProps> = ({
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

  useEffect(() => {
    if (open) {
      setStep('input');
      setProductionUrl(null);
      setLogs([]);
      setShowLogs(false);
      setShowPricing(false);
      setErrorMessage(null);
      const slug = projectName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40);
      setCustomName(slug);
    }
  }, [open, projectName]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: DeployLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const hasCredits = () => {
    if (!userPlan) return false;
    return getRemainingCredits().total > 0;
  };

  const handleVercelDeploy = async () => {
    if (!hasCredits()) { setShowPricing(true); return; }
    if (!integrations?.vercel_token) {
      toast({ title: t('integrations.vercelNotConnected'), description: t('integrations.vercelConnectSettings'), variant: 'destructive' });
      return;
    }
    if (!customName.trim()) return;

    setStep('deploying'); setShowLogs(true); setErrorMessage(null);
    addLog('Starting Vercel deployment...', 'info');
    addLog(`Project: ${customName}`, 'info');
    addLog(`Files: ${Object.keys(projectFiles).length} files`, 'info');

    try {
      addLog('Creating Vercel project (via server)...', 'info');
      const deployment = await vercelEdgeDeploy(integrations.vercel_token, customName, projectFiles);

      addLog('Deployment created!', 'success');
      addLog(`Build ID: ${deployment.id.substring(0, 12)}...`, 'info');
      addLog('Waiting for build to complete...', 'info');

      let attempts = 0;
      while (attempts < 60) {
        const status = await vercelEdgeStatus(integrations.vercel_token!, deployment.id);
        if (status?.readyState === 'READY') {
          const finalUrl = status.alias?.length ? `https://${status.alias[0]}` : status.url;
          addLog('Build completed!', 'success');
          addLog(`Production URL: ${finalUrl}`, 'success');
          setProductionUrl(finalUrl);
          setStep('success');
          onDeployed?.(finalUrl);
          toast({ title: t('integrations.vercelDeployed'), description: t('integrations.live') });
          return;
        } else if (status?.readyState === 'ERROR') {
          throw new Error('Deployment build failed');
        } else if (attempts % 5 === 0 && status) {
          addLog(`Status: ${status.readyState}...`, 'info');
        }
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      }
      throw new Error('Deployment timed out after 2 minutes');
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      addLog(`Error: ${errMsg}`, 'error');
      setErrorMessage(errMsg);
      setStep('error');
      toast({ title: t('common.error'), description: errMsg, variant: 'destructive' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-primary" />
              {step === 'success' ? '🎉 Published Successfully' : 'Publish Project'}
            </DialogTitle>
            <DialogDescription>
              {step === 'input' && 'Deploy your project to Vercel'}
              {step === 'deploying' && 'Building and deploying your project...'}
              {step === 'success' && 'Your app is live and ready!'}
              {step === 'error' && 'Something went wrong during deployment'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {showPricing && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No credits remaining</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upgrade your plan to publish projects</p>
                <Button size="sm" className="mt-2" onClick={() => { onOpenChange(false); window.dispatchEvent(new CustomEvent('open-upgrade-modal')); }}>
                  View Plans
                </Button>
              </div>
            </div>
          )}

          {/* Step: Input - Vercel Only */}
          {step === 'input' && !showPricing && (
            <div className="space-y-4">
              {!integrations?.vercel_connected && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('integrations.vercelNotConnected')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('integrations.goToSettingsVercel')}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Website address</Label>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                  <img src={vercelLogo} alt="Vercel" className="w-4 h-4 dark:invert flex-shrink-0" />
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
                onClick={handleVercelDeploy}
                disabled={!customName.trim() || !integrations?.vercel_connected}
                className="w-full"
              >
                <img src={vercelLogo} alt="" className="w-4 h-4 mr-1.5 dark:invert" />
                Deploy to Vercel
              </Button>
            </div>
          )}

          {/* Step: Deploying */}
          {step === 'deploying' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Building on Vercel...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This usually takes 30-60 seconds</p>
                </div>
              </div>
              {showLogs && <DeployLogs logs={logs} logsEndRef={logsEndRef} />}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && productionUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your app is live! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-0.5">via Vercel</p>
                </div>
              </div>
              <div
                className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => window.open(productionUrl, '_blank')}
              >
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{productionUrl}</span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }} className="p-1.5 rounded hover:bg-background transition-colors">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Terminal className="w-3.5 h-3.5" />
                {showLogs ? 'Hide logs' : 'Show deploy logs'}
              </button>
              {showLogs && <DeployLogs logs={logs} logsEndRef={logsEndRef} />}
              <div className="flex gap-2">
                <Button onClick={() => { setStep('input'); setLogs([]); setProductionUrl(null); }} variant="outline" className="flex-1" size="sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Redeploy
                </Button>
                <Button onClick={() => onOpenChange(false)} className="flex-1" size="sm">Done</Button>
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
                  {errorMessage && <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>}
                </div>
              </div>
              <DeployLogs logs={logs} logsEndRef={logsEndRef} />
              <div className="flex gap-2">
                <Button onClick={() => setStep('input')} variant="outline" className="flex-1" size="sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Again
                </Button>
                {onSendErrorToChat && (
                  <Button onClick={handleSendErrorToChat} variant="destructive" className="flex-1" size="sm">
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

// ─── Deploy Logs Sub-Component ────────────────────────────────────────────────
const DeployLogs: React.FC<{ logs: DeployLog[]; logsEndRef: React.RefObject<HTMLDivElement> }> = ({ logs, logsEndRef }) => (
  <div className="bg-zinc-950 rounded-lg p-3 max-h-44 overflow-y-auto font-mono text-xs space-y-1 border border-border">
    {logs.length === 0 && <div className="text-zinc-500">Waiting for logs...</div>}
    {logs.map((log, i) => (
      <div key={i} className="flex items-start gap-2">
        <span className="text-zinc-500 flex-shrink-0">{log.time}</span>
        <span className={
          log.type === 'error' ? 'text-red-400' :
          log.type === 'success' ? 'text-emerald-400' :
          log.type === 'warning' ? 'text-amber-400' :
          'text-zinc-300'
        }>{log.message}</span>
      </div>
    ))}
    <div ref={logsEndRef} />
  </div>
);
