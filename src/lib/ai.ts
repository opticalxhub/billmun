import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface DocumentAnalysisResult {
  overall_score: number;
  argument_strength: number;
  research_depth: number;
  policy_alignment: number;
  writing_clarity: number;
  format_adherence: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  annotated_segments: Array<{
    text_snippet: string;
    type: 'STRENGTH' | 'WEAKNESS' | 'SUGGESTION';
    comment: string;
  }>;
}

export async function analyzePositionPaper(documentText: string): Promise<DocumentAnalysisResult> {
  try {
    const prompt = `You are a Model United Nations expert evaluator. Analyze the following position paper and provide detailed feedback in JSON format.

Position Paper:
${documentText}

Provide your response as a valid JSON object with exactly this structure (no markdown, just raw JSON):
{
  "overall_score": <number 0-100>,
  "argument_strength": <number 0-100>,
  "research_depth": <number 0-100>,
  "policy_alignment": <number 0-100>,
  "writing_clarity": <number 0-100>,
  "format_adherence": <number 0-100>,
  "summary": "<string: 2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "annotated_segments": [
    {"text_snippet": "<quoted text>", "type": "STRENGTH", "comment": "<comment>"},
    {"text_snippet": "<quoted text>", "type": "WEAKNESS", "comment": "<comment>"}
  ]
}`;

    const message = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as DocumentAnalysisResult;

    // Validate structure
    if (
      typeof result.overall_score !== 'number' ||
      typeof result.summary !== 'string' ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.weaknesses)
    ) {
      throw new Error('Invalid response structure');
    }

    return result;
  } catch (error) {
    console.error('Error analyzing document with Groq:', error);
    throw new Error('Failed to analyze document');
  }
}