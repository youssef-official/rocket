import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceConfig {
  emoji?: string;
  label?: string;
  message_ar?: string;
  message_en?: string;
}

export const MaintenanceScreen = ({ children }: { children: React.ReactNode }) => {
  const [maintenance, setMaintenance] = useState<{ active: boolean; config: MaintenanceConfig } | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('site_celebrations')
        .select('is_active, config')
        .eq('name', 'maintenance')
        .single();
      
      if (data) {
        setMaintenance({ active: data.is_active, config: (data.config as any) || {} });
      } else {
        setMaintenance({ active: false, config: {} });
      }
    };
    check();

    // Re-check every 30s
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Still loading
  if (maintenance === null) return null;

  // Not in maintenance
  if (!maintenance.active) return <>{children}</>;

  // Detect locale — Arabic for Arabic-language browsers
  const lang = navigator.language || 'en';
  const isArabic = lang.startsWith('ar');

  const message = isArabic
    ? maintenance.config.message_ar || '🔧 الموقع تحت الصيانة'
    : maintenance.config.message_en || '🔧 We\'re Under Maintenance';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Subtle animated background dots */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-6 max-w-lg mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
            <span className="text-4xl">{maintenance.config.emoji || '🔧'}</span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1
            className="text-white font-bold leading-tight"
            style={{ fontSize: isArabic ? '28px' : '32px' }}
          >
            {isArabic ? 'تحت الصيانة' : 'Under Maintenance'}
          </h1>
          <p
            className="text-slate-300 leading-relaxed whitespace-pre-line"
            style={{ fontSize: isArabic ? '16px' : '15px' }}
          >
            {message}
          </p>
        </div>

        {/* Animated loader */}
        <div className="mt-10 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <p className="mt-6 text-slate-500 text-xs">
          Vivora X
        </p>
      </div>
    </div>
  );
};
