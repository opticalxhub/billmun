import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type AdminContext = {
  adminUserId: string;
  committeeId: string;
  committeeName: string | null;
};

export async function getAdminContext(): Promise<{ context?: AdminContext; error?: string; status?: number }> {
  const cookieStore = cookies();
  const emergencyToken = cookieStore.get("emergency_token")?.value;
  const emergencyAccessEnabled = process.env.DISABLE_EMERGENCY_ACCESS !== "true";

  if (emergencyToken && emergencyAccessEnabled) {
    const { data: emergencySession } = await supabaseAdmin
      .from("emergency_sessions")
      .select("id, expires_at")
      .eq("id", emergencyToken)
      .maybeSingle();

    const hasValidEmergencySession =
      !!emergencySession?.id && new Date(emergencySession.expires_at).getTime() > Date.now();

    if (hasValidEmergencySession) {
      // Pick a committee context to allow dashboard/API access during emergency mode.
      // Prefer an assigned ADMIN user to preserve committee-assistant behavior.
      const { data: adminAssignment } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, committee_id, committees(name), users(role)")
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (adminAssignment?.committee_id) {
        return {
          context: {
            adminUserId: adminAssignment.user_id,
            committeeId: adminAssignment.committee_id,
            committeeName: (adminAssignment as any).committees?.name ?? null,
          },
        };
      }

      const { data: fallbackCommittee } = await supabaseAdmin
        .from("committees")
        .select("id, name")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: fallbackActor } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", ["ADMIN", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"])
        .limit(1)
        .maybeSingle();

      if (fallbackCommittee?.id && fallbackActor?.id) {
        return {
          context: {
            adminUserId: fallbackActor.id,
            committeeId: fallbackCommittee.id,
            committeeName: fallbackCommittee.name ?? null,
          },
        };
      }
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const adminUserId = session.user.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", adminUserId)
    .single();

  if (profileError || !profile) {
    return { error: "Unauthorized", status: 401 };
  }

  if (profile.role !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("committee_assignments")
    .select("committee_id, committees(name)")
    .eq("user_id", adminUserId)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError || !assignment?.committee_id) {
    return { error: "Admin has no committee assignment", status: 403 };
  }

  return {
    context: {
      adminUserId,
      committeeId: assignment.committee_id,
      committeeName: (assignment as any).committees?.name ?? null,
    },
  };
}
