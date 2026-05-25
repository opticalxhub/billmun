'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, SectionLabel, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Globe, Bookmark, FileText } from 'lucide-react';
import type { DelegateContext } from '../../page';

export default function CountryResearch({ ctx }: { ctx: DelegateContext }) {
  const [countryNotes, setCountryNotes] = useState('');
  const [prevResolutions, setPrevResolutions] = useState('');
  const [stances, setStances] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: researchData, isLoading: researchLoading } = useQuery({
    queryKey: ['country-research', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('country_research')
        .select('id, country_notes, previous_resolutions')
        .eq('user_id', ctx.user.id)
        .maybeSingle();
      
      if (data) {
        setCountryNotes(data.country_notes || '');
        setPrevResolutions(data.previous_resolutions || '');
      }
      return data || null;
    },
  });

  const { data: stanceData, isLoading: stancesLoading } = useQuery({
    queryKey: ['stance-notes', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('stance_notes')
        .select('id, sub_topic, stance')
        .eq('user_id', ctx.user.id);
      
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.sub_topic] = s.stance; });
        setStances(map);
      }
      return data || [];
    },
  });

  const saveResearch = useCallback(async (notes: string, res: string) => {
    if (!ctx.user?.id) return;
    setIsSaving(true);
    try {
      await supabase.from('country_research').upsert({
        user_id: ctx.user.id,
        country_notes: notes,
        previous_resolutions: res,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } finally {
      setIsSaving(false);
    }
  }, [ctx.user?.id]);

  const saveStance = useCallback(async (topic: string, stance: string) => {
    if (!ctx.user?.id) return;
    setIsSaving(true);
    try {
      await supabase.from('stance_notes').upsert({
        user_id: ctx.user.id,
        sub_topic: topic,
        stance,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sub_topic' });
    } finally {
      setIsSaving(false);
    }
  }, [ctx.user?.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCountryNotes(val);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => saveResearch(val, prevResolutions), 2000);
  };

  const handleResChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrevResolutions(val);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => saveResearch(countryNotes, val), 2000);
  };

  const handleStanceChange = (topic: string, val: string) => {
    setStances(prev => ({ ...prev, [topic]: val }));
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => saveStance(topic, val), 2000);
  };

  if (researchLoading || stancesLoading) return <Card className="p-12 flex justify-center"><Loader2 className="animate-spin" /></Card>;

  const subTopics = ctx.committee?.sub_topics || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <SectionLabel className="mb-0 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Country Profile
            </SectionLabel>
            {isSaving && <span className="text-[10px] text-text-dimmed animate-pulse font-bold uppercase">Saving...</span>}
          </div>
          <Textarea 
            value={countryNotes}
            onChange={handleNotesChange}
            placeholder="Research your country's general history, economy, and foreign policy..."
            className="flex-1 min-h-[300px] resize-none font-inter leading-relaxed"
          />
        </Card>

        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <SectionLabel className="mb-0 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Previous Resolutions
            </SectionLabel>
          </div>
          <Textarea 
            value={prevResolutions}
            onChange={handleResChange}
            placeholder="Paste relevant UN resolutions or past committee outcomes for reference..."
            className="flex-1 min-h-[300px] resize-none font-inter leading-relaxed"
          />
        </Card>
      </div>

      <Card>
        <SectionLabel className="flex items-center gap-2 mb-6">
          <Bookmark className="w-4 h-4" />
          Stance Tracker
        </SectionLabel>
        <div className="space-y-6">
          {subTopics.length > 0 ? subTopics.map((topic: string, idx: number) => (
            <div key={idx} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dimmed block">Sub-topic {idx + 1}: {topic}</label>
              <Textarea 
                value={stances[topic] || ''}
                onChange={(e) => handleStanceChange(topic, e.target.value)}
                placeholder={`What is your country's specific position on ${topic}?`}
                className="min-h-[100px] resize-none"
              />
            </div>
          )) : (
            <p className="text-sm text-text-dimmed italic">No sub-topics defined for this committee yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
