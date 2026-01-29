import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Settings as SettingsIcon, User,
  Check, X, Loader2, Eye, EyeOff, ExternalLink, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { RocketLogo } from '@/components/shared/RocketLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import vercelLogo from '@/assets/logos/vercel.svg';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    integrations,
    loading,
    saveVercelToken,
    disconnectVercel
  } = useIntegrations();

  const [vercelToken, setVercelToken] = useState('');
  const [showVercelToken, setShowVercelToken] = useState(false);
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

    loadProfile();
  }, [user]);

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

  // GitHub removed - only Vercel

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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className={`max-w-4xl mx-auto px-4 h-16 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <RocketLogo size="sm" showText={false} />
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
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <CardTitle>{t('settings.profile')}</CardTitle>
                <CardDescription>{t('auth.email')}: {user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Preview */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-url">{t('settings.avatarUrl')}</Label>
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">{t('settings.displayName')}</Label>
              <Input
                id="display-name"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full"
            >
              {savingProfile ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.loading')}</>
              ) : (
                t('settings.updateProfile')
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <div className="space-y-6">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">{t('footer.integrations')}</h2>
          </div>


          {/* Vercel Integration */}
          <Card>
            <CardHeader>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <img src={vercelLogo} alt="Vercel" className="w-5 h-5 invert" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <CardTitle className="text-base">Vercel</CardTitle>
                    <CardDescription>
                      {t('editor.deployVercel')}
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
                <div className={`flex items-center justify-between p-4 bg-secondary/50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <img src={vercelLogo} alt="Vercel" className="w-4 h-4 invert" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
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
                        className={`${isRTL ? 'pl-10 pr-3' : 'pr-10'}`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVercelToken(!showVercelToken)}
                        className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
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
                        className={`text-primary hover:underline inline-flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
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