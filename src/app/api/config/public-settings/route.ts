import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("conference_settings")
      .select("conference_name, conference_date, conference_location, registration_open")
      .maybeSingle();

    const response = NextResponse.json({
      conference_date: data?.conference_date || null,
      conference_name: data?.conference_name || "BILLMUN 2026",
      conference_location: data?.conference_location || null,
      registration_open: data?.registration_open ?? false,
    });
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
    return response;
  } catch {
    return NextResponse.json({
      conference_date: null,
      conference_name: "BILLMUN 2026",
      conference_location: null,
      registration_open: false,
    });
  }
}
