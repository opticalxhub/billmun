import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReportEmail } from "@/lib/email";
import { getRequestUserContext } from "@/lib/auth-context";
import { enforceSameOrigin, reportSubmissionSchema, sanitizeText } from "@/lib/security";
import { executeWithRetry } from "@/lib/resilience";
import { reportError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const sameOriginError = enforceSameOrigin(req);
    if (sameOriginError) {
      return sameOriginError;
    }

    const { context, error: authErr, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 401 });
    const payload = reportSubmissionSchema.safeParse(await req.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid report submission" }, { status: 400 });
    }

    const { category, issue_type, description, metadata } = payload.data;

    const { data: reportingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, role, grade")
      .eq("id", context.userId)
      .maybeSingle();

    if (userError || !reportingUser) {
      return NextResponse.json({ error: "Unable to resolve reporting user" }, { status: 403 });
    }

    const report_id = `REP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const safeMetadata = {
      request_engineer: Boolean(metadata.request_engineer),
      person_responsible: sanitizeText(metadata.person_responsible, 160),
      location: sanitizeText(metadata.location, 160),
      time: sanitizeText(metadata.time, 32),
      witnesses: sanitizeText(metadata.witnesses, 500),
      patient_name: sanitizeText(metadata.patient_name, 160),
      immediate_assistance: Boolean(metadata.immediate_assistance),
    };

    const reportData = {
      report_id,
      category,
      issue_type,
      description,
      user_id: reportingUser.id,
      user_details: {
        full_name: reportingUser.full_name,
        email: reportingUser.email,
        role: reportingUser.role,
        grade: reportingUser.grade,
        committee: sanitizeText((metadata as Record<string, unknown>).committee, 160) || 'None',
      },
      metadata: safeMetadata,
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
      await executeWithRetry(() => sendReportEmail({ ...reportData, timestamp }), {
        operationName: 'sendReportEmail',
        retries: 2,
        timeoutMs: 12_000,
      });
    } catch (emailErr) {
      reportError(emailErr, { route: '/api/report', stage: 'sendReportEmail' });
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
          title: "[URGENT] MEDICAL EMERGENCY",
          message: `${reportData.user_details.full_name} reported a medical emergency at ${reportData.metadata.location || "an unknown location"}.`,
          type: "ALERT",
          link: "/eb/dash?tab=reports"
        }));
        await supabaseAdmin.from("notifications").insert(notifs);
      }
    }

    return NextResponse.json({ success: true, report_id });
  } catch (err) {
    reportError(err, { route: '/api/report', method: 'POST' });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
