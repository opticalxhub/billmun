import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type RequestUserContext = {
  userId: string;
  role: string;
  committeeId: string | null;
  emergency: boolean;
};

export async function getRequestUserContext(): Promise<{ context?: RequestUserContext; error?: string; status?: number }> {
  const cookieStore = cookies();
  const emergencyToken = cookieStore.get("emergency_token")?.value;

  if (emergencyToken && process.env.DISABLE_EMERGENCY_ACCESS !== "true") {
    const { data: emergency } = await supabaseAdmin
      .from("emergency_sessions")
      .select("id, expires_at")
      .eq("id", emergencyToken)
      .maybeSingle();
    if (emergency?.id && new Date(emergency.expires_at).getTime() > Date.now()) {
      const { data: actor } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"])
        .limit(1)
        .maybeSingle();
      if (actor?.id) {
        return {
          context: {
            userId: actor.id,
            role: actor.role,
            committeeId: null,
            emergency: true,
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
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile?.id) return { error: "Unauthorized", status: 401 };

  let committeeId: string | null = null;
  const { data: assignment } = await supabaseAdmin
    .from("committee_assignments")
    .select("committee_id")
    .eq("user_id", profile.id)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  committeeId = assignment?.committee_id || null;

  if (!committeeId && profile.role === "CHAIR") {
    const { data: chaired } = await supabaseAdmin
      .from("committees")
      .select("id")
      .eq("chair_id", profile.id)
      .limit(1)
      .maybeSingle();
    committeeId = chaired?.id || null;
  }

  return {
    context: {
      userId: profile.id,
      role: profile.role,
      committeeId,
      emergency: false,
    },
  };
}
