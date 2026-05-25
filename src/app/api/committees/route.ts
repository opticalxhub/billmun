import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { reportError } from '@/lib/logger';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('committees')
      .select('id, name, abbreviation, topic, secondary_topic, visibility')
      .order('name');
      
    if (error) throw error;
    
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
    return response;
  } catch (error: unknown) {
    reportError(error, { route: '/api/committees', method: 'GET' });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
