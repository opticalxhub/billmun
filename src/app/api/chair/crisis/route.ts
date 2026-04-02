import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      console.error("[chair/crisis] Auth failed:", { error, status });
      return NextResponse.json({ error }, { status: status || 500 });
    }

    const allowedRoles = ["CHAIR", "CO_CHAIR", "ADMIN", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];
    if (!allowedRoles.includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const action = body?.action as string;

    if (action === "inject_crisis" || !action) {
      const title = (body?.title as string) || "";
      const crisisBody = (body?.body as string) || "";
      const committeeId = body?.committee_id || context.committee_id;

      if (!title.trim() || !crisisBody.trim()) {
        return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
      }

      if (!committeeId) {
        return NextResponse.json({ error: "Committee ID required. Please select a committee or ensure you are assigned as Chair." }, { status: 400 });
      }

      const { data: created, error: insertError } = await supabaseAdmin
        .from("announcements")
        .insert({
          committee_id: committeeId,
          title: title.trim(),
          body: crisisBody.trim(),
          author_id: context.userId,
          is_pinned: false,
          target_roles: [],
          is_active: true,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("[chair/crisis] insert error:", insertError);
        return NextResponse.json({ error: insertError.message || "Failed to inject crisis update" }, { status: 500 });
      }

      // Notify delegates in committee
      const { data: delegateRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role, status)")
        .eq("committee_id", committeeId);

      const recipients = (delegateRows || [])
        .filter((r: any) => r?.users?.status === "APPROVED")
        .map((r: any) => r.user_id);

      if (recipients.length) {
        await supabaseAdmin.from("notifications").insert(
          recipients.map((uid: string) => ({
            user_id: uid,
            title: `🚨 ${title.trim()}`,
            message: crisisBody.trim(),
            type: "ALERT" as const,
            link: "/dashboard",
          }))
        );
      }

      return NextResponse.json({ success: true, announcement: created });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[chair/crisis] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
