import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import pushNotificationService from '@/services/pushNotificationService';
import * as Sentry from '@sentry/react-native';
import { LoginRequest, UserSession } from '@/types';

interface AuthHookReturn {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithSSO: (session: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  checkStoredSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthHookReturn => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Set user context in Sentry
   */
  const setUserContext = useCallback((session: UserSession) => {
    try {
      Sentry.setUser({
        id: String(session.user.userId),
        email: session.user.email,
      });
    } catch {
      // Never let telemetry break authentication
    }
  }, []);

  /**
   * Clear user context in Sentry
   */
  const clearUserContext = useCallback(() => {
    try {
      Sentry.setUser(null);
    } catch {
      // Never let telemetry break authentication
    }
  }, []);

  /**
   * Track authentication events as Sentry breadcrumbs
   */
  const trackAuthEvent = useCallback((eventName: string, properties: Record<string, unknown>) => {
    try {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: eventName,
        data: properties,
        level: 'info',
      });
    } catch {
      // Never let telemetry break authentication
    }
  }, []);

  /**
   * Check for existing stored session on app start
   */
  const checkStoredSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await authService.validateStoredSession();
      if (session) {
        setUser(session);

        // Set user context in Sentry
        setUserContext(session);

        // Track session restoration
        trackAuthEvent('session_restored', {
          userId: session.user.userId,
          clubId: session.user.clubId,
        });

        // Initialize push notifications for authenticated user
        try {
          await pushNotificationService.initialize();
        } catch {
          // Don't fail authentication if push notifications fail
        }
      }
    } catch {
      // Don't set error for stored session validation failure
      // User should just see login screen
    } finally {
      setLoading(false);
    }
  }, [setUserContext, trackAuthEvent]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);

      const session = await authService.login(credentials);
      setUser(session);

      // Set user context in Sentry
      setUserContext(session);

      // Track successful login
      trackAuthEvent('user_login', {
        method: 'credentials',
        userId: session.user.userId,
        clubId: session.user.clubId,
      });

      // Initialize push notifications after successful login
      try {
        await pushNotificationService.initialize();
      } catch {
        // Don't fail login if push notifications fail
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);

      // Track login failure
      try {
        Sentry.captureException(err, {
          tags: { context: 'Login', method: 'credentials' },
        });
      } catch {
        // Ignore tracking errors
      }

      throw err; // Re-throw for component-level handling
    } finally {
      setLoading(false);
    }
  }, [setUserContext, trackAuthEvent]);

  /**
   * Login with SSO session (Google/Apple)
   * Used when SSO authentication is handled externally
   */
  const loginWithSSO = useCallback(async (session: UserSession) => {
    try {
      setLoading(true);
      setError(null);

      setUser(session);

      // Set user context in Sentry
      setUserContext(session);

      // Track successful SSO login
      trackAuthEvent('user_login', {
        method: 'sso',
        userId: session.user.userId,
        clubId: session.user.clubId,
      });

      // Initialize push notifications after successful SSO login
      try {
        await pushNotificationService.initialize();
      } catch {
        // Don't fail login if push notifications fail
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SSO login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUserContext, trackAuthEvent]);

  /**
   * Logout user and clear stored credentials
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Track logout event before clearing context (to include user info)
      if (user) {
        trackAuthEvent('user_logout', {
          userId: user.user.userId,
          clubId: user.user.clubId,
        });
      }

      // Remove device token from backend before cleanup
      try {
        const deviceToken = pushNotificationService.getCurrentToken();
        if (deviceToken) {
          await pushNotificationService.unregisterDevice();
        }
      } catch {
        // Continue with logout even if device token removal fails
      }

      // Cleanup push notifications
      try {
        await pushNotificationService.cleanup();
      } catch {
        // Continue with logout even if push notification cleanup fails
      }

      await authService.logout();

      // Clear user context in Sentry
      clearUserContext();

      setUser(null);
      setError(null);
    } catch {
      // Clear user context even if logout fails
      clearUserContext();

      // Clear user state even if logout fails
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user, trackAuthEvent, clearUserContext]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check for stored session on hook initialization
   */
  useEffect(() => {
    checkStoredSession();
  }, [checkStoredSession]);

  return {
    user,
    loading,
    error,
    login,
    loginWithSSO,
    logout,
    checkStoredSession,
    clearError,
  };
};
