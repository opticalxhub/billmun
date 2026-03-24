'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Modal } from '@/components/ui';
import { Button } from '@/components/button';

export function LiveCommitteeBanner({ committeeAssignment }: { committeeAssignment: any }) {
  const committee_id = committeeAssignment?.committee_id ?? committeeAssignment?.committee_id;

  const [committee, setCommittee] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('Adjourned');
  const [debateTopic, setDebateTopic] = useState<string>('');
  const [speakingTime, setSpeakingTime] = useState<number>(0);
  const [chairName, setChairName] = useState<string>('Chair');
  const [rosterOpen, setRosterOpen] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);

  useEffect(() => {
    if (!committee_id) return;

    const fetchCommitteeData = async () => {
      const { data: commData } = await supabase
        .from('committees')
        .select('*')
        .eq('id', committee_id)
        .maybeSingle();

      if (commData) {
        setCommittee(commData);
      }

      const { data: chairRows } = await supabase
        .from('committee_assignments')
        .select('users(full_name)')
        .eq('committee_id', committee_id)
        .limit(1);

      const chairRow = Array.isArray(chairRows) ? chairRows[0] : null;
      const users = (chairRow as any)?.users;
      const chairFullName = Array.isArray(users) ? users[0]?.full_name : users?.full_name;
      setChairName(chairFullName || 'Chair');

      const { data: sessionData } = await supabase
        .from('committee_sessions')
        .select('*')
        .eq('committee_id', committee_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sessionData) return;

      if (sessionData.caucus_type === 'MODERATED') {
        setSessionStatus('Moderated Caucus');
        setDebateTopic(sessionData.debate_topic || '');
        setSpeakingTime(sessionData.speaking_time_limit || 0);
      } else if (sessionData.caucus_type === 'UNMODERATED') {
        setSessionStatus('Unmoderated Caucus');
        setDebateTopic('');
        setSpeakingTime(0);
      } else {
        setSessionStatus('In Session');
        setDebateTopic('');
        setSpeakingTime(0);
      }
    };

    fetchCommitteeData();
    const interval = setInterval(fetchCommitteeData, 60000);

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
          fetchCommitteeData();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [committee_id]);

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

  const roomPulse = sessionStatus === 'In Session';

  const backgroundGuideUrl = committee?.background_guide_url;
  const ropUrl = committee?.rop_url;

  return (
    <Card className="bg-bg-card border border-border-subtle relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-jotia text-text-primary tracking-tight uppercase">
            {committee.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl">{committeeAssignment.country}</span>
            <span className="text-text-secondary text-sm px-2 py-0.5 bg-bg-raised rounded">
              Chair: {chairName}
            </span>
          </div>
          <p className="text-text-secondary mt-2 text-sm max-w-2xl">{committee.topic}</p>
        </div>

        <div className="flex flex-col items-end gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-text-tertiary uppercase tracking-widest font-bold">
                Room Status
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-text-primary">{sessionStatus}</span>
                {roomPulse && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-text-primary/70 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-text-primary/70" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {sessionStatus === 'Moderated Caucus' && (
            <div className="bg-bg-raised p-2 border border-border-subtle rounded-card text-xs text-left w-full md:w-auto">
              <p>
                <span className="text-text-tertiary">Topic:</span> {debateTopic}
              </p>
              <p>
                <span className="text-text-tertiary">Time:</span> {speakingTime}s per speaker
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!backgroundGuideUrl}
              onClick={() => backgroundGuideUrl && window.open(backgroundGuideUrl, '_blank')}
            >
              Background Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!ropUrl}
              onClick={() => ropUrl && window.open(ropUrl, '_blank')}
            >
              ROP
            </Button>
            <Button variant="default" size="sm" onClick={fetchRoster}>
              Committee Roster
            </Button>
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