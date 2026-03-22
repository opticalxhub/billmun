import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { analyzePositionPaper } from '@/lib/ai';
import { getRequestUserContext } from '@/lib/auth-context';

export async function POST(request: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const { text, document_id } = await request.json();
    const userId = context.userId;

    if (!text || !document_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        document_id,
        user_id: userId,
        overall_score: parsedResult.overall_score,
        argument_strength: parsedResult.argument_strength,
        research_depth: parsedResult.research_depth,
        policy_alignment: parsedResult.policy_alignment,
        writing_clarity: parsedResult.writing_clarity,
        format_adherence: parsedResult.format_adherence,
        summary: parsedResult.summary,
        strengths: parsedResult.strengths,
        weaknesses: parsedResult.weaknesses,
        suggestions: parsedResult.suggestions,
        annotated_segments: parsedResult.annotated_segments,
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
