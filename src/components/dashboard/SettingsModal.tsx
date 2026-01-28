import React, { useState, useEffect } from 'react';
import {
  Github, Settings as SettingsIcon, User,
  Check, X, Loader2, Eye, EyeOff, ExternalLink, Camera, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import vercelLogo from '@/assets/logos/vercel.svg';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    integrations,
    loading,
    saveGitHubToken,
    saveVercelToken,
    disconnectGitHub,
    disconnectVercel
  } = useIntegrations();

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations'>('profile');

  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [savingGithub, setSavingGithub] = useState(false);
  const [savingVercel, setSavingVercel] = useState(false);

  // Profile editing
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };

    if (open) {
      loadProfile();
    }
  }, [user, open]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('settings.profileUpdated'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden p-0 gap-0">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-secondary/30 border-r border-border p-4 flex flex-col gap-2">
            <DialogHeader className="mb-6 px-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                {t('common.settings')}
              </DialogTitle>
            </DialogHeader>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              {t('settings.profile')}
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'integrations'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Github className="w-4 h-4" />
              {t('footer.integrations')}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{t('settings.profile')}</h2>
                  <p className="text-sm text-muted-foreground">{t('settings.profileDesc')}</p>
                </div>

                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-background shadow-sm">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">{t('settings.displayName')}</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">{t('settings.avatarUrl')}</Label>
                      <Input
                        id="avatarUrl"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('auth.email')}</Label>
                      <Input value={user?.email || ''} disabled className="bg-muted" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('settings.updateProfile')}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{t('footer.integrations')}</h2>
                  <p className="text-sm text-muted-foreground">Connect third-party services</p>
                </div>

                {/* GitHub */}
                <div className="p-4 rounded-xl border border-border bg-card/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#24292e] rounded-lg flex items-center justify-center">
                        <Github className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">GitHub</h3>
                        <p className="text-xs text-muted-foreground">Sync and version control</p>
                      </div>
                    </div>
                    {integrations?.github_connected ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Connected</Badge>
                    ) : (
                      <Badge variant="outline">Not Connected</Badge>
                    )}
                  </div>

                  {integrations?.github_connected ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm font-mono">@{integrations.github_username}</span>
                      <Button variant="ghost" size="sm" onClick={disconnectGitHub} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type={showGithubToken ? "text" : "password"}
                          placeholder="Personal Access Token"
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
                      <Button onClick={handleSaveGitHub} disabled={!githubToken.trim() || savingGithub} className="w-full">
                        {savingGithub && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Connect GitHub
                      </Button>
                    </div>
                  )}
                </div>

                {/* Vercel */}
                <div className="p-4 rounded-xl border border-border bg-card/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <img src={vercelLogo} alt="Vercel" className="w-5 h-5 invert" />
                      </div>
                      <div>
                        <h3 className="font-medium">Vercel</h3>
                        <p className="text-xs text-muted-foreground">Deploy to production</p>
                      </div>
                    </div>
                    {integrations?.vercel_connected ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Connected</Badge>
                    ) : (
                      <Badge variant="outline">Not Connected</Badge>
                    )}
                  </div>

                  {integrations?.vercel_connected ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm font-mono">{integrations.vercel_username}</span>
                      <Button variant="ghost" size="sm" onClick={disconnectVercel} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type={showVercelToken ? "text" : "password"}
                          placeholder="Vercel Access Token"
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
                      <Button onClick={handleSaveVercel} disabled={!vercelToken.trim() || savingVercel} className="w-full">
                        {savingVercel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Connect Vercel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
