import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('conference_settings')
    .update({ conference_date: '2026-04-03' })
    .eq('id', '1');

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true, message: 'Database updated to April 3rd' });
}
