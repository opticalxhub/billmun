import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';

export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status } = await getRequestUserContext();
    if (authError || !context) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: status || 401 });
    }

    const { resolutionId, blocId } = await req.json();

    if (!resolutionId || !blocId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get resolution details
    const { data: res, error: resErr } = await supabaseAdmin
      .from('resolutions')
      .select('id, user_id, title')
      .eq('id', resolutionId)
      .single();

    if (resErr || !res) return NextResponse.json({ error: 'Resolution not found' }, { status: 404 });

    // Verify ownership
    if (res.user_id !== context.userId && context.role !== 'EXECUTIVE_BOARD' && context.role !== 'SECRETARY_GENERAL' && context.role !== 'DEPUTY_SECRETARY_GENERAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send a message to the bloc
    const { error: msgErr } = await supabaseAdmin
      .from('bloc_messages')
      .insert({
        bloc_id: blocId,
        user_id: context.userId,
        content: `Shared a resolution draft: "${res.title}"`,
      });

    if (msgErr) throw msgErr;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
