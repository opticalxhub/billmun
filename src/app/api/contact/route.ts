import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { contactSubmissionSchema, enforceSameOrigin } from "@/lib/security";
import { reportError } from "@/lib/logger";

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
    const sameOriginError = enforceSameOrigin(req);
    if (sameOriginError) {
      return sameOriginError;
    }

    const payload = contactSubmissionSchema.safeParse(await req.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid contact submission" }, { status: 400 });
    }

    const { name, email, subject, message } = payload.data;

    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name,
      email,
      subject,
      message,
    });

    if (error) throw error;

    // Notify EB members about the new contact submission
    const { data: ebUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"]);

    if (ebUsers?.length) {
      const notificationPreview = (subject ?? message ?? 'New contact submission').slice(0, 100);
      await supabaseAdmin.from("notifications").insert(
        ebUsers.map((u) => ({
          user_id: u.id,
          title: "New Contact Form Submission",
          message: `From ${name} (${email}): ${notificationPreview}`,
          type: "INFO" as const,
          link: "/eb/dash?tab=contact",
        }))
      );
    }

    const response = NextResponse.json({ ok: true });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('RateLimit-Limit', '3');
    response.headers.set('RateLimit-Remaining', '2');
    response.headers.set('RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 600));
    return response;
  } catch (err: unknown) {
    reportError(err, { route: '/api/contact', method: 'POST' });
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
