import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { getEBContext } from "@/lib/eb-auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { subject, html, filters } = body;
    const ebUserId = context.ebUserId;

    if (!subject || !html || !filters) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Build query for matching users
    let query = supabaseAdmin.from("users").select("id, email, committee_assignments(committee_id)");

    if (filters.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }
    if (filters.roles && filters.roles.length > 0) {
      query = query.in("role", filters.roles);
    }

    const { data: users, error: uErr } = await query;
    if (uErr) throw uErr;

    // Further filter by committee if needed
    let matchedUsers = users || [];
    if (filters.committeeId && filters.committeeId !== "ALL") {
      matchedUsers = matchedUsers.filter((u: { committee_assignments?: { committee_id: string }[] }) => 
        u.committee_assignments?.some(ca => ca.committee_id === filters.committeeId)
      );
    }

    if (matchedUsers.length === 0) {
      return NextResponse.json({ error: "No matching users found" }, { status: 400 });
    }

    const emails = matchedUsers.map(u => u.email).filter(Boolean);

    // If Resend API is not fully configured, log it instead in dev, but call it anyway
    if (process.env.RESEND_API_KEY) {
      // Send in batches of 50
      for (let i = 0; i < emails.length; i += 50) {
        const batch = emails.slice(i, i + 50);
        await resend.emails.send({
          from: "BILLMUN <noreply@billmun.sa>",
          to: batch,
          subject: subject,
          html: html,
        });
      }
    } else {
      console.log(`Mock sent email to ${emails.length} recipients: ${subject}`);
    }

    // Log to mass_emails table
    try {
      await supabaseAdmin.from("mass_emails").insert({
        subject,
        body_html: html,
        recipient_count: emails.length,
        sent_by: ebUserId,
      });
    } catch { /* ignore */ }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: ebUserId,
      action: `Sent mass email to ${emails.length} recipients`,
      target_type: "SYSTEM",
      target_id: "mass_email"
    });

    return NextResponse.json({ ok: true, sentCount: emails.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
