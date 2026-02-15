import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink, Inbox as InboxIcon, Loader2, AlertCircle } from 'lucide-react';
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
      
      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      
      setNotifications((data ?? []) as Notification[]);
      setHasFetched(true);
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
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

  // Initial fetch on mount
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

  return (
    <>
      <button
        onClick={() => { setOpen(true); fetchNotifications(); fetchReadIds(); }}
        className="p-2 hover:bg-white/10 rounded-full transition-colors relative group"
      >
        <Bell className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-[#0d0d15]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[99999] flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setOpen(false)} 
              />
              
              <motion.div
                initial={{ x: isRTL ? -400 : 400 }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? -400 : 400 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`relative h-full w-full sm:w-[400px] bg-[#0d0d15] border-${isRTL ? 'r' : 'l'} border-white/10 shadow-2xl flex flex-col`}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <InboxIcon className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {isRTL ? 'صندوق الوارد' : 'Inbox'}
                      </h3>
                      <p className="text-xs text-white/40">
                        {unreadCount} {isRTL ? 'إشعارات غير مقروءة' : 'unread notifications'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {isInitialLoading ? (
                    <div className="h-full flex items-center justify-center p-12">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
                      <h4 className="text-white font-medium mb-2">{isRTL ? 'فشل تحميل الإشعارات' : 'Failed to load notifications'}</h4>
                      <p className="text-white/40 text-sm mb-4">{error}</p>
                      <button 
                        onClick={fetchNotifications}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                      >
                        {isRTL ? 'إعادة المحاولة' : 'Try Again'}
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-10 h-10 text-white/20" />
                      </div>
                      <h4 className="text-white font-medium mb-1">{isRTL ? 'لا توجد إشعارات' : 'No notifications yet'}</h4>
                      <p className="text-white/40 text-sm">{isRTL ? 'سنخطرك عندما يكون هناك شيء جديد' : 'We\'ll notify you when there\'s something new'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5">
                      {notifications.map(n => {
	                        const isImage = (url: string | null) => {
	                          if (!url) return false;
	                          return url.match(/\.(jpeg|jpg|gif|png|webp|svg|avif|bmp)$/i) || 
	                                 url.includes('top4top.io') || 
	                                 url.includes('supabase.co/storage/v1/object/public') ||
	                                 url.startsWith('data:image/');
	                        };
                        const displayImage = n.image_url;
                        const displayLink = n.link_url;

                        return (
                          <div
                            key={n.id}
	                            className={`p-5 hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!readIds.has(n.id) ? 'bg-pink-500/[0.02]' : ''}`}
	                            onClick={() => { markAsRead(n.id); if (n.link_url) window.open(n.link_url, '_blank'); }}
                          >
                            {!readIds.has(n.id) && (
                              <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} bottom-0 w-1 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]`} />
                            )}
                            
	                            <div className="flex flex-col gap-3">
	                              {displayImage && isImage(displayImage) && (
	                                <div className="relative overflow-hidden rounded-xl aspect-video bg-white/5 border border-white/10">
	                                  <img 
	                                    src={displayImage} 
	                                    alt="" 
	                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
	                                    onError={(e) => {
	                                      const target = e.target as HTMLImageElement;
	                                      target.style.display = 'none';
	                                      const parent = target.parentElement;
	                                      if (parent) parent.style.display = 'none';
	                                    }}
	                                  />
	                                </div>
	                              )}
	                              
	                              <div className="flex-1 min-w-0">
	                                <div className="flex items-center justify-between mb-1">
	                                  <h4 className={`text-sm font-bold truncate ${!readIds.has(n.id) ? 'text-white' : 'text-white/70'}`}>
	                                    {n.title}
	                                  </h4>
	                                  <span className="text-[10px] text-white/30 whitespace-nowrap ml-2">
	                                    {new Date(n.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
	                                  </span>
	                                </div>
	                                {n.body && (
	                                  <p className="text-xs text-white/50 line-clamp-3 leading-relaxed mb-3">
	                                    {n.body}
	                                  </p>
	                                )}
	                                {displayLink && (
	                                  <div className="flex items-center justify-between">
	                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-pink-500 group-hover:text-pink-400 transition-colors bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">
	                                      <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
	                                      <ExternalLink className="w-3 h-3" />
	                                    </div>
	                                  </div>
	                                )}
	                              </div>
	                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-white/10 bg-white/[0.02] text-center">
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
                    Vivora X Notifications
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </>
  );
};
