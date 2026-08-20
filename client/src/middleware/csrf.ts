import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF Protection Middleware for GatherGrove
 * Implements Double Submit Cookie pattern with SameSite cookies
 */

const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf-token';
const SECRET_KEY = process.env.CSRF_SECRET_KEY || 'fallback-secret-key-change-in-production';

/**
 * Generate a cryptographically secure CSRF token (Edge Runtime compatible)
 */
function generateCSRFToken(): string {
  // Use crypto.getRandomValues for Edge Runtime compatibility
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomValue = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now().toString();
  
  // Simple signature using timestamp and secret for Edge Runtime
  const signature = btoa(randomValue + timestamp + SECRET_KEY).slice(0, 32);
  
  return `${randomValue}.${timestamp}.${signature}`;
}

/**
 * Verify CSRF token integrity and freshness (Edge Runtime compatible)
 */
function verifyCSRFToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [randomValue, timestamp, signature] = parts;
    
    // Check token age (valid for 1 hour)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 60 * 60 * 1000) return false;
    
    // Verify signature using simple encoding for Edge Runtime
    const expectedSignature = btoa(randomValue + timestamp + SECRET_KEY).slice(0, 32);
    
    // Simple comparison (Edge Runtime safe)
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

/**
 * Check if request requires CSRF protection
 */
function requiresCSRFProtection(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  const path = request.nextUrl.pathname;
  
  // Protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  
  // Skip CSRF for API routes that use bearer tokens (already secure)
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/refresh')) {
    return false;
  }
  
  return true;
}

/**
 * CSRF Protection Middleware
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Skip CSRF protection in development for API testing
  if (process.env.NODE_ENV === 'development' && 
      request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  const response = NextResponse.next();
  
  // For GET requests, set CSRF token in cookie
  if (request.method === 'GET') {
    const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    
    if (!existingToken || !verifyCSRFToken(existingToken)) {
      const newToken = generateCSRFToken();
      
      response.cookies.set(CSRF_COOKIE_NAME, newToken, {
        httpOnly: false, // Needs to be accessible to JavaScript for AJAX requests
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour
        path: '/'
      });
    }
    
    return response;
  }
  
  // For state-changing requests, verify CSRF token
  if (requiresCSRFProtection(request)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
    
    if (!cookieToken || !headerToken) {
      return new NextResponse('CSRF token missing', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (!verifyCSRFToken(cookieToken) || cookieToken !== headerToken) {
      return new NextResponse('CSRF token invalid', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
  
  return response;
}

/**
 * Utility function to get CSRF token from client-side
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1];
  
  return cookieValue || null;
}