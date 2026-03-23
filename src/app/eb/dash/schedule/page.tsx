'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Button, Input, Textarea } from '@/components/ui';
import { 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Users, 
  Save, 
  X,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EBSchedulePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    day_label: 'Day 1',
    event_name: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    applicable_roles: [] as string[]
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (!error && data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('schedule_events').insert(formData);
    if (!error) {
      setIsModalOpen(false);
      setFormData({
        day_label: 'Day 1',
        event_name: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        applicable_roles: []
      });
      fetchEvents();
    }
    setSaving(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await supabase.from('schedule_events').delete().eq('id', id);
    if (!error) fetchEvents();
  };

  const roles = ['DELEGATE', 'CHAIR', 'ADMIN', 'SECURITY', 'MEDIA', 'EB'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">Conference Schedule</h1>
          <p className="text-xs text-text-dimmed mt-1">Manage the official timeline for all conference participants.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
          </div>
        ) : events.length === 0 ? (
          <Card className="py-20 text-center">
            <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
            <p className="text-text-dimmed">No schedule events published yet.</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-text-primary/10 text-text-primary text-[10px] font-black uppercase tracking-widest border border-border-emphasized">
                      {event.day_label}
                    </span>
                    <h3 className="font-bold text-lg text-text-primary">{event.event_name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4 text-text-tertiary" />
                      {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 text-text-tertiary" />
                      {event.location || 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Users className="w-4 h-4 text-text-tertiary" />
                      {event.applicable_roles?.length ? event.applicable_roles.join(', ') : 'All Roles'}
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
                  <h2 className="font-jotia text-xl uppercase tracking-tight text-text-primary">Add Schedule Event</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-text-dimmed hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Day Label</label>
                      <Input required value={formData.day_label} onChange={e => setFormData({...formData, day_label: e.target.value})} placeholder="e.g. Day 1" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Event Name</label>
                      <Input required value={formData.event_name} onChange={e => setFormData({...formData, event_name: e.target.value})} placeholder="e.g. Opening Ceremony" />
                    </div>
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
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Main Hall" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Description</label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional event details..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Target Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            const current = formData.applicable_roles;
                            setFormData({
                              ...formData,
                              applicable_roles: current.includes(role) 
                                ? current.filter(r => r !== role) 
                                : [...current, role]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            formData.applicable_roles.includes(role)
                              ? 'bg-text-primary border-text-primary text-bg-base'
                              : 'bg-bg-raised border-border-subtle text-text-dimmed hover:border-border-emphasized'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-tertiary italic">Leave empty for all participants.</p>
                  </div>
                </div>

                <div className="p-6 bg-bg-raised border-t border-border-subtle flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Event
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
