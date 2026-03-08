import React, { useState, useEffect } from 'react';
import { Wifi, BatteryFull, Volume2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AppleLogo = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 17 21" fill="currentColor">
    <path d="M13.34 3.56c-.8.96-2.1 1.7-3.38 1.6-.16-1.3.47-2.67 1.22-3.52C12 .68 13.38.02 14.5 0c.14 1.36-.4 2.7-1.16 3.56zM14.49 5.44c-1.88-.1-3.48 1.07-4.38 1.07-.9 0-2.3-1.02-3.78-.99-1.95.03-3.74 1.13-4.74 2.87-2.03 3.5-.52 8.67 1.44 11.52.97 1.4 2.12 2.97 3.64 2.91 1.46-.06 2.01-.94 3.77-.94s2.26.94 3.8.91c1.57-.03 2.56-1.42 3.52-2.83 1.1-1.6 1.56-3.16 1.58-3.24-.03-.02-3.04-1.17-3.07-4.63-.03-2.89 2.36-4.28 2.47-4.35-1.35-2-3.45-2.22-4.2-2.27l-.05-.03z"/>
  </svg>
);

interface MacMenuBarProps {
  activeApp?: string;
}

export const MacMenuBar: React.FC<MacMenuBarProps> = ({ activeApp = 'Finder' }) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9997] h-[26px] flex items-center justify-between px-4 bg-black/25 backdrop-blur-2xl text-white text-[13px] select-none"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
    >
      {/* Left */}
      <div className="flex items-center gap-5">
        <button className="flex items-center opacity-90 hover:opacity-100 transition-opacity px-1 py-0.5 rounded hover:bg-white/10">
          <AppleLogo />
        </button>
        <span className="font-semibold text-[13px] text-white/95">{activeApp}</span>
        <div className="flex items-center gap-4 text-[13px] text-white/60 font-normal">
          {['File', 'Edit', 'View', 'Window', 'Help'].map(m => (
            <span key={m} className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-default transition-colors">{m}</span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 text-[12px] text-white/70">
        <div className="hover:bg-white/10 p-1 rounded transition-colors"><BatteryFull className="w-[18px] h-[12px]" /></div>
        <div className="hover:bg-white/10 p-1 rounded transition-colors"><Wifi className="w-3.5 h-3.5" /></div>
        <div className="hover:bg-white/10 p-1 rounded transition-colors"><Search className="w-3.5 h-3.5" /></div>
        <span className="font-medium text-white/60 px-1">{date} {time}</span>
      </div>
    </div>
  );
};
