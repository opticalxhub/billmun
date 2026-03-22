'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';

const PREAMBULATORY_PHRASES = [
  'Affirming', 'Alarmed by', 'Approving', 'Aware of', 'Believing', 'Cognizant of', 'Confident',
  'Contemplating', 'Convinced', 'Declaring', 'Deeply concerned', 'Deeply conscious', 'Deeply convinced',
  'Deeply disturbed', 'Deeply regretting', 'Desiring', 'Emphasizing', 'Expecting',
  'Expressing its appreciation', 'Fulfilling', 'Fully alarmed', 'Fully aware', 'Guided by',
  'Having adopted', 'Having considered', 'Having examined', 'Keeping in mind', 'Mindful of',
  'Noting', 'Noting also', 'Noting with concern', 'Observing', 'Reaffirming', 'Realizing',
  'Recalling', 'Recognizing', 'Seeking', 'Taking into account', 'Taking note', 'Welcoming',
];

const OPERATIVE_PHRASES = [
  'Accepts', 'Affirms', 'Approves', 'Authorizes', 'Calls for', 'Calls upon', 'Commends',
  'Condemns', 'Confirms', 'Congratulates', 'Considers', 'Decides', 'Declares', 'Demands',
  'Deplores', 'Designates', 'Draws attention to', 'Emphasizes', 'Encourages', 'Endorses',
  'Expresses its appreciation', 'Further invites', 'Further recommends', 'Further requests',
  'Further resolves', 'Invites', 'Notes', 'Proclaims', 'Reaffirms', 'Recommends', 'Regrets',
  'Reminds', 'Requests', 'Solemnly affirms', 'Strongly condemns', 'Supports', 'Takes note',
  'Trusts', 'Urges', 'Welcomes',
];

interface Clause {
  id: string;
  type: 'PREAMBULATORY' | 'OPERATIVE';
  opening_phrase: string;
  content: string;
  order_index: number;
  parent_clause_id: string | null;
}

export default function ResolutionBuilderTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [coSponsors, setCoSponsors] = useState<string[]>([]);
  const [sponsorInput, setSponsorInput] = useState('');
  const [addingType, setAddingType] = useState<'PREAMBULATORY' | 'OPERATIVE' | null>(null);
  const [addingPhrase, setAddingPhrase] = useState('');
  const [addingContent, setAddingContent] = useState('');
  const [addingParent, setAddingParent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState<"" | "pdf" | "docx">("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBlocId, setSelectedBlocId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  // useQuery for Resolutions
  const { data: resolutions = [], isLoading: resolutionsLoading, refetch: refetchResolutions } = useQuery({
    queryKey: ['resolutions', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('resolutions').select('*').eq('user_id', ctx.user.id).order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  // useQuery for User Blocs
  const { data: userBlocs = [], isLoading: blocsLoading } = useQuery({
    queryKey: ['user-blocs', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloc_members')
        .select('bloc_id, blocs(name, channel_id)')
        .eq('user_id', ctx.user.id);
      if (error) throw error;
      return (data || []).map((b: any) => ({
        bloc_id: b.bloc_id,
        blocs: b.blocs
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Clauses
  const { data: clauses = [], isLoading: clausesLoading, refetch: refetchClauses } = useQuery({
    queryKey: ['resolution-clauses', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase.from('resolution_clauses').select('*').eq('resolution_id', selectedId).order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []) as Clause[];
    },
    staleTime: 30 * 1000,
  });

  const selectResolution = (res: any) => {
    setSelectedId(res.id);
    setTitle(res.title || '');
    setTopic(res.topic || '');
    setCoSponsors(res.co_sponsors || []);
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!selectedId) return;
    setExporting(format);
    try {
      const res = await fetch(`/api/resolution/export?resolutionId=${encodeURIComponent(selectedId)}&format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resolution.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting("");
    }
  };

  if (resolutionsLoading || blocsLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  const createResolution = async () => {
    const { data, error } = await supabase.from('resolutions').insert({
      user_id: ctx.user.id,
      committee_id: ctx.assignment?.committee_id || null,
      title: 'Untitled Resolution',
      topic: '',
      co_sponsors: [],
    }).select().single();
    if (error) {
      alert(error.message);
      return;
    }
    if (data) { 
      await refetchResolutions(); 
      selectResolution(data); 
    }
  };

  const saveResolution = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await supabase.from('resolutions').update({
        title, topic, co_sponsors: coSponsors, updated_at: new Date().toISOString(),
      }).eq('id', selectedId);
      queryClient.invalidateQueries({ queryKey: ['resolutions', ctx.user?.id] });
    } finally {
      setSaving(false);
    }
  };

  const deleteResolution = async (id: string) => {
    if (!confirm('Delete this resolution draft?')) return;
    await supabase.from('resolutions').delete().eq('id', id);
    if (selectedId === id) { 
      setSelectedId(null); 
    }
    refetchResolutions();
  };

  const addSponsor = () => {
    if (!sponsorInput.trim() || coSponsors.includes(sponsorInput.trim())) return;
    setCoSponsors([...coSponsors, sponsorInput.trim()]);
    setSponsorInput('');
  };

  const removeSponsor = (s: string) => setCoSponsors(coSponsors.filter(x => x !== s));

  const addClause = async () => {
    if (!addingPhrase || !selectedId || !addingType) return;
    const maxOrder = clauses
      .filter((c: Clause) => c.type === addingType && !c.parent_clause_id)
      .reduce((m: number, c: Clause) => Math.max(m, c.order_index), -1);
    
    const { data, error } = await supabase.from('resolution_clauses').insert({
      resolution_id: selectedId,
      type: addingType,
      opening_phrase: addingPhrase,
      content: addingContent.trim(),
      order_index: maxOrder + 1,
      parent_clause_id: addingParent,
    }).select().single();

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      queryClient.invalidateQueries({ queryKey: ['resolution-clauses', selectedId] });
    }
    setAddingType(null);
    setAddingPhrase('');
    setAddingContent('');
    setAddingParent(null);
  };

  const deleteClause = async (id: string) => {
    await supabase.from('resolution_clauses').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['resolution-clauses', selectedId] });
  };

  const moveClause = async (id: string, direction: -1 | 1) => {
    const clause = clauses.find((c: Clause) => c.id === id);
    if (!clause) return;
    const siblings = clauses
      .filter((c: Clause) => c.type === clause.type && c.parent_clause_id === clause.parent_clause_id)
      .sort((a: Clause, b: Clause) => a.order_index - b.order_index);
    const idx = siblings.findIndex((c: Clause) => c.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const tempOrder = clause.order_index;
    await supabase.from('resolution_clauses').update({ order_index: siblings[swapIdx].order_index }).eq('id', id);
    await supabase.from('resolution_clauses').update({ order_index: tempOrder }).eq('id', siblings[swapIdx].id);
    refetchClauses();
  };

  const handleShareToBloc = async () => {
    if (!selectedId || !selectedBlocId) return;
    setSharing(true);
    try {
      const res = await fetch('/api/resolution/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_id: selectedId, bloc_id: selectedBlocId }),
      });
      if (!res.ok) throw new Error('Share failed');
      alert('Shared successfully to the bloc channel!');
      setShowShareModal(false);
      setSelectedBlocId("");
    } catch (e: any) {
      alert(e.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const preamClauses = clauses
    .filter((c: Clause) => c.type === 'PREAMBULATORY' && !c.parent_clause_id)
    .sort((a: Clause, b: Clause) => a.order_index - b.order_index);
  
  const opClauses = clauses
    .filter((c: Clause) => c.type === 'OPERATIVE' && !c.parent_clause_id)
    .sort((a: Clause, b: Clause) => a.order_index - b.order_index);

  const getSubClauses = (parentId: string) => 
    clauses
      .filter((c: Clause) => c.parent_clause_id === parentId)
      .sort((a: Clause, b: Clause) => a.order_index - b.order_index);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-jotia-bold text-xl text-text-primary">Resolution Builder</h2>
        <button onClick={createResolution} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
          New Resolution
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Resolution List */}
        <div className="lg:w-64 shrink-0 space-y-2">
          {resolutions.map(r => (
            <div key={r.id} onClick={() => selectResolution(r)} className={`rounded-card p-3 cursor-pointer transition-colors border ${selectedId === r.id ? 'bg-bg-raised border-border-emphasized' : 'bg-bg-card border-border-subtle hover:bg-bg-hover'}`}>
              <p className="font-jotia text-text-primary text-sm truncate">{r.title}</p>
              <p className="font-jotia text-text-tertiary text-xs">{new Date(r.updated_at).toLocaleDateString()}</p>
              <button onClick={(e) => { e.stopPropagation(); deleteResolution(r.id); }} className="text-text-dimmed hover:text-status-rejected-text text-xs mt-1 min-h-[28px]">Delete</button>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!selectedId ? (
            <div className="flex items-center justify-center h-64 bg-bg-card border border-border-subtle rounded-card">
              <p className="text-text-dimmed font-jotia text-sm">Select or create a resolution.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-bg-card border border-border-subtle rounded-card p-6 space-y-4">
                <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveResolution} placeholder="Resolution Title" className="w-full bg-transparent border-b border-border-subtle pb-2 font-jotia-bold text-xl text-text-primary focus:outline-none focus:border-text-primary" />
                <input value={topic} onChange={e => setTopic(e.target.value)} onBlur={saveResolution} placeholder="Topic / Question of" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />

                {/* Co-Sponsors */}
                <div>
                  <label className="block text-text-dimmed font-jotia text-xs uppercase tracking-wider mb-2">Co-Sponsors</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {coSponsors.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-bg-raised border border-border-subtle rounded-full px-3 py-1 text-xs font-jotia text-text-primary">
                        {s}
                        <button onClick={() => removeSponsor(s)} className="text-text-dimmed hover:text-text-primary ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={sponsorInput} onChange={e => setSponsorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSponsor()} placeholder="Country name" className="flex-1 bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
                    <button onClick={addSponsor} className="px-3 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">Add</button>
                  </div>
                </div>
              </div>

              {/* Preambulatory Clauses */}
              <div className="bg-bg-card border border-border-subtle rounded-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-jotia-bold text-sm text-text-primary uppercase tracking-wider">Preambulatory Clauses</h3>
                  <button onClick={() => { setAddingType('PREAMBULATORY'); setAddingParent(null); }} className="text-xs text-text-dimmed hover:text-text-primary min-h-[28px] px-2">+ Add</button>
                </div>
                {preamClauses.length === 0 && <p className="text-text-dimmed font-jotia text-sm">No preambulatory clauses yet.</p>}
                <div className="space-y-2">
                  {preamClauses.map((c, i) => (
                    <div key={c.id} className="bg-bg-raised rounded-card p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-jotia text-text-primary text-sm"><em className="underline">{c.opening_phrase}</em> {c.content}{i < preamClauses.length - 1 ? ',' : ''}</p>
                        <div className="hidden group-hover:flex gap-1 shrink-0">
                          <button onClick={() => moveClause(c.id, -1)} className="text-xs text-text-dimmed px-1">↑</button>
                          <button onClick={() => moveClause(c.id, 1)} className="text-xs text-text-dimmed px-1">↓</button>
                          <button onClick={() => deleteClause(c.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text px-1">×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operative Clauses */}
              <div className="bg-bg-card border border-border-subtle rounded-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-jotia-bold text-sm text-text-primary uppercase tracking-wider">Operative Clauses</h3>
                  <button onClick={() => { setAddingType('OPERATIVE'); setAddingParent(null); }} className="text-xs text-text-dimmed hover:text-text-primary min-h-[28px] px-2">+ Add</button>
                </div>
                {opClauses.length === 0 && <p className="text-text-dimmed font-jotia text-sm">No operative clauses yet.</p>}
                <div className="space-y-2">
                  {opClauses.map((c, i) => (
                    <div key={c.id}>
                      <div className="bg-bg-raised rounded-card p-3 group">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-jotia text-text-primary text-sm">
                            <span className="text-text-dimmed mr-2">{i + 1}.</span>
                            <span className="underline">{c.opening_phrase}</span> {c.content};
                          </p>
                          <div className="hidden group-hover:flex gap-1 shrink-0">
                            <button onClick={() => moveClause(c.id, -1)} className="text-xs text-text-dimmed px-1">↑</button>
                            <button onClick={() => moveClause(c.id, 1)} className="text-xs text-text-dimmed px-1">↓</button>
                            <button onClick={() => { setAddingType('OPERATIVE'); setAddingParent(c.id); }} className="text-xs text-text-dimmed px-1" title="Add sub-clause">+sub</button>
                            <button onClick={() => deleteClause(c.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text px-1">×</button>
                          </div>
                        </div>
                      </div>
                      {/* Sub-clauses */}
                      {getSubClauses(c.id).map((sub, si) => (
                        <div key={sub.id} className="ml-8 mt-1 bg-bg-raised/50 rounded-card p-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-jotia text-text-dimmed text-sm">
                              <span className="mr-2">{String.fromCharCode(97 + si)}.</span>
                              <span className="underline">{sub.opening_phrase}</span> {sub.content};
                            </p>
                            <button onClick={() => deleteClause(sub.id)} className="hidden group-hover:block text-xs text-text-dimmed hover:text-status-rejected-text px-1">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Clause Modal */}
              {addingType && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4" onClick={() => setAddingType(null)}>
                  <div className="bg-bg-card w-full md:max-w-md md:rounded-card rounded-t-xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-jotia-bold text-lg text-text-primary">
                      Add {addingType === 'PREAMBULATORY' ? 'Preambulatory' : 'Operative'} Clause
                      {addingParent && ' (Sub-clause)'}
                    </h3>
                    <select
                      value={addingPhrase}
                      onChange={e => setAddingPhrase(e.target.value)}
                      className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary"
                    >
                      <option value="">Select opening phrase...</option>
                      {(addingType === 'PREAMBULATORY' ? PREAMBULATORY_PHRASES : OPERATIVE_PHRASES).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      value={addingContent}
                      onChange={e => setAddingContent(e.target.value)}
                      placeholder="Rest of clause text..."
                      className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary"
                      onKeyDown={e => e.key === 'Enter' && addClause()}
                    />
                    <button onClick={addClause} disabled={!addingPhrase} className="w-full px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50">
                      Add Clause
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Toggle (Mobile) / Side Panel (Desktop) */}
              <div className="lg:hidden">
                <button onClick={() => setShowPreview(!showPreview)} className="w-full px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {/* Formatted Preview */}
              <div className={`bg-white text-black rounded-card p-8 ${showPreview ? 'block' : 'hidden lg:block'}`}>
                <div className="text-center mb-6">
                  <p className="text-sm font-bold uppercase">{ctx.committee?.name || 'Committee'}</p>
                  <p className="text-xs mt-1">Forum: {ctx.committee?.abbreviation || 'N/A'}</p>
                  <p className="text-xs">Question of: {topic || '...'}</p>
                  <p className="text-xs">Sponsors: {coSponsors.join(', ') || '...'}</p>
                </div>
                <div className="text-sm leading-relaxed">
                  <p className="font-bold mb-2">The {ctx.committee?.name || 'Committee'},</p>
                  {preamClauses.map((c, i) => (
                    <p key={c.id} className="mb-1 italic">
                      <span className="not-italic underline">{c.opening_phrase}</span> {c.content}{i < preamClauses.length - 1 ? ',' : ','}
                    </p>
                  ))}
                  {opClauses.map((c, i) => (
                    <div key={c.id} className="mb-2">
                      <p>
                        <span className="mr-1">{i + 1}.</span>
                        <span className="underline font-semibold">{c.opening_phrase}</span> {c.content};
                      </p>
                      {getSubClauses(c.id).map((sub, si) => (
                        <p key={sub.id} className="ml-8 mt-1 text-gray-700">
                          {String.fromCharCode(97 + si)}. <span className="underline">{sub.opening_phrase}</span> {sub.content};
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleExport("pdf")} disabled={exporting === "pdf"} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px] disabled:opacity-60">
                  {exporting === "pdf" ? "Generating PDF..." : "Download as PDF"}
                </button>
                <button onClick={() => handleExport("docx")} disabled={exporting === "docx"} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px] disabled:opacity-60">
                  {exporting === "docx" ? "Generating DOCX..." : "Export as Word"}
                </button>
                <button onClick={() => setShowShareModal(true)} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                  Share to Bloc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-bg-card w-full max-w-md rounded-card p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-jotia-bold text-lg text-text-primary">Share to Bloc</h3>
            <p className="text-sm text-text-dimmed font-jotia">Select a bloc to share this resolution draft to.</p>
            <select
              value={selectedBlocId}
              onChange={e => setSelectedBlocId(e.target.value)}
              className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary"
            >
              <option value="">Select a bloc...</option>
              {userBlocs.map(b => (
                <option key={b.bloc_id} value={b.bloc_id}>{b.blocs?.name}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowShareModal(false)} className="flex-1 px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">Cancel</button>
              <button onClick={handleShareToBloc} disabled={!selectedBlocId || sharing} className="flex-1 px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50">
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
