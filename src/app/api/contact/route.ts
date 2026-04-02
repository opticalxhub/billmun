import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ 
      message: "Contact API is working",
      methods: ["POST"],
      endpoint: "/api/contact"
    });
  } catch (err: any) {
    console.error("[contact] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || null,
      message: message.trim(),
    });

    if (error) throw error;

    // Notify EB members about the new contact submission
    const { data: ebUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"]);

    if (ebUsers?.length) {
      await supabaseAdmin.from("notifications").insert(
        ebUsers.map((u) => ({
          user_id: u.id,
          title: "New Contact Form Submission",
          message: `From ${name.trim()} (${email.trim()}): ${(subject || message).trim().substring(0, 100)}`,
          type: "INFO" as const,
          link: "/eb/dash?tab=contact",
        }))
      );
    }

    const response = NextResponse.json({ ok: true });
    response.headers.set('RateLimit-Limit', '3');
    response.headers.set('RateLimit-Remaining', '2');
    response.headers.set('RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 600));
    return response;
  } catch (err: any) {
    console.error("[contact] error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
