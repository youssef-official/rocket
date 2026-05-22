import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAISettings, saveAISettings } from '@/services/aiSettings';

const SEEN_KEY = 'vivora_cors_setup_seen';
const DEFAULT_PROXY = 'https://corsproxy.io/?{url}';

export const CorsProxySetup = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(DEFAULT_PROXY);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      const s = getAISettings();
      setValue(s.corsProxy || DEFAULT_PROXY);
      setOpen(true);
    }
  }, []);

  const save = (proxy: string) => {
    const s = getAISettings();
    saveAISettings({ ...s, corsProxy: proxy.trim() });
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#161616] to-[#0d0d0d] shadow-2xl"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-violet-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    إعداد CORS Proxy
                    <Sparkles className="w-4 h-4 text-violet-300" />
                  </h2>
                  <p className="text-xs text-white/40">خطوة لمرة واحدة لتشغيل طلبات الـ AI</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-white/70 leading-relaxed">
                <p>
                  بعض مزودي الـ AI (زي NVIDIA و Anthropic) بيرفضوا الطلبات المباشرة من المتصفح بسبب CORS.
                  أدخل رابط الـ proxy اللي هيشغّل الطلبات. الافتراضي هو{' '}
                  <span className="font-mono text-violet-300">corsproxy.io</span>.
                </p>
                <p className="text-xs text-white/40">
                  استعمل <span className="font-mono text-white/60">{'{url}'}</span> كـ placeholder لرابط الطلب.
                  تقدر تغيره أي وقت من الإعدادات.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/40">CORS Proxy URL</label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="https://corsproxy.io/?{url}"
                  className="bg-white/[0.03] border-white/10 text-white font-mono text-sm h-11"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'https://corsproxy.io/?{url}',
                    'https://api.codetabs.com/v1/proxy/?quest={url}',
                    'https://thingproxy.freeboard.io/fetch/{url}',
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => setValue(p)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.06] transition"
                    >
                      {p.replace(/^https?:\/\//, '').split('/')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => save('')}
                  className="text-xs text-white/40 hover:text-white/70 transition"
                >
                  تخطّي (استخدم الافتراضيات)
                </button>
                <Button
                  onClick={() => save(value || DEFAULT_PROXY)}
                  className="bg-violet-500 hover:bg-violet-400 text-white gap-2 h-11 px-5"
                >
                  حفظ وابدأ
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
