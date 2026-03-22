import { supabaseAdmin } from "@/lib/supabase-admin";
import { analyzePositionPaper, type PositionPaperAnalysisResult } from "@/lib/ai";
import { extractTextFromDocumentUrl } from "@/lib/document-text";

type PipelineError = { ok: false; error: string; status: number };
type PipelineOk = { ok: true; result: PositionPaperAnalysisResult };
export type PipelineOutcome = PipelineError | PipelineOk;

/**
 * Shared Groq position-paper flow: rate limit, optional PDF/text extraction, persist, audit.
 */
export async function runPositionPaperAnalysisPipeline(
  userId: string,
  documentId: string | null | undefined,
  rawText: string | null | undefined,
): Promise<PipelineOutcome> {
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "AI analysis is not configured (missing GROQ_API_KEY).", status: 503 };
  }

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("ai_analyses_today, ai_analyses_reset_date")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    return { ok: false, error: "User profile not found", status: 404 };
  }

  const today = new Date().toISOString().split("T")[0];
  let usedToday = user.ai_analyses_today || 0;
  if (user.ai_analyses_reset_date !== today) {
    usedToday = 0;
  }
  if (usedToday >= 10) {
    return {
      ok: false,
      error: "Daily analysis limit reached (10/10). Try again tomorrow.",
      status: 429,
    };
  }

  let textToAnalyze = (rawText || "").trim();
  const docId = documentId || null;

  if (docId) {
    const { data: doc, error: docErr } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, file_url, mime_type")
      .eq("id", docId)
      .maybeSingle();

    if (docErr || !doc) {
      return { ok: false, error: "Document not found", status: 404 };
    }
    if (doc.user_id !== userId) {
      return { ok: false, error: "Forbidden", status: 403 };
    }

    try {
      textToAnalyze = await extractTextFromDocumentUrl(doc.file_url, doc.mime_type || "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read document";
      return { ok: false, error: msg, status: 400 };
    }
  }

  if (!textToAnalyze) {
    return {
      ok: false,
      error: "Missing text to analyze. Paste text or select an uploaded PDF/text document.",
      status: 400,
    };
  }

  const result = await analyzePositionPaper(textToAnalyze);

  const { data: inserted, error: insertFeedbackErr } = await supabaseAdmin
    .from("ai_feedback")
    .insert({
      document_id: docId,
      user_id: userId,
      input_text: docId ? "" : textToAnalyze.substring(0, 10000),
      overall_score: result.overall_score,
      argument_strength: result.argument_strength,
      research_depth: result.research_depth,
      policy_alignment: result.policy_alignment,
      writing_clarity: result.writing_clarity,
      format_adherence: result.format_adherence,
      diplomatic_language: result.diplomatic_language,
      persuasiveness: result.persuasiveness,
      summary: result.summary,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
      annotated_segments: result.annotated_segments,
      ai_detection_score: result.ai_detection_score,
      ai_detection_phrases: result.ai_detection_phrases,
    })
    .select()
    .single();

  if (insertFeedbackErr) {
    console.error("ai_feedback insert:", insertFeedbackErr);
    return { ok: false, error: "Failed to save analysis", status: 500 };
  }

  await supabaseAdmin
    .from("users")
    .update({
      ai_analyses_today: usedToday + 1,
      ai_analyses_reset_date: today,
    })
    .eq("id", userId);

  try {
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "Ran AI analysis on position paper",
      target_type: "AIFeedback",
      target_id: inserted?.id || userId,
    });
  } catch {
    /* ignore */
  }

  return { ok: true, result };
}
