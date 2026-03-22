import { NextRequest, NextResponse } from "next/server";
import { getSecurityContext } from "@/lib/security-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const ctx = await getSecurityContext();
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status || 500 });

  const body = await req.json();
  const action = body?.action;
  const officerId = ctx.userId;

  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  const logAudit = async (actionDesc: string, type: string, targetId: string) => {
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: officerId,
        action: actionDesc,
        target_type: type,
        target_id: targetId,
      });
    } catch (err) {
      console.error("Audit logging failed:", err);
    }
  };

  try {
    if (action === "create_incident") {
      const { type, location, desc, severity, action: immediateAction, notifyEb } = body;
      const { data, error } = await supabaseAdmin.from("security_incidents").insert({
        incident_type: type,
        location,
        description: desc,
        severity,
        immediate_action: immediateAction,
        notify_eb: !!notifyEb,
        reported_by: officerId,
      }).select("id").single();
      if (error) throw error;

      await logAudit(`Created ${severity} incident at ${location}`, "INCIDENT", data.id);

      if (notifyEb || severity === "HIGH" || severity === "CRITICAL") {
        const { data: ebRows } = await supabaseAdmin.from("users").select("id").in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"]);
        if (ebRows?.length) {
          await supabaseAdmin.from("notifications").insert(
            ebRows.map((row: { id: string }) => ({
              user_id: row.id,
              title: `Security Incident (${severity})`,
              message: `${type} at ${location}`,
              type: "WARNING",
            }))
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "update_incident_status") {
      const { id, status } = body;
      const { error } = await supabaseAdmin.from("security_incidents").update({ status }).eq("id", id);
      if (error) throw error;
      await logAudit(`Updated incident status to ${status}`, "INCIDENT", id);
      return NextResponse.json({ ok: true });
    }

    if (action === "resolve_incident") {
      const { id, note } = body;
      const { error } = await supabaseAdmin.from("security_incidents").update({ status: "RESOLVED", resolution_note: note }).eq("id", id);
      if (error) throw error;
      await logAudit(`Resolved incident`, "INCIDENT", id);
      return NextResponse.json({ ok: true });
    }

    if (action === "badge_checkin") {
      const { user_id, location } = body;
      await supabaseAdmin.from("users").update({ badge_status: "ACTIVE" }).eq("id", user_id);
      await supabaseAdmin.from("security_badge_events").insert({ 
        user_id, 
        event_type: "CHECKIN", 
        location, 
        officer_id: officerId 
      });
      await logAudit(`Checked in delegate`, "BADGE", user_id);
      return NextResponse.json({ ok: true });
    }

    if (action === "badge_checkout") {
      const { user_id } = body;
      await supabaseAdmin.from("security_badge_events").insert({ 
        user_id, 
        event_type: "CHECKOUT", 
        officer_id: officerId 
      });
      await supabaseAdmin.from("users").update({ current_zone_id: null }).eq("id", user_id);
      await logAudit(`Checked out delegate`, "BADGE", user_id);
      return NextResponse.json({ ok: true });
    }

    if (action === "flag_badge") {
      const { user_id, type, reason } = body;
      await supabaseAdmin.from("users").update({ badge_status: type }).eq("id", user_id);
      await supabaseAdmin.from("security_badge_events").insert({ 
        user_id: user_id, 
        event_type: type, 
        reason, 
        officer_id: officerId 
      });
      await logAudit(`Flagged badge as ${type}`, "BADGE", user_id);
      if (type === "SUSPENDED") {
        const { data: ebRows } = await supabaseAdmin.from("users").select("id").in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL"]);
        if (ebRows?.length) {
          await supabaseAdmin.from("notifications").insert(ebRows.map((row: { id: string }) => ({ user_id: row.id, title: "Badge Suspended", message: `A badge was suspended for: ${reason}`, type: "WARNING" })));
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_badge_lost") {
      const { user_id } = body;
      await supabaseAdmin.from("users").update({ badge_status: "LOST" }).eq("id", user_id);
      await supabaseAdmin.from("security_badge_events").insert({ user_id, event_type: "LOST", officer_id: officerId });
      await logAudit(`Marked badge lost`, "BADGE", user_id);
      return NextResponse.json({ ok: true });
    }

    if (action === "bulk_checkin") {
      const { user_ids } = body;
      for (const uid of user_ids) {
        await supabaseAdmin.from("security_badge_events").insert({ user_id: uid, event_type: "CHECKIN", location: "Bulk", officer_id: officerId });
      }
      await logAudit(`Bulk checked in ${user_ids.length} delegates`, "BADGE", "BULK");
      return NextResponse.json({ ok: true });
    }

    if (action === "move_delegate") {
        const { user_id, zone_id } = body;
      await supabaseAdmin.from("users").update({ current_zone_id: zone_id }).eq("id", user_id);
      await supabaseAdmin.from("security_zone_logs").insert({ user_id, zone_id, officer_id: officerId });
      await logAudit(`Moved delegate to zone`, "ZONE", user_id);
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_missing") {
      const { user_id } = body;
      const { error } = await supabaseAdmin.from("missing_persons").insert({ user_id, reported_by: officerId, resolved: false });
      if (error) throw error;
      const { data: secs } = await supabaseAdmin.from("users").select("id").in("role", ["SECURITY", "EXECUTIVE_BOARD"]);
      if (secs?.length) {
        await supabaseAdmin.from("notifications").insert(secs.map((row: { id: string }) => ({ user_id: row.id, title: "MISSING PERSON", message: `A delegate has been marked missing.`, type: "ERROR" })));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "create_zone") {
      const { name, description, capacity, roles, status } = body;
      await supabaseAdmin.from("security_access_zones").insert({ name, description, capacity, allowed_roles: roles, status });
      await logAudit(`Created access zone ${name}`, "ZONE", name);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_zone_status") {
      const { zone_id, status } = body;
      const { error } = await supabaseAdmin.from("security_access_zones").update({ status, updated_by: officerId }).eq("id", zone_id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "request_zone_closure") {
      const { zone_id } = body;
      const { data: ebRows } = await supabaseAdmin.from("users").select("id").in("role", ["EXECUTIVE_BOARD"]);
      if (ebRows?.length) {
        await supabaseAdmin.from("notifications").insert(ebRows.map((row: { id: string }) => ({ user_id: row.id, title: "Zone Closure Request", message: `Security requested to close zone ${zone_id}`, type: "INFO" })));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "send_security_alert") {
      const { severity, message } = body;
      const { error } = await supabaseAdmin.from("security_alerts").insert({ severity, message, sent_by: officerId });
      if (error) throw error;
      const { data: secs } = await supabaseAdmin.from("users").select("id").eq("role", "SECURITY");
      if (secs?.length) {
        await supabaseAdmin.from("notifications").insert(secs.map((row: { id: string }) => ({ user_id: row.id, title: `Security Alert (${severity})`, message, type: "WARNING" })));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "create_briefing") {
      const { title, body: content } = body;
      const { error } = await supabaseAdmin.from("security_briefings").insert({ title, body: content, created_by: officerId });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_briefing_read") {
      const { briefing_id } = body;
      const { error } = await supabaseAdmin.from("security_briefing_reads").upsert({ briefing_id, user_id: officerId, read_at: new Date().toISOString() }, { onConflict: "briefing_id,user_id" });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
