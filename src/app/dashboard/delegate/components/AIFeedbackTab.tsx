'use client';

import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';

const LOADING_MESSAGES = [
  'Reading your argument structure',
  'Evaluating policy alignment',
  'Cross-referencing research depth',
  'Drafting inline annotations',
  'Finalizing your feedback report',
];

function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border-subtle)" strokeWidth="6" fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--text-primary)" strokeWidth="6" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-jotia-bold text-text-primary" style={{ fontSize: size > 80 ? '1.5rem' : '0.875rem' }}>{score}%</span>
        </div>
      </div>
      {label && <p className="text-text-dimmed font-jotia text-xs mt-2 text-center">{label}</p>}
    </div>
  );
}

export default function AIFeedbackTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();

  // useQuery for Documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['delegate-documents-ai', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('id, title, type').eq('user_id', ctx.user.id).eq('type', 'POSITION_PAPER');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Past Analyses
  const { data: pastAnalyses = [], isLoading: pastAnalysesLoading } = useQuery({
    queryKey: ['delegate-ai-analyses', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_feedback').select('*').eq('user_id', ctx.user.id).order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const [selectedDocId, setSelectedDocId] = useState<string>('paste');
  const [pasteText, setPasteText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  const usedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return ctx.user.ai_analyses_reset_date === today ? (ctx.user.ai_analyses_today || 0) : 0;
  }, [ctx.user]);

  if (documentsLoading || pastAnalysesLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  const runAnalysis = async () => {
    if (usedToday >= 10) { alert('You have reached your daily limit of 10 analyses.'); return; }

    if (selectedDocId === 'paste' && !pasteText.trim()) {
      alert('Please paste text to analyze.');
      return;
    }
    if (selectedDocId !== 'paste') {
      const doc = documents.find(d => d.id === selectedDocId);
      if (!doc) return;
    }

    setAnalyzing(true);
    setLoadingMsgIdx(0);
    setLoadingProgress(0);
    setResult(null);

    // Cycle loading messages
    const msgInterval = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    // Progress bar
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 1, 95));
    }, 125);

    try {
      const response = await fetch('/api/delegate/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedDocId === 'paste'
            ? { document_id: null, text: pasteText }
            : { document_id: selectedDocId, text: '' },
        ),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['delegate-ai-analyses', ctx.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    } catch (err: any) {
      alert(err.message || 'Analysis failed');
    } finally {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => setAnalyzing(false), 300);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-jotia-bold text-xl text-text-primary">AI Document Analysis</h2>
        <p className="text-text-dimmed font-jotia text-sm mt-1">Get AI-powered feedback on your position papers and documents.</p>
      </div>

      {/* Source Selector */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6 space-y-4">
        <div>
          <label className="block text-text-primary font-jotia text-sm mb-2">Select Document or Paste Text</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary focus:border-text-primary transition-colors"
          >
            <option value="paste">Paste Text</option>
            {documents.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>

        {selectedDocId === 'paste' && (
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your position paper text here..."
            className="w-full h-48 bg-bg-raised border border-border-input rounded-input px-3 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
          />
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={runAnalysis}
            disabled={analyzing || usedToday >= 10}
            className="px-6 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          <span className="text-text-dimmed font-jotia text-xs">{usedToday} of 10 analyses used today</span>
        </div>
      </div>

      {/* Loading State */}
      {analyzing && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-8 text-center space-y-4">
          <div className="h-6 flex items-center justify-center">
            <p className="text-text-primary font-jotia text-sm animate-pulse" key={loadingMsgIdx}>
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
          <div className="w-full max-w-md mx-auto bg-bg-raised rounded-full h-1.5">
            <div className="bg-text-primary h-1.5 rounded-full transition-all duration-200" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-6 animate-fade-in">
          {/* Overall Score */}
          <div className="bg-bg-card border border-border-subtle rounded-card p-6 flex flex-col items-center">
            <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Overall Score</h3>
            <div className="relative">
              <ScoreRing score={result.overall_score || 0} size={140} />
            </div>
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Argument Strength', key: 'argument_strength' },
              { label: 'Diplomatic Language', key: 'diplomatic_language' },
              { label: 'Structural Clarity', key: 'writing_clarity' },
              { label: 'Policy Alignment', key: 'policy_alignment' },
              { label: 'Format', key: 'format_adherence' },
              { label: 'Persuasiveness', key: 'persuasiveness' },
            ].map(s => (
              <div key={s.key} className="bg-bg-card border border-border-subtle rounded-card p-4 flex flex-col items-center">
                <div className="relative">
                  <ScoreRing score={result[s.key] || 0} size={70} />
                </div>
                <p className="text-text-dimmed font-jotia text-xs mt-2 text-center">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Strengths', items: result.strengths || [], color: 'border-green-500/30' },
              { title: 'Weaknesses', items: result.weaknesses || [], color: 'border-red-500/30' },
              { title: 'Suggestions', items: result.suggestions || [], color: 'border-yellow-500/30' },
            ].map(col => (
              <div key={col.title} className={`bg-bg-card border-l-2 ${col.color} border border-border-subtle rounded-card p-4`}>
                <h4 className="font-jotia-bold text-sm text-text-primary mb-3">{col.title}</h4>
                <div className="space-y-2">
                  {col.items.length === 0 ? (
                    <p className="text-text-dimmed font-jotia text-xs">None identified.</p>
                  ) : (
                    col.items.map((item: string, i: number) => (
                      <p key={i} className="text-text-dimmed font-jotia text-sm leading-relaxed">{item}</p>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Annotated Document */}
          {result.annotated_segments && Array.isArray(result.annotated_segments) && result.annotated_segments.length > 0 && (
            <div className="bg-bg-card border border-border-subtle rounded-card p-6">
              <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Annotated Document</h3>
              <div className="font-jotia text-sm text-text-dimmed leading-relaxed space-y-1">
                {result.annotated_segments.map((seg: any, i: number) => (
                  <span key={i} className="group relative inline" style={{ backgroundColor: seg.highlight ? `rgba(240, 237, 230, ${0.05 + (seg.severity || 0.1) * 0.15})` : 'transparent' }}>
                    {seg.text}
                    {seg.comment && (
                      <span className="hidden group-hover:block absolute bottom-full left-0 bg-bg-raised border border-border-subtle rounded-card p-2 text-xs text-text-primary shadow-modal z-10 max-w-xs whitespace-normal">
                        {seg.comment}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Detection */}
          {result.ai_detection_score !== undefined && (
            <div className="bg-bg-card border border-border-subtle rounded-card p-6">
              <h3 className="font-jotia-bold text-lg text-text-primary mb-2">AI Detection</h3>
              <p className="text-text-dimmed font-jotia text-sm">
                Estimated AI-generated likelihood: <span className="text-text-primary font-jotia-bold">{result.ai_detection_score}%</span>
              </p>
              {result.ai_detection_phrases && result.ai_detection_phrases.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-text-tertiary font-jotia text-xs">Flagged phrases:</p>
                  {result.ai_detection_phrases.map((phrase: string, i: number) => (
                    <p key={i} className="text-text-dimmed font-jotia text-xs italic bg-bg-raised rounded px-2 py-1 inline-block mr-2 mb-1">&ldquo;{phrase}&rdquo;</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past Analyses */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-6">
        <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Past Analyses</h3>
        {pastAnalyses.length === 0 ? (
          <p className="text-text-dimmed font-jotia text-sm">No previous analyses.</p>
        ) : (
          <div className="space-y-2">
            {pastAnalyses.map(a => (
              <div key={a.id}>
                <button
                  onClick={() => setExpandedAnalysis(expandedAnalysis === a.id ? null : a.id)}
                  className="w-full flex items-center justify-between bg-bg-raised rounded-card p-3 hover:bg-bg-hover transition-colors min-h-[44px]"
                >
                  <div className="text-left">
                    <p className="font-jotia text-text-primary text-sm">Score: {a.overall_score}%</p>
                    <p className="font-jotia text-text-tertiary text-xs">{new Date(a.generated_at).toLocaleString()}</p>
                  </div>
                  <span className="text-text-dimmed text-sm">{expandedAnalysis === a.id ? '−' : '+'}</span>
                </button>
                {expandedAnalysis === a.id && (
                  <div className="bg-bg-raised/50 rounded-b-card p-4 space-y-3 animate-fade-in">
                    <p className="font-jotia text-text-dimmed text-sm">{a.summary}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-text-tertiary font-jotia">Argument:</span> <span className="text-text-primary">{a.argument_strength}%</span></div>
                      <div><span className="text-text-tertiary font-jotia">Research:</span> <span className="text-text-primary">{a.research_depth}%</span></div>
                      <div><span className="text-text-tertiary font-jotia">Policy:</span> <span className="text-text-primary">{a.policy_alignment}%</span></div>
                      <div><span className="text-text-tertiary font-jotia">Clarity:</span> <span className="text-text-primary">{a.writing_clarity}%</span></div>
                      <div><span className="text-text-tertiary font-jotia">Format:</span> <span className="text-text-primary">{a.format_adherence}%</span></div>
                      <div><span className="text-text-tertiary font-jotia">Persuasion:</span> <span className="text-text-primary">{a.persuasiveness || 0}%</span></div>
                    </div>
                    {a.strengths && a.strengths.length > 0 && (
                      <div>
                        <p className="text-text-tertiary font-jotia text-xs mb-1">Strengths:</p>
                        {a.strengths.map((s: string, i: number) => <p key={i} className="text-text-dimmed font-jotia text-xs">- {s}</p>)}
                      </div>
                    )}
                    {a.weaknesses && a.weaknesses.length > 0 && (
                      <div>
                        <p className="text-text-tertiary font-jotia text-xs mb-1">Weaknesses:</p>
                        {a.weaknesses.map((w: string, i: number) => <p key={i} className="text-text-dimmed font-jotia text-xs">- {w}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
