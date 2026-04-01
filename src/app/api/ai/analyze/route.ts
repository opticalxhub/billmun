import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { runPositionPaperAnalysisPipeline } from "@/lib/position-paper-pipeline";

/** Legacy/alternate path — same behavior as POST /api/delegate/ai-analyze (Groq + GROQ_API_KEY). */
export async function POST(request: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: authStatus || 401 });
    }

    let body: { text?: string | null; document_id?: string | null; documentId?: string | null };
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

    return NextResponse.json({ ok: true, result: out.result });
  } catch (error: unknown) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
