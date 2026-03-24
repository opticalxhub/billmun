'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input } from '@/components/ui';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/loading-spinner';
import { 
  Search, 
  BrainCircuit, MessageSquare, Save, TrendingUp 
} from 'lucide-react';

interface DelegateStat {
  id: string;
  delegate_id: string;
  full_name: string;
  country: string;
  pois_asked: number;
  pois_answered: number;
  opening_speech_words: number;
  opening_speech_minutes: number;
  performance_score: number;
  ai_performance_review?: string;
}

export function DelegateStatsSpreadsheet({ committee }: { committee: any }) {
  const [stats, setStats] = useState<DelegateStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [chatting, setChatting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (committee?.id) {
      fetchStats();
    }
  }, [committee?.id]);

  const fetchStats = async () => {
    setLoading(true);
    // Get delegates first
    const { data: delegates } = await supabase
      .from('committee_assignments')
      .select('user_id, country, users(id, full_name)')
      .eq('committee_id', committee.id);

    // Get existing stats
    const { data: existingStats } = await supabase
      .from('delegate_stats')
      .select('*')
      .eq('committee_id', committee.id);

    if (delegates) {
      const mergedStats = delegates.map((d: any) => {
        const existing = existingStats?.find(s => s.delegate_id === d.user_id);
        return {
          id: existing?.id || `temp-${d.user_id}`,
          delegate_id: d.user_id,
          full_name: d.users?.full_name || 'Unknown',
          country: d.country,
          pois_asked: existing?.pois_asked || 0,
          pois_answered: existing?.pois_answered || 0,
          opening_speech_words: existing?.opening_speech_words || 0,
          opening_speech_minutes: existing?.opening_speech_minutes || 0,
          performance_score: existing?.performance_score || 0,
          ai_performance_review: existing?.ai_performance_review
        };
      });
      setStats(mergedStats);
    }
    setLoading(false);
  };

  const updateStat = (delegateId: string, field: keyof DelegateStat, value: any) => {
    setStats(stats.map(s => s.delegate_id === delegateId ? { ...s, [field]: value } : s));
  };

  const saveStat = async (stat: DelegateStat) => {
    setSaving(stat.delegate_id);
    const payload = {
      committee_id: committee.id,
      delegate_id: stat.delegate_id,
      pois_asked: stat.pois_asked,
      pois_answered: stat.pois_answered,
      opening_speech_words: stat.opening_speech_words,
      opening_speech_minutes: stat.opening_speech_minutes,
      performance_score: stat.performance_score,
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase
      .from('delegate_stats')
      .upsert(payload, { onConflict: 'committee_id,delegate_id' });

    if (!error) {
      // Refresh to get the real ID if it was temp
      fetchStats();
    }
    setSaving(null);
  };

  const runAIReview = async (stat: DelegateStat) => {
    setChatting(stat.delegate_id);
    try {
      const response = await fetch('/api/chair/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DELEGATE_PERFORMANCE',
          content: {
            delegate: stat.full_name,
            country: stat.country,
            stats: {
              pois_asked: stat.pois_asked,
              pois_answered: stat.pois_answered,
              opening_speech_words: stat.opening_speech_words,
              opening_speech_minutes: stat.opening_speech_minutes,
              performance_score: stat.performance_score
            }
          }
        })
      });

      const result = await response.json();
      if (result.analysis) {
        await supabase
          .from('delegate_stats')
          .update({ ai_performance_review: result.analysis })
          .eq('delegate_id', stat.delegate_id)
          .eq('committee_id', committee.id);
        
        updateStat(stat.delegate_id, 'ai_performance_review', result.analysis);
      }
    } catch (err) {
      console.error('AI Performance Review failed', err);
    } finally {
      setChatting(null);
    }
  };

  const filteredStats = stats.filter(s => 
    s.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    s.country.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Delegate Performance Spreadsheet</h2>
          <p className="text-sm text-text-dimmed">Track POIs, speeches, and AI-powered performance metrics.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dimmed" />
          <Input 
            placeholder="Search delegates..." 
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-raised border-b border-border-subtle">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed">Delegate / Country</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed">POIs (Ask/Ans)</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed">Opening Speech</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed">Score</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed">AI Insights</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-dimmed text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-dimmed">
                    No delegates found in this committee.
                  </td>
                </tr>
              ) : (
                filteredStats.map((stat) => (
                  <tr key={stat.delegate_id} className="hover:bg-text-primary/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-text-primary">{stat.full_name}</div>
                      <div className="text-xs text-text-dimmed uppercase">{stat.country}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          className="w-16 h-8 text-center p-1" 
                          value={stat.pois_asked} 
                          onChange={e => updateStat(stat.delegate_id, 'pois_asked', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-text-dimmed">/</span>
                        <Input 
                          type="number" 
                          className="w-16 h-8 text-center p-1" 
                          value={stat.pois_answered} 
                          onChange={e => updateStat(stat.delegate_id, 'pois_answered', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-text-dimmed uppercase w-12">Words:</span>
                          <Input 
                            type="number" 
                            className="w-20 h-7 text-xs p-1" 
                            value={stat.opening_speech_words} 
                            onChange={e => updateStat(stat.delegate_id, 'opening_speech_words', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-text-dimmed uppercase w-12">Mins:</span>
                          <Input 
                            type="number" 
                            step="0.1"
                            className="w-20 h-7 text-xs p-1" 
                            value={stat.opening_speech_minutes} 
                            onChange={e => updateStat(stat.delegate_id, 'opening_speech_minutes', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          className="w-16 h-8 text-center p-1 font-bold text-primary" 
                          value={stat.performance_score} 
                          onChange={e => updateStat(stat.delegate_id, 'performance_score', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold text-text-dimmed">%</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {stat.ai_performance_review ? (
                        <div className="text-xs text-text-secondary line-clamp-3 bg-primary/5 p-2 rounded border border-primary/10 italic">
                          "&ldquo;{stat.ai_performance_review}&rdquo;"
                        </div>
                      ) : (
                        <span className="text-xs text-text-dimmed italic">No review yet</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => void runAIReview(stat)}
                          disabled={chatting === stat.delegate_id}
                          className="h-8 w-8 p-0"
                          title="Run AI Performance Analysis"
                        >
                          <BrainCircuit className={`w-4 h-4 text-primary ${chatting === stat.delegate_id ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => void saveStat(stat)}
                          disabled={saving === stat.delegate_id}
                          className="h-8 w-8 p-0"
                          title="Save Stats"
                        >
                          {saving === stat.delegate_id ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Performance Chatbot Overlay (Optional: could be a modal or side panel) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-bg-card to-bg-raised border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight">AI Performance Insights</h3>
              <p className="text-xs text-text-dimmed">Aggregated committee performance data and growth areas.</p>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5 min-h-[100px] flex items-center justify-center text-center">
            <div className="space-y-2">
              <BrainCircuit className="w-8 h-8 text-primary mx-auto opacity-50" />
              <p className="text-sm text-text-dimmed max-w-md">
                Select individual delegates above to run personalized AI performance reviews. The AI will analyze their POI activity and speech efficiency to provide actionable feedback.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-bg-raised border-border-subtle">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-dimmed uppercase font-bold">Total Delegates</span>
              <span className="text-lg font-bold">{stats.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-dimmed uppercase font-bold">Avg POIs</span>
              <span className="text-lg font-bold text-primary">
                {stats.length ? (stats.reduce((acc, s) => acc + s.pois_asked, 0) / stats.length).toFixed(1) : 0}
              </span>
            </div>
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-[10px] text-text-dimmed leading-relaxed">
                Performance scores and POI counts are synced in real-time across the committee dashboard.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
