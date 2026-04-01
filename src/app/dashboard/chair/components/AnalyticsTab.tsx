'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel } from '@/components/ui';
import type { ChairContext } from '../page';
import { formatLabel } from '@/lib/roles';

export default function AnalyticsTab({ ctx }: { ctx: ChairContext }) {
  const [docStats, setDocStats] = useState<{ date: string; count: number }[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{ date: string; pct: number }[]>([]);
  const [speakingDist, setSpeakingDist] = useState<{ name: string; time: number }[]>([]);
  const [motionTypes, setMotionTypes] = useState<{ type: string; count: number }[]>([]);
  const [approvalRate, setApprovalRate] = useState({ approved: 0, total: 0 });
  const [equalityScore, setEqualityScore] = useState(0);

  useEffect(() => {
    if (ctx.committee?.id) {
      loadDocStats();
      loadAttendance();
      loadSpeakingDist();
      loadMotionTypes();
      loadApprovalRate();
    }
  }, [ctx.committee?.id]);

  const loadDocStats = async () => {
    const { data } = await supabase
      .from('documents')
      .select('uploaded_at')
      .eq('committee_id', ctx.committee.id)
      .eq('type', 'POSITION_PAPER');
    if (!data) return;
    const byDate: Record<string, number> = {};
    data.forEach(d => {
      const date = new Date(d.uploaded_at).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + 1;
    });
    setDocStats(Object.entries(byDate).map(([date, count]) => ({ date, count })));
  };

  const loadAttendance = async () => {
    const { data } = await supabase
      .from('roll_call_records')
      .select('started_at, entries:roll_call_entries(status)')
      .eq('committee_id', ctx.committee.id)
      .order('started_at', { ascending: true });
    if (!data) return;
    setAttendanceStats(data.map((r: any) => {
      const total = (r.entries || []).length;
      const present = (r.entries || []).filter((e: any) => e.status !== 'ABSENT').length;
      return { date: new Date(r.started_at).toLocaleDateString(), pct: total > 0 ? Math.round((present / total) * 100) : 0 };
    }));
  };

  const loadSpeakingDist = async () => {
    const { data } = await supabase
      .from('speakers_list')
      .select('delegate_id, actual_speaking_time, delegate:delegate_id(full_name)')
      .eq('committee_id', ctx.committee.id)
      .eq('status', 'COMPLETED');
    if (!data) return;
    const byDelegate: Record<string, { name: string; time: number }> = {};
    data.forEach((r: any) => {
      const id = r.delegate_id;
      if (!byDelegate[id]) byDelegate[id] = { name: r.delegate?.full_name || 'Unknown', time: 0 };
      byDelegate[id].time += r.actual_speaking_time || 0;
    });
    const sorted = Object.values(byDelegate).sort((a, b) => b.time - a.time);
    setSpeakingDist(sorted);

    // Equality score
    if (sorted.length >= 2) {
      const totalTime = sorted.reduce((s, d) => s + d.time, 0);
      const half = Math.ceil(sorted.length / 2);
      const bottomHalf = sorted.slice(half);
      const bottomTime = bottomHalf.reduce((s, d) => s + d.time, 0);
      const idealShare = totalTime * (bottomHalf.length / sorted.length);
      setEqualityScore(idealShare > 0 ? Math.round((bottomTime / idealShare) * 100) : 0);
    }
  };

  const loadMotionTypes = async () => {
    const { data } = await supabase
      .from('points_and_motions')
      .select('type')
      .eq('committee_id', ctx.committee.id);
    if (!data) return;
    const byType: Record<string, number> = {};
    data.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
    setMotionTypes(Object.entries(byType).map(([type, count]) => ({ type: formatLabel(type), count })).sort((a, b) => b.count - a.count));
  };

  const loadApprovalRate = async () => {
    const { data } = await supabase
      .from('documents')
      .select('status')
      .eq('committee_id', ctx.committee.id)
      .in('type', ['POSITION_PAPER', 'RESOLUTION']);
    if (!data) return;
    setApprovalRate({
      approved: data.filter(d => d.status === 'APPROVED').length,
      total: data.length,
    });
  };

  const maxSpeaking = speakingDist.length > 0 ? speakingDist[0].time : 1;
  const maxMotion = motionTypes.length > 0 ? motionTypes[0].count : 1;
  const fmt = (t: number) => `${Math.floor(t / 60)}m ${t % 60}s`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-jotia-bold text-2xl text-text-primary">Committee Analytics</h2>
        <p className="text-text-dimmed text-sm">Statistics and charts for {ctx.committee?.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-text-primary">{ctx.delegates.length}</p>
          <p className="text-xs text-text-dimmed uppercase tracking-widest mt-1">Total Delegates</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-text-primary">{docStats.reduce((s, d) => s + d.count, 0)}</p>
          <p className="text-xs text-text-dimmed uppercase tracking-widest mt-1">Papers Submitted</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-text-primary">{approvalRate.total > 0 ? Math.round((approvalRate.approved / approvalRate.total) * 100) : 0}%</p>
          <p className="text-xs text-text-dimmed uppercase tracking-widest mt-1">Approval Rate</p>
        </Card>
        <Card className="text-center">
          <p className={`text-3xl font-bold ${equalityScore >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>{equalityScore}%</p>
          <p className="text-xs text-text-dimmed uppercase tracking-widest mt-1">Participation Equality</p>
        </Card>
      </div>

      {/* Speaking Time Distribution */}
      <Card>
        <SectionLabel>Speaking Time Distribution</SectionLabel>
        {speakingDist.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No speaking data yet.</p>}
        <div className="space-y-2">
          {speakingDist.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-32 truncate shrink-0">{d.name}</span>
              <div className="flex-1 bg-bg-raised rounded-full h-4 overflow-hidden">
                <div className="bg-blue-500/60 h-full rounded-full transition-all" style={{ width: `${(d.time / maxSpeaking) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-text-dimmed w-16 text-right shrink-0">{fmt(d.time)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by Session */}
        <Card>
          <SectionLabel>Attendance by Session</SectionLabel>
          {attendanceStats.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No attendance data yet.</p>}
          <div className="flex items-end gap-2 h-40">
            {attendanceStats.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full bg-green-500/40 rounded-t transition-all" style={{ height: `${s.pct}%` }} />
                <span className="text-[10px] text-text-dimmed mt-1 truncate w-full text-center">{s.date}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Motion Type Breakdown */}
        <Card>
          <SectionLabel>Motion Type Frequency</SectionLabel>
          {motionTypes.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No motions recorded yet.</p>}
          <div className="space-y-2">
            {motionTypes.map(m => (
              <div key={m.type} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-48 truncate shrink-0 capitalize">{m.type.toLowerCase()}</span>
                <div className="flex-1 bg-bg-raised rounded-full h-3 overflow-hidden">
                  <div className="bg-yellow-500/60 h-full rounded-full" style={{ width: `${(m.count / maxMotion) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-text-dimmed w-8 text-right">{m.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Document Submission Timeline */}
      <Card>
        <SectionLabel>Position Paper Submissions Over Time</SectionLabel>
        {docStats.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No submissions yet.</p>}
        <div className="flex items-end gap-2 h-32">
          {docStats.map((s, i) => {
            const maxCount = Math.max(...docStats.map(d => d.count), 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full bg-blue-500/40 rounded-t" style={{ height: `${(s.count / maxCount) * 100}%` }} />
                <span className="text-[10px] text-text-dimmed mt-1">{s.date}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
