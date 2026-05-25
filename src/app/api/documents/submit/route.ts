import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runOnDocumentUploaded } from "@/lib/automation";
import { DocumentSubmitSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
    }

    const body = await req.json();
    const validated = DocumentSubmitSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { committee_id, title, type, content, url } = validated.data;

    // Insert the document row
    const { data: doc, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert({
        user_id: context.userId,
        committee_id: committee_id || context.committee_id,
        title,
        type,
        content: content || null,
        file_url: url || null,
        status: "SUBMITTED",
        uploaded_at: new Date().toISOString(),
      })
      .select("id, user_id, committee_id")
      .single();

    if (insertError || !doc) {
      console.error("[documents/submit] insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit document" }, { status: 500 });
    }

    // Run automation (history + notifications)
    void runOnDocumentUploaded(doc.id, doc.committee_id ?? null, doc.user_id, context.userId);

    return NextResponse.json({ ok: true, document_id: doc.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
