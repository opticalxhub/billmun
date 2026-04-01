import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { roles, status, committee_id } = body as {
      roles?: string[];
      status?: string;
      committee_id?: string;
    };

    let query = supabaseAdmin
      .from("users")
      .select("id, role, status, committee_assignments!committee_assignments_user_id_fkey(committee_id)");

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (roles && roles.length > 0) {
      query = query.in("role", roles);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[matched-count] query error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    let users = data || [];

    if (committee_id && committee_id !== "ALL") {
      users = users.filter((u: any) => {
        const assignments = u.committee_assignments;
        if (!assignments) return false;
        const arr = Array.isArray(assignments) ? assignments : [assignments];
        return arr.some((ca: any) => ca?.committee_id === committee_id);
      });
    }

    return NextResponse.json({ count: users.length });
  } catch (err: any) {
    console.error("[matched-count] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
