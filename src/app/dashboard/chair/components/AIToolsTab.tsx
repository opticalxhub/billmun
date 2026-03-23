'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Card, SectionLabel, Textarea, Select } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import type { ChairContext } from '../page';
import { 
  FileText, 
  BrainCircuit, 
  Send, 
  History, 
  TrendingUp, 
  MessageSquare, 
  Plus 
} from 'lucide-react';

type Tool = 'working_paper' | 'debate_quality' | 'speech_evaluator' | 'suggest_resolution';

export default function AIToolsTab({ ctx }: { ctx: ChairContext }) {
  const [activeTool, setActiveTool] = useState<Tool>('working_paper');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');

  const { data: documents = [] } = useQuery({
    queryKey: ['committee-documents-ai', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, file_url, mime_type, user:user_id(full_name)')
        .eq('committee_id', ctx.committee.id)
        .order('uploaded_at', { ascending: false });
      return data || [];
    },
  });

  const loadDocumentText = async (docId: string) => {
    const doc = documents.find((d: any) => d.id === docId);
    if (!doc) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/extract-text?url=${encodeURIComponent(doc.file_url)}&mime=${encodeURIComponent(doc.mime_type)}`);
      const data = await response.json();
      if (data.text) {
        setInput(prev => prev ? `${prev}\n\n--- ${doc.title} ---\n${data.text}` : data.text);
      }
    } catch (err) {
      console.error('Failed to extract text', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [ctx.committee?.id]);

  const loadHistory = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('chair_ai_runs')
      .select('*')
      .eq('chair_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const endpoint = activeTool === 'working_paper' ? '/api/chair/ai-analyze'
        : activeTool === 'debate_quality' ? '/api/chair/ai-debate'
        : activeTool === 'suggest_resolution' ? '/api/chair/ai-suggest'
        : '/api/chair/ai-speech';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          committee_id: ctx.committee?.id,
          tool: activeTool,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analysis failed');
      setResult(data);
      await loadHistory();
    } catch (err: any) {
      setResult({ error: err?.message || 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  const TOOLS: { key: Tool; label: string; desc: string; icon: any }[] = [
    { key: 'working_paper', label: 'Working Paper Analyzer', desc: 'AI detection, clause analysis, suggestions', icon: FileText },
    { key: 'debate_quality', label: 'Debate Quality Analyzer', desc: 'Debate substance, contributor analysis', icon: TrendingUp },
    { key: 'speech_evaluator', label: 'Speech Evaluator', desc: 'Argument strength, diplomacy, persuasiveness', icon: MessageSquare },
    { key: 'suggest_resolution', label: 'AI Resolution Suggestor', desc: 'Generate operative clauses and policy ideas', icon: BrainCircuit },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-jotia text-2xl text-text-primary uppercase tracking-tight">AI Chair Assistant</h2>
          <p className="text-text-dimmed text-sm">Advanced intelligence tools to facilitate committee progress.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {TOOLS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTool(t.key); setResult(null); setInput(''); }}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
              activeTool === t.key
                ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5'
                : 'bg-bg-raised border-border-subtle hover:border-border-emphasized'
            }`}
          >
            <div className={`p-2 rounded-lg w-fit mb-3 transition-colors ${activeTool === t.key ? 'bg-primary text-white' : 'bg-bg-card text-text-dimmed group-hover:text-text-primary'}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <p className={`text-sm font-bold uppercase tracking-tight ${activeTool === t.key ? 'text-text-primary' : 'text-text-secondary'}`}>{t.label}</p>
            <p className="text-[10px] text-text-dimmed mt-1 leading-relaxed">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Input Area */}
        <div className="xl:col-span-7 space-y-4">
          <Card className="relative">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel className="mb-0">
                {activeTool === 'working_paper' && 'Input Draft Content'}
                {activeTool === 'debate_quality' && 'Input Debate Summary'}
                {activeTool === 'speech_evaluator' && "Input Delegate Speech"}
                {activeTool === 'suggest_resolution' && "Input Context / Topics"}
              </SectionLabel>
              <div className="flex items-center gap-2">
                <Select 
                  className="h-8 text-[10px] w-40"
                  value={selectedDocId}
                  onChange={e => setSelectedDocId(e.target.value)}
                >
                  <option value="">Insert delegate doc...</option>
                  {documents.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.title} ({d.user?.full_name})</option>
                  ))}
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2"
                  disabled={!selectedDocId || loading}
                  onClick={() => void loadDocumentText(selectedDocId)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <Textarea
              rows={12}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="bg-black/20 font-mono text-xs leading-relaxed"
              placeholder={
                activeTool === 'working_paper' ? 'Paste draft text or insert delegate documents to analyze...'
                : activeTool === 'debate_quality' ? 'Describe current points of contention or paste a transcript...'
                : activeTool === 'suggest_resolution' ? 'What are the main goals of the current bloc? I can suggest operative clauses...'
                : "Paste a speech for evaluation..."
              }
            />
            
            <Button 
              onClick={analyze} 
              disabled={loading || !input.trim()} 
              className="mt-4 w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {loading ? <LoadingSpinner size="sm" /> : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Execute AI Analysis</span>
                </div>
              )}
            </Button>
          </Card>
        </div>

        {/* Results Area */}
        <div className="xl:col-span-5 space-y-4">
          {result?.error ? (
            <Card className="border-status-rejected-border bg-status-rejected-bg/10">
              <p className="text-sm text-status-rejected-text font-medium">{result.error}</p>
            </Card>
          ) : result ? (
            <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <SectionLabel className="mb-0">{result.type}</SectionLabel>
                <div className="text-2xl font-black text-primary">{result.score || 0}%</div>
              </div>
              
              <div className="space-y-4">
                {(result.sections || []).map((s: any, i: number) => (
                  <div key={i} className="p-4 bg-bg-raised rounded-xl border border-border-subtle hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{s.label}</span>
                      <span className="text-sm font-black text-primary">{s.value}</span>
                    </div>
                    <p className="text-xs text-text-dimmed leading-relaxed">{s.description}</p>
                  </div>
                ))}

                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                      <BrainCircuit className="w-3 h-3 text-primary" />
                      Strategic Recommendations
                    </p>
                    <div className="space-y-2">
                      {result.suggestions.map((s: string, i: number) => (
                        <div key={i} className="text-xs text-text-secondary bg-white/5 p-3 rounded-lg border border-white/5 flex gap-3">
                          <span className="text-primary font-bold">{i+1}.</span>
                          <p className="leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 mt-4 border-t border-border-subtle">
                  <p className="text-[10px] text-text-dimmed uppercase font-bold mb-2">Executive Summary</p>
                  <p className="text-xs text-text-secondary italic leading-relaxed">
                    "{result.summary}"
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border-subtle rounded-3xl opacity-50">
              <History className="w-12 h-12 text-text-tertiary mb-4" />
              <p className="text-sm text-text-dimmed text-center">Results will appear here after execution.</p>
            </div>
          )}

          {/* Mini History */}
          {history.length > 0 && (
            <Card className="bg-bg-raised/50">
              <SectionLabel className="text-xs">Recent Runs</SectionLabel>
              <div className="space-y-2">
                {history.slice(0, 3).map(h => (
                  <div key={h.id} className="p-2 bg-bg-card rounded-lg border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[10px] text-text-primary font-bold uppercase truncate max-w-[120px]">{h.tool?.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[9px] text-text-dimmed">{new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
