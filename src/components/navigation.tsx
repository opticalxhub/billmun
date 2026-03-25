import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

export function Navigation() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('users').select('id, email, full_name, role, status').eq('id', user.id).single();
      return data;
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previous = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(['notifications', user?.id], (old: any) => 
        old?.map((n: any) => n.id === id ? { ...n, is_read: true } : n)
      );
      return { previous };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['notifications', user?.id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  });

  useEffect(() => {
    const channel = supabase.channel('system-ping');
    channel.subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <nav className="border-b border-border-subtle bg-bg-base/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="font-jotia text-xl tracking-widest font-bold">BILLMUN</span>
            </Link>
            <div className="flex items-center gap-1.5 ml-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-white' : 'bg-white/20 animate-pulse'}`} />
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                {isConnected ? 'Live' : 'Syncing'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-text-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-text-primary"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-bg-card border border-border-subtle rounded-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-border-subtle flex justify-between items-center bg-bg-raised">
                    <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-text-tertiary hover:text-text-primary"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-text-dimmed text-xs italic">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-border-subtle last:border-0 hover:bg-bg-raised transition-colors cursor-pointer ${!n.is_read ? 'bg-bg-base/40' : ''}`}
                          onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                        >
                          <p className="text-xs font-bold text-text-primary mb-1">{n.title}</p>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-text-tertiary mt-2 uppercase tracking-tighter">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/dashboard" className="text-sm font-bold text-text-secondary hover:text-text-primary uppercase tracking-widest">
              Dashboard
            </Link>
            <a 
              href="https://instagram.com/billmun.sa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
