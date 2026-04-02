'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card, SectionLabel, Badge } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { toast } from 'sonner';

export default function CrisisUpdatesTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);

  const session = ctx.session;
  const committee = ctx.committee;

  // Fetch announcements as crisis updates
  const { data: crisisUpdates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['crisis-updates', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/announcements/committee?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  // Fetch my directives (documents of type RESOLUTION as crisis directives)
  const { data: myDirectives = [], isLoading: directivesLoading } = useQuery({
    queryKey: ['crisis-directives', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const res = await fetch('/api/resolution');
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 60 * 1000,
  });

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committee_id: committee?.id,
          title: `Crisis Note (${noteType}) – ${new Date().toLocaleTimeString()}`,
          type: 'OTHER',
          content: noteText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      toast.success(`${noteType === 'PRIVATE' ? 'Private' : 'Public'} crisis note submitted`);
      setNoteText('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Crisis Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Crisis Status</SectionLabel>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${session?.status === 'ADJOURNED' ? 'bg-text-tertiary' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-sm font-semibold text-text-primary">
              {session?.status === 'ADJOURNED' ? 'Adjourned' : 'Crisis Active'}
            </span>
          </div>
        </div>
        {session?.debate_topic && (
          <div className="p-3 bg-bg-raised rounded-card border border-red-500/20">
            <p className="text-xs uppercase tracking-widest text-red-400 mb-1">Current Crisis Scenario</p>
            <p className="text-sm text-text-primary">{session.debate_topic}</p>
          </div>
        )}
      </Card>

      {/* Crisis Updates Feed */}
      <Card>
        <SectionLabel>Crisis Updates</SectionLabel>
        <p className="text-xs text-text-dimmed mb-3">
          Live updates from the Crisis Director. New scenarios and developments will appear here.
        </p>
        {updatesLoading ? (
          <LoadingSpinner className="py-6" />
        ) : crisisUpdates.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border-subtle rounded-card">
            <p className="text-sm text-text-dimmed">No crisis updates yet. Stand by for briefings.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {crisisUpdates.map((update: any) => (
              <div key={update.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-text-primary">{update.title}</p>
                  <span className="text-[10px] text-text-dimmed">
                    {new Date(update.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{update.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Crisis Note Submission */}
      <Card>
        <SectionLabel>Submit Crisis Note</SectionLabel>
        <p className="text-xs text-text-dimmed mb-3">
          Send notes to the Crisis Director. Public notes are visible to the committee; private notes are for the director only.
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setNoteType('PUBLIC')}
            className={`px-3 py-1.5 text-xs font-semibold rounded border ${
              noteType === 'PUBLIC'
                ? 'bg-bg-raised text-text-primary border-border-emphasized'
                : 'text-text-dimmed border-border-subtle'
            }`}
          >
            Public Note
          </button>
          <button
            onClick={() => setNoteType('PRIVATE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded border ${
              noteType === 'PRIVATE'
                ? 'bg-bg-raised text-text-primary border-border-emphasized'
                : 'text-text-dimmed border-border-subtle'
            }`}
          >
            Private Note
          </button>
        </div>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={noteType === 'PRIVATE'
            ? 'Write a private note to the Crisis Director...'
            : 'Write a public crisis note for the committee...'}
          className="min-h-[100px]"
        />
        <button
          onClick={handleSubmitNote}
          disabled={!noteText.trim() || submitting}
          className="mt-3 px-6 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : `Send ${noteType === 'PRIVATE' ? 'Private' : 'Public'} Note`}
        </button>
      </Card>

      {/* My Directives */}
      <Card>
        <SectionLabel>My Directives</SectionLabel>
        {directivesLoading ? (
          <LoadingSpinner className="py-6" />
        ) : myDirectives.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-border-subtle rounded-card">
            <p className="text-sm text-text-dimmed">No directives yet. Use the Resolution Builder tab to draft directives.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-3">
            {myDirectives.map((d: any) => (
              <div key={d.id} className="p-3 border border-border-subtle rounded-card flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary font-medium">{d.title}</p>
                  <p className="text-xs text-text-dimmed">{new Date(d.updated_at).toLocaleString()}</p>
                </div>
                <Badge variant="pending">{d.topic || 'Draft'}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Crisis Procedure Guide */}
      <Card>
        <SectionLabel>Crisis Committee Procedures</SectionLabel>
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Crisis Updates</p>
            <p className="text-xs text-text-secondary">The Crisis Director introduces scenarios. React quickly and decisively.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Crisis Notes</p>
            <p className="text-xs text-text-secondary">Send public or private notes to influence the crisis. Private notes are actions taken in secret.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">Directives</p>
            <p className="text-xs text-text-secondary">Draft and submit directives (similar to resolutions) proposing actions for the committee to take.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">Press Releases</p>
            <p className="text-xs text-text-secondary">Craft public statements on behalf of your portfolio to shape public perception.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
