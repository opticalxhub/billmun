'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DelegateContext } from '../page';

export default function ResearchTab({ ctx }: { ctx: DelegateContext }) {
  const [country_notes, setCountryNotes] = useState('');
  const [previous_resolutions, setPreviousResolutions] = useState('');
  const [stances, setStances] = useState<Record<string, string>>({});
  const [sub_topics, setSubTopics] = useState<string[]>([]);
  const [savedCountry, setSavedCountry] = useState(false);
  const [savedResolutions, setSavedResolutions] = useState(false);
  const [savedStances, setSavedStances] = useState<Record<string, boolean>>({});
  const autosaveCountryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveResRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadResearch();
    loadSubTopics();
    loadStances();
  }, [ctx.user?.id, ctx.committee?.id]);

  const loadResearch = async () => {
    if (!ctx.user?.id) return;
    const { data } = await supabase
      .from('country_research')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();
    if (data) {
      setCountryNotes(data.country_notes);
      setPreviousResolutions(data.previous_resolutions);
    }
  };

  const loadSubTopics = async () => {
    if (!ctx.committee?.sub_topics) { setSubTopics([]); return; }
    setSubTopics(ctx.committee.sub_topics || []);
  };

  const loadStances = async () => {
    if (!ctx.user?.id) return;
    const { data } = await supabase
      .from('stance_notes')
      .select('*')
      .eq('user_id', ctx.user.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.sub_topic] = s.stance; });
      setStances(map);
    }
  };

  const saveCountryNotes = useCallback(async () => {
    if (!ctx.user?.id) return;
    await supabase.from('country_research').upsert({
      user_id: ctx.user.id,
      country_notes: country_notes,
      previous_resolutions: previous_resolutions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSavedCountry(true);
    setTimeout(() => setSavedCountry(false), 2000);
  }, [ctx.user?.id, country_notes, previous_resolutions]);

  const saveResolutions = useCallback(async () => {
    if (!ctx.user?.id) return;
    await supabase.from('country_research').upsert({
      user_id: ctx.user.id,
      country_notes: country_notes,
      previous_resolutions: previous_resolutions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSavedResolutions(true);
    setTimeout(() => setSavedResolutions(false), 2000);
  }, [ctx.user?.id, country_notes, previous_resolutions]);

  const saveStance = useCallback(async (topic: string, stance: string) => {
    if (!ctx.user?.id) return;
    await supabase.from('stance_notes').upsert({
      user_id: ctx.user.id,
      sub_topic: topic,
      stance,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,sub_topic' });
    setSavedStances(prev => ({ ...prev, [topic]: true }));
    setTimeout(() => setSavedStances(prev => ({ ...prev, [topic]: false })), 2000);
  }, [ctx.user?.id]);

  // Autosave country notes every 30s
  useEffect(() => {
    if (autosaveCountryRef.current) clearTimeout(autosaveCountryRef.current);
    autosaveCountryRef.current = setTimeout(saveCountryNotes, 30000);
    return () => { if (autosaveCountryRef.current) clearTimeout(autosaveCountryRef.current); };
  }, [country_notes, saveCountryNotes]);

  // Autosave resolutions every 30s
  useEffect(() => {
    if (autosaveResRef.current) clearTimeout(autosaveResRef.current);
    autosaveResRef.current = setTimeout(saveResolutions, 30000);
    return () => { if (autosaveResRef.current) clearTimeout(autosaveResRef.current); };
  }, [previous_resolutions, saveResolutions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-jotia-bold text-xl text-text-primary">Research Workspace</h2>
        <p className="text-text-dimmed font-jotia text-sm mt-1">
          Private research for {ctx.assignment?.country || 'your assigned country'}.
        </p>
      </div>

      {/* Country Profile */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jotia-bold text-lg text-text-primary">
            Country Profile {ctx.assignment?.country && `- ${ctx.assignment.country}`}
          </h3>
          {savedCountry && <span className="text-green-500 font-jotia text-xs animate-fade-in">Saved</span>}
        </div>
        <textarea
          value={country_notes}
          onChange={e => setCountryNotes(e.target.value)}
          onBlur={saveCountryNotes}
          className="w-full min-h-[200px] bg-bg-raised border border-border-input rounded-input px-4 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
          placeholder="Research notes about your assigned country's political positions, economic data, treaties, alliances, history with the topic..."
        />
        <p className="text-text-tertiary font-jotia text-xs mt-2">Auto-saves every 30 seconds.</p>
      </div>

      {/* Stance Tracker */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Stance Tracker</h3>
        {sub_topics.length === 0 ? (
          <p className="text-text-dimmed font-jotia text-sm">No sub-topics defined for this committee yet. The Executive Board will add them.</p>
        ) : (
          <div className="space-y-4">
            {sub_topics.map(topic => (
              <div key={topic}>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-jotia-bold text-sm text-text-primary">{topic}</label>
                  {savedStances[topic] && <span className="text-green-500 font-jotia text-xs animate-fade-in">Saved</span>}
                </div>
                <textarea
                  value={stances[topic] || ''}
                  onChange={e => setStances(prev => ({ ...prev, [topic]: e.target.value }))}
                  onBlur={() => saveStance(topic, stances[topic] || '')}
                  className="w-full min-h-[100px] bg-bg-raised border border-border-input rounded-input px-4 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
                  placeholder={`Your country's position on ${topic}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Resolutions */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-jotia-bold text-lg text-text-primary">Previous Resolutions</h3>
          {savedResolutions && <span className="text-green-500 font-jotia text-xs animate-fade-in">Saved</span>}
        </div>
        <textarea
          value={previous_resolutions}
          onChange={e => setPreviousResolutions(e.target.value)}
          onBlur={saveResolutions}
          className="w-full min-h-[200px] bg-bg-raised border border-border-input rounded-input px-4 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
          placeholder="Paste or note relevant past UN resolutions for reference during debate..."
        />
        <p className="text-text-tertiary font-jotia text-xs mt-2">Auto-saves every 30 seconds.</p>
      </div>
    </div>
  );
}
