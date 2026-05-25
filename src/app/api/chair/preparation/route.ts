import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { jsonPrivateNoStore } from "@/lib/http";
import { reportError } from "@/lib/logger";
import { chairPreparationSchema } from "@/lib/security";

const ALLOWED_ROLES = ["CHAIR", "CO_CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];

export async function GET(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authErr }, { status: authStatus || 500 });
    if (!ALLOWED_ROLES.includes(context.role)) return jsonPrivateNoStore({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committee_id") || context.committee_id;
    if (!committeeId) return jsonPrivateNoStore({ error: "committee_id required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("chair_preparation")
      .select("id, committee_id, chair_id, checklist, research_notes, country_positions, updated_at")
      .eq("committee_id", committeeId)
      .eq("chair_id", context.userId)
      .maybeSingle();

    if (error) throw error;

    return jsonPrivateNoStore({ data: data || null });
  } catch (err: unknown) {
    reportError(err, { route: '/api/chair/preparation', method: 'GET' });
    return jsonPrivateNoStore({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authErr }, { status: authStatus || 500 });
    if (!ALLOWED_ROLES.includes(context.role)) return jsonPrivateNoStore({ error: "Forbidden" }, { status: 403 });

    const parsedBody = chairPreparationSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonPrivateNoStore({ error: "Invalid preparation payload" }, { status: 400 });
    }

    const { committee_id, checklist, research_notes, country_positions } = parsedBody.data;
    const cid = committee_id || context.committee_id;

    if (!cid) return jsonPrivateNoStore({ error: "committee_id required" }, { status: 400 });

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

    return jsonPrivateNoStore({ ok: true });
  } catch (err: unknown) {
    reportError(err, { route: '/api/chair/preparation', method: 'POST' });
    return jsonPrivateNoStore({ error: "Internal server error" }, { status: 500 });
  }
}
