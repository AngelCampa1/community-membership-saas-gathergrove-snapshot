/**
 * Tests for root middleware — verifies SEO files bypass security/CSRF middleware
 * and the matcher regex excludes the correct paths.
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware, config } from '../middleware';

// Mock Next.js server modules
jest.mock('next/server', () => {
  class NextResponseMock {
    status: number;
    headers: Map<string, string>;
    cookies: { set: jest.Mock; get: jest.Mock };

    constructor(body?: any, init?: any) {
      this.status = init?.status || 200;
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string);
        });
      }
      this.cookies = {
        set: jest.fn(),
        get: jest.fn(),
      };
    }

    static next() {
      return {
        cookies: { set: jest.fn(), get: jest.fn() },
        headers: new Map<string, string>(),
      };
    }

    static redirect(url: any, status?: number) {
      return new NextResponseMock(null, { status: status || 307 });
    }
  }

  return {
    NextRequest: jest.fn(),
    NextResponse: NextResponseMock,
  };
});

// Mock sub-middleware modules so we can spy on them
jest.mock('../middleware/security', () => ({
  securityMiddleware: jest.fn(() => {
    const resp = (NextResponse as any).next();
    resp.headers.set('X-Content-Type-Options', 'nosniff');
    resp.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    return resp;
  }),
  detectSuspiciousActivity: jest.fn(() => false),
}));

jest.mock('../middleware/csrf', () => ({
  csrfMiddleware: jest.fn(() => {
    const resp = (NextResponse as any).next();
    resp.cookies.set('csrf-token', 'test-token');
    return resp;
  }),
}));

import { securityMiddleware, detectSuspiciousActivity } from '../middleware/security';
import { csrfMiddleware } from '../middleware/csrf';

function createMockRequest(pathname: string, method = 'GET'): any {
  return {
    method,
    nextUrl: {
      pathname,
      search: '',
      protocol: 'https:',
    },
    headers: {
      get: jest.fn(() => 'Mozilla/5.0 Googlebot'),
    },
    cookies: {
      get: jest.fn(),
    },
  };
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, 'next');
  });

  describe('SEO file bypass', () => {
    it('returns clean NextResponse.next() for /sitemap.xml without calling security or CSRF middleware', () => {
      const req = createMockRequest('/sitemap.xml');
      const result = middleware(req);

      expect(result).toBeDefined();
      expect(detectSuspiciousActivity).not.toHaveBeenCalled();
      expect(csrfMiddleware).not.toHaveBeenCalled();
      expect(securityMiddleware).not.toHaveBeenCalled();
      // Verify no security headers were set
      expect(result.headers.has('Cross-Origin-Embedder-Policy')).toBe(false);
      expect(result.headers.has('Content-Security-Policy')).toBe(false);
    });

    it('returns clean NextResponse.next() for /robots.txt without calling security or CSRF middleware', () => {
      const req = createMockRequest('/robots.txt');
      const result = middleware(req);

      expect(result).toBeDefined();
      expect(detectSuspiciousActivity).not.toHaveBeenCalled();
      expect(csrfMiddleware).not.toHaveBeenCalled();
      expect(securityMiddleware).not.toHaveBeenCalled();
      expect(result.headers.has('Cross-Origin-Embedder-Policy')).toBe(false);
    });

    it('does NOT set cookies on /sitemap.xml response', () => {
      const req = createMockRequest('/sitemap.xml');
      const result = middleware(req);

      expect(result.cookies.set).not.toHaveBeenCalled();
    });

    it('does NOT set cookies on /robots.txt response', () => {
      const req = createMockRequest('/robots.txt');
      const result = middleware(req);

      expect(result.cookies.set).not.toHaveBeenCalled();
    });
  });

  describe('normal page requests still run full middleware', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Override NODE_ENV so we don't hit the E2E/test shortcut path
      process.env = { ...originalEnv, NODE_ENV: 'production' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('runs security and CSRF middleware for /resources', () => {
      const req = createMockRequest('/resources');
      middleware(req);

      expect(detectSuspiciousActivity).toHaveBeenCalledWith(req);
      expect(csrfMiddleware).toHaveBeenCalledWith(req);
    });

    it('runs security and CSRF middleware for /', () => {
      const req = createMockRequest('/');
      middleware(req);

      expect(detectSuspiciousActivity).toHaveBeenCalledWith(req);
      expect(csrfMiddleware).toHaveBeenCalledWith(req);
    });
  });

  describe('matcher config', () => {
    it('does NOT exclude sitemap.xml from the matcher — middleware runs for it to enable non-www redirect', () => {
      const matcher = config.matcher[0];
      expect(matcher).not.toContain('sitemap\\.xml');
    });

    it('does NOT exclude robots.txt from the matcher — middleware runs for it to enable non-www redirect', () => {
      const matcher = config.matcher[0];
      expect(matcher).not.toContain('robots\\.txt');
    });
  });

  describe('non-www redirect for SEO files', () => {
    it('redirects gathergrove.club/sitemap.xml to www with a 301', () => {
      const clonedUrl = { host: 'gathergrove.club' };
      const req = createMockRequest('/sitemap.xml');
      req.headers.get = jest.fn((key: string) => {
        if (key === 'host') return 'gathergrove.club';
        return null;
      });
      req.nextUrl.clone = jest.fn(() => clonedUrl);

      const result = middleware(req);

      expect(clonedUrl.host).toBe('www.gathergrove.club');
      expect(result.status).toBe(301);
      // Security/CSRF middleware should NOT have been called — redirect short-circuits
      expect(detectSuspiciousActivity).not.toHaveBeenCalled();
      expect(csrfMiddleware).not.toHaveBeenCalled();
    });
  });
});
