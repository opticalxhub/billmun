import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { getRequestUserContext } from '@/lib/auth-context';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { context, error: authError, status } = await getRequestUserContext();
    if (authError || !context) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: status || 401 });
    }

    const { userId, role } = context;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { documentId, text } = body;
    if (!text) {
      return NextResponse.json({ error: 'Missing required field: text' }, { status: 400 });
    }

    // Verify user role
    if (!['DELEGATE', 'EXECUTIVE_BOARD', 'ADMIN', 'CHAIR'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    // Get current analysis count for rate limiting
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('ai_analyses_today, ai_analyses_reset_date')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Rate limit: 10 per day
    const today = new Date().toISOString().split('T')[0];
    let usedToday = user.ai_analyses_today || 0;
    if (user.ai_analyses_reset_date !== today) {
      usedToday = 0;
    }
    if (usedToday >= 10) {
      return NextResponse.json({ error: 'Daily analysis limit reached (10/10). Try again tomorrow.' }, { status: 429 });
    }

    // Call AI API
    const prompt = `You are an expert Model United Nations (MUN) position paper analyst. Analyze the following text and return a JSON object with exactly these fields:

{
  "overallScore": <0-100 integer>,
  "argumentStrength": <0-100 integer>,
  "diplomaticLanguage": <0-100 integer>,
  "writingClarity": <0-100 integer>,
  "policyAlignment": <0-100 integer>,
  "formatAdherence": <0-100 integer>,
  "persuasiveness": <0-100 integer>,
  "researchDepth": <0-100 integer>,
  "summary": "<2-3 sentence summary of the analysis>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", "<specific weakness 3>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "annotatedSegments": [{"text": "<passage>", "highlight": true, "severity": <0.1-1.0>, "comment": "<AI comment>"}],
  "aiDetectionScore": <0-100 integer estimating likelihood of AI generation>,
  "aiDetectionPhrases": ["<flagged phrase 1>", "<flagged phrase 2>"]
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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = (completion.choices[0]?.message?.content || '') as string;   

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      result = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback with default scores
      result = {
        overall_score: 50,
        argument_strength: 50,
        diplomatic_language: 50,
        writing_clarity: 50,
        policy_alignment: 50,
        format_adherence: 50,
        persuasiveness: 50,
        research_depth: 50,
        summary: 'Analysis completed but results could not be fully parsed.',
        strengths: ['Document was submitted for review'],
        weaknesses: ['Unable to fully parse AI response'],
        suggestions: ['Try submitting again with a longer, more structured document'],
        annotated_segments: [],
        ai_detection_score: 0,
        ai_detection_phrases: [],
      };
    }

    // Store in database
    const { data: feedback, error: dbErr } = await supabaseAdmin.from('ai_feedback').insert({
      document_id: documentId || null,
      user_id: userId,
      input_text: documentId ? null : text.substring(0, 10000),
      overall_score: result.overallScore || 0,
      argument_strength: result.argumentStrength || 0,
      research_depth: result.researchDepth || 0,
      policy_alignment: result.policyAlignment || 0,
      writing_clarity: result.writingClarity || 0,
      format_adherence: result.formatAdherence || 0,
      diplomatic_language: result.diplomaticLanguage || 0,
      persuasiveness: result.persuasiveness || 0,
      summary: result.summary || '',
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      suggestions: result.suggestions || [],
      annotated_segments: result.annotatedSegments || [],
      ai_detection_score: result.aiDetectionScore || 0,
      ai_detection_phrases: result.aiDetectionPhrases || [],
    }).select().single();

    // Update user's daily counter
    await supabaseAdmin.from('users').update({
      ai_analyses_today: usedToday + 1,
      ai_analyses_reset_date: today,
    }).eq('id', userId);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userId,
      action: 'Ran AI analysis on position paper',
      target_type: 'AIFeedback',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
