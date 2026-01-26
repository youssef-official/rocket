import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

interface UserMenuDropdownProps {
  user: User;
  signOut: () => void;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ user, signOut }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    };
    
    applyTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

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
        className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <UserIcon className="w-5 h-5 text-white" />
      </button>
      
      {showMenu && (
        <div 
          className="absolute right-0 top-full mt-2 z-[9999]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-52 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-white/60">Free Plan</p>
            </div>
            <div className="p-2">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {getThemeIcon()}
                  Theme
                </div>
                <span className="text-xs text-white/50">{getThemeLabel()}</span>
              </button>
              <button
                type="button"
                onClick={handleSettings}
                className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm cursor-pointer"
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
