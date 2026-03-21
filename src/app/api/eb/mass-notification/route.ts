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

    let query = supabaseAdmin.from("users").select("id, committee_assignments(committee_id)");
    if (filters.status !== "ALL") query = query.eq("status", filters.status);
    if (filters.roles && filters.roles.length > 0) query = query.in("role", filters.roles);

    const { data: users } = await query;
    let matchedUsers = users || [];
    
    if (filters.committeeId !== "ALL") {
      matchedUsers = matchedUsers.filter((u: { committee_assignments?: { committee_id: string }[] }) => 
        u.committee_assignments?.some(ca => ca.committee_id === filters.committeeId)
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

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: ebUserId,
      action: `Broadcasted notification to ${notifications.length} users`,
      target_type: "SYSTEM",
      target_id: "mass_notification"
    });

    return NextResponse.json({ ok: true, sentCount: notifications.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
