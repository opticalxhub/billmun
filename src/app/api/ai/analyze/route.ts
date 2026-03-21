import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { analyzePositionPaper } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { userId, text, documentId } = await request.json();

    if (!userId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis is not configured (missing GROQ_API_KEY).' },
        { status: 500 },
      );
    }

    // Check rate limit (10 analyses per day)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabaseAdmin
      .from('ai_feedback')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (countError) throw countError;

    if (count && count >= 10) {
      return NextResponse.json({ error: 'Daily limit reached (10/10)' }, { status: 429 });
    }

    const parsedResult = await analyzePositionPaper(text);

    // Save result to db
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('ai_feedback')
      .insert([{
        document_id: documentId,
        user_id: userId,
        overall_score: parsedResult.overallScore,
        argument_strength: parsedResult.argumentStrength,
        research_depth: parsedResult.researchDepth,
        policy_alignment: parsedResult.policyAlignment,
        writing_clarity: parsedResult.writingClarity,
        format_adherence: parsedResult.formatAdherence,
        summary: parsedResult.summary,
        strengths: parsedResult.strengths,
        weaknesses: parsedResult.weaknesses,
        suggestions: parsedResult.suggestions,
        annotated_segments: parsedResult.annotatedSegments,
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ result: parsedResult, record: dbData, usage: (count || 0) + 1, limit: 10 });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
