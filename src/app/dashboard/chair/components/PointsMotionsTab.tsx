'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

const TYPES = [
  { value: 'POINT_OF_ORDER', label: 'Point of Order' },
  { value: 'POINT_OF_INFORMATION', label: 'Point of Information' },
  { value: 'POINT_OF_PERSONAL_PRIVILEGE', label: 'Point of Personal Privilege' },
  { value: 'MOTION_FOR_MODERATED_CAUCUS', label: 'Motion for Moderated Caucus' },
  { value: 'MOTION_FOR_UNMODERATED_CAUCUS', label: 'Motion for Unmoderated Caucus' },
  { value: 'MOTION_TO_OPEN_DEBATE', label: 'Motion to Open Debate' },
  { value: 'MOTION_TO_CLOSE_DEBATE', label: 'Motion to Close Debate' },
  { value: 'MOTION_TO_SUSPEND', label: 'Motion to Suspend the Meeting' },
  { value: 'MOTION_TO_ADJOURN', label: 'Motion to Adjourn' },
  { value: 'MOTION_TO_TABLE', label: 'Motion to Table' },
  { value: 'MOTION_TO_INTRODUCE_DRAFT', label: 'Motion to Introduce Draft Resolution' },
];

const OUTCOMES = ['PASSED', 'FAILED', 'RULED_OUT_OF_ORDER', 'WITHDRAWN'];
const OUTCOME_STYLES: Record<string, string> = {
  PASSED: 'text-green-400',
  FAILED: 'text-status-rejected-text',
  RULED_OUT_OF_ORDER: 'text-yellow-400',
  WITHDRAWN: 'text-text-dimmed',
};

export default function PointsMotionsTab({ ctx }: { ctx: ChairContext }) {
  const [records, setRecords] = useState<any[]>([]);
  const [sessionLog, setSessionLog] = useState<any[]>([]);
  const [type, setType] = useState(TYPES[0].value);
  const [delegateId, setDelegateId] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('PASSED');
  const [votesFor, setVotesFor] = useState(0);
  const [votesAgainst, setVotesAgainst] = useState(0);
  const [votesAbstain, setVotesAbstain] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
    loadSessionLog();
  }, [ctx.committee?.id]);

  const loadRecords = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('points_and_motions')
      .select('*, delegate:delegate_id(full_name)')
      .eq('committee_id', ctx.committee.id)
      .order('created_at', { ascending: false });
    setRecords(data || []);
  };

  const loadSessionLog = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('session_events')
      .select('*')
      .eq('committee_id', ctx.committee.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setSessionLog(data || []);
  };

  const submit = async () => {
    if (!ctx.committee?.id) return;
    setSaving(true);
    const isMotion = type.startsWith('MOTION_');

    await supabase.from('points_and_motions').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      delegate_id: delegateId || null,
      type,
      description: description || null,
      outcome,
      votes_for: isMotion ? votesFor : 0,
      votes_against: isMotion ? votesAgainst : 0,
      votes_abstain: isMotion ? votesAbstain : 0,
      created_by: ctx.user.id,
    });

    // Log event
    const delegateName = ctx.delegates.find(d => d.id === delegateId)?.full_name || 'Unknown';
    const typeLabel = TYPES.find(t => t.value === type)?.label || type;
    await supabase.from('session_events').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      event_type: 'MOTION',
      title: `${typeLabel} by ${delegateName} — ${outcome}`,
      description,
      metadata: { 
        type, 
        outcome, 
        votes_for: votesFor, 
        votes_against: votesAgainst, 
        votes_abstain: votesAbstain 
      },
      created_by: ctx.user.id,
    });

    setDescription('');
    setVotesFor(0);
    setVotesAgainst(0);
    setVotesAbstain(0);
    setSaving(false);
    loadRecords();
    loadSessionLog();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* New Entry */}
      <Card>
        <SectionLabel>Log Point or Motion</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Type</label>
            <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Delegate</label>
            <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={delegateId} onChange={e => setDelegateId(e.target.value)}>
              <option value="">Select delegate...</option>
              {ctx.delegates.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name || 'Unknown'} — {d.country}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Description (optional)</label>
            <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details..." />
          </div>
          <div>
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Outcome</label>
            <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={outcome} onChange={e => setOutcome(e.target.value)}>
              {OUTCOMES.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {type.startsWith('MOTION_') && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">For</label>
                <input type="number" min={0} className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={votesFor} onChange={e => setVotesFor(Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Against</label>
                <input type="number" min={0} className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={votesAgainst} onChange={e => setVotesAgainst(Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Abstain</label>
                <input type="number" min={0} className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={votesAbstain} onChange={e => setVotesAbstain(Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
        <Button onClick={submit} disabled={saving} className="mt-4 w-full min-h-[48px]">{saving ? 'Saving...' : 'Log Entry'}</Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records */}
        <Card>
          <SectionLabel>Points & Motions Record</SectionLabel>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {records.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No records yet.</p>}
            {records.map(r => {
              const tl = TYPES.find(t => t.value === r.type)?.label || r.type;
              return (
                <div key={r.id} className="p-3 bg-bg-raised rounded-card border border-border-subtle">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">{tl}</span>
                      <p className="text-sm font-medium text-text-primary mt-0.5">{r.delegate?.full_name || 'Unknown'}</p>
                      {r.description && <p className="text-xs text-text-dimmed mt-1">{r.description}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold uppercase ${OUTCOME_STYLES[r.outcome] || ''}`}>{r.outcome?.replace(/_/g, ' ')}</span>
                      {r.votes_for > 0 && (
                        <p className="text-[10px] text-text-dimmed mt-0.5">{r.votes_for}-{r.votes_against}-{r.votes_abstain}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-dimmed mt-1">{new Date(r.created_at).toLocaleTimeString()}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Session Log */}
        <Card>
          <SectionLabel>Session Event Log</SectionLabel>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sessionLog.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No events recorded.</p>}
            {sessionLog.map(e => (
              <div key={e.id} className="p-3 bg-bg-raised rounded-card border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-2 py-0.5 bg-bg-card rounded-full border border-border-subtle">{e.event_type}</span>
                  <span className="text-[10px] text-text-dimmed">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm font-medium text-text-primary">{e.title}</p>
                {e.description && <p className="text-xs text-text-dimmed mt-0.5">{e.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
