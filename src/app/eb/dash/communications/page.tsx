"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Input, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { DashboardAnimatedTabPanel, DashboardTabBar } from "@/components/dashboard-shell";

type TabName = "Announcements" | "Mass Email" | "In-Portal Notifications";
const TABS: TabName[] = ["Announcements", "Mass Email", "In-Portal Notifications"];

const ROLES = ["DELEGATE", "CHAIR", "ADMIN", "MEDIA", "SECURITY", "EXECUTIVE_BOARD"];

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabName>("Announcements");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  // Announcement Form
  const [annId, setAnnId] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annTargetRoles, setAnnTargetRoles] = useState<string[]>([]);
  const [annCommittee, setAnnCommittee] = useState("ALL");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSchedule, setAnnSchedule] = useState(false);
  const [annScheduleDate, setAnnScheduleDate] = useState("");

  // Email & Notification Form
  const [filters, setFilters] = useState({ roles: [] as string[], status: "APPROVED", committeeId: "ALL" });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  const [matchedCount, setMatchedCount] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    setCurrentUser(sessionData.session?.user?.id || null);

    const [{ data: anns }, { data: comms }, { data: emails }] = await Promise.all([
      supabase.from("announcements").select("*, author:author_id(full_name), user_announcement_dismissals(count)").order("created_at", { ascending: false }),
      supabase.from("committees").select("id, name"),
      supabase.from("mass_emails").select("*, sender:sent_by(full_name)").order("sent_at", { ascending: false }).then(res => res.error ? { data: [] } : res)
    ]);

    setAnnouncements(anns || []);
    setCommittees(comms || []);
    setSentEmails(emails || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Recalculate matched users when filters change
  useEffect(() => {
    const calcMatches = async () => {
      let query = supabase.from("users").select("id, committee_assignments(committee_id)", { count: "exact" });
      if (filters.status !== "ALL") query = query.eq("status", filters.status);
      if (filters.roles.length > 0) query = query.in("role", filters.roles);
      const { data } = await query;
      let users = data || [];
      if (filters.committeeId !== "ALL") {
        users = users.filter((u: any) => u.committee_assignments?.some((ca: any) => ca.committee_id === filters.committeeId));
      }
      setMatchedCount(users.length);
    };
    calcMatches();
  }, [filters]);

  const resetAnnForm = () => {
    setAnnId(""); setAnnTitle(""); setAnnBody(""); setAnnTargetRoles([]);
    setAnnCommittee("ALL"); setAnnPinned(false); setAnnSchedule(false); setAnnScheduleDate("");
  };

  const editAnn = (a: any) => {
    setAnnId(a.id); setAnnTitle(a.title); setAnnBody(a.body); setAnnTargetRoles(a.target_roles || []);
    setAnnCommittee(a.committee_id || "ALL"); setAnnPinned(a.is_pinned); 
    setAnnSchedule(!!a.scheduled_for); setAnnScheduleDate(a.scheduled_for ? new Date(a.scheduled_for).toISOString().slice(0,16) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAnn = async () => {
    setSubmitting(true);
    const payload = {
      action: annId ? "update" : "create",
      id: annId,
      title: annTitle,
      body: annBody,
      is_pinned: annPinned,
      target_roles: annTargetRoles,
      committee_id: annCommittee,
      scheduled_for: annSchedule && annScheduleDate ? new Date(annScheduleDate).toISOString() : null,
      ebUserId: currentUser
    };
    const res = await fetch("/api/eb/announcements/action", { method: "POST", body: JSON.stringify(payload) });
    setSubmitting(false);
    if (res.ok) { resetAnnForm(); loadData(); }
  };

  const deleteAnn = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    const res = await fetch("/api/eb/announcements/action", { method: "POST", body: JSON.stringify({ action: "delete", id, ebUserId: currentUser }) });
    if (res.ok) loadData();
  };

  const sendMassEmail = async () => {
    if (!confirm(`Send email to ${matchedCount} recipients?`)) return;
    setSubmitting(true);
    const res = await fetch("/api/eb/mass-email", { method: "POST", body: JSON.stringify({ subject: emailSubject, html: emailHtml, filters, ebUserId: currentUser }) });
    setSubmitting(false);
    if (res.ok) { alert("Emails dispatched!"); setEmailSubject(""); setEmailHtml(""); loadData(); }
    else { alert("Failed to send"); }
  };

  const sendNotification = async () => {
    if (!confirm(`Send portal notification to ${matchedCount} users?`)) return;
    setSubmitting(true);
    const res = await fetch("/api/eb/mass-notification", { method: "POST", body: JSON.stringify({ title: notifTitle, message: notifMessage, filters, ebUserId: currentUser }) });
    setSubmitting(false);
    if (res.ok) { alert("Notifications sent!"); setNotifTitle(""); setNotifMessage(""); }
    else { alert("Failed to send"); }
  };

  const toggleRoleFilter = (r: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(r) ? prev.roles.filter(x => x !== r) : [...prev.roles, r]
    }));
  };

  const FilterPanel = () => (
    <div className="space-y-4 p-4 border border-border-subtle rounded-card bg-bg-raised mb-6">
      <SectionLabel>Target Audience ({matchedCount !== null ? `${matchedCount} users match` : "Calculating..."})</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-text-dimmed block mb-2">Roles (Empty = All)</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <Badge 
                key={r} 
                variant={filters.roles.includes(r) ? "approved" : "default"}
                className="cursor-pointer hover:brightness-110"
                onClick={() => toggleRoleFilter(r)}
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-text-dimmed block mb-2">Committee</label>
          <select className="w-full h-9 rounded border border-border-input bg-transparent px-2 text-sm" value={filters.committeeId} onChange={e => setFilters({...filters, committeeId: e.target.value})}>
            <option value="ALL">All Committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-dimmed block mb-2">Status</label>
          <select className="w-full h-9 rounded border border-border-input bg-transparent px-2 text-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (loading && announcements.length === 0) return <div className="p-12 text-center text-text-dimmed">Loading communications...</div>;

  return (
    <div className="space-y-6 font-inter h-full">
      <div>
        <h1 className="font-jotia-bold text-3xl uppercase tracking-tight">Communications</h1>
        <p className="text-text-dimmed text-sm">Manage global announcements, mass emails, and portal notifications.</p>
      </div>

      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={(t) => setActiveTab(t as TabName)} />

      <DashboardAnimatedTabPanel activeKey={activeTab}>
        {activeTab === "Announcements" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <SectionLabel>{annId ? "Edit Announcement" : "Create Announcement"}</SectionLabel>
                <div className="space-y-4 mt-4">
                  <div><label className="text-xs text-text-dimmed block mb-1">Title</label><Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} /></div>
                  <div><label className="text-xs text-text-dimmed block mb-1">Body</label><Textarea rows={5} value={annBody} onChange={e => setAnnBody(e.target.value)} /></div>
                  
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="text-xs text-text-dimmed block mb-2">Target Roles (Empty = All)</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ROLES.map(r => (
                        <Badge key={r} variant={annTargetRoles.includes(r) ? "approved" : "default"} className="cursor-pointer" onClick={() => setAnnTargetRoles(p => p.includes(r) ? p.filter(x=>x!==r) : [...p, r])}>{r}</Badge>
                      ))}
                    </div>
                    <label className="text-xs text-text-dimmed block mb-1">Target Committee</label>
                    <select className="w-full h-9 rounded border border-border-input bg-transparent px-2 text-sm" value={annCommittee} onChange={e => setAnnCommittee(e.target.value)}>
                      <option value="ALL">All Committees</option>
                      {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-border-subtle space-y-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} className="rounded border-border-input bg-transparent" /> Pin to Dashboards</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={annSchedule} onChange={e => setAnnSchedule(e.target.checked)} className="rounded border-border-input bg-transparent" /> Schedule for Later</label>
                    {annSchedule && <Input type="datetime-local" value={annScheduleDate} onChange={e => setAnnScheduleDate(e.target.value)} />}
                  </div>

                  <div className="flex gap-2 pt-4">
                    {annId && <Button variant="outline" className="flex-1" onClick={resetAnnForm}>Cancel</Button>}
                    <Button className="flex-1" disabled={submitting || !annTitle || !annBody} onClick={saveAnn}>{annId ? "Update" : "Publish"}</Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              <SectionLabel>Announcement History</SectionLabel>
              {announcements.map(a => {
                const dismissals = a.user_announcement_dismissals?.[0]?.count || 0;
                return (
                  <Card key={a.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          {a.title}
                          {a.is_pinned && <Badge variant="pending">PINNED</Badge>}
                          {a.scheduled_for && new Date(a.scheduled_for) > new Date() && <Badge variant="default">SCHEDULED</Badge>}
                        </h3>
                        <p className="text-[11px] text-text-dimmed mt-1">
                          By {a.author?.full_name} • {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editAnn(a)}>Edit</Button>
                        <Button size="sm" variant="outline" className="text-status-rejected-text border-status-rejected-border" onClick={() => deleteAnn(a.id)}>Delete</Button>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-3 whitespace-pre-wrap">{a.body}</p>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-subtle text-xs text-text-dimmed">
                      <span>Roles: {a.target_roles?.length ? a.target_roles.join(", ") : "All"}</span>
                      <span>Committee: {a.committee_id ? committees.find(c=>c.id===a.committee_id)?.name : "All"}</span>
                      <span>Dismissals/Reads: {dismissals}</span>
                    </div>
                  </Card>
                );
              })}
              {announcements.length === 0 && <p className="text-sm text-text-dimmed">No announcements yet.</p>}
            </div>
          </div>
        )}

        {activeTab === "Mass Email" && (
          <div className="max-w-4xl">
            <FilterPanel />
            <Card>
              <SectionLabel>Compose Email</SectionLabel>
              <div className="space-y-4 mt-4">
                <div><label className="text-xs text-text-dimmed block mb-1">Subject</label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
                <div><label className="text-xs text-text-dimmed block mb-1">HTML Body</label><Textarea rows={8} className="font-mono text-sm" value={emailHtml} onChange={e => setEmailHtml(e.target.value)} placeholder="<p>Hello delegates,</p>" /></div>
                <div className="flex gap-2 pt-2">
                  <Button disabled={!emailSubject || !emailHtml || matchedCount === 0 || submitting} onClick={sendMassEmail}>Send to {matchedCount} Recipients</Button>
                </div>
              </div>
            </Card>

            <div className="mt-8 space-y-4">
              <SectionLabel>Sent Mass Emails</SectionLabel>
              {sentEmails.map(e => (
                <div key={e.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{e.subject}</p>
                    <p className="text-xs text-text-dimmed">Sent by {e.sender?.full_name} • {new Date(e.sent_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="default">{e.recipient_count} Recipients</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "In-Portal Notifications" && (
          <div className="max-w-4xl">
            <FilterPanel />
            <Card>
              <SectionLabel>Send Notification</SectionLabel>
              <div className="space-y-4 mt-4">
                <div><label className="text-xs text-text-dimmed block mb-1">Title</label><Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} /></div>
                <div><label className="text-xs text-text-dimmed block mb-1">Message</label><Textarea rows={3} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} /></div>
                <div className="flex gap-2 pt-2">
                  <Button disabled={!notifTitle || !notifMessage || matchedCount === 0 || submitting} onClick={sendNotification}>Broadcast to {matchedCount} Users</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DashboardAnimatedTabPanel>
    </div>
  );
}
