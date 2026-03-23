'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChairContext } from '../page';

interface Rating {
  argumentation_quality: number;
  diplomacy: number;
  preparation: number;
  private_notes: string;
}

const StarRating = memo(({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        onClick={() => onChange(star)}
        className={`w-8 h-8 min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 md:w-6 md:h-6 rounded flex items-center justify-center text-sm transition-colors ${
          star <= value ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-bg-raised text-text-dimmed border border-border-subtle'
        }`}
      >
        {star}
      </button>
    ))}
  </div>
));
StarRating.displayName = 'StarRating';

export default function DelegatesTab({ ctx }: { ctx: ChairContext }) {
  const queryClient = useQueryClient();
  const [nomineeId, setNomineeId] = useState('');
  const [justification, setJustification] = useState('');
  const [expandedDelegate, setExpandedDelegate] = useState<string | null>(null);

  const { data: ratings = {} } = useQuery({
    queryKey: ['delegate-ratings', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('delegate_ratings')
        .select('*')
        .eq('committee_id', ctx.committee.id)
        .eq('rated_by', ctx.user.id)
        .limit(100);
      const r: Record<string, Rating> = {};
      (data || []).forEach((d: any) => {
        r[d.delegate_id] = {
          argumentation_quality: d.argumentation_quality,
          diplomacy: d.diplomacy,
          preparation: d.preparation,
          private_notes: d.private_notes || '',
        };
      });
      return r;
    },
    staleTime: 30 * 1000,
  });

  const { data: speakingStats = {} } = useQuery({
    queryKey: ['speaking-stats', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('speakers_list')
        .select('delegate_id, actual_speaking_time')
        .eq('committee_id', ctx.committee.id)
        .eq('status', 'COMPLETED')
        .limit(100);
      const s: Record<string, { time: number; count: number }> = {};
      (data || []).forEach((r: any) => {
        if (!s[r.delegate_id]) s[r.delegate_id] = { time: 0, count: 0 };
        s[r.delegate_id].time += r.actual_speaking_time || 0;
        s[r.delegate_id].count += 1;
      });
      return s;
    },
    staleTime: 30 * 1000,
  });

  const { data: nominees = [] } = useQuery({
    queryKey: ['delegate-nominees', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('best_delegate_nominees')
        .select('*, delegate:delegate_id(full_name)')
        .eq('committee_id', ctx.committee.id)
        .eq('nominated_by', ctx.user.id);
      return data || [];
    },
  });

  const saveRatingMutation = useMutation({
    mutationFn: async ({ delegateId, updated }: { delegateId: string, updated: Rating }) => {
      await supabase.from('delegate_ratings').upsert({
        committee_id: ctx.committee.id,
        delegate_id: delegateId,
        rated_by: ctx.user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'committee_id,delegate_id,rated_by' });
    },
    onMutate: async ({ delegateId, updated }) => {
      await queryClient.cancelQueries({ queryKey: ['delegate-ratings', ctx.committee?.id] });
      const previous = queryClient.getQueryData(['delegate-ratings', ctx.committee?.id]);
      queryClient.setQueryData(['delegate-ratings', ctx.committee?.id], (old: any) => ({
        ...old,
        [delegateId]: updated
      }));
      return { previous };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['delegate-ratings', ctx.committee?.id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-ratings', ctx.committee?.id] });
    }
  });

  const saveRating = (delegateId: string, field: keyof Rating, value: number | string) => {
    const current = ratings[delegateId] || { argumentation_quality: 0, diplomacy: 0, preparation: 0, private_notes: '' };
    const updated = { ...current, [field]: value };
    saveRatingMutation.mutate({ delegateId, updated });
  };

  const addNomineeMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('best_delegate_nominees').insert({
        committee_id: ctx.committee.id,
        delegate_id: nomineeId,
        nominated_by: ctx.user.id,
        justification,
      });
    },
    onSuccess: () => {
      setNomineeId('');
      setJustification('');
      queryClient.invalidateQueries({ queryKey: ['delegate-nominees', ctx.committee?.id] });
    }
  });

  const removeNomineeMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('best_delegate_nominees').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-nominees', ctx.committee?.id] });
    }
  });

  const addNominee = () => {
    if (!nomineeId || !justification) return;
    addNomineeMutation.mutate();
  };

  const removeNominee = (id: string) => {
    removeNomineeMutation.mutate(id);
  };

  const saving = addNomineeMutation.isPending || removeNomineeMutation.isPending;

  const getScore = useCallback((delegateId: string) => {
    const r = ratings[delegateId];
    const s = speakingStats[delegateId];
    const ratingAvg = r ? (r.argumentation_quality + r.diplomacy + r.preparation) / 3 : 0;
    // Base score from ratings + activity bonus (0.5 per speech, max 2.5)
    const base = ratingAvg + (s ? Math.min(s.count * 0.5, 2.5) : 0);
    return Math.round(base * 10) / 10;
  }, [ratings, speakingStats]);

  const sortedDelegates = useMemo(() => [...ctx.delegates].sort((a, b) => {
    const aId = a.user_id;
    const bId = b.user_id;
    return getScore(bId) - getScore(aId);
  }), [ctx.delegates, getScore]);

  const fmt = (t: number) => `${Math.floor(t / 60)}m ${t % 60}s`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-jotia-bold text-2xl text-text-primary">Delegate Performance</h2>
        <p className="text-text-dimmed text-sm">Private chair ratings and tracking for {ctx.committee?.name}</p>
      </div>

      {/* Ranking Table */}
      <Card>
        <SectionLabel>Performance Ranking</SectionLabel>
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest w-8">#</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Delegate</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Speeches</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Time</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Argumentation</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Diplomacy</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Preparation</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sortedDelegates.map((d, i) => {
                const dId = d.user_id;
                const r = ratings[dId] || { argumentation_quality: 0, diplomacy: 0, preparation: 0, private_notes: '' };
                const s = speakingStats[dId] || { count: 0, time: 0 };
                const score = getScore(dId);
                const isExpanded = expandedDelegate === dId;

                return (
                  <tr key={dId} className="hover:bg-bg-raised/30 transition-colors border-b border-border-subtle/50 cursor-pointer" onClick={() => setExpandedDelegate(isExpanded ? null : dId)}>
                    <td className="p-3 text-xs text-text-tertiary font-mono">{i + 1}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{d.full_name}</span>
                        <span className="text-[10px] text-text-dimmed uppercase tracking-wider">{d.country}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-text-secondary">{s.count}</td>
                    <td className="p-3 text-sm text-text-secondary font-mono">{fmt(s.time)}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <StarRating value={r.argumentation_quality} onChange={v => saveRating(dId, 'argumentation_quality', v)} />
                    </td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <StarRating value={r.diplomacy} onChange={v => saveRating(dId, 'diplomacy', v)} />
                    </td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <StarRating value={r.preparation} onChange={v => saveRating(dId, 'preparation', v)} />
                    </td>
                    <td className="p-3 text-sm font-bold text-text-primary">{score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {sortedDelegates.map((d, i) => {
            const dId = d.user_id;
            const r = ratings[dId] || { argumentation_quality: 0, diplomacy: 0, preparation: 0, private_notes: '' };
            const s = speakingStats[dId] || { time: 0, count: 0 };
            const expanded = expandedDelegate === dId;
            return (
              <div key={dId} className="bg-bg-raised rounded-card border border-border-subtle overflow-hidden">
                <div className="p-4 flex items-center justify-between" onClick={() => setExpandedDelegate(expanded ? null : dId)}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-tertiary w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{d.full_name}</p>
                      <p className="text-xs text-text-dimmed">{d.country} · {s.count} speeches · {fmt(s.time)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{getScore(dId)}</span>
                </div>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border-subtle pt-3">
                    <div>
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Argumentation</p>
                      <StarRating value={r.argumentation_quality} onChange={v => saveRating(dId, 'argumentation_quality', v)} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Diplomacy</p>
                      <StarRating value={r.diplomacy} onChange={v => saveRating(dId, 'diplomacy', v)} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Preparation</p>
                      <StarRating value={r.preparation} onChange={v => saveRating(dId, 'preparation', v)} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Private Notes</p>
                      <Textarea
                        rows={2}
                        value={r.private_notes}
                        onChange={e => saveRating(dId, 'private_notes', e.target.value)}
                        placeholder="Chair notes..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expanded Notes (Desktop) */}
      {expandedDelegate && (
        <div className="hidden md:block">
          <Card>
            <SectionLabel>Private Notes — {ctx.delegates.find(d => d.user_id === expandedDelegate)?.full_name}</SectionLabel>
            <Textarea
              rows={3}
              value={ratings[expandedDelegate]?.private_notes || ''}
              onChange={e => saveRating(expandedDelegate, 'private_notes', e.target.value)}
              placeholder="Write private notes about this delegate..."
            />
          </Card>
        </div>
      )}

      {/* Best Delegate Nominees */}
      <Card>
        <SectionLabel>Best Delegate Nominees ({nominees.length}/3)</SectionLabel>
        <div className="space-y-3 mb-4">
          {nominees.map(n => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-card border border-yellow-500/20">
              <div>
                <p className="text-sm font-bold text-text-primary">{n.delegate?.full_name}</p>
                <p className="text-xs text-text-dimmed">{n.justification}</p>
              </div>
              <button onClick={() => removeNominee(n.id)} className="text-xs font-bold text-status-rejected-text uppercase hover:underline">Remove</button>
            </div>
          ))}
        </div>
        {nominees.length < 3 && (
          <div className="space-y-3 p-4 bg-bg-raised rounded-card border border-border-subtle">
            <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={nomineeId} onChange={e => setNomineeId(e.target.value)}>
              <option value="">Select delegate...</option>
              {ctx.delegates.filter(d => !nominees.some(n => n.delegate_id === d.user_id)).map(d => (
                <option key={d.user_id} value={d.user_id}>{d.full_name} — {d.country}</option>
              ))}
            </select>
            <Textarea rows={2} value={justification} onChange={e => setJustification(e.target.value)} placeholder="Written justification..." />
            <Button onClick={addNominee} disabled={!nomineeId || !justification || saving} className="w-full min-h-[48px]">
              {saving ? 'Saving...' : 'Nominate'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
