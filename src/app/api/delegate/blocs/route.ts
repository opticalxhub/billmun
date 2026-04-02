import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const { data, error } = await supabaseAdmin
      .from('bloc_members')
      .select('bloc_id, blocs(name)')
      .eq('user_id', context.userId);

    if (error) throw error;

    const blocs = (data || []).map((b: any) => ({
      bloc_id: b.bloc_id,
      blocs: b.blocs,
    }));

    return NextResponse.json(blocs);
  } catch (err: any) {
    console.error('[delegate/blocs GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
