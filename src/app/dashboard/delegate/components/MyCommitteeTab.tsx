'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  IN_SESSION: { label: 'In Session', color: 'bg-green-500', pulse: true },
  MODERATED_CAUCUS: { label: 'Moderated Caucus', color: 'bg-yellow-500' },
  UNMODERATED_CAUCUS: { label: 'Unmoderated Caucus', color: 'bg-blue-500' },
  ON_BREAK: { label: 'On Break', color: 'bg-orange-500' },
  ADJOURNED: { label: 'Adjourned', color: 'bg-text-tertiary' },
};

export default function MyCommitteeTab({ ctx }: { ctx: DelegateContext }) {
  // useQuery for Conference Settings
  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['conference-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_settings').select('conference_date').eq('id', '1').maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Announcements
  const { data: announcements, isLoading: announcementsLoading, isError: announcementsError } = useQuery({
    queryKey: ['committee-announcements', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, User:author_id(full_name)')
        .or(`committee_id.eq.${ctx.committee.id},committee_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Roster
  const { data: roster, isLoading: rosterLoading, isError: rosterError } = useQuery({
    queryKey: ['committee-roster', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_assignments')
        .select('*, User:user_id(id, full_name)')
        .eq('committee_id', ctx.committee.id);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Chair
  const { data: chair, isLoading: chairLoading, isError: chairError } = useQuery({
    queryKey: ['committee-chair', ctx.committee?.chair_id],
    enabled: !!ctx.committee?.chair_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('id, full_name, email').eq('id', ctx.committee.chair_id).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const conferenceDate = useMemo(() => 
    settings?.conference_date ? new Date(settings.conference_date) : null,
  [settings]);

  if (!ctx.committee) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-dimmed font-jotia">You have not been assigned to a committee yet.</p>
      </div>
    );
  }

  if (settingsLoading || announcementsLoading || rosterLoading || chairLoading) {
    return <LoadingSpinner className="py-20" />;
  }
  if (settingsError || announcementsError || rosterError || chairError) {
    return <QueryErrorState message="Failed to load committee data." />;
  }

  const sessionStatus = ctx.session?.status || 'ADJOURNED';
  const [conferenceNotStarted, setConferenceNotStarted] = useState(false);
  
  // Set conference status on client side only to avoid hydration mismatch
  useEffect(() => {
    if (conferenceDate != null) { 
    setConferenceNotStarted(
        conferenceDate.getTime() > Date.now(),
      );
    }
  }, [conferenceDate]);
  
  const statusCfg = conferenceNotStarted && sessionStatus === 'ADJOURNED'
    ? { label: 'Conference Not Started', color: 'bg-text-tertiary' }
    : (STATUS_CONFIG[sessionStatus] || STATUS_CONFIG.ADJOURNED);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Announcements */}
      {(announcements || []).filter(a => a.is_pinned).length > 0 && (
        <div className="space-y-3">
          {(announcements || []).filter(a => a.is_pinned).map((ann) => (
            <div key={ann.id} className="bg-bg-raised border border-border-emphasized rounded-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-jotia-bold text-sm text-text-primary">{ann.title}</h4>
                <span className="text-text-tertiary font-jotia text-xs whitespace-nowrap">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-text-dimmed font-jotia text-sm mt-1">{ann.body}</p>
              <p className="text-text-tertiary font-jotia text-xs mt-2">By {ann.User?.full_name || 'Unknown'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Live Session Status */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-jotia-bold text-text-primary">{statusCfg.label}</span>
        </div>
        {sessionStatus === 'MODERATED_CAUCUS' && ctx.session?.debate_topic && (
          <div className="text-sm text-text-dimmed font-jotia mt-2">
            <p>Debate: {ctx.session.debate_topic}</p>
            {ctx.session.speaking_time_limit && <p>Speaking time: {ctx.session.speaking_time_limit}s</p>}
          </div>
        )}
      </div>

      {/* Committee Info */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h2 className="font-jotia-bold text-2xl text-text-primary mb-2">{ctx.committee.name}</h2>
        <p className="text-text-dimmed font-jotia text-sm mb-4">{ctx.committee.abbreviation}</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-jotia-bold text-sm text-text-primary uppercase tracking-wider mb-2">Topic</h3>
            <p className="text-text-dimmed font-jotia text-sm leading-relaxed">{ctx.committee.topic}</p>
          </div>
          <div>
            <h3 className="font-jotia-bold text-sm text-text-primary uppercase tracking-wider mb-2">Description</h3>
            <p className="text-text-dimmed font-jotia text-sm leading-relaxed">{ctx.committee.description}</p>
          </div>
        </div>
      </div>

      {/* Background Guide */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Background Guide</h3>
        {ctx.committee.background_guide_url ? (
          <>
            <div className="hidden md:block mb-4">
              <iframe
                src={ctx.committee.background_guide_url}
                className="w-full h-[500px] rounded-card border border-border-subtle bg-bg-base"
                title="Background Guide"
              />
            </div>
            <a
              href={ctx.committee.background_guide_url}
              download
              className="inline-flex items-center px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px]"
            >
              Download Background Guide
            </a>
          </>
        ) : (
          <p className="text-text-dimmed font-jotia text-sm">No background guide uploaded yet.</p>
        )}
      </div>

      {/* Rules of Procedure */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Rules of Procedure</h3>
        {ctx.committee.rop_url ? (
          <>
            <div className="hidden md:block mb-4">
              <iframe
                src={ctx.committee.rop_url}
                className="w-full h-[500px] rounded-card border border-border-subtle bg-bg-base"
                title="Rules of Procedure"
              />
            </div>
            <a
              href={ctx.committee.rop_url}
              download
              className="inline-flex items-center px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px]"
            >
              Download Rules of Procedure
            </a>
          </>
        ) : (
          <p className="text-text-dimmed font-jotia text-sm">No ROP uploaded yet.</p>
        )}
      </div>

      {/* Roster */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Committee Members</h3>
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-2 text-text-dimmed font-jotia text-xs uppercase">Name</th>
                <th className="text-left py-2 text-text-dimmed font-jotia text-xs uppercase">Country</th>
              </tr>
            </thead>
            <tbody>
              {(roster || []).map((r) => (
                <tr key={r.id} className="border-b border-border-subtle/50">
                  <td className="py-3 font-jotia text-text-primary">{r.User?.full_name || 'Unknown'}</td>
                  <td className="py-3 font-jotia text-text-dimmed">{r.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden space-y-2">
          {(roster || []).map((r) => (
            <div key={r.id} className="bg-bg-raised rounded-card p-3 flex justify-between items-center">
              <span className="font-jotia text-text-primary text-sm">{r.User?.full_name || 'Unknown'}</span>
              <span className="font-jotia text-text-dimmed text-xs">{r.country}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chair Contact */}
      {chair && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-6">
          <h3 className="font-jotia-bold text-lg text-text-primary mb-2">Committee Chair</h3>
          <p className="text-text-dimmed font-jotia text-sm mb-3">{chair.full_name}</p>
          <button 
            onClick={() => window.location.href = `/messages?user=${chair.id}`}
            className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[44px]"
          >
            Direct Message
          </button>
        </div>
      )}
    </div>
  );
}
