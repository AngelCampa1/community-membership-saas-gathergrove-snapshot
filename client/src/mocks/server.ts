/**
 * MSW Server Setup for Jest Tests
 *
 * This provides MSW-compatible API but uses a simple URL pattern matching
 * fetch mock since MSW 2.x has compatibility issues with JSDOM.
 */
import { setupServer } from 'msw/node';
import { handlers as defaultHandlers } from './handlers';
import type { RequestHandler } from 'msw';
import type { MockHandlerInfo } from '../__mocks__/msw';
import { NETWORK_ERROR } from '../__mocks__/msw';

/**
 * MSW Server instance - used for API compatibility
 */
export const server = setupServer(...defaultHandlers);

// Simple mock response registry
interface MockResponse {
  method: string;
  urlPattern: RegExp | string;
  response: (url: string, init?: RequestInit) => Promise<Response> | Response;
}

// Runtime handlers from server.use()
let runtimeHandlers: MockHandlerInfo[] = [];

// Helper to convert URL pattern to regex
const urlToRegex = (url: string): RegExp => {
  // Handle route params like :id, :tagId, etc.
  const escaped = url
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars except :
    .replace(/:\w+/g, '[^/]+'); // Replace :param with wildcard
  return new RegExp(`${escaped}$`);
};

// Helper to extract params from URL
const extractParams = (urlPattern: string, actualUrl: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const patternParts = urlPattern.split('/');
  const urlParts = actualUrl.split('?')[0].split('/');

  patternParts.forEach((part, i) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      if (urlParts[urlParts.length - patternParts.length + i]) {
        params[paramName] = urlParts[urlParts.length - patternParts.length + i];
      }
    }
  });

  return params;
};

// Default mock responses for common endpoints
const defaultMockResponses: MockResponse[] = [
  // Tags endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/tags$/,
    response: () => new Response(JSON.stringify([
      { id: '1', name: 'VIP Member', color: '#f59e0b', category: 'cat-1', usageCount: 150 },
      { id: '2', name: 'Event Attendee', color: '#3b82f6', category: 'cat-2', usageCount: 89 },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/tags\/categories$/,
    response: () => new Response(JSON.stringify([
      { id: 'cat-1', name: 'Membership', color: '#f59e0b' },
      { id: 'cat-2', name: 'Events', color: '#3b82f6' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/tags\/stats$/,
    response: () => new Response(JSON.stringify({
      totalTags: 2,
      totalCategories: 2,
      totalAssignments: 239,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/tags$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) {
          body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        }
      } catch { /* ignore */ }
      return new Response(JSON.stringify({
        id: `tag-${Date.now()}`,
        name: body.name,
        color: body.color,
        category: body.category,
        usageCount: 0,
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  },
  {
    method: 'PUT',
    urlPattern: /\/api\/v1\/tags\/[^/]+$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) {
          body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        }
      } catch { /* ignore */ }
      const id = url.split('/').pop();
      return new Response(JSON.stringify({ id, ...body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  },
  {
    method: 'DELETE',
    urlPattern: /\/api\/v1\/tags\/[^/]+$/,
    response: () => new Response(null, { status: 204 }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/tags\/assign$/,
    response: () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/tags\/remove$/,
    response: () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/tags\/categories$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) {
          body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        }
      } catch { /* ignore */ }
      return new Response(JSON.stringify({ id: `cat-${Date.now()}`, ...body }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  },
  // Health check
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/health$/,
    response: () => new Response(JSON.stringify({ Status: 'Healthy', Timestamp: new Date().toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  // Auth endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/auth\/me$/,
    response: () => new Response(JSON.stringify({
      userId: 1, fullName: 'Test User', email: 'test@example.com',
      clubId: 1, clubName: 'Test Club', clubTier: 'Grow', role: 'Admin',
      isOnboardingCompleted: true, memberId: 1,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/auth\/login$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch { /* ignore */ }
      if (body.email === 'test@example.com' && body.password === 'password') {
        return new Response(JSON.stringify({
          user: { id: 1, email: body.email, fullName: 'Test User' },
          token: 'mock-jwt-token',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    },
  },
  // Members endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/members$/,
    response: () => new Response(JSON.stringify([
      { id: 1, fullName: 'Test Member', email: 'test@example.com', status: 'Active', role: 'Member' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/members\/\d+$/,
    response: (url: string) => {
      const id = url.split('/').pop();
      return new Response(JSON.stringify({
        id: parseInt(id || '1'), fullName: 'Test Member',
        email: 'test@example.com', status: 'Active', role: 'Member',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  },
  // Events endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/events$/,
    response: () => new Response(JSON.stringify([
      { id: 1, title: 'Test Event', description: 'Test event description', startDate: new Date().toISOString(), status: 'Active' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  // Dashboard/analytics endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/dashboard\/stats$/,
    response: () => new Response(JSON.stringify({
      totalMembers: 150, activeMembers: 120, totalEvents: 25, upcomingEvents: 5,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  // Brand assets endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/brand-assets$/,
    response: () => new Response(JSON.stringify([
      { id: '1', name: 'Logo', type: 'image', url: 'https://example.com/logo.png', category: 'logos' },
      { id: '2', name: 'Banner', type: 'image', url: 'https://example.com/banner.png', category: 'banners' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/brand-assets$/,
    response: () => new Response(JSON.stringify({
      id: `asset-${Date.now()}`, name: 'New Asset', type: 'image',
      url: 'https://example.com/new.png', category: 'misc',
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'DELETE',
    urlPattern: /\/api\/v1\/brand-assets\/[^/]+$/,
    response: () => new Response(null, { status: 204 }),
  },
  // Scheduled reports endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/clubs\/\d+\/reports\/scheduled$/,
    response: () => new Response(JSON.stringify([
      { id: '1', name: 'Weekly Report', frequency: 'weekly', format: 'pdf', enabled: true },
      { id: '2', name: 'Monthly Summary', frequency: 'monthly', format: 'excel', enabled: true },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/clubs\/\d+\/reports\/scheduled$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch { /* ignore */ }
      return new Response(JSON.stringify({ id: `report-${Date.now()}`, ...body, enabled: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  },
  {
    method: 'PATCH',
    urlPattern: /\/api\/v1\/reports\/scheduled\/[^/]+$/,
    response: async (url: string, init?: RequestInit) => {
      let body: Record<string, unknown> = {};
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch { /* ignore */ }
      const id = url.split('/').pop();
      return new Response(JSON.stringify({ id, ...body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  },
  {
    method: 'DELETE',
    urlPattern: /\/api\/v1\/reports\/scheduled\/[^/]+$/,
    response: () => new Response(null, { status: 204 }),
  },
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/reports\/scheduled\/[^/]+\/history$/,
    response: () => new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/reports\/scheduled\/[^/]+\/run$/,
    response: () => new Response(JSON.stringify({ executionId: 'exec-123', status: 'queued', startedAt: new Date().toISOString(), estimatedCompletionAt: new Date(Date.now() + 60000).toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  },
  {
    method: 'POST',
    urlPattern: /\/api\/v1\/reports\/scheduled\/[^/]+\/(pause|resume)$/,
    response: () => new Response(null, { status: 204 }),
  },
  // Clubs endpoints
  {
    method: 'GET',
    urlPattern: /\/api\/v1\/clubs\/\d+$/,
    response: (url: string) => {
      const id = url.split('/').pop();
      return new Response(JSON.stringify({
        id: parseInt(id || '1'), name: 'Test Club',
        description: 'A test club', tier: 'premium', memberCount: 50,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  },
];

/**
 * Custom fetch implementation with URL pattern matching
 */
const createMockFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET').toUpperCase();

    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http')) {
      normalizedUrl = `http://localhost:8050${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // First check runtime handlers (from server.use())
    for (const handler of runtimeHandlers) {
      if (handler.method !== method) continue;

      const urlRegex = urlToRegex(handler.url);
      if (urlRegex.test(normalizedUrl)) {
        try {
          // Build request object
          const request = new Request(normalizedUrl, {
            method,
            headers: init?.headers,
            body: init?.body,
          });

          // Extract params
          const params = extractParams(handler.url, normalizedUrl);

          // Call resolver
          const response = await handler.resolver({ request, params });
          // Check for network error marker
          if (response === NETWORK_ERROR) {
            throw new TypeError('Failed to fetch');
          }
          if (response instanceof Response) {
            return response;
          }
        } catch (e) {
          // Re-throw network errors (TypeError: Failed to fetch)
          if (e instanceof TypeError && e.message === 'Failed to fetch') {
            throw e;
          }
          console.error('Handler error:', e);
        }
      }
    }

    // Then check default mock responses
    for (const mock of defaultMockResponses) {
      if (mock.method !== method) continue;

      let matches = false;
      if (typeof mock.urlPattern === 'string') {
        matches = normalizedUrl.includes(mock.urlPattern);
      } else {
        matches = mock.urlPattern.test(normalizedUrl);
      }

      if (matches) {
        return await mock.response(normalizedUrl, init);
      }
    }

    // No handler matched
    console.warn(`Mock fetch: No handler matched for ${method} ${normalizedUrl}`);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
};

/**
 * Runtime mock overrides
 */
let runtimeMockResponses: MockResponse[] = [];

export const addMockResponse = (mock: MockResponse) => {
  runtimeMockResponses.unshift(mock);
};

export const clearMockResponses = () => {
  runtimeMockResponses = [];
};

/**
 * Standard MSW server lifecycle for Jest
 */
export const setupMswServer = () => {
  beforeAll(() => {
    try {
      server.listen({ onUnhandledRequest: 'bypass' });
    } catch { /* ignore */ }
    const mockFetch = createMockFetch();
    globalThis.fetch = mockFetch;
    global.fetch = mockFetch as typeof global.fetch;
    if (typeof window !== 'undefined') {
      (window as any).fetch = mockFetch;
    }
  });

  afterEach(() => {
    server.resetHandlers();
    runtimeHandlers = [];
    clearMockResponses();
  });

  afterAll(() => {
    try {
      server.close();
    } catch { /* ignore */ }
  });
};

// Override server.use to capture handlers from our mock MSW
const originalUse = server.use.bind(server);
server.use = (...handlers: (RequestHandler | MockHandlerInfo)[]) => {
  // Extract handler info from our mock MSW handlers
  for (const handler of handlers) {
    // Check if it's our mock handler (has method, url, resolver)
    const mockHandler = handler as unknown as MockHandlerInfo;
    if (mockHandler && mockHandler.method && mockHandler.url && mockHandler.resolver) {
      runtimeHandlers.unshift(mockHandler);
    }
  }
  try {
    return originalUse(...(handlers as RequestHandler[]));
  } catch {
    // Ignore errors from real MSW
  }
};

// Export MSW utilities (these come from our mock)
export { http, HttpResponse } from 'msw';
