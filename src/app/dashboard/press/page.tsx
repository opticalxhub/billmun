'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Input, Badge, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardAnimatedTabPanel, DashboardHeader, DashboardLoadingState, DashboardTabBar } from '@/components/dashboard-shell';
import { Notepad } from '@/components/notepad';
import WhatsAppTab from '@/components/whatsapp-tab';
import { toast } from 'sonner';

type TabName = 'Overview' | 'Coverage Planning' | 'Upload Media' | 'Press Releases' | 'Media Gallery' | 'Press Guidelines' | 'My Stats' | 'WhatsApp';
const TABS: TabName[] = ['Overview', 'Coverage Planning', 'Upload Media', 'Press Releases', 'Media Gallery', 'Press Guidelines', 'My Stats', 'WhatsApp'];

export default function PressDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCommittee, setMediaCommittee] = useState('');
  const [mediaEvent, setMediaEvent] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // Emergency Override Check
      if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
        return {
          id: 'emergency-actor',
          email: 'emergency@billmun.org',
          full_name: 'Engineer (Emergency)',
          role: 'EXECUTIVE_BOARD',
          status: 'APPROVED',
          has_completed_onboarding: true
        };
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No session');
      const { data } = await supabase.from('users').select('id, email, full_name, role, status').eq('id', authUser.id).single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: pressData, isLoading: pressLoading, isError: pressError } = useQuery({
    queryKey: ['press-dashboard'],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: media }, { data: events }, { data: resources }, { data: pr }] = await Promise.all([
        supabase.from('media_gallery').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('schedule_events').select('*').order('start_time', { ascending: true }).limit(50),
        supabase.from('committee_resources').select('*').eq('archived', false).order('created_at', { ascending: false }).limit(50),
        supabase.from('press_releases').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      return { media: media || [], events: events || [], resources: resources || [], pressReleases: pr || [] };
    },
    staleTime: 60 * 1000,
  });

  const media = pressData?.media || [];
  const events = pressData?.events || [];
  const resources = pressData?.resources || [];
  const pressReleases = pressData?.pressReleases || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, url }: { file: File, url: string }) => {
      const { error } = await supabase.from('media_gallery').insert({
        uploader_id: user?.id || null,
        media_url: url,
        caption: caption,
        title: mediaTitle || null,
        committee_tag: mediaCommittee || null,
        event_tag: mediaEvent || null,
        status: 'PENDING',
        mime_type: file.type,
        file_size: file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFile(null);
      setCaption('');
      setMediaTitle('');
      setMediaCommittee('');
      setMediaEvent('');
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['press-dashboard'] });
      toast.success('Media uploaded successfully and is pending EB approval.');
    }
  });

  const handleUpload = async () => {
    if (!file || !user) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowed.includes(file.type)) { toast.error('Unsupported file type'); return; }
    if (file.size > 500 * 1024 * 1024) { toast.error('File too large. Max 500MB.'); return; }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/media/upload');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText);
            resolve(json.url);
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      await uploadMediaMutation.mutateAsync({ file, url });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitPrMutation = useMutation({
    mutationFn: async ({ title, body }: { title: string, body: string }) => {
      const { error } = await supabase.from('press_releases').insert({
        author_id: user?.id || null,
        title,
        body,
        status: 'PENDING',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPrTitle('');
      setPrBody('');
      queryClient.invalidateQueries({ queryKey: ['press-dashboard'] });
    }
  });

  const submitPressRelease = () => {
    if (!prTitle.trim() || !prBody.trim()) return;
    submitPrMutation.mutate({ title: prTitle.trim(), body: prBody.trim() });
  };

  if (userLoading || pressLoading) return <DashboardLoadingState type="overview" />;
  if ((userError || pressError) && !user) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load press dashboard.</p><button onClick={() => window.location.reload()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader 
        title="Media & Press Control" 
        subtitle="Conference-wide reporting and media management" 
        committeeName="Press Corps"
        user={user}
      />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={(t) => setActiveTab(t as TabName)} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <div className="xl:col-span-8">
          <DashboardAnimatedTabPanel activeKey={activeTab}>
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><SectionLabel>Assigned Today</SectionLabel><p className="text-3xl font-bold">{events.length}</p></Card>
                <Card><SectionLabel>Pending Approval</SectionLabel><p className="text-3xl font-bold">{media.filter((m) => m.status === 'PENDING').length}</p></Card>
                <Card><SectionLabel>Approved</SectionLabel><p className="text-3xl font-bold">{media.filter((m) => m.status === 'APPROVED').length}</p></Card>
                <Card><SectionLabel>Latest Approved</SectionLabel><p className="text-xs text-text-dimmed">{media.find((m) => m.status === 'APPROVED')?.caption || 'None yet'}</p></Card>
              </div>
            )}

            {activeTab === 'Coverage Planning' && (
              <Card>
                <SectionLabel>Conference Schedule</SectionLabel>
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                      <p className="text-sm font-semibold">{event.event_name}</p>
                      <p className="text-xs text-text-dimmed">{event.location || 'TBD'} · {event.start_time ? new Date(event.start_time).toLocaleString() : 'No start time'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'Upload Media' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <SectionLabel>Upload</SectionLabel>
                  <div className="space-y-3">
                    <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={handleFileChange} />
                    <Input placeholder="Title" value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} />
                    <Input placeholder="Short description" value={caption} onChange={(e) => setCaption(e.target.value)} />
                    <Input placeholder="Committee tag (optional)" value={mediaCommittee} onChange={(e) => setMediaCommittee(e.target.value)} />
                    <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={mediaEvent} onChange={(e) => setMediaEvent(e.target.value)}>
                      <option value="">Select event tag</option>
                      {events.map((event) => <option key={event.id} value={event.event_name}>{event.event_name}</option>)}
                    </select>
                    {uploading ? (
                      <div className="w-full h-2 rounded-full bg-bg-raised overflow-hidden border border-border-subtle">
                        <div className="h-full bg-text-primary transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    ) : null}
                    <Button onClick={handleUpload} disabled={uploading || !file || !mediaTitle.trim() || !caption.trim()}>{uploading ? `Uploading ${uploadProgress}%` : 'Submit for Approval'}</Button>
                  </div>
                </Card>
                <Card>
                  <SectionLabel>My Uploads</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {media.filter((m) => m.uploader_id === user.id).map((m) => (
                      <div key={m.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                        <p className="text-xs">{m.caption || 'Untitled'}</p>
                        <Badge variant={(m.status || 'pending').toLowerCase() as any}>{m.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Press Releases' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <SectionLabel>Create Press Release</SectionLabel>
                  <div className="space-y-3">
                    <Input placeholder="Title" value={prTitle} onChange={(e) => setPrTitle(e.target.value)} />
                    <Textarea rows={8} placeholder="Body" value={prBody} onChange={(e) => setPrBody(e.target.value)} />
                    <p className="text-xs text-text-dimmed">{prBody.trim().split(/\s+/).filter(Boolean).length} words</p>
                    <Button onClick={submitPressRelease}>Submit for Approval</Button>
                  </div>
                </Card>
                <Card>
                  <SectionLabel>My Press Releases</SectionLabel>
                  <div className="space-y-2">
                    {pressReleases.filter((r) => r.author_id === user.id).map((r) => (
                      <div key={r.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                        <p className="text-sm font-semibold">{r.title}</p>
                        <Badge variant={(r.status || 'pending').toLowerCase() as any}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Media Gallery' && (
              <Card>
                <SectionLabel>Approved Gallery</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {media.filter((m) => m.status === 'APPROVED').map((m) => (
                    <div key={m.id} className="group relative rounded-card border border-border-subtle bg-bg-raised overflow-hidden aspect-video transition-all hover:border-text-primary/30">
                      {m.mime_type?.startsWith('video/') ? (
                        <video src={m.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.media_url} alt={m.caption || ''} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <p className="text-white text-xs font-bold truncate">{m.title || m.caption || 'Untitled'}</p>
                        <p className="text-white/70 text-[10px] truncate">{m.event_tag || m.committee_tag || 'General'}</p>
                        <a href={m.media_url} target="_blank" rel="noreferrer" className="mt-2 text-[10px] text-white underline font-bold uppercase tracking-widest">View Full</a>
                      </div>
                    </div>
                  ))}
                  {media.filter(m => m.status === 'APPROVED').length === 0 && (
                    <div className="col-span-full py-20 text-center text-text-dimmed italic">No approved media in gallery yet.</div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'Press Guidelines' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <SectionLabel>Journalism Standards</SectionLabel>
                  <div className="prose prose-invert max-w-none text-sm text-text-secondary space-y-4">
                    <p>1. <strong>Accuracy</strong>: Always verify names, committees, and quotes before publishing.</p>
                    <p>2. <strong>Impartiality</strong>: Report the facts of the debate without taking sides between delegations.</p>
                    <p>3. <strong>Sensitivity</strong>: Be mindful of cultural sensitivities and MUN diplomacy standards.</p>
                  </div>
                </Card>
                <Card>
                  <SectionLabel>Branding Assets</SectionLabel>
                  <div className="space-y-2">
                    {resources.map((r) => (
                      <a key={r.id} href={r.file_url} target="_blank" rel="noreferrer" className="block p-3 rounded-card border border-border-subtle bg-bg-raised hover:border-text-primary/30 transition-all">
                        <p className="text-sm font-semibold">{r.title}</p>
                        <p className="text-[10px] text-text-tertiary uppercase tracking-widest">Download Asset</p>
                      </a>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'My Stats' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><SectionLabel>Total Uploads</SectionLabel><p className="text-3xl font-bold">{media.filter((m) => m.uploader_id === user.id).length}</p></Card>
                <Card><SectionLabel>Approved Media</SectionLabel><p className="text-3xl font-bold">{media.filter((m) => m.uploader_id === user.id && m.status === 'APPROVED').length}</p></Card>
                <Card><SectionLabel>Published PRs</SectionLabel><p className="text-3xl font-bold">{pressReleases.filter((r) => r.author_id === user.id && r.status === 'PUBLISHED').length}</p></Card>
              </div>
            )}

            {activeTab === 'WhatsApp' && (
              <WhatsAppTab />
            )}
          </DashboardAnimatedTabPanel>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Notepad dashboardKey="PRESS" userId={user.id} />
        </div>
      </div>
    </div>
  );
}
