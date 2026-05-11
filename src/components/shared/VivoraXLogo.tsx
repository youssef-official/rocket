import React from 'react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';

interface VivoraXLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

// Backward-compatible wrapper to replace the old RocketLogo API.
export const VivoraXLogo: React.FC<VivoraXLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  showText = true,
}) => {
  return (
    <VivoraLogo
      size={size}
      className={className}
      onClick={onClick}
      showText={showText}
    />
  );
};
