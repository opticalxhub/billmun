import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export async function GET(_req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      { count: totalUsers },
      { count: pending },
      { count: approved },
      { count: docsToday },
      { count: messagesToday },
      { count: aiToday },
      { count: openIncidents },
      { data: logs },
      { data: commData },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("status", "APPROVED"),
      supabaseAdmin.from("documents").select("id", { count: "exact", head: true }).gte("uploaded_at", startOfDay),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).gte("created_at", startOfDay),
      supabaseAdmin.from("ai_feedback").select("id", { count: "exact", head: true }).gte("created_at", startOfDay),
      supabaseAdmin.from("security_incidents").select("id", { count: "exact", head: true }).neq("status", "RESOLVED"),
      supabaseAdmin.from("audit_logs").select("*, actor:actor_id(full_name)").order("performed_at", { ascending: false }).limit(30),
      supabaseAdmin.from("committees").select("*, committee_sessions(id, status), chair:chair_id(full_name)"),
    ]);

    // Batch-fetch roll call data to avoid N+1 queries per committee
    const sessionIds = (commData || [])
      .map((c: any) => c.committee_sessions?.[0]?.id)
      .filter(Boolean);

    let rollCallPresentMap: Record<string, number> = {};
    if (sessionIds.length > 0) {
      const { data: rollCalls } = await supabaseAdmin
        .from("roll_call_records")
        .select("id, session_id")
        .in("session_id", sessionIds)
        .order("started_at", { ascending: false });

      // Get latest roll call per session
      const latestPerSession = new Map<string, string>();
      (rollCalls || []).forEach((rc: any) => {
        if (!latestPerSession.has(rc.session_id)) {
          latestPerSession.set(rc.session_id, rc.id);
        }
      });

      const rollCallIds = Array.from(latestPerSession.values());
      if (rollCallIds.length > 0) {
        const { data: entries } = await supabaseAdmin
          .from("roll_call_entries")
          .select("roll_call_id, status")
          .in("roll_call_id", rollCallIds)
          .in("status", ["PRESENT", "PRESENT_AND_VOTING"]);

        const countByRollCall: Record<string, number> = {};
        (entries || []).forEach((e: any) => {
          countByRollCall[e.roll_call_id] = (countByRollCall[e.roll_call_id] || 0) + 1;
        });

        latestPerSession.forEach((rcId, sessionId) => {
          rollCallPresentMap[sessionId] = countByRollCall[rcId] || 0;
        });
      }
    }

    const processedComms = (commData || []).map((c: any) => {
      const sessionId = c.committee_sessions?.[0]?.id;
      return {
        id: c.id,
        name: c.name,
        chair_name: c.chair?.full_name || "No Chair",
        session_status: c.committee_sessions?.[0]?.status || "OFFLINE",
        present_count: sessionId ? (rollCallPresentMap[sessionId] || 0) : 0,
        is_active: c.is_active,
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        pending: pending ?? 0,
        approved: approved ?? 0,
        committeesInSession: (commData || []).filter((c: any) => c.is_active).length,
        documentsToday: docsToday ?? 0,
        messagesToday: messagesToday ?? 0,
        ai_analyses_today: aiToday ?? 0,
        open_incidents: openIncidents ?? 0,
      },
      activityFeed: logs || [],
      committees: processedComms,
    });
  } catch (err: any) {
    console.error("[eb/overview] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
