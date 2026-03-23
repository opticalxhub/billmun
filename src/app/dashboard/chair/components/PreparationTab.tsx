'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Input, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

const DEFAULT_CHECKLIST = [
  { key: 'background_guide', label: 'Background Guide uploaded' },
  { key: 'rules_of_procedure', label: 'Rules of Procedure uploaded' },
  { key: 'country_assignments', label: 'Country assignments confirmed' },
  { key: 'pre_reading', label: 'Pre-reading materials sent' },
  { key: 'opening_speech', label: 'Opening speech drafted' },
  { key: 'first_topic', label: 'First debate topic selected' },
];

interface ResearchNote {
  id: string;
  topic: string;
  content: string;
}

interface CountryPosition {
  country: string;
  stance: string;
  notes: string;
}

export default function PreparationTab({ ctx }: { ctx: ChairContext }) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>([]);
  const [countryPositions, setCountryPositions] = useState<CountryPosition[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => { loadData(); }, [ctx.committee?.id]);

  const loadData = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('chair_preparation')
      .select('*')
      .eq('committee_id', ctx.committee.id)
      .eq('chair_id', ctx.user.id)
      .single();

    if (data) {
      setChecklist(data.checklist || {});
      setResearchNotes(data.research_notes || []);
      
      // Initialize country positions from delegates if saved data is empty
      const savedPositions = data.country_positions || [];
      if (savedPositions.length > 0) {
        setCountryPositions(savedPositions);
      } else {
        setCountryPositions(ctx.delegates.map(d => ({
          country: d.country || 'Unknown',
          stance: '',
          notes: '',
        })));
      }
    } else {
      // Initialize country positions from delegate assignments
      const positions = ctx.delegates.map(d => ({
        country: d.country || 'Unknown',
        stance: '',
        notes: '',
      }));
      setCountryPositions(positions);
    }
  };

  const save = async (newChecklist?: Record<string, boolean>, newNotes?: ResearchNote[], newPositions?: CountryPosition[]) => {
    setSaving(true);
    const cl = newChecklist || checklist;
    const rn = newNotes || researchNotes;
    const cp = newPositions || countryPositions;

    await supabase.from('chair_preparation').upsert({
      committee_id: ctx.committee.id,
      chair_id: ctx.user.id,
      checklist: cl,
      research_notes: rn,
      country_positions: cp,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
  };

  const toggleChecklist = (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    save(updated);
  };

  const addNote = () => {
    if (!newTopic.trim()) return;
    const note: ResearchNote = { id: Date.now().toString(), topic: newTopic, content: newContent };
    const updated = [...researchNotes, note];
    setResearchNotes(updated);
    setNewTopic('');
    setNewContent('');
    save(undefined, updated);
  };

  const removeNote = (id: string) => {
    const updated = researchNotes.filter(n => n.id !== id);
    setResearchNotes(updated);
    save(undefined, updated);
  };

  const updatePosition = (index: number, field: keyof CountryPosition, value: string) => {
    const updated = [...countryPositions];
    updated[index] = { ...updated[index], [field]: value };
    setCountryPositions(updated);
  };

  const savePositions = () => save(undefined, undefined, countryPositions);

  const completedCount = DEFAULT_CHECKLIST.filter(c => checklist[c.key]).length;
  const completionPct = Math.round((completedCount / DEFAULT_CHECKLIST.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-jotia-bold text-2xl text-text-primary">Preparation</h2>
          <p className="text-text-dimmed text-sm">Pre-conference workspace for {ctx.committee?.name}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${completionPct === 100 ? 'text-green-400' : 'text-text-primary'}`}>{completionPct}%</p>
          <p className="text-[10px] text-text-dimmed uppercase tracking-widest">Complete</p>
        </div>
      </div>

      {/* Checklist */}
      <Card>
        <SectionLabel>Preparation Checklist</SectionLabel>
        <div className="w-full bg-bg-raised rounded-full h-2 overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all ${completionPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${completionPct}%` }} />
        </div>
        <div className="space-y-2">
          {DEFAULT_CHECKLIST.map(item => (
            <button
              key={item.key}
              onClick={() => toggleChecklist(item.key)}
              className={`w-full flex items-center gap-3 p-4 rounded-card border text-left transition-all min-h-[48px] ${
                checklist[item.key]
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-bg-raised border-border-subtle hover:border-border-emphasized'
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                checklist[item.key] ? 'bg-green-500 text-white' : 'border border-border-input'
              }`}>
                {checklist[item.key] && (
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </div>
              <span className={`text-sm ${checklist[item.key] ? 'text-text-primary line-through opacity-60' : 'text-text-primary'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Research Board */}
      <Card>
        <SectionLabel>Research Board</SectionLabel>
        <div className="space-y-3 mb-4">
          {researchNotes.length === 0 && <p className="text-text-dimmed text-sm text-center py-4">No research notes yet. Add your first topic below.</p>}
          {researchNotes.map(note => (
            <div key={note.id} className="p-4 bg-bg-raised rounded-card border border-border-subtle">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest px-2 py-0.5 bg-bg-card rounded-full border border-border-subtle">{note.topic}</span>
                <button onClick={() => removeNote(note.id)} className="text-xs text-status-rejected-text hover:underline font-bold uppercase">Remove</button>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-bg-raised rounded-card border border-border-subtle space-y-3">
          <Input placeholder="Sub-topic label" value={newTopic} onChange={e => setNewTopic(e.target.value)} />
          <Textarea rows={3} placeholder="Notes for this sub-topic..." value={newContent} onChange={e => setNewContent(e.target.value)} />
          <Button onClick={addNote} disabled={!newTopic.trim()} className="w-full min-h-[48px]">Add Note</Button>
        </div>
      </Card>

      {/* Country Position Overview */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">Country Position Overview</SectionLabel>
          <Button variant="outline" size="sm" onClick={savePositions} disabled={saving}>
            {saving ? 'Saving...' : 'Save Positions'}
          </Button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Country</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Expected Stance</th>
                <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Chair Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {countryPositions.map((cp, i) => (
                <tr key={i} className="hover:bg-bg-raised/30 transition-colors">
                  <td className="p-3 text-sm font-bold text-text-primary w-48">{cp.country}</td>
                  <td className="p-2">
                    <input 
                      type="text"
                      className="w-full h-9 rounded-input border border-border-input bg-transparent px-3 text-sm focus:border-border-emphasized transition-all"
                      value={cp.stance}
                      onChange={e => updatePosition(i, 'stance', e.target.value)}
                      placeholder="Expected stance..."
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text"
                      className="w-full h-9 rounded-input border border-border-input bg-transparent px-3 text-sm focus:border-border-emphasized transition-all"
                      value={cp.notes}
                      onChange={e => updatePosition(i, 'notes', e.target.value)}
                      placeholder="Chair notes on this country..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-4">
          {countryPositions.map((cp, i) => (
            <div key={i} className="p-4 bg-bg-raised rounded-card border border-border-subtle space-y-3">
              <div className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2 uppercase tracking-wide">{cp.country}</div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Expected Stance</label>
                <input 
                  type="text"
                  className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                  value={cp.stance}
                  onChange={e => updatePosition(i, 'stance', e.target.value)}
                  placeholder="Expected stance..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Chair Notes</label>
                <input 
                  type="text"
                  className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                  value={cp.notes}
                  onChange={e => updatePosition(i, 'notes', e.target.value)}
                  placeholder="Chair notes on this country..."
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
