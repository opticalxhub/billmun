'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { ArrowLeft, Users, MessageSquare, FileText, Layout } from 'lucide-react';
import type { DelegateContext } from '../page';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function BlocsTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [selectedBloc, setSelectedBloc] = useState<any>(null);
  const [blocTab, setBlocTab] = useState<'members' | 'documents' | 'strategy' | 'messages'>('members');
  const [msgInput, setMsgInput] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [sharedStrategy, setSharedStrategy] = useState('');
  const [privateStrategy, setPrivateStrategy] = useState('');
  const [lastEditor, setLastEditor] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesParentRef = useRef<HTMLDivElement>(null);

  // useQuery for Blocs
  const { data: blocs, isLoading: blocsLoading, isError: blocsError, refetch: refetchBlocs } = useQuery({
    queryKey: ['delegate-blocs', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('bloc_members')
        .select('bloc_id')
        .eq('user_id', ctx.user.id);
      if (!memberships || memberships.length === 0) return [];
      const blocIds = memberships.map(m => m.bloc_id);
      const { data } = await supabase
        .from('blocs')
        .select('*')
        .in('id', blocIds);

      if (!data) return [];

      // Batch fetch member counts and last messages to avoid N+1
      const [memberCounts, lastMessages] = await Promise.all([
        supabase.from('bloc_members').select('bloc_id').in('bloc_id', blocIds),
        supabase.from('bloc_messages').select('bloc_id, content, created_at').in('bloc_id', blocIds).order('created_at', { ascending: false }),
      ]);
      const countMap: Record<string, number> = {};
      (memberCounts.data || []).forEach((m: any) => { countMap[m.bloc_id] = (countMap[m.bloc_id] || 0) + 1; });
      const msgMap: Record<string, any> = {};
      (lastMessages.data || []).forEach((m: any) => { if (!msgMap[m.bloc_id]) msgMap[m.bloc_id] = m; });

      return data.map((b: any) => ({
        ...b,
        memberCount: countMap[b.id] || 0,
        lastMessage: msgMap[b.id] || null,
      }));
    },
    staleTime: 60 * 1000,
  });

  // useQuery for Bloc Members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['bloc-members', selectedBloc?.id],
    enabled: !!selectedBloc?.id,
    queryFn: async () => {
      const { data } = await supabase.from('bloc_members').select('*, users:user_id(id, full_name, email, role)').eq('bloc_id', selectedBloc.id);
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  // useQuery for Bloc Docs
  const { data: blocDocs, isLoading: blocDocsLoading } = useQuery({
    queryKey: ['bloc-docs', selectedBloc?.id],
    enabled: !!selectedBloc?.id,
    queryFn: async () => {
      const { data } = await supabase.from('bloc_documents').select('*, users:uploader_id(full_name)').eq('bloc_id', selectedBloc.id).order('uploaded_at', { ascending: false });
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  // useQuery for Bloc Messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['bloc-messages', selectedBloc?.id],
    enabled: !!selectedBloc?.id,
    queryFn: async () => {
      const { data } = await supabase.from('bloc_messages').select('*, users:user_id(full_name)').eq('bloc_id', selectedBloc.id).order('created_at', { ascending: true }).limit(100);
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  const virtualizer = useVirtualizer({
    count: (messages || []).length,
    getScrollElement: () => messagesParentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualMessages = virtualizer.getVirtualItems();

  useEffect(() => {
    if ((messages || []).length > 0) {
      virtualizer.scrollToIndex((messages || []).length - 1);
    }
  }, [(messages || []).length, virtualizer]);

  useEffect(() => {
    // Presence subscription
    const channel = supabase.channel('global-presence-bloc');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => { if (p.user_id) onlineIds.add(p.user_id); });
      });
      setOnlineUsers(onlineIds);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createBlocMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const code = generateCode();
      const { data, error } = await supabase.from('blocs').insert({
        name, description: description || null, invite_code: code, creator_id: ctx.user.id,
      }).select().single();
      if (error) throw error;
      await supabase.from('bloc_members').insert({ bloc_id: data.id, user_id: ctx.user.id });
      await supabase.from('strategy_board').insert({ bloc_id: data.id, shared_content: '' });
      return { data, code };
    },
    onSuccess: ({ data, code }) => {
      setCreatedCode(code);
      queryClient.invalidateQueries({ queryKey: ['delegate-blocs'] });
      try {
        supabase.from('audit_logs').insert({ 
          actor_id: ctx.user.id, 
          action: `Created bloc: ${data.name}`, 
          target_type: 'Bloc', 
          target_id: data.id 
        });
      } catch { /* ignore */ }
    }
  });

  const handleCreate = () => {
    if (!createName.trim()) return;
    createBlocMutation.mutate({ name: createName.trim(), description: createDesc.trim() });
  };

  const joinBlocMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data: bloc } = await supabase.from('blocs').select('id, name').eq('invite_code', code.trim().toUpperCase()).single();
      if (!bloc) throw new Error('Invalid invite code.');
      const { error } = await supabase.from('bloc_members').insert({ bloc_id: bloc.id, user_id: ctx.user.id });
      if (error) throw error;
      return bloc;
    },
    onSuccess: (bloc) => {
      setJoinOpen(false);
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['delegate-blocs'] });
      supabase.from('audit_logs').insert({ actor_id: ctx.user.id, action: `Joined bloc: ${bloc.name}`, target_type: 'Bloc', target_id: bloc.id });
    },
    onError: (err: any) => toast.error(err.message.includes('duplicate') ? 'You are already a member.' : err.message)
  });

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinBlocMutation.mutate(joinCode);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('bloc_messages').insert({ bloc_id: selectedBloc.id, user_id: ctx.user.id, content });
      if (error) throw error;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['bloc-messages', selectedBloc?.id] });
      const previous = queryClient.getQueryData(['bloc-messages', selectedBloc?.id]);
      queryClient.setQueryData(['bloc-messages', selectedBloc?.id], (old: any) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          bloc_id: selectedBloc.id,
          user_id: ctx.user.id,
          content,
          created_at: new Date().toISOString(),
          users: { full_name: ctx.user.full_name }
        }
      ]);
      return { previous };
    },
    onError: (err, content, context: any) => {
      queryClient.setQueryData(['bloc-messages', selectedBloc?.id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bloc-messages', selectedBloc?.id] });
    },
    onSuccess: () => {
      setMsgInput('');
    }
  });

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    sendMessageMutation.mutate(msgInput.trim());
  };

  const openBloc = (bloc: any) => {
    setSelectedBloc(bloc);
    setBlocTab('members');
    setIsCreator(bloc.creator_id === ctx.user.id);
    setInviteCode(bloc.invite_code);
  };

  const loadStrategy = async (bloc_id: string) => {
    const { data: board } = await supabase.from('strategy_board').select('*, editor:last_edited_by_id(full_name)').eq('bloc_id', bloc_id).maybeSingle();
    if (board) { setSharedStrategy(board.shared_content); setLastEditor(board.editor ? { name: board.editor.full_name, at: board.last_edited_at } : null); }
    const { data: priv } = await supabase.from('strategy_board_private').select('content').eq('bloc_id', bloc_id).eq('user_id', ctx.user.id).maybeSingle();
    setPrivateStrategy(priv?.content || '');
  };

  // Switch bloc tabs and load strategy (polling handled by useEffect)
  useEffect(() => {
    if (!selectedBloc || blocTab !== 'strategy') return;
    loadStrategy(selectedBloc.id);
    const interval = setInterval(() => loadStrategy(selectedBloc.id), 30000); // Increase to 30 seconds
    return () => clearInterval(interval);
  }, [blocTab, selectedBloc?.id]);

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

  const saveSharedStrategy = async () => {
    if (!selectedBloc) return;
    try {
      await supabase.from('strategy_board').update({
        shared_content: sharedStrategy,
        last_edited_by_id: ctx.user.id,
        last_edited_at: new Date().toISOString(),
      }).eq('bloc_id', selectedBloc.id);
    } catch (err) {
      console.error('Failed to save shared strategy:', err);
    }
  };

  const savePrivateStrategy = async () => {
    if (!selectedBloc) return;
    try {
      await supabase.from('strategy_board_private').upsert({
        bloc_id: selectedBloc.id,
        user_id: ctx.user.id,
        content: privateStrategy,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'bloc_id,user_id' });
    } catch (err) {
      console.error('Failed to save private strategy:', err);
    }
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await supabase.from('bloc_members').delete().eq('id', memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloc-members'] });
    }
  });

  const removeMember = (memberId: string) => {
    if (!confirm('Remove this member from the bloc?')) return;
    removeMemberMutation.mutate(memberId);
  };

  const transferMutation = useMutation({
    mutationFn: async (newCreatorId: string) => {
      await supabase.from('blocs').update({ creator_id: newCreatorId }).eq('id', selectedBloc.id);
    },
    onSuccess: (_, newCreatorId) => {
      setIsCreator(false);
      setSelectedBloc({ ...selectedBloc, creator_id: newCreatorId });
      queryClient.invalidateQueries({ queryKey: ['delegate-blocs'] });
    }
  });

  const transferLeadership = (newCreatorId: string) => {
    if (!confirm('Transfer leadership? This cannot be undone.')) return;
    transferMutation.mutate(newCreatorId);
  };

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const newCode = generateCode();
      await supabase.from('blocs').update({ invite_code: newCode }).eq('id', selectedBloc.id);
      return newCode;
    },
    onSuccess: (newCode) => {
      setInviteCode(newCode);
      queryClient.invalidateQueries({ queryKey: ['delegate-blocs'] });
    }
  });

  const regenerateCode = () => regenerateCodeMutation.mutate();

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `blocs/${selectedBloc.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      await supabase.from('bloc_documents').insert({
        bloc_id: selectedBloc.id,
        uploader_id: ctx.user.id,
        title: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloc-docs'] });
    }
  });

  const uploadBlocDoc = (file: File) => {
    if (!selectedBloc) return;
    uploadDocMutation.mutate(file);
  };

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      await supabase.from('bloc_documents').delete().eq('id', docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloc-docs'] });
    }
  });

  const deleteBlocDoc = (docId: string) => {
    if (!confirm('Delete this file?')) return;
    deleteDocMutation.mutate(docId);
  };

  // Main bloc list view
  if (!selectedBloc) {
    if (blocsLoading) return <LoadingSpinner className="py-20" />;
    if (blocsError) return <QueryErrorState message="Failed to load blocs." onRetry={() => refetchBlocs()} />;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="font-jotia-bold text-xl text-text-primary">Blocs</h2>
          <div className="flex gap-2">
            <button onClick={() => setJoinOpen(true)} className="px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
              Join Bloc
            </button>
            <button onClick={() => { setCreateOpen(true); setCreatedCode(''); }} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
              Create Bloc
            </button>
          </div>
        </div>

        {(blocs || []).length === 0 ? (
          <div className="text-center py-16 bg-bg-card border border-border-subtle rounded-card">
            <p className="text-text-dimmed font-jotia text-sm">You have not joined any blocs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(blocs || []).map(b => (
              <div key={b.id} onClick={() => openBloc(b)} className="bg-bg-card border border-border-subtle rounded-card p-5 cursor-pointer hover:bg-bg-hover transition-colors">
                <h3 className="font-jotia-bold text-text-primary mb-1">{b.name}</h3>
                <div className="flex items-center gap-3 text-xs text-text-dimmed font-jotia mb-2">
                  <span>{b.memberCount} members</span>
                  {b.lastMessage && <span>{new Date(b.lastMessage.created_at).toLocaleDateString()}</span>}
                </div>
                {b.lastMessage && (
                  <p className="text-text-tertiary font-jotia text-xs truncate">{b.lastMessage.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4" onClick={() => setCreateOpen(false)}>
            <div className="bg-bg-card w-full md:max-w-md md:rounded-card rounded-t-xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Create Bloc</h3>
              {createdCode ? (
                <div className="space-y-3">
                  <p className="text-text-dimmed font-jotia text-sm">Bloc created! Share this invite code:</p>
                  <div className="bg-bg-raised rounded-card p-4 text-center">
                    <p className="font-jotia-bold text-2xl text-text-primary tracking-widest">{createdCode}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(createdCode); }} className="w-full px-4 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]">
                    Copy Code
                  </button>
                  <button onClick={() => setCreateOpen(false)} className="w-full px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Bloc name" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
                  <input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary" />
                  <button onClick={handleCreate} disabled={!createName.trim()} className="w-full px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50">
                    Create
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Modal */}
        {joinOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4" onClick={() => setJoinOpen(false)}>
            <div className="bg-bg-card w-full md:max-w-md md:rounded-card rounded-t-xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-jotia-bold text-lg text-text-primary mb-4">Join Bloc</h3>
              <div className="space-y-3">
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter 6-character invite code" maxLength={6} className="w-full bg-bg-raised border border-border-input rounded-input px-3 h-10 font-jotia text-sm text-text-primary text-center tracking-widest uppercase" />
                <button onClick={handleJoin} disabled={joinCode.length !== 6} className="w-full px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px] disabled:opacity-50">
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Bloc workspace view
  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={() => setSelectedBloc(null)} 
          className="text-text-dimmed hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-border-subtle rounded-lg bg-bg-raised/50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-jotia-bold text-xl text-text-primary uppercase tracking-tight">{selectedBloc.name}</h2>
      </div>

      {/* Bloc Tabs */}
      <div className="flex border-b border-border-subtle overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
        {(['members', 'documents', 'strategy', 'messages'] as const).map(t => (
          <button 
            key={t} 
            onClick={() => setBlocTab(t)} 
            className={`whitespace-nowrap px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all min-h-[44px] flex items-center gap-2 ${
              blocTab === t 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-text-dimmed hover:text-text-secondary hover:bg-bg-raised/50'
            }`}
          >
            {t === 'members' && <Users className="w-3.5 h-3.5" />}
            {t === 'documents' && <FileText className="w-3.5 h-3.5" />}
            {t === 'strategy' && <Layout className="w-3.5 h-3.5" />}
            {t === 'messages' && <MessageSquare className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {blocTab === 'members' && (
        <div className="space-y-4">
          {membersLoading ? (
            <LoadingSpinner className="py-12" />
          ) : (
            <>
              <div className="hidden md:block bg-bg-card border border-border-subtle rounded-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border-subtle bg-bg-raised">
                    <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Joined</th>
                    {isCreator && <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Actions</th>}
                  </tr></thead>
                  <tbody>
                    {(members || []).map(m => {
                      const isOnline = m.user_id && onlineUsers.has(m.user_id);
                      return (
                      <tr key={m.id} className="border-b border-border-subtle/50">
                        <td className="px-4 py-3 font-jotia text-text-primary flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-approved-text shadow-[0_0_5px_rgba(0,255,0,0.5)]' : 'bg-border-emphasized'}`} />
                          {m.users?.full_name || 'Unknown'} {m.user_id === selectedBloc.creator_id && <span className="text-text-tertiary text-xs">(Creator)</span>}
                        </td>
                        <td className="px-4 py-3 font-jotia text-text-dimmed text-xs">{new Date(m.joined_at).toLocaleDateString()}</td>
                        {isCreator && (
                          <td className="px-4 py-3">
                            {m.user_id !== ctx.user.id && (
                              <div className="flex gap-2">
                                <button onClick={() => removeMember(m.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text min-h-[28px]">Remove</button>
                                <button onClick={() => transferLeadership(m.user_id)} className="text-xs text-text-dimmed hover:text-text-primary min-h-[28px]">Transfer Leadership</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2">
                {(members || []).map(m => (
                  <div key={m.id} className="bg-bg-card border border-border-subtle rounded-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-jotia text-text-primary text-sm">{m.users?.full_name || 'Unknown'} {m.user_id === selectedBloc.creator_id && <span className="text-text-tertiary text-xs">(Creator)</span>}</p>
                        <p className="font-jotia text-text-tertiary text-xs">{new Date(m.joined_at).toLocaleDateString()}</p>
                      </div>
                      {isCreator && m.user_id !== ctx.user.id && (
                        <button onClick={() => removeMember(m.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text min-h-[44px] px-2">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Invite Code */}
              <div className="bg-bg-card border border-border-subtle rounded-card p-4">
                <p className="text-text-dimmed font-jotia text-xs uppercase tracking-wider mb-2">Invite Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-jotia-bold text-xl text-text-primary tracking-widest">{inviteCode}</span>
                  <button onClick={() => navigator.clipboard.writeText(inviteCode)} className="text-xs text-text-dimmed hover:text-text-primary px-2 py-1 min-h-[28px]">Copy</button>
                  {isCreator && <button onClick={regenerateCode} className="text-xs text-text-dimmed hover:text-text-primary px-2 py-1 min-h-[28px]">Regenerate</button>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {blocTab === 'documents' && (
        <div className="space-y-4">
          <label className="inline-flex items-center px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button cursor-pointer hover:opacity-90 min-h-[44px]">
            Upload File
            <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadBlocDoc(e.target.files[0]); }} />
          </label>
          {blocDocsLoading ? (
            <LoadingSpinner className="py-12" />
          ) : (blocDocs || []).length === 0 ? (
            <p className="text-text-dimmed font-jotia text-sm py-8 text-center">No shared files yet.</p>
          ) : (
            <div className="space-y-2">
              {(blocDocs || []).map(d => (
                <div key={d.id} className="bg-bg-card border border-border-subtle rounded-card p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-jotia text-text-primary text-sm truncate">{d.title}</p>
                    <p className="font-jotia text-text-tertiary text-xs">{d.users?.full_name} &middot; {new Date(d.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={d.file_url} download className="text-xs text-text-primary hover:underline min-h-[44px] flex items-center px-2">Download</a>
                    {(d.uploader_id === ctx.user.id || isCreator) && (
                      <button onClick={() => deleteBlocDoc(d.id)} className="text-xs text-text-dimmed hover:text-status-rejected-text min-h-[44px] px-2">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strategy Board Tab */}
      {blocTab === 'strategy' && (
        <div className="space-y-4">
          <div className="bg-bg-card border border-border-subtle rounded-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-jotia-bold text-sm text-text-primary">Shared Strategy Board</h3>
              {lastEditor && <span className="text-text-tertiary font-jotia text-xs">Last edited by {lastEditor.name} at {new Date(lastEditor.at).toLocaleString()}</span>}
            </div>
            <textarea
              value={sharedStrategy}
              onChange={e => setSharedStrategy(e.target.value)}
              onBlur={saveSharedStrategy}
              className="w-full min-h-[200px] bg-bg-raised border border-border-input rounded-input px-3 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
              placeholder="Shared strategy notes for the bloc..."
            />
          </div>
          <div className="bg-bg-card border border-border-subtle rounded-card p-4">
            <h3 className="font-jotia-bold text-sm text-text-primary mb-2">Your Private Notes</h3>
            <textarea
              value={privateStrategy}
              onChange={e => setPrivateStrategy(e.target.value)}
              onBlur={savePrivateStrategy}
              className="w-full min-h-[120px] bg-bg-raised border border-border-input rounded-input px-3 py-3 font-jotia text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary resize-y"
              placeholder="Your private contribution notes..."
            />
          </div>
        </div>
      )}

      {/* Messages Tab */}
      <div className="flex-1 overflow-hidden relative">
        {blocTab === 'messages' && (
          <div className="h-full flex flex-col p-4">
            {/* Privacy Warning */}
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs text-yellow-400">
                <strong>Privacy Notice:</strong> Bloc messages are not encrypted and may be accessed by conference organizers, committee chairs, and security personnel in accordance with BILLMUN regulations. All communications are subject to conference rules.
              </p>
            </div>
            {messagesLoading ? (
              <LoadingSpinner className="py-12" />
            ) : (
              <>
                <div ref={messagesParentRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {virtualMessages.map((virtualRow) => {
                      const m = (messages || [])[virtualRow.index];
                      const isMe = m.user_id === ctx.user.id;
                      return (
                        <div
                          key={m.id}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className={`flex flex-col mb-4 ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-card text-sm ${isMe ? "bg-text-primary text-bg-base" : "bg-bg-card border border-border-subtle text-text-primary"}`}>
                            {!isMe && <p className="text-[10px] opacity-70 mb-1 font-jotia-bold">{m.users?.full_name}</p>}
                            <p className="font-jotia">{m.content}</p>
                          </div>
                          <span className="text-[9px] text-text-dimmed mt-1">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 flex gap-2 pt-2 border-t border-border-subtle">
                  <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message your bloc..." className="flex-1 bg-bg-raised border border-border-subtle rounded-input px-4 py-2 text-sm outline-none focus:border-text-primary" />
                  <button onClick={sendMessage} className="px-4 py-2 bg-text-primary text-bg-base rounded-button text-sm font-jotia-bold">Send</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
