'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, SectionLabel, Input } from '@/components/ui';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, Trash2, Plus, Copy, Printer } from 'lucide-react';
import type { DelegateContext } from '../page';

export default function SpeechWorkspace({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: speeches = [], isLoading } = useQuery({
    queryKey: ['delegate-speeches', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speeches')
        .select('id, title, body, updated_at')
        .eq('user_id', ctx.user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (speeches.length > 0 && !activeSpeechId) {
      const first = speeches[0];
      setActiveSpeechId(first.id);
      setTitle(first.title || '');
      setContent(first.body || '');
    }
  }, [speeches, activeSpeechId]);

  const saveSpeech = useCallback(async (sId: string, sTitle: string, sContent: string) => {
    if (!ctx.user?.id || !sId) return;
    setIsSaving(true);
    try {
      await supabase.from('speeches').update({
        title: sTitle,
        body: sContent,
        updated_at: new Date().toISOString(),
      }).eq('id', sId);
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches', ctx.user.id] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [ctx.user?.id, queryClient]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (activeSpeechId) {
      autosaveTimerRef.current = setTimeout(() => {
        saveSpeech(activeSpeechId, title, val);
      }, 2000);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (activeSpeechId) {
      autosaveTimerRef.current = setTimeout(() => {
        saveSpeech(activeSpeechId, val, content);
      }, 2000);
    }
  };

  const createNewSpeech = async () => {
    if (!ctx.user?.id) return;
    const { data, error } = await supabase.from('speeches').insert({
      user_id: ctx.user.id,
      title: 'New Speech',
      body: '',
      word_count: 0,
      is_active: true
    }).select('id, title, body').single();
    
    if (error) {
      toast.error('Failed to create speech');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['delegate-speeches', ctx.user.id] });
    setActiveSpeechId(data.id);
    setTitle(data.title);
    setContent(data.body);
    toast.success('New speech created');
  };

  const deleteSpeech = async (id: string) => {
    if (!confirm('Are you sure you want to delete this speech?')) return;
    const { error } = await supabase.from('speeches').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete speech');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['delegate-speeches', ctx.user?.id] });
    if (activeSpeechId === id) {
      setActiveSpeechId(null);
      setTitle('');
      setContent('');
    }
    toast.success('Speech deleted');
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estTime = Math.ceil(wordCount / 130); // 130 wpm average

  if (isLoading) return <Card className="p-12 flex justify-center"><Loader2 className="animate-spin" /></Card>;

  return (
    <Card className="h-full flex flex-col min-h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <SectionLabel className="mb-0">Speech Workspace</SectionLabel>
        <div className="flex gap-2">
          {isSaving && <span className="text-[10px] text-text-dimmed animate-pulse self-center mr-2 uppercase tracking-widest font-bold">Autosaving...</span>}
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard.writeText(content);
            toast.success('Copied to clipboard');
          }}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
          <Button size="sm" onClick={createNewSpeech}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-border-subtle pr-4 space-y-2 overflow-y-auto hidden md:block">
          {speeches.map((s: any) => (
            <div 
              key={s.id} 
              onClick={() => {
                setActiveSpeechId(s.id);
                setTitle(s.title || '');
                setContent(s.content || '');
              }}
              className={`p-3 rounded-card cursor-pointer transition-all border ${
                activeSpeechId === s.id 
                  ? 'bg-bg-raised border-border-emphasized text-text-primary shadow-sm' 
                  : 'border-transparent hover:bg-bg-raised/50 text-text-dimmed hover:text-text-secondary'
              }`}
            >
              <div className="text-xs font-bold truncate mb-1 uppercase tracking-tight">{s.title || 'Untitled'}</div>
              <div className="text-[10px] opacity-60">{new Date(s.updated_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col space-y-4">
          {activeSpeechId ? (
            <>
              <div className="flex gap-2">
                <Input 
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Speech Title..."
                  className="font-jotia-bold text-lg border-none bg-bg-raised h-12"
                />
                <Button variant="outline" size="icon" className="h-12 w-12 text-status-rejected-text hover:bg-status-rejected-bg/10" onClick={() => deleteSpeech(activeSpeechId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative flex-1">
                <textarea 
                  value={content}
                  onChange={handleContentChange}
                  className="w-full h-full min-h-[400px] p-6 rounded-card border border-border-subtle bg-bg-base resize-none focus:outline-none focus:ring-1 focus:ring-border-emphasized leading-relaxed text-text-secondary font-inter"
                  placeholder="Honorable Chair, distinguished delegates... start typing your speech here."
                />
              </div>

              <div className="flex justify-between items-center px-2 py-3 bg-bg-raised/30 rounded-card border border-border-subtle/50">
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-text-dimmed">
                  <span>{wordCount} Words</span>
                  <span>Est. {estTime} min speaking time</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dimmed">
                  Draft saved {new Date().toLocaleTimeString()}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-dimmed space-y-4 opacity-60">
              <Printer className="w-12 h-12" />
              <p className="text-sm uppercase tracking-widest font-bold">Select a speech or create a new one</p>
              <Button onClick={createNewSpeech}>Create First Speech</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
