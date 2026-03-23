import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEBContext } from '@/lib/eb-auth';

export const dynamic = "force-dynamic";

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
      id, email, full_name, role, status, date_of_birth, grade, phone_number,
      emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
      dietary_restrictions, preferred_committee, allocated_country, has_completed_onboarding,
      profile_image_url, current_zone_id, ai_analyses_today, ai_analyses_reset_date,
      badge_status, created_at, updated_at, approved_at, approved_by_id,
      committee_assignments!committee_assignments_user_id_fkey(
        id, committee_id, country, seat_number,
        committees(id, name)
      )
    `, { count: 'exact' });

    if (filterStatus !== "ALL") query = query.eq('status', filterStatus);
    if (filterRole !== "ALL") query = query.eq('role', filterRole);
    
    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    const { data, error: qErr, count } = await query.order("created_at", { ascending: false }).limit(50);
    if (qErr) throw qErr;

    let filteredData = data || [];
    if (filterCommittee !== "ALL") {
      filteredData = filteredData.filter((u: { committee_assignments?: { committee_id?: string }[] }) =>
        u.committee_assignments?.some((ca) => String(ca.committee_id) === String(filterCommittee)),
      );
    }

    return NextResponse.json({ users: filteredData, totalCount: count });
  } catch (error: any) {
    console.error("Registrations API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
