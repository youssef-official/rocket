import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Settings as SettingsIcon,
  Check, X, Loader2, ExternalLink, LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import vercelLogo from '@/assets/logos/vercel.svg';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    integrations,
    loading,
    startVercelOAuth,
    disconnectVercel
  } = useIntegrations();

  const [connectingVercel, setConnectingVercel] = useState(false);

  const handleConnectVercel = async () => {
    setConnectingVercel(true);
    await startVercelOAuth();
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
        {/* Integrations Section */}
        <div className="space-y-6">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">{t('footer.integrations')}</h2>
          </div>

          {/* Vercel Integration - OAuth Only */}
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
                  <p className="text-sm text-muted-foreground">
                    Sign in with your Vercel account to deploy projects directly.
                  </p>
                  <Button
                    onClick={handleConnectVercel}
                    disabled={connectingVercel}
                    className="w-full"
                  >
                    {connectingVercel ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <><LogIn className="w-4 h-4 mr-2" /> Sign in with Vercel</>
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
