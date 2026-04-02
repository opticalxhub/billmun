import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (!raw?.trim()) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    let body: { email?: string; password?: string };
    try {
      body = JSON.parse(raw) as { email?: string; password?: string };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.headers.set('RateLimit-Limit', '10');
    response.headers.set('RateLimit-Remaining', '9');
    response.headers.set('RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const emailNorm = email.trim().toLowerCase();

    const { data: profileRow } = await supabaseAdmin
      .from('users')
      .select('id, status, role, password_hash')
      .eq('email', emailNorm)
      .maybeSingle();

    if (profileRow?.password_hash) {
      let match = false;
      try {
        match = await bcrypt.compare(password, profileRow.password_hash as string);
      } catch (e) {
        console.error('[login] bcrypt compare failed:', e);
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
      if (!match) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
    }

    if (profileRow) {
      if (profileRow.status === 'PENDING') {
        return NextResponse.json({ error: 'Your account is pending approval. Please wait for approval.' }, { status: 403 });
      }
      if (profileRow.status === 'REJECTED') {
        return NextResponse.json({ error: 'Your account has been rejected. Contact support.' }, { status: 403 });
      }
      if (profileRow.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
      }
    }

    // Sign in with Supabase Auth (password must match the hash stored in Auth)
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailNorm, password });

    if (!error && data.session) {
      if (profileRow && profileRow.status !== 'APPROVED') {
        await supabase.auth.signOut();
        if (profileRow.status === 'PENDING') {
          return NextResponse.json({ error: 'Your account is pending approval. Please wait for an administrator to approve your registration.' }, { status: 403 });
        }
        if (profileRow.status === 'REJECTED') {
          return NextResponse.json({ error: 'Your account has been rejected. Contact support for assistance.' }, { status: 403 });
        }
        if (profileRow.status === 'SUSPENDED') {
          return NextResponse.json({ error: 'Your account has been suspended. Contact support for assistance.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 });
      }

      const finalResponse = NextResponse.json({
        success: true,
        session: data.session,
        user: data.user,
      });
      response.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie.name, cookie.value);
      });
      return finalResponse;
    }

    const profile = profileRow;

    if (!profile) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // User is APPROVED but login failed — likely unconfirmed email
    // Use getUserById instead of slow listUsers()
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authUser?.user && !authUser.user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
      });

      // Retry sign-in after confirming email
      const retryResponse = NextResponse.json({ success: true });
      const retrySupa = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              retryResponse.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              retryResponse.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );

      const retry = await retrySupa.auth.signInWithPassword({ email: emailNorm, password });
      if (retry.error) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      // Return the response with auth cookies set
      const finalResponse = NextResponse.json({
        success: true,
        session: retry.data.session,
        user: retry.data.user,
      });
      // Copy cookies from retryResponse
      retryResponse.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie.name, cookie.value);
      });
      return finalResponse;
    }

    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
