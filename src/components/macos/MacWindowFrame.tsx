import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';

interface MacWindowFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const MacWindowFrame: React.FC<MacWindowFrameProps> = ({ title, children, className = '', onClose }) => {
  const [isMaximized, setIsMaximized] = useState(true);

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl border border-white/[0.12] bg-[#1e1e1e]/[0.92] backdrop-blur-3xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col ${isMaximized ? 'w-full h-full' : 'w-[90%] max-w-6xl h-[85vh] mx-auto'} ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center px-3 h-[38px] bg-[#2d2d2d]/80 border-b border-white/[0.05] shrink-0 select-none">
        {/* Traffic lights */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition-all group-hover:ring-1 ring-[#ff5f57]/30"
          >
            <X className="w-2 h-2 text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            className="w-3 h-3 rounded-full bg-[#febc2e] flex items-center justify-center hover:brightness-110 transition-all group-hover:ring-1 ring-[#febc2e]/30"
          >
            <Minus className="w-2 h-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-3 h-3 rounded-full bg-[#28c840] flex items-center justify-center hover:brightness-110 transition-all group-hover:ring-1 ring-[#28c840]/30"
          >
            <Square className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        {title && (
          <span className="flex-1 text-center text-[13px] text-white/50 font-medium"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
          >
            {title}
          </span>
        )}
        <div className="w-14" /> {/* Balance traffic lights */}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </motion.div>
  );
};
