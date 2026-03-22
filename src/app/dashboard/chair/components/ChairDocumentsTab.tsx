'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Textarea } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';
import { X, ExternalLink } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  APPROVED: 'bg-green-500/15 text-green-400 border-green-500/30',
  NEEDS_REVISION: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function ChairDocumentsTab({ ctx }: { ctx: ChairContext }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState('PENDING');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [consolidating, setConsolidating] = useState(false);

  useEffect(() => { loadDocuments(); }, [ctx.committee?.id]);

  const loadDocuments = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('documents')
      .select('*, user:user_id(full_name, email)')
      .eq('committee_id', ctx.committee.id)
      .order('uploaded_at', { ascending: false })
      .limit(50);
    setDocuments(data || []);
  };

  const openReview = (doc: any) => {
    setSelected(doc);
    setReviewStatus(doc.status);
    setFeedback(doc.feedback || '');
  };

  const submitReview = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents/apply-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          document_id: selected.id,
          status: reviewStatus,
          feedback: feedback || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Review failed");
      }

      await supabase.from("session_events").insert({
        committee_id: ctx.committee.id,
        session_id: ctx.session?.id,
        event_type: "DOCUMENT_REVIEW",
        title: `Document "${selected.title}" reviewed — ${reviewStatus}`,
        description: feedback || null,
        created_by: ctx.user.id,
      });

      setSelected(null);
      await loadDocuments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Review failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const consolidate = async () => {
    if (selectedIds.size < 2) return;
    const sourceDocs = documents.filter(d => selectedIds.has(d.id) && d.status === 'APPROVED');
    if (sourceDocs.length < 2) return;
    if (!ctx.committee?.id || !ctx.user?.id) return;
    setConsolidating(true);
    try {
      const mergedText = [
        `Consolidated Resolution Draft`,
        `Committee: ${ctx.committee?.name || '-'}`,
        `Generated: ${new Date().toISOString()}`,
        ``,
        `Included Documents (${sourceDocs.length}):`,
        ...sourceDocs.map((d, i) => `${i + 1}. ${d.title} (${d.user?.full_name || 'Unknown'})`),
        ``,
        `Source URLs:`,
        ...sourceDocs.map((d) => `- ${d.file_url || 'No source URL'}`),
      ].join('\n');

      const fileBlob = new Blob([mergedText], { type: 'text/plain;charset=utf-8' });
      const fileName = `consolidated/${ctx.committee.id}/${Date.now()}-consolidated-resolution.txt`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, fileBlob, {
        contentType: 'text/plain',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('documents').insert({
        user_id: ctx.user.id,
        committee_id: ctx.committee.id,
        type: 'RESOLUTION',
        title: `Resolution Draft — Consolidated from ${sourceDocs.length} papers`,
        file_url: urlData.publicUrl,
        file_size: fileBlob.size,
        mime_type: 'text/plain',
        status: 'PENDING',
        feedback: `Consolidated from: ${sourceDocs.map(d => d.title).join(', ')}`,
      });
      if (insertError) throw insertError;

      await supabase.from('session_events').insert({
        committee_id: ctx.committee.id,
        session_id: ctx.session?.id,
        event_type: 'DOCUMENT_CONSOLIDATION',
        title: `Consolidated ${sourceDocs.length} approved papers`,
        description: `Created consolidated artifact from: ${sourceDocs.map((d) => d.title).join(', ')}`,
        created_by: ctx.user.id,
      });

      setSelectedIds(new Set());
      await loadDocuments();
    } finally {
      setConsolidating(false);
    }
  };

  const approvedPapers = documents.filter(d => d.status === 'APPROVED' && d.type !== 'RESOLUTION');

  const uploadChairDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ctx.committee?.id || !ctx.user?.id) return;
    setSaving(true);
    try {
      const fileName = `chair/${ctx.committee.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file, {
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("documents").insert({
        user_id: ctx.user.id,
        committee_id: ctx.committee.id,
        type: "SPEECH",
        title: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: "APPROVED",
      });
      if (insertError) throw insertError;
      alert("Document uploaded successfully.");
      await loadDocuments();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-jotia-bold text-2xl text-text-primary">Documents</h2>
          <p className="text-text-dimmed text-sm">{documents.length} submissions for {ctx.committee?.name || 'committee'}</p>
        </div>
        <div className="flex gap-3">
          <label className="inline-flex h-10 items-center justify-center rounded-button px-4 text-sm font-bold uppercase tracking-widest text-text-primary border border-border-subtle hover:bg-bg-raised transition-colors cursor-pointer relative overflow-hidden">
            {saving ? 'Uploading...' : 'Upload Resource'}
            <input type="file" className="hidden" onChange={uploadChairDocument} disabled={saving} />
          </label>
          {selectedIds.size >= 2 && (
            <Button onClick={consolidate} disabled={consolidating}>{consolidating ? 'Consolidating...' : `Consolidate Selected (${selectedIds.size})`}</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Document List */}
        <div className="flex-1">
          <Card>
            <SectionLabel>All Submissions</SectionLabel>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="p-3 w-8"></th>
                    <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Delegate</th>
                    <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Title</th>
                    <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Type</th>
                    <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Date</th>
                    <th className="p-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-bg-raised/30 cursor-pointer" onClick={() => openReview(doc)}>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="rounded" />
                      </td>
                      <td className="p-3 text-sm text-text-primary">{doc.user?.full_name || 'Unknown'}</td>
                      <td className="p-3 text-sm text-text-primary font-medium">{doc.title}</td>
                      <td className="p-3 text-xs text-text-secondary uppercase">{doc.type?.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-xs text-text-dimmed">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[doc.status] || ''}`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-text-dimmed text-sm">No documents submitted yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 bg-bg-raised rounded-card border border-border-subtle" onClick={() => openReview(doc)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{doc.title}</p>
                      <p className="text-xs text-text-dimmed mt-0.5">{doc.user?.full_name} · {doc.type?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${STATUS_STYLES[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Approved Working Papers */}
          {approvedPapers.length > 0 && (
            <Card className="mt-6">
              <SectionLabel>Approved Working Papers</SectionLabel>
              <div className="space-y-2">
                {approvedPapers.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-card border border-green-500/20">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{doc.title}</p>
                      <p className="text-xs text-text-dimmed">{doc.user?.full_name}</p>
                    </div>
                    <input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="rounded" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Review Panel (Desktop side drawer, Mobile full sheet) */}
        {selected && (
          <div className="lg:w-[400px] w-full">
            <Card className="lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel className="mb-0">Review Document</SectionLabel>
                <button onClick={() => setSelected(null)} className="text-text-dimmed hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Title</p>
                  <p className="text-sm text-text-primary font-medium">{selected.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Delegate</p>
                  <p className="text-sm text-text-primary">{selected.user?.full_name}</p>
                </div>
                {selected.file_url && (
                  <div className="space-y-2">
                    <div className="bg-bg-raised rounded-card border border-border-subtle overflow-hidden" style={{ height: '300px' }}>
                      <iframe src={selected.file_url} className="w-full h-full bg-bg-base" title="Document preview" />
                    </div>
                    <a 
                      href={selected.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full p-2 text-xs font-bold text-text-primary border border-border-subtle rounded-md hover:bg-bg-raised transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in New Tab
                    </a>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Status</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="NEEDS_REVISION">Needs Revision</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">Feedback</label>
                  <Textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Write feedback for the delegate..." />
                </div>
                <Button onClick={() => void submitReview()} loading={saving} className="w-full min-h-[48px]">
                  Submit Review
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
