import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VivoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

/** Backward-compatible component name; the platform brand is Webo. */
export const VivoraLogo: React.FC<VivoraLogoProps> = memo(({ size = 'md', className = '', onClick, showText = true }) => {
  const { isRTL } = useLanguage();
  const dimensions = { sm: 'h-8 w-[96px]', md: 'h-10 w-[120px]', lg: 'h-14 w-[168px]' };
  const accessible = onClick ? { role: 'button', tabIndex: 0, onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } } : {};
  return (
    <div {...accessible} onClick={onClick} className={`inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''} ${onClick ? 'cursor-pointer transition-opacity hover:opacity-85' : ''} ${className}`}>
      <img src="/webo-logo.svg" alt="Webo" className={`${dimensions[size]} rounded-md object-contain ${showText ? '' : 'object-[center]'}`} />
    </div>
  );
});

VivoraLogo.displayName = 'WeboLogo';
