import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Get user (more secure than getSession)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Log authentication status for debugging
    // Removed debug logging for cleaner production experience

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      if (!user) {
        return NextResponse.redirect(
          new URL(
            '/auth/login?message=Please log in to access admin features',
            request.url
          )
        );
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_training_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.redirect(
          new URL(
            '/dashboard?message=Access denied. Admin privileges required.',
            request.url
          )
        );
      }
    }

    // Protect API admin routes
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_training_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Protect routes that require authentication
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      // Add a small delay to prevent rapid redirects
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check session again before redirecting
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname.startsWith('/auth') && user) {
      // Allow access to reset password page even for authenticated users
      if (request.nextUrl.pathname === '/auth/reset-password') {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Block access to test/debug routes in production
    if (process.env.NODE_ENV === 'production') {
      const testPaths = ['/test-sync', '/debug', '/api/test', '/admin/debug'];

      if (testPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        console.warn(
          `🚨 Production access blocked for: ${request.nextUrl.pathname}`
        );
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } catch (error) {
    console.error('❌ Middleware error:', error);

    // On middleware errors, allow the request to continue rather than blocking
    // This prevents authentication errors from completely breaking the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Middleware error, allowing request to continue');
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*',
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
