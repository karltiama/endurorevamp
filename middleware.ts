import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?message=Please log in to access admin features', request.url))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_training_profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard?message=Access denied. Admin privileges required.', request.url))
    }
  }

  // Protect API admin routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_training_profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Protect routes that require authentication
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Block access to test/debug routes in production
  if (process.env.NODE_ENV === 'production') {
    const testPaths = [
      '/test-sync',
      '/debug',
      '/api/test',
      '/admin/debug'
    ];
    
    if (testPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      console.warn(`🚨 Production access blocked for: ${request.nextUrl.pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*',
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 