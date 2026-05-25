import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type RequestUserContext = {
  userId: string;
  role: string;
  committee_id: string | null;
  emergency: boolean;
};

/**
 * Optimized context fetcher for NXTMUN.
 * Uses parallel queries to minimize latency and ensures 300+ user scalability.
 */
export async function getRequestUserContext(): Promise<{ context?: RequestUserContext; error?: string; status?: number }> {
  const cookieStore = await cookies();
  const emergencyToken = cookieStore.get("emergency_token")?.value;

  // 1. Emergency Bypass (Rare)
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
            committee_id: null,
            emergency: true,
          },
        };
      }
    }
  }

  // 2. Standard Auth Initialization
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { error: "Unauthorized", status: 401 };

  // 3. Parallel Profile & Assignment Fetch (Performance Optimization)
  const [profileRes, assignmentRes] = await Promise.all([
    supabaseAdmin.from("users").select("id, role").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("committee_assignments").select("committee_id").eq("user_id", user.id).order("assigned_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const profile = profileRes.data;
  if (!profile?.id) return { error: "Unauthorized", status: 401 };

  let committeeId = assignmentRes.data?.committee_id || null;

  // 4. Fallback for Chairs (Parallelized with previous step if needed, but here it's conditional)
  if (!committeeId && (profile.role === "CHAIR" || profile.role === "CO_CHAIR")) {
    const { data: chaired } = await supabaseAdmin
      .from("committees")
      .select("id")
      .or(`chair_id.eq.${profile.id},co_chair_id.eq.${profile.id}`)
      .limit(1)
      .maybeSingle();
    committeeId = chaired?.id || null;
  }

  return {
    context: {
      userId: profile.id,
      role: profile.role,
      committee_id: committeeId,
      emergency: false,
    },
  };
}
