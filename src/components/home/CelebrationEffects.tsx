import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Celebration {
  id: string;
  name: string;
  is_active: boolean;
  config: any;
}

export const CelebrationEffects: React.FC = () => {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('site_celebrations').select('*').eq('is_active', true);
      if (data) setCelebrations(data);
    };
    fetchData();
  }, []);

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (celebrations.length === 0) return;
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [celebrations]);

  const isRamadan = celebrations.some(c => c.name === 'ramadan');
  const isEid = celebrations.some(c => c.name === 'eid');

  if (!isRamadan && !isEid || !visible) return null;

  return (
    <AnimatePresence>
      {/* Ramadan: Crescent + Stars */}
      {isRamadan && (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
          {/* Large crescent moon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-8 right-12 text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]"
          >
            🌙
          </motion.div>

          {/* Stars */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1, 0] }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
              className="absolute text-yellow-300/70"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 40}%`,
                fontSize: `${10 + Math.random() * 16}px`,
              }}
            >
              ✦
            </motion.div>
          ))}

          {/* Lanterns */}
          {[15, 40, 65, 85].map((left, i) => (
            <motion.div
              key={`lantern-${i}`}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2, duration: 1, type: 'spring' }}
              className="absolute top-0"
              style={{ left: `${left}%` }}
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]"
              >
                🏮
              </motion.div>
            </motion.div>
          ))}

          {/* Subtle gold gradient overlay at top */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/[0.06] to-transparent" />
        </div>
      )}

      {/* Eid: Confetti / Celebration */}
      {isEid && (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
          {/* Falling confetti */}
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['bg-pink-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-red-400', 'bg-orange-400'];
            const color = colors[i % colors.length];
            const left = Math.random() * 100;
            const delay = Math.random() * 5;
            const duration = 4 + Math.random() * 4;
            const size = 6 + Math.random() * 8;

            return (
              <motion.div
                key={`confetti-${i}`}
                initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
                animate={{
                  y: ['0vh', '110vh'],
                  x: [0, (Math.random() - 0.5) * 100],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className={`absolute rounded-sm ${color}`}
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 0.6}px`,
                }}
              />
            );
          })}

          {/* Eid greeting banner */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-emerald-500/20"
          >
            <span className="text-white font-bold text-sm md:text-base">🎉 Eid Mubarak! عيد مبارك 🎉</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
