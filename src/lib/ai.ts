import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface DocumentAnalysisResult {
  overallScore: number;
  argumentStrength: number;
  researchDepth: number;
  policyAlignment: number;
  writingClarity: number;
  formatAdherence: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  annotatedSegments: Array<{
    textSnippet: string;
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
  "overallScore": <number 0-100>,
  "argumentStrength": <number 0-100>,
  "researchDepth": <number 0-100>,
  "policyAlignment": <number 0-100>,
  "writingClarity": <number 0-100>,
  "formatAdherence": <number 0-100>,
  "summary": "<string: 2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "annotatedSegments": [
    {"textSnippet": "<quoted text>", "type": "STRENGTH", "comment": "<comment>"},
    {"textSnippet": "<quoted text>", "type": "WEAKNESS", "comment": "<comment>"}
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
      typeof result.overallScore !== 'number' ||
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