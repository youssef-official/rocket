import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Template {
  id: string;
  name: string;
  image_url: string | null;
  prompt: string;
  category: string;
}

interface TemplatesSectionProps {
  onSelectTemplate: (prompt: string) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { isRTL } = useLanguage();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data) setTemplates(data as Template[]);
    };
    fetch();
  }, []);

  if (templates.length === 0) return null;

  return (
    <section className="relative z-10 px-4 md:px-6 pb-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 backdrop-blur-md flex items-center justify-center border border-pink-500/20">
            <Layers className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {isRTL ? 'القوالب الجاهزة' : 'Templates'}
            </h2>
            <p className="text-white/50 text-sm md:text-base">
              {isRTL ? 'ابدأ بتصميم جاهز وقم بتعديله' : 'Start with a pre-built design and customize it'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectTemplate(tpl.prompt)}
              className="group cursor-pointer bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center overflow-hidden relative">
                {tpl.image_url ? (
                  <img 
                    src={tpl.image_url} 
                    alt={tpl.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <Sparkles className="w-8 h-8 text-white/10" />
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white group-hover:text-pink-400 transition-colors truncate">{tpl.name}</h3>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{tpl.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
