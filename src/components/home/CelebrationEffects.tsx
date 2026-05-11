import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Local-only celebration toggles. Controlled from Settings page (vivora_show_ramadan / vivora_show_eid keys).
export const CelebrationEffects: React.FC = () => {
  const [showRamadan, setShowRamadan] = useState(() => localStorage.getItem('vivora_show_ramadan') === 'true');
  const [showEid, setShowEid] = useState(() => localStorage.getItem('vivora_show_eid') === 'true');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => {
      setShowRamadan(localStorage.getItem('vivora_show_ramadan') === 'true');
      setShowEid(localStorage.getItem('vivora_show_eid') === 'true');
      setVisible(true);
    };
    window.addEventListener('vivora-celebrations-change', sync);
    return () => window.removeEventListener('vivora-celebrations-change', sync);
  }, []);

  useEffect(() => {
    if (!showRamadan && !showEid) return;
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, [showRamadan, showEid]);

  if ((!showRamadan && !showEid) || !visible) return null;

  return (
    <AnimatePresence>
      {showRamadan && (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-8 right-12 text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]">🌙</motion.div>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={`s-${i}`} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1, 0] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
              className="absolute text-yellow-300/70"
              style={{ left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 40}%`, fontSize: `${10 + Math.random() * 16}px` }}>
              ✦
            </motion.div>
          ))}
          {[15, 40, 65, 85].map((left, i) => (
            <motion.div key={`l-${i}`} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2, duration: 1, type: 'spring' }}
              className="absolute top-0" style={{ left: `${left}%` }}>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5 + i * 0.5, repeat: Infinity }}
                className="text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]">🏮</motion.div>
            </motion.div>
          ))}
        </div>
      )}
      {showEid && (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['bg-pink-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-red-400', 'bg-orange-400'];
            return (
              <motion.div key={`c-${i}`} initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: ['0vh', '110vh'], rotate: [0, 360], opacity: [1, 1, 0] }}
                transition={{ duration: 4 + Math.random() * 4, delay: Math.random() * 5, repeat: Infinity, ease: 'linear' }}
                className={`absolute rounded-sm ${colors[i % colors.length]}`}
                style={{ left: `${Math.random() * 100}%`, width: `${6 + Math.random() * 8}px`, height: '6px' }} />
            );
          })}
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-sm rounded-full shadow-lg">
            <span className="text-white font-bold text-sm md:text-base">🎉 Eid Mubarak! عيد مبارك 🎉</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
