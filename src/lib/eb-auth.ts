import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type EBContext = {
  ebUserId: string;
  role: string;
};

export async function getEBContext(): Promise<{ context?: EBContext; error?: string; status?: number }> {
  const cookieStore = await cookies();
  
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
      } else {
        // Fallback for fresh databases without any EB users
        return {
          context: {
            ebUserId: "00000000-0000-0000-0000-000000000000",
            role: "EXECUTIVE_BOARD",
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

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", authUser.id)
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
