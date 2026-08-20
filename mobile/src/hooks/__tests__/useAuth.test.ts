/**
 * useAuth Hook Tests
 * TDD Approach: Tests written FIRST before adding Sentry integration
 *
 * These tests extend the existing useAuth hook with analytics tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { authService } from '@/services/authService';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/pushNotificationService', () => ({
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    getCurrentToken: jest.fn().mockReturnValue(null),
    unregisterDevice: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@sentry/react-native');

// IMPORTANT: Unmock useAuth to test the real implementation
jest.unmock('@/hooks/useAuth');

import * as Sentry from '@sentry/react-native';
const mockSetUser = Sentry.setUser as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;

describe('useAuth - Sentry Integration', () => {
  const mockUserSession = {
    token: 'mock-token',
    user: {
      userId: 123,
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'member',
      clubId: 456,
      clubTier: 'premium',
      clubName: 'Test Club',
    },
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth service methods
    (authService.validateStoredSession as jest.Mock).mockResolvedValue(null);
    (authService.login as jest.Mock).mockResolvedValue(mockUserSession);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Login with Credentials', () => {
    it('should set user context with userId and email on successful login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );
      });
    });

    it('should track user_login breadcrumb on successful login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'auth',
            message: 'user_login',
            data: expect.objectContaining({
              method: 'credentials',
              userId: 123,
              clubId: 456,
            }),
          })
        );
      });
    });

    it('should capture exception on failed login', async () => {
      const loginError = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(mockCaptureException).toHaveBeenCalledWith(
          loginError,
          expect.objectContaining({
            tags: expect.objectContaining({
              context: 'Login',
              method: 'credentials',
            }),
          })
        );
      });
    });

    it('should not set user context on failed login', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          // Expected error
        }
      });

      expect(mockSetUser).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String) })
      );
    });
  });

  describe('Login with SSO', () => {
    it('should set user context on successful SSO login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginWithSSO(mockUserSession);
      });

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );
      });
    });

    it('should track user_login breadcrumb with SSO method', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginWithSSO(mockUserSession);
      });

      await waitFor(() => {
        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'auth',
            message: 'user_login',
            data: expect.objectContaining({
              method: 'sso',
              userId: 123,
              clubId: 456,
            }),
          })
        );
      });
    });
  });

  describe('Logout', () => {
    it('should clear user context on logout', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Clear mocks after login
      mockSetUser.mockClear();

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(null);
      });
    });

    it('should track user_logout breadcrumb', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Clear mocks after login
      mockAddBreadcrumb.mockClear();

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'auth',
            message: 'user_logout',
            data: expect.objectContaining({
              userId: 123,
              clubId: 456,
            }),
          })
        );
      });
    });

    it('should clear user context even if logout fails', async () => {
      (authService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Clear mocks after login
      mockSetUser.mockClear();

      // Logout (will fail but should still clear context)
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Stored Session Validation', () => {
    it('should set user context when validating stored session', async () => {
      (authService.validateStoredSession as jest.Mock).mockResolvedValue(mockUserSession);

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );
      });
    });

    it('should track session_restored breadcrumb on successful validation', async () => {
      (authService.validateStoredSession as jest.Mock).mockResolvedValue(mockUserSession);

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'auth',
            message: 'session_restored',
            data: expect.objectContaining({
              userId: 123,
              clubId: 456,
            }),
          })
        );
      });
    });

    it('should not set user context if no stored session exists', async () => {
      (authService.validateStoredSession as jest.Mock).mockResolvedValue(null);

      renderHook(() => useAuth());

      await waitFor(() => {
        // setUser is not called with a user object (only null would be called during logout)
        expect(mockSetUser).not.toHaveBeenCalledWith(
          expect.objectContaining({ id: expect.any(String) })
        );
      });
    });
  });

  describe('Error Resilience', () => {
    it('should not crash if Sentry tracking fails during login', async () => {
      mockAddBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Login should still succeed
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.user.userId).toBe(123);
    });

    it('should not crash if setting user context fails', async () => {
      mockSetUser.mockImplementationOnce(() => {
        throw new Error('Set context failed');
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Login should still succeed
      expect(result.current.user).not.toBeNull();
    });
  });
});
