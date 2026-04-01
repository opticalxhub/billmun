import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = req.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json({ users: [] });

    const safeQ = q.replace(/[%_\\]/g, (ch) => `\\${ch}`);

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .ilike('full_name', `%${safeQ}%`)
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[users/search] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
