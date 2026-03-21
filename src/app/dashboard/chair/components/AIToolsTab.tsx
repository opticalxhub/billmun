'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

type Tool = 'working_paper' | 'debate_quality' | 'speech_evaluator';

export default function AIToolsTab({ ctx }: { ctx: ChairContext }) {
  const [activeTool, setActiveTool] = useState<Tool>('working_paper');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

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

  const TOOLS: { key: Tool; label: string; desc: string }[] = [
    { key: 'working_paper', label: 'Working Paper Analyzer', desc: 'AI detection, clause analysis, improvement suggestions' },
    { key: 'debate_quality', label: 'Debate Quality Analyzer', desc: 'Debate substance, contributor analysis, recommendations' },
    { key: 'speech_evaluator', label: 'Speech Evaluator', desc: 'Argument strength, diplomacy, persuasiveness scoring' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-jotia-bold text-2xl text-text-primary">AI Tools</h2>
        <p className="text-text-dimmed text-sm">Three AI-powered analysis tools for committee management</p>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TOOLS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTool(t.key); setResult(null); setInput(''); }}
            className={`p-4 rounded-card border text-left transition-all ${
              activeTool === t.key
                ? 'bg-text-primary/5 border-text-primary/30 ring-1 ring-text-primary/20'
                : 'bg-bg-raised border-border-subtle hover:border-border-emphasized'
            }`}
          >
            <p className={`text-sm font-bold ${activeTool === t.key ? 'text-text-primary' : 'text-text-secondary'}`}>{t.label}</p>
            <p className="text-xs text-text-dimmed mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Input */}
      <Card>
        <SectionLabel>
          {activeTool === 'working_paper' && 'Paste Working Paper Text'}
          {activeTool === 'debate_quality' && 'Paste Debate Transcript or Summary'}
          {activeTool === 'speech_evaluator' && "Paste Delegate's Speech"}
        </SectionLabel>
        <Textarea
          rows={8}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            activeTool === 'working_paper' ? 'Paste the full working paper or resolution text here...'
            : activeTool === 'debate_quality' ? 'Paste a summary or transcript of the debate...'
            : "Paste the delegate's speech text here..."
          }
        />
        <Button onClick={analyze} disabled={loading || !input.trim()} className="mt-4 w-full min-h-[48px]">
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </Card>

      {/* Results */}
      {result?.error ? (
        <Card>
          <p className="text-sm text-status-rejected-text">{result.error}</p>
        </Card>
      ) : result ? (
        <Card>
          <SectionLabel>{result.type}</SectionLabel>
          <div className="space-y-4">
            {(result.sections || []).map((s: any, i: number) => (
              <div key={i} className="p-4 bg-bg-raised rounded-card border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">{s.label}</span>
                  <span className="text-sm font-bold text-text-primary">{s.value}</span>
                </div>
                <p className="text-xs text-text-dimmed">{s.description}</p>
              </div>
            ))}

            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">Suggestions</p>
                <ul className="space-y-1">
                  {result.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-text-tertiary shrink-0 mt-0.5">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <SectionLabel>Analysis History</SectionLabel>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="p-3 bg-bg-raised rounded-card border border-border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary font-medium">{h.summary?.substring(0, 80) || h.tool || 'Analysis'}</span>
                  <span className="text-xs text-text-dimmed">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                {h.score && <span className="text-xs text-text-dimmed">Score: {h.score}/100</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
