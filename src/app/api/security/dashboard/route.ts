import { NextResponse } from "next/server";
import { getSecurityContext } from "@/lib/security-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const ctx = await getSecurityContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status || 500 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { data: delegates },
    { data: incidents },
    { data: zones },
    { data: badgeEvents },
    { data: badgeCheckins },
    { data: alerts },
    { data: briefings },
    { data: auditLogs },
    { data: missingPersons }
  ] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, full_name, email, role, badge_status, committee_assignments(country, committees(name))")
      .eq("status", "APPROVED"),
    supabaseAdmin
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("access_zones")
      .select("*")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("badge_events")
      .select("*, users:user_id(full_name), officer:officer_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("badge_checkins")
      .select("*")
      .gte("created_at", startOfDay),
    supabaseAdmin
      .from("security_alerts")
      .select("*, sender:sent_by(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("security_briefings")
      .select("*, author:created_by(full_name)")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", ["INCIDENT_CREATED", "ZONE_MOVED", "BADGE_UPDATED", "CHECKIN"])
      .order("performed_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("missing_persons")
      .select("*, users:user_id(full_name)")
      .eq("resolved", false)
  ]);

  const checkedInCount = (badgeCheckins || []).length;
  const incidentsToday = (incidents || []).filter((i: any) => new Date(i.created_at) >= new Date(startOfDay)).length;
  const openIncidents = (incidents || []).filter((i: any) => i.status !== "RESOLVED").length;
  const activeZonesCount = (zones || []).filter((z: any) => z.is_active !== false).length;

  // Transform zones to include occupancy
  const zoneOccupancy = (delegates || []).reduce((acc: any, user: any) => {
    if (user.current_zone_id) {
      acc[user.current_zone_id] = (acc[user.current_zone_id] || 0) + 1;
    }
    return acc;
  }, {});

  const zonesWithOccupancy = (zones || []).map((z: any) => ({
    ...z,
    occupancy: zoneOccupancy[z.id] || 0,
  }));

  // Combine audit logs and incidents for live feed
  const feed = [
    ...(auditLogs || []).map((a: any) => ({
      actor_name: "Security",
      description: a.action,
      timestamp: a.performed_at
    })),
    ...(incidents || []).map((i: any) => ({
      actor_name: "System",
      description: `Incident reported: ${i.incident_type}`,
      timestamp: i.created_at
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

  // Delegates at risk (checked in but no recent zone update/activity)
  const atRisk = (missingPersons || []).map((m: any) => ({
    id: m.id,
    full_name: m.users?.full_name,
    last_seen_time: m.last_known_location || new Date(m.created_at).toLocaleString()
  }));

  return NextResponse.json({
    delegates: delegates || [],
    incidents: incidents || [],
    zones: zonesWithOccupancy,
    badge_events: badgeEvents || [],
    alerts: alerts || [],
    briefings: briefings || [],
    activity_feed: feed,
    at_risk: atRisk,
    stats: {
      checked_in: checkedInCount,
      incidents_today: incidentsToday,
      open_incidents: openIncidents,
      active_zones: activeZonesCount,
    },
  });
}
