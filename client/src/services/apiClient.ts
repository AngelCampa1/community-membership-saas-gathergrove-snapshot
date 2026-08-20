import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';
import { trackApiCall } from '@/lib/sentry';
import { logger } from '@/lib/logger';

// Extend Axios config to include metadata for tracking
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

/**
 * Window event dispatched when an authenticated request is rejected with 401,
 * i.e. the session expired or became invalid mid-use. The AuthProvider listens
 * for this to clear local auth state and redirect to login, so users are not
 * left stranded in a broken, still-"logged-in" UI after their cookie expires.
 */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

/**
 * Notifies the app that an established session was lost (401 on a non-auth-flow
 * request). Auth-flow endpoints (/auth/*) are intentionally excluded: a 401
 * there is an expected outcome (wrong password on /auth/login, or an
 * unauthenticated visitor's /auth/me probe) and does NOT represent the loss of
 * an active session. SSR-safe: no-ops when there is no window.
 */
export function notifySessionExpired(status: number, url: string | undefined): void {
  if (status !== 401) return;
  if (url && url.includes('/auth/')) return;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// CSRF token utility function
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];
  
  return cookieValue || null;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1', // BUG FIX: Port standardization - Changed from 5284 to 8050
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
  timeout: 15000, // Reduced to 15 second timeout for better perceived performance
});

// Request interceptor for debugging, tracking, and security
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    logger.api(config.method?.toUpperCase() || 'GET', config.url || '', undefined, undefined, {
      headers: config.headers,
      params: config.params
    });

    // Add timestamp to track request duration
    config.metadata = { startTime: Date.now() };

    // Add CSRF token for state-changing requests
    const method = config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    return config;
  },
  (error: unknown): Promise<never> => {
    logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  <T = unknown>(response: AxiosResponse<T>): AxiosResponse<T> => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());

    logger.api(response.config.method?.toUpperCase() || 'GET', response.config.url || '', response.status, duration, {
      success: true
    });

    // Track successful API call
    trackApiCall(
      response.config.url || '',
      response.config.method?.toUpperCase() || 'GET',
      response.status,
      duration,
      {
        success: true,
        responseSize: JSON.stringify(response.data).length
      }
    );

    return response;
  },
  (error: AxiosError): Promise<never> => {
    // Track failed API call
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
    const status = error.response?.status || 0;

    // Skip logging for expected 401 from session check (unauthenticated users on public pages)
    const isExpected401 = status === 401 && error.config?.url?.includes('/auth/me');

    if (!isExpected401) {
      logger.api(error.config?.method?.toUpperCase() || 'GET', error.config?.url || '', status, duration, {
        error: error.message
      });

      trackApiCall(
        error.config?.url || '',
        error.config?.method?.toUpperCase() || 'GET',
        status,
        duration,
        {
          success: false,
          errorMessage: error.message,
          errorCode: error.code
        }
      );
    }

    // Create standardized error
     const data = error.response?.data as Record<string, unknown> | undefined;
     
     let message = (data?.message as string) || (data?.detail as string) || error.message;
     let type = getErrorTypeFromStatus(status);
     const code = (data?.code as string) || error.code;
     const details = data?.details as Record<string, unknown> | undefined;

    // Handle specific error scenarios
    if (status === 401) {
      type = ErrorTypes.AUTHENTICATION_ERROR;
      message = message || 'Your session has expired. Please log in again.';
      // Notify the app so it can clear stale auth state + redirect to login.
      // Excludes /auth/* (expected 401s) — see notifySessionExpired.
      notifySessionExpired(status, error.config?.url);
    } else if (status === 403) {
      type = ErrorTypes.AUTHORIZATION_ERROR;
      message = message || 'You don\'t have permission to perform this action.';
    } else if (status === 404) {
      type = ErrorTypes.NOT_FOUND_ERROR;
      message = message || 'The requested resource was not found.';
    } else if (status >= 400 && status < 500) {
      type = ErrorTypes.VALIDATION_ERROR;
      message = message || 'Please check your input and try again.';
    } else if (status >= 500) {
      type = ErrorTypes.SERVER_ERROR;
      message = 'Something went wrong on our end. Please try again in a moment.';
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      type = ErrorTypes.NETWORK_ERROR;
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
      type = ErrorTypes.TIMEOUT_ERROR;
      message = 'The request is taking longer than expected. Please try again.';
    }

    const apiError = new ApiErrorClass(message, status, type, code, details);
    return Promise.reject(apiError);
  }
);

function getErrorTypeFromStatus(status: number): ErrorTypes {
  if (status === 401) return ErrorTypes.AUTHENTICATION_ERROR;
  if (status === 403) return ErrorTypes.AUTHORIZATION_ERROR;
  if (status === 404) return ErrorTypes.NOT_FOUND_ERROR;
  if (status >= 400 && status < 500) return ErrorTypes.VALIDATION_ERROR;
  if (status >= 500) return ErrorTypes.SERVER_ERROR;
  if (status === 0) return ErrorTypes.NETWORK_ERROR;
  return ErrorTypes.UNKNOWN_ERROR;
}

export default apiClient; 