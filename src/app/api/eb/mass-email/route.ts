import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { getEBContext } from "@/lib/eb-auth";
import { generateEmailHTML, generateEmailPlainText } from "@/lib/email-template";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    // Accept both plain text body and legacy html
    const { subject, html, bodyText, filters, testEmail } = body;
    const ebUserId = context.ebUserId;

    const emailBody = bodyText || html || "";
    if (!subject || !emailBody || !filters) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Build query for matching users
    let query = supabaseAdmin.from("users").select("id, full_name, email, role, status");

    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }
    if (filters.roles && filters.roles.length > 0) {
      query = query.in("role", filters.roles);
    }

    const { data: users, error: uErr } = await query;
    if (uErr) {
      return NextResponse.json({ error: "Failed to fetch recipients" }, { status: 400 });
    }

    let matchedUsers = users || [];
    if (filters.committee_id && filters.committee_id !== "ALL") {
      // Get users assigned to specific committee
      const { data: committeeAssignments } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id")
        .eq("committee_id", filters.committee_id);
      
      const committeeUserIds = committeeAssignments?.map(ca => ca.user_id) || [];
      matchedUsers = matchedUsers.filter((u: any) => committeeUserIds.includes(u.id));
    }

    // Test email mode: send only to the requesting EB member
    if (testEmail) {
      const { data: sender } = await supabaseAdmin.from("users").select("email, full_name").eq("id", ebUserId).maybeSingle();
      if (!sender?.email) return NextResponse.json({ error: "Could not find your email" }, { status: 400 });

      const htmlContent = generateEmailHTML(subject, emailBody, sender.full_name);
      const textContent = generateEmailPlainText(subject, emailBody, sender.full_name);

      await resend.emails.send({
        from: "BILLMUN <billmun@billmun.com>",
        to: [sender.email],
        subject: `[TEST] ${subject}`,
        html: htmlContent,
        text: textContent,
      });

      return NextResponse.json({ ok: true, sentCount: 1, test: true });
    }

    if (matchedUsers.length === 0) {
      return NextResponse.json({ error: "No matching users found" }, { status: 400 });
    }

    // Send personalized emails in batches
    let sentCount = 0;
    for (let i = 0; i < matchedUsers.length; i += 50) {
      const batch = matchedUsers.slice(i, i + 50);
      const sendPromises = batch.map((u: any) => {
        const htmlContent = generateEmailHTML(subject, emailBody, u.full_name);
        const textContent = generateEmailPlainText(subject, emailBody, u.full_name);
        return resend.emails.send({
          from: "BILLMUN <billmun@billmun.com>",
          to: [u.email],
          subject,
          html: htmlContent,
          text: textContent,
        }).catch(() => null);
      });
      const results = await Promise.all(sendPromises);
      sentCount += results.filter(Boolean).length;
    }

    // Log to mass_emails table
    try {
      await supabaseAdmin.from("mass_emails").insert({
        subject,
        body_html: generateEmailHTML(subject, emailBody),
        recipient_count: sentCount,
        sent_by: ebUserId,
        sent_at: new Date().toISOString(),
      });
    } catch { /* ignore */ }

    // Log to audit_logs
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: ebUserId,
        action: `Sent mass email to ${sentCount} recipients`,
        target_type: "SYSTEM",
        target_id: ebUserId,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, sentCount });
  } catch (err: any) {
    console.error("[eb/mass-email] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
