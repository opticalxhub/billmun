'use client';

import React, { useState, useEffect } from 'react';
import { Card, SectionLabel, Input, Textarea, Badge, Select } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Search, Plus, Users, FileText, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';

interface Bloc {
  id: string;
  name: string;
  resolution_topic: string;
  stance: string;
  members: string[]; // country names
  supporting_countries: string[];
  opposing_countries: string[];
  ai_analysis?: string;
}

export function PointsSystem({ committee }: { committee: any }) {
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBloc, setShowAddBloc] = useState(false);
  const [newBloc, setNewBloc] = useState<Partial<Bloc>>({
    name: '',
    resolution_topic: '',
    stance: '',
    members: [],
    supporting_countries: [],
    opposing_countries: []
  });
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
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
      fetchBlocs();
    }
  }, [committee?.id]);

  const fetchBlocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('committee_blocs')
      .select('*')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBlocs(data);
    }
    setLoading(false);
  };

  const handleAddBloc = async () => {
    if (!newBloc.name || !committee?.id) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('committee_blocs')
        .insert([{
          ...newBloc,
          committee_id: committee.id,
        }])
        .select()
        .single();

      if (!error && data) {
        setBlocs([data, ...blocs]);
        setShowAddBloc(false);
        setNewBloc({
          name: '',
          resolution_topic: '',
          stance: '',
          members: [],
          supporting_countries: [],
          opposing_countries: []
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const filteredBlocs = blocs.filter(b => 
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.resolution_topic.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.stance.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const runAIAnalysis = async (blocId: string) => {
    setAnalyzing(blocId);
    try {
      const bloc = blocs.find(b => b.id === blocId);
      if (!bloc) return;

      const response = await fetch('/api/chair/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BLOC_RELEVANCE',
          content: {
            topic: bloc.resolution_topic,
            stance: bloc.stance,
            committee_topic: committee.topic_a // assuming committee has topic_a
          }
        })
      });

      const result = await response.json();
      if (result.analysis) {
        await supabase
          .from('committee_blocs')
          .update({ ai_analysis: result.analysis })
          .eq('id', blocId);
        
        setBlocs(blocs.map(b => b.id === blocId ? { ...b, ai_analysis: result.analysis } : b));
      }
    } catch (err) {
      console.error('AI Analysis failed', err);
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Blocs & Resolutions</h2>
          <p className="text-sm text-text-dimmed">Manage committee blocs, their resolutions, and stances.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dimmed" />
            <Input 
              placeholder="Search blocs..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddBloc(!showAddBloc)}>
            <Plus className="w-4 h-4 mr-2" />
            {showAddBloc ? 'Cancel' : 'New Bloc'}
          </Button>
        </div>
      </div>

      {showAddBloc && (
        <Card className="p-6 border-2 border-primary/20 animate-in fade-in slide-in-from-top-4">
          <SectionLabel>Create New Bloc</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-dimmed">Bloc Name</label>
              <Input 
                placeholder="e.g. The Western Bloc" 
                value={newBloc.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBloc({...newBloc, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-dimmed">Resolution Topic</label>
              <Input 
                placeholder="What is their resolution about?" 
                value={newBloc.resolution_topic} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBloc({...newBloc, resolution_topic: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-dimmed">Their Stance</label>
              <Textarea 
                placeholder="What is their general position on the topic?" 
                value={newBloc.stance} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBloc({...newBloc, stance: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleAddBloc} loading={adding}>Create Bloc</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredBlocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-dimmed border-2 border-dashed border-border-subtle rounded-3xl opacity-50 bg-bg-raised/30">
            <div className="space-y-3">
              <Users className="w-12 h-12 text-text-tertiary mx-auto opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">
                {searchTerm ? 'No matching blocs found' : 'No blocs registered yet'}
              </p>
              <p className="text-[10px] text-text-dimmed max-w-[200px] mx-auto">
                {searchTerm ? 'Try a different search term.' : 'Start tracking committee groupings and resolution progress by adding your first bloc.'}
              </p>
            </div>
          </div>
        ) : (
          filteredBlocs.map((bloc) => (
            <Card key={bloc.id} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => void runAIAnalysis(bloc.id)}
                  disabled={analyzing === bloc.id}
                >
                  <BrainCircuit className={`w-4 h-4 mr-2 ${analyzing === bloc.id ? 'animate-pulse' : ''}`} />
                  AI Analyze
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold uppercase">{bloc.name}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-dimmed uppercase">
                    <FileText className="w-4 h-4" />
                    Resolution Topic
                  </div>
                  <p className="text-sm bg-bg-raised p-2 rounded-md border border-border-subtle">
                    {bloc.resolution_topic || 'Not specified'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-text-dimmed uppercase">Stance</div>
                  <p className="text-sm italic text-text-secondary leading-relaxed">
                    "{bloc.stance || 'No stance recorded yet.'}"
                  </p>
                </div>

                {bloc.ai_analysis && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                      <BrainCircuit className="w-3 h-3" />
                      AI Insights
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed">
                      {bloc.ai_analysis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                      <CheckCircle2 className="w-3 h-3" />
                      Supporting
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bloc.supporting_countries?.length > 0 ? (
                        bloc.supporting_countries.map((c, i) => (
                          <Badge key={i} variant="approved" className="text-[10px]">{c}</Badge>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-dimmed italic">None</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-status-rejected-text uppercase">
                      <XCircle className="w-3 h-3" />
                      Opposing
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bloc.opposing_countries?.length > 0 ? (
                        bloc.opposing_countries.map((c, i) => (
                          <Badge key={i} variant="rejected" className="text-[10px]">{c}</Badge>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-dimmed italic">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
