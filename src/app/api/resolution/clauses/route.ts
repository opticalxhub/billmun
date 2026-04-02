import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const { searchParams } = new URL(req.url);
    const resolutionId = searchParams.get('resolutionId');
    if (!resolutionId) {
      return NextResponse.json({ error: 'Missing resolutionId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('resolution_clauses')
      .select('*')
      .eq('resolution_id', resolutionId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('[resolution/clauses GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
