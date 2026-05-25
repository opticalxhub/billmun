'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { PortalNotification } from '@/types/portal';

const notificationSelect = 'id, title, message, type, link, is_read, created_at';

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select(notificationSelect)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const typedData = data as PortalNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((notification) => !notification.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    fetchNotifications();
  };

  const handleNotifClick = async (notification: PortalNotification) => {
    if (!notification.is_read) await markAsRead(notification.id);
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-button bg-bg-raised border border-border-subtle hover:bg-bg-hover transition-all group"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-text-primary' : 'text-text-dimmed group-hover:text-text-primary'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-rejected-bg px-1 text-[10px] font-black text-status-rejected-text border border-status-rejected-border">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed right-2 sm:absolute sm:right-0 z-50 mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm overflow-hidden rounded-card border border-border-emphasized bg-bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle bg-bg-raised p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-dimmed hover:text-text-primary transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-border-subtle">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-text-dimmed">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotifClick(notification)}
                      className={`relative p-4 transition-colors hover:bg-bg-raised cursor-pointer group ${!notification.is_read ? 'bg-text-primary/[0.02]' : ''}`}
                    >
                      {!notification.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-text-primary" />
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {notification.title}
                        </h4>
                        {notification.link && <ExternalLink className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-xs text-text-dimmed line-clamp-2 leading-relaxed">{notification.message}</p>
                      <p className="mt-2 text-[10px] text-text-tertiary uppercase tracking-tighter">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
