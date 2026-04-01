'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, SectionLabel, Input } from '@/components/ui';
import { Button } from '@/components/button';
import { DashboardLoadingState } from '@/components/dashboard-shell';
import { toast } from 'sonner';
import { Mail, Clock, CheckCircle, Archive, X, MessageSquare } from 'lucide-react';

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'PENDING' | 'READ' | 'REPLIED' | 'ARCHIVED';
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'New', color: 'text-status-warning-text bg-status-warning-bg/10 border-status-warning-border/20', icon: <Clock className="w-3 h-3" /> },
  READ: { label: 'Read', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Mail className="w-3 h-3" /> },
  REPLIED: { label: 'Replied', color: 'text-status-approved-text bg-status-approved-bg/10 border-status-approved-border/20', icon: <CheckCircle className="w-3 h-3" /> },
  ARCHIVED: { label: 'Archived', color: 'text-text-dimmed bg-bg-raised border-border-subtle', icon: <Archive className="w-3 h-3" /> },
};

export default function EBContactPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['eb-contact-submissions'],
    queryFn: async () => {
      const res = await fetch('/api/eb/contact-submissions');
      if (!res.ok) throw new Error('Failed to fetch contact submissions');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/eb/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eb-contact-submissions'] });
      toast.success('Status updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update');
    },
  });

  const submissions: ContactSubmission[] = data?.submissions || [];

  const filtered = submissions.filter((s) => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.subject || '').toLowerCase().includes(q) ||
        s.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  if (isLoading) return <DashboardLoadingState type="overview" />;
  if (isError) return <div className="text-center py-10 text-status-rejected-text">Failed to load contact submissions.</div>;

  const handleOpenSubmission = (sub: ContactSubmission) => {
    setSelectedSubmission(sub);
    if (sub.status === 'PENDING') {
      updateMutation.mutate({ id: sub.id, status: 'READ' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">Contact Submissions</h2>
          <p className="text-sm text-text-dimmed mt-1">
            {submissions.length} total · {pendingCount > 0 ? <span className="text-status-warning-text font-semibold">{pendingCount} new</span> : 'No new messages'}
          </p>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-input border border-border-input bg-bg-raised px-3 text-sm min-w-[140px]"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">New</option>
            <option value="READ">Read</option>
            <option value="REPLIED">Replied</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-subtle rounded-card">
            <MessageSquare className="w-8 h-8 text-text-dimmed mx-auto mb-3" />
            <p className="text-sm text-text-dimmed">No contact submissions found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((sub) => {
              const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleOpenSubmission(sub)}
                  className={`w-full text-left p-4 border rounded-card transition-all hover:bg-bg-raised/50 ${
                    sub.status === 'PENDING' ? 'border-status-warning-border/30 bg-status-warning-bg/5' : 'border-border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-text-primary truncate">{sub.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded-full ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-dimmed truncate">{sub.email}</p>
                      {sub.subject && <p className="text-sm text-text-secondary mt-1 font-medium">{sub.subject}</p>}
                      <p className="text-xs text-text-dimmed mt-1 line-clamp-2">{sub.message}</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-mono shrink-0 mt-0.5">
                      {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
          <div className="w-full max-w-2xl bg-bg-card border border-border-subtle rounded-card p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">{selectedSubmission.name}</h2>
                <a href={`mailto:${selectedSubmission.email}`} className="text-sm text-blue-400 hover:underline">{selectedSubmission.email}</a>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-text-dimmed hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSubmission.subject && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest text-text-tertiary mb-1">Subject</p>
                <p className="text-sm text-text-primary font-medium">{selectedSubmission.subject}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-text-tertiary mb-1">Message</p>
              <div className="p-4 bg-bg-raised border border-border-subtle rounded-card text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {selectedSubmission.message}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-text-tertiary mb-1">Received</p>
              <p className="text-sm text-text-dimmed">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border-subtle">
              <a
                href={`mailto:${selectedSubmission.email}?subject=Re: ${encodeURIComponent(selectedSubmission.subject || 'Your BILLMUN inquiry')}`}
                className="inline-flex items-center gap-2 px-4 h-10 text-xs font-bold uppercase tracking-widest bg-text-primary text-bg-base rounded-button hover:opacity-90 transition-opacity"
                onClick={() => updateMutation.mutate({ id: selectedSubmission.id, status: 'REPLIED' })}
              >
                <Mail className="w-3.5 h-3.5" />
                Reply via Email
              </a>
              {selectedSubmission.status !== 'ARCHIVED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateMutation.mutate({ id: selectedSubmission.id, status: 'ARCHIVED' });
                    setSelectedSubmission(null);
                  }}
                  loading={updateMutation.isPending}
                >
                  <Archive className="w-3.5 h-3.5 mr-1" />
                  Archive
                </Button>
              )}
              {selectedSubmission.status === 'ARCHIVED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateMutation.mutate({ id: selectedSubmission.id, status: 'READ' });
                    setSelectedSubmission(null);
                  }}
                  loading={updateMutation.isPending}
                >
                  Unarchive
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
