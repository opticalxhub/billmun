import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReportEmail } from "@/lib/email";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, issue_type, description, user_id, user_details, metadata } = body;

    if (!category || !issue_type || !description || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report_id = `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const reportData = {
      report_id,
      category,
      issue_type,
      description,
      user_id,
      user_details,
      metadata,
      status: 'PENDING',
      created_at: timestamp,
    };

    // 1. Insert into DB
    const { error: dbErr } = await supabaseAdmin
      .from("issue_reports")
      .insert(reportData);

    if (dbErr) {
      console.error("DB Error:", dbErr);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    // 2. Send Email
    try {
      await sendReportEmail({ ...reportData, timestamp });
    } catch (emailErr) {
      console.error("Email Error:", emailErr);
      // Don't fail the request if email fails, but log it
    }

    // 3. Create Notification for EB if it's medical
    if (category === 'MEDICAL') {
      const { data: ebs } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"]);
      
      if (ebs?.length) {
        const notifs = ebs.map(eb => ({
          user_id: eb.id,
          title: "🚨 MEDICAL EMERGENCY",
          message: `${user_details.full_name} reported a medical emergency at ${metadata.location}.`,
          type: "ALERT",
          link: "/eb/dash?tab=reports"
        }));
        await supabaseAdmin.from("notifications").insert(notifs);
      }
    }

    return NextResponse.json({ success: true, report_id });
  } catch (err) {
    console.error("Report API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
