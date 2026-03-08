import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Maximize2, X } from 'lucide-react';

interface MacWindowFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  zIndex?: number;
  onFocus?: () => void;
}

export const MacWindowFrame: React.FC<MacWindowFrameProps> = ({
  title,
  children,
  className = '',
  onClose,
  onMinimize,
  defaultPosition,
  defaultSize,
  zIndex = 10,
  onFocus,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(defaultPosition || { x: 50, y: 20 });
  const [size, setSize] = useState(defaultSize || { width: 900, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    onFocus?.();
  }, [isMaximized, onFocus]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;
    setIsResizing(true);
    onFocus?.();
  }, [isMaximized, onFocus]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(26, e.clientY - dragOffset.y), // Below menu bar
        });
      }
      if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          setSize({
            width: Math.max(400, e.clientX - rect.left),
            height: Math.max(300, e.clientY - rect.top),
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset]);

  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  const windowStyle: React.CSSProperties = isMaximized
    ? { top: 26, left: 0, right: 0, bottom: 68, width: 'auto', height: 'auto' }
    : { top: position.y, left: position.x, width: size.width, height: size.height };

  return (
    <motion.div
      ref={windowRef}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`fixed rounded-xl overflow-hidden flex flex-col shadow-2xl ${className}`}
      style={{
        ...windowStyle,
        zIndex,
        background: 'linear-gradient(180deg, rgba(50,50,50,0.98) 0%, rgba(30,30,30,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 25px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      onClick={(e) => { e.stopPropagation(); onFocus?.(); }}
    >
      {/* Title bar - draggable */}
      <div
        className="flex items-center px-3 h-[52px] shrink-0 select-none cursor-move"
        style={{
          background: 'linear-gradient(180deg, rgba(60,60,60,0.9) 0%, rgba(45,45,45,0.9) 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.3)',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleMaximize}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-2 group" onMouseDown={e => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition-all shadow-inner"
            style={{ boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.2)' }}
          >
            <X className="w-2 h-2 text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
            className="w-3 h-3 rounded-full bg-[#febc2e] flex items-center justify-center hover:brightness-110 transition-all shadow-inner"
            style={{ boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.2)' }}
          >
            <Minus className="w-2 h-2 text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
            className="w-3 h-3 rounded-full bg-[#28c840] flex items-center justify-center hover:brightness-110 transition-all shadow-inner"
            style={{ boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.2)' }}
          >
            <Maximize2 className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Title */}
        {title && (
          <div className="flex-1 flex items-center justify-center pointer-events-none">
            <span
              className="text-[13px] text-white/60 font-medium"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
            >
              {title}
            </span>
          </div>
        )}
        
        <div className="w-[54px]" /> {/* Balance for traffic lights */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        {children}
      </div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <svg className="w-3 h-3 absolute bottom-1 right-1 text-white/20" viewBox="0 0 10 10">
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </motion.div>
  );
};
