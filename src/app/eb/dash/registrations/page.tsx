"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { supabase } from "@/lib/supabase";
import { Card, Input, Badge, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { X, Check, Filter, Search, MoreVertical, Shield, Mail, Trash2, Ban, Pause, Play, UserCheck, UserX, Clock, MapPin, Phone, Calendar, Mail as MailIcon } from "lucide-react";

const PAGE_SIZE = 50;

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterCommittee, setFilterCommittee] = useState("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // useQuery for Committees (needed for filters)
  const { data: committees = [] } = useQuery({
    queryKey: ['committees-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from("committees").select("id, name");
      if (error) throw error; 
      return (data || []).map(c => ({
        id: c.id,
        name: c.name
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: registrationData = { users: [], totalCount: 0 },
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['eb-registrations', filterStatus, filterRole, filterCommittee, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set('status', filterStatus);
      if (filterRole !== "ALL") params.set('role', filterRole);
      if (filterCommittee !== "ALL") params.set('committee_id', filterCommittee);
      if (search) params.set('q', search);

      const res = await fetch(`/api/eb/registrations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch registrations');
      return await res.json();
    },
    staleTime: 30 * 1000,
  });

  const allRows = registrationData.users || [];
  const totalCount = registrationData.totalCount || 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setCurrentUser(data.user.id);
    });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("registrations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const virtualizer = useVirtualizer({
    count: allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [assignForm, setAssignForm] = useState({ committee_id: "", country: "", seat_number: "" });

  const closeDrawer = React.useCallback(() => {
    setDrawerOpen(false);
    setSelectedUser(null);
    setShowRejectModal(false);
    setShowSuspendModal(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRejectModal) setShowRejectModal(false);
        else if (showSuspendModal) setShowSuspendModal(false);
        else closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDrawer, showRejectModal, showSuspendModal]);

  if (isLoading) return <DashboardLoadingState type="overview" />;

  const openDrawer = async (user: any) => {
    setSelectedUser(user);
    setAssignForm({
      committee_id: user.committee_assignments?.[0]?.committees?.id || "",
      country: user.committee_assignments?.[0]?.country || "",
      seat_number: user.committee_assignments?.[0]?.seat_number || "",
    });
    setDrawerOpen(true);
    
    // Fetch additional drawer data
    const [{ data: userNotes }, { data: history }] = await Promise.all([
      supabase.from("user_notes").select("*, author:author_id(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*, actor:actor_id(full_name)").eq("target_id", user.id).order("performed_at", { ascending: false })
    ]);
    setNotes(userNotes || []);
    setAuditHistory(history || []);
  };

  const runAction = async (action: string, payload: any = {}) => {
    setSubmitting(true);
    const res = await fetch("/api/eb/registrations/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, user_id: selectedUser.id, ebUserId: currentUser, ...payload }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowRejectModal(false);
      setShowSuspendModal(false);
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ['eb-registrations'] });  
      // Update selectedUser local state from refreshed rows
      const { data: refreshedUser } = await supabase.from("users").select(`*, committee_assignments(id, country, seat_number, committees(id, name))`).eq("id", selectedUser.id).single();
      if (refreshedUser) openDrawer(refreshedUser);
    } else {
      alert("Action failed. Check console.");
    }
  };

  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Role", "Status", "Grade", "Committee", "Country"];
    const csvContent = [
      headers.join(","),
      ...allRows.map((r: any) => [
        `"${r.full_name}"`,
        `"${r.email}"`,
        r.role,
        r.status,
        r.grade || "",
        `"${r.committee_assignments?.[0]?.committees?.name || ''}"`,
        `"${r.committee_assignments?.[0]?.country || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "registrations.csv");
    link.click();
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-jotia-bold uppercase tracking-tight">Registrations</h1>
          <Badge variant="default" className="font-mono">{totalCount} Total</Badge>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm">Export CSV</Button>
      </div>

      <Card className="flex flex-col gap-4 p-4 border border-border-subtle bg-bg-card shrink-0">
        <div className="flex flex-wrap gap-3 items-center">
          <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-64" />
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="DELEGATE">Delegate</option>
            <option value="CHAIR">Chair</option>
            <option value="CO_CHAIR">Co-Chair</option>
            <option value="ADMIN">Admin</option>
            <option value="MEDIA">Media</option>
            <option value="SECURITY">Security</option>
            <option value="EXECUTIVE_BOARD">Executive Board</option>
          </select>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={filterCommittee} onChange={e => setFilterCommittee(e.target.value)}>
            <option value="ALL">All Committees</option>
            {committees.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Card>

      <div className="flex-1 overflow-hidden border border-border-subtle rounded-card bg-bg-card relative">
        <div className="h-full overflow-auto" ref={parentRef}>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-bg-raised sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary w-[25%]">Name</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary w-[15%]">Status</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary w-[15%]">Role</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary w-[25%]">Committee</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary w-[20%]">Country</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
                <td colSpan={5} className="p-0 relative">
                  {virtualItems.map((virtualItem) => {
                    const row = allRows[virtualItem.index];
                    return (
                      <div
                        key={row.id}
                        onClick={() => openDrawer(row)}
                        className="absolute top-0 left-0 w-full flex border-b border-border-subtle hover:bg-bg-raised cursor-pointer transition-colors"
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="p-3 w-[25%] truncate">
                          <div className="font-medium text-text-primary">{row.full_name}</div>
                          <div className="text-[11px] text-text-dimmed">{row.email}</div>
                        </div>
                        <div className="p-3 w-[15%] flex items-center">
                          <Badge variant={row.status === 'APPROVED' ? 'approved' : row.status === 'REJECTED' || row.status === 'SUSPENDED' ? 'rejected' : 'pending'}>
                            {row.status}
                          </Badge>
                        </div>
                        <div className="p-3 w-[15%] flex items-center">
                          <Badge variant="default">{row.role}</Badge>
                        </div>
                        <div className="p-3 w-[25%] flex flex-col justify-center">
                          <p className="text-text-secondary truncate">{row.committee_assignments?.[0]?.committees?.name || "Unassigned"}</p>
                          <p className="text-[11px] text-text-dimmed">Grade {row.grade || '?'}</p>
                        </div>
                        <div className="p-3 w-[20%] flex items-center truncate">
                          <span className="text-text-primary font-medium">{row.committee_assignments?.[0]?.country || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>
          {allRows.length === 0 && (
            <div className="p-20 text-center text-text-dimmed italic">No matching registrations found.</div>
          )}
        </div>
      </div>

      {/* Slide-over Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
          <div className="relative w-full max-w-[480px] bg-bg-base h-full border-l border-border-subtle shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-border-subtle bg-bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-raised border border-border-subtle flex items-center justify-center text-lg font-bold">
                  {selectedUser.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{selectedUser.full_name}</h2>
                  <p className="text-sm text-text-dimmed">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="p-2 text-text-dimmed hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <SectionLabel>Current Status</SectionLabel>
                  <Badge variant={selectedUser.status === 'APPROVED' ? 'approved' : selectedUser.status === 'REJECTED' || selectedUser.status === 'SUSPENDED' ? 'rejected' : 'pending'}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.status === "PENDING" && (
                    <>
                      <Button onClick={() => runAction("approve")} disabled={submitting}>Approve User</Button>
                      <Button variant="outline" onClick={() => setShowRejectModal(true)}>Reject</Button>
                    </>
                  )}
                  {selectedUser.status === "APPROVED" && (
                    <Button variant="outline" className="border-status-rejected-border text-status-rejected-text" onClick={() => setShowSuspendModal(true)}>Suspend User</Button>
                  )}
                  {selectedUser.status === "SUSPENDED" && (
                    <Button onClick={() => runAction("reinstate")} disabled={submitting}>Reinstate User</Button>
                  )}
                </div>
              </div>

              {/* Role & Committee */}
              <div className="space-y-4 bg-bg-card p-4 rounded-card border border-border-subtle">
                <SectionLabel>Assignment & Role</SectionLabel>
                <div>
                  <label className="text-xs text-text-dimmed mb-1 block">Role</label>
                  <select 
                    className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" 
                    value={selectedUser.role} 
                    onChange={(e) => runAction("change_role", { role: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="DELEGATE">Delegate</option>
                    <option value="CHAIR">Chair</option>
                    <option value="CO_CHAIR">Co-Chair</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEDIA">Media</option>
                    <option value="SECURITY">Security</option>
                    <option value="EXECUTIVE_BOARD">Executive Board</option>
                    <option value="SECRETARY_GENERAL">Secretary General</option>
                    <option value="DEPUTY_SECRETARY_GENERAL">Deputy Secretary General</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <label className="text-xs text-text-dimmed block">Committee Assignment</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={assignForm.committee_id} onChange={(e) => setAssignForm({...assignForm, committee_id: e.target.value})}>
                    <option value="">No Committee</option>
                    {committees.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.count} del)</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Input placeholder="Country/Character" className="flex-1" value={assignForm.country} onChange={(e) => setAssignForm({...assignForm, country: e.target.value})} />
                    <Input placeholder="Seat" className="w-20" value={assignForm.seat_number} onChange={(e) => setAssignForm({...assignForm, seat_number: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled={!assignForm.committee_id || submitting} onClick={() => runAction("assign_committee", assignForm)}>Save Assignment</Button>
                    {selectedUser.committee_assignments?.length > 0 && (
                      <Button size="sm" variant="outline" disabled={submitting} onClick={() => runAction("remove_assignment")}>Remove</Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              <div>
                <SectionLabel>Registration Details</SectionLabel>
                <div className="mt-3 grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div><p className="text-text-dimmed text-xs">Date of Birth</p><p>{selectedUser.date_of_birth || 'N/A'}</p></div>
                  <div><p className="text-text-dimmed text-xs">Grade</p><p>{selectedUser.grade || 'N/A'}</p></div>
                  <div><p className="text-text-dimmed text-xs">Phone</p><p>{selectedUser.phone_number || 'N/A'}</p></div>
                  <div><p className="text-text-dimmed text-xs">Registered</p><p>{new Date(selectedUser.created_at).toLocaleString()}</p></div>
                  <div className="col-span-2 pt-2 border-t border-border-subtle"><p className="text-text-dimmed text-xs mb-1">Emergency Contact</p><p>{selectedUser.emergency_contact_name || 'N/A'} ({selectedUser.emergency_contact_relation || 'N/A'}) - {selectedUser.emergency_contact_phone || 'N/A'}</p></div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <SectionLabel>Internal Notes</SectionLabel>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Add a note (visible only to EB/Admin)" className="flex-1" value={noteContent} onChange={e => setNoteContent(e.target.value)} />
                    <Button disabled={!noteContent.trim() || submitting} onClick={() => runAction("add_note", { content: noteContent })}>Save</Button>
                  </div>
                  <div className="space-y-2">
                    {notes.map(n => (
                      <div key={n.id} className="p-3 bg-bg-raised border border-border-subtle rounded text-sm">
                        <p className="text-text-secondary">{n.content}</p>
                        <div className="mt-2 text-[10px] text-text-dimmed flex justify-between">
                          <span>{n.author?.full_name}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div>
                <SectionLabel>Status History & Audit</SectionLabel>
                <div className="mt-3 pl-2 border-l-2 border-border-subtle space-y-4">
                  {auditHistory.map(log => (
                    <div key={log.id} className="relative pl-4">
                      <div className="absolute w-2 h-2 rounded-full bg-border-emphasized -left-[5px] top-1.5" />
                      <p className="text-sm">{log.action}</p>
                      <p className="text-xs text-text-dimmed">{log.actor?.full_name || 'System'} • {new Date(log.performed_at).toLocaleString()}</p>
                    </div>
                  ))}
                  {auditHistory.length === 0 && <p className="text-sm text-text-dimmed ml-4">No audit logs found.</p>}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-bg-card p-6 rounded-card border border-border-subtle w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Registration</h3>
            <Textarea rows={3} placeholder="Optional rejection reason (sent in email)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="mb-4" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button className="flex-1 border-status-rejected-border text-status-rejected-text" onClick={() => runAction("reject", { reason: rejectReason })}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-bg-card p-6 rounded-card border border-border-subtle w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Suspend User</h3>
            <Textarea rows={3} placeholder="Reason for suspension" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} className="mb-4" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
              <Button className="flex-1 border-status-rejected-border text-status-rejected-text" disabled={!suspendReason.trim()} onClick={() => runAction("suspend", { reason: suspendReason })}>Confirm Suspension</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
