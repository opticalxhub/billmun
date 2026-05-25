'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Modal } from '@/components/ui';
import { Button } from '@/components/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateDashboardData } from '@/types/portal';

export function LiveCommitteeBanner({ committeeAssignment }: { committeeAssignment: any }) {
  const committee_id = committeeAssignment?.committee_id;
  const queryClient = useQueryClient();

  const { data: bootstrap } = useQuery<DelegateDashboardData>({
    queryKey: ['delegate-dashboard'],
    enabled: false,
  });

  const committee = bootstrap?.committee;
  const session = bootstrap?.committeeSession;

  const [chairName, setChairName] = useState<string>('Chair');
  const [rosterOpen, setRosterOpen] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);

  useEffect(() => {
    if (!committee_id) return;

    // Fetch chair name (rarely changes, staleTime 1h)
    supabase
      .from('committee_assignments')
      .select('users(full_name)')
      .eq('committee_id', committee_id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const users = (data as any)?.users;
        const chairFullName = Array.isArray(users) ? users[0]?.full_name : users?.full_name;
        if (chairFullName) setChairName(chairFullName);
      });

    const channel = supabase
      .channel(`committee-sessions:${committee_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'committee_sessions',
          filter: `committee_id=eq.${committee_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['delegate-dashboard'] });
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [committee_id, queryClient]);

  if (!committee || !session) return null;

  let sessionStatusLabel = 'In Session';
  if (session.caucus_type === 'MODERATED') sessionStatusLabel = 'Moderated Caucus';
  else if (session.caucus_type === 'UNMODERATED') sessionStatusLabel = 'Unmoderated Caucus';
  else if (session.status === 'ADJOURNED') sessionStatusLabel = 'Adjourned';

  const fetchRoster = async () => {
    if (!committee_id) return;

    const { data: assignments } = await supabase
      .from('committee_assignments')
      .select(`
        id,
        user_id,
        country,
        users (
          id,
          full_name
        )
      `)
      .eq('committee_id', committee_id);

    if (!assignments || assignments.length === 0) {
      setRoster([]);
      setRosterOpen(true);
      return;
    }

    const userIds = assignments.map((a: any) => a.user_id).filter(Boolean);
    const [
      { data: docs },
      { data: presences }
    ] = await Promise.all([
      supabase
        .from('documents')
        .select('user_id')
        .eq('committee_id', committee_id)
        .in('user_id', userIds)
        .eq('type', 'POSITION_PAPER'),
      supabase
        .from('delegate_presence_statuses')
        .select('user_id, current_status')
        .eq('committee_id', committee_id)
        .in('user_id', userIds)
    ]);

    const submittedSet = new Set((docs || []).map((d: any) => d.user_id));
    const presenceMap = new Map((presences || []).map(p => [p.user_id, p.current_status]));

    setRoster(
      (assignments as any[]).map((a) => ({
        ...a,
        paper_submitted: submittedSet.has(a.user_id),
        physical_status: presenceMap.get(a.user_id) || 'Unknown'
      }))
    );
    setRosterOpen(true);
  };

  if (!committeeAssignment || !committee) {
    return <Card className="animate-pulse h-32 bg-bg-base/50" />;
  }

  return (
    <Card className="p-0 border-none bg-transparent overflow-visible">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Main Banner */}
        <div className="flex-1 bg-bg-card border border-border-subtle rounded-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-brand-crimson/10 text-brand-crimson">
              <span className="font-jotia-bold text-lg">{committee.abbreviation?.[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-brand-crimson/5 text-brand-crimson border-brand-crimson/20 font-jotia-bold">
                  {sessionStatusLabel}
                </Badge>
                {session.caucus_type === 'MODERATED' && (
                  <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/20 font-jotia">
                    {session.speaking_time_limit}s Speaking Time
                  </Badge>
                )}
              </div>
              <h3 className="font-jotia-bold text-text-primary text-lg leading-none">{committee.name}</h3>
              {session.debate_topic && (
                <p className="text-sm text-text-secondary font-jotia mt-1">
                  Topic: <span className="text-text-primary">{session.debate_topic}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex h-9 font-jotia-bold uppercase tracking-wider"
              onClick={() => {
                fetchRoster();
                setRosterOpen(true);
              }}
            >
              View Roster
            </Button>
            <div className="h-9 w-[1px] bg-border-subtle hidden sm:block mx-2" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-text-dimmed uppercase tracking-widest font-jotia-bold">Chairing</p>
              <p className="text-sm font-jotia text-text-primary">{chairName}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={rosterOpen} onClose={() => setRosterOpen(false)} className="max-w-3xl">
        <h2 className="text-2xl font-jotia mb-4 uppercase tracking-tight">Committee Roster</h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary text-xs uppercase tracking-widest">
                <th className="pb-3 font-medium">Delegate</th>
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Paper</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {roster.map((member) => (
                <tr key={member.id} className="hover:bg-bg-raised/50 transition-colors">
                  <td className="py-3 text-sm">{member.users?.full_name}</td>
                  <td className="py-3 text-sm">{member.country}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.physical_status === 'Present In Session'
                            ? 'bg-status-approved-text'
                            : 'bg-text-tertiary/70'
                        }`}
                      />
                      <span className="text-xs text-text-secondary">
                        {member.physical_status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge className="text-[10px]">{member.paper_submitted ? 'Submitted' : 'Pending'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </Card>
  );
}