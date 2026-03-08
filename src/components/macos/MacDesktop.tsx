import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FolderOpen, Settings, CreditCard, FileText, HelpCircle,
  Sparkles, Info, Newspaper, DollarSign, Shield, Wrench,
  Globe, Music, Image, Terminal
} from 'lucide-react';

export interface DesktopApp {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
}

export const DESKTOP_APPS: DesktopApp[] = [
  { id: 'home', icon: Home, label: 'Vivora X', path: '/__mac_app__', color: 'from-blue-500 to-indigo-600' },
  { id: 'dashboard', icon: FolderOpen, label: 'Projects', path: '/dashboard', color: 'from-cyan-400 to-blue-500' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', color: 'from-zinc-400 to-zinc-600' },
  { id: 'billing', icon: CreditCard, label: 'Billing', path: '/billing', color: 'from-green-400 to-emerald-600' },
  { id: 'pricing', icon: DollarSign, label: 'Pricing', path: '/pricing', color: 'from-yellow-400 to-orange-500' },
  { id: 'docs', icon: FileText, label: 'Docs', path: '/docs', color: 'from-purple-400 to-purple-600' },
  { id: 'blog', icon: Newspaper, label: 'Blog', path: '/blog', color: 'from-pink-400 to-rose-500' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ', path: '/faq', color: 'from-amber-400 to-orange-500' },
  { id: 'ai', icon: Sparkles, label: 'AI for All', path: '/ai-for-all', color: 'from-violet-400 to-purple-600' },
  { id: 'about', icon: Info, label: 'About', path: '/about', color: 'from-teal-400 to-cyan-600' },
  { id: 'admin', icon: Shield, label: 'Admin', path: '/admin', color: 'from-red-400 to-red-600' },
  { id: 'privacy', icon: Globe, label: 'Privacy', path: '/privacy', color: 'from-sky-400 to-blue-500' },
  { id: 'terms', icon: FileText, label: 'Terms', path: '/terms', color: 'from-slate-400 to-slate-600' },
  { id: 'vibe', icon: Wrench, label: 'Vibe Tool', path: '/new-vibe-tool', color: 'from-fuchsia-400 to-pink-600' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', path: '/__terminal__', color: 'from-neutral-700 to-neutral-900' },
  { id: 'music', icon: Music, label: 'Music', path: '/__music__', color: 'from-rose-500 to-pink-600' },
];

interface MacDesktopProps {
  onOpenApp: (app: DesktopApp) => void;
}

export const MacDesktop: React.FC<MacDesktopProps> = ({ onOpenApp }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedId(null);
  }, []);

  const handleDesktopClick = useCallback(() => {
    setContextMenu(null);
    setSelectedId(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only start selection if clicking on the desktop itself
    if ((e.target as HTMLElement).closest('[data-app-icon]')) return;
    setSelectionBox({ startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectionBox) return;
    setSelectionBox(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, [isDragging, selectionBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setSelectionBox(null);
  }, []);

  const getSelectionRect = () => {
    if (!selectionBox) return null;
    return {
      left: Math.min(selectionBox.startX, selectionBox.x),
      top: Math.min(selectionBox.startY, selectionBox.y),
      width: Math.abs(selectionBox.x - selectionBox.startX),
      height: Math.abs(selectionBox.y - selectionBox.startY),
    };
  };

  const selRect = getSelectionRect();

  return (
    <div
      className="w-full h-full relative select-none"
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Desktop icons grid - right aligned like macOS */}
      <div className="absolute top-4 right-4 flex flex-col flex-wrap-reverse items-end gap-1 max-h-[calc(100vh-120px)]"
        style={{ writingMode: 'vertical-lr' }}
      >
        {DESKTOP_APPS.map((app, i) => {
          const Icon = app.icon;
          const isSelected = selectedId === app.id;

          return (
            <motion.div
              key={app.id}
              data-app-icon
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
              style={{ writingMode: 'horizontal-tb' }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-default transition-colors w-[76px] ${
                isSelected ? 'bg-white/20' : 'hover:bg-white/10'
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
              <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white drop-shadow" />
              </div>
              <span className="text-[11px] text-white font-medium text-center leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] line-clamp-2">
                {app.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Selection box */}
      {selRect && selRect.width > 5 && selRect.height > 5 && (
        <div
          className="fixed border border-white/40 bg-white/10 rounded-sm pointer-events-none z-50"
          style={{
            left: selRect.left,
            top: selRect.top,
            width: selRect.width,
            height: selRect.height,
          }}
        />
      )}

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <MacContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Context Menu ───────────────────────────────────────
interface MacContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

const MacContextMenu: React.FC<MacContextMenuProps> = ({ x, y, onClose }) => {
  const items = [
    { label: 'New Folder', shortcut: '⇧⌘N' },
    { label: 'Get Info', shortcut: '⌘I' },
    { type: 'separator' as const },
    { label: 'Change Desktop Background...', action: () => {
      window.dispatchEvent(new CustomEvent('vivora-open-wallpaper-picker'));
      onClose();
    }},
    { label: 'Use Stacks', checked: false },
    { type: 'separator' as const },
    { label: 'Sort By', submenu: true },
    { label: 'Clean Up', shortcut: '' },
    { label: 'Clean Up By', submenu: true },
    { type: 'separator' as const },
    { label: 'Show View Options', shortcut: '⌘J' },
  ];

  // Adjust position if near edge
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[9999] w-[220px] py-1 rounded-lg bg-[#2a2a2a]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/50"
      style={{ left: adjustedX, top: adjustedY, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="my-1 mx-2 border-t border-white/[0.08]" />;
        }
        return (
          <button
            key={i}
            onClick={() => {
              if ('action' in item && item.action) item.action();
              else onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-[3px] text-[13px] text-white/90 hover:bg-[#3b82f6] hover:text-white rounded-[4px] mx-1 transition-colors"
            style={{ width: 'calc(100% - 8px)' }}
          >
            <span>{item.label}</span>
            {'shortcut' in item && item.shortcut && (
              <span className="text-[11px] text-white/30">{item.shortcut}</span>
            )}
            {'submenu' in item && item.submenu && (
              <span className="text-white/30 text-[10px]">▶</span>
            )}
          </button>
        );
      })}
    </motion.div>
  );
};
