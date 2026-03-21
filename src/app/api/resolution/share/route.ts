import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { resolutionId, blocId } = await req.json();

    if (!resolutionId || !blocId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get resolution details
    const { data: res, error: resErr } = await supabase
      .from('resolutions')
      .select('*, users(full_name)')
      .eq('id', resolutionId)
      .single();

    if (resErr || !res) throw new Error('Resolution not found');

    // Send a message to the bloc
    const { error: msgErr } = await supabase
      .from('bloc_messages')
      .insert({
        bloc_id: blocId,
        user_id: res.user_id,
        content: `Shared a resolution draft: "${res.title}"`,
      });

    if (msgErr) throw msgErr;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
