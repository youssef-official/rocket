import React, { useEffect, useState, useMemo } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface SiteMessage {
  id: string;
  title: string;
  body: string | null;
  category: string;
  link_url: string | null;
  icon: string | null;
  created_at: string;
  expires_at: string | null;
}

const categoryStyles: Record<string, { bg: string; border: string; iconBg: string; titleColor: string }> = {
  competition: { bg: '#eff6ff', border: '#93c5fd', iconBg: '#dbeafe', titleColor: '#1e40af' },
  celebration: { bg: '#fefce8', border: '#fde047', iconBg: '#fef9c3', titleColor: '#854d0e' },
  apology:     { bg: '#fef2f2', border: '#fca5a5', iconBg: '#fee2e2', titleColor: '#991b1b' },
  issue:       { bg: '#fff7ed', border: '#fdba74', iconBg: '#ffedd5', titleColor: '#9a3412' },
  info:        { bg: '#f0fdf4', border: '#86efac', iconBg: '#dcfce7', titleColor: '#166534' },
};

export const SiteMessagePopup: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  // We remove the dismissedIds state to make it appear always until it expires
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isDismissedSession, setIsDismissedSession] = useState(false);

  useEffect(() => {
    fetchMessages();

    const handleLocationChange = () => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushState', handleLocationChange);
    window.addEventListener('replaceState', handleLocationChange);
    
    const interval = setInterval(handleLocationChange, 1000);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushState', handleLocationChange);
      window.removeEventListener('replaceState', handleLocationChange);
      clearInterval(interval);
    };
  }, [user, currentPath]);

  const fetchMessages = async () => {
    try {
      const { data: msgs, error } = await supabase
        .from('site_messages' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !msgs || msgs.length === 0) {
        setMessages([]);
        return;
      }

      const now = new Date();
      const active = (msgs as any[]).filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);

      setMessages(active);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const dismiss = () => {
    // We only dismiss for the current session/page load if user clicks X
    // But it will reappear on next visit/refresh as requested
    setIsDismissedSession(true);
  };

  if (messages.length === 0 || isDismissedSession) return null;

  const msg = messages[0];
  const style = categoryStyles[msg.category] || categoryStyles.info;
  const isLoginPage = currentPath === '/login';

  return (
    <AnimatePresence>
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: isLoginPage ? 20 : -20, x: '-50%', scale: 0.95 }}
        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
        exit={{ opacity: 0, y: isLoginPage ? 20 : -20, x: '-50%', scale: 0.95 }}
        className={`fixed ${isLoginPage ? 'bottom-6' : 'top-6'} left-1/2 z-[9999] w-[92vw] max-w-[400px] pointer-events-none`}
        style={{ transform: 'translateX(-50%)' }}
      >
        <div
          className="rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden pointer-events-auto backdrop-blur-md"
          style={{ 
            background: `${style.bg}f2`, 
            border: `1.5px solid ${style.border}`,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
          }}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors touch-manipulation z-10"
          >
            <X size={18} style={{ color: style.titleColor }} />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-3.5 pr-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
              style={{ background: style.iconBg }}
            >
              {msg.icon || '📢'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold leading-tight mb-1" style={{ color: style.titleColor }}>
                {msg.title}
              </h3>
              {msg.body && (
                <p className="text-[13px] leading-relaxed opacity-90" style={{ color: style.titleColor }}>
                  {msg.body}
                </p>
              )}
              {msg.link_url && (
                <a
                  href={msg.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold px-3.5 py-2 rounded-lg transition-all hover:opacity-80 active:scale-95 shadow-sm"
                  style={{ background: style.border, color: style.titleColor }}
                >
                  فتح الرابط <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
