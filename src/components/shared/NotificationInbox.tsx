import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink, Inbox as InboxIcon, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  target_plan: string | null;
  created_at: string;
}

export const NotificationInbox: React.FC = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('inbox_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setNotifications((data ?? []) as Notification[]);
      setHasFetched(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReadIds = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: readError } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);
      if (readError) throw readError;
      if (data) setReadIds(new Set(data.map((r) => r.notification_id)));
    } catch (err) {
      console.error('Error fetching read status:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (user) fetchReadIds();
  }, [fetchNotifications, fetchReadIds, user]);

  const markAsRead = async (notifId: string) => {
    if (!user || readIds.has(notifId)) return;
    try {
      const { error: insertError } = await supabase
        .from('user_notification_reads')
        .insert({ user_id: user.id, notification_id: notifId });
      if (insertError) throw insertError;
      setReadIds(prev => new Set([...prev, notifId]));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const unreadCount = useMemo(() =>
    notifications.filter(n => !readIds.has(n.id)).length,
  [notifications, readIds]);

  const isInitialLoading = loading && !hasFetched;

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (isRTL) {
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} د`;
      if (diffHours < 24) return `منذ ${diffHours} س`;
      if (diffDays < 7) return `منذ ${diffDays} ي`;
      return date.toLocaleDateString('ar-EG');
    }
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={() => { setOpen(true); fetchNotifications(); fetchReadIds(); }}
        className="relative p-2 rounded-xl transition-all duration-300 hover:bg-white/10 group"
      >
        <Bell className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-br from-pink-500 to-rose-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg shadow-pink-500/30 border border-pink-400/30"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Inbox panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[99999] flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => setOpen(false)}
              />

              {/* Panel */}
              <motion.div
                initial={{ x: isRTL ? -420 : 420, opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isRTL ? -420 : 420, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className={`relative h-full w-full sm:w-[400px] flex flex-col overflow-hidden`}
                dir={isRTL ? 'rtl' : 'ltr'}
                style={{
                  background: 'linear-gradient(180deg, rgba(13,13,21,0.98) 0%, rgba(10,10,18,0.99) 100%)',
                  borderLeft: isRTL ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  borderRight: isRTL ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {/* Decorative top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-pink-500/60 to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-pink-500/5 blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="relative px-6 pt-6 pb-5 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/20">
                          <InboxIcon className="w-5 h-5 text-pink-400" />
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white tracking-tight">
                          {isRTL ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        <p className="text-[11px] text-white/35 font-medium">
                          {unreadCount > 0
                            ? `${unreadCount} ${isRTL ? 'جديد' : 'new'}`
                            : (isRTL ? 'لا جديد' : 'All caught up')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 group/close"
                    >
                      <X className="w-4 h-4 text-white/40 group-hover/close:text-white/80 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent shrink-0" />

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 inbox-scroll">
                  {isInitialLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                      </div>
                      <p className="text-xs text-white/30">{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</p>
                    </div>
                  ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-400/60" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white/80 mb-1">
                          {isRTL ? 'فشل التحميل' : 'Failed to load'}
                        </h4>
                        <p className="text-[11px] text-white/30 mb-4 max-w-[240px]">{error}</p>
                      </div>
                      <button
                        onClick={fetchNotifications}
                        className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-all duration-200"
                      >
                        {isRTL ? 'إعادة المحاولة' : 'Try again'}
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                          <Sparkles className="w-7 h-7 text-white/15" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white/60 mb-1">
                          {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
                        </h4>
                        <p className="text-[11px] text-white/25 max-w-[200px]">
                          {isRTL ? 'سنخطرك عندما يكون هناك جديد' : "You're all caught up. We'll notify you when something new arrives."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      {notifications.map((n, i) => {
                        const isUnread = !readIds.has(n.id);
                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.25 }}
                            onClick={() => markAsRead(n.id)}
                            className={`
                              relative mx-3 mb-1.5 rounded-xl px-4 py-3.5 cursor-pointer
                              transition-all duration-200 group/item
                              ${isUnread
                                ? 'bg-pink-500/[0.04] hover:bg-pink-500/[0.08]'
                                : 'hover:bg-white/[0.03]'}
                            `}
                          >
                            {/* Unread indicator */}
                            {isUnread && (
                              <div className={`absolute top-4 ${isRTL ? 'right-1.5' : 'left-1.5'} w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]`} />
                            )}

                            {/* Image */}
                            {n.image_url && (
                              <div className="mb-3 rounded-lg overflow-hidden aspect-[16/9] bg-white/5 border border-white/5">
                                <img
                                  src={n.image_url}
                                  alt={n.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-[1.03]"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) parent.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {/* Title + time */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-[13px] font-semibold leading-snug ${isUnread ? 'text-white' : 'text-white/60'} transition-colors`}>
                                {n.title}
                              </h4>
                              <span className="text-[10px] text-white/25 whitespace-nowrap mt-0.5 shrink-0 font-mono">
                                {formatTimeAgo(n.created_at)}
                              </span>
                            </div>

                            {/* Body */}
                            {n.body && (
                              <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2 mb-2.5">
                                {n.body}
                              </p>
                            )}

                            {/* Action */}
                            {n.link_url && (
                              <a
                                href={n.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-pink-400 hover:text-pink-300 transition-colors"
                              >
                                <span>{isRTL ? 'عرض التفاصيل' : 'View details'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0">
                  <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
                  <div className="px-6 py-3 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-white/15" />
                    <p className="text-[10px] text-white/15 font-medium tracking-wider uppercase">
                      Vivora X
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .inbox-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .inbox-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .inbox-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }
        .inbox-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      `}} />
    </>
  );
};
