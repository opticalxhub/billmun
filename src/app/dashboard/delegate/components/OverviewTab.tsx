"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { X } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  IN_SESSION: { label: 'In Session', color: 'bg-text-primary/70', pulse: true },
  MODERATED_CAUCUS: { label: 'Moderated Caucus', color: 'bg-text-primary/50' },
  UNMODERATED_CAUCUS: { label: 'Unmoderated Caucus', color: 'bg-text-primary/40' },
  ON_BREAK: { label: 'On Break', color: 'bg-text-tertiary/80' },
  ADJOURNED: { label: 'Adjourned', color: 'bg-text-tertiary' },
};

export default function OverviewTab({ ctx, onTabChange }: { ctx: DelegateContext; onTabChange?: (tab: string) => void }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // useQuery for Conference Settings
  const { data: settings, isLoading: settingsLoading, isError: settingsError, refetch: refetchSettings } = useQuery({
    queryKey: ['conference-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_settings').select('*').eq('id', '1').single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Stats
  const { data: stats = { documents: 0, aiToday: 0, speeches: 0, blocs: 0 }, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['delegate-stats', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const [docs, speeches, blocs] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', ctx.user.id),
        supabase.from('speeches').select('id', { count: 'exact', head: true }).eq('user_id', ctx.user.id),
        supabase.from('bloc_members').select('id', { count: 'exact', head: true }).eq('user_id', ctx.user.id),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const resetDate = ctx.user.ai_analyses_reset_date ? new Date(ctx.user.ai_analyses_reset_date).toISOString().split('T')[0] : null;
      const aiToday = resetDate === today ? (ctx.user.ai_analyses_today || 0) : 0;
      return {
        documents: docs.count || 0,
        aiToday,
        speeches: speeches.count || 0,
        blocs: blocs.count || 0,
      };
    },
    staleTime: 60 * 1000,
  });

  // useQuery for Activity
  const { data: activity, isLoading: activityLoading, isError: activityError, refetch: refetchActivity } = useQuery({
    queryKey: ['delegate-activity', ctx.user?.id, ctx.committee?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const committeeId = ctx.committee?.id;
      if (!committeeId) return [];
      
      // Get delegate's personal activities + committee activities
      const [personal, committeeDocs, announcements, /* blocMessages */] = await Promise.all([
        // Personal audit logs (filter out administrative actions)
        supabase
          .from('audit_logs')
          .select('*')
          .eq('actor_id', ctx.user.id)
          .not('action', 'ilike', '%rejected%')
          .not('action', 'ilike', '%suspended%')
          .not('action', 'ilike', '%admin%')
          .not('action', 'ilike', '%security%')
          .order('performed_at', { ascending: false })
          .limit(5),
        // Committee document activity (only approved documents and user's own)
        supabase
          .from('documents')
          .select('id, title, uploaded_at, reviewed_at, status, user_id, users(full_name)')
          .eq('committee_id', committeeId)
          .or(`status.eq.APPROVED,user_id.eq.${ctx.user.id}`)
          .order('uploaded_at', { ascending: false })
          .limit(3),
        // Committee announcements
        supabase
          .from('announcements')
          .select('id, title, body, created_at, author_id, users(full_name)')
          .or(`committee_id.eq.${committeeId},target_roles.cs.{DELEGATE}`)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
        // Bloc messages (if in any blocs)
        supabase
          .from('bloc_members')
          .select('bloc_id')
          .eq('user_id', ctx.user.id)
      ]);

      const activities: any[] = [];
      
      // Add personal activities (delegate-appropriate only)
      (personal.data || []).forEach((log: any) => {
        // Filter for delegate-relevant actions only
        const delegateActions = [
          'uploaded', 'submitted', 'joined', 'created', 'updated profile',
          'speech', 'resolution', 'bloc', 'voted', 'spoke', 'motion'
        ];
        
        if (delegateActions.some(action => log.action.toLowerCase().includes(action))) {
          activities.push({
            id: `personal-${log.id}`,
            action: log.action,
            performed_at: log.performed_at,
            type: 'personal'
          });
        }
      });

      // Add document activities
      (committeeDocs.data || []).forEach((doc: any) => {
        if (doc.user_id === ctx.user.id) {
          activities.push({
            id: `doc-${doc.id}`,
            action: `You uploaded "${doc.title}"`,
            performed_at: doc.uploaded_at,
            type: 'document'
          });
        } else if (doc.status === 'APPROVED') {
          const userName = (doc.users as any)?.full_name || 'Unknown';
          activities.push({
            id: `doc-${doc.id}`,
            action: `${userName}'s document "${doc.title}" was approved`,
            performed_at: doc.reviewed_at || doc.uploaded_at,
            type: 'document'
          });
        }
      });

      // Add announcements
      (announcements.data || []).forEach((announcement: any) => {
        activities.push({
          id: `ann-${announcement.id}`,
          action: `Announcement: ${announcement.title}`,
          performed_at: announcement.created_at,
          type: 'announcement'
        });
      });

      return activities
        .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes to prevent excessive refreshing
    refetchInterval: false, // Disable auto-refresh
  });

  // useQuery for Roster
  const { data: roster } = useQuery({
    queryKey: ['committee-roster', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_assignments')
        .select('id, user_id, country, users(full_name, id, status)')
        .eq('committee_id', ctx.committee.id)
        .limit(100);
      if (error) throw error;

      const approvedAssignments = (data || []).filter((r: any) => r.users?.status === 'APPROVED');
      const userIds = approvedAssignments.map((r: any) => r.user_id).filter(Boolean);
      
      const { data: docs } = await supabase
        .from('documents')
        .select('user_id')
        .in('user_id', userIds)
        .eq('committee_id', ctx.committee.id)
        .eq('type', 'POSITION_PAPER');
      
      const paperUserIds = new Set((docs || []).map(d => d.user_id));

      return approvedAssignments.map((r: any) => ({
        ...r,
        has_paper: paperUserIds.has(r.user_id)
      }));
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Chair
  const { data: chair, isLoading: chairLoading, isError: chairError, refetch: refetchChair } = useQuery({
    queryKey: ['committee-chair', ctx.committee?.chair_id],
    enabled: !!ctx.committee?.chair_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, status')
        .eq('id', ctx.committee.chair_id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const conferenceDate = useMemo(() => 
    settings?.conference_date ? new Date(`${settings.conference_date}T09:00:00+03:00`) : new Date('2026-04-03T09:00:00+03:00'), 
  [settings]);

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showRoster, setShowRoster] = useState(false);

  useEffect(() => {
    // Presence subscription
    const channel = supabase.channel('global-presence-roster');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => { if (p.user_id) onlineIds.add(p.user_id); });
      });
      setOnlineUsers(onlineIds);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!conferenceDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = conferenceDate.getTime() - now;
      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [conferenceDate]);

  const hasError = settingsError || statsError || activityError || chairError;
  if ((ctx.committee?.id && (settingsLoading || statsLoading || activityLoading || chairLoading))) {
    return <LoadingSpinner className="py-20" />;
  }
  if (hasError) {
    return <QueryErrorState message="Failed to load overview data." onRetry={() => { refetchSettings(); refetchStats(); refetchActivity(); refetchChair(); }} />;
  }

  const sessionStatus = ctx.session?.status || 'ADJOURNED';
  const conferenceNotStarted = conferenceDate && conferenceDate.getTime() > Date.now();
  const statusCfg = conferenceNotStarted && sessionStatus === 'ADJOURNED'
    ? { label: 'Conference Not Started', color: 'bg-text-tertiary' }
    : (STATUS_CONFIG[sessionStatus] || STATUS_CONFIG.ADJOURNED);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live Committee Status Banner */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-jotia-bold text-xl text-text-primary">
              {ctx.committee?.name || 'No Committee Assigned'}
            </h2>
            {ctx.assignment?.country && (
              <p className="text-text-dimmed font-jotia text-sm">
                Representing: <span className="text-text-primary">{ctx.assignment.country}</span>
              </p>
            )}
            {ctx.committee?.topic && (
              <p className="text-text-dimmed font-jotia text-sm">Topic: {ctx.committee.topic}</p>
            )}
            {chair && <p className="text-text-dimmed font-jotia text-sm">Chair: {chair.full_name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-jotia text-text-primary">{statusCfg.label}</span>
          </div>
        </div>
        {sessionStatus === 'MODERATED_CAUCUS' && ctx.session?.debate_topic && (
          <div className="mt-3 pt-3 border-t border-border-subtle text-sm text-text-dimmed font-jotia">
            <p>Debate: {ctx.session.debate_topic}</p>
            {ctx.session.speaking_time_limit && (
              <p>Speaking time: {ctx.session.speaking_time_limit}s</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {ctx.committee?.background_guide_url && (
            <a
              href={ctx.committee.background_guide_url}
              download
              className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px] inline-flex items-center"
            >
              Download Background Guide
            </a>
          )}
          {ctx.committee?.rop_url && (
            <a
              href={ctx.committee.rop_url}
              download
              className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px] inline-flex items-center"
            >
              Download Rules of Procedure
            </a>
          )}
          <button
            onClick={() => setShowRoster(true)}
            className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px] inline-flex items-center"
          >
            View Roster
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Documents Submitted', value: stats.documents },
          { label: 'AI Analyses Used Today', value: `${stats.aiToday} / 10` },
          { label: 'Speeches Drafted', value: stats.speeches },
          { label: 'Blocs Joined', value: stats.blocs },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-border-subtle rounded-card p-5">
            <p className="text-text-dimmed font-jotia text-xs uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-text-primary font-jotia-bold text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Activity + Countdown/QuickActions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-bg-card border border-border-subtle rounded-card p-6">
          <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Recent Activity</h3>
          {(activity || []).length === 0 ? (
            <p className="text-text-dimmed font-jotia text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {(activity || []).map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-dimmed mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-text-primary font-jotia">{a.action}</p>
                    <p className="text-text-tertiary font-jotia text-xs">
                      {new Date(a.performed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Countdown + Quick Actions */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-subtle rounded-card p-6">
            <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Conference Countdown</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { v: countdown.days, l: 'Days' },
                { v: countdown.hours, l: 'Hours' },
                { v: countdown.minutes, l: 'Min' },
                { v: countdown.seconds, l: 'Sec' },
              ].map((u) => (
                <div key={u.l} className="bg-bg-raised rounded-card p-3">
                  <p className="text-text-primary font-jotia-bold text-2xl">{String(u.v).padStart(2, '0')}</p>
                  <p className="text-text-dimmed font-jotia text-xs uppercase mt-1">{u.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-card p-6">
            <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Upload Document', tab: 'Documents', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3v10m0-10L6 7m4-4l4 4M4 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { label: 'Start AI Analysis', tab: 'AI Feedback', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { label: 'View Committee', tab: 'My Committee', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
                { label: 'My Speeches', tab: 'Speeches', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5h12M4 9h8M4 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => onTabChange?.(a.tab)}
                  className="flex flex-col items-center gap-2 p-4 bg-bg-raised border border-border-subtle rounded-card hover:bg-bg-hover transition-colors min-h-[44px] font-jotia text-sm text-text-primary"
                >
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showRoster && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-6" onClick={() => setShowRoster(false)}>
          <div className="w-full h-full md:h-auto md:max-h-[80vh] md:max-w-3xl bg-bg-card border border-border-subtle rounded-card flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-lg font-jotia-bold text-text-primary">Committee Roster</h3>
              <button onClick={() => setShowRoster(false)} className="text-text-dimmed hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-2 text-text-dimmed font-jotia text-xs uppercase">Delegate</th>
                    <th className="py-2 text-text-dimmed font-jotia text-xs uppercase">Country</th>
                    <th className="py-2 text-text-dimmed font-jotia text-xs uppercase text-right">Paper Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {(roster || []).map(r => {
                    const isOnline = r.user_id && onlineUsers.has(r.user_id);
                    return (
                    <tr key={r.id} className="border-b border-border-subtle/50">
                      <td className="py-3 font-jotia text-text-primary flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-approved-text shadow-[0_0_5px_rgba(0,255,0,0.5)]' : 'bg-border-emphasized'}`} />
                        {r.users?.full_name}
                      </td>
                      <td className="py-3 font-jotia text-text-secondary">{r.country}</td>
                      <td className="py-3 text-right">
                        {r.has_paper ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-status-approved-bg text-status-approved-text text-[10px] uppercase font-bold">Submitted</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-bg-raised text-text-dimmed text-[10px] uppercase font-bold">Pending</span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
