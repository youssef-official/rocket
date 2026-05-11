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
  const [isAdmin, setIsAdmin] = useState(false);

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

      // Check if current user is admin
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.session.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!role);
      }
    };
    check();

    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Still loading
  if (maintenance === null) return null;

  // Not in maintenance or user is admin — pass through
  if (!maintenance.active || isAdmin) return <>{children}</>;

  // Detect locale
  const lang = navigator.language || 'en';
  const isArabic = lang.startsWith('ar');

  const message = isArabic
    ? maintenance.config.message_ar || '🔧 الموقع تحت الصيانة'
    : maintenance.config.message_en || "🔧 We're Under Maintenance";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Subtle animated dots */}
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
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 20px 60px -15px rgba(59,130,246,0.4)' }}>
            <span className="text-4xl">{maintenance.config.emoji || '🔧'}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-bold leading-tight" style={{ fontSize: isArabic ? '28px' : '32px', color: '#f1f5f9' }}>
            {isArabic ? 'تحت الصيانة' : 'Under Maintenance'}
          </h1>
          <p className="leading-relaxed whitespace-pre-line" style={{ fontSize: isArabic ? '16px' : '15px', color: '#94a3b8' }}>
            {message}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ backgroundColor: '#60a5fa', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="mt-6 text-xs" style={{ color: '#475569' }}>Vivora X</p>
      </div>
    </div>
  );
};
