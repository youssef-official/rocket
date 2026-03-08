import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Settings, CreditCard, FileText, HelpCircle, Sparkles, Info, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DockItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'dashboard', icon: FolderOpen, label: 'Projects', path: '/dashboard' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  { id: 'billing', icon: CreditCard, label: 'Billing', path: '/billing' },
  { id: 'docs', icon: FileText, label: 'Docs', path: '/docs' },
  { id: 'blog', icon: Newspaper, label: 'Blog', path: '/blog' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ', path: '/faq' },
  { id: 'ai', icon: Sparkles, label: 'AI for All', path: '/ai-for-all' },
  { id: 'about', icon: Info, label: 'About', path: '/about' },
];

export const MacDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[9998]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="flex items-end gap-1 px-3 py-2 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl shadow-black/30"
      >
        {DOCK_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const isHovered = hoveredId === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-9 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-medium whitespace-nowrap backdrop-blur-sm border border-white/10"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon button */}
              <motion.button
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.35, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-500/30 to-purple-600/30 text-white shadow-lg shadow-violet-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.button>

              {/* Active dot */}
              {isActive && (
                <motion.div
                  layoutId="dock-active-dot"
                  className="w-1 h-1 rounded-full bg-white/80 mt-0.5"
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
