'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';

export default function ScheduleTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDue, setTaskDue] = useState('');

  // useQuery for Conference Settings (Date)
  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['conference-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_settings').select('conference_date').eq('id', '1').single();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // useQuery for Events
  const { data: events, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['schedule-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schedule_events').select('*').order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Tasks
  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['personal-tasks', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('is_completed', { ascending: true })
        .order('due_at', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  // useQuery for Committee Schedule
  const { data: committeeSchedule } = useQuery({
    queryKey: ['committee-schedule', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_schedules')
        .select('*')
        .eq('committee_id', ctx.committee.id)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const conferenceDate = useMemo(() => 
    settings?.conference_date ? new Date(settings.conference_date) : new Date('2026-03-27T04:00:00Z'),
  [settings]);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!conferenceDate) return;
    const tick = () => {
      const now = Date.now();
      const diff = conferenceDate.getTime() - now;
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [conferenceDate]);

  const addTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskTitle.trim() || !ctx.user?.id) return;
      await supabase.from('personal_tasks').insert({
        user_id: ctx.user.id,
        title: taskTitle.trim(),
        notes: taskNotes.trim() || null,
        due_at: taskDue || null,
      });
    },
    onSuccess: () => {
      setTaskTitle('');
      setTaskNotes('');
      setTaskDue('');
      setAddingTask(false);
      queryClient.invalidateQueries({ queryKey: ['personal-tasks', ctx.user?.id] });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      await supabase.from('personal_tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks', ctx.user?.id] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('personal_tasks').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks', ctx.user?.id] });
    }
  });

  if (settingsLoading || eventsLoading || tasksLoading) {
    return <LoadingSpinner className="py-20" />;
  }
  if (settingsError || eventsError || tasksError) {
    return <QueryErrorState message="Failed to load schedule data." />;
  }

  // Group events by day
  const eventsByDay: Record<string, any[]> = {};
  (events || []).forEach((e: any) => {
    if (!eventsByDay[e.day_label]) eventsByDay[e.day_label] = [];
    eventsByDay[e.day_label].push(e);
  });

  const isOverdue = (task: any) => task.due_at && !task.is_completed && new Date(task.due_at) < new Date();
  const incompleteTasks = (tasks || []).filter(t => !t.is_completed);
  const completedTasks = (tasks || []).filter(t => t.is_completed);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Countdown */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Conference Countdown</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { v: countdown.days, l: 'Days' },
            { v: countdown.hours, l: 'Hours' },
            { v: countdown.minutes, l: 'Min' },
            { v: countdown.seconds, l: 'Sec' },
          ].map(u => (
            <div key={u.l} className="bg-bg-raised rounded-card p-4">
              <p className="text-text-primary font-jotia-bold text-3xl">{String(u.v).padStart(2, '0')}</p>
              <p className="text-text-dimmed font-jotia text-xs uppercase mt-1">{u.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Schedule */}
      <div>
        <h2 className="font-jotia-bold text-xl text-text-primary mb-4">Conference Schedule</h2>
        {Object.keys(eventsByDay).length === 0 ? (
          <div className="bg-bg-card border border-border-subtle rounded-card p-8 text-center">
            <p className="text-text-dimmed font-jotia text-sm">No schedule events published yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByDay).map(([day, dayEvents]) => (
              <div key={day}>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">{day}</h3>
                <div className="space-y-3">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className="bg-bg-card border border-border-subtle rounded-card p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <div className="shrink-0">
                          <p className="font-jotia text-text-primary text-sm font-medium">
                            {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-jotia-bold text-text-primary text-sm">{ev.event_name}</p>
                          {ev.location && <p className="font-jotia text-text-dimmed text-xs">{ev.location}</p>}
                          {ev.description && <p className="font-jotia text-text-dimmed text-xs mt-1">{ev.description}</p>}
                        </div>
                        {ev.applicable_roles && ev.applicable_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 shrink-0">
                            {ev.applicable_roles.map((role: string) => (
                              <span key={role} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-bg-raised text-text-secondary border border-border-subtle">
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Committee Schedule */}
      {ctx.committee?.id && (
        <div>
          <h2 className="font-jotia-bold text-xl text-text-primary mb-4">{ctx.committee.name} Schedule</h2>
          {(committeeSchedule || []).length === 0 ? (
            <div className="bg-bg-card border border-border-subtle rounded-card p-8 text-center">
              <p className="text-text-dimmed font-jotia text-sm">No committee-specific sessions scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(committeeSchedule || []).map(ev => (
                <div key={ev.id} className="bg-bg-card border border-border-emphasized/30 rounded-card p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="shrink-0">
                      <p className="font-jotia text-text-primary text-sm font-medium">
                        {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-jotia-bold text-text-primary text-sm">{ev.event_name}</p>
                      {ev.location && <p className="font-jotia text-text-dimmed text-xs">{ev.location}</p>}
                      {ev.description && <p className="font-jotia text-text-dimmed text-xs mt-1">{ev.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Personal Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-jotia-bold text-xl text-text-primary">Personal Tasks</h2>
          <button onClick={() => setAddingTask(true)} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
            Add Task
          </button>
        </div>

        {addingTask && (
          <div className="bg-bg-card border border-border-subtle rounded-card p-4 mb-4 space-y-3">
            <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" autoFocus />
            <input value={taskNotes} onChange={e => setTaskNotes(e.target.value)} placeholder="Notes (optional)" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
            <input type="datetime-local" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
            <div className="flex gap-2">
              <button
                onClick={() => addTaskMutation.mutate()}
                disabled={addTaskMutation.isPending || !taskTitle.trim()}
                className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50"
              >
                {addTaskMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => setAddingTask(false)} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {incompleteTasks.map(task => (
            <div key={task.id} className={`bg-bg-card border rounded-card p-4 flex items-start gap-3 ${isOverdue(task) ? 'border-status-rejected-border' : 'border-border-subtle'}`}>
              <button
                onClick={() => toggleTaskMutation.mutate(task)}
                disabled={toggleTaskMutation.isPending}
                className="mt-0.5 w-5 h-5 rounded border-2 border-border-strong shrink-0 flex items-center justify-center hover:border-text-primary min-w-[20px] min-h-[20px] disabled:opacity-50"
              />
              <div className="flex-1 min-w-0">
                <p className="font-jotia text-text-primary text-sm">{task.title}</p>
                {task.notes && <p className="font-jotia text-text-tertiary text-xs mt-0.5">{task.notes}</p>}
                {task.due_at && (
                  <p className={`font-jotia text-xs mt-1 ${isOverdue(task) ? 'text-status-rejected-text font-medium' : 'text-text-dimmed'}`}>
                    Due: {new Date(task.due_at).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteTaskMutation.mutate(task.id)}
                disabled={deleteTaskMutation.isPending}
                className="text-text-dimmed hover:text-status-rejected-text text-xs shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
          {completedTasks.map(task => (
            <div key={task.id} className="bg-bg-card border border-border-subtle rounded-card p-4 flex items-start gap-3 opacity-60">
              <button
                onClick={() => toggleTaskMutation.mutate(task)}
                disabled={toggleTaskMutation.isPending}
                className="mt-0.5 w-5 h-5 rounded border-2 border-text-primary bg-text-primary shrink-0 flex items-center justify-center min-w-[20px] min-h-[20px] disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 4" stroke="var(--bg-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-jotia text-text-dimmed text-sm line-through">{task.title}</p>
              </div>
              <button onClick={() => deleteTaskMutation.mutate(task.id)} disabled={deleteTaskMutation.isPending} className="text-text-dimmed hover:text-status-rejected-text text-xs shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">×</button>
            </div>
          ))}
          {(tasks || []).length === 0 && !addingTask && (
            <p className="text-text-dimmed font-jotia text-sm text-center py-8">No tasks yet. Add one to stay organized.</p>
          )}
        </div>
      </div>
    </div>
  );
}
