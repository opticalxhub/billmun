import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEBContext } from '@/lib/eb-auth';

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const { searchParams } = req.nextUrl;
    const filterStatus = searchParams.get('status') || 'ALL';
    const filterRole = searchParams.get('role') || 'ALL';
    const filterCommittee = searchParams.get('committee_id') || 'ALL';
    const search = searchParams.get('q') || '';

    let query = supabaseAdmin.from("users").select(`
      *,
      committee_assignments!committee_assignments_user_id_fkey(
        id, country, seat_number,
        committees(id, name)
      )
    `, { count: 'exact' });

    if (filterStatus !== "ALL") query = query.eq('status', filterStatus);
    if (filterRole !== "ALL") query = query.eq('role', filterRole);
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error: qErr, count } = await query.order("created_at", { ascending: false }).limit(50);
    if (qErr) throw qErr;

    let filteredData = data || [];
    if (filterCommittee !== "ALL") {
      filteredData = filteredData.filter((u: any) => 
        u.committee_assignments?.some((ca: any) => ca.committee_id === filterCommittee)
      );
    }

    return NextResponse.json({ users: filteredData, totalCount: count });
  } catch (error: any) {
    console.error("Registrations API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
