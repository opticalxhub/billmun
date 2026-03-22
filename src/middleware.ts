import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // If authenticated, get profile for status/role checks
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('status, role').eq('id', user.id).maybeSingle();
    userProfile = data;
  }

  // Check global conference settings
  const { data: settings } = await supabase.from('conference_settings').select('*').eq('id', '1').maybeSingle();

  // Check for emergency token
  const emergencyToken = request.cookies.get('emergency_token')?.value;
  let hasValidEmergencyAccess = false;
  
  if (emergencyToken && process.env.DISABLE_EMERGENCY_ACCESS !== 'true') {
    const { data: emergencySession } = await supabase
      .from('emergency_sessions')
      .select('expires_at')
      .eq('id', emergencyToken)
      .single();
      
    if (emergencySession && new Date(emergencySession.expires_at) > new Date()) {
      hasValidEmergencyAccess = true;
    }
  }

  const path = request.nextUrl.pathname;

  // Maintenance mode block (only allow EB and admins through, unless emergency access is active)
  if (settings?.maintenance_mode && !hasValidEmergencyAccess) {
    const isExempt = userProfile && ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(userProfile.role);
    if (!isExempt && !path.startsWith('/maintenance') && !path.startsWith('/login') && !path.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // 1. Unauthenticated users (and no emergency access)
  if (!user && !hasValidEmergencyAccess) {
    if (
      !path.startsWith('/login') &&
      !path.startsWith('/register') &&
      !path.startsWith('/api') &&
      !path.startsWith('/911') &&
      path !== '/'
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // 2. Authenticated users (Role/Status Protection)
  if (userProfile) {
    // Redirect based on status
    if (userProfile.status === 'PENDING' && !path.startsWith('/pending') && !path.startsWith('/api') && !path.startsWith('/911') && path !== '/') {
      return NextResponse.redirect(new URL('/pending', request.url));
    }
    if (userProfile.status === 'REJECTED' && !path.startsWith('/rejected') && !path.startsWith('/api') && !path.startsWith('/911') && path !== '/') {
      return NextResponse.redirect(new URL('/rejected', request.url));
    }

    // Role protection
    const isEB = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(userProfile.role);
    const isAdmin = userProfile.role === 'ADMIN';
    const isChair = ['CHAIR', 'CO_CHAIR'].includes(userProfile.role);
    const isSecurity = userProfile.role === 'SECURITY';
    const isMedia = ['MEDIA', 'PRESS'].includes(userProfile.role);

    if (path.startsWith('/eb/dash') && !isEB && !isAdmin && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/admin') && !isAdmin && !isEB && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/chair') && !isChair && !isEB && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/security') && !isSecurity && !isEB && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/press') && !isMedia && !isEB && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If they have emergency access, we can set a header so pages know
  if (hasValidEmergencyAccess) {
    response.headers.set('x-emergency-access', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}