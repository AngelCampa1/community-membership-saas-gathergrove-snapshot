/**
 * Tests for security.ts - Security middleware with CSP, headers, and rate limiting
 * Following boundary mocking pattern: mock only external boundaries (NextRequest, NextResponse)
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware, detectSuspiciousActivity, rateLimit } from '../security';

// Mock Next.js server modules
jest.mock('next/server', () => {
  class NextResponseMock {
    status: number;
    headers: Map<string, string>;
    cookies: { set: jest.Mock; get: jest.Mock };

    constructor(body?: any, init?: any) {
      this.status = init?.status || 200;
      this.headers = new Map();
      // Copy init.headers if provided
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value: string, key: string) => {
            this.headers.set(key, value);
          });
        } else if (init.headers instanceof Map) {
          init.headers.forEach((value: string, key: string) => {
            this.headers.set(key, value);
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            this.headers.set(key, value as string);
          });
        }
      }
      this.cookies = {
        set: jest.fn(),
        get: jest.fn(),
      };
    }

    static next() {
      const response = {
        cookies: {
          set: jest.fn(),
          get: jest.fn(),
        },
        headers: new Map<string, string>(),
      };
      return response;
    }
  }

  return {
    NextRequest: jest.fn(),
    NextResponse: NextResponseMock,
  };
});

describe('security middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    mockResponse = {
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
      },
      headers: new Map<string, string>(),
    };

    // Mock NextResponse.next() to return our mockResponse
    jest.spyOn(NextResponse, 'next').mockReturnValue(mockResponse as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Security headers', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };
    });

    it('sets X-Frame-Options header to DENY', () => {
      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('sets X-Content-Type-Options header to nosniff', () => {
      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('sets X-XSS-Protection header', () => {
      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('sets Referrer-Policy header', () => {
      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('sets Permissions-Policy header', () => {
      const response = securityMiddleware(mockRequest);

      const policy = response?.headers.get('Permissions-Policy');
      expect(policy).toBeDefined();
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('camera=()');
    });

    it('sets Strict-Transport-Security header for HTTPS requests', () => {
      mockRequest.nextUrl.protocol = 'https:';

      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
    });

    it('does not set Strict-Transport-Security header for HTTP requests', () => {
      mockRequest.nextUrl.protocol = 'http:';

      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('Strict-Transport-Security')).toBeUndefined();
    });
  });

  describe('Content Security Policy (CSP)', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };
    });

    it('sets Content-Security-Policy header', () => {
      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('includes nonce in CSP for script-src', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/);
    });

    it('allows unsafe-inline for styles (needed for styled-components)', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
    });

    it('sets strict CSP directives', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
    });

    it('allows specific image sources', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain('img-src');
      expect(csp).toMatch(/img-src[^;]*data:/);
      expect(csp).toMatch(/img-src[^;]*https:/);
    });

    it('allows specific font sources', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain('font-src');
      expect(csp).toMatch(/font-src[^;]*data:/);
    });

    it('allows specific connect sources for API', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain('connect-src');
    });

    it('allows Ventora widget loader and data endpoints', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toMatch(/script-src[^;]*https:\/\/widgets\.ventoralabs\.com/);
      expect(csp).toMatch(/connect-src[^;]*https:\/\/widgets\.ventoralabs\.com/);
    });

    it('allows Ventora widget loader in production without strict-dynamic', () => {
      process.env.NODE_ENV = 'production';

      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      const scriptSrc = csp?.match(/script-src[^;]*/)?.[0];
      expect(scriptSrc).toContain('https://widgets.ventoralabs.com');
      expect(scriptSrc).not.toContain("'strict-dynamic'");
    });

    it('includes upgrade-insecure-requests in production', () => {
      process.env.NODE_ENV = 'production';

      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });

  describe('Rate limiting', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'POST',
        nextUrl: { pathname: '/api/data' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '192.168.1.100',
      };
    });

    it('allows requests under rate limit', () => {
      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
      expect(response).not.toBeInstanceOf(NextResponse);
      // Should return the modified response, not a rate limit error
    });

    it('handles missing IP address gracefully', () => {
      mockRequest.ip = undefined;

      const response = securityMiddleware(mockRequest);

      // Should not crash, should process request normally
      expect(response).toBeDefined();
    });

    it('tracks requests by IP address', () => {
      // First request
      securityMiddleware(mockRequest);

      // Second request from same IP
      const response2 = securityMiddleware(mockRequest);

      // Both should succeed (under rate limit)
      expect(response2).toBeDefined();
    });

    it('handles requests from different IPs independently', () => {
      const request1 = { ...mockRequest, ip: '192.168.1.100' };
      const request2 = { ...mockRequest, ip: '192.168.1.101' };

      const response1 = securityMiddleware(request1);
      const response2 = securityMiddleware(request2);

      // Both should succeed
      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });

  describe('Suspicious activity detection', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/api/data', search: '' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };
    });

    it('returns false for normal requests', () => {
      mockRequest.nextUrl.search = '?page=1&limit=10';

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(false);
    });

    it('detects SQL injection attempts in query params', () => {
      mockRequest.nextUrl.search = "?user=admin'--";

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });

    it('detects XSS attempts in query params', () => {
      mockRequest.nextUrl.search = '?input=<script>alert("xss")</script>';

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });

    it('detects path traversal attempts', () => {
      mockRequest.nextUrl.pathname = '/api/../../../etc/passwd';

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });

    it('allows legitimate use of special characters', () => {
      mockRequest.nextUrl.search = '?name=John&email=john@example.com';

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(false);
    });

    it('detects malicious user agents', () => {
      mockRequest.headers = new Map([['user-agent', 'sqlmap/1.0']]);

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });

    it('detects SQL UNION SELECT attacks', () => {
      mockRequest.nextUrl.search = '?id=1 UNION SELECT password FROM users';

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });

    it('detects SQL OR 1=1 attacks', () => {
      mockRequest.nextUrl.search = "?id=1 OR 1=1";

      const isSuspicious = detectSuspiciousActivity(mockRequest);

      expect(isSuspicious).toBe(true);
    });
  });

  describe('HTTP method handling', () => {
    it('handles GET requests', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
    });

    it('handles POST requests', () => {
      mockRequest = {
        method: 'POST',
        nextUrl: { pathname: '/api/data' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
    });

    it('handles PUT requests', () => {
      mockRequest = {
        method: 'PUT',
        nextUrl: { pathname: '/api/data/1' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
    });

    it('handles DELETE requests', () => {
      mockRequest = {
        method: 'DELETE',
        nextUrl: { pathname: '/api/data/1' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
    });

    it('handles OPTIONS requests', () => {
      mockRequest = {
        method: 'OPTIONS',
        nextUrl: { pathname: '/api/data' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
    });
  });

  describe('Environment-specific behavior', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page', protocol: 'https:' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };
    });

    it('applies stricter security in production', () => {
      process.env.NODE_ENV = 'production';

      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      expect(csp).toContain('upgrade-insecure-requests');
      expect(response?.headers.get('Strict-Transport-Security')).toBeDefined();
    });

    it('allows more flexibility in development', () => {
      process.env.NODE_ENV = 'development';
      mockRequest.nextUrl.protocol = 'http:'; // Development typically uses HTTP

      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('Strict-Transport-Security')).toBeUndefined();
    });

    it('applies security headers regardless of environment', () => {
      process.env.NODE_ENV = 'test';

      const response = securityMiddleware(mockRequest);

      expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Nonce generation', () => {
    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };
    });

    it('includes nonces in CSP for script-src', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      const nonce = csp?.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];

      expect(nonce).toBeDefined();
    });

    it('generates nonces in valid base64 format', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      const nonce = csp?.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];

      expect(nonce).toBeDefined();
      expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('generates nonces of appropriate length', () => {
      const response = securityMiddleware(mockRequest);

      const csp = response?.headers.get('Content-Security-Policy');
      const nonce = csp?.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];

      expect(nonce).toBeDefined();
      expect(nonce!.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Edge cases', () => {
    it('handles requests without user-agent', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map(),
        ip: '127.0.0.1',
      };

      expect(() => securityMiddleware(mockRequest)).not.toThrow();
    });

    it('handles requests without IP address', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: undefined,
      };

      expect(() => securityMiddleware(mockRequest)).not.toThrow();
    });

    it('handles empty pathname', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      expect(() => securityMiddleware(mockRequest)).not.toThrow();
    });

    it('handles empty query string', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/page', search: '' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect(response).toBeDefined();
      expect((response as any)?.status).not.toBe(403);
    });

    it('handles special characters in pathname', () => {
      mockRequest = {
        method: 'GET',
        nextUrl: { pathname: '/api/events/my-event-2024' },
        headers: new Map([['user-agent', 'Mozilla/5.0']]),
        ip: '127.0.0.1',
      };

      const response = securityMiddleware(mockRequest);

      expect((response as any)?.status).not.toBe(403);
    });
  });
});
