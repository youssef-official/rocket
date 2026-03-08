import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, Search } from 'lucide-react';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';

export const MacMenuBar: React.FC = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9997] h-7 flex items-center justify-between px-4 bg-black/50 backdrop-blur-2xl border-b border-white/5 text-white/80 text-[12px] font-medium select-none">
      {/* Left: App name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <VivoraXLogo className="h-3.5" />
        </div>
        <span className="text-white/40 font-semibold">File</span>
        <span className="text-white/40 font-semibold">Edit</span>
        <span className="text-white/40 font-semibold">View</span>
        <span className="text-white/40 font-semibold">Help</span>
      </div>

      {/* Right: Status icons */}
      <div className="flex items-center gap-3">
        <Search className="w-3.5 h-3.5 text-white/50" />
        <Volume2 className="w-3.5 h-3.5 text-white/50" />
        <Wifi className="w-3.5 h-3.5 text-white/50" />
        <Battery className="w-3.5 h-3.5 text-white/50" />
        <span className="text-white/60">{time}</span>
      </div>
    </div>
  );
};
