'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Input, Textarea, Modal } from '@/components/ui';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', is_pinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, author:author_id(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('announcements').insert({
        ...newAnnouncement,
        author_id: user?.id
      });
      if (error) throw error;

      // Trigger notification automation
      await fetch('/api/eb/announcements/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify_all',
          title: newAnnouncement.title,
          message: newAnnouncement.body
        })
      });

      setIsModalOpen(false);
      setNewAnnouncement({ title: '', body: '', is_pinned: false });
      fetchAnnouncements();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to delete announcement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-jotia-bold text-3xl text-text-primary mb-2 uppercase tracking-tight">Announcements</h1>
          <p className="text-text-dimmed">Publish updates and broadcast messages to all delegates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3 bg-text-primary text-bg-base font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-lg"
        >
          NEW BROADCAST
        </button>
      </div>

      <div className="grid gap-6">
        {announcements.map((ann) => (
          <Card key={ann.id} className="group border-border-subtle hover:border-text-primary transition-all duration-300 bg-bg-card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={ann.is_pinned ? 'approved' : 'default'} className="text-[9px] px-2 py-0.5">
                    {ann.is_pinned ? 'PINNED' : 'BROADCAST'}
                  </Badge>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-jotia-bold text-2xl text-text-primary mb-3 uppercase tracking-tight">{ann.title}</h3>
                <p className="text-text-secondary leading-relaxed mb-6 max-w-3xl">{ann.body}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                  <span>Posted by {ann.author?.full_name || 'System'}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(ann.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-text-disabled hover:text-status-rejected-text transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </Card>
        ))}
        
        {announcements.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border-subtle rounded-card bg-bg-base/50">
            <p className="text-text-dimmed font-medium">No announcements have been published yet.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-jotia-bold text-2xl text-text-primary uppercase tracking-tight">Create Broadcast</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-text-dimmed hover:text-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Headline</label>
              <Input 
                required
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                placeholder="Important: Resolution Deadline"
                className="bg-bg-raised"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Message Body</label>
              <Textarea 
                required
                rows={5}
                value={newAnnouncement.body}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, body: e.target.value})}
                placeholder="Enter the full announcement details here..."
                className="bg-bg-raised"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-raised rounded-card border border-border-subtle">
              <input 
                type="checkbox" 
                id="pinned"
                checked={newAnnouncement.is_pinned}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, is_pinned: e.target.checked})}
                className="w-4 h-4 rounded border-border-input text-text-primary focus:ring-text-primary"
              />
              <label htmlFor="pinned" className="text-xs font-bold text-text-primary uppercase tracking-widest cursor-pointer">
                Pin to top of dashboard
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-text-primary text-bg-base font-black uppercase tracking-widest text-sm rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {saving ? 'PUBLISHING...' : 'PUBLISH BROADCAST'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}