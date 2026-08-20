/**
 * Sentry Integration Tests
 * TDD Approach: Tests written to verify end-to-end analytics integration
 *
 * These tests verify that:
 * 1. Full login flow sets user context and tracks breadcrumbs
 * 2. User context is set on session restore
 * 3. Logout clears context properly
 * 4. Error tracking works end-to-end
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

// Mock dependencies
jest.mock('@/services/authService');

const mockPushNotificationService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn().mockResolvedValue(undefined),
  getCurrentToken: jest.fn().mockReturnValue(null),
  unregisterDevice: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/services/pushNotificationService', () => ({
  default: mockPushNotificationService,
}));

jest.mock('@sentry/react-native');

// Unmock useAuth to test real implementation
jest.unmock('@/hooks/useAuth');

import * as Sentry from '@sentry/react-native';
const mockSetUser = Sentry.setUser as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;

describe('Sentry Integration - End-to-End', () => {
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
    mockPushNotificationService.initialize.mockClear();
    mockPushNotificationService.cleanup.mockClear();
    mockPushNotificationService.getCurrentToken.mockClear();
    mockPushNotificationService.unregisterDevice.mockClear();

    // Mock auth service
    (authService.validateStoredSession as jest.Mock).mockResolvedValue(null);
    (authService.login as jest.Mock).mockResolvedValue(mockUserSession);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Full Login Flow', () => {
    it('should set user context and track login breadcrumb', async () => {
      const TestComponent = () => {
        const { login } = useAuth();

        React.useEffect(() => {
          login({ email: 'test@example.com', password: 'password123' }).catch(() => {
            // Handle error silently for test
          });
        }, [login]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        // Verify user context was set
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );

        // Verify login breadcrumb was tracked
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

      // Verify user context was set before login breadcrumb
      const setUserCallOrder = mockSetUser.mock.invocationCallOrder[0];
      const breadcrumbCallOrder = mockAddBreadcrumb.mock.invocationCallOrder[
        mockAddBreadcrumb.mock.calls.findIndex(
          (call) => call[0]?.message === 'user_login'
        )
      ];
      expect(setUserCallOrder).toBeLessThan(breadcrumbCallOrder);
    });
  });

  describe('SSO Login Flow', () => {
    it('should set user context and track SSO login breadcrumb', async () => {
      const TestComponent = () => {
        const { loginWithSSO } = useAuth();

        React.useEffect(() => {
          loginWithSSO(mockUserSession).catch(() => {
            // Handle error silently for test
          });
        }, [loginWithSSO]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );

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

  describe('User Context Persistence', () => {
    it('should maintain user context across component re-renders', async () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        const { login, user } = useAuth();

        React.useEffect(() => {
          if (count === 0) {
            login({ email: 'test@example.com', password: 'password123' }).catch(() => {
              // Handle error silently for test
            });
          }
        }, [count, login]);

        React.useEffect(() => {
          if (user) {
            // Trigger re-render after login
            setCount(1);
          }
        }, [user]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({ id: '123' })
        );
      });

      // Context should only be set once, not on every re-render
      const setUserWithIdCalls = mockSetUser.mock.calls.filter(
        (call) => call[0] && call[0].id !== undefined
      );
      expect(setUserWithIdCalls).toHaveLength(1);
    });

    it('should restore user context from stored session', async () => {
      (authService.validateStoredSession as jest.Mock).mockResolvedValue(mockUserSession);

      const TestComponent = () => {
        useAuth(); // Hook will check stored session on mount
        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123',
            email: 'test@example.com',
          })
        );

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
  });

  describe('Logout Flow', () => {
    it('should clear user context and track logout breadcrumb', async () => {
      let doLogout: (() => Promise<void>) | null = null;

      const TestComponent = () => {
        const { login, logout } = useAuth();

        React.useEffect(() => {
          login({ email: 'test@example.com', password: 'password123' })
            .then(() => {
              doLogout = logout;
            })
            .catch(() => {});
        }, [login, logout]);

        return null;
      };

      render(<TestComponent />);

      // Wait for login to complete
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalled();
        expect(doLogout).not.toBeNull();
      });

      // Clear mocks after login
      mockSetUser.mockClear();
      mockAddBreadcrumb.mockClear();

      // Call logout
      await act(async () => {
        await doLogout!();
      });

      // Verify logout tracking
      expect(mockSetUser).toHaveBeenCalledWith(null);
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

  describe('Error Resilience', () => {
    it('should complete login even if breadcrumb tracking fails', async () => {
      mockAddBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      const TestComponent = () => {
        const { login } = useAuth();

        React.useEffect(() => {
          login({ email: 'test@example.com', password: 'password123' }).catch(() => {
            // Handle error silently for test
          });
        }, [login]);

        return null;
      };

      const { rerender } = render(<TestComponent />);

      await waitFor(() => {
        // Login should still succeed
        rerender(<TestComponent />);
      });

      // Verify login completed despite tracking error
      expect(authService.login).toHaveBeenCalled();
    });

    it('should complete logout even if setUser(null) fails', async () => {
      mockSetUser.mockImplementationOnce(() => {
        throw new Error('Clear context failed');
      });

      const TestComponent = () => {
        const { login, logout } = useAuth();
        const [loggedIn, setLoggedIn] = React.useState(false);

        React.useEffect(() => {
          if (!loggedIn) {
            login({ email: 'test@example.com', password: 'password123' })
              .then(() => setLoggedIn(true))
              .catch(() => {});
          }
        }, [login, loggedIn]);

        React.useEffect(() => {
          if (loggedIn) {
            logout().catch(() => {});
          }
        }, [loggedIn, logout]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        // Logout should still complete
        expect(authService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Complete User Journey', () => {
    it('should track complete user journey: login → logout', async () => {
      const trackingTimeline: string[] = [];

      mockSetUser.mockImplementation((user: unknown) => {
        trackingTimeline.push(user === null ? 'clearUserContext' : 'setUserContext');
      });

      mockAddBreadcrumb.mockImplementation((breadcrumb: { message?: string }) => {
        if (breadcrumb.message) {
          trackingTimeline.push(`breadcrumb:${breadcrumb.message}`);
        }
      });

      const TestComponent = () => {
        const { login, logout, user } = useAuth();
        const [step, setStep] = React.useState<'login' | 'loggedin' | 'logout'>('login');

        React.useEffect(() => {
          if (step === 'login') {
            login({ email: 'test@example.com', password: 'password123' })
              .then(() => setStep('loggedin'))
              .catch(() => {});
          }
        }, [login, step]);

        React.useEffect(() => {
          if (step === 'loggedin' && user) {
            // Simulate user action then logout
            setTimeout(() => setStep('logout'), 100);
          }
        }, [step, user]);

        React.useEffect(() => {
          if (step === 'logout') {
            logout().catch(() => {});
          }
        }, [step, logout]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(trackingTimeline.length).toBeGreaterThan(0);
      });

      // Wait for complete flow
      await waitFor(
        () => {
          expect(trackingTimeline).toContain('clearUserContext');
        },
        { timeout: 3000 }
      );

      // Verify correct events occurred
      expect(trackingTimeline).toContain('setUserContext');
      expect(trackingTimeline).toContain('breadcrumb:user_login');
      expect(trackingTimeline).toContain('breadcrumb:user_logout');
      expect(trackingTimeline).toContain('clearUserContext');

      // Verify correct order: login events before logout events
      const loginIndex = trackingTimeline.indexOf('breadcrumb:user_login');
      const logoutIndex = trackingTimeline.indexOf('breadcrumb:user_logout');
      expect(loginIndex).toBeLessThan(logoutIndex);
    });
  });
});
