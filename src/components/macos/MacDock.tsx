import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DESKTOP_APPS } from './MacDesktop';
import {
  Folder, FileText, HelpCircle, Sparkles, Info, Newspaper,
  DollarSign, CreditCard, Settings, Music, Shield, Terminal
} from 'lucide-react';

interface OpenWindow {
  id: string;
  minimized: boolean;
}

interface MacDockProps {
  openWindows?: OpenWindow[];
  onDockClick?: (appId: string) => void;
}

// macOS-style dock icon
const DockIcon: React.FC<{
  gradient: string;
  icon: React.ElementType;
  isHovered: boolean;
}> = ({ gradient, icon: Icon, isHovered }) => (
  <div
    className="relative rounded-[22%] flex items-center justify-center transition-transform"
    style={{
      width: 50,
      height: 50,
      background: gradient,
      boxShadow: isHovered
        ? '0 8px 30px -6px rgba(0,0,0,0.5)'
        : '0 4px 15px -4px rgba(0,0,0,0.4)',
    }}
  >
    <div className="absolute inset-0 rounded-[22%]" style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%)',
    }} />
    <Icon className="w-6 h-6 text-white drop-shadow" />
  </div>
);

const DOCK_APPS = [
  { id: 'dashboard', icon: Folder, gradient: 'linear-gradient(180deg, #1E90FF 0%, #0066CC 100%)', label: 'Projects' },
  { id: 'settings', icon: Settings, gradient: 'linear-gradient(180deg, #6B6B6B 0%, #3D3D3D 100%)', label: 'Settings' },
  { id: 'billing', icon: CreditCard, gradient: 'linear-gradient(180deg, #34C759 0%, #248A3D 100%)', label: 'Billing' },
  { id: 'pricing', icon: DollarSign, gradient: 'linear-gradient(180deg, #FF9500 0%, #CC7700 100%)', label: 'Pricing' },
  { id: 'docs', icon: FileText, gradient: 'linear-gradient(180deg, #AF52DE 0%, #8944AB 100%)', label: 'Docs' },
  { id: 'blog', icon: Newspaper, gradient: 'linear-gradient(180deg, #FF2D55 0%, #CC2244 100%)', label: 'Blog' },
  { id: 'faq', icon: HelpCircle, gradient: 'linear-gradient(180deg, #FFCC00 0%, #CC9900 100%)', label: 'FAQ' },
  { id: 'ai', icon: Sparkles, gradient: 'linear-gradient(180deg, #BF5AF2 0%, #9944CC 100%)', label: 'AI for All' },
  { id: 'about', icon: Info, gradient: 'linear-gradient(180deg, #30B0C7 0%, #248A9D 100%)', label: 'About' },
];

export const MacDock: React.FC<MacDockProps> = ({ openWindows = [], onDockClick }) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setHoveredId(null);
  };

  const getScale = (index: number) => {
    if (mouseX === null) return 1;
    const itemSize = 56;
    const gap = 4;
    const padding = 12;
    const center = padding + index * (itemSize + gap) + itemSize / 2;
    const dist = Math.abs(mouseX - center);
    const maxDist = 80;
    if (dist > maxDist) return 1;
    return 1 + 0.4 * Math.cos((dist / maxDist) * (Math.PI / 2));
  };

  return (
    <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-[9998]">
      <motion.div
        ref={dockRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-end gap-1 px-3 py-2 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.2), 0 10px 40px -10px rgba(0,0,0,0.4)',
        }}
      >
        {DOCK_APPS.map((app, index) => {
          const isOpen = openWindows.some(w => w.id === app.id);
          const isHovered = hoveredId === app.id;
          const scale = getScale(index);

          return (
            <div
              key={app.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredId(app.id)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    className="absolute -top-10 px-3 py-1 rounded-md whitespace-nowrap z-50"
                    style={{
                      background: 'rgba(30,30,30,0.95)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 20px -4px rgba(0,0,0,0.4)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    }}
                  >
                    <span className="text-[12px] text-white/90 font-medium">{app.label}</span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: 'rgba(30,30,30,0.95)' }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.button
                onClick={() => onDockClick ? onDockClick(app.id) : navigate(DESKTOP_APPS.find(a => a.id === app.id)?.path || '/')}
                animate={{
                  scale,
                  y: scale > 1 ? -(scale - 1) * 28 : 0,
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="relative"
              >
                <DockIcon gradient={app.gradient} icon={app.icon} isHovered={isHovered} />
              </motion.button>

              {/* Running indicator */}
              {isOpen && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1 h-1 rounded-full bg-white/80 mt-1"
                />
              )}
            </div>
          );
        })}

        {/* Separator + minimized windows */}
        {openWindows.some(w => w.minimized) && (
          <>
            <div className="w-px h-10 bg-white/20 mx-1 self-center" />
            {openWindows.filter(w => w.minimized).map(win => {
              const app = DOCK_APPS.find(a => a.id === win.id);
              if (!app) return null;
              return (
                <motion.button
                  key={`min-${win.id}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => onDockClick?.(app.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <DockIcon gradient={app.gradient} icon={app.icon} isHovered={false} />
                </motion.button>
              );
            })}
          </>
        )}
      </motion.div>
    </div>
  );
};
