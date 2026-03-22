import Groq from "groq-sdk";

/** Groq chat model — keep in sync with chair-ai and health checks. */
export const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type PositionPaperAnalysisResult = {
  overall_score: number;
  argument_strength: number;
  research_depth: number;
  policy_alignment: number;
  writing_clarity: number;
  format_adherence: number;
  diplomatic_language: number;
  persuasiveness: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  annotated_segments: Array<{
    text?: string;
    highlight?: boolean;
    severity?: number;
    comment?: string;
  }>;
  ai_detection_score: number;
  ai_detection_phrases: string[];
};

function fallbackResult(reason: string): PositionPaperAnalysisResult {
  return {
    overall_score: 50,
    argument_strength: 50,
    research_depth: 50,
    policy_alignment: 50,
    writing_clarity: 50,
    format_adherence: 50,
    diplomatic_language: 50,
    persuasiveness: 50,
    summary: reason,
    strengths: ["Document was submitted for review"],
    weaknesses: ["Unable to fully parse AI response"],
    suggestions: ["Try again with clearer formatting or paste plain text"],
    annotated_segments: [],
    ai_detection_score: 0,
    ai_detection_phrases: [],
  };
}

/**
 * Position paper analysis via Groq (GROQ_API_KEY). Used by delegate and /api/ai/analyze.
 */
export async function analyzePositionPaper(documentText: string): Promise<PositionPaperAnalysisResult> {
  const text = documentText.trim();
  if (!text) {
    throw new Error("No text to analyze");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("AI analysis is not configured (missing GROQ_API_KEY).");
  }

  const prompt = `You are an expert Model United Nations (MUN) position paper analyst. Analyze the following text and return a JSON object with exactly these fields (use snake_case):

{
  "overall_score": <0-100 integer>,
  "argument_strength": <0-100 integer>,
  "diplomatic_language": <0-100 integer>,
  "writing_clarity": <0-100 integer>,
  "policy_alignment": <0-100 integer>,
  "format_adherence": <0-100 integer>,
  "persuasiveness": <0-100 integer>,
  "research_depth": <0-100 integer>,
  "summary": "<2-3 sentence summary of the analysis>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", "<specific weakness 3>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "annotated_segments": [{"text": "<passage>", "highlight": true, "severity": <0.1-1.0>, "comment": "<AI comment>"}],
  "ai_detection_score": <0-100 integer estimating likelihood of AI generation>,
  "ai_detection_phrases": ["<flagged phrase 1>", "<flagged phrase 2>"]
}

Evaluate based on:
- Argument strength and logical flow
- Diplomatic and formal language quality
- Structural clarity and organization
- Policy alignment with assigned country
- MUN format adherence (committee, topic, country stance)
- Persuasiveness and rhetorical effectiveness
- Research depth and use of evidence

Text to analyze:
${text.substring(0, 8000)}

Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = (completion.choices[0]?.message?.content || "") as string;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackResult("Analysis completed but results could not be fully parsed.");
    }

    const result = JSON.parse(jsonMatch[0]) as Partial<PositionPaperAnalysisResult>;

    return {
      overall_score: Number(result.overall_score) || 0,
      argument_strength: Number(result.argument_strength) || 0,
      research_depth: Number(result.research_depth) || 0,
      policy_alignment: Number(result.policy_alignment) || 0,
      writing_clarity: Number(result.writing_clarity) || 0,
      format_adherence: Number(result.format_adherence) || 0,
      diplomatic_language: Number(result.diplomatic_language) || 0,
      persuasiveness: Number(result.persuasiveness) || 0,
      summary: String(result.summary || ""),
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map(String) : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions.map(String) : [],
      annotated_segments: Array.isArray(result.annotated_segments) ? result.annotated_segments : [],
      ai_detection_score: Number(result.ai_detection_score) || 0,
      ai_detection_phrases: Array.isArray(result.ai_detection_phrases)
        ? result.ai_detection_phrases.map(String)
        : [],
    };
  } catch (e) {
    console.error("Groq position paper analysis:", e);
    return fallbackResult("Analysis completed but results could not be fully parsed.");
  }
}
