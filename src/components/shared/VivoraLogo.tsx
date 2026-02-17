import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface VivoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

/* ===============================
   Animation Variants
================================ */
const xVariants = {
  initial: {
    scale: 1,
    rotate: 0,
    textShadow: '0 0 0 rgba(236,72,153,0)',
  },
  hover: {
    scale: 1.3,
    rotate: [0, -10, 10, -10, 0],
    textShadow: '0 0 20px rgba(236,72,153,0.8)',
  },
};

/* ===============================
   Component
================================ */
export const VivoraLogo: React.FC<VivoraLogoProps> = memo(
  ({
    size = 'md',
    className = '',
    onClick,
    showText = true,
  }) => {
    const { language, isRTL } = useLanguage();
    const isArabic = language === 'ar';
    /* ===============================
       Sizes
    ================================ */
    const sizeClasses = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-14 h-14',
    };

    const textSizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    };

    /* ===============================
       Handlers
    ================================ */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };

    /* ===============================
       Render
    ================================ */
    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        className={`
          flex items-center gap-2
          select-none
          ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          ${isRTL ? 'flex-row-reverse' : ''}
          ${className}
        `}
      >
        {/* Logo Image */}
        <img
          src="/favicon.svg"
          alt="Vivora X Logo"
          loading="lazy"
          draggable={false}
          className={`
            ${sizeClasses[size]}
            object-contain
          `}
        />

        {/* Text */}
        {showText && (
          <span
            className={`
              flex items-center gap-1
              font-bold text-white
              ${textSizeClasses[size]}
              ${isArabic ? 'text-[0.9em]' : ''}
              ${isRTL ? 'flex-row' : ''}
            `}
          >
            {isArabic ? (
              <>
                <motion.span
                  variants={xVariants}
                  transition={{
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                  }}
                  className={`text-pink-400 font-black text-[1.2em]`}
                >
                  X
                </motion.span>
                Vivora
              </>
            ) : (
              <>
                Vivora
                <motion.span
                  variants={xVariants}
                  transition={{
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                  }}
                  className={`text-pink-400 font-black text-[1.2em]`}
                >
                  X
                </motion.span>
              </>
            )}
          </span>
        )}
      </motion.div>
    );
  }
);

VivoraLogo.displayName = 'VivoraLogo';
