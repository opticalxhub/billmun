"use client";

import React, { useEffect, useState, useRef } from "react";
import { Badge, Card, Input, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DashboardAnimatedTabPanel,
  DashboardHeader,
  DashboardLoadingState,
  DashboardTabBar,
} from "@/components/dashboard-shell";
import { LoadingSpinner } from "@/components/loading-spinner";

type TabName = "Overview" | "Badge Control" | "Incident Reports" | "Delegate Tracker" | "Access Zones" | "Communication";

const TABS: TabName[] = ["Overview", "Badge Control", "Incident Reports", "Delegate Tracker", "Access Zones", "Communication"];

export default function SecurityDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modals state
  const [activeModal, setActiveModal] = useState<"incident" | "checkin" | "flag" | "alert" | "briefing" | "zone" | "zone_delegates" | null>(null);

  // Form states
  const [incidentForm, setIncidentForm] = useState({ type: "Unauthorized Access", location: "", parties: [] as string[], desc: "", severity: "LOW", action: "", notifyEb: false });
  const [checkinForm, setCheckinForm] = useState({ userId: "", location: "Main Entrance" });
  const [flagForm, setFlagForm] = useState({ userId: "", reason: "", type: "FLAGGED" });
  const [alertForm, setAlertForm] = useState({ severity: "LOW", message: "" });
  const [briefingForm, setBriefingForm] = useState({ title: "", body: "" });
  const [zoneForm, setZoneForm] = useState({ name: "", description: "", capacity: 0, roles: [] as string[], status: "OPEN" });

  const [delegateSearch, setDelegateSearch] = useState("");
  const [moveUserId, setMoveUserId] = useState("");
  const [moveZoneId, setMoveZoneId] = useState("");

  const parentRefBadge = useRef<HTMLDivElement>(null);
  const parentRefFeed = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['security-dashboard'],
    queryFn: async () => {
      const res = await fetch("/api/security/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load security dashboard');
      return json;
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("security-live-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => queryClient.invalidateQueries({ queryKey: ['security-dashboard'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => queryClient.invalidateQueries({ queryKey: ['security-dashboard'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "access_zones" }, () => queryClient.invalidateQueries({ queryKey: ['security-dashboard'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "badge_checkins" }, () => queryClient.invalidateQueries({ queryKey: ['security-dashboard'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "security_alerts" }, () => queryClient.invalidateQueries({ queryKey: ['security-dashboard'] }))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const runActionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/security/dashboard/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Action failed");
      return json;
    },
    onSuccess: () => {
      setActionSuccess("Action completed successfully.");
      setActiveModal(null);
      queryClient.invalidateQueries({ queryKey: ['security-dashboard'] });
    },
    onError: (err: any) => {
      setActionError(err.message);
    },
    onSettled: () => {
      setSubmitting(false);
    }
  });

  const runAction = async (payload: any) => {
    setActionError("");
    setActionSuccess("");
    setSubmitting(true);
    runActionMutation.mutate(payload);
  };

  const activityFeed = data?.activity_feed || [];
  const feedVirtualizer = useVirtualizer({
    count: activityFeed.length,
    getScrollElement: () => parentRefFeed.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const delegates = data?.delegates || [];
  const filteredDelegates = (() => {
    const q = delegateSearch.trim().toLowerCase();
    if (!q) return delegates;
    return delegates.filter((d: any) => `${d.full_name} ${d.email} ${d.committee_assignments?.[0]?.country || ''}`.toLowerCase().includes(q));
  })();

  const badgeVirtualizer = useVirtualizer({
    count: filteredDelegates.length,
    getScrollElement: () => parentRefBadge.current,
    estimateSize: () => 70,
    overscan: 10,
  });

  if (isLoading && !data) {
    return <LoadingSpinner label="Loading security dashboard..." className="py-20" />;
  }

  const getSeverityColor = (sev: string) => {
    if (sev === "CRITICAL") return "rejected";
    if (sev === "HIGH") return "rejected";
    if (sev === "MEDIUM") return "pending";
    return "default";
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader title="Security Dashboard" subtitle="Physical security operations and incident control" />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={(t) => setActiveTab(t as TabName)} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative">
        {actionError && (
          <div className="mb-4 p-3 rounded-card border border-status-rejected-border bg-status-rejected-bg text-status-rejected-text text-sm">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 p-3 rounded-card border border-status-approved-border bg-status-approved-bg text-status-approved-text text-sm">
            {actionSuccess}
          </div>
        )}

        <DashboardAnimatedTabPanel activeKey={activeTab as string}>
          {activeTab === "Overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><SectionLabel>Checked In</SectionLabel><p className="text-3xl font-bold">{data?.stats?.checked_in || 0}</p></Card>
                <Card><SectionLabel>Incidents Today</SectionLabel><p className="text-3xl font-bold">{data?.stats?.incidents_today || 0}</p></Card>
                <Card><SectionLabel>Open Incidents</SectionLabel><p className="text-3xl font-bold">{data?.stats?.open_incidents || 0}</p></Card>
                <Card><SectionLabel>Active Zones</SectionLabel><p className="text-3xl font-bold">{data?.stats?.active_zones || 0}</p></Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Button onClick={() => setActiveModal("incident")} className="min-h-[48px]">New Incident Report</Button>
                <Button variant="outline" onClick={() => setActiveModal("checkin")} className="min-h-[48px]">Check In Delegate</Button>
                <Button variant="outline" onClick={() => setActiveModal("flag")} className="min-h-[48px]">Flag Badge</Button>
                <Button variant="outline" onClick={() => setActiveModal("alert")} className="min-h-[48px]">Broadcast Security Alert</Button>
              </div>
              <Card>
                <SectionLabel>Live Activity Feed</SectionLabel>
                <div 
                  ref={parentRefFeed}
                  className="h-[400px] overflow-auto scrollbar-hide relative"
                >
                  {activityFeed.length === 0 && <p className="text-sm text-text-dimmed p-4">No recent activity.</p>}
                  <div
                    style={{
                      height: `${feedVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {feedVirtualizer.getVirtualItems().map((virtualRow) => {
                      const evt = activityFeed[virtualRow.index];
                      return (
                        <div
                          key={virtualRow.index}
                          data-index={virtualRow.index}
                          ref={feedVirtualizer.measureElement}
                          className="absolute top-0 left-0 w-full p-3 border-b border-border-subtle bg-bg-raised flex items-start gap-3"
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm text-text-primary">
                              <span className="font-semibold">{evt.actor_name || "System"}</span> {evt.description}
                            </p>
                            <p className="text-[11px] text-text-dimmed mt-1">
                              {new Date(evt.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "Badge Control" && (
            <div className="space-y-6">
              <Card>
                <SectionLabel>Badge Search & Control</SectionLabel>
                <Input placeholder="Search delegate by name or email..." value={delegateSearch} onChange={(e) => setDelegateSearch(e.target.value)} />
                <div 
                  ref={parentRefBadge}
                  className="mt-4 h-[500px] overflow-auto scrollbar-hide relative border border-border-subtle rounded-card bg-bg-raised/30"
                >
                  {filteredDelegates.length === 0 && <p className="text-sm text-text-dimmed p-4">No delegates found.</p>}
                  <div
                    style={{
                      height: `${badgeVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {badgeVirtualizer.getVirtualItems().map((virtualRow) => {
                      const d = filteredDelegates[virtualRow.index];
                      return (
                        <div
                          key={d.id}
                          data-index={virtualRow.index}
                          ref={badgeVirtualizer.measureElement}
                          className="absolute top-0 left-0 w-full p-4 border-b border-border-subtle hover:bg-bg-raised/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-sm font-bold">
                              {d.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-2">
                                {d.full_name} 
                                <Badge variant={d.badge_status === 'ACTIVE' ? 'approved' : d.badge_status === 'SUSPENDED' ? 'rejected' : d.badge_status === 'FLAGGED' ? 'pending' : 'default'}>
                                  {d.badge_status || 'ACTIVE'}
                                </Badge>
                              </p>
                              <p className="text-xs text-text-dimmed">
                                {d.role} · {d.committee_assignments?.[0]?.committees?.name || 'No Committee'} · {d.committee_assignments?.[0]?.country || 'No Country'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => runAction({ action: "badge_checkin", user_id: d.id, location: "Main" })} disabled={submitting}>Check In</Button>
                            <Button size="sm" variant="outline" onClick={() => runAction({ action: "badge_checkout", user_id: d.id })} disabled={submitting}>Check Out</Button>
                            <Button size="sm" variant="outline" onClick={() => { setFlagForm({ ...flagForm, userId: d.id, type: "SUSPENDED" }); setActiveModal("flag"); }}>Suspend</Button>
                            <Button size="sm" variant="outline" onClick={() => runAction({ action: "mark_badge_lost", user_id: d.id })} disabled={submitting}>Mark Lost</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <SectionLabel>Bulk Check-In</SectionLabel>
                  <Button size="sm" onClick={() => runAction({ action: "bulk_checkin", user_ids: filteredDelegates.map((d:any) => d.id) })}>Check In All Displayed</Button>
                </div>
                <p className="text-xs text-text-dimmed mt-2">Use the search above to filter delegates, then click Check In All to process them simultaneously.</p>
              </Card>

              <Card>
                <SectionLabel>Recent Badge Events</SectionLabel>
                <div className="space-y-2 max-h-[300px] overflow-auto mt-3">
                  {(data?.badge_events || []).map((evt: any) => (
                    <div key={evt.id} className="p-2 rounded border border-border-subtle bg-bg-raised text-sm">
                      <span className="font-semibold">{evt.users?.full_name}</span> - {evt.action} at {evt.location || 'Unknown'} by {evt.officer?.full_name || 'System'}
                      <span className="text-xs text-text-dimmed block">{new Date(evt.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "Incident Reports" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <SectionLabel>New Incident</SectionLabel>
                  <div className="space-y-4 mt-3">
                    <div>
                      <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Type</label>
                      <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={incidentForm.type} onChange={(e) => setIncidentForm({...incidentForm, type: e.target.value})}>
                        <option>Unauthorized Access</option><option>Disturbance</option><option>Medical</option><option>Missing Person</option><option>Suspicious Activity</option><option>Property Issue</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Location</label>
                      <Input placeholder="E.g., Hallway A" value={incidentForm.location} onChange={(e) => setIncidentForm({...incidentForm, location: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Severity</label>
                      <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={incidentForm.severity} onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}>
                        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Description</label>
                      <Textarea rows={4} placeholder="Details..." value={incidentForm.desc} onChange={(e) => setIncidentForm({...incidentForm, desc: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Immediate Action</label>
                      <Input placeholder="What was done?" value={incidentForm.action} onChange={(e) => setIncidentForm({...incidentForm, action: e.target.value})} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={incidentForm.notifyEb} onChange={(e) => setIncidentForm({...incidentForm, notifyEb: e.target.checked})} className="rounded bg-transparent border-border-input" />
                      Notify Executive Board
                    </label>
                    <Button 
                      className="w-full"
                      disabled={submitting || !incidentForm.location || !incidentForm.desc} 
                      onClick={() => runAction({ ...incidentForm, action: "create_incident", immediate_action: incidentForm.action })}
                    >
                      Submit Report
                    </Button>
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <SectionLabel>All Incidents</SectionLabel>
                  <div className="space-y-3 mt-3 max-h-[600px] overflow-auto pr-2">
                    {(data?.incidents || []).map((i: any) => {
                      const isCritical = i.severity === "CRITICAL" || i.severity === "HIGH";
                      return (
                        <div key={i.id} className={`p-4 rounded-card border bg-bg-raised transition-colors ${isCritical ? 'border-status-rejected-border/50 shadow-[0_0_10px_rgba(255,0,0,0.1)]' : 'border-border-subtle'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{i.incident_type}</Badge>
                              <Badge variant={getSeverityColor(i.severity) as any}>{i.severity}</Badge>
                              <Badge variant={i.status === 'RESOLVED' ? 'approved' : 'pending'}>{i.status}</Badge>
                            </div>
                            <span className="text-[11px] text-text-dimmed">{new Date(i.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm font-semibold mb-1">Location: {i.location}</p>
                          <p className="text-sm text-text-secondary mb-3">{i.description}</p>
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
                            <select 
                              className="h-8 text-xs rounded border border-border-input bg-transparent px-2"
                              value={i.status}
                              onChange={(e) => runAction({ action: "update_incident_status", id: i.id, status: e.target.value })}
                              disabled={submitting}
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="ESCALATED">Escalated</option>
                            </select>
                            {i.status !== "RESOLVED" && (
                              <Button size="sm" variant="outline" onClick={() => {
                                const note = prompt("Enter resolution note:");
                                if (note) runAction({ action: "resolve_incident", id: i.id, note });
                              }}>Resolve</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(data?.incidents || []).length === 0 && <p className="text-sm text-text-dimmed">No incidents reported.</p>}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "Delegate Tracker" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Zone Occupancy</SectionLabel>
                <div className="space-y-3 mt-4">
                  {(data?.zones || []).map((z: any) => (
                    <div key={z.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{z.name}</p>
                        <p className="text-xs text-text-dimmed">Capacity: {z.capacity || '∞'} · Occupancy: {z.occupancy}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveModal("zone_delegates")}>View</Button>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="space-y-6">
                <Card>
                  <SectionLabel>Move Delegate Between Zones</SectionLabel>
                  <div className="space-y-3 mt-4">
                    <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={moveUserId} onChange={(e) => setMoveUserId(e.target.value)}>
                      <option value="">Select delegate...</option>
                      {delegates.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                    </select>
                    <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={moveZoneId} onChange={(e) => setMoveZoneId(e.target.value)}>
                      <option value="">Select zone...</option>
                      {(data?.zones || []).map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={!moveUserId || !moveZoneId || submitting} onClick={() => runAction({ action: "move_delegate", user_id: moveUserId, zone_id: moveZoneId })}>Move</Button>
                      <Button variant="outline" className="flex-1 border-status-rejected-border text-status-rejected-text" disabled={!moveUserId || submitting} onClick={() => runAction({ action: "mark_missing", user_id: moveUserId })}>Mark Missing</Button>
                    </div>
                  </div>
                </Card>
                <Card>
                  <SectionLabel>Delegates At Risk</SectionLabel>
                  <p className="text-xs text-text-dimmed mt-1 mb-3">Checked in but no activity for 30+ minutes.</p>
                  <div className="space-y-2">
                    {(data?.at_risk || []).length === 0 && <p className="text-sm text-text-dimmed">No delegates currently at risk.</p>}
                    {(data?.at_risk || []).map((r: any) => (
                      <div key={r.id} className="p-2 rounded border border-status-pending-border bg-status-pending-bg text-status-pending-text text-sm flex justify-between">
                        <span>{r.full_name}</span>
                        <span>Last seen: {r.last_seen_time || 'Unknown'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "Access Zones" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <SectionLabel>Zones</SectionLabel>
                <div className="space-y-3 mt-4">
                  {(data?.zones || []).map((z: any) => (
                    <div key={z.id} className="p-4 rounded-card border border-border-subtle bg-bg-raised">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">{z.name}</p>
                          <p className="text-xs text-text-dimmed">{z.description || "No description"}</p>
                        </div>
                        <Badge variant={z.status === 'OPEN' ? 'approved' : z.status === 'CLOSED' ? 'rejected' : 'pending'}>{z.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <select
                          className="h-8 text-xs rounded border border-border-input bg-transparent px-2"
                          value={z.status}
                          onChange={(e) => {
                            if (e.target.value === 'CLOSED') {
                              if (confirm("Closing a zone requires EB approval. Send request?")) {
                                runAction({ action: "request_zone_closure", zone_id: z.id });
                              }
                            } else {
                              runAction({ action: "update_zone_status", zone_id: z.id, status: e.target.value });
                            }
                          }}
                        >
                          <option value="OPEN">Open</option>
                          <option value="RESTRICTED">Restricted</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <SectionLabel>Create Zone</SectionLabel>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Zone Name</label>
                    <Input placeholder="E.g., VIP Lounge" value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Description</label>
                    <Input placeholder="Purpose of this zone" value={zoneForm.description} onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-text-dimmed uppercase tracking-wider mb-1 block">Capacity</label>
                    <Input type="number" placeholder="0 for unlimited" value={zoneForm.capacity} onChange={(e) => setZoneForm({...zoneForm, capacity: Number(e.target.value)})} />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!zoneForm.name.trim() || submitting}
                    onClick={() => runAction({ action: "create_zone", ...zoneForm })}
                  >
                    Add Zone
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "Communication" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Security Alerts</SectionLabel>
                  <Button size="sm" onClick={() => setActiveModal("alert")}>Send Alert</Button>
                </div>
                <div className="space-y-3">
                  {(data?.alerts || []).map((a: any) => (
                    <div key={a.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={a.severity === "CRITICAL" || a.severity === "HIGH" ? "rejected" : "pending"}>{a.severity}</Badge>
                        <span className="text-[11px] text-text-dimmed">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-semibold">{a.message}</p>
                      <p className="text-xs text-text-dimmed mt-2">Sender: {a.sender?.full_name || "System"}</p>
                    </div>
                  ))}
                  {(data?.alerts || []).length === 0 && <p className="text-sm text-text-dimmed">No active alerts.</p>}
                </div>
              </Card>
              <Card>
                <SectionLabel>Security Briefings</SectionLabel>
                <div className="space-y-3 mt-4 mb-6">
                  <Input placeholder="Briefing Title" value={briefingForm.title} onChange={(e) => setBriefingForm({...briefingForm, title: e.target.value})} />
                  <Textarea rows={3} placeholder="Briefing Content" value={briefingForm.body} onChange={(e) => setBriefingForm({...briefingForm, body: e.target.value})} />
                  <Button disabled={!briefingForm.title || !briefingForm.body || submitting} onClick={() => runAction({ action: "create_briefing", ...briefingForm })}>Post Briefing</Button>
                </div>
                <div className="space-y-3">
                  {(data?.briefings || []).map((b: any) => (
                    <div key={b.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
                      <p className="text-sm font-semibold mb-1">{b.title}</p>
                      <p className="text-xs text-text-secondary mb-2">{b.body}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-text-dimmed">By {b.author?.full_name}</p>
                        <Button size="sm" variant="outline" onClick={() => runAction({ action: "mark_briefing_read", briefing_id: b.id })}>Mark Read</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </DashboardAnimatedTabPanel>

        {/* Modals */}
        {activeModal === "incident" && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
            <div className="w-full max-w-lg bg-bg-card border border-border-subtle rounded-card p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">New Incident Report</h2>
              <div className="space-y-4">
                <div><label className="text-xs mb-1 block">Type</label><select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={incidentForm.type} onChange={(e) => setIncidentForm({...incidentForm, type: e.target.value})}><option>Unauthorized Access</option><option>Disturbance</option><option>Medical</option><option>Missing Person</option><option>Suspicious Activity</option><option>Property Issue</option><option>Other</option></select></div>
                <div><label className="text-xs mb-1 block">Location</label><Input value={incidentForm.location} onChange={(e) => setIncidentForm({...incidentForm, location: e.target.value})} /></div>
                <div><label className="text-xs mb-1 block">Severity</label><select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={incidentForm.severity} onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
                <div><label className="text-xs mb-1 block">Description</label><Textarea rows={3} value={incidentForm.desc} onChange={(e) => setIncidentForm({...incidentForm, desc: e.target.value})} /></div>
                <div><label className="text-xs mb-1 block">Immediate Action</label><Input value={incidentForm.action} onChange={(e) => setIncidentForm({...incidentForm, action: e.target.value})} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incidentForm.notifyEb} onChange={(e) => setIncidentForm({...incidentForm, notifyEb: e.target.checked})} className="rounded bg-transparent border-border-input" />Notify Executive Board</label>
                <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button><Button className="flex-1" onClick={() => runAction({ ...incidentForm, action: "create_incident", immediate_action: incidentForm.action })}>Submit</Button></div>
              </div>
            </div>
          </div>
        )}

        {activeModal === "checkin" && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
            <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-card p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Check In Delegate</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block">Select Delegate</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={checkinForm.userId} onChange={(e) => setCheckinForm({...checkinForm, userId: e.target.value})}>
                    <option value="">Select...</option>
                    {delegates.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs mb-1 block">Location</label><Input value={checkinForm.location} onChange={(e) => setCheckinForm({...checkinForm, location: e.target.value})} /></div>
                <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button><Button className="flex-1" disabled={!checkinForm.userId} onClick={() => runAction({ action: "badge_checkin", user_id: checkinForm.userId, location: checkinForm.location })}>Check In</Button></div>
              </div>
            </div>
          </div>
        )}

        {activeModal === "flag" && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
            <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-card p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Flag / Suspend Badge</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block">Select Delegate</label>
                  <select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={flagForm.userId} onChange={(e) => setFlagForm({...flagForm, userId: e.target.value})}>
                    <option value="">Select...</option>
                    {delegates.map((d: any) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs mb-1 block">Action</label><select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={flagForm.type} onChange={(e) => setFlagForm({...flagForm, type: e.target.value})}><option value="FLAGGED">Flag Badge</option><option value="SUSPENDED">Suspend Badge</option></select></div>
                <div><label className="text-xs mb-1 block">Reason</label><Textarea rows={3} value={flagForm.reason} onChange={(e) => setFlagForm({...flagForm, reason: e.target.value})} /></div>
                <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button><Button className="flex-1" disabled={!flagForm.userId || !flagForm.reason} onClick={() => runAction({ action: "flag_badge", ...flagForm })}>Apply</Button></div>
              </div>
            </div>
          </div>
        )}

        {activeModal === "alert" && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
            <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-card p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Broadcast Security Alert</h2>
              <div className="space-y-4">
                <div><label className="text-xs mb-1 block">Severity</label><select className="w-full h-10 rounded-input border border-border-input bg-transparent px-3 text-sm" value={alertForm.severity} onChange={(e) => setAlertForm({...alertForm, severity: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
                <div><label className="text-xs mb-1 block">Message</label><Textarea rows={3} value={alertForm.message} onChange={(e) => setAlertForm({...alertForm, message: e.target.value})} /></div>
                <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button><Button className="flex-1" disabled={!alertForm.message} onClick={() => runAction({ action: "send_security_alert", ...alertForm })}>Broadcast</Button></div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
