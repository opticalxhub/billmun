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

  const { data: { session } } = await supabase.auth.getSession()
  
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

  // If user is not signed in and the current path is not /login or /register,
  // redirect the user to /login
  if (
    !session &&
    !hasValidEmergencyAccess &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/911') &&
    request.nextUrl.pathname !== '/'
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If they have emergency access, we can set a header so pages know
  if (hasValidEmergencyAccess) {
    response.headers.set('x-emergency-access', 'true');
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}