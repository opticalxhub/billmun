'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone, X, Pin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  committee_id: string | null;
  target_roles: string[] | null;
}

export function AnnouncementBanner({ user, committeeId }: { user: any, committeeId?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const fetchAnnouncements = async () => {
    if (!user) return;

    const query = supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (!error && data) {
      // Filter based on roles and committee
      const filtered = data.filter(ann => {
        const roleMatch = !ann.target_roles?.length || ann.target_roles.includes(user.role);
        const committeeMatch = !ann.committee_id || ann.committee_id === committeeId;
        return roleMatch && committeeMatch;
      });
      setAnnouncements(filtered);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.role, committeeId]);

  const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));
  const current = activeAnnouncements[currentIndex];

  if (activeAnnouncements.length === 0) return null;

  const handleDismiss = () => {
    if (current.is_pinned) {
      // Pinned announcements can't be easily dismissed globally for now, 
      // just hide them for this session
      setDismissedIds([...dismissedIds, current.id]);
    } else {
      setDismissedIds([...dismissedIds, current.id]);
    }
    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const nextAnn = () => {
    setCurrentIndex((currentIndex + 1) % activeAnnouncements.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`relative overflow-hidden rounded-card border ${
            current.is_pinned 
              ? 'bg-text-primary/5 border-border-emphasized shadow-lg shadow-text-primary/5' 
              : 'bg-bg-raised border-border-subtle'
          } p-4 pr-12`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${current.is_pinned ? 'bg-text-primary text-bg-base' : 'bg-text-primary/10 text-text-primary'}`}>
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-black uppercase tracking-tight text-text-primary truncate">
                  {current.title}
                </h4>
                {current.is_pinned && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-text-primary/10 text-[8px] font-black uppercase tracking-widest text-text-primary border border-border-emphasized">
                    <Pin className="w-2 h-2" /> Pinned
                  </span>
                )}
                <span className="flex items-center gap-1 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                  <Clock className="w-2 h-2" /> {new Date(current.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
                {current.body}
              </p>
            </div>
          </div>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {activeAnnouncements.length > 1 && (
              <button 
                onClick={nextAnn}
                className="p-2 text-text-dimmed hover:text-text-primary transition-colors"
                title="Next Announcement"
              >
                <span className="text-[10px] font-bold">{currentIndex + 1}/{activeAnnouncements.length}</span>
              </button>
            )}
            <button 
              onClick={handleDismiss}
              className="p-2 text-text-dimmed hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {current.is_pinned && (
            <div className="absolute bottom-0 left-0 h-0.5 bg-text-primary/30 animate-shrink-width" style={{ width: '100%' }} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
