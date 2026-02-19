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
    <section className="relative z-10 px-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-center gap-3 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-xl md:text-2xl font-bold text-white whitespace-nowrap">
              {isRTL ? 'القوالب الجاهزة' : 'Templates'}
            </h2>
            <p className="text-white/60 text-sm">
              {isRTL ? 'ابدأ بتصميم جاهز وقم بتعديله' : 'Start with a pre-built design and customize it'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectTemplate(tpl.prompt)}
              className="group cursor-pointer"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:bg-white/15 hover:border-white/20 transition-all duration-300">
                <div className="aspect-[16/10] bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden relative">
                  {tpl.image_url ? (
                    <img 
                      src={tpl.image_url} 
                      alt={tpl.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <Sparkles className="w-12 h-12 text-white/20" />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-white rounded-lg text-gray-900 font-medium text-sm">
                      {isRTL ? 'استخدام القالب' : 'Use Template'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="font-semibold text-white truncate group-hover:text-pink-400 transition-colors">
                      {tpl.name}
                    </h3>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="inline-block text-xs px-2 py-0.5 bg-white/10 text-white/70 rounded-full">
                        {tpl.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
