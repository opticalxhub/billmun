import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Build response object so SSR client can set cookies on it
    const response = NextResponse.json({ success: true });

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

    // First attempt: normal sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.session) {
      // Check user status — block non-APPROVED users
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('status')
        .eq('id', data.session.user.id)
        .single();

      if (profile && profile.status !== 'APPROVED') {
        // Sign them out since they shouldn't have access
        await supabase.auth.signOut();
        if (profile.status === 'PENDING') {
          return NextResponse.json({ error: 'Your account is pending approval. Please wait for an administrator to approve your registration.' }, { status: 403 });
        }
        if (profile.status === 'REJECTED') {
          return NextResponse.json({ error: 'Your account has been rejected. Contact support for assistance.' }, { status: 403 });
        }
        if (profile.status === 'SUSPENDED') {
          return NextResponse.json({ error: 'Your account has been suspended. Contact support for assistance.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 });
      }

      // Approved — return session with auth cookies
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

    // Sign-in failed — check user profile for specific error messages
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, status, role')
      .eq('email', email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (profile.status === 'PENDING') {
      return NextResponse.json({ error: 'Your account is pending approval. Please wait for approval.' }, { status: 403 });
    }
    if (profile.status === 'REJECTED') {
      return NextResponse.json({ error: 'Your account has been rejected. Contact support.' }, { status: 403 });
    }
    if (profile.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
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

      const retry = await retrySupa.auth.signInWithPassword({ email, password });
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
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
