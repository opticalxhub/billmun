import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error }, { status: status || 500 });

    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committeeId") || context.committee_id;
    if (!committeeId) return NextResponse.json([]);

    // Try snake_case first, then camelCase (DB may have either)
    let result: any[] = [];
    const { data: d1, error: e1 } = await supabaseAdmin
      .from("blocs")
      .select("*")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: false });

    if (!e1 && d1) {
      result = d1;
    } else {
      // Fallback: column is camelCase committeeId
      const { data: d2 } = await supabaseAdmin
        .from("blocs")
        .select("*")
        .filter("committeeId", "eq", committeeId);
      result = d2 || [];
    }

    // Batch: fetch members + message counts
    const blocIds = result.map((b) => b.id);
    if (blocIds.length > 0) {
      const { data: allMembers } = await supabaseAdmin
        .from("bloc_members")
        .select("id, bloc_id, user_id, joined_at, users(full_name, allocated_country)")
        .in("bloc_id", blocIds);

      const { data: allMsgs } = await supabaseAdmin
        .from("bloc_messages")
        .select("bloc_id")
        .in("bloc_id", blocIds);

      const membersByBloc: Record<string, any[]> = {};
      const msgCountByBloc: Record<string, number> = {};
      (allMembers || []).forEach((m: any) => {
        (membersByBloc[m.bloc_id] ??= []).push(m);
      });
      (allMsgs || []).forEach((m: any) => {
        msgCountByBloc[m.bloc_id] = (msgCountByBloc[m.bloc_id] || 0) + 1;
      });

      result.forEach((bloc) => {
        bloc.bloc_members = membersByBloc[bloc.id] || [];
        bloc._message_count = msgCountByBloc[bloc.id] || 0;
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[chair/blocs] error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
