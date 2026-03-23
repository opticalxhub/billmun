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
  const { text, committee_id, type, content } = body;

  // Handle specialized analysis types
  if (type === 'BLOC_RELEVANCE' || type === 'DELEGATE_PERFORMANCE') {
    const prompt = type === 'BLOC_RELEVANCE' 
      ? `Analyze this MUN bloc resolution relevance:\nTopic: ${content.topic}\nStance: ${content.stance}\nCommittee Topic: ${content.committee_topic}\nProvide a concise analysis of how relevant and helpful this is for the committee.`
      : `Analyze this MUN delegate performance:\nDelegate: ${content.delegate}\nCountry: ${content.country}\nStats: Asked ${content.stats.pois_asked} POIs, Answered ${content.stats.pois_answered} POIs, Opening Speech: ${content.stats.opening_speech_words} words in ${content.stats.opening_speech_minutes} mins.\nScore: ${content.stats.performance_score}%\nProvide a constructive, 2-3 sentence performance review.`;

    const result = await runChairAi("speech_evaluator", prompt);
    return NextResponse.json({ analysis: result.summary });
  }

  if (!text || typeof text !== "string") return NextResponse.json({ error: "Text is required" }, { status: 400 });

  if (committee_id && context.committee_id && committee_id !== context.committee_id && !context.emergency) {
    return NextResponse.json({ error: "Forbidden committee scope" }, { status: 403 });
  }

  const result = await runChairAi("working_paper", text.slice(0, 12000));
  await supabaseAdmin.from("chair_ai_runs").insert({
    chair_id: context.userId,
    committee_id: committee_id || context.committee_id,
    tool: "working_paper",
    input_text: text.slice(0, 12000),
    score: result.score,
    summary: result.summary,
    sections: result.sections,
    suggestions: result.suggestions,
  });

  return NextResponse.json(result);
}
