import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Server-side diagnostics for /dev/test. Requires the dev_test_unlocked cookie
 * set when unlocking the dev test page (same session).
 */
export async function GET(req: NextRequest) {
  const unlocked = req.cookies.get("dev_test_unlocked")?.value === "true";
  if (!unlocked) {
    return NextResponse.json(
      { error: "Unlock dev test at /dev/test first (cookie dev_test_unlocked)." },
      { status: 401 },
    );
  }

  const checks: { name: string; ok: boolean; detail?: string; optional?: boolean }[] = [];

  const push = (name: string, ok: boolean, detail?: string, optional?: boolean) => {
    checks.push({ name, ok, detail, optional });
  };

  push("NEXT_PUBLIC_SUPABASE_URL", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  push("NEXT_PUBLIC_SUPABASE_ANON_KEY", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  push("SUPABASE_SERVICE_ROLE_KEY", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  push("RESEND_API_KEY", !!process.env.RESEND_API_KEY, undefined, true);
  push("GROQ_API_KEY", !!process.env.GROQ_API_KEY);
  try {
    const { error } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
    push("supabase_admin_users_head", !error, error?.message);
  } catch (e) {
    push("supabase_admin_users_head", false, e instanceof Error ? e.message : String(e));
  }

  const requiredOk = checks.filter((c) => !c.optional).every((c) => c.ok);
  return NextResponse.json(
    { ok: requiredOk, checks, at: new Date().toISOString() },
    { status: requiredOk ? 200 : 503 },
  );
}
