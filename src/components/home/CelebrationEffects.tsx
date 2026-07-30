import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

type Celebration = { name: 'ramadan' | 'eid'; isActive: boolean };
const stars = Array.from({ length: 18 }, (_, index) => ({ id: `star-${index}`, left: 6 + ((index * 19) % 86), top: 5 + ((index * 13) % 38), delay: (index % 6) * 0.35 }));
const confetti = Array.from({ length: 30 }, (_, index) => ({ id: `confetti-${index}`, left: (index * 17) % 100, delay: (index % 8) * 0.4, color: ['bg-amber-400','bg-orange-400','bg-emerald-400','bg-sky-400'][index % 4] }));

export const CelebrationEffects = () => {
  const [active, setActive] = useState<Celebration[]>([]);
  useEffect(() => {
    const sync = () => api<Celebration[]>('/site/celebrations').then(setActive).catch(() => setActive([]));
    sync();
    window.addEventListener('webo-celebrations-updated', sync);
    const interval = window.setInterval(sync, 30_000);
    return () => { window.removeEventListener('webo-celebrations-updated', sync); window.clearInterval(interval); };
  }, []);
  const ramadan = active.some(item => item.name === 'ramadan'); const eid = active.some(item => item.name === 'eid');
  return <AnimatePresence>{ramadan && <motion.div key="ramadan" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"><span className="absolute right-10 top-8 text-7xl drop-shadow-[0_12px_18px_rgba(255,177,0,.26)]">🌙</span>{stars.map(star=><motion.span key={star.id} initial={{opacity:0}} animate={{opacity:[0,.9,.35,.9]}} transition={{duration:3.4,delay:star.delay,repeat:Infinity}} className="absolute text-amber-200" style={{left:`${star.left}%`,top:`${star.top}%`}}>✦</motion.span>)}</motion.div>}{eid && <motion.div key="eid" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">{confetti.map(piece=><motion.span key={piece.id} initial={{y:-20,opacity:1}} animate={{y:'110vh',rotate:360,opacity:0}} transition={{duration:5.5,delay:piece.delay,repeat:Infinity,ease:'linear'}} className={`absolute h-2 w-2 rounded-sm ${piece.color}`} style={{left:`${piece.left}%`}}/>)}<div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(5,150,105,.24)]">عيد مبارك</div></motion.div>}</AnimatePresence>;
};
