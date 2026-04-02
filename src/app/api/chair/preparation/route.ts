import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_ROLES = ["CHAIR", "CO_CHAIR", "ADMIN", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];

export async function GET(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 500 });
    if (!ALLOWED_ROLES.includes(context.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committee_id") || context.committee_id;
    if (!committeeId) return NextResponse.json({ error: "committee_id required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("chair_preparation")
      .select("*")
      .eq("committee_id", committeeId)
      .eq("chair_id", context.userId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data: data || null });
  } catch (err: any) {
    console.error("[chair/preparation GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 500 });
    if (!ALLOWED_ROLES.includes(context.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { committee_id, checklist, research_notes, country_positions } = body;
    const cid = committee_id || context.committee_id;

    if (!cid) return NextResponse.json({ error: "committee_id required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("chair_preparation")
      .upsert(
        {
          committee_id: cid,
          chair_id: context.userId,
          checklist: checklist || {},
          research_notes: research_notes || [],
          country_positions: country_positions || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "committee_id,chair_id" }
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[chair/preparation POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
