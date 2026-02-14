import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings, LogOut, Moon, Sun, Monitor, Coins, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { LanguageSelector } from './LanguageSelector';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface UserMenuDropdownProps {
  user: User;
  signOut: () => void;
  onUpgradeClick?: () => void;
  onSettingsClick?: () => void;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ user, signOut, onUpgradeClick, onSettingsClick }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { theme, cycleTheme } = useThemePreference();
  const { t, isRTL } = useLanguage();
  const { userPlan, loading: planLoading, getRemainingCredits, shouldShowUpgradeBanner } = useUserPlan();
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
  const planConfig = userPlan ? PLAN_CONFIG[userPlan.plan] : PLAN_CONFIG.spark;
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
        className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity overflow-hidden"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
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
          <div className="w-72 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl">
            <div className="p-3 border-b border-white/10">
              <p className={`text-sm font-medium text-white truncate ${isRTL ? 'text-right' : ''}`}>{user.displayName || user.email}</p>
              <div className={`flex items-center justify-between mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {planLoading ? (
                  <Skeleton className="h-4 w-24 bg-white/10" />
                ) : (
                  <span className="text-xs text-white/60">{planConfig.name} Plan</span>
                )}
              </div>
            </div>

            {/* Credits Display with Progress Bar */}
            <div className="p-3 border-b border-white/10 bg-white/5">
              {planLoading ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 bg-white/10" />
                    <Skeleton className="h-4 w-8 bg-white/10" />
                  </div>
                  <Skeleton className="h-2 w-full bg-white/10" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16 bg-white/5" />
                    <Skeleton className="h-3 w-16 bg-white/5" />
                  </div>
                </div>
              ) : (
                <>
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white/80">{t('credits.remaining')}</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{remainingCredits.total.toFixed(1)}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <Progress 
                      value={100 - usagePercent} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                  
                  {/* Breakdown */}
                  <div className="flex justify-between text-xs text-white/50">
                    <span>{t('credits.daily')}: {remainingCredits.daily.toFixed(1)}</span>
                    {planConfig.monthlyCredits > 0 && (
                      <span>{t('credits.monthly')}: {remainingCredits.monthly.toFixed(1)}</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-white/40 mt-1">
                    {t('credits.resetsDaily')} (UTC)
                  </p>
                </>
              )}
            </div>

            {/* Upgrade Banner when 50% used */}
            {!planLoading && showBanner && onUpgradeClick && (
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                <p className="text-xs text-white/80 mb-2">
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
                  className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('models.upgradeAccess')}
                </button>
              </div>
            )}

            <div className="p-2">
              {/* Upgrade Button for Spark users */}
              {!planLoading && userPlan?.plan === 'spark' && !showBanner && onUpgradeClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onUpgradeClick();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 mb-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg transition-colors text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Crown className="w-4 h-4" />
                  {t('models.upgradeAccess')}
                </button>
              )}

              {/* Language Selector */}
              <LanguageSelector />

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cycleTheme();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {getThemeIcon()}
                  {t('common.theme')}
                </div>
                <span className="text-xs text-white/60">{getThemeLabel()}</span>
              </button>
              <button
                type="button"
                onClick={handleSettings}
                className={`w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Settings className="w-4 h-4" />
                {t('common.settings')}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className={`w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
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
