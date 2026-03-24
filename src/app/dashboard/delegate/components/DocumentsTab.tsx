'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { Button } from '@/components/button';
import { Input, Textarea } from '@/components/ui';
import { LoadingSpinner, QueryErrorState } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { X, FilePlus } from 'lucide-react';

const STATUS_VARIANT: Record<string, string> = {
  SUBMITTED: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
  UNDER_REVIEW: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
  APPROVED: 'bg-status-approved-bg text-status-approved-text border border-status-approved-border',
  REJECTED: 'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border',
  REVISION_REQUESTED: 'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border',
};

function isAllowedMime(mime: string): boolean {
  if (!mime) return true;
  if (mime === 'application/pdf') return true;
  if (mime === 'application/msword') return true;
  if (mime.includes('wordprocessingml')) return true;
  if (mime.includes('spreadsheetml')) return true;
  if (mime.startsWith('image/')) return true;
  if (mime.startsWith('video/')) return true;
  return false;
}

async function notifyDocumentUploaded(documentId: string) {
  await fetch('/api/documents/post-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ document_id: documentId }),
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsTab({ ctx }: { ctx: DelegateContext }) {
  const queryClient = useQueryClient();
  const [drawerDoc, setDrawerDoc] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'versions'>('details');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadSource, setUploadSource] = useState<'file' | 'url'>('file');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [urlDescription, setUrlDescription] = useState('');
  const [selectedType, setSelectedType] = useState<string>('OTHER');

  const docTypes = [
    { value: 'POSITION_PAPER', label: 'Position Paper' },
    { value: 'RESOLUTION', label: 'Resolution' },
    { value: 'SPEECH', label: 'Speech' },
    { value: 'COUNTRY_PROFILE', label: 'Country Profile' },
    { value: 'OTHER', label: 'Other/General' },
  ];

  const { data: conferenceSettings } = useQuery({
    queryKey: ['conference-settings-upload'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_settings').select('max_file_upload_mb').eq('id', '1').maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const maxBytes = Math.max(1, conferenceSettings?.max_file_upload_mb ?? 25) * 1024 * 1024;

  useEffect(() => {
    if (!ctx.user?.id) return;
    const channel = supabase
      .channel(`delegate-documents-${ctx.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${ctx.user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['delegate-documents', ctx.user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ctx.user?.id, queryClient]);

  // useQuery for Documents
  const { data: documents, isLoading: documentsLoading, isError: documentsError, refetch: refetchDocuments } = useQuery({
    queryKey: ['delegate-documents', ctx.user?.id],
    enabled: !!ctx.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, reviewer:reviewed_by_id(full_name)')
        .eq('user_id', ctx.user.id)
        .order('uploaded_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000,
  });

  // useQuery for Drawer History
  const { data: drawerHistory = [] } = useQuery({
    queryKey: ['document-history', drawerDoc?.id],
    enabled: !!drawerDoc?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_status_history')
        .select('*, changer:changed_by_id(full_name)')
        .eq('document_id', drawerDoc.id)
        .order('changed_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // useQuery for Drawer Versions
  const { data: drawerVersions = [] } = useQuery({
    queryKey: ['document-versions', drawerDoc?.id],
    enabled: !!drawerDoc?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', drawerDoc.id)
        .order('version', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // useQuery for Official Reference Materials (from Chair/Admin)
  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['committee-resources', ctx.assignment?.committee_id],
    enabled: !!ctx.assignment?.committee_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_resources')
        .select('*, uploader:uploaded_by(full_name)')
        .eq('committee_id', ctx.assignment!.committee_id)
        .eq('archived', false)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${ctx.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { contentType: file.type || 'application/octet-stream' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { data: inserted, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: ctx.user.id,
          committee_id: ctx.assignment?.committee_id || null,
          type: selectedType as any,
          title: file.name.replace(/\.[^/.]+$/, '') || file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          status: (selectedType === 'POSITION_PAPER' || selectedType === 'RESOLUTION') ? 'SUBMITTED' : 'APPROVED',
        })
        .select('id')
        .single();

      if (docError) throw docError;

      if (inserted?.id) {
        await notifyDocumentUploaded(inserted.id as string);
      }

      if (inserted?.id) {
        try {
          await supabase.from('audit_logs').insert({
            actor_id: ctx.user.id,
            action: `Uploaded document: ${file.name}`,
            target_type: 'DOCUMENT',
            target_id: inserted.id as string,
          });
        } catch {
          /* ignore */
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
    },
  });

  const urlUploadMutation = useMutation({
    mutationFn: async () => {
      const title = urlTitle.trim();
      const file_url = urlValue.trim();
      if (!title || !file_url) throw new Error('Title and URL are required');

      const { data: inserted, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: ctx.user.id,
          committee_id: ctx.assignment?.committee_id || null,
          type: selectedType as any,
          title,
          file_url,
          file_size: 0,
          mime_type: 'application/octet-stream',
          status: (selectedType === 'POSITION_PAPER' || selectedType === 'RESOLUTION') ? 'SUBMITTED' : 'APPROVED',
        })
        .select('id')
        .single();

      if (docError) throw docError;
      if (inserted?.id) {
        await notifyDocumentUploaded(inserted.id as string);
      }

      if (inserted?.id) {
        try {
          await supabase.from('audit_logs').insert({
            actor_id: ctx.user.id,
            action: `Linked document URL: ${title}${urlDescription.trim() ? ` — ${urlDescription.trim()}` : ''}`,
            target_type: 'DOCUMENT',
            target_id: inserted.id as string,
          });
        } catch {
          /* ignore */
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
      setUrlTitle('');
      setUrlValue('');
      setUrlDescription('');
    },
  });

  const handleUpload = async (file: File) => {
    if (!isAllowedMime(file.type)) {
      toast.error('This file type is not allowed. Use PDF, Word, Excel, images, or video.');
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`File must be under ${Math.round(maxBytes / (1024 * 1024))}MB (conference setting).`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => setUploadProgress((p) => Math.min(p + 10, 90)), 200);

    try {
      await uploadMutation.mutateAsync(file);
      setUploadProgress(100);
      toast.success('Document uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    }
  };

  const openDrawer = (doc: any) => {
    setDrawerDoc(doc);
    setDrawerTab('details');
  };

  const renameMutation = useMutation({
    mutationFn: async ({ docId, title }: { docId: string; title: string }) => {
      await supabase.from('documents').update({ title }).eq('id', docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
      toast.success('Document renamed');
    }
  });

  const handleRename = async (docId: string) => {
    if (!renameValue.trim()) return;
    await renameMutation.mutateAsync({ docId, title: renameValue.trim() });
    setRenaming(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await supabase.from('documents').delete().eq('id', docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
      toast.success('Document deleted');
    }
  });

  const handleDelete = async (doc: any) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(doc.id);
    setDrawerDoc(null);
  };

  const revisionMutation = useMutation({
    mutationFn: async ({ parentDoc, file }: { parentDoc: any; file: File }) => {
      const fileName = `${ctx.user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { data: rev, error: insErr } = await supabase
        .from('documents')
        .insert({
          user_id: ctx.user.id,
          committee_id: parentDoc.committee_id,
          type: parentDoc.type,
          title: `${parentDoc.title} (Revised)`,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          status: 'SUBMITTED',
          parent_document_id: parentDoc.id,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;
      if (rev?.id) await notifyDocumentUploaded(rev.id as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
      toast.success('Revision submitted');
    }
  });

  const handleRevisionUpload = async (parentDoc: any, file: File) => {
    if (!isAllowedMime(file.type) || file.size > maxBytes) {
      toast.error('Invalid file type or file too large.');
      return;
    }
    try {
      await revisionMutation.mutateAsync({ parentDoc, file });
    } catch (err) {
      console.error(err);
    }
  };

  if (documentsLoading && !documents) {
    return <LoadingSpinner className="py-20" />;
  }
  if (documentsError) {
    return <QueryErrorState message="Failed to load documents." onRetry={() => refetchDocuments()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Zone */}
      <div className="border border-border-subtle rounded-card overflow-hidden bg-bg-card shadow-sm">
        <div className="flex border-b border-border-subtle">
          <button
            type="button"
            className={`flex-1 py-3 text-[10px] font-jotia uppercase tracking-widest transition-colors ${uploadSource === 'file' ? 'bg-bg-raised text-text-primary' : 'text-text-dimmed hover:text-text-secondary'}`}
            onClick={() => setUploadSource('file')}
          >
            Upload file
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-[10px] font-jotia uppercase tracking-widest transition-colors ${uploadSource === 'url' ? 'bg-bg-raised text-text-primary' : 'text-text-dimmed hover:text-text-secondary'}`}
            onClick={() => setUploadSource('url')}
          >
            Add URL
          </button>
        </div>

        {uploadSource === 'file' ? (
          <div
            className={`p-10 text-center transition-all ${
              dragOver ? 'bg-bg-raised ring-2 ring-inset ring-text-primary' : 'bg-transparent'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleUpload(e.target.files[0]);
              }}
            />
            
            <div className="max-w-xs mx-auto mb-6">
              <label className="text-[10px] text-text-tertiary font-jotia block mb-2 uppercase tracking-widest">Select Document Type</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-11 bg-bg-card border border-border-subtle rounded-button px-4 text-sm font-jotia text-text-primary focus:ring-1 focus:ring-text-primary outline-none shadow-sm transition-all"
              >
                {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <p className="text-text-dimmed font-jotia text-sm mb-6">
              Drag and drop a file, or choose one. Max {Math.round(maxBytes / (1024 * 1024))}MB.
            </p>
            <Button onClick={() => fileRef.current?.click()} loading={uploading} className="px-12 h-11 shadow-sm">
              Choose file
            </Button>
            <p className="text-text-tertiary font-jotia text-[10px] mt-4 uppercase tracking-tighter opacity-60">PDF, Word, Excel, Images, or Video.</p>
          </div>
        ) : (
          <div className="p-8 space-y-5 text-left bg-bg-card/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-text-tertiary font-jotia block mb-1.5 uppercase tracking-widest">Document Type</label>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-11 bg-bg-base border border-border-subtle rounded-button px-4 text-sm font-jotia text-text-primary focus:ring-1 focus:ring-text-primary outline-none transition-all shadow-sm"
                >
                  {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary font-jotia block mb-1.5 uppercase tracking-widest">Title</label>
                <Input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="e.g. Resolution on Climate" className="h-11 shadow-sm" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary font-jotia block mb-1.5 uppercase tracking-widest">File URL</label>
              <Input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="https://drive.google.com/..." className="h-11 shadow-sm" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary font-jotia block mb-1.5 uppercase tracking-widest">Description / Note (optional)</label>
              <Textarea rows={2} value={urlDescription} onChange={(e) => setUrlDescription(e.target.value)} placeholder="Any notes for the reviewer..." className="shadow-sm" />
            </div>
            <Button
              loading={urlUploadMutation.isPending}
              disabled={!urlTitle.trim() || !urlValue.trim()}
              onClick={() => urlUploadMutation.mutate()}
              className="w-full h-11 shadow-sm"
            >
              Add Link to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-5 animate-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-text-primary font-jotia text-xs font-semibold uppercase tracking-wider">Uploading document...</p>
            <span className="text-text-primary font-jotia text-xs">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-bg-raised rounded-full h-1.5 overflow-hidden">
            <div className="bg-text-primary h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-10 py-4">
        {/* Reference Materials from Chair/Admin */}
        {resources.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-jotia uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              Reference Materials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res: any) => (
                <div key={res.id} className="bg-bg-card border border-border-subtle rounded-card p-5 hover:border-border-emphasized hover:shadow-md transition-all group relative overflow-hidden flex flex-col min-h-[140px]">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <FilePlus className="w-12 h-12" />
                  </div>
                  <p className="font-jotia-bold text-sm text-text-primary mb-2 line-clamp-2 leading-snug">{res.title}</p>
                  {res.description && <p className="text-[11px] font-jotia text-text-dimmed line-clamp-2 mb-4 leading-relaxed">{res.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle/30">
                    <span className="text-[10px] font-jotia text-text-tertiary uppercase tracking-wider">{new Date(res.created_at).toLocaleDateString()}</span>
                    <a 
                      href={res.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] font-jotia-bold text-text-primary uppercase tracking-widest hover:text-blue-500 transition-colors flex items-center gap-1.5"
                    >
                      View <X className="w-3 h-3 rotate-45" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delegate's Own Documents */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-jotia uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            My Documents
          </h3>
          
          {(documents || []).length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border-strong rounded-card bg-bg-raised/30">
              <div className="w-14 h-14 bg-bg-card border border-border-subtle rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FilePlus className="w-6 h-6 text-text-dimmed" />
              </div>
              <p className="text-text-primary font-jotia-bold text-sm mb-2">No documents yet</p>
              <p className="text-text-dimmed font-jotia text-xs max-w-sm mx-auto mb-6 leading-relaxed px-4">
                Upload a position paper or other committee material. Chairs and admins are notified automatically when you submit.
              </p>
              <Button variant="outline" size="sm" onClick={() => (uploadSource === 'file' ? fileRef.current?.click() : setUploadSource('url'))} className="font-jotia text-xs uppercase tracking-widest h-9 px-6 bg-bg-card">
                {uploadSource === 'file' ? 'Choose first file' : 'Add your first link'}
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-bg-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-raised/50">
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Title</th>
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Type</th>
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Date</th>
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Size</th>
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Status</th>
                      <th className="text-left px-5 py-4 text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(documents || []).map((doc) => (
                      <tr key={doc.id} onClick={() => openDrawer(doc)} className="border-b border-border-subtle/40 last:border-0 cursor-pointer hover:bg-bg-hover transition-colors">
                        <td className="px-5 py-4 font-jotia-bold text-text-primary">
                          {renaming === doc.id ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <input 
                                value={renameValue} 
                                onChange={(e) => setRenameValue(e.target.value)} 
                                className="bg-bg-raised border border-border-strong rounded px-3 py-1.5 text-sm text-text-primary focus:ring-1 focus:ring-text-primary outline-none" 
                                autoFocus 
                                onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)} 
                              />
                              <Button 
                                size="sm"
                                loading={renameMutation.isPending && renameMutation.variables?.docId === doc.id}
                                onClick={() => handleRename(doc.id)} 
                                className="text-[10px] h-8 px-4"
                              >
                                Save
                              </Button>
                            </div>
                          ) : doc.title}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold bg-bg-raised text-text-secondary border border-border-subtle uppercase tracking-tighter">
                            {doc.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-jotia text-text-dimmed text-xs uppercase">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-jotia text-text-dimmed text-xs uppercase">{formatSize(doc.file_size)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_VARIANT[doc.status] || ''}`}>
                            {doc.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-jotia text-text-dimmed text-xs uppercase">{doc.reviewer?.full_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {(documents || []).map((doc) => (
                  <div key={doc.id} onClick={() => openDrawer(doc)} className="bg-bg-card border border-border-subtle rounded-card p-5 cursor-pointer active:scale-[0.98] transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="font-jotia-bold text-text-primary text-sm leading-tight">{doc.title}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shrink-0 ${STATUS_VARIANT[doc.status] || ''}`}>
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-border-subtle/30 text-[10px] text-text-dimmed font-jotia uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border-emphasized/30" />{doc.type.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border-emphasized/30" />{formatSize(doc.file_size)}</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border-emphasized/30" />{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document Detail Drawer */}
      {drawerDoc && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerDoc(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative bg-bg-card w-full md:w-[550px] h-full overflow-y-auto shadow-2xl animate-slide-right border-l border-border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-bg-card border-b border-border-subtle p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="font-jotia-bold text-lg text-text-primary truncate max-w-[320px] leading-tight mb-1">{drawerDoc.title}</h3>
                <p className="text-[10px] font-jotia text-text-tertiary uppercase tracking-widest">{drawerDoc.type.replace(/_/g, ' ')}</p>
              </div>
              <button 
                onClick={() => setDrawerDoc(null)} 
                className="text-text-dimmed hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-bg-raised/50 rounded-full transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Revision Call to Action */}
            {drawerDoc.status === 'REVISION_REQUESTED' && drawerDoc.feedback && (
              <div className="bg-status-rejected-bg/40 border-b border-status-rejected-border p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-status-rejected-text mb-3">
                  <div className="w-2 h-2 rounded-full bg-status-rejected-text animate-pulse" />
                  <p className="font-jotia-bold text-xs uppercase tracking-widest">Action Required: Revision Requested</p>
                </div>
                <p className="text-text-primary font-jotia text-sm mb-5 leading-relaxed bg-bg-card/50 p-4 rounded-card border border-status-rejected-border/20 italic">
                  "{drawerDoc.feedback}"
                </p>
                <label className="inline-flex items-center justify-center w-full px-6 py-3 text-xs font-jotia-bold uppercase tracking-widest bg-text-primary text-bg-base rounded-button cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]">
                  {revisionMutation.isPending ? <LoadingSpinner size="sm" className="mr-3" /> : <FilePlus className="w-4 h-4 mr-3" />}
                  Upload Revised Version
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    disabled={revisionMutation.isPending} 
                    onChange={(e) => { 
                      if (e.target.files?.[0]) handleRevisionUpload(drawerDoc, e.target.files[0]); 
                    }} 
                  />
                </label>
              </div>
            )}

            <div className="p-6 space-y-8">
              {/* Media Preview Section */}
              <div className="space-y-4">
                <div className="hidden md:block overflow-hidden rounded-card border border-border-subtle shadow-inner bg-black/5 aspect-video relative">
                  <iframe 
                    src={drawerDoc.file_url} 
                    className="w-full h-full" 
                    title="Document Preview" 
                  />
                </div>
                <a 
                  href={drawerDoc.file_url} 
                  download 
                  className="flex items-center justify-center w-full gap-2 px-6 py-4 text-sm font-jotia-bold uppercase tracking-widest bg-bg-raised text-text-primary border border-border-strong rounded-button hover:bg-bg-hover transition-all active:scale-[0.99] shadow-sm"
                >
                  <X className="w-4 h-4 rotate-45" /> Download Document
                </a>
              </div>

              {/* Core Info Grid */}
              <div className="grid grid-cols-2 gap-6 bg-bg-raised/30 p-5 rounded-card border border-border-subtle">
                <div className="space-y-1">
                  <p className="text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Mime Type</p>
                  <p className="text-text-primary font-jotia text-xs font-bold truncate">{drawerDoc.mime_type || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Total Size</p>
                  <p className="text-text-primary font-jotia text-xs font-bold">{formatSize(drawerDoc.file_size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Submission Date</p>
                  <p className="text-text-primary font-jotia text-xs font-bold">{new Date(drawerDoc.uploaded_at).toLocaleDateString()} at {new Date(drawerDoc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-text-tertiary font-jotia text-[10px] uppercase tracking-widest">Current Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${STATUS_VARIANT[drawerDoc.status] || ''}`}>
                    {drawerDoc.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Interactive Tabs Section */}
              <div className="space-y-6">
                <div className="flex border-b border-border-subtle gap-8">
                  <button 
                    onClick={() => setDrawerTab('details')} 
                    className={`pb-4 text-[10px] font-jotia-bold uppercase tracking-widest border-b-2 transition-all min-h-[44px] ${drawerTab === 'details' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-dimmed hover:text-text-secondary'}`}
                  >
                    Information
                  </button>
                  <button 
                    onClick={() => setDrawerTab('versions')} 
                    className={`pb-4 text-[10px] font-jotia-bold uppercase tracking-widest border-b-2 transition-all min-h-[44px] ${drawerTab === 'versions' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-dimmed hover:text-text-secondary'}`}
                  >
                    History & Versions ({drawerVersions.length})
                  </button>
                </div>

                {drawerTab === 'details' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Status Log */}
                    <div className="space-y-4">
                      <h4 className="font-jotia-bold text-xs text-text-primary uppercase tracking-[0.1em]">Event Timeline</h4>
                      {drawerHistory.length === 0 ? (
                        <div className="p-6 text-center bg-bg-raised/20 rounded-card border border-dashed border-border-subtle">
                          <p className="text-text-tertiary font-jotia text-[10px] uppercase">Record is newly created. No status changes tracked.</p>
                        </div>
                      ) : (
                        <div className="space-y-0 pl-1">
                          {drawerHistory.map((h, i) => (
                            <div key={h.id} className="relative pl-6 pb-6 last:pb-0">
                              {i !== drawerHistory.length - 1 && (
                                <div className="absolute left-[3px] top-2 bottom-0 w-[1px] bg-border-strong/30" />
                              )}
                              <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-text-dimmed shadow-[0_0_0_4px_var(--bg-card)]" />
                              <p className="font-jotia-bold text-text-primary text-xs uppercase tracking-wider mb-1">{h.status.replace(/_/g, ' ')}</p>
                              <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase font-jotia mb-2">
                                <span>{h.changer?.full_name || 'System'}</span>
                                <span>&bull;</span>
                                <span>{new Date(h.changed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                              {h.note && (
                                <p className="bg-bg-raised/50 p-3 rounded-card text-text-dimmed font-jotia text-xs italic border border-border-subtle/30 shadow-sm leading-relaxed">
                                  "{h.note}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Feedback Display */}
                    {drawerDoc.feedback && (
                      <div className="space-y-3">
                        <h4 className="font-jotia-bold text-xs text-text-primary uppercase tracking-[0.1em]">Final Review Comments</h4>
                        <div className="relative p-5 rounded-card bg-bg-raised/50 border border-border-subtle shadow-sm">
                          <div className="absolute top-4 left-0 w-1 h-8 bg-text-emphasized rounded-r" />
                          <blockquote className="text-text-dimmed font-jotia text-sm italic leading-relaxed pl-2">
                            {drawerDoc.feedback}
                          </blockquote>
                          {drawerDoc.reviewer?.full_name && (
                            <p className="text-text-tertiary font-jotia text-[10px] mt-4 uppercase tracking-widest text-right italic">- {drawerDoc.reviewer.full_name}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === 'versions' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h4 className="font-jotia-bold text-xs text-text-primary uppercase tracking-[0.1em]">File Versioning</h4>
                    {drawerVersions.length === 0 ? (
                      <div className="p-8 text-center bg-bg-raised/20 rounded-card border border-dashed border-border-subtle">
                        <p className="text-text-tertiary font-jotia text-[10px] uppercase">No previous versions available.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drawerVersions.map((v) => (
                          <div key={v.id} className="flex items-center justify-between bg-bg-raised/50 hover:bg-bg-hover rounded-card p-4 border border-border-subtle transition-colors group shadow-sm">
                            <div className="space-y-1">
                              <p className="font-jotia-bold text-text-primary text-xs uppercase tracking-widest">Revision {v.version}</p>
                              <p className="font-jotia text-text-tertiary text-[10px] uppercase">{formatSize(v.file_size)} &bull; {new Date(v.uploaded_at).toLocaleDateString()}</p>
                            </div>
                            <a 
                              href={v.file_url} 
                              download 
                              className="h-10 px-4 flex items-center justify-center text-[10px] font-jotia-bold uppercase tracking-widest text-bg-base bg-text-primary rounded-button opacity-80 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Section */}
              <div className="flex gap-4 pt-8 border-t border-border-subtle">
                <Button
                  variant="outline"
                  className="flex-1 font-jotia-bold text-[10px] uppercase tracking-widest h-12 bg-bg-card shadow-sm"
                  onClick={() => { 
                    setRenaming(drawerDoc.id); 
                    setRenameValue(drawerDoc.title); 
                    setDrawerDoc(null); 
                  }}
                >
                  Rename Record
                </Button>
                {(drawerDoc.status !== 'APPROVED' || drawerDoc.type !== 'POSITION_PAPER') && (
                  <Button
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    className="flex-1 font-jotia-bold text-[10px] uppercase tracking-widest h-12 shadow-sm"
                    onClick={() => handleDelete(drawerDoc)}
                  >
                    Remove Document
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
