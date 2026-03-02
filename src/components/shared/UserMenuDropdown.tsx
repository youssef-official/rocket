import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings2, LogOut, Moon, Sun, Monitor, Coins, Crown, Sparkles, ImageIcon, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { LanguageSelector } from './LanguageSelector';
import { Progress } from '@/components/ui/progress';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';
import lightHeroBg from '@/assets/light-hero-bg.jpg';

interface UserMenuDropdownProps {
  user: User;
  signOut: () => void;
  onUpgradeClick?: () => void;
  onSettingsClick?: () => void;
}

const WALLPAPERS = [
  { id: 'aurora-gradient', label: 'Aurora', src: 'gradient:aurora', gradient: 'linear-gradient(to bottom, #0d0d0d 0%, #1a0a1e 40%, #2d1b4e 60%, #1a3a5c 80%, #0d0d0d 100%)' },
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

// Export for use in HomePage
export const getWallpaperSrc = (id: string): string => {
  const wp = WALLPAPERS.find(w => w.id === id);
  return wp?.src || spaceHeroBg;
};

export const isGradientWallpaper = (id: string): boolean => {
  return id === 'aurora-gradient';
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
                {wp.gradient ? (
                  <div className="w-full h-full" style={{ background: wp.gradient }} />
                ) : (
                  <img src={wp.src} alt={wp.label} className="w-full h-full object-cover" />
                )}
              </div>
              {wp.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ user, signOut, onUpgradeClick, onSettingsClick }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { theme, cycleTheme } = useThemePreference();
  const { t, isRTL } = useLanguage();
  const { userPlan, getRemainingCredits, shouldShowUpgradeBanner } = useUserPlan();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return t('common.dark');
    if (theme === 'light') return t('common.light');
    return t('common.system');
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowMenu(false);
    signOut();
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowMenu(false);
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate('/settings');
    }
  };

  const remainingCredits = getRemainingCredits();
  const planConfig = userPlan ? (PLAN_CONFIG[userPlan.plan] || PLAN_CONFIG.free) : PLAN_CONFIG.free;
  const totalCredits = (userPlan?.dailyCredits || 5) + planConfig.monthlyCredits;
  const usedCredits = totalCredits - remainingCredits.total;
  const usagePercent = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  const showBanner = shouldShowUpgradeBanner();

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-all duration-200 overflow-hidden ring-2 ring-white/[0.08] hover:ring-white/20"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const icon = document.createElement('div');
                icon.className = 'w-5 h-5 text-white flex items-center justify-center';
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                parent.appendChild(icon);
              }
            }}
          />
        ) : (
          <UserIcon className="w-5 h-5 text-white" />
        )}
      </button>

      {showMenu && (
        <div
          className={`absolute ${isRTL ? 'right-auto left-0' : 'right-0'} top-full mt-2 z-[9999]`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-72 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-white/[0.06]">
              <p className={`text-sm font-semibold text-white truncate ${isRTL ? 'text-right' : ''}`}>{user.displayName || user.email}</p>
              <div className={`flex items-center gap-2 mt-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[11px] text-white/50 font-medium bg-white/[0.06] px-2 py-0.5 rounded-md">{planConfig.name}</span>
              </div>
            </div>

            {/* Credits */}
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
              <div className={`flex items-center justify-between mb-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="text-sm text-white/70 font-medium">{t('credits.remaining')}</span>
                </div>
                <span className="text-sm font-bold text-yellow-400">{remainingCredits.total.toFixed(1)}</span>
              </div>

              <Progress
                value={100 - usagePercent}
                className="h-1.5 bg-white/[0.06] mb-2"
              />

              <div className="flex justify-between text-[11px] text-white/40">
                <span>{t('credits.daily')}: {remainingCredits.daily.toFixed(1)}</span>
                {planConfig.monthlyCredits > 0 && (
                  <span>{t('credits.monthly')}: {remainingCredits.monthly.toFixed(1)}</span>
                )}
              </div>

              <p className="text-[10px] text-white/30 mt-1.5">
                {t('credits.resetsDaily')} (UTC)
              </p>
            </div>

            {/* Upgrade Banner */}
            {showBanner && onUpgradeClick && (
              <div className="p-3 bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-b border-white/[0.06]">
                <p className="text-xs text-white/70 mb-2">
                  🚀 {t('credits.runningLow')}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onUpgradeClick();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20"
                >
                  {t('models.upgradeAccess')}
                </button>
              </div>
            )}

            <div className="p-1.5">
              {/* Upgrade for Spark */}
              {userPlan?.plan === 'free' && !showBanner && onUpgradeClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onUpgradeClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 mb-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl transition-all duration-200 text-sm font-semibold cursor-pointer shadow-lg shadow-purple-500/20 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('models.upgradeAccess')}
                </button>
              )}

              <LanguageSelector />

              {/* Theme */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cycleTheme();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {getThemeIcon()}
                  {t('common.theme')}
                </div>
                <span className="text-[11px] text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-md">{getThemeLabel()}</span>
              </button>

              {/* Wallpaper */}
              <WallpaperSelector />

              {/* Music */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('vivora-music-toggle', { detail: 'open' }));
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Music className="w-4 h-4" />
                Music
              </button>

              {/* Billing */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  navigate('/billing');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Coins className="w-4 h-4" />
                Billing
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={handleSettings}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-white/80 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Settings2 className="w-4 h-4" />
                {t('common.settings')}
              </button>

              <div className="my-1 mx-3 border-t border-white/[0.06]" />

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
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
