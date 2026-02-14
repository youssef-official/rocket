import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Import logos
import reactLogo from '@/assets/logos/react.svg';
import vueLogo from '@/assets/logos/vue.svg';
import nextjsLogo from '@/assets/logos/nextjs.svg';
import tailwindLogo from '@/assets/logos/tailwind.svg';
import githubLogo from '@/assets/logos/github.svg';
import supabaseLogo from '@/assets/logos/supabase.svg';
import vercelLogo from '@/assets/logos/vercel.svg';
import stripeLogo from '@/assets/logos/stripe.svg';
import firebaseLogo from '@/assets/logos/firebase.svg';
import mongodbLogo from '@/assets/logos/mongodb.svg';

export const frameworkLogos = {
  React: reactLogo,
  Vue: vueLogo,
  'Next.js': nextjsLogo,
  Tailwind: tailwindLogo,
};

export const integrationLogos = {
  GitHub: githubLogo,
  Supabase: supabaseLogo,
  Vercel: vercelLogo,
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
  const logos = type === 'framework' ? frameworkLogos : integrationLogos;
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

interface FrameworkBarProps {
  selectedFramework?: string;
  onSelectFramework?: (name: string) => void;
}

export const FrameworkBar: React.FC<FrameworkBarProps> = ({
  selectedFramework = 'React',
  onSelectFramework,
}) => {
  const frameworks = Object.keys(frameworkLogos);
  const integrations = Object.keys(integrationLogos);
  const { t, isRTL } = useLanguage();

  return (
    <div className={`flex flex-wrap justify-center gap-4 bg-black/20 backdrop-blur-xl rounded-[2rem] p-3 border border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Features Section - Right in Arabic, Left in English */}
      <div className={`flex items-center gap-4 ${isRTL ? 'pl-4 border-l flex-row-reverse' : 'pr-4 border-r'} border-white/10`}>
        <span className="text-white/80 text-sm font-medium">{t('footer.features')}</span>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {frameworks.map((fw) => (
            <button
              key={fw}
              onClick={() => onSelectFramework?.(fw)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                selectedFramework === fw
                  ? 'bg-white/20 ring-1 ring-white/30 shadow-lg shadow-white/5'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              title={fw}
            >
              <LogoIcon name={fw} type="framework" size="md" />
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Section - Left in Arabic, Right in English */}
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-white/80 text-sm font-medium">{t('footer.integrations')}</span>
        <div className={`flex items-center gap-2 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
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
