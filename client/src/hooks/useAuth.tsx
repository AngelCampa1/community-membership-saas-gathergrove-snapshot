"use client";

import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import authService, { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, UserSession } from '@/services/authService';
import { SESSION_EXPIRED_EVENT } from '@/services/apiClient';

// Re-export UserSession for external use
export type { UserSession };
import { ErrorHandler } from '@/lib/errorHandler';
import { setUserContext, clearUserContext, trackEvent } from '@/lib/sentry';
import { logger } from '@/lib/logger';

// Types for user and club data
export interface Club {
  id: number;
  name: string;
  tier: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  club: Club;
}

export interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  refreshSession: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public marketing routes where an unauthenticated user is always expected.
// Skipping the auth/me call on these routes eliminates guaranteed 401 noise and
// reduces initial page-load latency for visitors who are not logged in.
// Do NOT add /login, /register, /admin/*, /app/* — those pages need to know
// whether a session already exists.
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/about',
  '/features',
  '/contact',
  '/support',
  '/blog',
];

function isPublicRoute(pathname: string): boolean {
  // Exact match for root and top-level marketing pages
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  // Prefix match for nested marketing paths (e.g. /blog/some-post, /support/faq)
  return (
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/support/')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedOperation, setLastFailedOperation] = useState<(() => Promise<void>) | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
    setLastFailedOperation(null);
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (lastFailedOperation) {
      setError(null);
      await lastFailedOperation();
    }
  }, [lastFailedOperation]);

  const refreshSession = useCallback(async () => {
    // Prevent concurrent refresh operations
    if (isRefreshing) {
      if (process.env.NODE_ENV !== 'test') {
        logger.debug('Session refresh already in progress, skipping');
      }
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);
      const session = await authService.getCurrentSession();
      setUser(session);
      
      // Set user context in Application Insights
      if (session) {
        setUserContext(session.userId.toString(), session.clubId?.toString(), {
          email: session.email,
          clubName: session.clubName,
          clubTier: session.clubTier,
          onboardingCompleted: session.isOnboardingCompleted
        });
      }
      
      setLastFailedOperation(null);
    } catch (error) {
      const errorMessage = 'Failed to load your session. Please try logging in again.';
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Failed to refresh session', error);
      }
      setUser(null);
      clearUserContext(); // Clear user context on failure
      setError(errorMessage);
      ErrorHandler.showErrorToast(error, errorMessage);
      // Don't set up retry for session refresh to prevent infinite loops
      setLastFailedOperation(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Prevent multiple concurrent login attempts
    if (isLoggingIn) {
      throw new Error('Login is already in progress. Please wait.');
    }

    // Prevent login attempts during session refresh
    if (isRefreshing) {
      throw new Error('Session is being refreshed. Please wait.');
    }

    try {
      setError(null);
      setLoading(true);
      setIsLoggingIn(true);
      const response = await authService.login(credentials);
      
      // Only refresh session if login was successful
      // Use a separate flag to ensure atomic operation
      await refreshSession();
      
      // Track successful login
      trackEvent('UserLoggedIn', {
        loginMethod: 'email'
      });
      
      setLastFailedOperation(null);
      ErrorHandler.showSuccessToast('Welcome back! You have been logged in successfully.');
      return response;
    } catch (error) {
      const errorMessage = 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      // Don't set up retry for login failures to prevent infinite loops
      setLastFailedOperation(null);
      
      // Re-throw to let components handle specific error scenarios
      throw ErrorHandler.handleApiError(error, {
        context: 'logging in',
        action: 'Please check your email and password and try again',
        customMessages: {
          401: 'Invalid email or password. Please check your credentials.',
          403: 'Your account may not be activated. Please check your email for activation instructions.',
          429: 'Too many login attempts. Please wait a few minutes before trying again.'
        }
      });
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, isRefreshing, refreshSession]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
      clearUserContext(); // Clear user context in Application Insights
      trackEvent('UserLoggedOut'); // Track logout event
      setLastFailedOperation(null);
      ErrorHandler.showInfoToast('You have been logged out successfully.');
    } catch (error) {
      // Even if logout fails on server, clear local state
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Logout error (continuing with local cleanup)', error);
      }
      setUser(null);
      clearUserContext(); // Clear user context even on error
      setError(null);
      setLastFailedOperation(null);
      ErrorHandler.showWarningToast('Logged out locally. Some cleanup may not have completed on the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(data);
      
      // Only refresh session if registration was successful
      await refreshSession();
      
      setLastFailedOperation(null);
      ErrorHandler.showSuccessToast('Account created successfully! Welcome to GatherGrove.');
      return response;
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      setError(errorMessage);
      // Don't set up retry for registration failures to prevent infinite loops
      setLastFailedOperation(null);
      
      // Re-throw to let components handle specific error scenarios
      throw ErrorHandler.handleApiError(error, {
        context: 'creating your account',
        action: 'Please check your information and try again',
        customMessages: {
          409: 'An account with this email already exists. Please use a different email or try logging in.',
          422: 'Please check that all required fields are filled in correctly.',
          400: 'Invalid information provided. Please check your input and try again.'
        }
      });
    } finally {
      setLoading(false);
    }
  }, [refreshSession]);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await authService.completeOnboarding();
      
      // Refresh session to get updated onboarding status
      await refreshSession();
      
      setLastFailedOperation(null);
      ErrorHandler.showSuccessToast('Setup completed! Welcome to your club dashboard.');
    } catch (error) {
      const errorMessage = 'Failed to complete setup. Please try again.';
      setError(errorMessage);
      setLastFailedOperation(() => completeOnboarding());
      
      throw ErrorHandler.handleApiError(error, {
        context: 'completing your setup',
        action: 'Please try again or contact support@gathergrove.club if the problem persists',
        customMessages: {
          400: 'Setup information is incomplete. Please fill in all required fields.',
          409: 'Setup has already been completed for your account.'
        }
      });
    }
  }, [refreshSession]);

  // Load initial session on mount with error handling.
  // BUG-008: Skip the auth/me call entirely on known public marketing routes
  //   where a 401 is always expected — avoids unnecessary network noise and
  //   reduces latency for unauthenticated visitors.
  // NEW-010: Use an AbortController so the in-flight request is cancelled if
  //   the component unmounts before the response arrives, preventing the
  //   "Can't perform a React state update on an unmounted component" warning.
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadInitialSession = async () => {
      // BUG-008: public marketing routes — skip the network call entirely
      if (isPublicRoute(pathname)) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        setError(null);
        // NEW-010: pass the abort signal so the request is cancelled on unmount
        const session = await authService.getCurrentSession(controller.signal);
        if (mounted) {
          setUser(session);
        }
      } catch {
        // Don't show error toast for initial session load failures
        // User should just see login screen
        if (process.env.NODE_ENV !== 'test') {
          logger.debug('No valid session found, user needs to log in');
        }
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialSession();

    return () => {
      mounted = false;
      controller.abort(); // NEW-010: cancel in-flight auth/me on unmount
    };
  }, [pathname]);

  // A-002: react to mid-session expiry. When apiClient sees a 401 on a
  // non-auth-flow request it dispatches SESSION_EXPIRED_EVENT. We only act when
  // we currently believe a session exists — otherwise the 401 is background
  // noise (e.g. an unauthenticated visitor) and must not trigger a redirect.
  // userRef keeps the latest user without re-subscribing the listener.
  const userRef = useRef<UserSession | null>(user);
  userRef.current = user;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSessionExpired = () => {
      if (!userRef.current) return;
      authService.clearSessionCache();
      setUser(null);
      clearUserContext();
      setError('Your session has expired. Please log in again.');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    register,
    refreshSession,
    completeOnboarding,
    clearError,
    retryLastOperation,
  }), [user, loading, error, login, logout, register, refreshSession, completeOnboarding, clearError, retryLastOperation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 