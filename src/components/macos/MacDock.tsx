import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Settings, CreditCard, FileText, HelpCircle, Sparkles, Info, Newspaper, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DockItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', icon: Home, label: 'Vivora X', path: '/', color: 'from-blue-400 to-blue-600' },
  { id: 'dashboard', icon: FolderOpen, label: 'Projects', path: '/dashboard', color: 'from-cyan-400 to-blue-500' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', color: 'from-gray-400 to-gray-600' },
  { id: 'billing', icon: CreditCard, label: 'Billing', path: '/billing', color: 'from-green-400 to-emerald-600' },
  { id: 'pricing', icon: DollarSign, label: 'Pricing', path: '/pricing', color: 'from-yellow-400 to-orange-500' },
  { id: 'docs', icon: FileText, label: 'Docs', path: '/docs', color: 'from-purple-400 to-purple-600' },
  { id: 'blog', icon: Newspaper, label: 'Blog', path: '/blog', color: 'from-pink-400 to-rose-600' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ', path: '/faq', color: 'from-amber-400 to-orange-500' },
  { id: 'ai', icon: Sparkles, label: 'AI for All', path: '/ai-for-all', color: 'from-violet-400 to-purple-600' },
  { id: 'about', icon: Info, label: 'About', path: '/about', color: 'from-teal-400 to-cyan-600' },
];

export const MacDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

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
    if (mouseX === null || !dockRef.current) return 1;
    const itemWidth = 56;
    const itemCenter = index * (itemWidth + 6) + itemWidth / 2 + 12; // 12 = px-3 padding
    const distance = Math.abs(mouseX - itemCenter);
    const maxDistance = 120;
    if (distance > maxDistance) return 1;
    return 1 + 0.5 * (1 - distance / maxDistance);
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[9998]">
      <motion.div
        ref={dockRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-end gap-1.5 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/25 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]"
      >
        {DOCK_ITEMS.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const isHovered = hoveredId === item.id;
          const Icon = item.icon;
          const scale = getScale(index);

          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredId(item.id)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-10 px-3 py-1 rounded-md bg-[#2a2a2a]/95 text-white text-[11px] font-medium whitespace-nowrap backdrop-blur-xl border border-white/10 shadow-xl"
                  >
                    {item.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2a2a2a]/95 rotate-45 border-b border-r border-white/10" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon button */}
              <motion.button
                onClick={() => navigate(item.path)}
                animate={{ 
                  scale,
                  y: scale > 1 ? -(scale - 1) * 20 : 0,
                }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, mass: 0.5 }}
                className={`w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br ${item.color} shadow-lg transition-shadow duration-200 ${
                  isHovered ? 'shadow-xl' : ''
                }`}
              >
                <Icon className="w-6 h-6 text-white drop-shadow-md" />
              </motion.button>

              {/* Active dot */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="w-1 h-1 rounded-full bg-white/90 mt-1"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
