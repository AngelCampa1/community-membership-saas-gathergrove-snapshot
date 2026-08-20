import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware, detectSuspiciousActivity } from './middleware/security';
import { csrfMiddleware } from './middleware/csrf';

export function middleware(request: NextRequest) {
  // Canonical domain: redirect non-www to www (301 permanent)
  const host = request.headers.get('host') ?? '';
  if (host === 'gathergrove.club') {
    const url = request.nextUrl.clone();
    url.host = 'www.gathergrove.club';
    return NextResponse.redirect(url, 301);
  }

  // Serve SEO files cleanly — no cookies, no security headers
  const pathname = request.nextUrl.pathname;
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // Skip server-side auth/CSRF guards for E2E testing. Client guards and
  // mocked API responses still exercise the user-facing auth behavior.
  if (process.env.E2E_TESTING === 'true' || process.env.NODE_ENV === 'test') {
    return securityMiddleware(request);
  }

  // Server-side auth guard for /admin/* routes (fixes NEW-004, NEW-007)
  // Redirect unauthenticated visitors immediately — avoids the 6-8s loading
  // spinner and prevents protected page titles leaking in the initial HTML.
  // We only check for cookie presence; JWT validation happens in the API layer.
  if (pathname.startsWith('/admin')) {
    const hasAuthCookie =
      request.cookies.has('jwt') || request.cookies.has('auth-token');
    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl, 302);
    }
  }

  // Check for suspicious activity first
  if (detectSuspiciousActivity(request)) {
    return new Response('Access Denied', { status: 403 });
  }
  
  // Apply CSRF protection
  const csrfResponse = csrfMiddleware(request);
  if (csrfResponse && csrfResponse.status !== 200) {
    return csrfResponse;
  }
  
  // Apply security headers (this will be the final response or pass-through)
  return csrfResponse || securityMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-touch-icon.*\\.png|manifest.json).*)',
  ],
};
