'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChairContext } from '../page';
import { Card, SectionLabel } from '@/components/ui';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { Users, MessageSquare, Eye, ArrowLeft } from 'lucide-react';

export default function BlocsTab({ ctx }: { ctx: ChairContext }) {
  const queryClient = useQueryClient();
  const [selectedBloc, setSelectedBloc] = useState<any>(null);
  const [blocTab, setBlocTab] = useState<'overview' | 'members' | 'messages'>('overview');

  // useQuery for all committee blocs
  const { data: blocs = [], isLoading: blocsLoading, isError: blocsError, refetch: refetchBlocs } = useQuery({
    queryKey: ['committee-blocs', ctx.committee?.id],
    enabled: !!ctx.committee?.id,
    queryFn: async () => {
      // Fetch blocs with members (separate messages query to avoid RLS join failures)
      const { data, error } = await supabase
        .from('blocs')
        .select(`
          *,
          bloc_members(
            id,
            user_id,
            joined_at,
            users(full_name, allocated_country)
          )
        `)
        .eq('committee_id', ctx.committee.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const blocs = data || [];

      // Fetch message counts per bloc separately (resilient to RLS)
      const blocIds = blocs.map((b: any) => b.id);
      if (blocIds.length > 0) {
        const { data: msgs } = await supabase
          .from('bloc_messages')
          .select('bloc_id, id')
          .in('bloc_id', blocIds);
        const msgCounts: Record<string, number> = {};
        (msgs || []).forEach((m: any) => { msgCounts[m.bloc_id] = (msgCounts[m.bloc_id] || 0) + 1; });
        blocs.forEach((b: any) => { b._message_count = msgCounts[b.id] || 0; });
      }

      return blocs;
    },
    staleTime: 30 * 1000,
  });

  // useQuery for Bloc Messages (when selected)
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['bloc-messages', selectedBloc?.id],
    enabled: !!selectedBloc?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('bloc_messages')
        .select('*, users(full_name)')
        .eq('bloc_id', selectedBloc.id)
        .order('created_at', { ascending: true })
        .limit(100);
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  // Real-time messages subscription
  useEffect(() => {
    if (!selectedBloc?.id) return;
    const channel = supabase.channel(`bloc-messages-${selectedBloc.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bloc_messages', filter: `bloc_id=eq.${selectedBloc.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['bloc-messages', selectedBloc.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedBloc?.id, queryClient]);

  if (blocsLoading) return <LoadingSpinner className="py-20" />;
  if (blocsError) return <QueryErrorState message="Failed to load blocs." onRetry={() => refetchBlocs()} />;

  // Main bloc list view
  if (!selectedBloc) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="font-jotia-bold text-xl text-text-primary">Committee Blocs</h2>
          <div className="text-xs text-text-dimmed">
            {blocs.length} bloc{blocs.length !== 1 ? 's' : ''} in {ctx.committee?.name}
          </div>
        </div>

        {blocs.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-text-dimmed mx-auto mb-4" />
            <p className="text-text-dimmed font-jotia">No blocs have been formed yet.</p>
            <p className="text-text-tertiary text-sm mt-2">Blocs will appear here once delegates create them.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocs.map((bloc: any) => (
              <Card 
                key={bloc.id} 
                className="p-4 cursor-pointer hover:border-text-primary transition-colors"
                onClick={() => setSelectedBloc(bloc)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-jotia-bold text-text-primary">{bloc.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-dimmed">
                    <Users className="w-3 h-3" />
                    {bloc.bloc_members?.length || 0}
                  </div>
                </div>
                
                <p className="text-text-dimmed text-sm mb-3 line-clamp-2">{bloc.description || 'No description'}</p>
                
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Created {new Date(bloc.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {bloc._message_count || 0} messages
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <div className="flex flex-wrap gap-1">
                    {(bloc.bloc_members || []).slice(0, 3).map((member: any) => (
                      <span key={member.id} className="text-xs bg-bg-raised px-2 py-1 rounded text-text-dimmed">
                        {member.users?.allocated_country || member.users?.full_name}
                      </span>
                    ))}
                    {(bloc.bloc_members?.length || 0) > 3 && (
                      <span className="text-xs text-text-tertiary">+{(bloc.bloc_members?.length || 0) - 3} more</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Selected bloc detail view
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedBloc(null)}
            className="text-text-dimmed hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
          </button>
          <div>
            <h2 className="font-jotia-bold text-xl text-text-primary">{selectedBloc.name}</h2>
            <p className="text-text-dimmed text-sm">{selectedBloc.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dimmed">
          <Users className="w-4 h-4" />
          {selectedBloc.bloc_members?.length || 0} members
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <p className="text-xs text-yellow-400">
          <strong>Chair Access:</strong> As committee chair, you have access to all bloc communications for oversight purposes. This access is in accordance with BILLMUN regulations and conference rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border-subtle mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBlocTab(tab.id as any)}
            className={`pb-2 px-1 flex items-center gap-2 text-sm font-jotia border-b-2 transition-colors ${
              blocTab === tab.id
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-dimmed hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {blocTab === 'overview' && (
          <div className="space-y-6">
            <Card className="p-6">
              <SectionLabel>Bloc Information</SectionLabel>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs text-text-tertiary uppercase">Name</span>
                  <p className="text-text-primary">{selectedBloc.name}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary uppercase">Description</span>
                  <p className="text-text-primary">{selectedBloc.description || 'No description provided'}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary uppercase">Created</span>
                  <p className="text-text-primary">{new Date(selectedBloc.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary uppercase">Members</span>
                  <p className="text-text-primary">{selectedBloc.bloc_members?.length || 0} delegates</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary uppercase">Messages</span>
                  <p className="text-text-primary">{selectedBloc._message_count || 0} messages exchanged</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {blocTab === 'members' && (
          <Card className="p-6">
            <SectionLabel>Bloc Members ({selectedBloc.bloc_members?.length || 0})</SectionLabel>
            <div className="mt-4 space-y-2">
              {(selectedBloc.bloc_members || []).map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-bg-raised rounded-lg">
                  <div>
                    <p className="text-text-primary font-jotia">{member.users?.full_name}</p>
                    <p className="text-text-dimmed text-sm">{member.users?.allocated_country}</p>
                  </div>
                  <div className="text-xs text-text-tertiary">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {blocTab === 'messages' && (
          <div className="h-[600px] flex flex-col">
            <Card className="flex-1 overflow-hidden relative">
              <div className="p-4 border-b border-border-subtle">
                <h3 className="font-jotia-bold text-text-primary">Bloc Messages</h3>
                <p className="text-xs text-text-dimmed mt-1">Read-only access for oversight</p>
              </div>
              
              {messagesLoading ? (
                <LoadingSpinner className="py-12" />
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-text-dimmed text-center py-8">No messages yet</p>
                  ) : (
                    messages.map((message: any) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-raised flex items-center justify-center text-xs font-jotia text-text-primary">
                          {(message.users?.full_name || 'Unknown').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-text-primary font-jotia text-sm">
                              {message.users?.full_name || 'Unknown'}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-text-primary text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
