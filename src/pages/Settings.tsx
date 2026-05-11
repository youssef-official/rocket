import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Settings as SettingsIcon, Palette, ImageIcon,
  Check, Loader2, Key, Eye, EyeOff, PartyPopper, Moon, Sun, Monitor,
  Sparkles, Plus, Trash2, User as UserIcon, Zap, AlertCircle, CheckCircle2
} from 'lucide-react';
import { setLocalProfile } from '@/contexts/AuthContext';
import {
  getAISettings, saveAISettings, getAllProviders, getAvailableModels,
  BUILTIN_PROVIDERS, type AISettings, type AIProviderPreset,
} from '@/services/aiSettings';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
const useIntegrations = () => ({ integrations: null as any, loading: false, saveVercelToken: async (_t: string) => false, saveGitHubToken: async (_t: string) => false, disconnectVercel: async () => false, disconnectGitHub: async () => false });
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
  { id: 'gradient-purple', label: 'Purple Flow', src: '/wallpapers/gradient-purple.jpg' },
  { id: 'zen-garden', label: 'Zen Garden', src: '/wallpapers/zen-garden.jpg' },
  { id: 'cyberpunk', label: 'Cyberpunk', src: '/wallpapers/cyberpunk.jpg' },
  { id: 'northern-lights', label: 'Northern Lights', src: '/wallpapers/northern-lights.jpg' },
  { id: 'cozy-cafe', label: 'Cozy Café', src: '/wallpapers/cozy-cafe.jpg' },
  { id: 'black-gold', label: 'Black & Gold', src: '/wallpapers/black-gold.jpg' },
  { id: 'starry-night', label: 'Starry Night', src: '/wallpapers/starry-night.jpg' },
  { id: 'volcanic', label: 'Volcanic', src: '/wallpapers/volcanic.jpg' },
  { id: 'sakura', label: 'Sakura', src: '/wallpapers/sakura.jpg' },
  { id: 'deep-ocean', label: 'Deep Ocean', src: '/wallpapers/deep-ocean.jpg' },
  { id: 'neon-tokyo', label: 'Neon Tokyo', src: '/wallpapers/neon-tokyo.jpg' },
  { id: 'lavender', label: 'Lavender', src: '/wallpapers/lavender.jpg' },
  { id: 'rose-gold', label: 'Rose Gold', src: '/wallpapers/rose-gold.jpg' },
  { id: 'alpine-dawn', label: 'Alpine Dawn', src: '/wallpapers/alpine-dawn.jpg' },
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

        {/* ═══ Profile + AI Provider ═══ */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
          <ProfileAndAISection isRTL={isRTL} />
        </motion.div>

        {/* Integrations removed in local/open-source build. */}
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


// ─── Profile + AI Provider Section ───
const ProfileAndAISection: React.FC<{ isRTL: boolean }> = ({ isRTL }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings>(() => getAISettings());
  const [showKey, setShowKey] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newModel, setNewModel] = useState('');
  const [newProvider, setNewProvider] = useState({ id: '', label: '', baseUrl: '', model: '' });
  const [showAddProvider, setShowAddProvider] = useState(false);

  const allProviders = [...BUILTIN_PROVIDERS, ...(settings.customProviders || [])];
  const preset = allProviders.find(p => p.id === settings.providerId) || allProviders[0];
  const builtinModels = preset?.models || [];
  const extraModels = settings.customModels?.[settings.providerId] || [];

  const selectProvider = (id: string) => {
    const p = allProviders.find(x => x.id === id);
    if (!p) return;
    setSettings(s => ({
      ...s,
      providerId: id,
      baseUrl: p.baseUrl || s.baseUrl,
      apiKey: s.apiKeys?.[id] ?? '',
      model: p.models[0] || (s.customModels?.[id]?.[0] ?? ''),
    }));
  };

  const updateApiKey = (val: string) => {
    setSettings(s => ({
      ...s,
      apiKey: val,
      apiKeys: { ...(s.apiKeys || {}), [s.providerId]: val },
    }));
  };

  const addModel = () => {
    const m = newModel.trim();
    if (!m) return;
    setSettings(s => {
      const cur = s.customModels?.[s.providerId] || [];
      if (cur.includes(m) || (preset?.models || []).includes(m)) return s;
      return { ...s, customModels: { ...(s.customModels || {}), [s.providerId]: [...cur, m] }, model: m };
    });
    setNewModel('');
  };

  const removeCustomModel = (m: string) => {
    setSettings(s => ({
      ...s,
      customModels: { ...(s.customModels || {}), [s.providerId]: (s.customModels?.[s.providerId] || []).filter(x => x !== m) },
      model: s.model === m ? (preset?.models[0] || '') : s.model,
    }));
  };

  const addProvider = () => {
    const id = newProvider.id.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id || !newProvider.label.trim() || !newProvider.baseUrl.trim()) {
      toast({ title: 'Missing fields', description: 'ID, label, and base URL are required.', variant: 'destructive' });
      return;
    }
    if (allProviders.some(p => p.id === id)) {
      toast({ title: 'Provider exists', description: 'Pick a unique ID.', variant: 'destructive' });
      return;
    }
    const p: AIProviderPreset = {
      id, label: newProvider.label.trim(), baseUrl: newProvider.baseUrl.trim(),
      models: newProvider.model.trim() ? [newProvider.model.trim()] : [], custom: true,
    };
    setSettings(s => ({ ...s, customProviders: [...(s.customProviders || []), p] }));
    setNewProvider({ id: '', label: '', baseUrl: '', model: '' });
    setShowAddProvider(false);
  };

  const removeCustomProvider = (id: string) => {
    setSettings(s => ({
      ...s,
      customProviders: (s.customProviders || []).filter(p => p.id !== id),
      providerId: s.providerId === id ? 'openrouter' : s.providerId,
    }));
  };

  const handleSave = () => {
    if (!settings.baseUrl.trim()) {
      toast({ title: 'Base URL required', variant: 'destructive' }); return;
    }
    if (!settings.model.trim()) {
      toast({ title: 'Model required', variant: 'destructive' }); return;
    }
    saveAISettings(settings);
    if (displayName !== user?.displayName) setLocalProfile({ displayName });
    toast({ title: 'Saved', description: 'AI provider and profile updated.' });
  };

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number; reply?: string } | null>(null);

  const handleTest = async () => {
    setTestResult(null);
    const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
    if (!baseUrl) { setTestResult({ ok: false, message: 'Base URL is required.' }); return; }
    if (!settings.apiKey.trim()) { setTestResult({ ok: false, message: 'API key is required.' }); return; }
    if (!settings.model.trim()) { setTestResult({ ok: false, message: 'Model id is required.' }); return; }

    setTesting(true);
    const started = performance.now();
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 30000);
      const proxy = (settings.corsProxy || '').trim();
      const target = `${baseUrl}/chat/completions`;
      const url = proxy
        ? (proxy.includes('?') || proxy.endsWith('=') ? proxy + encodeURIComponent(target) : proxy + target)
        : target;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Vivora Local',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: 'You are a connection test. Reply with the single word: OK.' },
            { role: 'user', content: 'ping' },
          ],
          stream: false,
          max_tokens: 16,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - started);
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch {}
      if (!res.ok) {
        const msg = data?.error?.message || data?.message || text.slice(0, 300) || `HTTP ${res.status}`;
        setTestResult({ ok: false, message: `HTTP ${res.status} — ${msg}`, latencyMs });
        return;
      }
      const reply = data?.choices?.[0]?.message?.content
        ?? data?.choices?.[0]?.delta?.content
        ?? '(empty response)';
      setTestResult({ ok: true, message: 'Connection successful', latencyMs, reply: typeof reply === 'string' ? reply : JSON.stringify(reply) });
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - started);
      const msg = e?.name === 'AbortError' ? 'Request timed out after 30s' : (e?.message || 'Network error (CORS / unreachable host)');
      setTestResult({ ok: false, message: msg, latencyMs });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-serif">AI Provider · Profile</h2>
      </div>

      {/* Profile */}
      <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-white/50" />
            <CardTitle className="text-sm text-white/80">Your name</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
            className="bg-white/[0.03] border-white/[0.08] text-white/80" />
        </CardContent>
      </Card>

      {/* Provider Picker */}
      <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/80">AI Provider</CardTitle>
          <CardDescription className="text-white/30">Choose a provider or add your own</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allProviders.map(p => (
              <div key={p.id} className="relative group">
                <button type="button" onClick={() => selectProvider(p.id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                    settings.providerId === p.id
                      ? 'bg-violet-500/15 border-violet-500/40 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04]'
                  }`}>
                  {p.label}
                </button>
                {p.custom && (
                  <button type="button" onClick={() => removeCustomProvider(p.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setShowAddProvider(!showAddProvider)}
              className="px-3 py-2.5 rounded-lg text-xs font-medium border border-dashed border-white/[0.12] text-white/50 hover:bg-white/[0.04] hover:text-white/80 flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Provider
            </button>
          </div>

          {preset?.notes && <p className="text-[11px] text-amber-400/80">⚠ {preset.notes}</p>}

          {showAddProvider && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={newProvider.id} onChange={e => setNewProvider(p => ({ ...p, id: e.target.value }))}
                  placeholder="id (e.g. my-provider)" className="text-xs bg-white/[0.03] border-white/[0.08] text-white/80" />
                <Input value={newProvider.label} onChange={e => setNewProvider(p => ({ ...p, label: e.target.value }))}
                  placeholder="Display label" className="text-xs bg-white/[0.03] border-white/[0.08] text-white/80" />
              </div>
              <Input value={newProvider.baseUrl} onChange={e => setNewProvider(p => ({ ...p, baseUrl: e.target.value }))}
                placeholder="Base URL (https://api.example.com/v1)" className="text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
              <Input value={newProvider.model} onChange={e => setNewProvider(p => ({ ...p, model: e.target.value }))}
                placeholder="Default model id (optional)" className="text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAddProvider(false)}>Cancel</Button>
                <Button size="sm" onClick={addProvider}>Add</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Base URL + API Key */}
      <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/80">Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 mb-1 block">Base URL</label>
            <Input value={settings.baseUrl} onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1" className="text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1 block">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input type={showKey ? 'text' : 'password'} value={settings.apiKey}
                onChange={e => updateApiKey(e.target.value)}
                placeholder="sk-..." className="pl-9 pr-10 text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-1">Stored locally in your browser only.</p>
          </div>
        </CardContent>
      </Card>

      {/* Models */}
      <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/80">Model</CardTitle>
          <CardDescription className="text-white/30">Pick a built-in model or add your own</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {builtinModels.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {builtinModels.map(m => (
                  <button key={m} type="button" onClick={() => setSettings(s => ({ ...s, model: m }))}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-all ${
                      settings.model === m
                        ? 'bg-violet-500/15 border-violet-500/40 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04]'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {extraModels.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Your models</p>
              <div className="flex flex-wrap gap-1.5">
                {extraModels.map(m => (
                  <div key={m} className="flex items-center gap-1">
                    <button type="button" onClick={() => setSettings(s => ({ ...s, model: m }))}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-all ${
                        settings.model === m
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04]'}`}>
                      {m}
                    </button>
                    <button type="button" onClick={() => removeCustomModel(m)}
                      className="p-1 text-white/30 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Input value={newModel} onChange={e => setNewModel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addModel()}
              placeholder="Add a model id (e.g. gpt-4o)" className="text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
            <Button size="sm" onClick={addModel} disabled={!newModel.trim()} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>

          <div>
            <label className="text-[11px] text-white/40 mb-1 block">Active model</label>
            <Input value={settings.model} onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
              placeholder="model id" className="text-xs font-mono bg-white/[0.03] border-white/[0.08] text-white/80" />
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <div className={`mb-3 p-3 rounded-lg border text-xs flex items-start gap-2 ${
          testResult.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-red-500/10 border-red-500/30 text-red-200'
        }`}>
          {testResult.ok
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {testResult.ok ? 'Success' : 'Test failed'}
              {typeof testResult.latencyMs === 'number' && (
                <span className="ml-2 opacity-60">· {testResult.latencyMs}ms</span>
              )}
            </p>
            <p className="opacity-80 break-words whitespace-pre-wrap mt-0.5">{testResult.message}</p>
            {testResult.reply && (
              <p className="opacity-70 mt-1 font-mono">Reply: {testResult.reply}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-1.5 border-white/10 text-white/80 hover:bg-white/[0.06]">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
        <Button onClick={handleSave} className="gap-1.5 bg-violet-500 hover:bg-violet-600">
          <Check className="w-4 h-4" /> Save AI & Profile
        </Button>
      </div>
    </>
  );
};

export default Settings;

