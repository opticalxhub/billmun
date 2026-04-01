import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    // Parallel queries for all checklist items
    const [
      { count: totalUsers },
      { count: approvedDelegates },
      { count: pendingUsers },
      { data: committees },
      { count: windowCount },
      { data: config },
      { data: settings },
      { count: announcementCount },
      { count: channelCount },
      { count: scheduleCount },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("status", "APPROVED").eq("role", "DELEGATE"),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      supabaseAdmin.from("committees").select("id, name, chair_id, co_chair_id, topic, background_guide_url"),
      supabaseAdmin.from("conference_windows").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("conference_config").select("*").eq("id", "1").maybeSingle(),
      supabaseAdmin.from("conference_settings").select("*").eq("id", "1").maybeSingle(),
      supabaseAdmin.from("announcements").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("channels").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("schedule_events").select("id", { count: "exact", head: true }),
    ]);

    // Build checklist
    const committeesData = committees || [];
    const committeesWithChairs = committeesData.filter((c: any) => c.chair_id);
    const committeesWithTopics = committeesData.filter((c: any) => c.topic);
    const committeesWithGuides = committeesData.filter((c: any) => c.background_guide_url);

    const checks = [
      {
        id: "users_registered",
        label: "Users registered",
        status: (totalUsers || 0) > 0 ? "pass" : "fail",
        detail: `${totalUsers || 0} total users`,
      },
      {
        id: "delegates_approved",
        label: "Delegates approved",
        status: (approvedDelegates || 0) > 0 ? "pass" : "warn",
        detail: `${approvedDelegates || 0} approved delegates`,
      },
      {
        id: "no_pending",
        label: "No pending registrations",
        status: (pendingUsers || 0) === 0 ? "pass" : "warn",
        detail: `${pendingUsers || 0} pending`,
      },
      {
        id: "committees_created",
        label: "Committees created",
        status: committeesData.length > 0 ? "pass" : "fail",
        detail: `${committeesData.length} committees`,
      },
      {
        id: "chairs_assigned",
        label: "All committees have chairs",
        status: committeesData.length > 0 && committeesWithChairs.length === committeesData.length ? "pass" : "warn",
        detail: `${committeesWithChairs.length}/${committeesData.length} have chairs`,
      },
      {
        id: "topics_set",
        label: "All committees have topics",
        status: committeesData.length > 0 && committeesWithTopics.length === committeesData.length ? "pass" : "warn",
        detail: `${committeesWithTopics.length}/${committeesData.length} have topics`,
      },
      {
        id: "guides_uploaded",
        label: "Background guides uploaded",
        status: committeesWithGuides.length === committeesData.length ? "pass" : "warn",
        detail: `${committeesWithGuides.length}/${committeesData.length} have guides`,
      },
      {
        id: "conference_windows",
        label: "Conference windows configured",
        status: (windowCount || 0) > 0 ? "pass" : "fail",
        detail: `${windowCount || 0} windows`,
      },
      {
        id: "conference_settings",
        label: "Conference settings configured",
        status: settings?.conference_name ? "pass" : "warn",
        detail: settings?.conference_name || "Not set",
      },
      {
        id: "schedule_events",
        label: "Schedule events created",
        status: (scheduleCount || 0) > 0 ? "pass" : "warn",
        detail: `${scheduleCount || 0} events`,
      },
      {
        id: "channels_created",
        label: "Communication channels set up",
        status: (channelCount || 0) > 0 ? "pass" : "warn",
        detail: `${channelCount || 0} channels`,
      },
      {
        id: "announcements",
        label: "At least one announcement published",
        status: (announcementCount || 0) > 0 ? "pass" : "warn",
        detail: `${announcementCount || 0} active`,
      },
    ];

    const passCount = checks.filter((c) => c.status === "pass").length;
    const failCount = checks.filter((c) => c.status === "fail").length;
    const warnCount = checks.filter((c) => c.status === "warn").length;

    return NextResponse.json({
      checks,
      summary: { total: checks.length, pass: passCount, fail: failCount, warn: warnCount },
      ready: failCount === 0,
    });
  } catch (err: any) {
    console.error("[readiness] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
