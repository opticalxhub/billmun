"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Input, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { X, FileText, Users, Search, Clock } from "lucide-react";
import { DashboardLoadingState } from "@/components/dashboard-shell";

export default function DocumentsDashPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCommittee, setFilterCommittee] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  // Drawer
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user?.id);

      const [{ data: docs }, { data: comms }] = await Promise.all([
        supabase.from("documents").select("*, users(full_name, email, role), committees(name)").order("uploaded_at", { ascending: false }),
        supabase.from("committees").select("id, name")
      ]);
      
      setDocuments(docs || []);
      setCommittees(comms || []);
    } catch (e) {
      console.error(e);
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDrawer = async (doc: any) => {
    setSelectedDoc(doc);
    setFeedback(doc.feedback || "");
    setDrawerOpen(true);
    // Try to fetch history, ignore if table doesn't exist
    const { data } = await supabase.from("document_status_history").select("*, user:changed_by(full_name)").eq("document_id", doc.id).order("created_at", { ascending: false }).then(res => res.error ? { data: [] } : res);
    setHistory(data || []);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedDoc(null);
  };

  const runAction = async (action: "approve" | "revise" | "reject") => {
    if (["revise", "reject"].includes(action) && !feedback.trim()) {
      alert("Feedback is required for this action.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/eb/documents/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, doc_id: selectedDoc.id, feedback, ebUserId: currentUser }),
    });
    setSubmitting(false);
    if (res.ok) {
      await load();
      closeDrawer();
    } else {
      const err = await res.json();
      alert(err.error || "Action failed");
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || doc.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "ALL" || doc.status === filterStatus;
      const matchCommittee = filterCommittee === "ALL" || doc.committee_id === filterCommittee;
      const matchType = filterType === "ALL" || doc.type === filterType;
      return matchSearch && matchStatus && matchCommittee && matchType;
    });
  }, [documents, searchTerm, filterStatus, filterCommittee, filterType]);

  if (loading) {
    return <DashboardLoadingState type="table" />;
  }
  if (fetchError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load documents.</p><button onClick={() => load()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;

  return (
    <div className="space-y-6 font-inter h-full flex flex-col">
      <div>
        <h1 className="font-jotia-bold text-3xl text-text-primary mb-2 uppercase tracking-tight">Documents</h1>
        <p className="text-text-dimmed">Review and manage all submitted position papers and resolutions.</p>
      </div>

      <Card className="flex flex-col gap-4 p-4 border border-border-subtle bg-bg-card shrink-0">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dimmed" />
            <Input placeholder="Search title or delegate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-primary outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REVISION_REQUESTED">Needs Revision</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-primary outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="POSITION_PAPER">Position Paper</option>
            <option value="RESOLUTION">Resolution</option>
            <option value="SPEECH">Speech</option>
          </select>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-primary outline-none" value={filterCommittee} onChange={e => setFilterCommittee(e.target.value)}>
            <option value="ALL">All Committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Card>

      <div className="flex-1 overflow-x-auto overflow-y-auto border border-border-subtle rounded-card bg-bg-card">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center min-h-[400px]">
            <FileText className="w-16 h-16 text-text-dimmed mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-text-primary mb-2 uppercase tracking-tight">No submissions detected</h3>
            <p className="text-sm text-text-dimmed max-w-md">
              Documents will appear here once delegates or staff begin uploading materials to the platform.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-bg-raised sticky top-0 z-10">
              <tr className="border-b border-border-subtle">
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]"><div className="flex items-center gap-2"><FileText className="w-3 h-3" /> Document</div></th>
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]"><div className="flex items-center gap-2"><Users className="w-3 h-3" /> User</div></th>
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]">Role</th>
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]">Committee</th>
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]">Type</th>
                <th className="p-4 text-text-secondary font-bold uppercase tracking-widest text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} onClick={() => openDrawer(doc)} className="hover:bg-text-primary/5 cursor-pointer transition-colors group">
                  <td className="p-4">
                    <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">{doc.title || 'Untitled Document'}</div>
                    <div className="text-[10px] text-text-dimmed mt-1 flex items-center gap-1 uppercase font-bold tracking-tighter">
                      <Clock className="w-3 h-3 opacity-50" />
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{doc.users?.full_name || 'Unknown'}</div>
                    <div className="text-[10px] text-text-dimmed font-mono">{doc.users?.email}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant="default" className="text-[9px] uppercase font-black tracking-widest border-border-emphasized/30">{doc.users?.role || '-'}</Badge>
                  </td>
                  <td className="p-4 text-text-secondary font-medium">{doc.committees?.name || "-"}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary bg-bg-raised px-2 py-1 rounded border border-white/5">{doc.type}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={doc.status === 'APPROVED' ? 'approved' : doc.status === 'REJECTED' || doc.status === 'REVISION_REQUESTED' ? 'rejected' : 'pending'}>
                      {doc.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && documents.length > 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-dimmed">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Search className="w-12 h-12" />
                      <p className="font-jotia text-lg uppercase tracking-widest">No matching results</p>
                      <p className="text-xs">Try adjusting your search terms or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
          <div className="relative w-full sm:max-w-[600px] bg-bg-base h-full border-l border-border-subtle shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-border-subtle bg-bg-card flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{selectedDoc.title}</h2>
                <p className="text-sm text-text-dimmed">By {selectedDoc.users?.full_name}</p>
              </div>
              <button onClick={closeDrawer} className="p-2 text-text-dimmed hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* PDF Preview */}
              <div className="rounded-card overflow-hidden border border-border-subtle bg-bg-raised aspect-[1/1.2] relative">
                {selectedDoc.file_url ? (
                  <iframe src={`${selectedDoc.file_url}#view=FitH`} className="absolute inset-0 w-full h-full border-0" />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-dimmed">No file preview available</div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-bg-card p-4 rounded-card border border-border-subtle">
                <div><span className="text-text-dimmed block text-xs">Type</span>{selectedDoc.type}</div>
                <div><span className="text-text-dimmed block text-xs">Size</span>{(selectedDoc.file_size / 1024).toFixed(1)} KB</div>
                <div><span className="text-text-dimmed block text-xs">Uploaded</span>{new Date(selectedDoc.uploaded_at).toLocaleString()}</div>
                <div>
                  <span className="text-text-dimmed block text-xs mb-1">Status</span>
                  <Badge variant={selectedDoc.status === 'APPROVED' ? 'approved' : selectedDoc.status === 'REJECTED' || selectedDoc.status === 'REVISION_REQUESTED' ? 'rejected' : 'pending'}>
                    {selectedDoc.status}
                  </Badge>
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <SectionLabel>Review & Action</SectionLabel>
                <Textarea 
                  rows={4} 
                  placeholder="Enter feedback for the delegate (Required for Revision/Rejection)" 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)} 
                />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => runAction("approve")} disabled={submitting}>Approve</Button>
                  <Button variant="outline" className="flex-1 text-status-pending-text border-status-pending-border" onClick={() => runAction("revise")} disabled={submitting || !feedback.trim()}>Request Revision</Button>
                  <Button variant="outline" className="flex-1 text-status-rejected-text border-status-rejected-border" onClick={() => runAction("reject")} disabled={submitting || !feedback.trim()}>Reject</Button>
                </div>
              </div>

              {/* History Timeline */}
              {history.length > 0 && (
                <div>
                  <SectionLabel>Status History</SectionLabel>
                  <div className="mt-3 pl-2 border-l-2 border-border-subtle space-y-4">
                    {history.map((log, i) => (
                      <div key={i} className="relative pl-4">
                        <div className="absolute w-2 h-2 rounded-full bg-border-emphasized -left-[5px] top-1.5" />
                        <p className="text-sm font-semibold">{log.status}</p>
                        <p className="text-xs text-text-dimmed">{log.user?.full_name || 'System'} • {new Date(log.created_at || log.changed_at).toLocaleString()}</p>
                        {log.feedback && <p className="text-sm mt-1 text-text-secondary bg-bg-raised p-2 rounded">{log.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
