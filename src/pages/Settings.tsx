import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Github, Settings as SettingsIcon, User, 
  Check, X, Loader2, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { RocketLogo } from '@/components/shared/RocketLogo';
import vercelLogo from '@/assets/logos/vercel.svg';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    integrations, 
    loading, 
    saveGitHubToken, 
    saveVercelToken,
    disconnectGitHub,
    disconnectVercel 
  } = useIntegrations();

  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [savingGithub, setSavingGithub] = useState(false);
  const [savingVercel, setSavingVercel] = useState(false);

  const handleSaveGitHub = async () => {
    if (!githubToken.trim()) return;
    setSavingGithub(true);
    const success = await saveGitHubToken(githubToken.trim());
    if (success) setGithubToken('');
    setSavingGithub(false);
  };

  const handleSaveVercel = async () => {
    if (!vercelToken.trim()) return;
    setSavingVercel(true);
    const success = await saveVercelToken(vercelToken.trim());
    if (success) setVercelToken('');
    setSavingVercel(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <RocketLogo size="sm" showText={false} />
              <div>
                <h1 className="text-lg font-bold text-foreground">Account Settings</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Integrations</h2>
          </div>

          {/* GitHub Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">GitHub</CardTitle>
                    <CardDescription>
                      Connect your GitHub account to sync projects
                    </CardDescription>
                  </div>
                </div>
                {integrations?.github_connected ? (
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
              {integrations?.github_connected ? (
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#24292e] flex items-center justify-center">
                      <Github className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">@{integrations.github_username}</p>
                      <p className="text-xs text-muted-foreground">Connected account</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={disconnectGitHub}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="github-token">Personal Access Token</Label>
                    <div className="relative">
                      <Input
                        id="github-token"
                        type={showGithubToken ? 'text' : 'password'}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGithubToken(!showGithubToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create a token with <code className="bg-secondary px-1 rounded">repo</code> scope.{' '}
                      <a 
                        href="https://github.com/settings/tokens/new" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Generate token <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <Button 
                    onClick={handleSaveGitHub} 
                    disabled={!githubToken.trim() || savingGithub}
                    className="w-full"
                  >
                    {savingGithub ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <><Github className="w-4 h-4 mr-2" /> Connect GitHub</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vercel Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <img src={vercelLogo} alt="Vercel" className="w-5 h-5 invert" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Vercel</CardTitle>
                    <CardDescription>
                      Deploy your projects to Vercel
                    </CardDescription>
                  </div>
                </div>
                {integrations?.vercel_connected ? (
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
              {integrations?.vercel_connected ? (
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <img src={vercelLogo} alt="Vercel" className="w-4 h-4 invert" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{integrations.vercel_username}</p>
                      <p className="text-xs text-muted-foreground">Connected account</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={disconnectVercel}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="vercel-token">Access Token</Label>
                    <div className="relative">
                      <Input
                        id="vercel-token"
                        type={showVercelToken ? 'text' : 'password'}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVercelToken(!showVercelToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create a token in Vercel dashboard.{' '}
                      <a 
                        href="https://vercel.com/account/tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Generate token <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <Button 
                    onClick={handleSaveVercel} 
                    disabled={!vercelToken.trim() || savingVercel}
                    className="w-full"
                  >
                    {savingVercel ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <>Connect Vercel</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
