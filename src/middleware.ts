import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EB_ROLES = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'];

/** Paths that never require authentication */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/acceptable-use',
  '/gallery',
  '/socials',
  '/contact',
  '/maintenance',
  '/911',
  '/dev/test',
];

function isPublicPath(path: string) {
  if (path.startsWith('/api')) return true;          // API routes handle own auth
  if (path.startsWith('/_next')) return true;
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
}

/** Portal paths = everything under /dashboard, /eb, /messages, /documents, /committees, /ai-feedback, /admin */
function isPortalPath(path: string) {
  return (
    path.startsWith('/dashboard') ||
    path.startsWith('/eb') ||
    path.startsWith('/messages') ||
    path.startsWith('/documents') ||
    path.startsWith('/committees') ||
    path.startsWith('/ai-feedback') ||
    path.startsWith('/admin')
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname;

  // ── Emergency access ────────────────────────────────────────────────
  const emergencyToken = request.cookies.get('emergency_token')?.value;
  let hasValidEmergencyAccess = false;

  if (emergencyToken && process.env.DISABLE_EMERGENCY_ACCESS !== 'true') {
    const { data: emergencySession } = await supabase
      .from('emergency_sessions')
      .select('expires_at')
      .eq('id', emergencyToken)
      .maybeSingle();
    if (emergencySession && new Date(emergencySession.expires_at) > new Date()) {
      hasValidEmergencyAccess = true;
    }
  }

  // ── Fetch profile + settings when we have a user ────────────────────
  let userProfile: { status: string; role: string } | null = null;
  let settings: { maintenance_mode: boolean } | null = null;

  if (user) {
    const [profileRes, settingsRes] = await Promise.all([
      supabase.from('users').select('status, role').eq('id', user.id).maybeSingle(),
      supabase.from('conference_settings').select('maintenance_mode').eq('id', '1').maybeSingle(),
    ]);
    userProfile = profileRes.data;
    settings = settingsRes.data;
  } else {
    const { data } = await supabase.from('conference_settings').select('maintenance_mode').eq('id', '1').maybeSingle();
    settings = data;
  }

  // ── Maintenance mode ────────────────────────────────────────────────
  if (settings?.maintenance_mode && !hasValidEmergencyAccess) {
    const isExempt = userProfile && EB_ROLES.includes(userProfile.role);
    if (
      !isExempt &&
      !path.startsWith('/maintenance') &&
      !path.startsWith('/login') &&
      !path.startsWith('/api/auth') &&
      !path.startsWith('/privacy') &&
      !path.startsWith('/terms') &&
      !path.startsWith('/acceptable-use') &&
      !path.startsWith('/911')
    ) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // ── Unauthenticated users ───────────────────────────────────────────
  if (!user && !hasValidEmergencyAccess) {
    // Require login for protected paths
    if (!isPublicPath(path) && !path.startsWith('/pending') && !path.startsWith('/rejected')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // ── Authenticated user guards ───────────────────────────────────────
  if (userProfile) {
    const isEB = EB_ROLES.includes(userProfile.role);
    const isAdmin = userProfile.role === 'ADMIN';
    const isChair = ['CHAIR', 'CO_CHAIR'].includes(userProfile.role);
    const isSecurity = userProfile.role === 'SECURITY';
    const isMedia = ['MEDIA', 'PRESS'].includes(userProfile.role);

    // Allow public paths, API, /911 for everyone
    const alwaysAllowed =
      isPublicPath(path) ||
      path.startsWith('/pending') ||
      path.startsWith('/rejected');

    // ── Status-based redirects ──────────────────────────────────────
    if (!alwaysAllowed && userProfile.status === 'PENDING') {
      return NextResponse.redirect(new URL('/pending', request.url));
    }
    if (!alwaysAllowed && userProfile.status === 'REJECTED') {
      return NextResponse.redirect(new URL('/rejected', request.url));
    }

    // ── EB can ONLY access /eb/dash and /911 (not other dashboards) ─
    if (isEB && !hasValidEmergencyAccess) {
      if (path.startsWith('/dashboard')) {
        // EB clicking /dashboard gets redirected to /eb/dash
        return NextResponse.redirect(new URL('/eb/dash', request.url));
      }
    }

    // ── Non-EB cannot access EB dashboard ───────────────────────────
    if (path.startsWith('/eb/dash') && !isEB && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ── Role-specific dashboard guards ──────────────────────────────
    if (path.startsWith('/dashboard/admin') && !isAdmin && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/chair') && !isChair && !isAdmin && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/security') && !isSecurity && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/press') && !isMedia && !hasValidEmergencyAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ── Emergency access header ─────────────────────────────────────────
  if (hasValidEmergencyAccess) {
    response.headers.set('x-emergency-access', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}