/**
 * MSW Request Handlers
 *
 * Define HTTP request handlers for testing.
 * Mock only external HTTP boundaries, not internal services.
 */

import { http, HttpResponse } from 'msw';

// Default handlers for common API endpoints
// Tests can override these using server.use() for specific scenarios
export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    });
  }),

  http.post('/api/v1/auth/forgot-password', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/v1/auth/reset-password', () => {
    return HttpResponse.json({ success: true });
  }),

  // Events endpoints
  http.get('/api/v1/clubs/:clubId/events', () => {
    return HttpResponse.json({
      events: [
        {
          id: 1,
          name: 'Test Event',
          description: 'Test Description',
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-01T23:59:59Z',
        },
      ],
    });
  }),

  http.get('/api/v1/clubs/:clubId/events/:eventId', () => {
    return HttpResponse.json({
      id: 1,
      name: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-01T23:59:59Z',
    });
  }),

  http.post('/api/v1/clubs/:clubId/events', () => {
    return HttpResponse.json({
      id: 1,
      name: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-01T23:59:59Z',
    }, { status: 201 });
  }),

  // Members endpoints
  http.get('/api/v1/clubs/:clubId/members/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      clubId: 1,
    });
  }),

  // Device tokens
  http.post('/api/v1/users/me/device-tokens', () => {
    return HttpResponse.json({ success: true });
  }),

  // Generic fallback for unhandled requests
  http.all('*', (info) => {
    console.warn(`Unhandled ${info.request.method} request to ${info.request.url}`);
    return HttpResponse.json({ error: 'Not mocked' }, { status: 404 });
  }),
];
