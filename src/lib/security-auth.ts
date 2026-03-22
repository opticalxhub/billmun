import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getSecurityContext() {
  const cookieStore = cookies();

  const emergencyToken = cookieStore.get("emergency_token")?.value;
  if (emergencyToken && process.env.DISABLE_EMERGENCY_ACCESS !== "true") {
    const { data } = await supabaseAdmin
      .from("emergency_sessions")
      .select("id, expires_at")
      .eq("id", emergencyToken)
      .maybeSingle();
    if (data?.id && new Date(data.expires_at).getTime() > Date.now()) {
      const { data: actor } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", ["SECURITY", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"])
        .limit(1)
        .maybeSingle();
      return { userId: actor?.id ?? null, emergency: true };
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
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.id) return { error: "Unauthorized", status: 401 };

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", authUser.id)
    .single();

  if (!user) return { error: "Unauthorized", status: 401 };
  if (!["SECURITY", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return { userId: user.id, emergency: false };
}
