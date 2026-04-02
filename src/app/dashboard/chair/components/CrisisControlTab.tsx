'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChairContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card, SectionLabel, Badge, Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { toast } from 'sonner';

export default function CrisisControlTab({ ctx }: { ctx: ChairContext }) {
  const queryClient = useQueryClient();
  const [crisisTitle, setCrisisTitle] = useState('');
  const [crisisBody, setCrisisBody] = useState('');
  const [injecting, setInjecting] = useState(false);

  const committee = ctx.committee;

  // Fetch existing crisis updates (announcements)
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['crisis-chair-updates', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/announcements/committee?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  // Fetch delegate notes (documents submitted to committee)
  const { data: delegateNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['crisis-delegate-notes', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/documents/list?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  const pendingNotes = delegateNotes.filter((n: any) => n.status === 'SUBMITTED' || n.status === 'UNDER_REVIEW');

  const handleInjectCrisis = async () => {
    if (!crisisTitle.trim() || !crisisBody.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setInjecting(true);
    try {
      const res = await fetch('/api/chair/crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'inject_crisis',
          title: crisisTitle.trim(),
          body: crisisBody.trim(),
          committee_id: committee?.id,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to inject crisis');
      }
      toast.success('Crisis update injected');
      setCrisisTitle('');
      setCrisisBody('');
      queryClient.invalidateQueries({ queryKey: ['crisis-chair-updates', committee?.id] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to inject crisis');
    } finally {
      setInjecting(false);
    }
  };

  const handleReviewNote = async (docId: string, status: string) => {
    try {
      const res = await fetch('/api/documents/apply-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, status, feedback: '' }),
      });
      if (!res.ok) throw new Error('Review failed');
      toast.success(`Note ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['crisis-delegate-notes', committee?.id] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to review note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Inject Crisis Update */}
      <Card>
        <SectionLabel>Inject Crisis Update</SectionLabel>
        <p className="text-xs text-text-dimmed mb-3">
          Send a new crisis scenario or development to all delegates in this committee.
        </p>
        <div className="space-y-3">
          <Input
            placeholder="Crisis update title (e.g., 'Breaking: New Intelligence Report')"
            value={crisisTitle}
            onChange={(e) => setCrisisTitle(e.target.value)}
          />
          <Textarea
            value={crisisBody}
            onChange={(e) => setCrisisBody(e.target.value)}
            placeholder="Describe the crisis scenario, new developments, or intelligence briefing..."
            className="min-h-[120px]"
          />
          <button
            onClick={handleInjectCrisis}
            disabled={!crisisTitle.trim() || !crisisBody.trim() || injecting}
            className="px-6 py-2 text-sm font-jotia bg-red-600 text-white rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50"
          >
            {injecting ? 'Injecting...' : 'Inject Crisis Update'}
          </button>
        </div>
      </Card>

      {/* Delegate Notes Queue */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Delegate Crisis Notes</SectionLabel>
          <Badge variant="pending">{pendingNotes.length} pending</Badge>
        </div>
        {notesLoading ? (
          <LoadingSpinner className="py-6" />
        ) : pendingNotes.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No pending crisis notes from delegates.</p>
        ) : (
          <div className="space-y-3">
            {pendingNotes.map((note: any) => (
              <div key={note.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{note.title}</p>
                    <p className="text-xs text-text-dimmed">
                      From {note.users?.full_name || 'Unknown'} · {new Date(note.uploaded_at || note.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleReviewNote(note.id, 'APPROVED')}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReviewNote(note.id, 'REJECTED')}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded hover:opacity-90"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Crisis Timeline */}
      <Card>
        <SectionLabel>Crisis Timeline</SectionLabel>
        {updatesLoading ? (
          <LoadingSpinner className="py-6" />
        ) : updates.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No crisis updates injected yet.</p>
        ) : (
          <div className="relative mt-3">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border-subtle" />
            <div className="space-y-4">
              {updates.map((u: any, i: number) => (
                <div key={u.id} className="relative pl-8">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-bg-card ${i === 0 ? 'bg-red-500' : 'bg-text-tertiary'}`} />
                  <div className="p-3 border border-border-subtle rounded-card">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-text-primary">{u.title}</p>
                      <span className="text-[10px] text-text-dimmed">{new Date(u.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-text-secondary whitespace-pre-wrap">{u.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
