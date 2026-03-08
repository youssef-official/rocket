import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MacDock } from './MacDock';
import { MacMenuBar } from './MacMenuBar';
import { MacWindowFrame } from './MacWindowFrame';
import { MacDesktop, DESKTOP_APPS, type DesktopApp } from './MacDesktop';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MacLayoutProps {
  children: React.ReactNode;
}

// Pages where we skip macOS chrome entirely
const SKIP_PAGES = ['/login', '/get-started'];
const EDITOR_PATTERN = /^\/projects\/[^/]+$/;

const PAGE_TITLES: Record<string, string> = {
  '/': 'Vivora X',
  '/dashboard': 'Projects',
  '/settings': 'Settings',
  '/billing': 'Billing',
  '/pricing': 'Pricing',
  '/docs': 'Documentation',
  '/blog': 'Blog',
  '/faq': 'FAQ',
  '/ai-for-all': 'AI for All',
  '/about': 'About Us',
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
}

const getWallpaper = () => {
  return localStorage.getItem('vivora_wallpaper') || '/wallpapers/macos-sonoma.jpg';
};

export const MacLayout: React.FC<MacLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState(getWallpaper);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [topZ, setTopZ] = useState(10);
  const [activeMenuBarApp, setActiveMenuBarApp] = useState<string>('Finder');

  const isSkipped = SKIP_PAGES.includes(location.pathname) || EDITOR_PATTERN.test(location.pathname);

  useEffect(() => {
    const handler = () => setWallpaper(getWallpaper());
    window.addEventListener('vivora-wallpaper-change', handler);
    return () => window.removeEventListener('vivora-wallpaper-change', handler);
  }, []);

  // Sync: if route is not "/" and no window is open for it, open one
  useEffect(() => {
    if (isSkipped || location.pathname === '/') return;
    const existingWin = openWindows.find(w => w.app.path === location.pathname);
    if (!existingWin) {
      const app = DESKTOP_APPS.find(a => a.path === location.pathname);
      if (app) {
        openApp(app);
      }
    }
  }, [location.pathname]);

  const openApp = useCallback((app: DesktopApp) => {
    // Special apps
    if (app.path === '/__music__') {
      window.dispatchEvent(new CustomEvent('vivora-music-toggle', { detail: 'open' }));
      return;
    }
    if (app.path === '/__terminal__') {
      // Easter egg: just show a fun terminal window
    }

    // Check if already open
    setOpenWindows(prev => {
      const existing = prev.find(w => w.app.id === app.id);
      if (existing) {
        // Bring to front / un-minimize
        const newZ = topZ + 1;
        setTopZ(newZ);
        return prev.map(w => w.app.id === app.id ? { ...w, minimized: false, zIndex: newZ } : w);
      }
      const newZ = topZ + 1;
      setTopZ(newZ);
      return [...prev, { id: app.id, app, minimized: false, zIndex: newZ }];
    });

    setActiveMenuBarApp(app.label);

    // Navigate if it's a real route
    if (!app.path.startsWith('/__')) {
      navigate(app.path);
    }
  }, [topZ, navigate]);

  const closeWindow = useCallback((appId: string) => {
    setOpenWindows(prev => prev.filter(w => w.app.id !== appId));
    // If we just closed the current route's window, go home
    const closedApp = openWindows.find(w => w.app.id === appId);
    if (closedApp && closedApp.app.path === location.pathname) {
      navigate('/');
    }
    setActiveMenuBarApp('Finder');
  }, [openWindows, location.pathname, navigate]);

  const minimizeWindow = useCallback((appId: string) => {
    setOpenWindows(prev => prev.map(w => w.app.id === appId ? { ...w, minimized: true } : w));
  }, []);

  const focusWindow = useCallback((appId: string) => {
    const newZ = topZ + 1;
    setTopZ(newZ);
    setOpenWindows(prev => prev.map(w => w.app.id === appId ? { ...w, zIndex: newZ, minimized: false } : w));
    const app = openWindows.find(w => w.app.id === appId);
    if (app) setActiveMenuBarApp(app.app.label);
  }, [topZ, openWindows]);

  if (isSkipped) {
    return <>{children}</>;
  }

  const isDesktop = location.pathname === '/';
  const currentPageTitle = PAGE_TITLES[location.pathname] || 'Vivora X';

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
      <MacMenuBar activeApp={activeMenuBarApp} />

      {/* Desktop area */}
      <div className="absolute inset-0 pt-[26px] pb-[68px]">
        {/* Always show desktop icons behind windows */}
        <MacDesktop onOpenApp={openApp} />

        {/* Windows */}
        <AnimatePresence>
          {openWindows.map(win => {
            if (win.minimized) return null;
            // Determine content: if this window matches current route, show children
            const isCurrentRoute = win.app.path === location.pathname;

            return (
              <motion.div
                key={win.id}
                initial={{ scale: 0.5, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 100 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="absolute inset-0 flex items-center justify-center p-4 pt-2"
                style={{ zIndex: win.zIndex }}
                onClick={() => focusWindow(win.app.id)}
              >
                <MacWindowFrame
                  title={win.app.label}
                  onClose={() => closeWindow(win.app.id)}
                  onMinimize={() => minimizeWindow(win.app.id)}
                >
                  {isCurrentRoute ? (
                    children
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                      <div className="text-center">
                        <win.app.icon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p>Click to load {win.app.label}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(win.app.path);
                          }}
                          className="mt-3 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 text-xs transition"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  )}
                </MacWindowFrame>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dock */}
      <MacDock
        openWindows={openWindows}
        onDockClick={(appId) => {
          const app = DESKTOP_APPS.find(a => a.id === appId);
          if (app) openApp(app);
        }}
      />
    </div>
  );
};
