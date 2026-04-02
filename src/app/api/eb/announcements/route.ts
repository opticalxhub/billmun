import { NextRequest, NextResponse } from "next/server";
import { getEBContext } from "@/lib/eb-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const { searchParams } = new URL(req.url);
    const committee_id = searchParams.get('committee_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (committee_id && committee_id !== 'ALL') {
      query = query.eq('committee_id', committee_id);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    return NextResponse.json({ announcements: data || [] });
  } catch (err: any) {
    console.error('[api/eb/announcements]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
