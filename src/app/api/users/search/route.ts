import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const q = req.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json({ users: [] });

    const safeQ = q.replace(/[%_\\]/g, (ch) => `\\${ch}`);

    const { data: users, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .ilike('full_name', `%${safeQ}%`)
      .limit(20);

    if (dbError) throw dbError;

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[users/search] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
