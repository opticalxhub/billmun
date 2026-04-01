'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Badge, Button } from '@/components/ui';
import { DashboardHeader, DashboardLoadingState } from '@/components/dashboard-shell';
import { toast } from 'sonner';
import { Check, X, Eye, FileText, Image as ImageIcon } from 'lucide-react';

export default function EBMediaPRPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'media' | 'press'>('media');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['eb-media-pr'],
    queryFn: async () => {
      const res = await fetch('/api/eb/media-pr');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  const approveMediaMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/eb/media/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eb-media-pr'] });
      toast.success('Media updated successfully');
    },
    onError: () => toast.error('Failed to update media')
  });

  const approvePressMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/eb/press/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eb-media-pr'] });
      toast.success('Press release updated successfully');
    },
    onError: () => toast.error('Failed to update press release')
  });

  const hideMediaMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const res = await fetch('/api/eb/media/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isHidden })
      });
      if (!res.ok) throw new Error('Failed to hide media');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eb-media-pr'] });
      toast.success('Media visibility updated');
    },
    onError: () => toast.error('Failed to update media visibility')
  });

  const hidePressMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const res = await fetch('/api/eb/press/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isHidden })
      });
      if (!res.ok) throw new Error('Failed to hide press release');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eb-media-pr'] });
      toast.success('Press release visibility updated');
    },
    onError: () => toast.error('Failed to update press release visibility')
  });

  if (isLoading) return <DashboardLoadingState type="overview" />;
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-status-rejected-text font-jotia text-lg">Failed to load media/PR.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button>
        </div>
      </div>
    );
  }

  const media = data?.media || [];
  const pressReleases = data?.pressReleases || [];

  const pendingMedia = media.filter((m: any) => m.status === 'PENDING');
  const approvedMedia = media.filter((m: any) => m.status === 'APPROVED');
  const rejectedMedia = media.filter((m: any) => m.status === 'REJECTED');

  const pendingPress = pressReleases.filter((p: any) => p.status === 'PENDING');
  const approvedPress = pressReleases.filter((p: any) => p.status === 'PUBLISHED' || p.status === 'APPROVED');
  const rejectedPress = pressReleases.filter((p: any) => p.status === 'REJECTED');

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Media & Press Approval" 
        subtitle="Review and approve media uploads and press releases"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'media' 
              ? 'border-text-primary text-text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Media ({pendingMedia.length})
        </button>
        <button
          onClick={() => setActiveTab('press')}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'press' 
              ? 'border-text-primary text-text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Press Releases ({pendingPress.length})
        </button>
      </div>

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Pending Section */}
          {pendingMedia.length > 0 && (
            <Card>
              <h2 className="text-lg font-jotia-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Pending Approval ({pendingMedia.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMedia.map((item: any) => (
                  <div key={item.id} className="rounded-card border border-border-subtle bg-bg-raised overflow-hidden">
                    {item.mime_type?.startsWith('video/') ? (
                      <video src={item.media_url} className="w-full h-48 object-cover" controls />
                    ) : (
                      <img src={item.media_url} alt={item.caption || ''} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold truncate">{item.title || item.caption || 'Untitled'}</p>
                      <p className="text-xs text-text-dimmed">{item.event_tag || item.committee_tag || 'General'}</p>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveMediaMutation.mutate({ id: item.id, status: 'APPROVED' })}
                          disabled={approveMediaMutation.isPending}
                          className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveMediaMutation.mutate({ id: item.id, status: 'REJECTED' })}
                          disabled={approveMediaMutation.isPending}
                          className="flex-1 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Approved Section */}
          {approvedMedia.length > 0 && (
            <Card className="opacity-75">
              <h2 className="text-lg font-jotia-bold mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Approved ({approvedMedia.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedMedia.map((item: any) => (
                  <div key={item.id} className="rounded-card border border-border-subtle bg-bg-raised overflow-hidden">
                    {item.mime_type?.startsWith('video/') ? (
                      <video src={item.media_url} className="w-full h-32 object-cover" />
                    ) : (
                      <img src={item.media_url} alt={item.caption || ''} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold truncate">{item.title || item.caption || 'Untitled'}</p>
                      <p className="text-[10px] text-text-dimmed mt-1">
                        Uploaded by: {item.uploader?.full_name || item.uploader?.email || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="approved">APPROVED</Badge>
                        {item.is_hidden && <Badge variant="rejected">HIDDEN</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => hideMediaMutation.mutate({ id: item.id, isHidden: !item.is_hidden })}
                        disabled={hideMediaMutation.isPending}
                        className="w-full mt-2 text-xs"
                      >
                        {item.is_hidden ? 'Show' : 'Hide'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Press Releases Tab */}
      {activeTab === 'press' && (
        <div className="space-y-6">
          {/* Pending Section */}
          {pendingPress.length > 0 && (
            <Card>
              <h2 className="text-lg font-jotia-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Pending Approval ({pendingPress.length})
              </h2>
              <div className="space-y-4">
                {pendingPress.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-card border border-border-subtle bg-bg-raised">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <Badge variant="pending">PENDING</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">{item.body}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => approvePressMutation.mutate({ id: item.id, status: 'PUBLISHED' })}
                        disabled={approvePressMutation.isPending}
                        className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Publish
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => approvePressMutation.mutate({ id: item.id, status: 'REJECTED' })}
                        disabled={approvePressMutation.isPending}
                        className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Published Section */}
          {approvedPress.length > 0 && (
            <Card className="opacity-75">
              <h2 className="text-lg font-jotia-bold mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Published ({approvedPress.length})
              </h2>
              <div className="space-y-3">
                {approvedPress.map((item: any) => (
                  <div key={item.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-xs text-text-dimmed mt-1">
                          By: {item.author?.full_name || item.author?.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-text-dimmed mt-1">{item.body.substring(0, 100)}...</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="approved">PUBLISHED</Badge>
                        {item.is_hidden && <Badge variant="rejected">HIDDEN</Badge>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => hidePressMutation.mutate({ id: item.id, isHidden: !item.is_hidden })}
                      disabled={hidePressMutation.isPending}
                      className="w-full mt-3 text-xs"
                    >
                      {item.is_hidden ? 'Show' : 'Hide'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
