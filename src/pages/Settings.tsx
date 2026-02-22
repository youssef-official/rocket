import React, { useState } from 'react';
import {
  ArrowLeft, Settings as SettingsIcon,
  Check, X, Loader2, Key, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import vercelLogo from '@/assets/logos/vercel.svg';
import githubLogo from '@/assets/logos/github.svg';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    integrations,
    loading,
    saveVercelToken,
    saveGitHubToken,
    disconnectVercel,
    disconnectGitHub,
  } = useIntegrations();

  const [vercelToken, setVercelToken] = useState('');
  const [githubToken, setGitHubToken] = useState('');
  const [savingVercel, setSavingVercel] = useState(false);
  const [savingGitHub, setSavingGitHub] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [showGitHubToken, setShowGitHubToken] = useState(false);

  const handleSaveVercel = async () => {
    if (!vercelToken.trim()) return;
    setSavingVercel(true);
    const success = await saveVercelToken(vercelToken.trim());
    setSavingVercel(false);
    if (success) setVercelToken('');
  };

  const handleSaveGitHub = async () => {
    if (!githubToken.trim()) return;
    setSavingGitHub(true);
    const success = await saveGitHubToken(githubToken.trim());
    setSavingGitHub(false);
    if (success) setGitHubToken('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className={`max-w-4xl mx-auto px-4 h-16 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <VivoraXLogo size="sm" showText={false} />
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="text-lg font-bold text-foreground">{t('common.settings')}</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-6">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">{t('footer.integrations')}</h2>
          </div>

          {/* Vercel Integration */}
          <TokenCard
            logo={vercelLogo}
            name="Vercel"
            description={t('editor.deployVercel')}
            connected={!!integrations?.vercel_connected}
            username={integrations?.vercel_username}
            tokenValue={vercelToken}
            onTokenChange={setVercelToken}
            onSave={handleSaveVercel}
            onDisconnect={disconnectVercel}
            saving={savingVercel}
            showToken={showVercelToken}
            onToggleShow={() => setShowVercelToken(!showVercelToken)}
            placeholder="Enter your Vercel Access Token"
            helpUrl="https://vercel.com/account/tokens"
            helpText="Get token → Vercel Settings → Tokens"
            isRTL={isRTL}
          />

          {/* GitHub Integration */}
          <TokenCard
            logo={githubLogo}
            name="GitHub"
            description="Push your projects to GitHub repositories"
            connected={!!integrations?.github_connected}
            username={integrations?.github_username}
            tokenValue={githubToken}
            onTokenChange={setGitHubToken}
            onSave={handleSaveGitHub}
            onDisconnect={disconnectGitHub}
            saving={savingGitHub}
            showToken={showGitHubToken}
            onToggleShow={() => setShowGitHubToken(!showGitHubToken)}
            placeholder="Enter your GitHub Personal Access Token"
            helpUrl="https://github.com/settings/tokens/new"
            helpText="Get token → GitHub Settings → Developer settings → Tokens"
            isRTL={isRTL}
          />
        </div>
      </main>
    </div>
  );
};

// Token-based card for settings page
const TokenCard: React.FC<{
  logo: string;
  name: string;
  description: string;
  connected: boolean;
  username?: string | null;
  tokenValue: string;
  onTokenChange: (val: string) => void;
  onSave: () => void;
  onDisconnect: () => Promise<boolean>;
  saving: boolean;
  showToken: boolean;
  onToggleShow: () => void;
  placeholder: string;
  helpUrl: string;
  helpText: string;
  isRTL: boolean;
}> = ({ logo, name, description, connected, username, tokenValue, onTokenChange, onSave, onDisconnect, saving, showToken, onToggleShow, placeholder, helpUrl, helpText, isRTL }) => (
  <Card>
    <CardHeader>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
            <img src={logo} alt={name} className="w-5 h-5 invert" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <CardTitle className="text-base">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {connected ? (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <X className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {connected ? (
        <div className={`flex items-center justify-between p-4 bg-secondary/50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <img src={logo} alt={name} className="w-4 h-4 invert" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="font-medium text-foreground">{username}</p>
              <p className="text-xs text-muted-foreground">Connected via Token</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showToken ? 'text' : 'password'}
              value={tokenValue}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder={placeholder}
              className="pr-10"
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
            />
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-400 hover:underline block"
          >
            {helpText}
          </a>
          <Button
            onClick={onSave}
            disabled={saving || !tokenValue.trim()}
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Connect {name}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export default Settings;
