import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  target_plan: string;
  created_at: string;
}

export const NotificationInbox: React.FC = () => {
  const { user } = useAuth();
  const { userPlan } = useUserPlan();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('inbox_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }, []);

  const fetchReadIds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_notification_reads')
      .select('notification_id')
      .eq('user_id', user.id);
    if (data) setReadIds(new Set(data.map((r: any) => r.notification_id)));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchReadIds();
  }, [fetchNotifications, fetchReadIds]);

  const markAsRead = async (notifId: string) => {
    if (!user || readIds.has(notifId)) return;
    await supabase.from('user_notification_reads').insert({ user_id: user.id, notification_id: notifId });
    setReadIds(prev => new Set([...prev, notifId]));
  };

  // Filter notifications by user plan
  const filteredNotifs = notifications.filter(n => {
    if (n.target_plan === 'all') return true;
    return userPlan?.plan === n.target_plan;
  });

  const unreadCount = filteredNotifs.filter(n => !readIds.has(n.id)).length;

  return (
    <>
      <button
        onClick={() => { setOpen(!open); fetchNotifications(); fetchReadIds(); }}
        className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
      >
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[10000] bg-black/30" onClick={() => setOpen(false)} />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-[#0d0d15] backdrop-blur-xl border-l border-white/10 z-[10001] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0d0d15]">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Inbox</h3>
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifs.length === 0 ? (
                  <div className="p-8 text-center text-white/40">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredNotifs.map(n => (
                      <div
                        key={n.id}
                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!readIds.has(n.id) ? 'bg-pink-500/5 border-l-2 border-l-pink-500' : ''}`}
                        onClick={() => { markAsRead(n.id); if (n.link_url) window.open(n.link_url, '_blank'); }}
                      >
                        {n.image_url && (
                          <img src={n.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <div className="flex items-start gap-2">
                          {!readIds.has(n.id) && <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{n.title}</h4>
                            {n.body && <p className="text-xs text-white/50 mt-1 line-clamp-3">{n.body}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-white/30">{new Date(n.created_at).toLocaleDateString()}</span>
                              {n.link_url && <ExternalLink className="w-3 h-3 text-white/30" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
