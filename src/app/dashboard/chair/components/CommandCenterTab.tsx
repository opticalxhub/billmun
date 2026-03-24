'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Input, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'IN_SESSION', label: 'In Session', color: 'bg-text-primary/70' },
  { value: 'MODERATED_CAUCUS', label: 'Moderated Caucus', color: 'bg-text-primary/50' },
  { value: 'UNMODERATED_CAUCUS', label: 'Unmoderated Caucus', color: 'bg-text-primary/40' },
  { value: 'ON_BREAK', label: 'On Break', color: 'bg-text-tertiary/80' },
  { value: 'ADJOURNED', label: 'Adjourned', color: 'bg-text-tertiary' },
];

interface StatusModal {
  open: boolean;
  status: string;
}

export default function CommandCenterTab({ ctx }: { ctx: ChairContext }) {
  const [statusModal, setStatusModal] = useState<StatusModal>({ open: false, status: '' });
  const [modalFields, setModalFields] = useState({ topic: '', speakingTime: 120, duration: 10, purpose: '', break_type: 'SHORT', summary: '' });
  const [saving, setSaving] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', body: '' });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "MEDIUM" });
  const [sharedNote, setSharedNote] = useState("");
  const [lastNoteSaved, setLastNoteSaved] = useState<Date | null>(null);
  const [noteIsLoading, setNoteIsLoading] = useState(true);

  const { data: speakers = [], refetch: refetchSpeakers } = useQuery({
    queryKey: ['chair-speakers', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speakers_list')
        .select('*, delegate:delegate_id(full_name)')
        .eq('committee_id', ctx.committee.id)
        .in('status', ['QUEUED', 'SPEAKING'])
        .order('position', { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  const { data: presentCount = 0, refetch: refetchRollCall } = useQuery({
    queryKey: ['chair-rollcall-count', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data: rc } = await supabase
        .from('roll_call_records')
        .select('id')
        .eq('committee_id', ctx.committee.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      if (!rc) return 0;
      const { count } = await supabase
        .from('roll_call_entries')
        .select('id', { count: 'exact', head: true })
        .eq('roll_call_id', rc.id)
        .neq('status', 'ABSENT');
      return count || 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: adminTasks = [], refetch: refetchAdminTasks } = useQuery({
    queryKey: ['chair-admin-tasks', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const res = await fetch("/api/chair/admin-tasks", { cache: "no-store" });
      const json = await res.json();
      return json?.tasks || [];
    },
    staleTime: 30 * 1000,
  });

  const sessionStatus = ctx.session?.status || 'No Data Available';

  useEffect(() => {
    if (ctx.committee?.id) {
      refetchSpeakers();
      refetchRollCall();
      refetchAdminTasks();
      loadSharedNote();
    }
  }, [ctx.committee?.id, refetchSpeakers, refetchRollCall, refetchAdminTasks]);

  const loadSharedNote = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('admin_chair_notes')
      .select('note_text, updated_at')
      .eq('committee_id', ctx.committee.id)
      .maybeSingle();

    if (data) {
      setSharedNote(data.note_text || "");
      setLastNoteSaved(new Date(data.updated_at));
    }
    setNoteIsLoading(false);
  };

  const saveSharedNote = async (val: string) => {
    if (!ctx.committee?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('admin_chair_notes')
      .upsert({
        committee_id: ctx.committee.id,
        admin_user_id: ctx.committee.admin_id || ctx.user.id, // Fallback if no admin assigned yet
        chair_user_id: ctx.user.id,
        note_text: val,
        updated_at: new Date().toISOString()
      }, { onConflict: 'committee_id' });

    if (!error) {
      setLastNoteSaved(new Date());
    }
    setSaving(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'MODERATED_CAUCUS' || newStatus === 'UNMODERATED_CAUCUS' || newStatus === 'ON_BREAK' || newStatus === 'ADJOURNED') {
      setStatusModal({ open: true, status: newStatus });
      setModalFields({ topic: '', speakingTime: 120, duration: 10, purpose: '', break_type: 'SHORT', summary: '' });
    } else {
      saveStatusChange(newStatus, {});
    }
  };

  const saveStatusChange = async (newStatus: string, details: any) => {
    setSaving(true);
    // Update session
    if (ctx.session?.id) {
      await supabase
        .from('committee_sessions')
        .update({ 
          status: newStatus, 
          debate_topic: details.topic || ctx.session.debate_topic,
          speaking_time_limit: details.speakingTime || ctx.session.speaking_time_limit,
          caucus_type: newStatus.includes('CAUCUS') ? (newStatus.includes('MODERATED') ? 'MODERATED' : 'UNMODERATED') : 'NONE',
          caucus_duration: details.duration || null,
          caucus_purpose: details.purpose || null,
          break_type: details.break_type || null,
          break_duration: details.duration || null,
          session_summary: details.summary || null,
          updated_at: new Date().toISOString(),
          updated_by_id: ctx.user.id
        })
        .eq('id', ctx.session.id);
    }

    // Save status change details
    await supabase.from('session_status_history').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      status: newStatus,
      topic: details.topic || null,
      speaking_time: details.speakingTime || null,
      duration: details.duration || null,
      purpose: details.purpose || null,
      break_type: details.break_type || null,
      summary: details.summary || null,
      created_by: ctx.user.id
    });

    // Log event
    await supabase.from('session_events').insert({
      committee_id: ctx.committee.id,
      session_id: ctx.session?.id,
      event_type: 'STATUS_CHANGE',
      title: `Session status changed to ${STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus.replace(/_/g, ' ')}`,
      description: details.topic || details.purpose || details.summary || (details.break_type ? `${details.break_type} Break` : null),
      metadata: details,
      created_by: ctx.user.id,
    });

    setStatusModal({ open: false, status: '' });
    setSaving(false);
    ctx.refreshData();
  };

  const handleModalSubmit = () => {
    const s = statusModal.status;
    if (s === 'MODERATED_CAUCUS') {
      saveStatusChange(s, { topic: modalFields.topic, speakingTime: modalFields.speakingTime });
    } else if (s === 'UNMODERATED_CAUCUS') {
      saveStatusChange(s, { duration: modalFields.duration, purpose: modalFields.purpose });
    } else if (s === 'ON_BREAK') {
      saveStatusChange(s, { break_type: modalFields.break_type, duration: modalFields.duration });
    } else if (s === 'ADJOURNED') {
      saveStatusChange(s, { summary: modalFields.summary });
    }
  };

  const handleAnnounce = async () => {
    if (!announcement.title || !announcement.body) return;
    setSaving(true);
    try {
      const { data: annData, error: annErr } = await supabase.from('announcements').insert({
        title: announcement.title,
        body: announcement.body,
        author_id: ctx.user.id,
        is_pinned: true,
        target_roles: ['DELEGATE'],
        committee_id: ctx.committee.id,
      }).select().single();

      if (!annErr && annData) {
        // Trigger notification automation
        await fetch('/api/eb/announcements/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'notify_all',
            title: announcement.title,
            message: announcement.body,
            committee_id: ctx.committee.id,
            target_roles: ['DELEGATE']
          })
        });
      }

      // Log event
      await supabase.from('session_events').insert({
        committee_id: ctx.committee.id,
        session_id: ctx.session?.id,
        event_type: 'ANNOUNCEMENT',
        title: announcement.title,
        description: announcement.body,
        created_by: ctx.user.id,
      });
      setAnnouncement({ title: '', body: '' });
      setAnnouncementOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const statusCfg = STATUS_OPTIONS.find(s => s.value === sessionStatus) || STATUS_OPTIONS[4];

  const createAdminTask = async () => {
    if (!taskForm.title.trim()) return;
    await fetch("/api/chair/admin-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
      }),
    });
    setTaskForm({ title: "", description: "", priority: "MEDIUM" });
    refetchAdminTasks();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Committee Header */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h1 className="font-jotia-bold text-3xl text-text-primary">{ctx.committee?.name || 'No Committee Assigned'}</h1>
        <p className="text-text-dimmed mt-1">{ctx.committee?.topic || ''}</p>

        {/* Session Status Badge */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusCfg.color} ${sessionStatus === 'IN_SESSION' || sessionStatus === 'MODERATED_CAUCUS' ? 'animate-pulse' : ''}`} />
            <span className="text-lg font-bold text-text-primary">{statusCfg.label}</span>
          </div>
          <span className="text-text-dimmed text-sm">|</span>
          <span className="text-text-dimmed text-sm">{presentCount} / {ctx.delegates.length} delegates present</span>
        </div>
      </div>

      {/* Session Status Controls */}
      <Card>
        <SectionLabel>Session Control</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={sessionStatus === opt.value}
              className={`px-5 py-3 rounded-button text-sm font-bold uppercase tracking-wider transition-all min-h-[48px] ${
                sessionStatus === opt.value
                  ? 'bg-text-primary text-bg-base shadow-lg scale-105'
                  : 'bg-bg-raised text-text-dimmed hover:text-text-primary hover:bg-bg-hover border border-border-subtle'
              } disabled:opacity-60`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compact Speakers List */}
        <Card>
          <SectionLabel>Speakers Queue</SectionLabel>
          <div className="space-y-2">
            {speakers.length === 0 && <p className="text-text-dimmed text-sm py-4 text-center">No speakers in queue.</p>}
            {speakers.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-card border ${i === 0 && s.status === 'SPEAKING' ? 'bg-bg-card border-border-emphasized' : 'bg-bg-raised border-border-subtle'}`}>
                <span className="text-xs font-bold text-text-tertiary w-6">{i === 0 && s.status === 'SPEAKING' ? '▶' : i + 1}</span>
                <span className="text-sm font-medium text-text-primary">{s.delegate?.full_name || 'Unknown'}</span>
                {i === 0 && s.status === 'SPEAKING' && <span className="ml-auto text-xs font-bold text-text-primary uppercase tracking-widest">Now Speaking</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* Announcements + Tasks */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel className="mb-0">Announcements</SectionLabel>
              <Button size="sm" onClick={() => setAnnouncementOpen(!announcementOpen)}>
                {announcementOpen ? 'Cancel' : 'New Announcement'}
              </Button>
            </div>
            {announcementOpen && (
              <div className="space-y-3 p-4 bg-bg-raised rounded-card border border-border-subtle">
                <Input placeholder="Title" value={announcement.title} onChange={e => setAnnouncement(p => ({ ...p, title: e.target.value }))} />
                <Textarea rows={3} placeholder="Announcement body..." value={announcement.body} onChange={e => setAnnouncement(p => ({ ...p, body: e.target.value }))} />
                <Button onClick={handleAnnounce} loading={saving} className="w-full">Post Announcement</Button>
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>Issue Tasks to Admins</SectionLabel>
            <div className="space-y-2 mb-4">
              <Input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))} />
              <Textarea rows={2} placeholder="Task details" value={taskForm.description} onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))} />
              <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={taskForm.priority} onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <Button onClick={createAdminTask} loading={saving}>Create Task</Button>
            </div>
            <div className="space-y-2">
              {adminTasks.slice(0, 6).map((task: any) => (
                <div key={task.id} className="p-3 bg-bg-raised rounded-card border border-border-subtle">
                  <p className="text-sm font-semibold text-text-primary">{task.title}</p>
                  <p className="text-xs text-text-dimmed">{task.priority} · {task.status}</p>
                </div>
              ))}
            </div>
          </Card>

            <Card className="flex flex-col h-full animate-fade-in group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-text-primary/10 text-text-primary">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </div>
                  <SectionLabel className="mb-0">ADMIN COLLABORATION</SectionLabel>
                </div>
                {lastNoteSaved && (
                  <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">
                    Last sync: {lastNoteSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <Textarea
                className="flex-1 min-h-[120px] text-sm bg-bg-raised/50 border-transparent focus:border-border-emphasized transition-all resize-none font-mono"
                placeholder="Shared notes with Admin..."
                value={sharedNote}
                onChange={(e) => {
                  setSharedNote(e.target.value);
                }}
              />
              <div className="mt-3">
                <Button 
                  size="sm" 
                  className="w-full h-8 text-[10px]" 
                  onClick={() => saveSharedNote(sharedNote)}
                  loading={saving}
                >
                  SAVE & SYNC WITH ADMIN
                </Button>
              </div>
            </Card>
          </div>
        </div>

      {/* Status Change Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setStatusModal({ open: false, status: '' })}>
          <div className="bg-bg-card w-full max-w-lg rounded-card p-6 border border-border-subtle" onClick={e => e.stopPropagation()}>
            <h3 className="font-jotia-bold text-xl text-text-primary mb-4">
              {statusModal.status === 'MODERATED_CAUCUS' && 'Start Moderated Caucus'}
              {statusModal.status === 'UNMODERATED_CAUCUS' && 'Start Unmoderated Caucus'}
              {statusModal.status === 'ON_BREAK' && 'Start Break'}
              {statusModal.status === 'ADJOURNED' && 'Adjourn Session'}
            </h3>
            <div className="space-y-4">
              {statusModal.status === 'MODERATED_CAUCUS' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Debate Topic</label>
                    <Input value={modalFields.topic} onChange={e => setModalFields(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Nuclear non-proliferation" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Speaking Time (seconds)</label>
                    <Input type="number" value={modalFields.speakingTime} onChange={e => setModalFields(p => ({ ...p, speakingTime: Number(e.target.value) }))} />
                  </div>
                </>
              )}
              {statusModal.status === 'UNMODERATED_CAUCUS' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Duration (minutes)</label>
                    <Input type="number" value={modalFields.duration} onChange={e => setModalFields(p => ({ ...p, duration: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Purpose</label>
                    <Input value={modalFields.purpose} onChange={e => setModalFields(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Bloc formation" />
                  </div>
                </>
              )}
              {statusModal.status === 'ON_BREAK' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Break Type</label>
                    <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={modalFields.break_type} onChange={e => setModalFields(p => ({ ...p, break_type: e.target.value }))}>
                      <option value="SHORT">Short Break</option>
                      <option value="LUNCH">Lunch Break</option>
                      <option value="PRAYER">Prayer Break</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Duration (minutes)</label>
                    <Input type="number" value={modalFields.duration} onChange={e => setModalFields(p => ({ ...p, duration: Number(e.target.value) }))} />
                  </div>
                </>
              )}
              {statusModal.status === 'ADJOURNED' && (
                <div>
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Session Summary Note</label>
                  <Textarea rows={3} value={modalFields.summary} onChange={e => setModalFields(p => ({ ...p, summary: e.target.value }))} placeholder="Brief summary of this session..." />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStatusModal({ open: false, status: '' })} className="flex-1">Cancel</Button>
              <Button onClick={handleModalSubmit} loading={saving} className="flex-1">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
    </div>
  );
}
