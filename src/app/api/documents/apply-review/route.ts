import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runOnDocumentStatusChanged } from "@/lib/automation";

const REVIEWER_ROLES = [
  "CHAIR",
  "CO_CHAIR",
  "ADMIN",
  "EXECUTIVE_BOARD",
  "SECRETARY_GENERAL",
  "DEPUTY_SECRETARY_GENERAL",
] as const;

const ALLOWED_STATUS = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REVISION_REQUESTED", "REJECTED"] as const;

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
    }

    if (!REVIEWER_ROLES.includes(context.role as (typeof REVIEWER_ROLES)[number])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { document_id?: string; status?: string; feedback?: string | null };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const documentId = body.document_id;
    const newStatus = body.status;
    const feedback = body.feedback ?? null;

    if (!documentId || !newStatus) {
      return NextResponse.json({ error: "document_id and status required" }, { status: 400 });
    }

    if (!ALLOWED_STATUS.includes(newStatus as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (["REVISION_REQUESTED", "REJECTED"].includes(newStatus) && !String(feedback || "").trim()) {
      return NextResponse.json({ error: "Feedback is required for this status" }, { status: 400 });
    }

    const { data: doc, error: docErr } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, committee_id")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isEb = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role);
    if (!isEb && doc.committee_id !== context.committee_id) {
      return NextResponse.json({ error: "Document is not in your committee" }, { status: 403 });
    }

    const { error: upErr } = await supabaseAdmin
      .from("documents")
      .update({
        status: newStatus,
        feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by_id: context.userId,
      })
      .eq("id", documentId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    void runOnDocumentStatusChanged(documentId, doc.user_id, newStatus, feedback, context.userId);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
