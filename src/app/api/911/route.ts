import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
  if (process.env.DISABLE_EMERGENCY_ACCESS === 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { passphrase } = await request.json();

  if (passphrase !== process.env.EMERGENCY_PASSPHRASE) {
    return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // Calculate expiration (2 minutes from now)
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  // Insert into emergency_sessions table
  const { data, error } = await supabase
    .from('emergency_sessions')
    .insert([{ expires_at: expiresAt }])
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });

  // Set the emergency session token in cookies
  response.cookies.set({
    name: 'emergency_token',
    value: data.id,
    maxAge: 120, // 2 minutes
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  response.cookies.set({
    name: 'emergency_expires',
    value: expiresAt,
    maxAge: 120,
    path: '/',
  });

  return response;
  } catch (err: any) {
    console.error('[911]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
