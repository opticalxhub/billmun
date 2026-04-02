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
      .select("id, role, status");

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
      // Get users assigned to specific committee
      const { data: committeeAssignments } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id")
        .eq("committee_id", committee_id);
      
      const committeeUserIds = committeeAssignments?.map(ca => ca.user_id) || [];
      users = users.filter((u: any) => committeeUserIds.includes(u.id));
    }

    return NextResponse.json({ count: users.length });
  } catch (err: any) {
    console.error("[matched-count] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
