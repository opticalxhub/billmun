'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, SectionLabel, Input } from '@/components/ui';
import { Button } from '@/components/button';
import { toast } from 'sonner';
import { Check, AlertTriangle, X } from 'lucide-react';
import type { ConferenceStatusData, ConferenceWindow } from '@/lib/use-conference-gate';
import { formatLabel } from '@/lib/roles';

export default function ConferenceControlPage() {
  const queryClient = useQueryClient();
  const [postMsg, setPostMsg] = useState('');
  const [editWindows, setEditWindows] = useState<Array<{ label: string; start_time: string; end_time: string }>>([]);
  const [editMode, setEditMode] = useState(false);

  const { data, isLoading } = useQuery<ConferenceStatusData>({
    queryKey: ['conference-status'],
    queryFn: async () => {
      const res = await fetch('/api/config/conference-status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 10_000,
  });

  const overrideMutation = useMutation({
    mutationFn: async (override: 'OPEN' | 'CLOSED' | null) => {
      const res = await fetch('/api/config/conference', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_override: override }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-status'] });
      toast.success('Override updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const postMsgMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/config/conference', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_conference_message: postMsg }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-status'] });
      toast.success('Post-conference message saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const windowsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/config/conference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windows: editWindows }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-status'] });
      setEditMode(false);
      toast.success('Schedule saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = () => {
    setEditWindows(
      (data?.windows || []).map((w) => ({
        label: w.label,
        start_time: w.start_time.slice(0, 16),
        end_time: w.end_time.slice(0, 16),
      }))
    );
    setEditMode(true);
  };

  const addWindow = () => {
    setEditWindows((prev) => [...prev, { label: '', start_time: '', end_time: '' }]);
  };

  const removeWindow = (idx: number) => {
    setEditWindows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateWindow = (idx: number, field: string, value: string) => {
    setEditWindows((prev) =>
      prev.map((w, i) => (i === idx ? { ...w, [field]: value } : w))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-status-approved-bg text-status-approved-text border-status-approved-border',
    CLOSED: 'bg-status-rejected-bg text-status-rejected-text border-status-rejected-border',
    PRE_CONFERENCE: 'bg-status-pending-bg text-status-pending-text border-status-pending-border',
    POST_CONFERENCE: 'bg-bg-raised text-text-secondary border-border-subtle',
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel className="mb-0">Conference Status</SectionLabel>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              statusColors[data?.status || 'CLOSED'] || statusColors.CLOSED
            }`}
          >
            {formatLabel(data?.status) || 'Unknown'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Manual Override</p>
            <p className="text-text-primary font-semibold">{data?.manual_override || 'None (auto)'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Current Window</p>
            <p className="text-text-primary font-semibold">{data?.current_window?.label || 'None'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Next Window</p>
            <p className="text-text-primary font-semibold">{data?.next_window?.label || 'None'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Server Time</p>
            <p className="text-text-primary font-semibold font-mono text-xs">
              {data?.server_time
                ? new Date(data.server_time).toLocaleString('en-US', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Override Controls */}
      <Card>
        <SectionLabel>Manual Override</SectionLabel>
        <p className="text-sm text-text-dimmed mb-4">
          Force the portal open or closed regardless of the schedule. Set to &ldquo;Auto&rdquo; to follow the schedule.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={data?.manual_override === 'OPEN' ? undefined : 'outline'}
            onClick={() => overrideMutation.mutate('OPEN')}
            loading={overrideMutation.isPending}
            className={data?.manual_override === 'OPEN' ? 'bg-status-approved-text text-white' : ''}
          >
            Force OPEN
          </Button>
          <Button
            variant={data?.manual_override === 'CLOSED' ? undefined : 'outline'}
            onClick={() => overrideMutation.mutate('CLOSED')}
            loading={overrideMutation.isPending}
            className={data?.manual_override === 'CLOSED' ? 'bg-status-rejected-text text-white' : ''}
          >
            Force CLOSED
          </Button>
          <Button
            variant={!data?.manual_override ? undefined : 'outline'}
            onClick={() => overrideMutation.mutate(null)}
            loading={overrideMutation.isPending}
          >
            Auto (Follow Schedule)
          </Button>
        </div>
      </Card>

      {/* Conference Windows */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel className="mb-0">Conference Schedule</SectionLabel>
          {!editMode && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit Schedule
            </Button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            {editWindows.map((w, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border border-border-subtle rounded-card p-3">
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Label</label>
                  <Input value={w.label} onChange={(e) => updateWindow(idx, 'label', e.target.value)} placeholder="Day 1 Morning" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Start (Riyadh)</label>
                  <Input type="datetime-local" value={w.start_time} onChange={(e) => updateWindow(idx, 'start_time', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">End (Riyadh)</label>
                  <Input type="datetime-local" value={w.end_time} onChange={(e) => updateWindow(idx, 'end_time', e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={() => removeWindow(idx)} className="text-status-rejected-text">
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" onClick={addWindow}>+ Add Window</Button>
              <Button onClick={() => windowsMutation.mutate()} loading={windowsMutation.isPending}>Save Schedule</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.windows || []).length === 0 ? (
              <p className="text-sm text-text-dimmed py-6 text-center border border-dashed border-border-subtle rounded-card">
                No conference windows configured yet.
              </p>
            ) : (
              (data?.windows || []).map((w) => {
                const start = new Date(w.start_time);
                const end = new Date(w.end_time);
                const now = new Date();
                const isCurrent = now >= start && now <= end;
                const isPast = now > end;
                return (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between p-4 rounded-card border ${
                      isCurrent
                        ? 'border-status-approved-border bg-status-approved-bg/10'
                        : isPast
                        ? 'border-border-subtle opacity-50'
                        : 'border-border-subtle'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{w.label}</p>
                      <p className="text-xs text-text-dimmed mt-0.5">
                        {start.toLocaleString('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {end.toLocaleString('en-US', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' })}
                        {' (Riyadh)'}
                      </p>
                    </div>
                    {isCurrent && <span className="text-[9px] font-bold text-status-approved-text uppercase tracking-widest animate-pulse">Live Now</span>}
                    {isPast && <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Ended</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card>

      {/* Post-Conference Message */}
      <Card>
        <SectionLabel>Post-Conference Message</SectionLabel>
        <p className="text-sm text-text-dimmed mb-3">
          Shown to delegates after all conference windows have ended.
        </p>
        <textarea
          className="w-full min-h-[80px] rounded-input border border-border-input bg-bg-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled resize-none"
          value={postMsg || data?.post_conference_message || ''}
          onChange={(e) => setPostMsg(e.target.value)}
          placeholder="Thank you for attending BILLMUN 2026..."
        />
        <div className="mt-3">
          <Button
            onClick={() => postMsgMutation.mutate()}
            loading={postMsgMutation.isPending}
            disabled={!postMsg.trim()}
          >
            Save Message
          </Button>
        </div>
      </Card>

      {/* Readiness Checklist */}
      <ReadinessChecklist />
    </div>
  );
}

function ReadinessChecklist() {
  const { data, isLoading, refetch } = useQuery<{
    checks: Array<{ id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }>;
    summary: { total: number; pass: number; fail: number; warn: number };
    ready: boolean;
  }>({
    queryKey: ['conference-readiness'],
    queryFn: async () => {
      const res = await fetch('/api/config/readiness', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const statusIcon = (s: string) => {
    if (s === 'pass') return <Check className="w-5 h-5 text-status-approved-text" />;
    if (s === 'warn') return <AlertTriangle className="w-5 h-5 text-status-pending-text" />;
    return <X className="w-5 h-5 text-status-rejected-text" />;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel className="mb-0">Readiness Checklist</SectionLabel>
        <div className="flex items-center gap-3">
          {data && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              data.ready
                ? 'bg-status-approved-bg text-status-approved-text border-status-approved-border'
                : 'bg-status-rejected-bg text-status-rejected-text border-status-rejected-border'
            }`}>
              {data.ready ? 'Ready' : `${data.summary.fail} blocking`}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Re-check'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-2">
          {data.checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center justify-between p-3 rounded-card border ${
                check.status === 'pass'
                  ? 'border-status-approved-border/30 bg-status-approved-bg/5'
                  : check.status === 'warn'
                  ? 'border-status-pending-border/30 bg-status-pending-bg/5'
                  : 'border-status-rejected-border/30 bg-status-rejected-bg/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {statusIcon(check.status)}
                <span className="text-sm font-medium text-text-primary">{check.label}</span>
              </div>
              <span className="text-[10px] text-text-dimmed font-mono">{check.detail}</span>
            </div>
          ))}
          {data.summary && (
            <div className="pt-3 mt-3 border-t border-border-subtle text-xs text-text-dimmed text-center">
              {data.summary.pass} passed · {data.summary.warn} warnings · {data.summary.fail} blocking
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
