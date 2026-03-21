import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });
  if (!["CHAIR", "ADMIN", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!context.committeeId) return NextResponse.json({ tasks: [] });

  const { data } = await supabaseAdmin
    .from("committee_admin_tasks")
    .select("*, creator:created_by(full_name), admin:assigned_admin_id(full_name)")
    .eq("committee_id", context.committeeId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ tasks: data || [] });
}

export async function POST(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });
  if (!context.committeeId) return NextResponse.json({ error: "No committee context" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const action = body?.action as string;

  if (action === "create") {
    if (!["CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const title = (body?.title as string) || "";
    if (!title.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const payload = {
      committee_id: context.committeeId,
      created_by: context.userId,
      assigned_admin_id: body?.assigned_admin_id || null,
      title: title.trim(),
      description: (body?.description as string) || null,
      priority: (body?.priority as string) || "MEDIUM",
      status: "TODO",
      due_at: body?.due_at || null,
    };
    const { error: insertError } = await supabaseAdmin.from("committee_admin_tasks").insert(payload);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_status") {
    const id = body?.id as string;
    const statusValue = body?.status as string;
    if (!id || !statusValue) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const { data: existing } = await supabaseAdmin
      .from("committee_admin_tasks")
      .select("id, committee_id")
      .eq("id", id)
      .maybeSingle();
    if (!existing?.id || existing.committee_id !== context.committeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { error: updateError } = await supabaseAdmin
      .from("committee_admin_tasks")
      .update({ status: statusValue, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
