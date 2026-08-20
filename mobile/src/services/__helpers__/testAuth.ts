/**
 * Test Auth Helpers
 * Helper functions for authentication in tests
 */

import { authService } from '../authService';
import type { LoginResponse, UserSession } from '@/types';

/**
 * Mock JWT token for testing
 */
export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

/**
 * Mock refresh token for testing (not in LoginResponse type, kept for legacy test compatibility)
 */
export const MOCK_REFRESH_TOKEN = 'mock-refresh-token-123';

/**
 * Create a mock login response matching the actual LoginResponse type
 */
export function createMockLoginResponse(overrides?: Partial<LoginResponse>): LoginResponse {
  return {
    userId: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    clubId: 1,
    role: 'Member',
    clubTier: 'Grow',
    isOnboardingCompleted: true,
    message: 'Login successful',
    token: MOCK_TOKEN,
    ...overrides,
  };
}

/**
 * Create a mock user session matching the actual UserSession type
 */
export function createMockUserSession(overrides?: Partial<UserSession>): UserSession {
  return {
    token: MOCK_TOKEN,
    user: {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'Member',
      clubId: 1,
      clubTier: 'Grow',
    },
    isAuthenticated: true,
    ...overrides,
  };
}

/**
 * Mock the auth service to return a stored token
 */
export function mockAuthToken(token: string = MOCK_TOKEN) {
  jest.spyOn(authService, 'getStoredToken').mockResolvedValue(token);
}

/**
 * Mock the auth service to return no token (unauthenticated)
 */
export function mockNoAuthToken() {
  jest.spyOn(authService, 'getStoredToken').mockResolvedValue(null);
}

/**
 * Clear all auth mocks
 */
export function clearAuthMocks() {
  jest.restoreAllMocks();
}

/**
 * Simulate authenticated user
 */
export async function simulateAuthenticatedUser(
  session: Partial<UserSession> = {}
): Promise<void> {
  const mockSession = createMockUserSession(session);
  mockAuthToken(mockSession.token);
}

/**
 * Simulate unauthenticated user
 */
export async function simulateUnauthenticatedUser(): Promise<void> {
  mockNoAuthToken();
}

/**
 * Create auth headers for requests
 */
export function createAuthHeaders(token: string = MOCK_TOKEN): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
