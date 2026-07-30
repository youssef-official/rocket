import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Palette, ImageIcon,
  Check, PartyPopper
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import auroraGradientBg from '@/assets/aurora-gradient-bg.png';

// ─── Color Presets ───
const COLOR_PRESETS = [
  { id: 'midnight', name: 'Vivora Midnight', bg: '#0b1020', accent: '#ec4899', label: 'Signature' },
  { id: 'deep-blue', name: 'Deep Space', bg: '#08111f', accent: '#38bdf8', label: 'Cosmic' },
  { id: 'charcoal', name: 'Graphite', bg: '#15171c', accent: '#f472b6', label: 'Focused' },
  { id: 'dark-emerald', name: 'Aurora', bg: '#071713', accent: '#34d399', label: 'Luminous' },
  { id: 'warm-dark', name: 'Solar Dust', bg: '#1a1214', accent: '#fb7185', label: 'Warm' },
  { id: 'royal', name: 'Royal Orbit', bg: '#100c24', accent: '#c084fc', label: 'Violet' },
];

const WALLPAPERS = [
  { id: 'aurora-gradient', label: 'Aurora', src: auroraGradientBg },
  { id: 'space', label: 'Space', src: spaceHeroBg },
  { id: 'nebula', label: 'Nebula', src: '/wallpapers/nebula.jpg' },
  { id: 'forest', label: 'Forest', src: '/wallpapers/forest.jpg' },
  { id: 'ocean', label: 'Ocean', src: '/wallpapers/ocean.jpg' },
  { id: 'mountains', label: 'Mountains', src: '/wallpapers/mountains.jpg' },
  { id: 'city-night', label: 'City Night', src: '/wallpapers/city-night.jpg' },
  { id: 'tropical', label: 'Tropical', src: '/wallpapers/tropical.jpg' },
  { id: 'gradient-purple', label: 'Purple Flow', src: '/wallpapers/gradient-purple.jpg' },
  { id: 'zen-garden', label: 'Zen Garden', src: '/wallpapers/zen-garden.jpg' },
  { id: 'cyberpunk', label: 'Cyberpunk', src: '/wallpapers/cyberpunk.jpg' },
  { id: 'northern-lights', label: 'Northern Lights', src: '/wallpapers/northern-lights.jpg' },
  { id: 'starry-night', label: 'Starry Night', src: '/wallpapers/starry-night.jpg' },
  { id: 'sakura', label: 'Sakura', src: '/wallpapers/sakura.jpg' },
  { id: 'deep-ocean', label: 'Deep Ocean', src: '/wallpapers/deep-ocean.jpg' },
  { id: 'neon-tokyo', label: 'Neon Tokyo', src: '/wallpapers/neon-tokyo.jpg' },
  { id: 'lavender', label: 'Lavender', src: '/wallpapers/lavender.jpg' },
];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  // Customization
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem('vivora_color_preset') || 'midnight');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('vivora_custom_bg') || '#1B1B1B');
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('vivora_custom_accent') || '#ec4899');
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
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/60 hover:text-white hover:bg-white/[0.06]">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-serif">Appearance</h2>
          </div>

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
                        ? 'border-pink-500/50 bg-pink-500/5'
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
                        <Check className="w-3 h-3 text-pink-400" />
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
                        placeholder="#ec4899"
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
              <div className="flex items-center gap-2">
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
                        ? 'border-pink-500 ring-1 ring-pink-500/30'
                        : 'border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <img src={wp.src} alt={wp.label} className="w-full h-full object-cover" />
                    {selectedWallpaper === wp.id && (
                      <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
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
              <div className="flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-white/50" />
                <CardTitle className="text-sm text-white/80">Celebrations</CardTitle>
              </div>
              <CardDescription className="text-white/30">Show seasonal celebration effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Ramadan</p>
                  <p className="text-[11px] text-white/30">🌙 Crescent moon & lantern effects</p>
                </div>
                <Switch checked={showRamadan} onCheckedChange={setShowRamadan} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Eid</p>
                  <p className="text-[11px] text-white/30">🎉 Confetti & celebration effects</p>
                </div>
                <Switch checked={showEid} onCheckedChange={setShowEid} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </main>
    </div>
  );
};

export default Settings;
