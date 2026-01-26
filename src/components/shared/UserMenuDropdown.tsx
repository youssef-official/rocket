import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { useThemePreference } from '@/hooks/useThemePreference';

interface UserMenuDropdownProps {
  user: User;
  signOut: () => void;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ user, signOut }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { theme, cycleTheme } = useThemePreference();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Dark';
    if (theme === 'light') return 'Light';
    return 'System';
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
    navigate('/settings');
  };

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
        className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <UserIcon className="w-5 h-5 text-white" />
      </button>
      
      {showMenu && (
        <div 
          className="absolute right-0 top-full mt-2 z-[9999]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
            <div className="w-52 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-white/60">Free Plan</p>
              </div>
              <div className="p-2">
                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cycleTheme();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {getThemeIcon()}
                    Theme
                  </div>
                  <span className="text-xs text-white/60">{getThemeLabel()}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
