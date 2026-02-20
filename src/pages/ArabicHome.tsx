import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HomePage } from '@/components/home/HomePage';
import { useNavigate } from 'react-router-dom';

interface ArabicHomeProps {
  onStartBuilding: (prompt: string, projectType: 'vite' | 'html', modelId?: string, imageFile?: File) => void;
  onViewDashboard?: () => void;
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onForkProject?: (id: string) => void;
  onShowAuth?: () => void;
  projects?: any[];
  projectsLoading?: boolean;
}

export const ArabicHome: React.FC<ArabicHomeProps> = (props) => {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage('ar');
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    
    return () => {
      // Don't reset - let the language context handle it
    };
  }, [setLanguage]);

  return (
    <div dir="rtl" className="font-sans" style={{ fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" }}>
      <HomePage {...props} />
    </div>
  );
};

export default ArabicHome;
