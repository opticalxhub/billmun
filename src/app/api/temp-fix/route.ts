import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEBContext } from '@/lib/eb-auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { context, error: authError, status: authStatus } = await getEBContext();
  if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

  const { data, error } = await supabaseAdmin
    .from('conference_settings')
    .update({ conference_date: '2026-04-03' })
    .eq('id', '1');

  if (error) {
    console.error("[temp-fix] error:", error);
    return NextResponse.json({ success: false, error: "Update failed" });
  }

  return NextResponse.json({ success: true, message: 'Database updated to April 3rd' });
}
