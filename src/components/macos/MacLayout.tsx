import React, { useState, useEffect, useCallback } from 'react';
import { MacDock } from './MacDock';
import { MacMenuBar } from './MacMenuBar';
import { MacWindowFrame } from './MacWindowFrame';
import { MacDesktop, DESKTOP_APPS, type DesktopApp } from './MacDesktop';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

interface MacLayoutProps {
  children: React.ReactNode;
}

const SKIP_PAGES = ['/login', '/get-started'];
const EDITOR_PATTERN = /^\/projects\/[^/]+$/;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Projects',
  '/settings': 'System Preferences',
  '/billing': 'Billing',
  '/pricing': 'Pricing',
  '/docs': 'Documentation',
  '/blog': 'Blog',
  '/faq': 'FAQ',
  '/ai-for-all': 'AI for All',
  '/about': 'About Vivora X',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/admin': 'Admin Panel',
  '/new-vibe-tool': 'Vibe Tool',
};

interface OpenWindow {
  id: string;
  app: DesktopApp;
  minimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
}

const getWallpaper = () => localStorage.getItem('vivora_wallpaper') || '/wallpapers/macos-sonoma.jpg';

export const MacLayout: React.FC<MacLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState(getWallpaper);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [topZ, setTopZ] = useState(100);
  const [activeApp, setActiveApp] = useState('Finder');

  const isSkipped = SKIP_PAGES.includes(location.pathname) || EDITOR_PATTERN.test(location.pathname);

  useEffect(() => {
    const handler = () => setWallpaper(getWallpaper());
    window.addEventListener('vivora-wallpaper-change', handler);
    return () => window.removeEventListener('vivora-wallpaper-change', handler);
  }, []);

  // Sync route to window
  useEffect(() => {
    if (isSkipped || location.pathname === '/') return;
    const existing = openWindows.find(w => w.app.path === location.pathname);
    if (!existing) {
      const app = DESKTOP_APPS.find(a => a.path === location.pathname);
      if (app) openApp(app);
    } else if (existing.minimized) {
      focusWindow(existing.app.id);
    }
  }, [location.pathname]);

  const openApp = useCallback((app: DesktopApp) => {
    if (app.path === '/__music__') {
      window.dispatchEvent(new CustomEvent('vivora-music-toggle', { detail: 'open' }));
      return;
    }
    if (app.path === '/__terminal__') {
      // Could open a fun terminal window
      return;
    }

    setOpenWindows(prev => {
      const existing = prev.find(w => w.app.id === app.id);
      if (existing) {
        const newZ = topZ + 1;
        setTopZ(newZ);
        setActiveApp(app.label);
        return prev.map(w => w.app.id === app.id ? { ...w, minimized: false, zIndex: newZ } : w);
      }
      
      // Calculate staggered position
      const offset = prev.length * 30;
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveApp(app.label);
      
      return [...prev, {
        id: app.id,
        app,
        minimized: false,
        zIndex: newZ,
        position: { x: 80 + offset, y: 50 + offset },
      }];
    });

    if (!app.path.startsWith('/__')) {
      navigate(app.path);
    }
  }, [topZ, navigate]);

  const closeWindow = useCallback((appId: string) => {
    const win = openWindows.find(w => w.app.id === appId);
    setOpenWindows(prev => prev.filter(w => w.app.id !== appId));
    if (win && win.app.path === location.pathname) {
      navigate('/');
    }
    // Set active to last window or Finder
    const remaining = openWindows.filter(w => w.app.id !== appId && !w.minimized);
    setActiveApp(remaining.length > 0 ? remaining[remaining.length - 1].app.label : 'Finder');
  }, [openWindows, location.pathname, navigate]);

  const minimizeWindow = useCallback((appId: string) => {
    setOpenWindows(prev => prev.map(w => w.app.id === appId ? { ...w, minimized: true } : w));
    const remaining = openWindows.filter(w => w.app.id !== appId && !w.minimized);
    setActiveApp(remaining.length > 0 ? remaining[remaining.length - 1].app.label : 'Finder');
  }, [openWindows]);

  const focusWindow = useCallback((appId: string) => {
    const newZ = topZ + 1;
    setTopZ(newZ);
    setOpenWindows(prev => prev.map(w => w.app.id === appId ? { ...w, zIndex: newZ, minimized: false } : w));
    const app = openWindows.find(w => w.app.id === appId);
    if (app) {
      setActiveApp(app.app.label);
      if (!app.app.path.startsWith('/__')) {
        navigate(app.app.path);
      }
    }
  }, [topZ, openWindows, navigate]);

  if (isSkipped) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Menu Bar */}
      <MacMenuBar activeApp={activeApp} />

      {/* Desktop */}
      <div className="absolute inset-0 pt-[26px] pb-[72px]">
        <MacDesktop onOpenApp={openApp} />

        {/* Windows */}
        <AnimatePresence>
          {openWindows.map(win => {
            if (win.minimized) return null;
            const isActive = win.app.path === location.pathname;

            return (
              <MacWindowFrame
                key={win.id}
                title={PAGE_TITLES[win.app.path] || win.app.label}
                onClose={() => closeWindow(win.app.id)}
                onMinimize={() => minimizeWindow(win.app.id)}
                defaultPosition={win.position}
                defaultSize={{ width: 950, height: 650 }}
                zIndex={win.zIndex}
                onFocus={() => focusWindow(win.app.id)}
              >
                {isActive ? (
                  children
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
                    <div className="text-center">
                      <div className="mb-4 mx-auto w-20 h-20 opacity-30">
                        {win.app.icon}
                      </div>
                      <p className="text-white/30 text-sm mb-3">Loading {win.app.label}...</p>
                      <button
                        onClick={() => navigate(win.app.path)}
                        className="px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0077EE] text-white text-sm font-medium transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                )}
              </MacWindowFrame>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dock */}
      <MacDock
        openWindows={openWindows.map(w => ({ id: w.id, minimized: w.minimized }))}
        onDockClick={(appId) => {
          const app = DESKTOP_APPS.find(a => a.id === appId);
          if (app) openApp(app);
        }}
      />
    </div>
  );
};
