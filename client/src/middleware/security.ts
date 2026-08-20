import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API which is available in Edge Runtime
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Security middleware for Next.js frontend
 * BUG FIX #23: Implemented proper nonce-based CSP instead of unsafe-inline
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // BUG FIX #23: Generate a unique nonce for each request
  const nonce = generateNonce();

  // Content Security Policy with nonce-based approach
  // NOTE: In development, we still allow unsafe-eval for hot reloading and dev tools
  // In production, we use strict-dynamic and nonces
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  const cspDirectives = [
    `default-src 'self'`,
    // BUG FIX #23: Use nonce for inline scripts and explicit hosts for external scripts.
    // Do not use strict-dynamic here; the Ventora widget loader is an external Next Script without a nonce prop.
    `script-src 'self' 'nonce-${nonce}' ${isDevelopment || isTest ? "'unsafe-eval'" : ""} https://widgets.ventoralabs.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://appleid.cdn-apple.com`,
    // Keep unsafe-inline for styles as it's generally safe and needed for styled-components/emotion
    // TODO: Consider moving to nonce-based styles if using inline <style> tags
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    `connect-src 'self' ${isDevelopment ? 'http://localhost:5284 ws://localhost:5284 wss://localhost:5284 http://localhost:8050 ws://localhost:8050 wss://localhost:8050 http://localhost:3050 ws://localhost:3050 wss://localhost:3050 http: ws: wss:' : ''} https://widgets.ventoralabs.com https://api.stripe.com https://api-gathergrove-staging.azurewebsites.net https://api-gathergrove-prod.azurewebsites.net https://api.gathergrove.club wss://api.gathergrove.club https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://region1.analytics.google.com https://appleid.apple.com`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob: data:"
  ];

  // Only add upgrade-insecure-requests and block-all-mixed-content in production/staging
  if (!isDevelopment && !isTest) {
    cspDirectives.push("upgrade-insecure-requests");
    cspDirectives.push("block-all-mixed-content");
  }

  const csp = cspDirectives.join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Store nonce in request headers so it can be accessed by pages
  // Pages can use this nonce in their script tags: <script nonce={nonce}>
  response.headers.set('X-Nonce', nonce);
  
  // Permissions Policy - Enhanced to restrict more features
  response.headers.set('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com"), fullscreen=(self), accelerometer=(), autoplay=(), encrypted-media=(), gyroscope=(), picture-in-picture=(), usb=(), web-share=()');
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // HSTS (only for HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  return response;
}

/**
 * Check for suspicious patterns in requests
 */
export function detectSuspiciousActivity(request: NextRequest): boolean {
  const url = request.nextUrl.pathname + request.nextUrl.search;
  const userAgent = request.headers.get('user-agent') || '';
  
  // SQL injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /or\s+1\s*=\s*1/i,
    /admin'\s*--/i,
    /'\s*or\s*'1'\s*=\s*'1/i
  ];
  
  // XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /\bon\w+\s*=/i,  // Added word boundary to avoid matching query params
    /<iframe/i
  ];
  
  // Path traversal patterns
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.%2f/i,
    /%2e%2e%2f/i
  ];
  
  // Check patterns
  const allPatterns = [...sqlPatterns, ...xssPatterns, ...pathTraversalPatterns];

  for (const pattern of allPatterns) {
    if (pattern.test(url)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[security] Suspicious activity pattern detected in request', { pattern: pattern.toString(), url });
      }
      return true;
    }
  }

  // Check for malicious user agents
  const maliciousAgents = [
    'sqlmap', 'nikto', 'w3af', 'nmap', 'burp', 'zap'
  ];

  if (maliciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[security] Malicious user agent detected in request', { userAgent });
    }
    return true;
  }
  
  return false;
}

