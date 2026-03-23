'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

const ATTENDANCE_STATES = ['ABSENT', 'PRESENT', 'PRESENT_AND_VOTING'] as const;
const STATE_STYLES: Record<string, string> = {
  ABSENT: 'bg-bg-raised text-text-dimmed border-border-subtle',
  PRESENT: 'bg-green-500/15 text-green-400 border-green-500/30',
  PRESENT_AND_VOTING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};
const STATE_LABELS: Record<string, string> = {
  ABSENT: 'Absent',
  PRESENT: 'Present',
  PRESENT_AND_VOTING: 'Present & Voting',
};

export default function RollCallTab({ ctx }: { ctx: ChairContext }) {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [activeRollCall, setActiveRollCall] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [quorumThreshold, setQuorumThreshold] = useState(0.5);

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [ctx.committee?.id]);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const loadSettings = async () => {
    const { data } = await supabase.from('conference_settings').select('*').eq('id', '1').single();
    if (data?.quorum_threshold) setQuorumThreshold(data.quorum_threshold);
  };

  const loadHistory = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('roll_call_records')
      .select('*, entries:roll_call_entries(*)')
      .eq('committee_id', ctx.committee.id)
      .order('started_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const startRollCall = async () => {
    const { data } = await supabase.from('roll_call_records').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      created_by: ctx.user.id,
    }).select().single();

    if (data) {
      setActiveRollCall(data);
      // Initialize all delegates as ABSENT
      const initial: Record<string, string> = {};
      ctx.delegates.forEach(d => { initial[d.user_id] = 'ABSENT'; });
      setEntries(initial);
      setElapsedTime(0);
      setTimerRunning(true);
    }
  };

  const cycleState = (delegateId: string) => {
    const current = entries[delegateId] || 'ABSENT';
    const idx = ATTENDANCE_STATES.indexOf(current as any);
    const next = ATTENDANCE_STATES[(idx + 1) % ATTENDANCE_STATES.length];
    setEntries(p => ({ ...p, [delegateId]: next }));
  };

  const completeRollCall = async () => {
    if (!activeRollCall) return;
    setTimerRunning(false);

    // Save entries
    const inserts = Object.entries(entries).map(([delegateId, status]) => ({
      roll_call_id: activeRollCall.id,
      delegate_id: delegateId,
      status,
    }));
    await supabase.from('roll_call_entries').insert(inserts);

    // Update delegate physical status
    await Promise.all(
      Object.entries(entries).map(([delegateId, status]) => 
        supabase
          .from('delegate_presence_statuses')
          .upsert({
            user_id: delegateId,
            committee_id: ctx.committee.id,
            current_status: status === 'ABSENT' ? 'Absent' : 'Present In Session',
            last_changed_by: ctx.user.id,
            last_changed_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
      )
    );

    // Mark complete
    await supabase.from('roll_call_records').update({ completed_at: new Date().toISOString() }).eq('id', activeRollCall.id);

    // Log event
    const presentCount = Object.values(entries).filter(s => s !== 'ABSENT').length;
    await supabase.from('session_events').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      event_type: 'ROLL_CALL',
      title: `Roll call completed: ${presentCount}/${ctx.delegates.length} present`,
      metadata: { entries, elapsed: elapsedTime },
      created_by: ctx.user.id,
    });

    setActiveRollCall(null);
    loadHistory();
  };

  const presentCount = Object.values(entries).filter(s => s !== 'ABSENT').length;
  const total = ctx.delegates.length;
  const quorumMet = total > 0 && (presentCount / total) >= quorumThreshold;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quorum Indicator */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-jotia-bold text-2xl text-text-primary">Roll Call</h2>
          <p className="text-text-dimmed text-sm mt-1">Digital attendance for {ctx.committee?.name || 'committee'}</p>
        </div>
        <div className="flex items-center gap-4">
          {activeRollCall && (
            <div className="text-right">
              <div className="font-mono text-2xl text-text-primary">
                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-[10px] text-text-dimmed uppercase tracking-widest">Elapsed</p>
            </div>
          )}
          {!activeRollCall ? (
            <Button onClick={startRollCall} disabled={ctx.delegates.length === 0}>Start Roll Call</Button>
          ) : (
            <Button onClick={completeRollCall}>Complete Roll Call</Button>
          )}
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide History' : 'History'}
          </Button>
        </div>
      </div>

      {/* Quorum Bar */}
      {activeRollCall && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Quorum</span>
            <span className={`text-xs font-bold uppercase tracking-widest ${quorumMet ? 'text-green-400' : 'text-status-rejected-text'}`}>
              {quorumMet ? 'Quorum Established' : 'Quorum Not Reached'} — {presentCount}/{total}
            </span>
          </div>
          <div className="w-full bg-bg-raised rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${quorumMet ? 'bg-green-500' : 'bg-status-rejected-text'}`} style={{ width: `${total > 0 ? (presentCount / total) * 100 : 0}%` }} />
          </div>
        </Card>
      )}

      {/* Delegate List */}
      {activeRollCall && (
        <Card>
          <SectionLabel>Delegates</SectionLabel>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Name</th>
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Country</th>
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ctx.delegates.map(d => {
                  const dId = d.user_id;
                  const state = entries[dId] || 'ABSENT';
                  return (
                    <tr key={dId} className="hover:bg-bg-raised/30 cursor-pointer" onClick={() => cycleState(dId)}>
                      <td className="p-3 text-sm font-medium text-text-primary">{d.full_name || 'Unknown'}</td>
                      <td className="p-3 text-sm text-text-secondary">{d.country}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${STATE_STYLES[state]}`}>
                          {STATE_LABELS[state]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {ctx.delegates.map(d => {
              const dId = d.user_id;
              const state = entries[dId] || 'ABSENT';
              return (
                <div key={dId} className="bg-bg-raised rounded-card border border-border-subtle p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-text-primary text-sm">{d.full_name || 'Unknown'}</p>
                      <p className="text-xs text-text-dimmed">{d.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ATTENDANCE_STATES.map(s => (
                      <button
                        key={s}
                        onClick={() => setEntries(p => ({ ...p, [dId]: s }))}
                        className={`flex-1 py-3 rounded-button text-xs font-bold uppercase tracking-wider border min-h-[48px] transition-all ${state === s ? STATE_STYLES[s] + ' ring-2 ring-offset-1 ring-offset-bg-card' : 'bg-bg-card text-text-dimmed border-border-subtle'}`}
                      >
                        {STATE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <Card>
          <SectionLabel>Roll Call History</SectionLabel>
          {history.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No roll call records yet.</p>}
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Date</th>
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Attendance</th>
                  <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Quorum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {history.map(h => {
                  const present = (h.entries || []).filter((e: any) => e.status !== 'ABSENT').length;
                  const t = (h.entries || []).length;
                  const pct = t > 0 ? Math.round((present / t) * 100) : 0;
                  const met = t > 0 && (present / t) >= quorumThreshold;
                  return (
                    <tr key={h.id}>
                      <td className="p-3 text-sm text-text-primary">{new Date(h.started_at).toLocaleString()}</td>
                      <td className="p-3 text-sm text-text-secondary">{present}/{t} ({pct}%)</td>
                      <td className="p-3">
                        <span className={`text-xs font-bold uppercase ${met ? 'text-green-400' : 'text-status-rejected-text'}`}>
                          {met ? 'Established' : 'Not Reached'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {history.map(h => {
              const present = (h.entries || []).filter((e: any) => e.status !== 'ABSENT').length;
              const t = (h.entries || []).length;
              const pct = t > 0 ? Math.round((present / t) * 100) : 0;
              const met = t > 0 && (present / t) >= quorumThreshold;
              return (
                <div key={h.id} className="bg-bg-raised rounded-card border border-border-subtle p-4">
                  <p className="text-sm font-medium text-text-primary">{new Date(h.started_at).toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-1">{present}/{t} present ({pct}%)</p>
                  <span className={`text-xs font-bold uppercase ${met ? 'text-green-400' : 'text-status-rejected-text'}`}>{met ? 'Quorum Established' : 'Quorum Not Reached'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
