import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { title, message, filters } = body;
    const ebUserId = context.ebUserId;

    if (!title || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let query = supabaseAdmin.from("users").select("id, committee_assignments!committee_assignments_user_id_fkey(committee_id)");
    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }
    if (filters.roles && filters.roles.length > 0) {
      query = query.in("role", filters.roles);
    }

    const { data: users, error: uErr } = await query;
    if (uErr) {
      console.error("User query error:", uErr);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 400 });
    }
    let matchedUsers = users || [];
    
    if (filters.committee_id && filters.committee_id !== "ALL") {
      matchedUsers = matchedUsers.filter((u: any) => 
        (Array.isArray(u.committee_assignments) ? u.committee_assignments : [u.committee_assignments])
          .some((ca: any) => ca?.committee_id === filters.committee_id)
      );
    }

    if (matchedUsers.length === 0) return NextResponse.json({ error: "No matching users" }, { status: 400 });

    const notifications = matchedUsers.map(u => ({
      user_id: u.id,
      title,
      message,
      type: "INFO"
    }));

    // Insert in batches of 100
    for (let i = 0; i < notifications.length; i += 100) {
      const { error: insErr } = await supabaseAdmin.from("notifications").insert(notifications.slice(i, i + 100));
      if (insErr) throw insErr;
    }

    // Log to audit_logs
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: ebUserId,
        action: `Broadcasted notification to ${notifications.length} users`,
        target_type: "SYSTEM",
        target_id: ebUserId,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, sentCount: notifications.length });
  } catch (err: any) {
    console.error("[eb/mass-notification] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
