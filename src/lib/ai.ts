import Groq from "groq-sdk";

/** Groq chat model — keep in sync with chair-ai and health checks. */
export const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";

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

  const systemPrompt = `You are a senior Model United Nations (MUN) position paper analyst for BILLMUN, a high-school MUN conference. You have deep expertise in:
- UN committee procedures (GA, ECOSOC, Security Council, specialized agencies)
- International law, treaties, and multilateral frameworks
- Country foreign policy stances and voting records
- MUN position paper format: heading (committee, topic, country, delegate), country background, policy stance, proposed solutions
- Academic writing standards for high-school level MUN

You must be precise, fair, and constructive. Score strictly — a perfect 100 should be rare. Typical high-school papers score 40-75. Only exceptional papers score above 85.
For AI detection: flag generic, overly polished language lacking specific policy details or personal analysis voice.`;

  const prompt = `Analyze the following MUN position paper and return a JSON object with exactly these fields (use snake_case):

{
  "overall_score": <0-100 integer>,
  "argument_strength": <0-100 integer — logical flow, evidence-based claims>,
  "diplomatic_language": <0-100 integer — formal register, MUN-appropriate tone>,
  "writing_clarity": <0-100 integer — structure, grammar, readability>,
  "policy_alignment": <0-100 integer — does the stance match the assigned country's real foreign policy?>,
  "format_adherence": <0-100 integer — proper MUN position paper structure>,
  "persuasiveness": <0-100 integer — ability to convince other delegates>,
  "research_depth": <0-100 integer — use of specific treaties, resolutions, data, precedents>,
  "summary": "<2-3 sentence summary of the analysis>",
  "strengths": ["<specific strength with quote or reference>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<specific weakness with quote or reference>", "<weakness 2>", "<weakness 3>"],
  "suggestions": ["<actionable, specific suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "annotated_segments": [{"text": "<exact passage from the paper>", "highlight": true, "severity": <0.1-1.0>, "comment": "<specific feedback on this passage>"}],
  "ai_detection_score": <0-100 integer — likelihood text was AI-generated>,
  "ai_detection_phrases": ["<exact flagged phrase from text>", "<phrase 2>"]
}

Scoring guidelines:
- 90-100: Exceptional — publishable quality, extensive real-world policy references
- 75-89: Strong — well-structured, good research, minor gaps
- 60-74: Adequate — meets basic requirements but lacks depth or specificity
- 40-59: Below average — significant structural or content issues
- 0-39: Poor — fails to meet basic MUN position paper standards

Text to analyze:
${text.substring(0, 12000)}

Return ONLY valid JSON. No markdown, no explanation, no wrapping.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
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
