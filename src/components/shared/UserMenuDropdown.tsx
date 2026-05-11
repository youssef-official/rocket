import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings2, LogOut, Moon, Sun, Monitor, ImageIcon, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import lightHeroBg from '@/assets/light-hero-bg.jpg';
import auroraGradientBg from '@/assets/aurora-gradient-bg.png';

interface UserMenuDropdownProps {
  user: User;
  signOut: () => void;
}

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
  { id: 'cyberpunk', label: 'Cyberpunk', src: '/wallpapers/cyberpunk.jpg' },
  { id: 'northern-lights', label: 'Northern Lights', src: '/wallpapers/northern-lights.jpg' },
  { id: 'cozy-cafe', label: 'Cozy Café', src: '/wallpapers/cozy-cafe.jpg' },
  { id: 'starry-night', label: 'Starry Night', src: '/wallpapers/starry-night.jpg' },
  { id: 'sakura', label: 'Sakura', src: '/wallpapers/sakura.jpg' },
  { id: 'neon-tokyo', label: 'Neon Tokyo', src: '/wallpapers/neon-tokyo.jpg' },
];

export const getWallpaperSrc = (id: string): string => {
  const wp = WALLPAPERS.find(w => w.id === id);
  return wp?.src || spaceHeroBg;
};

const WallpaperSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const current = localStorage.getItem('vivora_wallpaper') || 'space';
  const select = (id: string) => {
    localStorage.setItem('vivora_wallpaper', id);
    setOpen(false);
    window.dispatchEvent(new Event('vivora-wallpaper-change'));
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer"
      >
        <ImageIcon className="w-4 h-4" />
        Wallpaper
      </button>
      {open && (
        <div className="mt-1 p-2 bg-white/[0.06] rounded-xl border border-white/[0.08] space-y-1 max-h-48 overflow-y-auto">
          {WALLPAPERS.map(wp => (
            <button
              key={wp.id}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); select(wp.id); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${current === wp.id ? 'bg-violet-500/20 text-violet-300' : 'text-white/60 hover:bg-white/[0.04]'}`}
            >
              <div className="w-8 h-5 rounded overflow-hidden border border-white/10">
                <img src={wp.src} alt={wp.label} className="w-full h-full object-cover" />
              </div>
              {wp.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ user, signOut }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { theme, cycleTheme } = useThemePreference();
  const { t, isRTL } = useLanguage();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getThemeIcon = () => theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  const getThemeLabel = () => theme === 'dark' ? t('common.dark') : theme === 'light' ? t('common.light') : t('common.system');

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setShowMenu(true);
  };
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setShowMenu(false), 300);
  };

  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); }, []);

  return (
    <div ref={menuRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-all duration-200 overflow-hidden ring-2 ring-white/[0.08] hover:ring-white/20"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          <UserIcon className="w-5 h-5 text-white" />
        )}
      </button>

      {showMenu && (
        <div className={`absolute ${isRTL ? 'right-auto left-0' : 'right-0'} top-full mt-2 z-[9999]`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <div className="w-72 max-w-[calc(100vw-2rem)] bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40">
            <div className="p-4 border-b border-white/[0.06]">
              <p className={`text-sm font-semibold text-white truncate ${isRTL ? 'text-right' : ''}`}>{user.displayName || user.email}</p>
              <p className={`text-[11px] text-white/40 mt-0.5 ${isRTL ? 'text-right' : ''}`}>Local · Open Source</p>
            </div>

            <div className="p-1.5">
              <LanguageSelector />

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleTheme(); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {getThemeIcon()}
                  {t('common.theme')}
                </div>
                <span className="text-[11px] text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-md">{getThemeLabel()}</span>
              </button>

              <WallpaperSelector />

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent('vivora-music-toggle', { detail: 'open' })); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Music className="w-4 h-4" />
                Music
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); navigate('/settings'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Settings2 className="w-4 h-4" />
                Settings
              </button>

              <div className="my-1 mx-3 border-t border-white/[0.06]" />

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); signOut(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <LogOut className="w-4 h-4" />
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
