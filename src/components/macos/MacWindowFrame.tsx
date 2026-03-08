import React from 'react';

interface MacWindowFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export const MacWindowFrame: React.FC<MacWindowFrameProps> = ({ title, children, className = '', fullHeight = true }) => {
  return (
    <div className={`rounded-xl border border-white/10 dark:border-white/[0.06] bg-[#1c1c1e]/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col ${fullHeight ? 'h-full' : ''} ${className}`}>
      {/* Title bar with traffic lights */}
      <div className="flex items-center gap-2 px-3 h-9 bg-white/[0.03] border-b border-white/[0.06] shrink-0">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] hover:brightness-90 transition" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dea123] hover:brightness-90 transition" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] hover:brightness-90 transition" />
        </div>
        {title && (
          <span className="flex-1 text-center text-[12px] text-white/40 font-medium -ml-12">{title}</span>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
