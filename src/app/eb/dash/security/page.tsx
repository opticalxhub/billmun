"use client";

import { useEffect, useState } from "react";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { Button } from "@/components/button";
import { supabase } from "@/lib/supabase";
import { formatLabel } from '@/lib/roles';
import { DashboardLoadingState } from "@/components/dashboard-shell";

export default function EBSecurityPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [securityOfficers, setSecurityOfficers] = useState<any[]>([]);
  const [onlineOfficers, setOnlineOfficers] = useState<Set<string>>(new Set());
  const [badgeStats, setBadgeStats] = useState({ active: 0, suspended: 0, lost: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setCurrentUser(userData.user?.id);

    try {
      const [
        { data: incidentRows },
        { data: userRows },
        { data: alertRows },
        { data: officers }
      ] = await Promise.all([
        supabase.from("security_incidents").select("*, reporter:reported_by(full_name)").in("status", ["OPEN", "IN_PROGRESS"]).order("created_at", { ascending: false }),
        supabase.from("users").select("badge_status").not("badge_status", "is", null),
        supabase.from("security_alerts").select("*, sender:sent_by(full_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("users").select("id, full_name, email").eq("role", "SECURITY")
      ]);

      setIncidents(incidentRows || []);
      setAlerts(alertRows || []);
      setSecurityOfficers(officers || []);

      const stats = { active: 0, suspended: 0, lost: 0, flagged: 0 };
      (userRows || []).forEach((u: any) => {
        if (u.badge_status === "ACTIVE") stats.active++;
        else if (u.badge_status === "SUSPENDED") stats.suspended++;
        else if (u.badge_status === "LOST") stats.lost++;
        else if (u.badge_status === "FLAGGED") stats.flagged++;
      });
      setBadgeStats(stats);
    } catch (error) {
      console.error("Error loading security data:", error);
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    
    // Presence subscription
    const channel = supabase.channel('global-presence-security');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => { if (p.user_id) onlineIds.add(p.user_id); });
      });
      setOnlineOfficers(onlineIds);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const escalateIncident = async (id: string, severity: string, type: string) => {
    try {
      await supabase.from("security_incidents").update({ status: "ESCALATED", updated_at: new Date().toISOString() }).eq("id", id);
      
      // Notify all EB
      const { data: ebRows } = await supabase.from("users").select("id").in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL"]);
      if (ebRows?.length) {
        await supabase.from("notifications").insert(
          ebRows.map(row => ({
            user_id: row.id,
            title: `INCIDENT ESCALATED: ${severity}`,
            message: `An incident of type ${type} was escalated to the Executive Board.`,
            type: "ALERT",
            link: "/eb/dash/security"
          }))
        );
      }
      
      try {
        await supabase.from("audit_logs").insert({
          actor_id: currentUser,
          action: "Escalated security incident to EB",
          target_type: "INCIDENT",
          target_id: id
        });
      } catch { /* ignore */ }
      
      load();
    } catch (err) {
      console.error('Failed to escalate incident:', err);
      alert('Failed to escalate incident.');
    }
  };

  if (loading) return <DashboardLoadingState type="overview" />;
  if (fetchError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load security data.</p><button onClick={() => load()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;

  return (
    <div className="space-y-6 font-inter h-full flex flex-col">
      <div>
        <h1 className="font-jotia-bold text-3xl uppercase tracking-tight">Security Control</h1>
        <p className="text-text-dimmed text-sm">Executive oversight of physical security operations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-status-approved-border">
          <SectionLabel>Active Badges</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-approved-text">{badgeStats.active}</div>
        </Card>
        <Card className="p-4 border-status-rejected-border">
          <SectionLabel>Suspended</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-rejected-text">{badgeStats.suspended}</div>
        </Card>
        <Card className="p-4 border-status-rejected-border">
          <SectionLabel>Lost</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-rejected-text">{badgeStats.lost}</div>
        </Card>
        <Card className="p-4 border-status-pending-border">
          <SectionLabel>Flagged</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-pending-text">{badgeStats.flagged}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <SectionLabel>Open Incidents</SectionLabel>
            <div className="space-y-3 mt-4">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{inc.incident_type}</span>
                      <Badge variant={inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'rejected' : 'pending'}>{inc.severity}</Badge>
                      <Badge variant="default">{formatLabel(inc.status)}</Badge>
                    </div>
                    <span className="text-[11px] text-text-dimmed">{new Date(inc.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mb-1"><span className="text-text-dimmed">Location:</span> {inc.location}</p>
                  <p className="text-sm text-text-secondary mb-3">{inc.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-[11px] text-text-dimmed">Reported by {inc.reporter?.full_name || 'Unknown'}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" className="bg-status-rejected-text text-bg-base border-none hover:brightness-110" onClick={() => escalateIncident(inc.id, inc.severity, inc.incident_type)}>Escalate to EB</Button>
                    </div>
                  </div>
                </div>
              ))}
              {incidents.length === 0 && <p className="text-sm text-text-dimmed p-4 text-center">No open incidents.</p>}
            </div>
          </Card>

          <Card>
            <SectionLabel>Recent Security Alerts</SectionLabel>
            <div className="space-y-3 mt-4">
              {alerts.map((a) => (
                <div key={a.id} className="p-3 border border-border-subtle rounded-card bg-bg-raised flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Badge variant={a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'rejected' : 'pending'}>{a.severity}</Badge>
                    <span className="text-[11px] text-text-dimmed">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-semibold">{a.message}</p>
                  <p className="text-[11px] text-text-dimmed">Sender: {a.sender?.full_name || 'System'}</p>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm text-text-dimmed p-4 text-center">No recent alerts.</p>}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <SectionLabel>Security Officers Online</SectionLabel>
            <div className="space-y-2 mt-4">
              {securityOfficers.map(officer => {
                const isOnline = onlineOfficers.has(officer.id);
                return (
                  <div key={officer.id} className="flex items-center justify-between p-2 border border-border-subtle rounded bg-bg-raised">
                    <div>
                      <p className="text-sm font-semibold">{officer.full_name}</p>
                      <p className="text-[10px] text-text-dimmed">{officer.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-approved-text shadow-[0_0_5px_rgba(0,255,0,0.5)]' : 'bg-border-emphasized'}`} />
                      <span className="text-[10px] uppercase tracking-widest text-text-dimmed">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                );
              })}
              {securityOfficers.length === 0 && <p className="text-sm text-text-dimmed">No security officers found.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
