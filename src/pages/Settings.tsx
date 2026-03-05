import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Settings as SettingsIcon, Palette, ImageIcon,
  Check, Loader2, Key, Eye, EyeOff, PartyPopper, Moon, Sun, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useThemePreference } from '@/hooks/useThemePreference';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import vercelLogo from '@/assets/logos/vercel.svg';
import githubLogo from '@/assets/logos/github.svg';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import lightHeroBg from '@/assets/light-hero-bg.jpg';
import auroraGradientBg from '@/assets/aurora-gradient-bg.png';

// ─── Color Presets ───
const COLOR_PRESETS = [
  { id: 'midnight', name: 'Midnight', bg: '#1B1B1B', accent: '#a78bfa', label: 'Default' },
  { id: 'deep-blue', name: 'Deep Blue', bg: '#0f172a', accent: '#3b82f6', label: 'Ocean' },
  { id: 'charcoal', name: 'Charcoal', bg: '#1c1c1e', accent: '#6b7280', label: 'Minimal' },
  { id: 'dark-emerald', name: 'Emerald', bg: '#0d1117', accent: '#10b981', label: 'Matrix' },
  { id: 'warm-dark', name: 'Warm Dark', bg: '#1a1614', accent: '#f59e0b', label: 'Amber' },
  { id: 'royal', name: 'Royal', bg: '#0e0e2c', accent: '#8b5cf6', label: 'Purple' },
];

const WALLPAPERS = [
  { id: 'aurora-gradient', label: 'Aurora', src: auroraGradientBg },
  { id: 'space', label: 'Space', src: spaceHeroBg },
  { id: 'light', label: 'Light', src: lightHeroBg },
  { id: 'nebula', label: 'Nebula', src: '/wallpapers/nebula.jpg' },
  { id: 'sunset', label: 'Sunset', src: '/wallpapers/sunset.jpg' },
  { id: 'forest', label: 'Forest', src: '/wallpapers/forest.jpg' },
  { id: 'ocean', label: 'Ocean', src: '/wallpapers/ocean.jpg' },
  { id: 'mountains', label: 'Mountains', src: '/wallpapers/mountains.jpg' },
  { id: 'city-night', label: 'City Night', src: '/wallpapers/city-night.jpg' },
  { id: 'desert', label: 'Desert', src: '/wallpapers/desert.jpg' },
  { id: 'tropical', label: 'Tropical', src: '/wallpapers/tropical.jpg' },
];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { theme, setTheme } = useThemePreference();
  const {
    integrations, loading,
    saveVercelToken, saveGitHubToken,
    disconnectVercel, disconnectGitHub,
  } = useIntegrations();

  // Integration tokens
  const [vercelToken, setVercelToken] = useState('');
  const [githubToken, setGitHubToken] = useState('');
  const [savingVercel, setSavingVercel] = useState(false);
  const [savingGitHub, setSavingGitHub] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [showGitHubToken, setShowGitHubToken] = useState(false);

  // Customization
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem('vivora_color_preset') || 'midnight');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('vivora_custom_bg') || '#1B1B1B');
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('vivora_custom_accent') || '#a78bfa');
  const [selectedWallpaper, setSelectedWallpaper] = useState(() => localStorage.getItem('vivora_wallpaper') || 'space');
  const [showRamadan, setShowRamadan] = useState(() => localStorage.getItem('vivora_show_ramadan') !== 'false');
  const [showEid, setShowEid] = useState(() => localStorage.getItem('vivora_show_eid') !== 'false');

  // Save color preset
  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setCustomBg(preset.bg);
    setCustomAccent(preset.accent);
    localStorage.setItem('vivora_color_preset', preset.id);
    localStorage.setItem('vivora_custom_bg', preset.bg);
    localStorage.setItem('vivora_custom_accent', preset.accent);
    document.documentElement.style.setProperty('--editor-bg', preset.bg);
    document.documentElement.style.setProperty('--accent-color', preset.accent);
    window.dispatchEvent(new Event('vivora-theme-change'));
  };

  const applyCustomColor = (type: 'bg' | 'accent', value: string) => {
    if (type === 'bg') {
      setCustomBg(value);
      localStorage.setItem('vivora_custom_bg', value);
      document.documentElement.style.setProperty('--editor-bg', value);
    } else {
      setCustomAccent(value);
      localStorage.setItem('vivora_custom_accent', value);
      document.documentElement.style.setProperty('--accent-color', value);
    }
    setSelectedPreset('custom');
    localStorage.setItem('vivora_color_preset', 'custom');
    window.dispatchEvent(new Event('vivora-theme-change'));
  };

  const selectWallpaper = (id: string) => {
    setSelectedWallpaper(id);
    localStorage.setItem('vivora_wallpaper', id);
    window.dispatchEvent(new Event('vivora-wallpaper-change'));
  };

  useEffect(() => {
    localStorage.setItem('vivora_show_ramadan', String(showRamadan));
    localStorage.setItem('vivora_show_eid', String(showEid));
    window.dispatchEvent(new Event('vivora-celebrations-change'));
  }, [showRamadan, showEid]);

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

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0d0d]/95 backdrop-blur-xl">
        <div className={`max-w-4xl mx-auto px-4 h-16 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/60 hover:text-white hover:bg-white/[0.06]">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <VivoraXLogo size="sm" showText={false} />
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="text-lg font-bold text-white font-serif">{t('common.settings')}</h1>
                <p className="text-xs text-white/40">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ═══ Appearance ═══ */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-serif">Appearance</h2>
          </div>

          {/* Theme Mode */}
          <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/80">Theme Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {([
                  { val: 'light' as const, icon: <Sun className="w-4 h-4" />, label: 'Light' },
                  { val: 'dark' as const, icon: <Moon className="w-4 h-4" />, label: 'Dark' },
                  { val: 'system' as const, icon: <Monitor className="w-4 h-4" />, label: 'System' },
                ]).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setTheme(opt.val)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      theme === opt.val
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Presets */}
          <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/80">Editor Color Theme</CardTitle>
              <CardDescription className="text-white/30">Choose a preset or enter custom hex codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`relative p-3 rounded-xl border transition-all duration-200 text-left ${
                      selectedPreset === preset.id
                        ? 'border-violet-500/50 bg-violet-500/5'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: preset.bg }} />
                      <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <p className="text-xs font-medium text-white/70">{preset.name}</p>
                    <p className="text-[10px] text-white/30">{preset.label}</p>
                    {selectedPreset === preset.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom color inputs */}
              <div className="pt-3 border-t border-white/[0.06] space-y-3">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Custom Colors</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/40 mb-1 block">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customBg}
                        onChange={e => applyCustomColor('bg', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={customBg}
                        onChange={e => applyCustomColor('bg', e.target.value)}
                        className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/70 font-mono"
                        placeholder="#1B1B1B"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 mb-1 block">Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent}
                        onChange={e => applyCustomColor('accent', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={customAccent}
                        onChange={e => applyCustomColor('accent', e.target.value)}
                        className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/70 font-mono"
                        placeholder="#a78bfa"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-white/[0.06]" style={{ backgroundColor: customBg }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: customAccent }} />
                  <div className="h-2 rounded-full w-24" style={{ backgroundColor: customAccent, opacity: 0.6 }} />
                  <div className="h-2 rounded-full w-16 bg-white/10" />
                </div>
                <div className="mt-3 h-8 rounded-lg bg-white/[0.04] flex items-center px-3">
                  <span className="text-[10px] text-white/30">Preview of your editor theme</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallpaper */}
          <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
            <CardHeader className="pb-3">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ImageIcon className="w-4 h-4 text-white/50" />
                <CardTitle className="text-sm text-white/80">Wallpaper</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {WALLPAPERS.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => selectWallpaper(wp.id)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedWallpaper === wp.id
                        ? 'border-violet-500 ring-1 ring-violet-500/30'
                        : 'border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <img src={wp.src} alt={wp.label} className="w-full h-full object-cover" />
                    {selectedWallpaper === wp.id && (
                      <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Celebrations */}
          <Card className="bg-white/[0.03] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <PartyPopper className="w-4 h-4 text-white/50" />
                <CardTitle className="text-sm text-white/80">Celebrations</CardTitle>
              </div>
              <CardDescription className="text-white/30">Show seasonal celebration effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-sm text-white/70">Ramadan</p>
                  <p className="text-[11px] text-white/30">🌙 Crescent moon & lantern effects</p>
                </div>
                <Switch checked={showRamadan} onCheckedChange={setShowRamadan} />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-sm text-white/70">Eid</p>
                  <p className="text-[11px] text-white/30">🎉 Confetti & celebration effects</p>
                </div>
                <Switch checked={showEid} onCheckedChange={setShowEid} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Integrations ═══ */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-serif">{t('footer.integrations')}</h2>
          </div>

          <div className="space-y-4">
            <TokenCard
              logo={vercelLogo} name="Vercel" description="Deploy your projects to Vercel"
              connected={!!integrations?.vercel_connected} username={integrations?.vercel_username}
              tokenValue={vercelToken} onTokenChange={setVercelToken}
              onSave={handleSaveVercel} onDisconnect={disconnectVercel}
              saving={savingVercel} showToken={showVercelToken}
              onToggleShow={() => setShowVercelToken(!showVercelToken)}
              placeholder="Enter your Vercel Access Token"
              helpUrl="https://vercel.com/account/tokens"
              helpText="Get token → Vercel Settings → Tokens"
              isRTL={isRTL}
            />
            <TokenCard
              logo={githubLogo} name="GitHub" description="Push your projects to GitHub"
              connected={!!integrations?.github_connected} username={integrations?.github_username}
              tokenValue={githubToken} onTokenChange={setGitHubToken}
              onSave={handleSaveGitHub} onDisconnect={disconnectGitHub}
              saving={savingGitHub} showToken={showGitHubToken}
              onToggleShow={() => setShowGitHubToken(!showGitHubToken)}
              placeholder="Enter your GitHub Personal Access Token"
              helpUrl="https://github.com/settings/tokens/new"
              helpText="Get token → GitHub Settings → Developer settings → Tokens"
              isRTL={isRTL}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// ─── Token Card ───
const TokenCard: React.FC<{
  logo: string; name: string; description: string; connected: boolean;
  username?: string | null; tokenValue: string; onTokenChange: (val: string) => void;
  onSave: () => void; onDisconnect: () => Promise<boolean>; saving: boolean;
  showToken: boolean; onToggleShow: () => void; placeholder: string;
  helpUrl: string; helpText: string; isRTL: boolean;
}> = ({ logo, name, description, connected, username, tokenValue, onTokenChange, onSave, onDisconnect, saving, showToken, onToggleShow, placeholder, helpUrl, helpText, isRTL }) => (
  <Card className="bg-white/[0.03] border-white/[0.06]">
    <CardHeader>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
            <img src={logo} alt={name} className="w-5 h-5 invert" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <CardTitle className="text-sm text-white/80">{name}</CardTitle>
            <CardDescription className="text-white/30">{description}</CardDescription>
          </div>
        </div>
        {connected ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Check className="w-3 h-3 mr-1" /> Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-white/30 border-white/10">Not Connected</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {connected ? (
        <div className={`flex items-center justify-between p-4 bg-white/[0.03] rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
              <img src={logo} alt={name} className="w-4 h-4 invert" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="font-medium text-white/80 text-sm">{username}</p>
              <p className="text-[11px] text-white/30">Connected via Token</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={onDisconnect}>Disconnect</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showToken ? 'text' : 'password'}
              value={tokenValue}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder={placeholder}
              className="pr-10 bg-white/[0.03] border-white/[0.08] text-white/70"
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
            />
            <button type="button" onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-violet-400 hover:text-violet-300 hover:underline block">
            {helpText}
          </a>
          <Button onClick={onSave} disabled={saving || !tokenValue.trim()} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Connect {name}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export default Settings;
