import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FileText, HelpCircle, Sparkles, Info, Newspaper,
  DollarSign, Shield, Wrench, Globe, Music, Terminal, Compass,
  CreditCard, Settings, LayoutGrid
} from 'lucide-react';

// macOS-style app icon component
const MacAppIcon: React.FC<{
  gradient: string;
  children: React.ReactNode;
  size?: number;
}> = ({ gradient, children, size = 64 }) => (
  <div
    className="relative rounded-[22%] flex items-center justify-center shadow-lg"
    style={{
      width: size,
      height: size,
      background: gradient,
      boxShadow: '0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
    }}
  >
    {/* Inner shadow overlay */}
    <div className="absolute inset-0 rounded-[22%]" style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
    }} />
    {children}
  </div>
);

export interface DesktopApp {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

// Create realistic macOS-style app icons
export const DESKTOP_APPS: DesktopApp[] = [
  {
    id: 'dashboard',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #1E90FF 0%, #0066CC 100%)"><Folder className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Projects',
    path: '/dashboard',
  },
  {
    id: 'settings',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #6B6B6B 0%, #3D3D3D 100%)"><Settings className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Settings',
    path: '/settings',
  },
  {
    id: 'billing',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #34C759 0%, #248A3D 100%)"><CreditCard className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Billing',
    path: '/billing',
  },
  {
    id: 'pricing',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #FF9500 0%, #CC7700 100%)"><DollarSign className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Pricing',
    path: '/pricing',
  },
  {
    id: 'docs',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #AF52DE 0%, #8944AB 100%)"><FileText className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Docs',
    path: '/docs',
  },
  {
    id: 'blog',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #FF2D55 0%, #CC2244 100%)"><Newspaper className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Blog',
    path: '/blog',
  },
  {
    id: 'faq',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #FFCC00 0%, #CC9900 100%)"><HelpCircle className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'FAQ',
    path: '/faq',
  },
  {
    id: 'ai',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #BF5AF2 0%, #9944CC 100%)"><Sparkles className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'AI for All',
    path: '/ai-for-all',
  },
  {
    id: 'about',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #30B0C7 0%, #248A9D 100%)"><Info className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'About',
    path: '/about',
  },
  {
    id: 'admin',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #FF3B30 0%, #CC2F26 100%)"><Shield className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Admin',
    path: '/admin',
  },
  {
    id: 'terminal',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #1C1C1E 0%, #000000 100%)"><Terminal className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Terminal',
    path: '/__terminal__',
  },
  {
    id: 'music',
    icon: <MacAppIcon gradient="linear-gradient(180deg, #FA2D48 0%, #A01832 100%)"><Music className="w-8 h-8 text-white drop-shadow" /></MacAppIcon>,
    label: 'Music',
    path: '/__music__',
  },
];

interface MacDesktopProps {
  onOpenApp: (app: DesktopApp) => void;
}

export const MacDesktop: React.FC<MacDesktopProps> = ({ onOpenApp }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedId(null);
  }, []);

  const handleDesktopClick = useCallback(() => {
    setContextMenu(null);
    setSelectedId(null);
  }, []);

  return (
    <div
      className="w-full h-full relative select-none"
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {/* Desktop icons grid - top right like macOS */}
      <div className="absolute top-3 right-3 grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, 90px)', direction: 'rtl' }}>
        {DESKTOP_APPS.map((app, i) => {
          const isSelected = selectedId === app.id;

          return (
            <motion.div
              key={app.id}
              data-app-icon
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-default transition-all w-[88px] ${
                isSelected ? 'bg-white/25 ring-2 ring-white/40' : 'hover:bg-white/10'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(app.id);
                setContextMenu(null);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenApp(app);
              }}
            >
              <div className="transform transition-transform hover:scale-105">
                {app.icon}
              </div>
              <span
                className={`text-[11px] text-center leading-tight font-medium line-clamp-2 px-1 py-0.5 rounded ${
                  isSelected ? 'bg-[#0066CC] text-white' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                }`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
              >
                {app.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <MacContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Context Menu ───────────────────────────────────────
const MacContextMenu: React.FC<{ x: number; y: number; onClose: () => void }> = ({ x, y, onClose }) => {
  const items = [
    { label: 'New Folder', shortcut: '⇧⌘N' },
    { label: 'Get Info', shortcut: '⌘I' },
    { type: 'separator' as const },
    { label: 'Change Desktop Background...' },
    { label: 'Use Stacks' },
    { type: 'separator' as const },
    { label: 'Sort By', submenu: true },
    { label: 'Clean Up' },
    { type: 'separator' as const },
    { label: 'Show View Options', shortcut: '⌘J' },
  ];

  const adjustedX = Math.min(x, window.innerWidth - 230);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.08 }}
      className="fixed z-[9999] w-[230px] py-1.5 rounded-lg overflow-hidden"
      style={{
        left: adjustedX,
        top: adjustedY,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        background: 'rgba(40,40,40,0.95)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="my-1.5 mx-2 border-t border-white/[0.1]" />;
        }
        return (
          <button
            key={i}
            onClick={onClose}
            className="w-full flex items-center justify-between px-3 py-[5px] text-[13px] text-white/90 hover:bg-[#0066CC] transition-colors"
          >
            <span>{item.label}</span>
            {'shortcut' in item && item.shortcut && (
              <span className="text-[11px] text-white/40">{item.shortcut}</span>
            )}
            {'submenu' in item && item.submenu && (
              <span className="text-white/40">▶</span>
            )}
          </button>
        );
      })}
    </motion.div>
  );
};
