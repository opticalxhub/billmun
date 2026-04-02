'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Save, 
  X,
  Calendar,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommitteeScheduleTabProps {
  committee: { id: string; name: string };
  user: { id: string };
}

export default function CommitteeScheduleTab({ committee, user }: CommitteeScheduleTabProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [defaultEvents, setDefaultEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'session' | 'break'>('session');

  // Form state
  const [formData, setFormData] = useState({
    event_name: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    committee_id: committee?.id,
    event_type: 'session'
  });

  const fetchEvents = async () => {
    if (!committee?.id) return;
    setLoading(true);
    
    // Fetch committee-specific events (chair-added)
    const { data: committeeData, error: committeeError } = await supabase
      .from('committee_schedules')
      .select('*')
      .eq('committee_id', committee.id)
      .order('start_time', { ascending: true });
    
    // Fetch default conference events
    const { data: defaultData, error: defaultError } = await supabase
      .from('schedule_events')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (!committeeError && committeeData) setEvents(committeeData);
    if (!defaultError && defaultData) setDefaultEvents(defaultData);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [committee?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committee?.id) return;
    setSaving(true);
    const { error } = await supabase.from('committee_schedules').insert({
      ...formData,
      committee_id: committee.id,
      event_type: sessionType
    });
    if (!error) {
      setIsModalOpen(false);
      setFormData({
        event_name: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        committee_id: committee.id,
        event_type: 'session'
      });
      setSessionType('session');
      fetchEvents();
    }
    setSaving(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await supabase.from('committee_schedules').delete().eq('id', id);
    if (!error) fetchEvents();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-jotia-bold text-2xl text-text-primary">Committee Schedule</h2>
          <p className="text-text-dimmed text-sm">Default conference events plus committee-specific sessions and breaks for {committee?.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setSessionType('session'); setIsModalOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
          <Button onClick={() => { setSessionType('break'); setIsModalOpen(true); }} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Break
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Default Conference Events */}
        <div>
          <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Default Conference Schedule</h3>
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
              </div>
            ) : defaultEvents.length === 0 ? (
              <Card className="py-20 text-center">
                <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
                <p className="text-text-dimmed">No conference events published yet.</p>
              </Card>
            ) : (
              defaultEvents.map((event) => (
                <Card key={event.id} className="p-6 border-border-subtle/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-text-primary/10 text-text-primary text-[10px] font-black uppercase tracking-widest border border-border-emphasized">
                          {event.day_label}
                        </span>
                        <h3 className="font-bold text-lg text-text-primary">{event.event_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Clock className="w-4 h-4 text-text-tertiary" />
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <MapPin className="w-4 h-4 text-text-tertiary" />
                          {event.location || 'TBD'}
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-text-dimmed leading-relaxed">{event.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Committee-Specific Sessions/Breaks */}
        <div>
          <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Committee Sessions & Breaks</h3>
          <div className="grid grid-cols-1 gap-4">
            {events.length === 0 ? (
              <Card className="py-20 text-center">
                <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
                <p className="text-text-dimmed">No committee-specific sessions or breaks scheduled yet.</p>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="p-6 border-border-emphasized/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-bg-raised text-text-primary text-[10px] font-black uppercase tracking-widest border border-border-emphasized">
                          {event.event_type === 'break' ? 'BREAK' : 'SESSION'}
                        </span>
                        <h3 className="font-bold text-lg text-text-primary">{event.event_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Clock className="w-4 h-4 text-text-tertiary" />
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <MapPin className="w-4 h-4 text-text-tertiary" />
                          {event.location || 'Committee Room'}
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-text-dimmed leading-relaxed">{event.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 text-text-dimmed hover:text-status-rejected-text transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border-emphasized rounded-card shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit}>
                <div className="p-6 border-b border-border-subtle bg-bg-raised flex items-center justify-between">
                  <h2 className="font-jotia text-xl uppercase tracking-tight text-text-primary">
                    Add {sessionType === 'break' ? 'Break' : 'Session'}
                  </h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-text-dimmed hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">
                      {sessionType === 'break' ? 'Break Name' : 'Session Name'}
                    </label>
                    <Input required value={formData.event_name} onChange={e => setFormData({...formData, event_name: e.target.value})} placeholder={sessionType === 'break' ? 'e.g. Coffee Break' : 'e.g. Session 1: GSL'} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Start Time</label>
                      <Input required type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">End Time</label>
                      <Input required type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Location</label>
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Committee Room 4" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Description</label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details..." />
                  </div>
                </div>

                <div className="p-6 bg-bg-raised border-t border-border-subtle flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save {sessionType === 'break' ? 'Break' : 'Session'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
