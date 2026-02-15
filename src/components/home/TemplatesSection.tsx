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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectTemplate(tpl.prompt)}
              className="group cursor-pointer bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 shadow-xl"
            >
              <div className="aspect-video bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center overflow-hidden relative">
                {tpl.image_url ? (
                  <img 
                    src={tpl.image_url} 
                    alt={tpl.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <Sparkles className="w-12 h-12 text-white/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium bg-pink-500 px-4 py-2 rounded-full text-sm shadow-lg">
                    {isRTL ? 'استخدام هذا القالب' : 'Use Template'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">{tpl.name}</h3>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase tracking-widest text-white/40 font-bold border border-white/5">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-sm text-white/40 line-clamp-1">
                  {tpl.prompt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
