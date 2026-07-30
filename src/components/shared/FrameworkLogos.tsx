import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import logos
import stripeLogo from '@/assets/logos/stripe.svg';
import firebaseLogo from '@/assets/logos/firebase.svg';
import mongodbLogo from '@/assets/logos/mongodb.svg';

export const integrationLogos = {
  Stripe: stripeLogo,
  Firebase: firebaseLogo,
  MongoDB: mongodbLogo,
};

interface LogoIconProps {
  name: string;
  type: 'framework' | 'integration';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ 
  name, 
  type, 
  size = 'md',
  className = '' 
}) => {
  const logos = type === 'framework' ? {} : integrationLogos;
  const logo = logos[name as keyof typeof logos];

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (!logo) {
    return (
      <div className={`${sizeClasses[size]} rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 ${className}`}>
        {name[0]}
      </div>
    );
  }

  return (
    <img 
      src={logo} 
      alt={`${name} logo`} 
      className={`${sizeClasses[size]} object-contain ${className}`}
      title={name}
    />
  );
};

export const FrameworkBar: React.FC = () => {
  const integrations = Object.keys(integrationLogos);
  const { t, isRTL } = useLanguage();

  return (
    <div className="hidden md:flex flex-wrap justify-center gap-4 bg-black/20 backdrop-blur-xl rounded-[2rem] p-3 border border-white/10">
      {/* Features Section - Right in Arabic, Left in English */}
      <div className={`flex items-center gap-4 ${isRTL ? 'ps-4 border-s' : 'pe-4 border-e'} border-white/10`}>
        <span className="text-white/80 text-sm font-medium">{t('footer.features')}</span>
        <div className="flex items-center gap-2">
          {['HTML', 'CSS', 'JavaScript'].map((language) => (
            <span
              key={language}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white"
            >
              {language}
            </span>
          ))}
        </div>
      </div>

      {/* Integrations Section - Left in Arabic, Right in English */}
      <div className="flex items-center gap-4">
        <span className="text-white/80 text-sm font-medium">{t('footer.integrations')}</span>
        <div className="flex items-center gap-2 overflow-x-auto">
          {integrations.map((int) => (
            <div
              key={int}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer border border-white/5"
              title={int}
            >
              <LogoIcon name={int} type="integration" size="md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
