import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function getChairUser() {
  const cookieStore = await cookies();

  // Emergency access
  if (cookieStore.get("emergency_expires")) {
    return { userId: "00000000-0000-0000-0000-000000000000", role: "EXECUTIVE_BOARD" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const token =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get(`sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`)?.value;

  if (!token) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(token);
  } catch {
    parsed = null;
  }

  const accessToken = parsed?.access_token || parsed?.[0]?.access_token || token;

  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user } } = await sb.auth.getUser(accessToken);
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const allowedRoles = ["CHAIR", "CO_CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];
  if (!allowedRoles.includes(profile.role)) return null;

  return { userId: profile.id, role: profile.role };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getChairUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committee_id");
    if (!committeeId) return NextResponse.json({ error: "committee_id required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("chair_preparation")
      .select("*")
      .eq("committee_id", committeeId)
      .eq("chair_id", auth.userId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data: data || null });
  } catch (err: any) {
    console.error("[chair/preparation GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getChairUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { committee_id, checklist, research_notes, country_positions } = body;

    if (!committee_id) return NextResponse.json({ error: "committee_id required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("chair_preparation")
      .upsert(
        {
          committee_id,
          chair_id: auth.userId,
          checklist: checklist || {},
          research_notes: research_notes || [],
          country_positions: country_positions || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "committee_id,chair_id" }
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[chair/preparation POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
