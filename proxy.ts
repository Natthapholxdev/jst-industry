import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('hr_session');

  // Paths that are considered public or auth-related
  const isAuthPage = pathname.startsWith('/login') || pathname === '/';

  if (!sessionCookie) {
    // If not logged in and trying to access a protected route
    if (!isAuthPage && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If accessing root, redirect to login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const session: any = await verifyAuth(sessionCookie.value);
    
    if (!session) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('hr_session');
      return response;
    }

    // If logged in and trying to access login page or root, redirect to dashboard
    if (isAuthPage) {
      if (session.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (session.role === 'employee') {
        return NextResponse.redirect(new URL('/my-profile', request.url));
      }
    }

    // Protect Admin routes
    const adminRoutes = ['/dashboard', '/employees', '/attendance', '/departments', '/leaves', '/ot-reports', '/reports', '/settings'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    
    if (isAdminRoute && session.role !== 'admin') {
      // Employees trying to access admin routes
      return NextResponse.redirect(new URL('/my-profile', request.url));
    }

    // Protect Employee routes
    if (pathname.startsWith('/my-profile') && session.role !== 'employee') {
      // Admins trying to access employee routes
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid cookie format
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('hr_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
