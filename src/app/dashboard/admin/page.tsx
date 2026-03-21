'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Input, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DashboardLoadingState } from '@/components/dashboard-shell';
import { LoadingSpinner } from '@/components/loading-spinner';

type AdminTab =
  | 'overview'
  | 'delegate-logistics'
  | 'attendance'
  | 'documents'
  | 'announcements'
  | 'resources'
  | 'session-support'
  | 'communication'
  | 'audit-log';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'delegate-logistics', label: 'Delegate Logistics' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'documents', label: 'Documents' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'resources', label: 'Resources' },
  { id: 'session-support', label: 'Session Support' },
  { id: 'communication', label: 'Communication' },
  { id: 'audit-log', label: 'Audit Log' },
];

const PHYSICAL_STATUSES = [
  'Present In Session',
  'Present Unmoderated Caucus',
  'Lavatory Break',
  'Medical Break',
  'Missing',
  'Absent with Reason',
  'Absent without Reason',
];

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const parentRefDelegates = useRef<HTMLDivElement>(null);
  const parentRefAudit = useRef<HTMLDivElement>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');

  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  const [reviewDoc, setReviewDoc] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const [sharedNote, setSharedNote] = useState('');
  const [assignToChairNote, setAssignToChairNote] = useState('');

  const [voteForm, setVoteForm] = useState({
    motionType: '',
    outcome: 'PASSED',
    votesFor: 0,
    votesAgainst: 0,
    abstentions: 0,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load dashboard data');
      return json;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (data?.communication?.shared_note) {
      setSharedNote(data.communication.shared_note);
    }
  }, [data]);

  const actionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/dashboard/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Action failed');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    }
  });

  const delegates = data?.delegates || [];
  const attendance = data?.attendance || [];
  const documentsQueue = data?.documents_queue || [];
  const reviewedDocuments = data?.reviewed_documents || [];
  const announcements = data?.announcements || [];
  const resources = data?.resources || [];
  const votes = data?.votes || [];
  const alerts = data?.alerts || [];

  const filteredDelegates = useMemo(
    () =>
      delegates.filter(
        (d: any) =>
          d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.country?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [delegates, searchTerm],
  );

  const delegatesVirtualizer = useVirtualizer({
    count: filteredDelegates.length,
    getScrollElement: () => parentRefDelegates.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const auditLogs = data?.audit_logs || [];
  const auditVirtualizer = useVirtualizer({
    count: auditLogs.length,
    getScrollElement: () => parentRefAudit.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  if (isLoading && !data) {
    return <LoadingSpinner label="Loading admin dashboard..." className="py-20" />;
  }

  const postAction = async (payload: any) => {
    return actionMutation.mutateAsync(payload);
  };

  const updateDelegateStatus = async (delegateUserId: string, physicalStatus: string) => {
    await postAction({ action: 'update_delegate_status', delegateUserId, physicalStatus });
  };

  const openDelegateHistory = async (delegate: any) => {
    setSelectedDelegate(delegate);
    const json = await postAction({ action: 'get_delegate_status_history', delegateUserId: delegate.user_id });
    setSelectedHistory(json?.history || []);
  };

  const handleAttendanceCorrection = async (recordId: string, status: string) => {
    const reason = window.prompt('Reason for correction (required)');
    if (!reason?.trim()) return;
    await postAction({ action: 'correct_attendance', recordId, status, reason: reason.trim() });
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    await postAction({
      action: 'create_announcement',
      title: announcementTitle.trim(),
      body: announcementBody.trim(),
    });
    setAnnouncementTitle('');
    setAnnouncementBody('');
  };

  const handleCreateResource = async () => {
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    await postAction({
      action: 'create_resource',
      title: resourceTitle.trim(),
      description: resourceDescription.trim(),
      fileUrl: resourceUrl.trim(),
    });
    setResourceTitle('');
    setResourceDescription('');
    setResourceUrl('');
  };

  const handleSaveSharedNote = async () => {
    await postAction({ action: 'save_shared_note', noteText: sharedNote });
  };

  const handleSaveVote = async () => {
    if (!voteForm.motionType.trim()) return;
    await postAction({
      action: 'save_vote_record',
      motionType: voteForm.motionType.trim(),
      outcome: voteForm.outcome,
      votesFor: Number(voteForm.votesFor),
      votesAgainst: Number(voteForm.votesAgainst),
      abstentions: Number(voteForm.abstentions),
      recordedVotes: [],
    });
    setVoteForm({
      motionType: '',
      outcome: 'PASSED',
      votesFor: 0,
      votesAgainst: 0,
      abstentions: 0,
    });
  };

  const documentsWaitingOver24h = documentsQueue.filter((doc: any) => {
    const uploaded = new Date(doc.uploaded_at).getTime();
    return Date.now() - uploaded > 24 * 60 * 60 * 1000;
  });

  if (isLoading) return <DashboardLoadingState label="Loading assistant dashboard..." type="overview" />;
  if (error) return <div className="p-12 text-center text-status-rejected-text">{(error as Error).message}</div>;

  return (
    <div className="space-y-8 font-inter p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-jotia text-4xl mb-2 uppercase tracking-tight">Committee Assistant Dashboard</h1>
        <p className="text-text-dimmed">
          Assigned committee: {data?.committee?.name || 'Unassigned'}{data?.chair?.full_name ? ` · Chair: ${data.chair.full_name}` : ''}
        </p>
      </div>

      <div className="pb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 border border-border-subtle rounded-card bg-bg-card p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-3 text-[10px] font-semibold uppercase tracking-widest transition-colors border rounded-input ${
                activeTab === tab.id
                  ? 'bg-bg-raised text-text-primary border-border-emphasized'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <SectionLabel className="mb-2">Live Session Status</SectionLabel>
            <p className="text-text-primary text-lg">{data?.overview?.session_status || 'Adjourned'}</p>
            <p className="text-sm text-text-dimmed mt-2">Topic: {data?.overview?.current_topic || 'No active topic'}</p>
            <p className="text-sm text-text-dimmed mt-1">
              Present: {data?.overview?.present_count || 0}/{data?.overview?.total_delegates || 0}
            </p>
          </Card>
          <Card>
            <SectionLabel className="mb-2">Pending Tasks</SectionLabel>
            <div className="space-y-2 text-sm">
              <p>Documents awaiting review: {data?.overview?.pending_document_reviews || 0}</p>
              <p>Delegate status alerts: {data?.overview?.delegate_status_alerts || 0}</p>
              <p>Unread committee messages: {data?.overview?.unread_committee_messages || 0}</p>
            </div>
          </Card>
          <Card>
            <SectionLabel className="mb-2">Communication</SectionLabel>
            <div className="space-y-3">
              <a
                href={data?.communication?.chair_user_id ? `/dashboard/chair` : '/dashboard'}
                className="inline-block text-sm text-text-primary underline-offset-4 hover:underline"
              >
                Open Chair Dashboard
              </a>
              <a
                href="/dashboard/security"
                className="inline-block text-sm text-text-primary underline-offset-4 hover:underline"
              >
                Open Security Dashboard
              </a>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'delegate-logistics' && (
        <Card>
          <div className="flex justify-between items-center mb-6 gap-4">
            <SectionLabel className="mb-0">Delegate Logistics</SectionLabel>
            <div className="w-80">
              <Input placeholder="Search name or country" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(data?.status_summary || {}).map(([statusLabel, count]) => (
              <span key={statusLabel} className="text-xs px-2 py-1 border border-border-subtle rounded-pill text-text-secondary">
                {statusLabel}: {String(count)}
              </span>
            ))}
          </div>
          {alerts.length > 0 && (
            <div className="mb-4 p-3 border border-border-strong rounded-card text-sm text-text-primary">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}: delegate on Lavatory Break or Missing for over 15 minutes.
            </div>
          )}
          <div className="hidden md:block">
            <div ref={parentRefDelegates} className="h-[600px] overflow-auto relative border border-border-subtle rounded-card">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-border-subtle bg-bg-card sticky top-0 z-10">
                  <tr className="text-[11px] uppercase tracking-widest text-text-tertiary">
                    <th className="py-3 px-4">Delegate</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Last Changed</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody style={{ height: `${delegatesVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {delegatesVirtualizer.getVirtualItems().map((virtualItem) => {
                    const delegate = filteredDelegates[virtualItem.index];
                    return (
                      <tr
                        key={delegate.user_id}
                        className="border-b border-border-subtle absolute left-0 w-full hover:bg-bg-raised/50 transition-colors"
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <td className="py-3 px-4">
                          <button onClick={() => openDelegateHistory(delegate)} className="text-text-primary hover:underline">
                            {delegate.full_name}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{delegate.country || '-'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={delegate.physical_status}
                            onChange={(e) => updateDelegateStatus(delegate.user_id, e.target.value)}
                            className="h-9 w-full rounded-input border border-border-input bg-bg-raised px-2 text-sm"
                          >
                            {PHYSICAL_STATUSES.map((statusLabel) => (
                              <option key={statusLabel} value={statusLabel}>
                                {statusLabel}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm text-text-dimmed">
                          {delegate.status_changed_at ? new Date(delegate.status_changed_at).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-dimmed">
                          {alerts.some((a: any) => a.user_id === delegate.user_id) ? 'Alert active' : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filteredDelegates.map((delegate: any) => (
              <div key={delegate.user_id} className="p-4 border border-border-subtle rounded-card bg-bg-raised">
                <div className="flex justify-between items-start mb-2">
                  <button onClick={() => openDelegateHistory(delegate)} className="text-text-primary text-sm font-medium hover:underline">
                    {delegate.full_name}
                  </button>
                  <span className="text-xs text-text-dimmed">{delegate.country || '-'}</span>
                </div>
                <select
                  value={delegate.physical_status}
                  onChange={(e) => updateDelegateStatus(delegate.user_id, e.target.value)}
                  className="h-10 w-full rounded-input border border-border-input bg-bg-card px-3 text-sm"
                >
                  {PHYSICAL_STATUSES.map((statusLabel) => (
                    <option key={statusLabel} value={statusLabel}>
                      {statusLabel}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <SectionLabel>Attendance</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle">
                <tr className="text-[11px] uppercase tracking-widest text-text-tertiary">
                  <th className="py-3">Delegate</th>
                  <th className="py-3">Session Start</th>
                  <th className="py-3">Session End</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Correct</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((row: any) => (
                  <tr key={row.id} className="border-b border-border-subtle">
                    <td className="py-3 text-sm text-text-primary">{delegates.find((d: any) => d.user_id === row.user_id)?.full_name || row.user_id}</td>
                    <td className="py-3 text-sm text-text-secondary">{new Date(row.session_start).toLocaleString()}</td>
                    <td className="py-3 text-sm text-text-secondary">{row.session_end ? new Date(row.session_end).toLocaleString() : '-'}</td>
                    <td className="py-3 text-sm">{row.status}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {['PRESENT', 'LATE', 'ABSENT'].map((s) => (
                          <button
                            key={s}
                            className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border-subtle rounded"
                            onClick={() => handleAttendanceCorrection(row.id, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card>
            <SectionLabel>Documents Queue</SectionLabel>
            {documentsWaitingOver24h.length > 0 && (
              <div className="mb-4 p-3 border border-border-strong rounded-card text-sm text-text-primary">
                {documentsWaitingOver24h.length} document(s) waiting over 24 hours.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border-subtle">
                  <tr className="text-[11px] uppercase tracking-widest text-text-tertiary">
                    <th className="py-3">Delegate</th>
                    <th className="py-3">Title</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Submitted</th>
                    <th className="py-3">Hours Waiting</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documentsQueue.map((doc: any) => (
                    <tr key={doc.id} className="border-b border-border-subtle">
                      <td className="py-3 text-sm">{doc.users?.full_name || '-'}</td>
                      <td className="py-3 text-sm">{doc.title}</td>
                      <td className="py-3 text-sm">{doc.type}</td>
                      <td className="py-3 text-sm text-text-dimmed">{new Date(doc.uploaded_at).toLocaleString()}</td>
                      <td className="py-3 text-sm text-text-dimmed">{Math.max(0, Math.floor((Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60)))}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="text-[10px] px-2 py-1 border border-border-subtle rounded" onClick={() => setReviewDoc(doc)}>
                            Open for Review
                          </button>
                          <button
                            className="text-[10px] px-2 py-1 border border-border-subtle rounded"
                            onClick={async () => {
                              await postAction({ action: 'assign_document_to_chair', documentId: doc.id, note: assignToChairNote || null });
                            }}
                          >
                            Assign to Chair
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SectionLabel>Reviewed Documents</SectionLabel>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border-subtle">
                  <tr className="text-[11px] uppercase tracking-widest text-text-tertiary">
                    <th className="py-3">Delegate</th>
                    <th className="py-3">Title</th>
                    <th className="py-3">Outcome</th>
                    <th className="py-3">Reviewed At</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedDocuments.map((doc: any) => (
                    <tr key={doc.id} className="border-b border-border-subtle">
                      <td className="py-3 text-sm">{doc.users?.full_name || '-'}</td>
                      <td className="py-3 text-sm">{doc.title}</td>
                      <td className="py-3 text-sm">{doc.status}</td>
                      <td className="py-3 text-sm text-text-dimmed">{doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'announcements' && (
        <Card className="space-y-6">
          <SectionLabel>Committee Announcements</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Title</p>
              <Input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Body</p>
              <Textarea value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} />
            </div>
            <div>
              <Button onClick={handleCreateAnnouncement}>Send</Button>
            </div>
          </div>
          <div className="space-y-2">
            {announcements.map((a: any) => (
              <div key={a.id} className="p-3 border border-border-subtle rounded-card">
                <p className="text-sm text-text-primary">{a.title}</p>
                <p className="text-sm text-text-secondary mt-1">{a.body}</p>
                <p className="text-xs text-text-dimmed mt-2">{new Date(a.created_at).toLocaleString()} · Read count: {a.read_count ?? 0}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'resources' && (
        <Card className="space-y-6">
          <SectionLabel>Committee Resources</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Title" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} />
            <Input placeholder="Description" value={resourceDescription} onChange={(e) => setResourceDescription(e.target.value)} />
            <Input placeholder="File URL" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} />
          </div>
          <Button onClick={handleCreateResource}>Publish Resource</Button>
          <div className="space-y-2">
            {resources.map((resource: any) => (
              <div key={resource.id} className="p-3 border border-border-subtle rounded-card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">{resource.title}</p>
                  <p className="text-xs text-text-dimmed truncate">{resource.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a className="text-xs underline" href={resource.file_url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <button
                    className="text-xs px-2 py-1 border border-border-subtle rounded"
                    onClick={async () => {
                      await postAction({ action: 'archive_resource', resourceId: resource.id, archived: !resource.archived });
                    }}
                  >
                    {resource.archived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'session-support' && (
        <div className="space-y-6">
          <Card>
            <SectionLabel>Delegate Lookup</SectionLabel>
            <Input
              placeholder="Type delegate name or country"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="mt-4 space-y-2">
              {filteredDelegates.slice(0, 8).map((d: any) => (
                <div key={d.user_id} className="p-3 border border-border-subtle rounded-card">
                  <p className="text-sm text-text-primary">{d.full_name} · {d.country || '-'}</p>
                  <p className="text-xs text-text-dimmed mt-1">Status: {d.physical_status} · Contact: {d.phone_number || d.email || '-'}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Operations Action Queue</SectionLabel>
            <p className="text-sm text-text-dimmed mb-3">
              Seating chart has been replaced with a live operations queue from chair-issued tasks.
            </p>
            <div className="space-y-2">
              {(data?.admin_tasks || []).slice(0, 6).map((task: any) => (
                <div key={task.id} className="p-3 border border-border-subtle rounded-card bg-bg-raised">
                  <p className="text-sm text-text-primary font-semibold">{task.title}</p>
                  <p className="text-xs text-text-dimmed">{task.priority} · {task.status}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Voting Record</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                placeholder="Motion type"
                value={voteForm.motionType}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, motionType: e.target.value }))}
              />
              <select
                value={voteForm.outcome}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, outcome: e.target.value }))}
                className="h-10 rounded-input border border-border-input bg-bg-raised px-3 text-sm"
              >
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
              <Input
                type="number"
                placeholder="For"
                value={voteForm.votesFor}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, votesFor: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Against"
                value={voteForm.votesAgainst}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, votesAgainst: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Abstentions"
                value={voteForm.abstentions}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, abstentions: Number(e.target.value) }))}
              />
            </div>
            <div className="mt-3">
              <Button onClick={handleSaveVote}>Save Vote Record</Button>
            </div>
            <div className="mt-4 space-y-2">
              {votes.slice(0, 8).map((vote: any) => (
                <div key={vote.id} className="p-3 border border-border-subtle rounded-card text-sm">
                  {vote.motion_type} · {vote.outcome} · {vote.votes_for}/{vote.votes_against}/{vote.abstentions}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Chair-Issued Admin Tasks</SectionLabel>
            <div className="space-y-2">
              {(data?.admin_tasks || []).length === 0 && (
                <p className="text-sm text-text-dimmed">No tasks from chair yet.</p>
              )}
              {(data?.admin_tasks || []).map((task: any) => (
                <div key={task.id} className="p-3 border border-border-subtle rounded-card bg-bg-raised">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-text-primary font-semibold">{task.title}</p>
                      <p className="text-xs text-text-dimmed">{task.priority} · {task.status}</p>
                    </div>
                    <select
                      className="h-9 rounded-input border border-border-input bg-bg-card px-2 text-xs"
                      value={task.status}
                      onChange={(e) => postAction({ action: 'update_admin_task_status', taskId: task.id, status: e.target.value })}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  {task.description ? <p className="text-xs text-text-secondary mt-2">{task.description}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'communication' && (
        <Card className="space-y-6">
          <SectionLabel>Communication</SectionLabel>
          <div className="flex flex-wrap gap-3">
            <a className="h-10 px-4 border border-border-subtle rounded-input text-xs uppercase tracking-widest inline-flex items-center" href="/dashboard/chair">
              Chair Workspace
            </a>
            <a className="h-10 px-4 border border-border-subtle rounded-input text-xs uppercase tracking-widest inline-flex items-center" href="/dashboard/security">
              Security Workspace
            </a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Private admin-chair notes</p>
            <Textarea value={sharedNote} onChange={(e) => setSharedNote(e.target.value)} />
            <div className="mt-3">
              <Button onClick={handleSaveSharedNote}>Save Note</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'audit-log' && (
        <Card className="p-0 overflow-hidden">
          <div ref={parentRefAudit} className="h-[600px] overflow-auto scrollbar-hide relative">
            {auditLogs.length === 0 && <p className="text-sm text-text-dimmed p-8 text-center font-jotia">No activity logs found for this committee.</p>}
            <div
              style={{
                height: `${auditVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {auditVirtualizer.getVirtualItems().map((virtualItem) => {
                const log = auditLogs[virtualItem.index];
                return (
                  <div
                    key={log.id}
                    data-index={virtualItem.index}
                    ref={auditVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full p-4 border-b border-border-subtle hover:bg-bg-raised/50 transition-colors"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{log.action}</p>
                        <p className="text-xs text-text-dimmed mt-1">
                          Actor: {log.actor?.full_name || 'System'} • Target: {log.target_type}
                        </p>
                      </div>
                      <span className="text-[10px] text-text-tertiary font-mono">
                        {new Date(log.performed_at).toLocaleString()}
                      </span>
                    </div>
                    {log.metadata && (
                      <div className="mt-2 p-2 bg-bg-base/50 rounded text-[10px] font-mono overflow-x-auto">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {reviewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-bg-card border border-border-subtle rounded-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-jotia text-2xl uppercase tracking-tight">{reviewDoc.title}</h2>
              <button onClick={() => setReviewDoc(null)} className="text-text-dimmed hover:text-text-primary">Close</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-80 border border-border-subtle rounded-card overflow-hidden bg-bg-raised">
                {reviewDoc.file_url ? (
                  <iframe src={reviewDoc.file_url} className="w-full h-full border-0" />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-text-dimmed">No preview URL</div>
                )}
              </div>
              <div className="space-y-4">
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="h-10 w-full rounded-input border border-border-input bg-bg-raised px-3 text-sm"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="NEEDS_REVISION">Request Revision</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Feedback for delegate" />
                <Input
                  value={assignToChairNote}
                  onChange={(e) => setAssignToChairNote(e.target.value)}
                  placeholder="Optional note for Assign to Chair"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await postAction({
                        action: 'review_document',
                        documentId: reviewDoc.id,
                        status: reviewStatus,
                        feedback: reviewFeedback,
                      });
                      setReviewDoc(null);
                      setReviewFeedback('');
                    }}
                  >
                    Submit Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await postAction({
                        action: 'assign_document_to_chair',
                        documentId: reviewDoc.id,
                        note: assignToChairNote || null,
                      });
                    }}
                  >
                    Assign to Chair
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDelegate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-bg-card border border-border-subtle rounded-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-jotia text-2xl uppercase tracking-tight">{selectedDelegate.full_name} · Status History</h2>
              <button onClick={() => setSelectedDelegate(null)} className="text-text-dimmed hover:text-text-primary">Close</button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {selectedHistory.map((h: any) => (
                <div key={h.id} className="p-3 border border-border-subtle rounded-card">
                  <p className="text-sm text-text-primary">{h.status}</p>
                  <p className="text-xs text-text-dimmed mt-1">{new Date(h.changed_at).toLocaleString()}</p>
                  {h.note ? <p className="text-xs text-text-secondary mt-1">{h.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}