import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DESKTOP_APPS } from './MacDesktop';

interface OpenWindow {
  id: string;
  minimized: boolean;
}

interface MacDockProps {
  openWindows?: OpenWindow[];
  onDockClick?: (appId: string) => void;
}

export const MacDock: React.FC<MacDockProps> = ({ openWindows = [], onDockClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = React.useRef<HTMLDivElement>(null);

  // Show only main dock apps (filter out some)
  const dockApps = DESKTOP_APPS.filter(a => !['terminal', 'privacy', 'terms', 'admin', 'vibe'].includes(a.id));

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
    const itemSize = 52;
    const gap = 4;
    const padding = 10;
    const itemCenter = padding + index * (itemSize + gap) + itemSize / 2;
    const distance = Math.abs(mouseX - itemCenter);
    const maxDist = 100;
    if (distance > maxDist) return 1;
    return 1 + 0.45 * Math.cos((distance / maxDist) * (Math.PI / 2));
  };

  return (
    <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 z-[9998]">
      <motion.div
        ref={dockRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-end gap-1 px-2.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]"
      >
        {dockApps.map((app, index) => {
          const isOpen = openWindows.some(w => w.id === app.id);
          const isHovered = hoveredId === app.id;
          const Icon = app.icon;
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
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="absolute -top-9 px-3 py-1 rounded-md bg-[#2a2a2a]/95 text-white text-[11px] font-medium whitespace-nowrap backdrop-blur-xl border border-white/10 shadow-xl z-50"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                  >
                    {app.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2a2a2a]/95 rotate-45 border-b border-r border-white/10" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.button
                onClick={() => onDockClick ? onDockClick(app.id) : navigate(app.path)}
                animate={{
                  scale,
                  y: scale > 1 ? -(scale - 1) * 24 : 0,
                }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, mass: 0.4 }}
                className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center bg-gradient-to-br ${app.color} shadow-lg hover:shadow-xl transition-shadow`}
              >
                <Icon className="w-6 h-6 text-white drop-shadow-md" />
              </motion.button>

              {/* Running indicator dot */}
              {isOpen && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1 h-1 rounded-full bg-white/80 mt-0.5"
                />
              )}
            </div>
          );
        })}

        {/* Separator before trash/special */}
        <div className="w-px h-8 bg-white/15 mx-1 self-center" />

        {/* Minimized windows */}
        {openWindows.filter(w => w.minimized).map(win => {
          const app = DESKTOP_APPS.find(a => a.id === win.id);
          if (!app) return null;
          const Icon = app.icon;
          return (
            <motion.button
              key={`min-${win.id}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => onDockClick?.(app.id)}
              className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center bg-gradient-to-br ${app.color} shadow-lg opacity-60 hover:opacity-100 transition-opacity`}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
