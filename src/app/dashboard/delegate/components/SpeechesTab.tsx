'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const { data: speeches, isLoading: speechesLoading, isError: speechesError, refetch: refetchSpeeches } = useQuery({
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
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const saveSpeech = async () => {
    if (!selectedId || !title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('speeches').update({
        title: title.trim(),
        body: body.trim(),
        notes: notes.trim() || null,
        word_count: body.trim().split(/\s+/).filter(w => w).length,
        updated_at: new Date().toISOString(),
      }).eq('id', selectedId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save speech');
      setSaving(false);
    }
  };

  const createSpeech = async () => {
    const { data, error } = await supabase.from('speeches').insert({
      user_id: ctx.user.id,
      title: 'Untitled Speech',
      body: '',
      notes: null,
      word_count: 0,
    }).select().single();
    if (error) {
      alert(error.message);
      return;
    }
    if (data) { 
      await refetchSpeeches(); 
      setSelectedId(data.id); 
      setTitle('Untitled Speech');
      setBody('');
      setNotes('');
    }
  };

  const selectSpeech = (s: any) => {
    setSelectedId(s.id);
    setTitle(s.title);
    setBody(s.body || '');
    setNotes(s.notes || '');
  };

  const deleteSpeech = async (id: string) => {
    if (!confirm('Delete this speech draft?')) return;
    await supabase.from('speeches').delete().eq('id', id);
    if (selectedId === id) { 
      setSelectedId(null); 
    }
    refetchSpeeches();
  };

  const printSpeech = () => {
    if (!selectedId) return;
    const selected = (speeches || []).find(s => s.id === selectedId);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selected.title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              .notes { font-style: italic; color: #666; margin-top: 30px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <h1>${selected.title}</h1>
            <div>${selected.body.replace(/\n/g, '<br>')}</div>
            ${selected.notes ? `<div class="notes">Notes: ${selected.notes}</div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (speechesLoading) {
    return <LoadingSpinner className="py-20" />;
  }
  if (speechesError) {
    return <QueryErrorState message="Failed to load speeches." onRetry={() => refetchSpeeches()} />;
  }

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
                const s = (speeches || []).find(sp => sp.id === e.target.value);
                if (s) selectSpeech(s);
              }}
              className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary"
            >
              <option value="">Select a draft...</option>
              {(speeches || []).map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.word_count} words)</option>
              ))}
            </select>
          </div>

          {/* Desktop list */}
          <div className="hidden lg:block space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {(speeches || []).length === 0 ? (
              <p className="text-text-dimmed font-jotia text-sm p-4">No drafts yet. Create one above.</p>
            ) : (
              (speeches || []).map(s => (
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
                        {s.title} ({s.word_count} words)
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteSpeech(s.id); }} className="text-text-dimmed hover:text-status-rejected-text text-xs mt-1 min-h-[28px]">Delete</button>
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
              <p className="text-text-dimmed font-jotia text-sm">Select or create a speech draft.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-bg-card border border-border-subtle rounded-card p-6 space-y-4">
                <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveSpeech} placeholder="Speech Title" className="w-full bg-transparent border-b border-border-subtle pb-2 font-jotia-bold text-xl text-text-primary focus:outline-none focus:border-text-primary" />
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onBlur={saveSpeech}
                  placeholder="Type your speech here..."
                  className="w-full min-h-[300px] bg-bg-raised border border-border-input rounded-input px-3 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
                />
                <input value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveSpeech} placeholder="Notes (optional)" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
                <div className="flex items-center justify-between">
                  <span className="text-text-dimmed font-jotia text-xs">
                    {saving ? 'Saving...' : saved ? 'Saved' : `${body.trim().split(/\s+/).filter(w => w).length} words`}
                  </span>
                  <button onClick={printSpeech} className="text-xs text-text-dimmed hover:text-text-primary px-2 py-1 min-h-[28px]">Print</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
