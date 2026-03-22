import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { runChairAi } from "@/lib/chair-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  if (!["CHAIR", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { text, committee_id } = body;
  if (!text || typeof text !== "string") return NextResponse.json({ error: "Text is required" }, { status: 400 });

  if (committee_id && context.committee_id && committee_id !== context.committee_id && !context.emergency) {
    return NextResponse.json({ error: "Forbidden committee scope" }, { status: 403 });
  }

  const result = await runChairAi("debate_quality", text.slice(0, 12000));
  await supabaseAdmin.from("chair_ai_runs").insert({
    chair_id: context.userId,
    committee_id: committee_id || context.committee_id,
    tool: "debate_quality",
    input_text: text.slice(0, 12000),
    score: result.score,
    summary: result.summary,
    sections: result.sections,
    suggestions: result.suggestions,
  });

  return NextResponse.json(result);
}
