"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { supabase } from "@/lib/supabase";
import { Card, Input, Badge, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { X, Loader2 } from "lucide-react";

const EDITABLE_FIELDS_LIST = [
  "full_name",
  "email",
  "phone_number",
  "grade",
  "date_of_birth",
  "emergency_contact_name",
  "emergency_contact_relation",
  "emergency_contact_phone",
  "preferred_committee",
  "allocated_country",
  "dietary_restrictions",
  "role",
  "status",
] as const;

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterCommittee, setFilterCommittee] = useState("ALL");
  const parentRef = useRef<HTMLDivElement>(null);

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // useQuery for Committees (needed for filters)
  const { data: committees = [] } = useQuery({
    queryKey: ['committees-list'],
    queryFn: async () => {
      const { data: committeesData, error } = await supabase.from("committees").select("id, name");
      if (error) throw error; 
      
      const { data: countsData } = await supabase.from("committee_assignments").select("committee_id");
      const counts: Record<string, number> = {};
      countsData?.forEach(ca => {
        counts[ca.committee_id] = (counts[ca.committee_id] || 0) + 1;
      });

      return (committeesData || []).map(c => ({
        id: c.id,
        name: c.name,
        count: counts[c.id] || 0
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: registrationData = { users: [], totalCount: 0 }, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['eb-registrations', filterStatus, filterRole, filterCommittee, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set('status', filterStatus);
      if (filterRole !== "ALL") params.set('role', filterRole);
      if (filterCommittee !== "ALL") params.set('committee_id', filterCommittee);
      if (debouncedSearch.trim().length >= 2) params.set('q', debouncedSearch.trim());

      const res = await fetch(`/api/eb/registrations?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch registrations');
      }
      return await res.json();
    },
    staleTime: 10 * 1000, // Faster refresh for EB
  });

  const allRows = registrationData.users || [];
  const totalCount = registrationData.totalCount || 0;

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
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const [fieldHistory, setFieldHistory] = useState<
    { id: string; field_name: string; old_value: string; new_value: string; changed_at: string; changed_by: string }[]
  >([]);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);

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
  if (isError) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load registrations.</p><button onClick={() => refetch()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;
  }

  const openDrawer = async (user: Record<string, unknown> & { id: string }) => {
    setSelectedUser(user);
    setAssignForm({
      committee_id: (user.committee_assignments as { committees?: { id?: string } }[] | undefined)?.[0]?.committees?.id || "",
      country: (user.committee_assignments as { country?: string }[] | undefined)?.[0]?.country || "",
      seat_number: (user.committee_assignments as { seat_number?: string }[] | undefined)?.[0]?.seat_number || "",
    });
    setProfileDraft({
      full_name: String(user.full_name ?? ""),
      email: String(user.email ?? ""),
      phone_number: String(user.phone_number ?? ""),
      grade: String(user.grade ?? ""),
      date_of_birth: String(user.date_of_birth ?? ""),
      emergency_contact_name: String(user.emergency_contact_name ?? ""),
      emergency_contact_relation: String(user.emergency_contact_relation ?? ""),
      emergency_contact_phone: String(user.emergency_contact_phone ?? ""),
      preferred_committee: String(user.preferred_committee ?? ""),
      allocated_country: String(user.allocated_country ?? ""),
      dietary_restrictions: String(user.dietary_restrictions ?? ""),
      role: String(user.role ?? ""),
      status: String(user.status ?? ""),
    });
    setDrawerOpen(true);

    const [{ data: userNotes }, { data: history }, histRes] = await Promise.all([
      supabase.from("user_notes").select("*, author:author_id(id, full_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*, actor:actor_id(id, full_name)").eq("target_id", user.id).order("performed_at", { ascending: false }),
      fetch(`/api/eb/registrations/field-history?user_id=${user.id}`).then((r) => r.json()),
    ]);
    setNotes(userNotes || []);
    setAuditHistory(history || []);
    setFieldHistory(histRes.history || []);
  };

  const runAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/eb/registrations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user_id: selectedUser.id, ...payload }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setShowSuspendModal(false);
        setNoteContent("");
        queryClient.invalidateQueries({ queryKey: ["eb-registrations"] });
        const { data: refreshedUser } = await supabase
          .from("users")
          .select(
            `id, email, full_name, role, status, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions, preferred_committee, allocated_country, created_at, committee_assignments!committee_assignments_user_id_fkey(id, committee_id, country, seat_number, committees(id, name))`,
          )
          .eq("id", selectedUser.id)
          .single();
        if (refreshedUser) await openDrawer(refreshedUser);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "Action failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async () => {
    if (
      !window.confirm(
        "This will permanently update this user in the database. A full history entry will be stored for each changed field. Continue?",
      )
    ) {
      return;
    }
    setSaveProfileLoading(true);
    try {
      const res = await fetch("/api/eb/registrations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_user_data",
          user_id: selectedUser.id,
          confirmDatabaseWrite: true,
          updatedData: profileDraft,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["eb-registrations"] });
        const { data: refreshedUser } = await supabase
          .from("users")
          .select(
            `id, email, full_name, role, status, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions, preferred_committee, allocated_country, created_at, committee_assignments!committee_assignments_user_id_fkey(id, committee_id, country, seat_number, committees(id, name))`,
          )
          .eq("id", selectedUser.id)
          .single();
        if (refreshedUser) await openDrawer(refreshedUser);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "Save failed.");
      }
    } finally {
      setSaveProfileLoading(false);
    }
  };

  const revertField = async (historyId: string) => {
    if (!window.confirm("Revert this field to the previous value stored in history?")) return;
    await runAction("revert_user_field", { history_id: historyId });
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
          <div className="relative w-full md:w-64">
            <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {isFetching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 animate-spin text-text-dimmed" /></div>}
          </div>
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
            {committees.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.count})</option>)}
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
                    if (!row) return null;
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
          <div className="relative w-full sm:max-w-[480px] bg-bg-base h-full border-l border-border-subtle shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-border-subtle bg-bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-raised border border-border-subtle flex items-center justify-center text-lg font-bold">
                  {(String(selectedUser.full_name || "?").slice(0, 2)).toUpperCase()}
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
                      <Button onClick={() => void runAction("approve")} loading={submitting}>
                        Approve User
                      </Button>
                      <Button variant="outline" onClick={() => setShowRejectModal(true)} disabled={submitting}>
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedUser.status === "APPROVED" && (
                    <Button
                      variant="outline"
                      className="border-status-rejected-border text-status-rejected-text"
                      onClick={() => setShowSuspendModal(true)}
                      disabled={submitting}
                    >
                      Suspend User
                    </Button>
                  )}
                  {selectedUser.status === "SUSPENDED" && (
                    <Button onClick={() => void runAction("reinstate")} loading={submitting}>
                      Reinstate User
                    </Button>
                  )}
                </div>
              </div>

              {/* Role & Committee */}
              <div className="space-y-4 bg-bg-card p-4 rounded-card border border-border-subtle">
                <SectionLabel>Assignment & Role</SectionLabel>
                <p className="text-xs text-text-dimmed">
                  Role and status are edited in the registration form below; save profile to apply (updates database with history).
                </p>
                
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <label className="text-xs text-text-dimmed block">Committee Assignment</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={assignForm.committee_id} onChange={(e) => setAssignForm({...assignForm, committee_id: e.target.value})}>
                    <option value="">No Committee</option>
                    {committees.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.count})</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Input placeholder="Country/Character" className="flex-1" value={assignForm.country} onChange={(e) => setAssignForm({...assignForm, country: e.target.value})} />
                    <Input placeholder="Seat" className="w-20" value={assignForm.seat_number} onChange={(e) => setAssignForm({...assignForm, seat_number: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!assignForm.committee_id}
                        loading={submitting}
                        onClick={() => void runAction("assign_committee", assignForm)}
                      >
                        Save Assignment
                      </Button>
                    {selectedUser.committee_assignments?.length > 0 && (
                      <Button size="sm" variant="outline" disabled={submitting} onClick={() => void runAction("remove_assignment")}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Registration Details — full edit */}
              <div className="space-y-4">
                <SectionLabel>Edit registration (database)</SectionLabel>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Full name</label>
                    <Input value={profileDraft.full_name || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Email</label>
                    <Input type="email" value={profileDraft.email || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, email: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Phone</label>
                      <Input value={profileDraft.phone_number || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, phone_number: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Grade</label>
                      <Input value={profileDraft.grade || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, grade: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Date of birth</label>
                    <Input type="date" value={profileDraft.date_of_birth?.slice(0, 10) || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, date_of_birth: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Emergency contact name</label>
                    <Input value={profileDraft.emergency_contact_name || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, emergency_contact_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Relation</label>
                      <Input value={profileDraft.emergency_contact_relation || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, emergency_contact_relation: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Emergency phone</label>
                      <Input value={profileDraft.emergency_contact_phone || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, emergency_contact_phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Preferred committee</label>
                    <Input value={profileDraft.preferred_committee || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, preferred_committee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Allocated country</label>
                    <Input value={profileDraft.allocated_country || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, allocated_country: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed block mb-1">Dietary restrictions</label>
                    <Textarea rows={2} value={profileDraft.dietary_restrictions || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, dietary_restrictions: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Role</label>
                      <select
                        className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                        value={profileDraft.role || ""}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, role: e.target.value }))}
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
                        <option value="PRESS">Press</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed block mb-1">Status</label>
                      <select
                        className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                        value={profileDraft.status || ""}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, status: e.target.value }))}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-text-dimmed">Registered: {selectedUser.created_at ? new Date(String(selectedUser.created_at)).toLocaleString() : "—"}</p>
                  <Button loading={saveProfileLoading || submitting} onClick={() => void saveProfile()} className="w-full">
                    Save profile changes
                  </Button>
                </div>
              </div>

              {/* Per-field history */}
              <div>
                <SectionLabel>Field change history</SectionLabel>
                <p className="text-xs text-text-dimmed mb-2">Revert restores the previous value and records a new history row.</p>
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {EDITABLE_FIELDS_LIST.map((field) => {
                    const rows = fieldHistory.filter((h) => h.field_name === field);
                    if (rows.length === 0) return null;
                    return (
                      <div key={field} className="border border-border-subtle rounded-card p-2 text-xs">
                        <p className="font-semibold text-text-primary mb-1">{field}</p>
                        {rows.slice(0, 8).map((h) => (
                          <div key={h.id} className="flex justify-between gap-2 py-1 border-t border-border-subtle first:border-0">
                            <span className="text-text-dimmed shrink-0">{new Date(h.changed_at).toLocaleString()}</span>
                            <span className="text-text-secondary truncate" title={`${h.old_value} -> ${h.new_value}`}>
                              {h.old_value || "(empty)"} {'->'} {h.new_value || "(empty)"}
                            </span>
                            <button type="button" className="text-status-warning-text shrink-0 underline" disabled={submitting} onClick={() => void revertField(h.id)}>
                              Revert
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {fieldHistory.length === 0 ? <p className="text-sm text-text-dimmed">No field edits recorded yet.</p> : null}
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <SectionLabel>Internal Notes</SectionLabel>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Add a note (visible only to EB/Admin)" className="flex-1" value={noteContent} onChange={e => setNoteContent(e.target.value)} />
                    <Button disabled={!noteContent.trim() || submitting} onClick={() => void runAction("add_note", { content: noteContent })}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                      Save
                    </Button>
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
                      <p className="text-xs text-text-dimmed">{log.actor?.full_name || 'System'} &middot; {new Date(log.performed_at).toLocaleString()}</p>
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
              <Button
                className="flex-1 border-status-rejected-border text-status-rejected-text"
                disabled={submitting}
                onClick={() => void runAction("reject", { reason: rejectReason })}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Confirm Rejection
              </Button>
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
              <Button
                className="flex-1 border-status-rejected-border text-status-rejected-text"
                disabled={!suspendReason.trim() || submitting}
                onClick={() => void runAction("suspend", { reason: suspendReason })}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Confirm Suspension
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
