'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DelegateContext } from '../page';
import { LoadingSpinner } from '@/components/loading-spinner';

const STATUS_VARIANT: Record<string, string> = {
  SUBMITTED: 'bg-bg-raised text-text-secondary border border-border-subtle',
  UNDER_REVIEW: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
  APPROVED: 'bg-status-approved-bg text-status-approved-text border border-status-approved-border',
  REJECTED: 'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border',
  REVISION_REQUESTED: 'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border',
};

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

  // useQuery for Documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${ctx.user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: docError } = await supabase.from('documents').insert({
        user_id: ctx.user.id,
        committee_id: ctx.assignment?.committee_id || null,
        type: 'POSITION_PAPER',
        title: file.name.replace('.pdf', ''),
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: 'SUBMITTED',
      });

      if (docError) throw docError;

      await supabase.from('audit_logs').insert({
        actor_id: ctx.user.id,
        action: `Uploaded document: ${file.name}`,
        target_type: 'Document',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
    }
  });

  const handleUpload = async (file: File) => {
    if (!file.type.includes('pdf')) { alert('Only PDF files are accepted.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB.'); return; }

    setUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => setUploadProgress((p) => Math.min(p + 10, 90)), 200);

    try {
      await uploadMutation.mutateAsync(file);
      setUploadProgress(100);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
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

      await supabase.from('documents').insert({
        user_id: ctx.user.id,
        committee_id: parentDoc.committee_id,
        type: parentDoc.type,
        title: `${parentDoc.title} (Revised)`,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: 'SUBMITTED',
        parent_document_id: parentDoc.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-documents'] });
    }
  });

  const handleRevisionUpload = async (parentDoc: any, file: File) => {
    if (!file.type.includes('pdf') || file.size > 10 * 1024 * 1024) return;
    try {
      await revisionMutation.mutateAsync({ parentDoc, file });
    } catch (err) {
      console.error(err);
    }
  };

  if (documentsLoading) {
    return <LoadingSpinner label="Loading documents..." className="py-20" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-card p-8 text-center transition-colors ${
          dragOver ? 'border-text-primary bg-bg-raised' : 'border-border-emphasized'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleUpload(file);
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
        <div className="hidden md:block">
          <p className="text-text-dimmed font-jotia text-sm mb-2">Drag and drop a PDF file here, or</p>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 transition-opacity min-h-[44px]">
            Choose File
          </button>
          <p className="text-text-tertiary font-jotia text-xs mt-2">PDF only, max 10MB</p>
        </div>
        <div className="md:hidden">
          <button onClick={() => fileRef.current?.click()} className="w-full px-4 py-4 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 transition-opacity min-h-[44px]">
            Choose File to Upload
          </button>
          <p className="text-text-tertiary font-jotia text-xs mt-2">PDF only, max 10MB</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-4">
          <p className="text-text-dimmed font-jotia text-sm mb-2">Uploading...</p>
          <div className="w-full bg-bg-raised rounded-full h-2">
            <div className="bg-text-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Documents Table / Cards */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-dimmed font-jotia text-sm">No documents uploaded yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-bg-card border border-border-subtle rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-raised">
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Size</th>
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-text-dimmed font-jotia text-xs uppercase">Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} onClick={() => openDrawer(doc)} className="border-b border-border-subtle/50 cursor-pointer hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 font-jotia text-text-primary">
                      {renaming === doc.id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="bg-bg-raised border border-border-input rounded px-2 py-1 text-sm text-text-primary" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)} />
                          <button onClick={() => handleRename(doc.id)} className="text-xs text-text-primary px-2">Save</button>
                        </div>
                      ) : doc.title}
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-bg-raised text-text-secondary border border-border-subtle">{doc.type.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 font-jotia text-text-dimmed">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-jotia text-text-dimmed">{formatSize(doc.file_size)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${STATUS_VARIANT[doc.status] || ''}`}>{doc.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 font-jotia text-text-dimmed">{doc.reviewer?.full_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} onClick={() => openDrawer(doc)} className="bg-bg-card border border-border-subtle rounded-card p-4 cursor-pointer active:bg-bg-hover">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-jotia text-text-primary text-sm font-medium">{doc.title}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs shrink-0 ${STATUS_VARIANT[doc.status] || ''}`}>{doc.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-dimmed font-jotia">
                  <span>{doc.type.replace(/_/g, ' ')}</span>
                  <span>{formatSize(doc.file_size)}</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Document Drawer */}
      {drawerDoc && (
        <div className="fixed inset-0 z-50 flex justify-end md:justify-end" onClick={() => setDrawerDoc(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-bg-card w-full md:w-[500px] h-full md:h-full overflow-y-auto animate-slide-up md:animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-card border-b border-border-subtle p-4 flex items-center justify-between z-10">
              <h3 className="font-jotia-bold text-lg text-text-primary truncate">{drawerDoc.title}</h3>
              <button onClick={() => setDrawerDoc(null)} className="text-text-dimmed hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>

            {/* Revision Banner */}
            {drawerDoc.status === 'REVISION_REQUESTED' && drawerDoc.feedback && (
              <div className="bg-status-rejected-bg border-b border-status-rejected-border p-4">
                <p className="text-status-rejected-text font-jotia text-sm font-medium mb-2">Revision Requested</p>
                <p className="text-status-rejected-text/80 font-jotia text-xs mb-3">{drawerDoc.feedback}</p>
                <label className="inline-flex items-center px-3 py-2 text-xs font-jotia bg-bg-card text-text-primary rounded-button cursor-pointer hover:bg-bg-hover min-h-[44px]">
                  Upload Revised Version
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleRevisionUpload(drawerDoc, e.target.files[0]); }} />
                </label>
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* PDF Preview (Desktop) */}
              <div className="hidden md:block">
                <iframe src={drawerDoc.file_url} className="w-full h-[300px] rounded-card border border-border-subtle" title="PDF Preview" />
              </div>
              <a href={drawerDoc.file_url} download className="inline-flex items-center px-4 py-2 text-sm font-jotia bg-text-primary text-bg-base rounded-button hover:opacity-90 min-h-[44px]">
                Download
              </a>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-text-tertiary font-jotia text-xs">Type</p><p className="text-text-primary font-jotia">{drawerDoc.type.replace(/_/g, ' ')}</p></div>
                <div><p className="text-text-tertiary font-jotia text-xs">Size</p><p className="text-text-primary font-jotia">{formatSize(drawerDoc.file_size)}</p></div>
                <div><p className="text-text-tertiary font-jotia text-xs">Uploaded</p><p className="text-text-primary font-jotia">{new Date(drawerDoc.uploaded_at).toLocaleString()}</p></div>
                <div><p className="text-text-tertiary font-jotia text-xs">Status</p><p className="text-text-primary font-jotia">{drawerDoc.status.replace(/_/g, ' ')}</p></div>
              </div>

              {/* Tabs: Details / Versions */}
              <div className="flex border-b border-border-subtle">
                <button onClick={() => setDrawerTab('details')} className={`px-4 py-2 text-sm font-jotia border-b-2 min-h-[44px] ${drawerTab === 'details' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-dimmed'}`}>Details</button>
                <button onClick={() => setDrawerTab('versions')} className={`px-4 py-2 text-sm font-jotia border-b-2 min-h-[44px] ${drawerTab === 'versions' ? 'border-text-primary text-text-primary' : 'border-transparent text-text-dimmed'}`}>Versions ({drawerVersions.length})</button>
              </div>

              {drawerTab === 'details' && (
                <div className="space-y-4">
                  {/* Status History */}
                  <div>
                    <h4 className="font-jotia-bold text-sm text-text-primary mb-3">Status History</h4>
                    {drawerHistory.length === 0 ? (
                      <p className="text-text-dimmed font-jotia text-xs">No status changes yet.</p>
                    ) : (
                      <div className="space-y-3 relative pl-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border-subtle">
                        {drawerHistory.map((h) => (
                          <div key={h.id} className="relative">
                            <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-text-dimmed" />
                            <p className="font-jotia text-text-primary text-sm">{h.status.replace(/_/g, ' ')}</p>
                            <p className="font-jotia text-text-tertiary text-xs">{h.changer?.full_name || 'System'} &middot; {new Date(h.changed_at).toLocaleString()}</p>
                            {h.note && <p className="font-jotia text-text-dimmed text-xs mt-1">{h.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {drawerDoc.feedback && (
                    <div>
                      <h4 className="font-jotia-bold text-sm text-text-primary mb-2">Feedback</h4>
                      <blockquote className="border-l-2 border-border-emphasized pl-4 text-text-dimmed font-jotia text-sm italic">
                        {drawerDoc.feedback}
                      </blockquote>
                      {drawerDoc.reviewer?.full_name && (
                        <p className="text-text-tertiary font-jotia text-xs mt-2">- {drawerDoc.reviewer.full_name}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'versions' && (
                <div className="space-y-2">
                  {drawerVersions.length === 0 ? (
                    <p className="text-text-dimmed font-jotia text-xs">No additional versions.</p>
                  ) : (
                    drawerVersions.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-bg-raised rounded-card p-3">
                        <div>
                          <p className="font-jotia text-text-primary text-sm">Version {v.version}</p>
                          <p className="font-jotia text-text-tertiary text-xs">{formatSize(v.file_size)} &middot; {new Date(v.uploaded_at).toLocaleString()}</p>
                        </div>
                        <a href={v.file_url} download className="text-text-primary font-jotia text-xs hover:underline min-h-[44px] flex items-center px-2">Download</a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border-subtle">
                {drawerDoc.status === 'SUBMITTED' && (
                  <button
                    onClick={() => { setRenaming(drawerDoc.id); setRenameValue(drawerDoc.title); setDrawerDoc(null); }}
                    className="px-3 py-2 text-sm font-jotia bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover min-h-[44px]"
                  >
                    Rename
                  </button>
                )}
                {drawerDoc.status === 'SUBMITTED' && !drawerDoc.feedback && (
                  <button
                    onClick={() => handleDelete(drawerDoc)}
                    className="px-3 py-2 text-sm font-jotia bg-status-rejected-bg border border-status-rejected-border rounded-button text-status-rejected-text hover:opacity-90 min-h-[44px]"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
