'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Input, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DashboardLoadingState, DashboardHeader } from '@/components/dashboard-shell';
import CommitteeScheduleTab from '../chair/components/CommitteeScheduleTab';
import { supabase } from '@/lib/supabase';
import WhatsAppTab from '@/components/whatsapp-tab';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { formatLabel } from '@/lib/roles';

type AdminTab =
  | 'overview'
  | 'delegate-logistics'
  | 'attendance'
  | 'documents'
  | 'announcements'
  | 'resources'
  | 'session-support'
  | 'communication'
  | 'audit-log'
  | 'committee-schedule'
  | 'whatsapp';

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
  { id: 'committee-schedule', label: 'Committee Schedule' },
  { id: 'whatsapp', label: 'WhatsApp' },
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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Handle search debouncing — 400ms delay so it doesn't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const parentRefDelegates = useRef<HTMLDivElement>(null);
  const parentRefAudit = useRef<HTMLDivElement>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');

  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceMode, setResourceMode] = useState<'url' | 'file'>('url');
  const [resourceBusy, setResourceBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  const [reviewDoc, setReviewDoc] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const [sharedNote, setSharedNote] = useState('');
  const [assignToChairNote, setAssignToChairNote] = useState('');
  const [quickMsgTitle, setQuickMsgTitle] = useState('');
  const [quickMsgBody, setQuickMsgBody] = useState('');

  const [voteForm, setVoteForm] = useState({
    motionType: '',
    outcome: 'PASSED',
    votes_for: 0,
    votes_against: 0,
    abstentions: 0,
  });

  const { data, isLoading, error, isError, isFetching } = useQuery({
    queryKey: ['admin-dashboard', debouncedSearch.trim().length >= 2 ? debouncedSearch.trim() : ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim().length >= 2) {
        params.set('q', debouncedSearch.trim());
      }
      const res = await fetch(`/api/admin/dashboard?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load dashboard data');
      return json;
    },
    staleTime: 60 * 1000,
    refetchInterval: false,
    placeholderData: (prev: unknown) => prev,
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      if (data?.success || data?.ok) {
        toast.success("Action completed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Action failed");
    }
  });

  const delegates = useMemo(() => data?.delegates || [], [data?.delegates]);
  const attendance = useMemo(() => data?.attendance || [], [data?.attendance]);
  const documentsQueue = useMemo(() => data?.documents_queue || [], [data?.documents_queue]);
  const reviewedDocuments = useMemo(() => data?.reviewed_documents || [], [data?.reviewed_documents]);
  const announcements = useMemo(() => data?.announcements || [], [data?.announcements]);
  const resources = useMemo(() => data?.resources || [], [data?.resources]);
  const votes = useMemo(() => data?.votes || [], [data?.votes]);
  const alerts = useMemo(() => data?.alerts || [], [data?.alerts]);

  const filteredDelegates = delegates;

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

  useEffect(() => {
    if (data?.noAssignment || !data?.committee?.id) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      }, 2000);
    };

    const channels = [
      supabase
        .channel('admin-presence')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delegate_presence_statuses',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
      supabase
        .channel('admin-tasks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'committee_admin_tasks',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
      supabase
        .channel('admin-announcements')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'announcements',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
      supabase
        .channel('admin-resources')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'committee_resources',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
      supabase
        .channel('admin-documents')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
      supabase
        .channel('admin-attendance')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `committee_id=eq.${data.committee.id}`,
          },
          debouncedInvalidate,
        )
        .subscribe(),
    ];

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [data?.committee?.id, data?.noAssignment, queryClient]);

  if (isLoading && !data) {
    return <DashboardLoadingState type="overview" />;
  }
  if (isError && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-status-rejected-text font-jotia text-lg">Failed to load admin dashboard.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full p-8 border border-border-subtle rounded-card bg-bg-card space-y-6">
          <div className="w-16 h-16 bg-status-rejected-bg/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-status-rejected-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">Dashboard Error</h2>
            <p className="text-sm text-text-dimmed leading-relaxed">
              {(error as Error).message}
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (data?.noAssignment) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full p-8 border border-border-subtle rounded-card bg-bg-card space-y-6">
          <div className="w-16 h-16 bg-status-warning-bg/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-status-warning-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">No Committee Assigned</h2>
            <p className="text-sm text-text-dimmed leading-relaxed">
              {data.error}
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.location.reload()}
          >
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const postAction = async (payload: any) => {
    return actionMutation.mutateAsync(payload);
  };

  const updateDelegateStatus = async (user_id: string, physical_status: string) => {
    await postAction({ action: 'update_delegate_status', user_id, physical_status });
  };

  const openDelegateHistory = async (delegate: any) => {
    setSelectedDelegate(delegate);
    const json = await postAction({ action: 'get_delegate_status_history', user_id: delegate.user_id });
    setSelectedHistory(json?.history || []);
  };

  const handleAttendanceCorrection = async (record_id: string, status: string) => {
    const reason = window.prompt('Reason for correction (required)');
    if (!reason?.trim()) return;
    await postAction({ action: 'correct_attendance', record_id, status, reason: reason.trim() });
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    try {
      await postAction({
        action: 'create_announcement',
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
      });
      setAnnouncementTitle('');
      setAnnouncementBody('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send announcement');
    }
  };

  const handleSaveVote = async () => {
    if (!voteForm.motionType.trim()) return;
    try {
      await postAction({
        action: 'save_vote_record',
        motion_type: voteForm.motionType.trim(),
        outcome: voteForm.outcome,
        votes_for: Number(voteForm.votes_for),
        votes_against: Number(voteForm.votes_against),
        abstentions: Number(voteForm.abstentions),
        recorded_votes: [],
      });
      setVoteForm({
        motionType: '',
        outcome: 'PASSED',
        votes_for: 0,
        votes_against: 0,
        abstentions: 0,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vote record');
    }
  };

  const handleCreateResource = async () => {
    if (!resourceTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setResourceBusy(true);
    try {
      let finalUrl = resourceUrl.trim();

      if (resourceMode === 'file') {
        if (!selectedFile) {
          toast.error('Please select a file first');
          setResourceBusy(false);
          return;
        }

        const maxMb = 25;
        if (selectedFile.size > maxMb * 1024 * 1024) {
          toast.error(`File must be under ${maxMb}MB.`);
          setResourceBusy(false);
          return;
        }

        const safe = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `committee-resources/${data.committee.id}/${Date.now()}_${safe}`;
        
        const { error: upErr } = await supabase.storage.from('documents').upload(path, selectedFile, {
          contentType: selectedFile.type || 'application/octet-stream',
        });
        if (upErr) throw upErr;
        
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
        finalUrl = pub.publicUrl;
      }

      if (!finalUrl) {
        toast.error('Resource URL or file is required');
        setResourceBusy(false);
        return;
      }

      await postAction({
        action: 'create_resource',
        title: resourceTitle.trim(),
        description: resourceDescription.trim(),
        file_url: finalUrl,
      });

      setResourceTitle('');
      setResourceDescription('');
      setResourceUrl('');
      setSelectedFile(null);
      toast.success('Resource published successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish resource');
    } finally {
      setResourceBusy(false);
    }
  };

  const handleResourceFileSelected = (file: File | undefined) => {
    if (file) {
      setSelectedFile(file);
      if (!resourceTitle) {
        setResourceTitle(file.name.split('.')[0].replace(/_/g, ' '));
      }
    }
  };


  const documentsWaitingOver24h = documentsQueue.filter((doc: any) => {
    const uploaded = new Date(doc.uploaded_at).getTime();
    return Date.now() - uploaded > 24 * 60 * 60 * 1000;
  });

  if (isLoading && !data) return <DashboardLoadingState type="overview" />;

  return (
    <div className="min-h-screen bg-bg-base font-inter">
      <DashboardHeader
        title="Committee Assistant Dashboard"
        subtitle={`Assigned committee: ${data?.committee?.name || 'Unassigned'}${data?.chair?.full_name ? ` · Chair: ${data.chair.full_name}` : ''}`}
        committeeName={data?.committee?.name}
        user={data?.admin}
      />

      <AnnouncementBanner user={data?.admin} committeeId={data?.committee?.id} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <div className="pb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide border border-border-subtle rounded-card bg-bg-card p-1 -mx-3 px-3 sm:mx-0 sm:px-1 sm:flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 h-9 sm:h-10 px-2.5 sm:px-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest transition-colors border rounded-input whitespace-nowrap ${
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

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="hover:border-status-pending-border/50 transition-all cursor-pointer group" onClick={() => setActiveTab('delegate-logistics')}>
              <div className="flex justify-between items-start mb-2">
                <SectionLabel className="mb-0">Open incidents</SectionLabel>
                <div className="p-2 rounded-full bg-status-rejected-bg/10 group-hover:bg-status-rejected-bg/20 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-status-rejected-text animate-pulse" />
                </div>
              </div>
              <p className={`text-3xl font-jotia-bold ${(data?.overview?.open_incidents ?? 0) > 0 ? 'text-status-rejected-text' : 'text-text-primary'}`}>
                {data?.overview?.open_incidents ?? 0}
              </p>
              <p className="text-[11px] text-text-dimmed mt-2 font-medium uppercase tracking-widest">Across Conference</p>
            </Card>

            <Card className="hover:border-border-emphasized transition-all cursor-pointer" onClick={() => setActiveTab('session-support')}>
              <SectionLabel className="mb-2">Pending tasks</SectionLabel>
              <p className="text-3xl font-jotia-bold text-text-primary">{data?.overview?.pending_admin_tasks ?? 0}</p>
              <p className="text-[11px] text-text-dimmed mt-2 font-medium uppercase tracking-widest">In your committee</p>
            </Card>

            <Card className="hover:border-border-emphasized transition-all cursor-pointer" onClick={() => setActiveTab('resources')}>
              <SectionLabel className="mb-2">Resources</SectionLabel>
              <p className="text-3xl font-jotia-bold text-text-primary">{data?.overview?.committee_resources_count ?? 0}</p>
              <p className="text-[11px] text-text-dimmed mt-2 font-medium uppercase tracking-widest">Published for delegates</p>
            </Card>

            <Card className="hover:border-border-emphasized transition-all cursor-pointer" onClick={() => setActiveTab('documents')}>
              <SectionLabel className="mb-2">Doc Queue</SectionLabel>
              <p className="text-3xl font-jotia-bold text-text-primary">{data?.overview?.pending_document_reviews ?? 0}</p>
              <p className="text-[11px] text-text-dimmed mt-2 font-medium uppercase tracking-widest">Waiting for review</p>
            </Card>
          </div>
        )}

      {activeTab === 'delegate-logistics' && (
        <Card>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <SectionLabel className="mb-0">Delegate Logistics</SectionLabel>
              {isFetching && <LoadingSpinner size="sm" />}
            </div>
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
                            disabled={actionMutation.isPending && (actionMutation.variables as any)?.user_id === delegate.user_id}
                            onChange={(e) => updateDelegateStatus(delegate.user_id, e.target.value)}
                            className="h-9 w-full rounded-input border border-border-input bg-bg-raised px-2 text-sm disabled:opacity-50"
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
        <Card className="animate-fade-in shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <SectionLabel className="mb-1">Live Committee Roll Call</SectionLabel>
              <p className="text-[11px] text-text-dimmed font-medium uppercase tracking-widest">Official attendance history from Chairs</p>
            </div>
            {isFetching && <LoadingSpinner size="sm" />}
          </div>
          
          <div className="overflow-x-auto border border-border-subtle rounded-card bg-bg-card">
            <table className="w-full text-left">
              <thead className="bg-bg-raised">
                <tr className="text-[10px] uppercase tracking-widest text-text-tertiary">
                  <th className="py-3 px-4 font-bold border-b border-border-subtle">Session Time</th>
                  <th className="py-3 px-4 font-bold border-b border-border-subtle">Presence</th>
                  <th className="py-3 px-4 font-bold border-b border-border-subtle">Quorum</th>
                  <th className="py-3 px-4 font-bold border-b border-border-subtle">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(data?.roll_call_history || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-text-dimmed text-sm italic">
                      No roll call records found.
                    </td>
                  </tr>
                )}
                {(data?.roll_call_history || []).map((h: any) => {
                  const presentCount = (h.entries || []).filter((e: any) => e.status !== 'ABSENT').length;
                  const totalCount = (h.entries || []).length;
                  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                  return (
                    <tr key={h.id} className="hover:bg-bg-raised/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-mono text-text-primary">
                        {new Date(h.started_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-text-secondary">
                        {presentCount}/{totalCount} Present ({pct}%)
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border ${pct >= 50 ? 'bg-status-approved-bg/10 text-status-approved-text border-status-approved-border/30' : 'bg-status-rejected-bg/10 text-status-rejected-text border-status-rejected-border/30'}`}>
                          {pct >= 50 ? 'Established' : 'Below Threshold'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[10px] text-text-tertiary">
                        {h.completed_at ? 'Completed' : <span className="text-status-warning-text animate-pulse">Active Now</span>}
                      </td>
                    </tr>
                  );
                })}
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
                      <td className="py-3 text-sm">{formatLabel(doc.type)}</td>
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
                              await postAction({ action: 'assign_document_to_chair', document_id: doc.id, note: assignToChairNote || null });
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
                      <td className="py-3 text-sm">{formatLabel(doc.status)}</td>
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
              <Button 
                onClick={handleCreateAnnouncement} 
                loading={actionMutation.isPending}
                disabled={!announcementTitle.trim() || !announcementBody.trim()}
              >
                Send Announcement
              </Button>
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
          <div className="flex gap-2 border border-border-subtle rounded-card p-1 w-fit">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded ${resourceMode === 'url' ? 'bg-bg-raised text-text-primary' : 'text-text-dimmed'}`}
              onClick={() => setResourceMode('url')}
            >
              Add URL
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded ${resourceMode === 'file' ? 'bg-bg-raised text-text-primary' : 'text-text-dimmed'}`}
              onClick={() => setResourceMode('file')}
            >
              Upload file
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Title" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} />
            <Input placeholder="Description (optional)" value={resourceDescription} onChange={(e) => setResourceDescription(e.target.value)} />
          </div>
          {resourceMode === 'url' ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Input
                className="flex-1"
                placeholder="File or resource URL"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
              <Button loading={resourceBusy} onClick={() => void handleCreateResource()}>
                Publish resource
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={resourceFileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,image/*,video/*"
                onChange={(e) => handleResourceFileSelected(e.target.files?.[0])}
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <Button 
                  variant="outline" 
                  onClick={() => resourceFileInputRef.current?.click()}
                  className="flex-1"
                >
                  {selectedFile ? `File: ${selectedFile.name}` : "Choose file"}
                </Button>
                <Button 
                  loading={resourceBusy} 
                  onClick={() => void handleCreateResource()}
                  disabled={!selectedFile}
                >
                  Publish resource
                </Button>
              </div>
              <p className="text-xs text-text-dimmed">Uses the title above or the file name. Stored in the same file_url field as URLs.</p>
            </div>
          )}
          <div className="space-y-2">
            {resources.length === 0 && (
              <div className="text-center py-10 border border-dashed border-border-subtle rounded-card text-sm text-text-dimmed">
                No resources yet. Publish a link or upload a file for your delegates.
              </div>
            )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2 py-0"
                    onClick={async () => {
                      await postAction({ action: 'archive_resource', resource_id: resource.id, archived: !resource.archived });
                    }}
                    loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'archive_resource' && (actionMutation.variables as any)?.resource_id === resource.id}
                  >
                    {resource.archived ? 'Unarchive' : 'Archive'}
                  </Button>
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
            <div className="flex items-center justify-between mb-3">
              <SectionLabel className="mb-0">Operations Action Queue</SectionLabel>
              {isFetching && <LoadingSpinner size="sm" />}
            </div>
            <p className="text-sm text-text-dimmed mb-3">
              Seating chart has been replaced with a live operations queue from chair-issued tasks.
            </p>
            <div className="space-y-2">
              {(data?.admin_tasks || []).length === 0 && (
                <div className="p-8 text-center border border-dashed border-border-subtle rounded-card text-sm text-text-dimmed">
                  No tasks in the queue.
                </div>
              )}
              {(data?.admin_tasks || []).slice(0, 10).map((task: any) => (
                <div key={task.id} className="p-3 border border-border-subtle rounded-card bg-bg-raised flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-semibold truncate">{task.title}</p>
                    <p className="text-xs text-text-dimmed mt-0.5">
                      Priority: <span className={`font-bold ${task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'text-status-rejected-text' : 'text-text-secondary'}`}>{task.priority}</span>
                      {' · '}
                      Status: <span className="capitalize">{formatLabel(task.status)}</span>
                    </p>
                    {task.description && <p className="text-xs text-text-dimmed mt-1 line-clamp-2 italic">{task.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'TODO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] uppercase px-2"
                        onClick={() => void postAction({ action: 'update_admin_task_status', task_id: task.id, status: 'IN_PROGRESS' })}
                        loading={actionMutation.isPending && (actionMutation.variables as any)?.task_id === task.id}
                      >
                        Start
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        className="h-8 text-[10px] uppercase px-2"
                        onClick={() => void postAction({ action: 'update_admin_task_status', task_id: task.id, status: 'COMPLETED' })}
                        loading={actionMutation.isPending && (actionMutation.variables as any)?.task_id === task.id}
                      >
                        Done
                      </Button>
                    )}
                  </div>
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
                value={voteForm.votes_for}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, votes_for: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Against"
                value={voteForm.votes_against}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, votes_against: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Abstentions"
                value={voteForm.abstentions}
                onChange={(e) => setVoteForm((prev: any) => ({ ...prev, abstentions: Number(e.target.value) }))}
              />
            </div>
            <div className="mt-3">
              <Button onClick={handleSaveVote} loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'save_vote_record'}>Save Vote Record</Button>
            </div>
            <div className="mt-4 space-y-2">
              {votes.slice(0, 8).map((vote: any) => (
                <div key={vote.id} className="p-3 border border-border-subtle rounded-card text-sm">
                  {vote.motion_type} · {formatLabel(vote.outcome)} · {vote.votes_for}/{vote.votes_against}/{vote.abstentions}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-6">
          <Card className="space-y-6">
            <SectionLabel>Quick Message to Committee</SectionLabel>
            <p className="text-sm text-text-dimmed">
              Send an instant in-portal notification to all delegates in your committee.
            </p>
            <Input
              placeholder="Message title (e.g. Room Change)"
              value={quickMsgTitle}
              onChange={(e) => setQuickMsgTitle(e.target.value)}
            />
            <Textarea
              className="min-h-[80px] text-sm bg-bg-raised"
              placeholder="Message body..."
              value={quickMsgBody}
              onChange={(e) => setQuickMsgBody(e.target.value)}
            />
            <Button
              disabled={!quickMsgTitle.trim() || !quickMsgBody.trim()}
              loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'quick_message_committee'}
              onClick={() => postAction({ action: 'quick_message_committee', title: quickMsgTitle.trim(), message: quickMsgBody.trim() }).then(() => { setQuickMsgTitle(''); setQuickMsgBody(''); })}
            >
              Send to Committee
            </Button>
          </Card>
          <Card className="space-y-6">
            <SectionLabel>Shared Notes with Chair</SectionLabel>
            <p className="text-sm text-text-dimmed">
              Shared live scratchpad between you and the committee chair.
            </p>
            <Textarea
              className="min-h-[150px] font-mono text-sm bg-bg-raised"
              placeholder="Enter shared notes here..."
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
            />
            <Button onClick={() => postAction({ action: 'update_shared_note', note: sharedNote })} loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'update_shared_note'}>Save Notes</Button>
          </Card>
        </div>
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
                          Actor: {log.actor?.full_name || 'System'} &middot; Target: {log.target_type}
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

      {activeTab === 'committee-schedule' && data?.committee && (
        <CommitteeScheduleTab committee={data.committee} user={data.admin} />
      )}

      {activeTab === 'whatsapp' && (
        <WhatsAppTab />
      )}
      </div>

    {reviewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-bg-card border border-border-subtle rounded-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-jotia text-2xl uppercase tracking-tight">{reviewDoc.title}</h2>
              <button onClick={() => setReviewDoc(null)} className="text-text-dimmed hover:text-text-primary"><X className="w-5 h-5" /></button>
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
                  <option value="REVISION_REQUESTED">Request Revision</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Feedback for delegate" />
                <Input
                  value={assignToChairNote}
                  onChange={(e) => setAssignToChairNote(e.target.value)}
                  placeholder="Optional note for Assign to Chair"
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'review_document'}
                    onClick={async () => {
                      await postAction({
                        action: 'review_document',
                        document_id: reviewDoc.id,
                        status: reviewStatus,
                        feedback: reviewFeedback,
                      });
                      setReviewDoc(null);
                      setReviewFeedback('');
                    }}
                  >
                    Complete Review
                  </Button>
                  <Button variant="outline" onClick={() => setReviewDoc(null)}>Cancel</Button>
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      await postAction({
                        action: 'assign_document_to_chair',
                        document_id: reviewDoc.id,
                        note: assignToChairNote || null,
                      });
                      setReviewDoc(null);
                    }}
                    loading={actionMutation.isPending && (actionMutation.variables as any)?.action === 'assign_document_to_chair' && (actionMutation.variables as any)?.document_id === reviewDoc.id}
                  >
                    Assign to Chair
                  </Button>
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
              <button onClick={() => setSelectedDelegate(null)} className="text-text-dimmed hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {selectedHistory.map((h: any) => (
                <div key={h.id} className="p-3 border border-border-subtle rounded-card">
                  <p className="text-sm text-text-primary">{formatLabel(h.status)}</p>
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