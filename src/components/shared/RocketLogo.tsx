import React from 'react';
import rocketLogo from '@/assets/rocket-logo.png';

interface RocketLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

export const RocketLogo: React.FC<RocketLogoProps> = ({
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
        src={rocketLogo} 
        alt="Rocket Logo" 
        className={`${sizeClasses[size]} object-contain`} 
      />
      {showText && (
        <span className={`font-bold text-white ${textSizeClasses[size]}`}>
          Rocket
        </span>
      )}
    </div>
  );
};
