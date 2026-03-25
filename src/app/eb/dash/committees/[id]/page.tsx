"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, SectionLabel, Input, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import { DashboardAnimatedTabPanel, DashboardTabBar } from "@/components/dashboard-shell";

type TabName = "Delegates" | "Chair Assignment" | "Admin Assignment" | "Session History" | "Statistics";
const TABS: TabName[] = ["Delegates", "Chair Assignment", "Admin Assignment", "Session History", "Statistics"];

export default function ManageCommitteePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const [committee, setCommittee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("Delegates");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [delegates, setDelegates] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [chairUsers, setChairUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [assignedAdmins, setAssignedAdmins] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  
  const [showAddDelegate, setShowAddDelegate] = useState(false);
  const [addDelegateForm, setAddDelegateForm] = useState({ user_id: "", country: "", seatNumber: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data: comm } = await supabase.from("committees").select("*, chair:chair_id(id, full_name, email)").eq("id", id).single();
      setCommittee(comm);
      setEditForm(comm);

      const [
        { data: assignments },
        { data: docs },
        { data: users },
        { data: sessionsData }
      ] = await Promise.all([
        supabase.from("committee_assignments").select("id, user_id, country, seat_number, users:user_id(id, full_name, email, role, status)").eq("committee_id", id),
        supabase.from("documents").select("id, status, user_id").eq("committee_id", id),
        supabase.from("users").select("id, full_name, email, role, status").eq("status", "APPROVED"),
        supabase.from("committee_sessions").select("*").eq("committee_id", id).order("updated_at", { ascending: false })
      ]);

      const { data: rollCalls } = await supabase.from("roll_call_records").select("quorum_established").in("session_id", (sessionsData || []).map((s: any) => s.id));

      // Calculate docs per delegate
      const docCounts: Record<string, number> = {};
      docs?.forEach(d => { docCounts[d.user_id] = (docCounts[d.user_id] || 0) + 1; });

      const els = (assignments || []).filter((a: any) => a.users?.role === "DELEGATE").map((a: any) => ({
        ...a,
        doc_count: docCounts[a.user_id] || 0
      }));
      setDelegates(els);

      const assignedAdminsList = (assignments || []).filter((a: any) => a.users?.role === "ADMIN");
      setAssignedAdmins(assignedAdminsList);

      const assignedUserIds = new Set((assignments || []).map(a => a.user_id));
      setAvailableUsers((users || []).filter(u => u.role === "DELEGATE" && !assignedUserIds.has(u.id)));
      setChairUsers((users || []).filter(u => u.role === "CHAIR"));
      setAdminUsers((users || []).filter(u => u.role === "ADMIN" && !assignedUserIds.has(u.id)));
      
      setSessions(sessionsData || []);

      const approvedDocs = docs?.filter(d => d.status === "APPROVED").length || 0;
      const totalDocs = docs?.length || 0;
      const approvalRate = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
      const presentCount = rollCalls?.filter((r: any) => r.status === "PRESENT").length || 0;
      const totalRolls = rollCalls?.length || 0;
      const attendanceRate = totalRolls > 0 ? Math.round((presentCount / totalRolls) * 100) : 0;

      setStats({ totalDocs, approvalRate, attendanceRate });
      
    } catch (e) {
      console.error(e);
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveCommittee = async () => {
    try {
      const { error } = await supabase.from("committees").update({
        name: editForm.name,
        description: editForm.description,
        topic: editForm.topic,
        image_url: editForm.image_url,
        max_delegates: editForm.max_delegates,
        difficulty: editForm.difficulty
      }).eq("id", id);
      if (error) throw error;
      setIsEditing(false);
      load();
    } catch (err) {
      console.error('Failed to save committee:', err);
      alert('Failed to save committee changes.');
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      const { error } = await supabase.from("committee_assignments").delete().eq("id", assignmentId);
      if (error) throw error;
      load();
    } catch (err) {
      console.error('Failed to remove assignment:', err);
      alert('Failed to remove assignment.');
    }
  };

  const addDelegate = async () => {
    if (!addDelegateForm.user_id) return;
    try {
      const { error } = await supabase.from("committee_assignments").insert({
        user_id: addDelegateForm.user_id,
        committee_id: id,
        country: addDelegateForm.country,
        seat_number: addDelegateForm.seatNumber
      });
      if (error) throw error;
      setShowAddDelegate(false);
      setAddDelegateForm({ user_id: "", country: "", seatNumber: "" });
      load();
    } catch (err) {
      console.error('Failed to add delegate:', err);
      alert('Failed to add delegate.');
    }
  };

  const reassignChair = async (chair_id: string) => {
    try {
      const { error } = await supabase.from("committees").update({ chair_id: chair_id || null }).eq("id", id);
      if (error) throw error;
      load();
    } catch (err) {
      console.error('Failed to reassign chair:', err);
      alert('Failed to reassign chair.');
    }
  };

  const addAdmin = async (adminId: string) => {
    if (!adminId) return;
    if (assignedAdmins.length >= 2) {
      alert("Maximum 2 admins allowed per committee.");
      return;
    }
    try {
      const { error } = await supabase.from("committee_assignments").insert({
        user_id: adminId,
        committee_id: id,
        country: "Admin"
      });
      if (error) throw error;
      load();
    } catch (err) {
      console.error('Failed to add admin:', err);
      alert('Failed to add admin.');
    }
  };

  if (loading) return <div className="p-12 text-center text-text-dimmed">Loading committee...</div>;
  if (fetchError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load committee.</p><button onClick={() => load()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;
  if (!committee) return <div className="p-12 text-center">Committee not found.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 text-xs font-bold text-text-dimmed uppercase tracking-widest cursor-pointer hover:text-text-primary w-fit" onClick={() => router.back()}>
        &larr; Back to Committees
      </div>

      <Card className="p-6 bg-bg-card border-border-subtle relative">
        {!isEditing ? (
          <>
            <Button variant="outline" size="sm" className="absolute top-6 right-6" onClick={() => setIsEditing(true)}>Edit Details</Button>
            <div className="flex gap-6">
              {committee.image_url && <img src={committee.image_url} alt={committee.name} className="w-24 h-24 rounded-lg object-cover" />}
              <div>
                <h1 className="text-3xl font-jotia-bold uppercase tracking-tight">{committee.name} ({committee.abbreviation})</h1>
                <p className="text-text-secondary mt-2">{committee.description || "No description provided."}</p>
                <div className="flex gap-4 mt-4">
                  <Badge variant="default">Topic: {committee.topic || "None"}</Badge>
                  <Badge variant="default">Max: {committee.max_delegates}</Badge>
                  <Badge variant={committee.is_active ? "approved" : "default"}>{committee.is_active ? "ACTIVE" : "INACTIVE"}</Badge>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <SectionLabel>Edit Committee</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs mb-1 block text-text-dimmed">Name</label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div><label className="text-xs mb-1 block text-text-dimmed">Abbreviation</label><Input disabled value={editForm.abbreviation} /></div>
              <div className="col-span-2"><label className="text-xs mb-1 block text-text-dimmed">Description</label><Textarea rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
              <div className="col-span-2"><label className="text-xs mb-1 block text-text-dimmed">Topic</label><Input value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} /></div>
              <div><label className="text-xs mb-1 block text-text-dimmed">Max Delegates</label><Input type="number" value={editForm.max_delegates} onChange={e => setEditForm({...editForm, max_delegates: parseInt(e.target.value)})} /></div>
              <div><label className="text-xs mb-1 block text-text-dimmed">Difficulty</label>
                <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={editForm.difficulty} onChange={e => setEditForm({...editForm, difficulty: e.target.value})}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block text-text-dimmed">Image URL (Upload to change)</label>
                <Input value={editForm.image_url || ""} onChange={e => setEditForm({...editForm, image_url: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm(committee); }}>Cancel</Button>
              <Button onClick={saveCommittee}>Save Changes</Button>
            </div>
          </div>
        )}
      </Card>

      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={(t) => setActiveTab(t as TabName)} />
      
      <DashboardAnimatedTabPanel activeKey={activeTab}>
        {activeTab === "Delegates" && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Assigned Delegates ({delegates.length}/{committee.max_delegates})</SectionLabel>
              <Button size="sm" onClick={() => setShowAddDelegate(true)}>Add Delegate</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-bg-raised border-b border-border-subtle">
                    <th className="p-3 text-text-secondary font-semibold">Name</th>
                    <th className="p-3 text-text-secondary font-semibold">Country</th>
                    <th className="p-3 text-text-secondary font-semibold">Seat</th>
                    <th className="p-3 text-text-secondary font-semibold">Docs</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {delegates.map(d => (
                    <tr key={d.id} className="border-b border-border-subtle">
                      <td className="p-3 font-medium">{d.users?.full_name}<div className="text-[11px] text-text-dimmed font-normal">{d.users?.email}</div></td>
                      <td className="p-3">{d.country}</td>
                      <td className="p-3">{d.seat_number || "-"}</td>
                      <td className="p-3"><Badge variant="default">{d.doc_count}</Badge></td>
                      <td className="p-3 text-right">
                        <Button variant="outline" size="sm" className="text-status-rejected-text border-status-rejected-border hover:bg-status-rejected-bg/10" onClick={() => removeAssignment(d.id)}>Remove</Button>
                      </td>
                    </tr>
                  ))}
                  {delegates.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-text-dimmed">No delegates assigned.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "Chair Assignment" && (
          <Card className="max-w-xl">
            <SectionLabel>Current Chair</SectionLabel>
            <div className="mt-4 flex items-center justify-between p-4 border border-border-subtle rounded-card bg-bg-raised">
              <div>
                <p className="font-semibold">{committee.chair?.full_name || "Unassigned"}</p>
                <p className="text-xs text-text-dimmed">{committee.chair?.email || "No chair assigned to this committee."}</p>
              </div>
            </div>
            <div className="mt-6">
              <SectionLabel>Reassign Chair</SectionLabel>
              <div className="flex gap-2 mt-2">
                <select 
                  className="flex-1 h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                  onChange={(e) => {
                    if(confirm("Change the chair?")) reassignChair(e.target.value);
                  }}
                  value={committee.chair_id || ""}
                >
                  <option value="">Select a chair...</option>
                  {chairUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
                {committee.chair_id && <Button variant="outline" onClick={() => reassignChair("")}>Unassign</Button>}
              </div>
            </div>
          </Card>
        )}

        {activeTab === "Admin Assignment" && (
          <Card className="max-w-2xl">
            <SectionLabel>Assigned Admins ({assignedAdmins.length}/2)</SectionLabel>
            <div className="space-y-2 mt-4">
              {assignedAdmins.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-border-subtle rounded-card bg-bg-raised">
                  <div>
                    <p className="font-semibold text-sm">{a.users?.full_name}</p>
                    <p className="text-xs text-text-dimmed">{a.users?.email}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-status-rejected-text" onClick={() => removeAssignment(a.id)}>Remove</Button>
                </div>
              ))}
              {assignedAdmins.length === 0 && <p className="text-sm text-text-dimmed">No admins assigned.</p>}
            </div>
            {assignedAdmins.length < 2 && (
              <div className="mt-6 pt-6 border-t border-border-subtle">
                <SectionLabel>Add Admin</SectionLabel>
                <div className="flex gap-2 mt-2">
                  <select 
                    id="admin-select"
                    className="flex-1 h-10 rounded-input border border-border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Select an admin...</option>
                    {adminUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                  <Button onClick={() => {
                    const sel = document.getElementById("admin-select") as HTMLSelectElement;
                    addAdmin(sel.value);
                    sel.value = "";
                  }}>Add</Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === "Session History" && (
          <Card>
            <SectionLabel>Committee Sessions</SectionLabel>
            <div className="mt-4 space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{s.title || "Regular Session"}</p>
                    <p className="text-xs text-text-dimmed">
                      Started: {new Date(s.started_at).toLocaleString()}
                      {s.ended_at && ` \u00b7 Ended: ${new Date(s.ended_at).toLocaleString()}`}
                    </p>
                  </div>
                  <Badge variant={s.status === "ACTIVE" ? "approved" : "default"}>{s.status}</Badge>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-sm text-text-dimmed">No session history available.</p>}
            </div>
          </Card>
        )}

        {activeTab === "Statistics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <p className="text-xs text-text-dimmed uppercase tracking-widest mb-2">Total Documents</p>
              <p className="text-4xl font-bold">{stats.totalDocs}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-xs text-text-dimmed uppercase tracking-widest mb-2">Approval Rate</p>
              <p className="text-4xl font-bold">{stats.approvalRate}%</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-xs text-text-dimmed uppercase tracking-widest mb-2">Attendance Rate</p>
              <p className="text-4xl font-bold">{stats.attendanceRate}%</p>
            </Card>
          </div>
        )}
      </DashboardAnimatedTabPanel>

      {showAddDelegate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowAddDelegate(false)}>
          <div className="w-full max-w-md bg-bg-card p-6 rounded-card border border-border-subtle" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add Delegate</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block text-text-dimmed">Select User</label>
                <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={addDelegateForm.user_id} onChange={e => setAddDelegateForm({...addDelegateForm, user_id: e.target.value})}>
                  <option value="">Select...</option>
                  {availableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block text-text-dimmed">Country / Character</label>
                <Input value={addDelegateForm.country} onChange={e => setAddDelegateForm({...addDelegateForm, country: e.target.value})} />
              </div>
              <div>
                <label className="text-xs mb-1 block text-text-dimmed">Seat Number (Optional)</label>
                <Input value={addDelegateForm.seatNumber} onChange={e => setAddDelegateForm({...addDelegateForm, seatNumber: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddDelegate(false)}>Cancel</Button>
                <Button className="flex-1" disabled={!addDelegateForm.user_id || !addDelegateForm.country} onClick={addDelegate}>Add Delegate</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
