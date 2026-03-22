import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runOnDocumentUploaded } from "@/lib/automation";

/** Called by the client after inserting a documents row so server-side automation runs (history + notifications). */
export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
    }

    let body: { document_id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const documentId = body.document_id;
    if (!documentId) {
      return NextResponse.json({ error: "document_id required" }, { status: 400 });
    }

    const { data: doc, error: docErr } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, committee_id")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.user_id !== context.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    void runOnDocumentUploaded(doc.id, doc.committee_id ?? null, doc.user_id, context.userId);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
