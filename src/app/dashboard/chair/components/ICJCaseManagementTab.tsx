'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChairContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card, SectionLabel, Badge } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { toast } from 'sonner';

const ICJ_PHASES = [
  { value: 'WRITTEN_PROCEEDINGS', label: 'Written Proceedings' },
  { value: 'ORAL_ARGUMENTS', label: 'Oral Arguments' },
  { value: 'DELIBERATION', label: 'Deliberation' },
  { value: 'JUDGMENT', label: 'Judgment' },
] as const;

export default function ICJCaseManagementTab({ ctx }: { ctx: ChairContext }) {
  const queryClient = useQueryClient();
  const [judgmentText, setJudgmentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const committee = ctx.committee;
  const session = ctx.session;

  // Fetch submitted documents (memorials, evidence)
  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['icj-submissions', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const res = await fetch(`/api/documents/list?committeeId=${committee.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  const pendingSubmissions = submissions.filter((s: any) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW');
  const reviewedSubmissions = submissions.filter((s: any) => s.status === 'APPROVED' || s.status === 'REJECTED');

  const handleReviewSubmission = async (docId: string, status: string, feedback: string) => {
    try {
      const res = await fetch('/api/documents/apply-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, status, feedback }),
      });
      if (!res.ok) throw new Error('Review failed');
      toast.success(`Submission ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['icj-submissions', committee?.id] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to review submission');
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Overview */}
      <Card>
        <SectionLabel>ICJ Case Management</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {ICJ_PHASES.map((phase) => {
            const isActive = session?.caucus_type === phase.value || session?.status === phase.value;
            return (
              <div
                key={phase.value}
                className={`p-3 rounded-card border text-center ${
                  isActive
                    ? 'bg-bg-raised border-border-emphasized'
                    : 'border-border-subtle opacity-60'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-text-tertiary'}`} />
                <p className="text-xs font-bold uppercase tracking-widest text-text-primary">{phase.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pending Submissions */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Pending Submissions</SectionLabel>
          <Badge variant="pending">{pendingSubmissions.length} pending</Badge>
        </div>
        {subsLoading ? (
          <LoadingSpinner className="py-6" />
        ) : pendingSubmissions.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No pending submissions.</p>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map((doc: any) => (
              <SubmissionReviewCard
                key={doc.id}
                doc={doc}
                onReview={handleReviewSubmission}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Reviewed Submissions */}
      <Card>
        <SectionLabel>Reviewed Submissions</SectionLabel>
        {reviewedSubmissions.length === 0 ? (
          <p className="text-sm text-text-dimmed py-4">No reviewed submissions yet.</p>
        ) : (
          <div className="space-y-2 mt-3">
            {reviewedSubmissions.map((doc: any) => (
              <div key={doc.id} className="p-3 border border-border-subtle rounded-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-primary">{doc.title}</p>
                  <Badge variant={doc.status === 'APPROVED' ? 'approved' : 'rejected'}>
                    {doc.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-dimmed mt-1">
                  By {doc.users?.full_name || 'Unknown'} · {new Date(doc.uploaded_at || doc.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Court Procedure Reference */}
      <Card>
        <SectionLabel>ICJ Chair Reference</SectionLabel>
        <div className="space-y-2 mt-3 text-xs text-text-secondary">
          <p><strong>Written Proceedings:</strong> Accept memorials and counter-memorials from both sides. Set deadlines for submissions.</p>
          <p><strong>Oral Arguments:</strong> Manage speaking order for applicant and respondent advocates. Set equal time limits.</p>
          <p><strong>Deliberation:</strong> Judges deliberate in closed session. No new submissions accepted.</p>
          <p><strong>Judgment:</strong> Deliver the Court&apos;s binding judgment. Announce the ruling and reasoning.</p>
        </div>
      </Card>
    </div>
  );
}

function SubmissionReviewCard({ doc, onReview }: { doc: any; onReview: (id: string, status: string, feedback: string) => void }) {
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 border border-border-subtle rounded-card bg-bg-raised">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{doc.title}</p>
          <p className="text-xs text-text-dimmed">
            By {doc.users?.full_name || 'Unknown'} · {new Date(doc.uploaded_at || doc.created_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-text-secondary underline"
        >
          {expanded ? 'Collapse' : 'Review'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 space-y-3">
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">
              View Document
            </a>
          )}
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback for the advocate..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onReview(doc.id, 'APPROVED', feedback)}
              className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded hover:opacity-90"
            >
              Accept
            </button>
            <button
              onClick={() => onReview(doc.id, 'REJECTED', feedback)}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded hover:opacity-90"
            >
              Reject
            </button>
            <button
              onClick={() => onReview(doc.id, 'REVISION_REQUESTED', feedback)}
              className="px-4 py-1.5 text-xs font-semibold border border-border-subtle rounded hover:bg-bg-hover"
            >
              Request Revision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
