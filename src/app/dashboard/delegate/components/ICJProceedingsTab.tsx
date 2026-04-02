'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { Card, SectionLabel, Badge } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { toast } from 'sonner';

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  WRITTEN_PROCEEDINGS: { label: 'Written Proceedings', color: 'bg-blue-500' },
  ORAL_ARGUMENTS: { label: 'Oral Arguments', color: 'bg-yellow-500' },
  DELIBERATION: { label: 'Deliberation', color: 'bg-purple-500' },
  JUDGMENT: { label: 'Judgment', color: 'bg-green-500' },
  ADJOURNED: { label: 'Adjourned', color: 'bg-text-tertiary' },
};

export default function ICJProceedingsTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [evidenceText, setEvidenceText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const session = ctx.session;
  const committee = ctx.committee;

  const currentPhase = session?.caucus_type || session?.status || 'ADJOURNED';
  const phaseInfo = PHASE_LABELS[currentPhase] || PHASE_LABELS.ADJOURNED;

  const { data: speakers = [], isLoading: speakersLoading } = useQuery({
    queryKey: ['icj-speakers', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/chair/speakers?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['icj-documents', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/documents/list?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 60 * 1000,
  });

  const myDocuments = documents.filter((d: any) => d.user_id === ctx.user?.id);

  const handleSubmitEvidence = async () => {
    if (!evidenceText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committee_id: committee?.id,
          title: `Evidence Submission – ${new Date().toLocaleDateString()}`,
          type: 'OTHER',
          content: evidenceText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      toast.success('Evidence submitted for review');
      setEvidenceText('');
      queryClient.invalidateQueries({ queryKey: ['icj-documents', committee?.id] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Court Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Court Status</SectionLabel>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${phaseInfo.color} ${currentPhase !== 'ADJOURNED' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold text-text-primary">{phaseInfo.label}</span>
          </div>
        </div>
        {session?.debate_topic && (
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs uppercase tracking-widest text-text-tertiary mb-1">Case Topic</p>
            <p className="text-sm text-text-primary">{session.debate_topic}</p>
          </div>
        )}
        {session?.speaking_time_limit > 0 && (
          <p className="text-xs text-text-dimmed mt-2">
            Speaking time limit: <span className="font-semibold">{session.speaking_time_limit}s</span> per advocate
          </p>
        )}
      </Card>

      {/* ICJ Procedure Guide */}
      <Card>
        <SectionLabel>ICJ Procedure</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">1. Written Proceedings</p>
            <p className="text-xs text-text-secondary">Submit memorials, counter-memorials, and evidence to the Court.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">2. Oral Arguments</p>
            <p className="text-xs text-text-secondary">Present your case before the judges. Each side gets equal time.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">3. Deliberation</p>
            <p className="text-xs text-text-secondary">Judges deliberate in closed session to reach their decision.</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-card border border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">4. Judgment</p>
            <p className="text-xs text-text-secondary">The Court delivers its binding judgment on the case.</p>
          </div>
        </div>
      </Card>

      {/* Speakers Queue */}
      <Card>
        <SectionLabel>Oral Arguments Queue</SectionLabel>
        {speakersLoading ? (
          <LoadingSpinner className="py-6" />
        ) : speakers.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No advocates currently in the queue.</p>
        ) : (
          <div className="space-y-2 mt-3">
            {speakers.map((s: any, i: number) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-card border ${
                  s.delegate_id === ctx.user?.id
                    ? 'bg-bg-raised border-border-emphasized'
                    : 'border-border-subtle'
                }`}
              >
                <span className="text-xs font-bold text-text-tertiary w-6">{i + 1}.</span>
                <span className="text-sm text-text-primary flex-1">{s.delegate_name || 'Advocate'}</span>
                <span className="text-xs text-text-dimmed capitalize">{s.status?.toLowerCase()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Evidence Submission */}
      <Card>
        <SectionLabel>Submit Evidence / Memorial</SectionLabel>
        <p className="text-xs text-text-dimmed mb-3">
          Submit written evidence, memorials, or counter-memorials for the Court&apos;s consideration.
        </p>
        <Textarea
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          placeholder="Enter your memorial text, evidence references, or legal arguments..."
          className="min-h-[120px]"
        />
        <button
          onClick={handleSubmitEvidence}
          disabled={!evidenceText.trim() || submitting}
          className="mt-3 px-6 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit to Court'}
        </button>
      </Card>

      {/* My Submissions */}
      <Card>
        <SectionLabel>My Submissions</SectionLabel>
        {docsLoading ? (
          <LoadingSpinner className="py-6" />
        ) : myDocuments.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No submissions yet.</p>
        ) : (
          <div className="space-y-2 mt-3">
            {myDocuments.map((d: any) => (
              <div key={d.id} className="p-3 border border-border-subtle rounded-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-primary font-medium">{d.title}</p>
                  <Badge variant={d.status === 'APPROVED' ? 'approved' : d.status === 'REJECTED' ? 'rejected' : 'pending'}>
                    {d.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-dimmed mt-1">{new Date(d.uploaded_at || d.created_at).toLocaleString()}</p>
                {d.feedback && (
                  <p className="text-xs text-text-secondary mt-2 italic border-l-2 border-border-subtle pl-2">{d.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
