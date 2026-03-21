"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Input, Badge, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";

export default function LiveMonitorPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterCommittee, setFilterCommittee] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterOnline, setFilterOnline] = useState(false);

  // Drawer state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({ committeeId: "", country: "", seatNumber: "" });
  const [noteContent, setNoteContent] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    setCurrentUser(sessionData.session?.user?.id);

    const [
      { data: users },
      { data: comms },
      { data: statusLogs },
      { data: latestAudits }
    ] = await Promise.all([
      supabase.from("users").select(`
        *,
        committee_assignments(id, country, seat_number, committees(id, name))
      `).eq("status", "APPROVED"),
      supabase.from("committees").select("id, name"),
      supabase.from("delegate_status_log").select("user_id, status, created_at").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("actor_id, performed_at").order("performed_at", { ascending: false })
    ]);

    // Map latest status
    const statusMap = new Map();
    statusLogs?.forEach(log => {
      if (!statusMap.has(log.user_id)) statusMap.set(log.user_id, log.status);
    });

    // Map latest audit
    const auditMap = new Map();
    latestAudits?.forEach(log => {
      if (!auditMap.has(log.actor_id)) auditMap.set(log.actor_id, log.performed_at);
    });

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      physical_status: statusMap.get(u.id) || "UNKNOWN",
      last_activity: auditMap.get(u.id) || u.updated_at
    }));

    // Calculate committee delegate counts locally
    const commCounts: Record<string, number> = {};
    users?.forEach(u => {
      const cid = u.committee_assignments?.[0]?.committees?.id;
      if (cid) commCounts[cid] = (commCounts[cid] || 0) + 1;
    });

    setCommittees((comms || []).map(c => ({ ...c, count: commCounts[c.id] || 0 })));
    setRows(enrichedUsers.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    load();
    
    // Presence subscription
    const channel = supabase.channel('global-presence');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => { if (p.user_id) onlineIds.add(p.user_id); });
      });
      setOnlineUsers(onlineIds);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data } = await supabase.auth.getUser();
        if (data?.user) await channel.track({ user_id: data.user.id, online_at: new Date().toISOString() });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const openDrawer = async (user: any) => {
    setSelectedUser(user);
    setAssignForm({
      committeeId: user.committee_assignments?.[0]?.committees?.id || "",
      country: user.committee_assignments?.[0]?.country || "",
      seatNumber: user.committee_assignments?.[0]?.seat_number || "",
    });
    setDrawerOpen(true);
    
    const [{ data: userNotes }, { data: history }] = await Promise.all([
      supabase.from("user_notes").select("*, author:author_id(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*, actor:actor_id(full_name)").eq("target_id", user.id).order("performed_at", { ascending: false })
    ]);
    setNotes(userNotes || []);
    setAuditHistory(history || []);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const runAction = async (action: string, payload: any = {}) => {
    setSubmitting(true);
    const res = await fetch("/api/eb/registrations/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: selectedUser.id, ebUserId: currentUser, ...payload }),
    });
    setSubmitting(false);
    if (res.ok) {
      setNoteContent("");
      await load();
      const { data: refreshedUser } = await supabase.from("users").select(`*, committee_assignments(id, country, seat_number, committees(id, name))`).eq("id", selectedUser.id).single();
      if (refreshedUser) openDrawer(refreshedUser);
    }
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "ALL" || r.role === filterRole;
      const matchCommittee = filterCommittee === "ALL" || (r.committee_assignments?.[0]?.committees?.id === filterCommittee);
      const matchOnline = !filterOnline || onlineUsers.has(r.id);
      return matchSearch && matchRole && matchCommittee && matchOnline;
    });
  }, [rows, search, filterRole, filterCommittee, filterOnline, onlineUsers]);

  // Idle Alerts (no activity in 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).getTime();
  const idleAlerts = rows.filter(r => new Date(r.last_activity).getTime() < twoHoursAgo && r.role === 'DELEGATE');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jotia-bold">Live Monitor</h1>
          <p className="text-sm text-text-dimmed">Real-time portal activity and physical status</p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-4 border border-border-subtle bg-bg-card shrink-0">
        <div className="flex flex-wrap gap-3 items-center">
          <Input placeholder="Search user..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-64" />
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="DELEGATE">Delegate</option>
            <option value="CHAIR">Chair</option>
            <option value="ADMIN">Admin</option>
            <option value="SECURITY">Security</option>
          </select>
          <select className="h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={filterCommittee} onChange={e => setFilterCommittee(e.target.value)}>
            <option value="ALL">All Committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm border border-border-input h-10 px-3 rounded-input cursor-pointer hover:bg-bg-raised">
            <input type="checkbox" checked={filterOnline} onChange={e => setFilterOnline(e.target.checked)} className="rounded bg-transparent border-border-input" />
            Online Only
          </label>
        </div>
      </Card>

      <div className="flex-1 overflow-auto border border-border-subtle rounded-card bg-bg-card">
        {loading ? <div className="p-8 text-center text-text-dimmed">Loading...</div> : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-bg-raised sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Status</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Name</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Role</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Committee</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Physical Status</th>
                <th className="p-3 border-b border-border-subtle font-semibold text-text-secondary">Last Portal Activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const isOnline = onlineUsers.has(row.id);
                return (
                  <tr key={row.id} onClick={() => openDrawer(row)} className="border-b border-border-subtle hover:bg-bg-raised cursor-pointer transition-colors">
                    <td className="p-3">
                      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-status-approved-text shadow-[0_0_8px_rgba(0,255,0,0.5)]' : 'bg-border-emphasized'}`} />
                    </td>
                    <td className="p-3 font-medium text-text-primary">{row.full_name}</td>
                    <td className="p-3"><Badge variant="default">{row.role}</Badge></td>
                    <td className="p-3 text-text-secondary">
                      {row.committee_assignments?.[0]?.committees?.name || "-"} 
                      {row.committee_assignments?.[0]?.country ? ` (${row.committee_assignments[0].country})` : ""}
                    </td>
                    <td className="p-3"><Badge variant={row.physical_status === 'CHECKED_IN' ? 'approved' : 'default'}>{row.physical_status}</Badge></td>
                    <td className="p-3 text-text-dimmed text-[12px]">{new Date(row.last_activity).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-dimmed">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {idleAlerts.length > 0 && (
        <div className="mt-4">
          <SectionLabel>Idle Alerts (No activity &gt; 2 hours)</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            {idleAlerts.slice(0, 8).map(r => (
              <div key={r.id} className="p-3 border border-status-rejected-border bg-status-rejected-bg/10 rounded-card flex flex-col gap-1 cursor-pointer" onClick={() => openDrawer(r)}>
                <span className="font-semibold text-sm">{r.full_name}</span>
                <span className="text-xs text-text-dimmed">{r.committee_assignments?.[0]?.committees?.name || 'Unassigned'}</span>
                <span className="text-[10px] text-status-rejected-text">Last seen: {new Date(r.last_activity).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide-over Drawer (Duplicated from Registrations as requested) */}
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
              <button onClick={closeDrawer} className="p-2 text-text-dimmed hover:text-text-primary">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4 bg-bg-card p-4 rounded-card border border-border-subtle">
                <SectionLabel>Assignment & Role</SectionLabel>
                <div>
                  <label className="text-xs text-text-dimmed mb-1 block">Role</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={selectedUser.role} onChange={(e) => runAction("change_role", { role: e.target.value })} disabled={submitting}>
                    <option value="DELEGATE">Delegate</option>
                    <option value="CHAIR">Chair</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEDIA">Media</option>
                    <option value="SECURITY">Security</option>
                    <option value="EXECUTIVE_BOARD">Executive Board</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <label className="text-xs text-text-dimmed block">Committee Assignment</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={assignForm.committeeId} onChange={(e) => setAssignForm({...assignForm, committeeId: e.target.value})}>
                    <option value="">No Committee</option>
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name} ({c.count} del)</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Input placeholder="Country/Character" className="flex-1" value={assignForm.country} onChange={(e) => setAssignForm({...assignForm, country: e.target.value})} />
                    <Input placeholder="Seat" className="w-20" value={assignForm.seatNumber} onChange={(e) => setAssignForm({...assignForm, seatNumber: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled={!assignForm.committeeId || submitting} onClick={() => runAction("assign_committee", assignForm)}>Save Assignment</Button>
                    {selectedUser.committee_assignments?.length > 0 && <Button size="sm" variant="outline" disabled={submitting} onClick={() => runAction("remove_assignment")}>Remove</Button>}
                  </div>
                </div>
              </div>

              <div>
                <SectionLabel>Internal Notes</SectionLabel>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Add a note" className="flex-1" value={noteContent} onChange={e => setNoteContent(e.target.value)} />
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

              <div>
                <SectionLabel>Activity Audit</SectionLabel>
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
    </div>
  );
}
