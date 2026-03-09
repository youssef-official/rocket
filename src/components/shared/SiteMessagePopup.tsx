import React, { useEffect, useState } from 'react';
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
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    fetchMessages();
    
    // Check pathname periodically since we're outside of Router context in App.tsx
    const interval = setInterval(() => {
      if (window.location.pathname !== pathname) {
        setPathname(window.location.pathname);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user, pathname]);

  const fetchMessages = async () => {
    // Get active messages
    const { data: msgs } = await supabase
      .from('site_messages' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!msgs || msgs.length === 0) return;

    // Filter expired
    const now = new Date();
    const active = (msgs as any[]).filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);

    // Get dismissed
    if (user) {
      const { data: dismissed } = await supabase
        .from('user_dismissed_messages' as any)
        .select('message_id')
        .eq('user_id', user.id);
      if (dismissed) {
        setDismissedIds(new Set((dismissed as any[]).map((d: any) => d.message_id)));
      }
    } else {
      // Use localStorage for non-auth users
      const stored = localStorage.getItem('dismissed_site_messages');
      if (stored) setDismissedIds(new Set(JSON.parse(stored)));
    }

    setMessages(active);
  };

  const dismiss = async (msgId: string) => {
    setDismissedIds(prev => new Set([...prev, msgId]));

    if (user) {
      await supabase.from('user_dismissed_messages' as any).insert({ user_id: user.id, message_id: msgId } as any);
    } else {
      const stored = localStorage.getItem('dismissed_site_messages');
      const ids = stored ? JSON.parse(stored) : [];
      ids.push(msgId);
      localStorage.setItem('dismissed_site_messages', JSON.stringify(ids));
    }
  };

  const visible = messages.filter(m => !dismissedIds.has(m.id));
  if (visible.length === 0) return null;

  // Show only the latest one
  const msg = visible[0];
  const style = categoryStyles[msg.category] || categoryStyles.info;

  const isLoginPage = pathname === '/login';

  return (
    <AnimatePresence>
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: isLoginPage ? 20 : -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isLoginPage ? 20 : -20, scale: 0.95 }}
        className={`fixed ${isLoginPage ? 'bottom-4 md:top-6' : 'top-4 md:top-6'} left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-md pointer-events-none`}
      >
        <div
          className="rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden pointer-events-auto backdrop-blur-sm"
          style={{ background: `${style.bg}ee`, border: `2px solid ${style.border}` }}
        >
          {/* Close */}
          <button
            onClick={() => dismiss(msg.id)}
            className="absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors touch-manipulation"
          >
            <X size={16} style={{ color: style.titleColor }} />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-3 pr-8">
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl flex-shrink-0"
              style={{ background: style.iconBg }}
            >
              {msg.icon || '📢'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] md:text-[15px] font-bold leading-tight" style={{ color: style.titleColor }}>
                {msg.title}
              </h3>
              {msg.body && (
                <p className="text-[12px] md:text-[13px] mt-1 md:mt-1.5 leading-relaxed line-clamp-3 md:line-clamp-none" style={{ color: `${style.titleColor}cc` }}>
                  {msg.body}
                </p>
              )}
              {msg.link_url && (
                <a
                  href={msg.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: style.border, color: style.titleColor }}
                >
                  فتح الرابط <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
