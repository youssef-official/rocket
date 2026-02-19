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
    const logoSizes = {
      sm: { width: '28px', height: '28px' },
      md: { width: '36px', height: '36px' },
      lg: { width: '56px', height: '56px' },
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
        {/* CSS-based Logo */}
        <div 
          className="relative overflow-visible"
          style={{
            ...logoSizes[size],
            animation: 'intro 1.5s cubic-bezier(.17,.67,.83,.67) forwards, float 4s ease-in-out infinite'
          }}
        >
          {/* Style Tag for Animations and Psuedo-elements */}
          <style>{`
            @keyframes drawPink {
              0% { transform: scale(0) rotate(-20deg); opacity: 0; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes drawWhite {
              0% { transform: scale(0) rotate(20deg); opacity: 0; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes intro {
              0% { transform: scale(0.8); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes float {
              0%,100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }
          `}</style>
          
          {/* Pink Part */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #ff0055, #ff2d7a)',
              clipPath: 'polygon(0% 0%, 35% 0%, 50% 45%, 65% 0%, 100% 0%, 50% 100%)',
              transform: 'scale(0)',
              animation: 'drawPink 1s ease forwards 0.3s',
              filter: 'drop-shadow(0 0 15px rgba(255,0,100,0.6))'
            }}
          />
          
          {/* White Part */}
          <div 
            className="absolute inset-0"
            style={{
              background: '#ffffff',
              clipPath: 'polygon(55% 0%, 90% 0%, 50% 100%, 35% 70%)',
              transform: 'scale(0)',
              animation: 'drawWhite 1s ease forwards 0.6s',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))'
            }}
          />
        </div>

        {/* Text */}
        {showText && (
          <span
            className={`
              flex items-center gap-1
              font-bold text-white
              ${textSizeClasses[size]}
              ${isArabic ? 'text-[0.9em]' : ''}
              ${isRTL ? 'flex-row-reverse' : ''}
            `}
          >
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
          </span>
        )}
      </motion.div>
    );
  }
);

VivoraLogo.displayName = 'VivoraLogo';
