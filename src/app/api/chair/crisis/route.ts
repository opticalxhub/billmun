import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { jsonPrivateNoStore } from "@/lib/http";
import { reportError } from "@/lib/logger";
import { chairCrisisSchema } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      return jsonPrivateNoStore({ error }, { status: status || 500 });
    }

    const allowedRoles = ["CHAIR", "CO_CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];
    if (!allowedRoles.includes(context.role)) {
      return jsonPrivateNoStore({ error: "Forbidden" }, { status: 403 });
    }

    const parsedBody = chairCrisisSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonPrivateNoStore({ error: "Invalid crisis payload" }, { status: 400 });
    }

    const { action, body: crisisBody, committee_id: rawCommitteeId, title } = parsedBody.data;
    const safeTitle = title || "";
    const safeBody = crisisBody || "";

    if (action === "inject_crisis") {
      const committeeId = rawCommitteeId || context.committee_id;

      if (!committeeId) {
        return jsonPrivateNoStore({ error: "Committee ID required. Please select a committee or ensure you are assigned as Chair." }, { status: 400 });
      }

      const { data: created, error: insertError } = await supabaseAdmin
        .from("announcements")
        .insert({
          committee_id: committeeId,
          title: safeTitle,
          body: safeBody,
          author_id: context.userId,
          is_pinned: false,
          target_roles: [],
          is_active: true,
        })
        .select("id, title, body, is_pinned, created_at, committee_id, target_roles, is_active")
        .single();

      if (insertError) {
        reportError(insertError, { route: '/api/chair/crisis', stage: 'insertAnnouncement' });
        return jsonPrivateNoStore({ error: insertError.message || "Failed to inject crisis update" }, { status: 500 });
      }

      const { data: delegateRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role, status)")
        .eq("committee_id", committeeId);

      const recipients = (delegateRows || [])
        .flatMap((row) => {
          const relatedUsers = Array.isArray(row.users) ? row.users : row.users ? [row.users] : [];
          return relatedUsers.some((user) => user.status === "APPROVED") ? [row.user_id] : [];
        });

      if (recipients.length) {
        await supabaseAdmin.from("notifications").insert(
          recipients.map((uid: string) => ({
            user_id: uid,
            title: `🚨 ${safeTitle}`,
            message: safeBody,
            type: "ALERT" as const,
            link: "/dashboard",
          }))
        );
      }

      return jsonPrivateNoStore({ success: true, announcement: created });
    }

    return jsonPrivateNoStore({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    reportError(err, { route: '/api/chair/crisis', method: 'POST' });
    return jsonPrivateNoStore({ error: "Internal server error" }, { status: 500 });
  }
}
