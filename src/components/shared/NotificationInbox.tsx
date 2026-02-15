import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink, Inbox as InboxIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';
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
  const { userPlan, loading: planLoading } = useUserPlan();
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inbox_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (data) {
        setNotifications(data as Notification[]);
        setHasFetched(true);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReadIds = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      if (data) setReadIds(new Set(data.map((r: any) => r.notification_id)));
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
      await supabase.from('user_notification_reads').insert({ user_id: user.id, notification_id: notifId });
      setReadIds(prev => new Set([...prev, notifId]));
    } catch (err) {
      // Error handled silently
    }
  };

  // Filter logic: show if no plan specified or matches user plan
  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      if (!n.target_plan || n.target_plan === 'all' || n.target_plan === '') return true;
      if (!userPlan) return false; // Hide plan-specific notifications if plan not yet loaded
      return userPlan.plan?.toLowerCase() === n.target_plan.toLowerCase();
    });
  }, [notifications, userPlan]);

  const unreadCount = useMemo(() => 
    filteredNotifs.filter(n => !readIds.has(n.id)).length,
  [filteredNotifs, readIds]);

  const isInitialLoading = (loading || planLoading) && !hasFetched;

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

      <AnimatePresence>
        {open && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm" 
              onClick={() => setOpen(false)} 
            />
            
            <motion.div
              initial={{ x: isRTL ? -400 : 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? -400 : 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-full sm:w-[400px] bg-[#0d0d15]/95 backdrop-blur-2xl border-l border-white/10 z-[10001] shadow-2xl flex flex-col`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <InboxIcon className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
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

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isInitialLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  </div>
                ) : filteredNotifs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-10 h-10 text-white/20" />
                    </div>
                    <h4 className="text-white font-medium mb-1">{isRTL ? 'لا توجد إشعارات' : 'No notifications yet'}</h4>
                    <p className="text-white/40 text-sm">{isRTL ? 'سنخطرك عندما يكون هناك شيء جديد' : 'We\'ll notify you when there\'s something new'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredNotifs.map(n => {
                      const isImage = (url: string | null) => url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url?.includes('top4top.io');
                      let displayImage = n.image_url;
                      let displayLink = n.link_url;
                      
                      if (!isImage(displayImage) && isImage(displayLink)) {
                        [displayImage, displayLink] = [displayLink, displayImage];
                      }

                      return (
                        <div
                          key={n.id}
                          className={`p-5 hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!readIds.has(n.id) ? 'bg-pink-500/[0.02]' : ''}`}
                          onClick={() => { markAsRead(n.id); if (displayLink) window.open(displayLink, '_blank'); }}
                        >
                          {!readIds.has(n.id) && (
                            <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} bottom-0 w-1 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]`} />
                          )}
                          
                          {displayImage && (
                            <div className="relative mb-4 overflow-hidden rounded-xl aspect-video bg-white/5">
                              <img src={displayImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-bold truncate ${!readIds.has(n.id) ? 'text-white' : 'text-white/70'}`}>
                                  {n.title}
                                </h4>
                                <span className="text-[10px] text-white/30 whitespace-nowrap">
                                  {new Date(n.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                              {n.body && (
                                <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-3">
                                  {n.body}
                                </p>
                              )}
                              {displayLink && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-pink-500/80 group-hover:text-pink-500 transition-colors">
                                  <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                                  <ExternalLink className="w-3 h-3" />
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
          </>
        )}
      </AnimatePresence>
      
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
