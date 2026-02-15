import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    <section className="relative z-10 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Layers className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Templates</h2>
            <p className="text-white/50 text-sm">Start with a pre-built design</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectTemplate(tpl.prompt)}
              className="group cursor-pointer bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center overflow-hidden">
                {tpl.image_url ? (
                  <img src={tpl.image_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white/20" />
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white truncate">{tpl.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">{tpl.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
