'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { X, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui';

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
  const [sharing, setSharing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [saving, setSaving] = useState(false);

  // useQuery for Resolutions
  const { data: resolutions, isLoading: resolutionsLoading, isError: resolutionsError, refetch: refetchResolutions } = useQuery({
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
  const { data: userBlocs, isLoading: blocsLoading, isError: blocsError } = useQuery({
    queryKey: ['user-blocs', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloc_members')
        .select('bloc_id, blocs(name)')
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
  const { data: clauses, refetch: refetchClauses } = useQuery({
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
    setIsManual(res.is_manual || false);
    setManualContent(res.manual_content || '');
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
  if (resolutionsError || blocsError) {
    return <QueryErrorState message="Failed to load resolution data." onRetry={() => refetchResolutions()} />;
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
      toast.error(error.message);
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
    try {
      const { error } = await supabase.from('resolutions').delete().eq('id', id);
      if (error) throw error;
      if (selectedId === id) { 
        setSelectedId(null); 
      }
      refetchResolutions();
    } catch {
      toast.error('Failed to delete resolution');
    }
  };

  const addSponsor = () => {
    if (!sponsorInput.trim() || coSponsors.includes(sponsorInput.trim())) return;
    setCoSponsors([...coSponsors, sponsorInput.trim()]);
    setSponsorInput('');
  };

  const removeSponsor = (s: string) => setCoSponsors(coSponsors.filter(x => x !== s));

  const addClause = async () => {
    if (!addingPhrase || !selectedId || !addingType) return;
    const maxOrder = (clauses || [])
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
      toast.error(error.message);
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
    try {
      const { error } = await supabase.from('resolution_clauses').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['resolution-clauses', selectedId] });
    } catch {
      toast.error('Failed to delete clause');
    }
  };

  const moveClause = async (id: string, direction: -1 | 1) => {
    const clause = (clauses || []).find((c: Clause) => c.id === id);
    if (!clause) return;
    const siblings = (clauses || [])
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
      toast.success('Shared successfully to the bloc channel!');
      setShowShareModal(false);
      setSelectedBlocId("");
    } catch (e: any) {
      toast.error(e.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const preamClauses = (clauses || [])
    .filter((c: Clause) => c.type === 'PREAMBULATORY' && !c.parent_clause_id)
    .sort((a: Clause, b: Clause) => a.order_index - b.order_index);
  
  const opClauses = (clauses || [])
    .filter((c: Clause) => c.type === 'OPERATIVE' && !c.parent_clause_id)
    .sort((a: Clause, b: Clause) => a.order_index - b.order_index);

  const getSubClauses = (parentId: string) => 
    (clauses || [])
      .filter((c: Clause) => c.parent_clause_id === parentId)
      .sort((a: Clause, b: Clause) => a.order_index - b.order_index);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-jotia-bold text-xl text-text-primary">Resolution Builder</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGuide(true)}
            className="px-3 py-2 text-sm font-jotia bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-button hover:bg-blue-500/20 min-h-[44px]"
          >
            Guide
          </button>
          <button onClick={createResolution} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
            New Resolution
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Resolution List */}
        <div className="lg:w-64 shrink-0 space-y-2">
          {(resolutions || []).map(r => (
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

                <div className="flex gap-4 p-1 bg-bg-raised rounded-button border border-border-subtle w-max">
                  <button 
                    onClick={() => { setIsManual(false); setTimeout(saveResolution, 0); }}
                    className={`px-4 py-1.5 text-xs font-jotia-bold rounded-button transition-all ${!isManual ? 'bg-text-primary text-bg-base' : 'text-text-dimmed hover:text-text-primary'}`}
                  >
                    Builder Mode
                  </button>
                  <button 
                    onClick={() => { 
                      setIsManual(true); 
                      if (!manualContent) {
                        const committeeName = ctx.committee?.name || 'Committee Name';
                        const forumAbbr = ctx.committee?.abbreviation || 'N/A';
                        const sponsors = coSponsors.length > 0 ? coSponsors.join(', ') : '...';
                        setManualContent(`${committeeName}\n\nForum: ${forumAbbr}\nQuestion of: ${topic || '...'}\nSponsors: ${sponsors}\n\nThe ${committeeName},\n\n(Write your preambulatory and operative clauses here manually...)`);
                      }
                      setTimeout(saveResolution, 0);
                    }}
                    className={`px-4 py-1.5 text-xs font-jotia-bold rounded-button transition-all ${isManual ? 'bg-text-primary text-bg-base' : 'text-text-dimmed hover:text-text-primary'}`}
                  >
                    Manual Mode
                  </button>
                </div>

                {/* Co-Sponsors */}
                <div>
                  <label className="block text-text-dimmed font-jotia text-xs uppercase tracking-wider mb-2">Co-Sponsors</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {coSponsors.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-bg-raised border border-border-subtle rounded-full px-3 py-1 text-xs font-jotia text-text-primary">
                        {s}
                        <button onClick={() => removeSponsor(s)} className="text-text-dimmed hover:text-text-primary ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={sponsorInput} onChange={e => setSponsorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSponsor()} placeholder="Country name" className="flex-1 bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
                    <button onClick={addSponsor} className="px-3 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">Add</button>
                  </div>
                </div>
              </div>

              {isManual ? (
                <div className="bg-bg-card border border-border-subtle rounded-card p-6">
                   <h3 className="font-jotia-bold text-sm text-text-primary uppercase tracking-wider mb-4">Manual Resolution Text</h3>
                   <Textarea
                     value={manualContent}
                     onChange={(e) => setManualContent(e.target.value)}
                     onBlur={saveResolution}
                     rows={20}
                     className="font-mono text-sm leading-relaxed"
                     placeholder="Type your resolution here..."
                   />
                </div>
              ) : (
                <div className="space-y-4">
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
                              <button onClick={() => moveClause(c.id, -1)} className="text-xs text-text-dimmed px-1"><ChevronUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => moveClause(c.id, 1)} className="text-xs text-text-dimmed px-1"><ChevronDown className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteClause(c.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text px-1"><X className="w-3.5 h-3.5" /></button>
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
                                <button onClick={() => moveClause(c.id, -1)} className="text-xs text-text-dimmed px-1"><ChevronUp className="w-3.5 h-3.5" /></button>
                                <button onClick={() => moveClause(c.id, 1)} className="text-xs text-text-dimmed px-1"><ChevronDown className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { setAddingType('OPERATIVE'); setAddingParent(c.id); }} className="text-xs text-text-dimmed px-1" title="Add sub-clause"><Plus className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteClause(c.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text px-1"><X className="w-3.5 h-3.5" /></button>
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
                                <button onClick={() => deleteClause(sub.id)} className="hidden group-hover:block text-xs text-text-dimmed hover:text-status-rejected-text px-1"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
              <div className={`bg-[#0A0A0A] text-[#E5E5E5] border border-border-subtle rounded-card p-10 ${showPreview ? 'block' : 'hidden lg:block'} shadow-2xl`}>
                <div className="text-center mb-10 border-b border-border-subtle pb-8">
                  <h1 className="text-lg font-bold uppercase tracking-widest text-[#FFFFFF]">{ctx.committee?.name || 'Committee'}</h1>
                  <div className="mt-4 space-y-1 text-sm font-jotia opacity-80">
                    <p>Forum: <span className="text-[#FFFFFF]">{ctx.committee?.abbreviation || 'N/A'}</span></p>
                    <p>Question of: <span className="text-[#FFFFFF]">{topic || '...'}</span></p>
                    <p>Sponsors: <span className="text-[#FFFFFF] font-medium">{coSponsors.join(', ') || '...'}</span></p>
                  </div>
                </div>
                
                <div className="text-sm font-jotia leading-loose space-y-6">
                  {isManual ? (
                    <div className="whitespace-pre-wrap whitespace-pre-line text-justify">
                      {manualContent}
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-[#FFFFFF]">The {ctx.committee?.name || 'Committee'},</p>
                      <div className="space-y-4">
                        {preamClauses.map((c, i) => (
                          <p key={c.id} className="italic text-justify">
                            <span className="not-italic underline font-medium text-[#FFFFFF]">{c.opening_phrase}</span> {c.content}{i < preamClauses.length - 1 ? ',' : ','}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-6 pt-4">
                        {opClauses.map((c, i) => (
                          <div key={c.id} className="relative">
                            <p className="text-justify">
                              <span className="inline-block w-6 font-bold text-[#FFFFFF]">{i + 1}.</span>
                              <span className="underline font-bold text-[#FFFFFF]">{c.opening_phrase}</span> {c.content};
                            </p>
                            <div className="ml-10 mt-3 space-y-2">
                              {getSubClauses(c.id).map((sub, si) => (
                                <p key={sub.id} className="opacity-90 text-justify">
                                  <span className="inline-block w-6 font-medium">{String.fromCharCode(97 + si)}.</span>
                                  <span className="underline font-medium">{sub.opening_phrase}</span> {sub.content};
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-12 text-center border-t border-border-subtle pt-6">
                  <p className="text-[10px] uppercase tracking-tighter opacity-30">Formal Document Generated by BILLMUN 2026 Portal</p>
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
              {(userBlocs || []).map(b => (
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

      {/* Resolution Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setShowGuide(false)}>
          <div className="bg-bg-card w-full max-w-4xl max-h-[90vh] rounded-card p-6 space-y-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-jotia-bold text-2xl text-text-primary">How to Write a Resolution</h2>
              <button onClick={() => setShowGuide(false)} className="text-text-dimmed hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">Basics of a Resolution</h3>
                <div className="space-y-3 text-text-secondary">
                  <p><strong>Who:</strong> Any delegate in the committee can write a resolution. The author is called a sponsor. Most resolutions have multiple sponsors because it takes a group of countries to share good ideas and come to a consensus.</p>
                  <p><strong>What:</strong> A resolution is a document that contains all the issues the committee wants to solve and the proposed solutions. It&apos;s called a resolution because that&apos;s what the United Nations calls their documents.</p>
                  <p><strong>When/Where:</strong> Most conferences require students to write resolutions during the conference, usually during unmoderated caucus where delegates can collaborate freely.</p>
                  <p><strong>Why:</strong> The ultimate purpose of a committee session is to pass a resolution. All speeches, debate, negotiation, and teamwork leads to resolutions containing proposed solutions.</p>
                </div>
              </section>

              <section>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">Resolution Structure</h3>
                <p className="text-text-secondary mb-3">A resolution has three main parts: the heading, the preambulatory clauses, and the operative clauses.</p>
                
                <div className="space-y-4">
                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">1. Heading</h4>
                    <p className="text-text-secondary text-xs">Contains: Committee name, sponsors, signatories, and topic. The sponsors are the authors. Signatories are delegates who want to see it debated but don&apos;t necessarily agree with it.</p>
                  </div>

                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">2. Preambulatory Clauses</h4>
                    <p className="text-text-secondary text-xs mb-2">States all the issues the committee wants to resolve. May include:</p>
                    <ul className="text-xs text-text-secondary list-disc list-inside space-y-1">
                      <li>Past UN resolutions, treaties, or conventions</li>
                      <li>Regional, non-governmental, or national efforts</li>
                      <li>References to UN Charter or international frameworks</li>
                      <li>Statements by the Secretary-General or UN bodies</li>
                      <li>General background information and facts</li>
                    </ul>
                    <p className="text-xs text-text-tertiary mt-2">Strategy: Fewer preambulatory clauses than operative clauses. More operative clauses show you have more solutions than problems.</p>
                  </div>

                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">3. Operative Clauses</h4>
                    <p className="text-text-secondary text-xs mb-2">State the solutions the sponsors propose. These should address issues mentioned in preambulatory clauses.</p>
                    <p className="text-xs text-text-tertiary">Strategy: Add details to strengthen each clause. Answer &quot;who, what, when, where, why, and how&quot; for each resolution.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">Writing Clauses</h3>
                
                <div className="space-y-4">
                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Preambulatory Format</h4>
                    <p className="text-text-secondary text-xs">Take a statement + preambulatory phrase + comma</p>
                    <div className="bg-bg-base rounded p-2 mt-2 font-mono text-xs">
                      <em className="underline">Alarmed by</em> the 17% increase in HIV/AIDS contraction among sub-Saharan African countries in the past five years,
                    </div>
                  </div>

                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Operative Format</h4>
                    <p className="text-text-secondary text-xs">Take a solution + operative phrase + semicolon (final clause ends with period)</p>
                    <div className="bg-bg-base rounded p-2 mt-2 font-mono text-xs">
                      1. <span className="underline">Calls upon</span> the developed countries and major pharmaceutical countries to provide low-cost, generic medicines for HIV/AIDS to sub-Saharan African countries;
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">Common Phrases</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Preambulatory Phrases</h4>
                    <div className="text-xs text-text-secondary space-y-1">
                      <div>- Affirming, Alarmed by, Approving</div>
                      <div>- Believing, Cognizant of, Confident</div>
                      <div>- Deeply concerned, Deeply convinced</div>
                      <div>- Emphasizing, Expecting, Fulfilling</div>
                      <div>- Guided by, Having adopted, Noting</div>
                      <div>- Realizing, Recalling, Recognizing</div>
                    </div>
                  </div>

                  <div className="bg-bg-raised rounded-card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Operative Phrases</h4>
                    <div className="text-xs text-text-secondary space-y-1">
                      <div>- Accepts, Affirms, Approves, Authorizes</div>
                      <div>- Calls for, Calls upon, Commends</div>
                      <div>- Condemns, Confirms, Congratulates</div>
                      <div>- Declares, Demands, Deplores</div>
                      <div>- Encourages, Endorses, Expresses</div>
                      <div>- Invites, Notes, Recommends, Urges</div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-jotia-bold text-lg text-text-primary mb-3">Quick Tips</h3>
                <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
                  <li>A resolution is one long sentence - beginning with title, ending with final period</li>
                  <li>Preambulatory clauses end with commas, operative clauses end with semicolons</li>
                  <li>Only the final operative clause ends with a period</li>
                  <li>Operative clauses are numbered, preambulatory clauses are not</li>
                  <li>Use formal, diplomatic language throughout</li>
                  <li>Be specific and actionable in your operative clauses</li>
                  <li>Ensure operative clauses address issues mentioned in preambulatory clauses</li>
                </ul>
              </section>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button onClick={() => setShowGuide(false)} className="px-6 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
