'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

export default function SpeakersListTab({ ctx }: { ctx: ChairContext }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedDelegate, setSelectedDelegate] = useState('');
  const [speakingTimer, setSpeakingTimer] = useState(0);
  const [speakingRunning, setSpeakingRunning] = useState(false);
  const [stats, setStats] = useState<Record<string, { time: number; count: number }>>({});
  const [speakingLimit] = useState(120);

  const loadQueue = useCallback(async () => {
    if (!ctx.committee?.id) return;
    const [{ data }, { data: completed }] = await Promise.all([
      supabase
        .from('speakers_list')
        .select('*, delegate:delegate_id(id, full_name)')
        .eq('committee_id', ctx.committee.id)
        .in('status', ['QUEUED', 'SPEAKING'])
        .order('position', { ascending: true }),
      supabase
        .from('speakers_list')
        .select('delegate_id, actual_speaking_time')
        .eq('committee_id', ctx.committee.id)
        .eq('status', 'COMPLETED'),
    ]);
    setQueue(data || []);
    const s: Record<string, { time: number; count: number }> = {};
    (completed || []).forEach((r: any) => {
      if (!s[r.delegate_id]) s[r.delegate_id] = { time: 0, count: 0 };
      s[r.delegate_id].time += r.actual_speaking_time || 0;
      s[r.delegate_id].count += 1;
    });
    setStats(s);
  }, [ctx.committee?.id]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Speaking countdown
  useEffect(() => {
    let interval: any;
    if (speakingRunning && speakingTimer > 0) {
      interval = setInterval(() => setSpeakingTimer(p => p - 1), 1000);
    } else if (speakingTimer <= 0 && speakingRunning) {
      setSpeakingRunning(false);
    }
    return () => clearInterval(interval);
  }, [speakingRunning, speakingTimer]);

  const addSpeaker = async () => {
    if (!selectedDelegate || !ctx.committee?.id) return;
    const maxPos = queue.length > 0 ? Math.max(...queue.map(q => q.position)) + 1 : 0;
    await supabase.from('speakers_list').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      delegate_id: selectedDelegate,
      position: maxPos,
      speaking_time_limit: speakingLimit,
    });
    setSelectedDelegate('');
    loadQueue();
  };

  const markSpeaking = async (id: string) => {
    const speaker = queue.find(q => q.id === id);
    if (!speaker) return;

    await supabase.from('speakers_list').update({ status: 'SPEAKING', started_at: new Date().toISOString() }).eq('id', id);
    
    // Notify the delegate
    await supabase.from('notifications').insert({
      user_id: speaker.delegate_id,
      title: "It's your turn to speak!",
      message: `The chair has recognized you. Your speaking time is ${fmt(speaker.speaking_time_limit || speakingLimit)}.`,
      type: "INFO",
      link: "/dashboard/delegate"
    });

    setSpeakingTimer(speaker.speaking_time_limit || speakingLimit);
    setSpeakingRunning(true);
    loadQueue();
  };

  const nextSpeaker = async () => {
    const current = queue.find(q => q.status === 'SPEAKING');
    if (current) {
      const elapsed = speakingLimit - speakingTimer;
      await supabase.from('speakers_list').update({
        status: 'COMPLETED',
        actual_speaking_time: elapsed,
        completed_at: new Date().toISOString(),
      }).eq('id', current.id);
    }
    setSpeakingRunning(false);
    setSpeakingTimer(0);

    const nextInQueue = queue.find(q => q.status === 'QUEUED');
    if (nextInQueue) {
      await markSpeaking(nextInQueue.id);
    }
    loadQueue();
  };

  const yieldTime = async (type: string) => {
    const current = queue.find(q => q.status === 'SPEAKING');
    if (!current) return;
    const elapsed = speakingLimit - speakingTimer;
    await supabase.from('speakers_list').update({
      status: 'YIELDED',
      yield_type: type,
      actual_speaking_time: elapsed,
      completed_at: new Date().toISOString(),
    }).eq('id', current.id);
    setSpeakingRunning(false);
    setSpeakingTimer(0);
    loadQueue();
  };

  const removeFromQueue = async (id: string) => {
    await supabase.from('speakers_list').delete().eq('id', id);
    loadQueue();
  };

  const clearList = async () => {
    if (!ctx.committee?.id) return;
    await supabase.from('speakers_list').delete().eq('committee_id', ctx.committee.id).in('status', ['QUEUED']);
    loadQueue();
  };

  const moveUp = async (index: number) => {
    if (index <= 0) return;
    const items = [...queue];
    const a = items[index];
    const b = items[index - 1];
    if (a.status === 'SPEAKING' || b.status === 'SPEAKING') return;
    await supabase.from('speakers_list').update({ position: b.position }).eq('id', a.id);
    await supabase.from('speakers_list').update({ position: a.position }).eq('id', b.id);
    loadQueue();
  };

  const moveDown = async (index: number) => {
    if (index >= queue.length - 1) return;
    const items = [...queue];
    const a = items[index];
    const b = items[index + 1];
    if (a.status === 'SPEAKING' || b.status === 'SPEAKING') return;
    await supabase.from('speakers_list').update({ position: b.position }).eq('id', a.id);
    await supabase.from('speakers_list').update({ position: a.position }).eq('id', b.id);
    loadQueue();
  };

  const fmt = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  const currentSpeaker = queue.find(q => q.status === 'SPEAKING');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Active Speaker */}
      {currentSpeaker && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Now Speaking</p>
              <p className="text-2xl font-jotia-bold text-text-primary mt-1">{currentSpeaker.delegate?.full_name}</p>
            </div>
            <div className={`text-4xl font-mono ${speakingTimer <= 15 ? 'text-status-rejected-text animate-pulse' : 'text-text-primary'}`}>
              {fmt(speakingTimer)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={nextSpeaker} className="min-h-[48px]">Next Speaker</Button>
            <Button variant="outline" onClick={() => yieldTime('DELEGATE')} className="min-h-[48px]">Yield to Delegate</Button>
            <Button variant="outline" onClick={() => yieldTime('CHAIR')} className="min-h-[48px]">Yield to Chair</Button>
            <Button variant="outline" onClick={() => yieldTime('QUESTIONS')} className="min-h-[48px]">Yield to Questions</Button>
          </div>
        </div>
      )}

      {/* Add Speaker */}
      <Card>
        <SectionLabel>Add Speaker</SectionLabel>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="flex-1 h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm"
            value={selectedDelegate}
            onChange={e => setSelectedDelegate(e.target.value)}
          >
            <option value="">Select delegate...</option>
            {ctx.delegates.map(d => (
              <option key={d.user_id} value={d.user_id}>
                {d.full_name || 'Unknown'} — {d.country}
              </option>
            ))}
          </select>
          <Button onClick={addSpeaker} disabled={!selectedDelegate} className="min-h-[48px]">Add to Queue</Button>
        </div>
      </Card>

      {/* Queue */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">Queue ({queue.filter(q => q.status === 'QUEUED').length} speakers)</SectionLabel>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearList}>Clear List</Button>
            {!currentSpeaker && queue.length > 0 && (
              <Button size="sm" onClick={() => markSpeaking(queue[0].id)}>Start First</Button>
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="space-y-1">
            {queue.filter(q => q.status === 'QUEUED').map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-bg-raised rounded-card border border-border-subtle">
                <span className="text-xs font-bold text-text-tertiary w-6">{i + 1}</span>
                <span className="text-sm font-medium text-text-primary flex-1">{s.delegate?.full_name}</span>
                <span className="text-xs text-text-dimmed">{fmt(s.speaking_time_limit || speakingLimit)} limit</span>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(queue.indexOf(s))} className="p-1 text-text-dimmed hover:text-text-primary" title="Move up">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <button onClick={() => moveDown(queue.indexOf(s))} className="p-1 text-text-dimmed hover:text-text-primary" title="Move down">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <button onClick={() => removeFromQueue(s.id)} className="p-1 text-status-rejected-text hover:text-red-400" title="Remove">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {queue.filter(q => q.status === 'QUEUED').length === 0 && (
              <p className="text-text-dimmed text-sm text-center py-6">No speakers in queue.</p>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-2">
          {queue.filter(q => q.status === 'QUEUED').map((s, i) => (
            <div key={s.id} className="bg-bg-raised rounded-card border border-border-subtle p-4 flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(queue.indexOf(s))} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center bg-bg-card rounded border border-border-subtle">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
                <button onClick={() => moveDown(queue.indexOf(s))} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center bg-bg-card rounded border border-border-subtle">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-text-tertiary">#{i + 1}</span>
                <p className="text-sm font-medium text-text-primary">{s.delegate?.full_name}</p>
              </div>
              <button onClick={() => removeFromQueue(s.id)} className="p-2 min-h-[48px] min-w-[48px] text-status-rejected-text bg-bg-card rounded border border-border-subtle flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Speaking Stats */}
      <Card>
        <SectionLabel>Speaking Statistics</SectionLabel>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Delegate</th>
              <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Speeches</th>
              <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Total Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {ctx.delegates.map(d => {
              const dId = d.user_id;
              const s = stats[dId] || { time: 0, count: 0 };
              return (
                <tr key={dId}>
                  <td className="p-3 text-sm text-text-primary">{d.full_name || 'Unknown'}</td>
                  <td className="p-3 text-sm text-text-secondary">{s.count}</td>
                  <td className="p-3 text-sm font-mono text-text-secondary">{fmt(s.time)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
