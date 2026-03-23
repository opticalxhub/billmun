'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';

export default function SpeechesTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useQuery for Speeches
  const { data: speeches = [], isLoading: speechesLoading, isError: speechesError, refetch: refetchSpeeches } = useQuery({
    queryKey: ['delegate-speeches', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speeches')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  const selectSpeech = (speech: any) => {
    setSelectedId(speech.id);
    setTitle(speech.title);
    setBody(speech.body);
    setNotes(speech.notes);
  };

  const word_count = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body]);
  const speakingTime = Math.ceil(word_count / 130 * 60);
  const minutes = Math.floor(speakingTime / 60);
  const seconds = speakingTime % 60;

  const saveMutation = useMutation({
    mutationFn: async ({ id, title, body, notes }: { id: string; title: string; body: string; notes: string }) => {
      const wc = body.trim() ? body.trim().split(/\s+/).length : 0;
      await supabase.from('speeches').update({
        title, body, notes, word_count: wc, updated_at: new Date().toISOString(),
      }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onSettled: () => setSaving(false),
  });

  const save = useCallback(async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    await saveMutation.mutateAsync({ id: selectedId, title, body, notes });
  }, [selectedId, title, body, notes, saving, saveMutation]);

  // Autosave every 30s
  useEffect(() => {
    if (!selectedId) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => { save(); }, 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [body, title, notes, selectedId, save]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('speeches').insert({
        user_id: ctx.user.id,
        title: 'Untitled Speech',
        body: '',
        notes: '',
        word_count: 0,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
      selectSpeech(data);
    }
  });

  const createSpeech = () => createMutation.mutate();

  const duplicateMutation = useMutation({
    mutationFn: async (speech: any) => {
      const { data, error } = await supabase.from('speeches').insert({
        user_id: ctx.user.id,
        title: `${speech.title} (Copy)`,
        body: speech.body,
        notes: speech.notes,
        word_count: speech.word_count,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
      selectSpeech(data);
    }
  });

  const duplicateSpeech = (speech: any) => duplicateMutation.mutate(speech);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('speeches').delete().eq('id', id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
      if (selectedId === id) { setSelectedId(null); setTitle(''); setBody(''); setNotes(''); }
    }
  });

  const deleteSpeech = (id: string) => {
    if (!confirm('Delete this speech draft?')) return;
    deleteMutation.mutate(id);
  };

  const renameMutation = useMutation({
    mutationFn: async ({ id, newTitle }: { id: string; newTitle: string }) => {
      await supabase.from('speeches').update({ title: newTitle }).eq('id', id);
    },
    onSuccess: (_, { id, newTitle }) => {
      queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
      if (selectedId === id) setTitle(newTitle);
    }
  });

  const renameSpeech = (id: string, newTitle: string) => renameMutation.mutate({ id, newTitle });

  const markActive = async (id: string) => {
    await supabase.from('speeches').update({ is_active: false }).eq('user_id', ctx.user.id);
    await supabase.from('speeches').update({ is_active: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['delegate-speeches'] });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(body);
    alert('Speech copied to clipboard.');
  };

  const printSpeech = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:serif;padding:40px;max-width:700px;margin:0 auto}h1{font-size:24px;margin-bottom:24px}p{font-size:16px;line-height:1.8;white-space:pre-wrap}</style></head><body><h1>${title}</h1><p>${body}</p></body></html>`);
    win.document.close();
    win.print();
  };

  if (speechesLoading) {
    return <LoadingSpinner className="py-20" />;
  }
  if (speechesError) {
    return <QueryErrorState message="Failed to load speeches." onRetry={() => refetchSpeeches()} />;
  }

  const selected = speeches.find(s => s.id === selectedId);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-jotia-bold text-xl text-text-primary">Speeches</h2>
        <button onClick={createSpeech} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
          New Speech
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Draft List - desktop sidebar, mobile dropdown */}
        <div className="lg:w-72 shrink-0">
          {/* Mobile dropdown */}
          <div className="lg:hidden mb-4">
            <select
              value={selectedId || ''}
              onChange={(e) => {
                const s = speeches.find(sp => sp.id === e.target.value);
                if (s) selectSpeech(s);
              }}
              className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary"
            >
              <option value="">Select a draft...</option>
              {speeches.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.word_count} words)</option>
              ))}
            </select>
          </div>

          {/* Desktop list */}
          <div className="hidden lg:block space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {speeches.length === 0 ? (
              <p className="text-text-dimmed font-jotia text-sm p-4">No drafts yet. Create one above.</p>
            ) : (
              speeches.map(s => (
                <div
                  key={s.id}
                  onClick={() => selectSpeech(s)}
                  className={`rounded-card p-3 cursor-pointer transition-colors border ${
                    selectedId === s.id ? 'bg-bg-raised border-border-emphasized' : 'bg-bg-card border-border-subtle hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-jotia text-text-primary text-sm truncate">
                        {s.is_active && <span className="text-green-500 mr-1">●</span>}
                        {s.title}
                      </p>
                      <p className="font-jotia text-text-tertiary text-xs mt-1">
                        {s.word_count} words &middot; ~{Math.floor(s.word_count / 130)}:{String(Math.ceil((s.word_count / 130 * 60) % 60)).padStart(2, '0')}
                      </p>
                      <p className="font-jotia text-text-tertiary text-xs">
                        {new Date(s.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => duplicateSpeech(s)} className="text-text-dimmed hover:text-text-primary text-xs px-1.5 py-1 min-h-[28px]">Dup</button>
                    <button onClick={() => {
                      const n = prompt('New title:', s.title);
                      if (n) renameSpeech(s.id, n);
                    }} className="text-text-dimmed hover:text-text-primary text-xs px-1.5 py-1 min-h-[28px]">Rename</button>
                    <button onClick={() => deleteSpeech(s.id)} className="text-text-dimmed hover:text-status-rejected-text text-xs px-1.5 py-1 min-h-[28px]">Del</button>
                    {!s.is_active && <button onClick={() => markActive(s.id)} className="text-text-dimmed hover:text-green-500 text-xs px-1.5 py-1 min-h-[28px]">Set Active</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!selectedId ? (
            <div className="flex items-center justify-center h-64 bg-bg-card border border-border-subtle rounded-card">
              <p className="text-text-dimmed font-jotia text-sm">Select a speech draft or create a new one.</p>
            </div>
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded-card p-6 space-y-4">
              {/* Title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-border-subtle pb-2 font-jotia-bold text-xl text-text-primary focus:outline-none focus:border-text-primary"
                placeholder="Speech Title"
              />

              {/* Body */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full min-h-[300px] bg-bg-raised border border-border-input rounded-input px-4 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
                placeholder="Start writing your speech..."
              />

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-text-dimmed font-jotia">{word_count} words</span>
                <span className="text-text-dimmed font-jotia">~{minutes}:{String(seconds).padStart(2, '0')} speaking time</span>
                {saved && <span className="text-green-500 font-jotia text-xs animate-fade-in">Saved</span>}
                {saving && <span className="text-text-tertiary font-jotia text-xs">Saving...</span>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-text-dimmed font-jotia text-xs uppercase tracking-wider mb-2">Private Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[100px] bg-bg-raised border border-border-input rounded-input px-4 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
                  placeholder="Research points, reminders..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                <button onClick={save} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
                  Save
                </button>
                <button onClick={copyToClipboard} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                  Copy to Clipboard
                </button>
                <button onClick={printSpeech} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                  Print
                </button>
                {!selected?.is_active && (
                  <button onClick={() => markActive(selectedId)} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                    Mark as Active Speech
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
