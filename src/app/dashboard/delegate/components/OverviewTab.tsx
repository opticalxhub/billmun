"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { X } from 'lucide-react';
import type { DelegateActivity } from '@/types/portal';

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  IN_SESSION: { label: 'In Session', color: 'bg-text-primary/70', pulse: true },
  MODERATED_CAUCUS: { label: 'Moderated Caucus', color: 'bg-text-primary/50' },
  UNMODERATED_CAUCUS: { label: 'Unmoderated Caucus', color: 'bg-text-primary/40' },
  ON_BREAK: { label: 'On Break', color: 'bg-text-tertiary/80' },
  ADJOURNED: { label: 'Adjourned', color: 'bg-text-tertiary' },
};

export default function OverviewTab({ ctx, onTabChange }: { ctx: DelegateContext; onTabChange?: (tab: string) => void }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const { stats, activity, session, settings } = ctx;

  // useQuery for Committee Roster (Separate because it's large and not in bootstrap)
  const { data: roster, isLoading: rosterLoading, isError: rosterError, refetch: refetchRoster } = useQuery({
    queryKey: ['committee-roster', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const committeeId = ctx.committee?.id;
      if (!committeeId || !ctx.committee) return [];
      const { data, error } = await supabase
        .from('committee_assignments')
        .select('id, user_id, country, users(full_name, id, status)')
        .eq('committee_id', committeeId)
        .limit(100);
      if (error) throw error;

      const { data: docs } = await supabase
        .from('documents')
        .select('user_id')
        .in('user_id', (data || []).map(r => r.user_id))
        .eq('committee_id', committeeId)
        .eq('type', 'POSITION_PAPER');
      
      const paperUserIds = new Set((docs || []).map(d => d.user_id));

      return (data || []).map((r) => ({
        ...r,
        has_paper: paperUserIds.has(r.user_id)
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  // useQuery for Chair
  const { data: chair, isLoading: chairLoading, isError: chairError, refetch: refetchChair } = useQuery({
    queryKey: ['committee-chair', ctx.committee?.chair_id],
    enabled: !!ctx.committee?.chair_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, status')
        .eq('id', ctx.committee!.chair_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const conferenceDate = useMemo(() => 
    new Date('2026-04-03T12:30:00+03:00'), 
  []);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showRoster, setShowRoster] = useState(false);

  useEffect(() => {
    // Presence subscription (Unified for 300+ users)
    const channel = supabase.channel('global-presence-overview', {
      config: {
        presence: {
          key: ctx.user.id,
        },
      },
    });
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences) => {
        (presences as Array<{ user_id?: string }>).forEach((p) => { if (p.user_id) onlineIds.add(p.user_id); });
      });
      setOnlineUsers(onlineIds);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ctx.user.id]);

  useEffect(() => {
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
    }, 1000);
    return () => clearInterval(interval);
  }, [conferenceDate]);

  const hasError = rosterError || chairError;
  if (ctx.committee?.id && (rosterLoading || chairLoading)) {
    return <LoadingSpinner className="py-20" />;
  }
  if (hasError) {
    return <QueryErrorState message="Failed to load overview data." onRetry={() => { refetchRoster(); refetchChair(); }} />;
  }

  const sessionStatus = session?.status || 'ADJOURNED';
  const [conferenceNotStarted, setConferenceNotStarted] = useState(false);
  
  // Set conference status on client side only to avoid hydration mismatch
  useEffect(() => {
    setConferenceNotStarted(conferenceDate && conferenceDate.getTime() > Date.now());
  }, [conferenceDate]);
  
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
                        {Array.isArray(r.users) ? r.users[0]?.full_name : (r.users as any)?.full_name}
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
