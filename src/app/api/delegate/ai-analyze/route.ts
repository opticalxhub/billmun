import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { runPositionPaperAnalysisPipeline } from "@/lib/position-paper-pipeline";

export async function POST(request: NextRequest) {
  try {
    const { context, error: authError, status } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: status || 401 });
    }

    if (!["DELEGATE", "EXECUTIVE_BOARD", "ADMIN", "CHAIR", "CO_CHAIR"].includes(context.role)) {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    let body: { document_id?: string | null; documentId?: string | null; text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const documentId = body.documentId ?? body.document_id ?? null;
    const out = await runPositionPaperAnalysisPipeline(context.userId, documentId, body.text ?? null);

    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status });
    }

    return NextResponse.json(out.result);
  } catch (error: unknown) {
    console.error("AI Analysis error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
