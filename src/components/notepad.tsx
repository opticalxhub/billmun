'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel } from '@/components/ui';
import { Save, CheckCircle, FileText } from 'lucide-react';

interface NotepadProps {
  dashboardKey: string;
  userId: string;
  className?: string;
}

export function Notepad({ dashboardKey, userId, className = "" }: NotepadProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing note
  useEffect(() => {
    async function loadNote() {
      if (!userId) return;
      
      const { data } = await supabase
        .from('user_notes')
        .select('content, updated_at')
        .eq('user_id', userId)
        .eq('note_type', `NOTEPAD_${dashboardKey}`)
        .maybeSingle();

      if (data) {
        setContent(data.content || "");
        setLastSaved(new Date(data.updated_at));
      }
      setIsLoading(false);
    }
    loadNote();
  }, [userId, dashboardKey]);

  const saveNote = useCallback(async (newContent: string) => {
    if (!userId) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('user_notes')
      .upsert({
        user_id: userId,
        author_id: userId,
        note_type: `NOTEPAD_${dashboardKey}`,
        content: newContent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,note_type' });

    if (!error) {
      setLastSaved(new Date());
    }
    setSaving(false);
  }, [userId, dashboardKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Auto-save debounce (2 seconds)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val);
    }, 2000);
  };

  if (isLoading) return null;

  return (
    <Card className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-tertiary" />
          <SectionLabel className="mb-0">Notepad</SectionLabel>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          {saving ? (
            <span className="text-text-tertiary flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-text-tertiary animate-pulse" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="text-status-approved-text flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-text-dimmed italic">Unsaved</span>
          )}
        </div>
      </div>
      <div className="flex-1 relative group">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down your notes here... (auto-saves)"
          className="w-full h-full min-h-[150px] bg-bg-raised border border-border-subtle rounded-card p-4 text-sm text-text-primary placeholder:text-text-dimmed focus:border-text-primary focus:ring-1 focus:ring-text-primary outline-none transition-all resize-none"
        />
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Save className="w-4 h-4 text-text-tertiary/30" />
        </div>
      </div>
    </Card>
  );
}
