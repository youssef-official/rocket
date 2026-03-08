import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

interface MacWindowFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export const MacWindowFrame: React.FC<MacWindowFrameProps> = ({ title, children, className = '', onClose, onMinimize }) => {
  const [isMaximized, setIsMaximized] = useState(true);

  return (
    <div
      className={`rounded-xl border border-white/[0.12] bg-[#1e1e1e]/[0.92] backdrop-blur-3xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col ${isMaximized ? 'w-full h-full' : 'w-[85%] max-w-5xl h-[80vh]'} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div className="flex items-center px-3 h-[38px] bg-[#2d2d2d]/80 border-b border-white/[0.05] shrink-0 select-none">
        {/* Traffic lights */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition-all"
          >
            <X className="w-2 h-2 text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
            className="w-3 h-3 rounded-full bg-[#febc2e] flex items-center justify-center hover:brightness-110 transition-all"
          >
            <Minus className="w-2 h-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
            className="w-3 h-3 rounded-full bg-[#28c840] flex items-center justify-center hover:brightness-110 transition-all"
          >
            <Maximize2 className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        {title && (
          <span className="flex-1 text-center text-[13px] text-white/50 font-medium"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
          >
            {title}
          </span>
        )}
        <div className="w-14" />
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
