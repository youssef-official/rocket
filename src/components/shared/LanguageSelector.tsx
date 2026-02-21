import React, { useState } from 'react';
import { Globe, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const languages: Language[] = ['en', 'zh', 'ja', 'fr'];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm cursor-pointer"
      >
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Globe className="w-4 h-4" />
          <span>{languageNames[language]}</span>
        </div>
        {showMenu ? (
          <ChevronUp className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/60" />
        )}
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-[10001]" 
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-44 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[10002]`}
            >
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLanguage(lang);
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors text-sm ${
                    language === lang ? 'bg-white/5 text-pink-400' : 'text-white'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span>{languageNames[lang]}</span>
                  {language === lang && <Check className="w-4 h-4" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
