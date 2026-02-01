import React from 'react';
import { motion } from 'framer-motion';

interface VivoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

export const VivoraLogo: React.FC<VivoraLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  showText = true
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14'
  };
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`} 
      onClick={onClick}
    >
      <img 
        src="/favicon.svg" 
        alt="Vivora X Logo" 
        className={`${sizeClasses[size]} object-contain`} 
      />
      {showText && (
        <span className={`font-bold text-white ${textSizeClasses[size]} flex items-center gap-1`}>
          Vivora{' '}
          <motion.span 
            className="text-pink-400 text-[1.2em] font-black"
            whileHover={{ 
              scale: 1.3,
              rotate: [0, -10, 10, -10, 0],
              textShadow: "0 0 20px rgba(236, 72, 153, 0.8)",
            }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 300
            }}
          >
            X
          </motion.span>
        </span>
      )}
    </div>
  );
};
