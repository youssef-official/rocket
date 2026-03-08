import React, { useState, useEffect } from 'react';
import { MacDock } from './MacDock';
import { MacMenuBar } from './MacMenuBar';
import { MacWindowFrame } from './MacWindowFrame';
import { useLocation, useNavigate } from 'react-router-dom';
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
};

const getWallpaper = () => {
  return localStorage.getItem('vivora_mac_wallpaper') || '/wallpapers/macos-sonoma.jpg';
};

export const MacLayout: React.FC<MacLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState(getWallpaper);
  const isSkipped = SKIP_PAGES.includes(location.pathname) || EDITOR_PATTERN.test(location.pathname);

  useEffect(() => {
    const handler = () => setWallpaper(getWallpaper());
    window.addEventListener('vivora-wallpaper-change', handler);
    return () => window.removeEventListener('vivora-wallpaper-change', handler);
  }, []);

  if (isSkipped) {
    return <>{children}</>;
  }

  const pageTitle = PAGE_TITLES[location.pathname] || 'Vivora X';
  const isHome = location.pathname === '/';

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
      <MacMenuBar />

      {/* Desktop area */}
      <div className={`absolute inset-0 pt-[26px] ${isHome ? 'pb-[68px]' : 'pb-[68px] px-3 pt-[34px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {isHome ? (
              // Home page renders directly (full-screen feel)
              <div className="w-full h-full overflow-auto">
                {children}
              </div>
            ) : (
              // Other pages get the window frame
              <div className="w-full h-full flex items-start justify-center pt-2">
                <MacWindowFrame
                  title={pageTitle}
                  onClose={() => navigate('/')}
                >
                  {children}
                </MacWindowFrame>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dock */}
      <MacDock />
    </div>
  );
};
