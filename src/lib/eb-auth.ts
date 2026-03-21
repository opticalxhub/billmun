import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type EBContext = {
  ebUserId: string;
  role: string;
};

export async function getEBContext(): Promise<{ context?: EBContext; error?: string; status?: number }> {
  const cookieStore = cookies();
  
  // Emergency access check
  const emergencyToken = cookieStore.get("emergency_token")?.value;
  if (emergencyToken && process.env.DISABLE_EMERGENCY_ACCESS !== "true") {
    const { data: emergencySession } = await supabaseAdmin
      .from("emergency_sessions")
      .select("id, expires_at")
      .eq("id", emergencyToken)
      .maybeSingle();

    if (emergencySession && new Date(emergencySession.expires_at).getTime() > Date.now()) {
      // Pick a real EB/Admin user for audit logs
      const { data: ebActor } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL", "ADMIN"])
        .limit(1)
        .maybeSingle();

      if (ebActor) {
        return {
          context: {
            ebUserId: ebActor.id,
            role: ebActor.role,
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", session.user.id)
    .single();

  if (!user || !["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL", "ADMIN"].includes(user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return {
    context: {
      ebUserId: user.id,
      role: user.role,
    },
  };
}
