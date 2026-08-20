/**
 * Tests for useAuth.tsx - Authentication context and hook
 * Following boundary mocking pattern: mock only authService, ErrorHandler toasts, Application Insights, logger
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useAuth, AuthProvider } from '../useAuth';
import authService from '@/services/authService';
import { SESSION_EXPIRED_EVENT } from '@/services/apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { setUserContext, clearUserContext, trackEvent } from '@/lib/sentry';
import { logger } from '@/lib/logger';

// Mock external dependencies (boundaries only)
jest.mock('@/services/authService');
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => error),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showInfoToast: jest.fn(),
    showWarningToast: jest.fn(),
  },
}));
jest.mock('@/lib/sentry', () => ({
  setUserContext: jest.fn(),
  clearUserContext: jest.fn(),
  trackEvent: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;
const mockSetUserContext = setUserContext as jest.MockedFunction<typeof setUserContext>;
const mockClearUserContext = clearUserContext as jest.MockedFunction<typeof clearUserContext>;
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>;

const mockUserSession = {
  userId: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  clubId: 100,
  clubName: 'Test Club',
  clubTier: 'premium',
  isOnboardingCompleted: true,
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: getCurrentSession returns null (no session)
    mockAuthService.getCurrentSession.mockResolvedValue(null);
  });

  describe('useAuth hook (without provider)', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    describe('Initial session loading', () => {
      it('loads existing session on mount', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.user).toBeNull();

        // Wait for session to load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.user).toEqual(mockUserSession);
        });
      });

      it('handles no session gracefully (user needs to login)', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(null);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.user).toBeNull();
          expect(result.current.error).toBeNull();
        });

        // Should not show error toast for initial load failures
        expect(mockErrorHandler.showErrorToast).not.toHaveBeenCalled();
      });

      it('handles session load errors gracefully', async () => {
        mockAuthService.getCurrentSession.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.user).toBeNull();
        });

        // Should not show error toast for initial load failures
        expect(mockErrorHandler.showErrorToast).not.toHaveBeenCalled();
      });

      it('cleans up on unmount', async () => {
        const { unmount } = renderHook(() => useAuth(), { wrapper });

        unmount();

        // Should not throw or cause errors
        expect(() => unmount()).not.toThrow();
      });
    });

    describe('Session expiry (A-002)', () => {
      let originalLocation: Location;
      let assignMock: jest.Mock;

      const setLocation = (pathname: string) => {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: { ...originalLocation, pathname, assign: assignMock },
        });
      };

      beforeEach(() => {
        originalLocation = window.location;
        assignMock = jest.fn();
        setLocation('/admin/members');
      });

      afterEach(() => {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: originalLocation,
        });
      });

      it('clears the session and redirects to login when an active session expires', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        act(() => {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        });

        await waitFor(() => expect(result.current.user).toBeNull());
        expect(mockAuthService.clearSessionCache).toHaveBeenCalled();
        expect(mockClearUserContext).toHaveBeenCalled();
        expect(result.current.error).toMatch(/session has expired/i);
        expect(assignMock).toHaveBeenCalledWith('/login');
      });

      it('ignores the event when there is no active session (background 401 noise)', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(null);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        });

        expect(result.current.user).toBeNull();
        expect(assignMock).not.toHaveBeenCalled();
        expect(mockAuthService.clearSessionCache).not.toHaveBeenCalled();
      });

      it('does not redirect when already on the login page', async () => {
        setLocation('/login');
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        act(() => {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        });

        await waitFor(() => expect(result.current.user).toBeNull());
        expect(assignMock).not.toHaveBeenCalled();
      });
    });

    describe('login()', () => {
      it('logs in successfully and refreshes session', async () => {
        const loginResponse = { success: true, token: 'test-token' };
        // Mock initial session load (returns null), then login response
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.login.mockResolvedValueOnce(loginResponse);
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession); // After login

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Wait for initial load
        await waitFor(() => expect(result.current.loading).toBe(false));

        let response: any;
        await act(async () => {
          response = await result.current.login({ email: 'test@example.com', password: 'password123' });
        });

        expect(response).toEqual(loginResponse);
        expect(result.current.user).toEqual(mockUserSession);
        expect(result.current.error).toBeNull();
        expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('Welcome back! You have been logged in successfully.');
        expect(mockTrackEvent).toHaveBeenCalledWith('UserLoggedIn', { loginMethod: 'email' });
        expect(mockSetUserContext).toHaveBeenCalledWith(
          mockUserSession.userId.toString(),
          mockUserSession.clubId?.toString(),
          expect.objectContaining({
            email: mockUserSession.email,
            clubName: mockUserSession.clubName,
          })
        );
      });

      it('handles login failure with error', async () => {
        const error = { response: { status: 401 } };
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.login.mockRejectedValueOnce(error);
        mockErrorHandler.handleApiError.mockReturnValueOnce(error);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
          await expect(result.current.login({ email: 'test@example.com', password: 'wrong' }))
            .rejects.toEqual(error);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.error).toBe('Login failed. Please check your credentials and try again.');
        expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            context: 'logging in',
            customMessages: expect.objectContaining({
              401: 'Invalid email or password. Please check your credentials.',
            }),
          })
        );
      });

      it('prevents concurrent login attempts', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Start first login (don't await)
        act(() => {
          result.current.login({ email: 'test@example.com', password: 'password123' }).catch(() => {});
        });

        // Try second login immediately - should throw
        await act(async () => {
          await expect(result.current.login({ email: 'test@example.com', password: 'password123' }))
            .rejects.toThrow('Login is already in progress. Please wait.');
        });
      });

      it('prevents login during session refresh', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        // Set up slow refresh
        mockAuthService.getCurrentSession.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockUserSession), 100)));

        // Start refresh (don't await)
        act(() => {
          result.current.refreshSession().catch(() => {});
        });

        // Try to login during refresh
        await act(async () => {
          await expect(result.current.login({ email: 'test@example.com', password: 'password123' }))
            .rejects.toThrow('Session is being refreshed. Please wait.');
        });
      });
    });

    describe('logout()', () => {
      it('logs out successfully and clears session', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(mockUserSession);
        mockAuthService.logout.mockResolvedValueOnce();

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        await act(async () => {
          await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(mockClearUserContext).toHaveBeenCalled();
        expect(mockTrackEvent).toHaveBeenCalledWith('UserLoggedOut');
        expect(mockErrorHandler.showInfoToast).toHaveBeenCalledWith('You have been logged out successfully.');
      });

      it('handles logout errors gracefully and clears local state anyway', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(mockUserSession);
        mockAuthService.logout.mockRejectedValueOnce(new Error('Server error'));

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        await act(async () => {
          await result.current.logout();
        });

        // Should clear local state even if server logout fails
        expect(result.current.user).toBeNull();
        expect(result.current.error).toBeNull();
        expect(mockClearUserContext).toHaveBeenCalled();
        expect(mockErrorHandler.showWarningToast).toHaveBeenCalledWith('Logged out locally. Some cleanup may not have completed on the server.');
      });
    });

    describe('register()', () => {
      it('registers successfully and refreshes session', async () => {
        const registerResponse = { success: true, userId: 1 };
        const registerData = {
          email: 'new@example.com',
          password: 'password123',
          fullName: 'New User',
          clubName: 'New Club',
        };
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.register.mockResolvedValueOnce(registerResponse);
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession); // After register

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        let response: any;
        await act(async () => {
          response = await result.current.register(registerData);
        });

        expect(response).toEqual(registerResponse);
        expect(result.current.user).toEqual(mockUserSession);
        expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('Account created successfully! Welcome to GatherGrove.');
      });

      it('handles registration failure with conflict error', async () => {
        const error = { response: { status: 409 } };
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.register.mockRejectedValueOnce(error);
        mockErrorHandler.handleApiError.mockReturnValueOnce(error);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
          await expect(result.current.register({ email: 'existing@example.com', password: 'pass', fullName: 'Test', clubName: 'Test' }))
            .rejects.toEqual(error);
        });

        expect(result.current.error).toBe('Registration failed. Please try again.');
        expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            context: 'creating your account',
            customMessages: expect.objectContaining({
              409: 'An account with this email already exists. Please use a different email or try logging in.',
            }),
          })
        );
      });
    });

    describe('refreshSession()', () => {
      it('refreshes session successfully', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        // Clear mock to test explicit refresh call
        jest.clearAllMocks();

        await act(async () => {
          await result.current.refreshSession();
        });

        expect(mockAuthService.getCurrentSession).toHaveBeenCalled();
        expect(mockSetUserContext).toHaveBeenCalled();
      });

      it('handles refresh failure and shows error', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.getCurrentSession.mockRejectedValueOnce(new Error('Session expired')); // Refresh attempt

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
          await result.current.refreshSession();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.error).toBe('Failed to load your session. Please try logging in again.');
        expect(mockClearUserContext).toHaveBeenCalled();
        expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
      });

      it('prevents concurrent refresh operations', async () => {
        mockAuthService.getCurrentSession.mockResolvedValue(mockUserSession);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        // Clear the initial mount call count
        jest.clearAllMocks();

        // Set up slow refresh
        mockAuthService.getCurrentSession.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockUserSession), 100)));

        // Start first refresh (don't await)
        act(() => {
          result.current.refreshSession().catch(() => {});
        });

        // Start second refresh - should be skipped
        await act(async () => {
          await result.current.refreshSession();
        });

        // Only one getCurrentSession call should be made (for the first refresh)
        expect(mockAuthService.getCurrentSession).toHaveBeenCalledTimes(1);
      });
    });

    describe('completeOnboarding()', () => {
      it('completes onboarding successfully', async () => {
        const userBeforeOnboarding = { ...mockUserSession, isOnboardingCompleted: false };
        const userAfterOnboarding = { ...mockUserSession, isOnboardingCompleted: true };

        mockAuthService.getCurrentSession.mockResolvedValueOnce(userBeforeOnboarding); // Initial load
        mockAuthService.completeOnboarding.mockResolvedValueOnce();
        mockAuthService.getCurrentSession.mockResolvedValueOnce(userAfterOnboarding); // After onboarding

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(userBeforeOnboarding));

        await act(async () => {
          await result.current.completeOnboarding();
        });

        expect(result.current.user).toEqual(userAfterOnboarding);
        expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('Setup completed! Welcome to your club dashboard.');
      });

      it('handles onboarding failure and calls error handler', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession); // Initial load
        const error = { response: { status: 400 } };
        mockAuthService.completeOnboarding.mockRejectedValueOnce(error);
        mockErrorHandler.handleApiError.mockImplementationOnce((err) => { throw err; });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        // completeOnboarding should throw
        try {
          await act(async () => {
            await result.current.completeOnboarding();
          });
          // If we get here, the test should fail
          fail('completeOnboarding should have thrown');
        } catch (e) {
          // Expected to throw
        }

        // Should have called error handler with correct context
        expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            context: 'completing your setup',
            customMessages: expect.objectContaining({
              400: 'Setup information is incomplete. Please fill in all required fields.',
            }),
          })
        );
      });
    });

    describe('clearError()', () => {
      it('clears error state', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load
        mockAuthService.login.mockRejectedValueOnce(new Error('Login failed'));
        mockErrorHandler.handleApiError.mockReturnValueOnce(new Error('Login failed'));

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Trigger error
        await act(async () => {
          await expect(result.current.login({ email: 'test@example.com', password: 'wrong' }))
            .rejects.toThrow();
        });

        expect(result.current.error).toBe('Login failed. Please check your credentials and try again.');

        // Clear error
        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
      });
    });

    describe('retryLastOperation()', () => {
      it('retries last failed operation', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession); // Initial load
        const error = new Error('Failed');
        mockAuthService.completeOnboarding.mockRejectedValueOnce(error);
        mockErrorHandler.handleApiError.mockImplementationOnce((err) => { throw err; });
        mockAuthService.completeOnboarding.mockResolvedValueOnce();
        mockAuthService.getCurrentSession.mockResolvedValueOnce(mockUserSession); // After retry

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.user).toEqual(mockUserSession));

        // Fail onboarding (first attempt)
        try {
          await act(async () => {
            await result.current.completeOnboarding();
          });
        } catch (e) {
          // Expected to throw
        }

        // Retry (second attempt should succeed)
        await act(async () => {
          await result.current.retryLastOperation();
        });

        // Should have called completeOnboarding twice (initial + retry)
        expect(mockAuthService.completeOnboarding).toHaveBeenCalledTimes(2);
        expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('Setup completed! Welcome to your club dashboard.');
      });

      it('does nothing if no operation to retry', async () => {
        mockAuthService.getCurrentSession.mockResolvedValueOnce(null); // Initial load

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
          await result.current.retryLastOperation();
        });

        // Should complete without error
        expect(result.current.error).toBeNull();
      });
    });
  });
});
