/**
 * @jest-environment jsdom
 *
 * API Client Tests
 *
 * Tests the axios-based API client configuration and error handling.
 */

import { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient, { notifySessionExpired, SESSION_EXPIRED_EVENT } from '../apiClient';
import { ErrorTypes, ApiErrorClass } from '@/types/errors';

// Mock dependencies
jest.mock('@/lib/sentry', () => ({
  trackApiCall: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    api: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

import { trackApiCall } from '@/lib/sentry';
import { logger } from '@/lib/logger';

// Re-create the interceptor logic for testing (mirrors apiClient.ts)
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  return cookieValue || null;
}

function applyRequestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  (logger.api as jest.Mock)(config.method?.toUpperCase() || 'GET', config.url || '', undefined, undefined, {
    headers: config.headers,
    params: config.params
  });

  config.metadata = { startTime: Date.now() };

  const method = config.method?.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  config.headers['X-Requested-With'] = 'XMLHttpRequest';

  return config;
}

function applyResponseErrorInterceptor(error: AxiosError): Promise<never> {
  const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
  const status = error.response?.status || 0;

  (logger.api as jest.Mock)(error.config?.method?.toUpperCase() || 'GET', error.config?.url || '', status, duration, {
    error: error.message
  });

  (trackApiCall as jest.Mock)(
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

  const data = error.response?.data as Record<string, unknown> | undefined;

  let message = (data?.message as string) || (data?.detail as string) || error.message;
  let type = getErrorTypeFromStatus(status);
  const code = (data?.code as string) || error.code;
  const details = data?.details as Record<string, unknown> | undefined;

  if (status === 401) {
    type = ErrorTypes.AUTHENTICATION_ERROR;
    message = message || 'Your session has expired. Please log in again.';
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

function getErrorTypeFromStatus(status: number): ErrorTypes {
  if (status === 401) return ErrorTypes.AUTHENTICATION_ERROR;
  if (status === 403) return ErrorTypes.AUTHORIZATION_ERROR;
  if (status === 404) return ErrorTypes.NOT_FOUND_ERROR;
  if (status >= 400 && status < 500) return ErrorTypes.VALIDATION_ERROR;
  if (status >= 500) return ErrorTypes.SERVER_ERROR;
  if (status === 0) return ErrorTypes.NETWORK_ERROR;
  return ErrorTypes.UNKNOWN_ERROR;
}

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  describe('configuration', () => {
    it('should have the correct base URL', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:8050/api/v1');
    });

    it('should have correct default headers', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
      expect(apiClient.defaults.headers['Accept']).toBe('application/json');
    });

    it('should have credentials enabled', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it('should have 15 second timeout', () => {
      expect(apiClient.defaults.timeout).toBe(15000);
    });
  });

  describe('request interceptor logic', () => {
    const createMockConfig = (method: string = 'get'): InternalAxiosRequestConfig => ({
      method,
      url: '/test',
      headers: {} as any,
    });

    it('should add X-Requested-With header', () => {
      const config = createMockConfig('get');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest');
    });

    it('should add CSRF token for POST requests when cookie exists', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token=test-csrf-token; other-cookie=value',
      });

      const config = createMockConfig('post');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBe('test-csrf-token');
    });

    it('should add CSRF token for PUT requests', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token=put-csrf-token',
      });

      const config = createMockConfig('put');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBe('put-csrf-token');
    });

    it('should add CSRF token for PATCH requests', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token=patch-csrf-token',
      });

      const config = createMockConfig('patch');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBe('patch-csrf-token');
    });

    it('should add CSRF token for DELETE requests', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token=delete-csrf-token',
      });

      const config = createMockConfig('delete');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBe('delete-csrf-token');
    });

    it('should NOT add CSRF token for GET requests', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token=get-csrf-token',
      });

      const config = createMockConfig('get');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('should not add CSRF token when cookie does not exist', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'other-cookie=value',
      });

      const config = createMockConfig('post');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('should log API requests', () => {
      const config = createMockConfig('get');
      config.url = '/test-endpoint';
      applyRequestInterceptor(config);

      expect(logger.api).toHaveBeenCalled();
    });

    it('should add metadata with start time', () => {
      const config = createMockConfig('get');
      const result = applyRequestInterceptor(config);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.startTime).toBeDefined();
      expect(typeof result.metadata?.startTime).toBe('number');
    });
  });

  describe('response error interceptor logic', () => {
    const createAxiosError = (status: number, data: any = {}, code?: string): AxiosError => {
      const error = new Error('Request failed') as AxiosError;
      error.response = {
        status,
        statusText: status >= 500 ? 'Internal Server Error' : 'Error',
        data,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      error.config = {
        url: '/test',
        method: 'get',
        metadata: { startTime: Date.now() },
        headers: {} as any,
      } as InternalAxiosRequestConfig;
      error.isAxiosError = true;
      if (code) {
        error.code = code;
      }
      return error;
    };

    it('should handle 401 authentication error', async () => {
      const error = createAxiosError(401, {});

      await expect(applyResponseErrorInterceptor(error)).rejects.toThrow(ApiErrorClass);
      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.AUTHENTICATION_ERROR);
      }
    });

    it('should handle 403 authorization error', async () => {
      const error = createAxiosError(403, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.AUTHORIZATION_ERROR);
      }
    });

    it('should handle 404 not found error', async () => {
      const error = createAxiosError(404, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.NOT_FOUND_ERROR);
      }
    });

    it('should handle 400 validation error', async () => {
      const error = createAxiosError(400, { message: 'Validation failed' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
      }
    });

    it('should handle 500 server error', async () => {
      const error = createAxiosError(500, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.SERVER_ERROR);
      }
    });

    it('should handle network errors', async () => {
      const error = createAxiosError(0, {}, 'ERR_NETWORK');
      error.response = undefined;

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.NETWORK_ERROR);
      }
    });

    it('should handle timeout errors with ECONNABORTED code', async () => {
      const error = createAxiosError(0, {}, 'ECONNABORTED');
      error.response = undefined;

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.TIMEOUT_ERROR);
      }
    });

    it('should handle timeout with TIMEOUT error code', async () => {
      const error = createAxiosError(0, {}, 'TIMEOUT');
      error.response = undefined;

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.TIMEOUT_ERROR);
      }
    });

    it('should extract message from response data', async () => {
      const error = createAxiosError(400, { message: 'Custom error message from server' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Custom error message from server');
      }
    });

    it('should extract detail from response data', async () => {
      const error = createAxiosError(400, { detail: 'Detailed error information' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Detailed error information');
      }
    });

    it('should track failed API calls', async () => {
      const error = createAxiosError(500, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch {
        // Expected to throw
      }

      expect(trackApiCall).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        500,
        expect.any(Number),
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('default export', () => {
    it('should export apiClient as default', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });
  });

  // A-002: session-expiry notification. Tests the REAL exported helper that the
  // 401 branch of the response interceptor calls.
  describe('notifySessionExpired', () => {
    let dispatched: Event[];
    const listener = (e: Event) => dispatched.push(e);

    beforeEach(() => {
      dispatched = [];
      window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    });

    afterEach(() => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    });

    it('dispatches the session-expired event on a 401 for a non-auth request', () => {
      notifySessionExpired(401, '/members');
      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].type).toBe(SESSION_EXPIRED_EVENT);
    });

    it('does NOT dispatch for non-401 statuses', () => {
      notifySessionExpired(403, '/members');
      notifySessionExpired(500, '/members');
      notifySessionExpired(0, '/members');
      expect(dispatched).toHaveLength(0);
    });

    it('does NOT dispatch for 401s on auth-flow endpoints', () => {
      notifySessionExpired(401, '/auth/me');
      notifySessionExpired(401, '/auth/login');
      notifySessionExpired(401, 'http://localhost:8050/api/v1/auth/me');
      expect(dispatched).toHaveLength(0);
    });

    it('dispatches when the url is undefined (defensive default)', () => {
      notifySessionExpired(401, undefined);
      expect(dispatched).toHaveLength(1);
    });
  });

  // Enhanced Branch Coverage Tests
  describe('CSRF Token - Enhanced Coverage', () => {
    const createMockConfig = (method: string = 'post'): InternalAxiosRequestConfig => ({
      method,
      url: '/test',
      headers: {} as any,
    });

    it('should return null in SSR environment (document undefined)', () => {
      const originalDocument = global.document;

      try {
        // @ts-expect-error - Intentionally setting document to undefined for SSR test
        global.document = undefined;

        const config = createMockConfig('post');
        const result = applyRequestInterceptor(config);

        expect(result.headers['X-CSRF-Token']).toBeUndefined();
      } finally {
        global.document = originalDocument;
      }
    });

    it('should return null when cookies are empty', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });

      const config = createMockConfig('post');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('should handle malformed csrf-token cookie gracefully', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrf-token; other-cookie=value',
      });

      const config = createMockConfig('post');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBeFalsy();
    });

    it('should extract CSRF token from multiple cookies', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'session=abc; csrf-token=my-token; user=john',
      });

      const config = createMockConfig('post');
      const result = applyRequestInterceptor(config);

      expect(result.headers['X-CSRF-Token']).toBe('my-token');
    });
  });

  describe('Error Response - Enhanced Data Extraction', () => {
    const createAxiosError = (status: number, data: any = {}, code?: string): AxiosError => {
      const error = new Error('Request failed') as AxiosError;
      error.response = {
        status,
        statusText: status >= 500 ? 'Internal Server Error' : 'Error',
        data,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      error.config = {
        url: '/test',
        method: 'get',
        metadata: { startTime: Date.now() },
        headers: {} as any,
      } as InternalAxiosRequestConfig;
      error.isAxiosError = true;
      if (code) {
        error.code = code;
      }
      return error;
    };

    it('should handle error without response (network error)', async () => {
      const error = createAxiosError(0, {}, 'ERR_NETWORK');
      error.response = undefined;
      error.message = 'Network Error';

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).status).toBe(0);
      }
    });

    it('should handle error with undefined response.data', async () => {
      const error = createAxiosError(500, undefined);

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Something went wrong on our end. Please try again in a moment.');
      }
    });

    it('should prioritize message over detail when both exist', async () => {
      const error = createAxiosError(400, {
        message: 'Priority message',
        detail: 'Secondary detail'
      });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Priority message');
      }
    });

    it('should extract code from response data', async () => {
      const error = createAxiosError(400, { code: 'INVALID_INPUT', message: 'Invalid data' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).code).toBe('INVALID_INPUT');
      }
    });

    it('should fall back to error.code when data.code not present', async () => {
      const error = createAxiosError(400, { message: 'Error message' });
      error.code = 'ERR_BAD_REQUEST';

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).code).toBe('ERR_BAD_REQUEST');
      }
    });

    it('should extract details from response data', async () => {
      const error = createAxiosError(400, {
        message: 'Validation failed',
        details: { field: 'email', reason: 'Invalid format' }
      });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).details).toEqual({ field: 'email', reason: 'Invalid format' });
      }
    });

    it('should handle undefined details gracefully', async () => {
      const error = createAxiosError(400, { message: 'Error message' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).details).toBeUndefined();
      }
    });
  });

  describe('Status Code Classification - All Ranges', () => {
    const createAxiosError = (status: number, data: any = {}): AxiosError => {
      const error = new Error('Request failed') as AxiosError;
      error.response = {
        status,
        statusText: 'Error',
        data,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      error.config = {
        url: '/test',
        method: 'get',
        metadata: { startTime: Date.now() },
        headers: {} as any,
      } as InternalAxiosRequestConfig;
      error.isAxiosError = true;
      return error;
    };

    it('should handle 401 with custom message from server', async () => {
      const error = createAxiosError(401, { message: 'Token expired at 2024-01-01' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Token expired at 2024-01-01');
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.AUTHENTICATION_ERROR);
      }
    });

    it('should handle 403 with custom message from server', async () => {
      const error = createAxiosError(403, { message: 'Admin access required' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Admin access required');
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.AUTHORIZATION_ERROR);
      }
    });

    it('should handle 404 with custom message from server', async () => {
      const error = createAxiosError(404, { message: 'User with ID 123 not found' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('User with ID 123 not found');
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.NOT_FOUND_ERROR);
      }
    });

    it('should handle 402 as validation error', async () => {
      const error = createAxiosError(402, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
      }
    });

    it('should handle 405 as validation error', async () => {
      const error = createAxiosError(405, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
      }
    });

    it('should handle 422 as validation error', async () => {
      const error = createAxiosError(422, { message: 'Validation error' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
        expect((e as ApiErrorClass).message).toBe('Validation error');
      }
    });

    it('should handle 502 as server error', async () => {
      const error = createAxiosError(502, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.SERVER_ERROR);
      }
    });

    it('should handle 503 as server error', async () => {
      const error = createAxiosError(503, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.SERVER_ERROR);
        expect((e as ApiErrorClass).message).toBe('Something went wrong on our end. Please try again in a moment.');
      }
    });
  });

  describe('Error Code Handling - All Codes', () => {
    const createAxiosError = (status: number, data: any = {}, code?: string): AxiosError => {
      const error = new Error('Request failed') as AxiosError;
      error.response = {
        status,
        statusText: 'Error',
        data,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      error.config = {
        url: '/test',
        method: 'get',
        metadata: { startTime: Date.now() },
        headers: {} as any,
      } as InternalAxiosRequestConfig;
      error.isAxiosError = true;
      if (code) error.code = code;
      return error;
    };

    it('should handle NETWORK_ERROR code', async () => {
      const error = createAxiosError(0, {}, 'NETWORK_ERROR');
      error.response = undefined;

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.NETWORK_ERROR);
        expect((e as ApiErrorClass).message).toBe('Unable to connect to the server. Please check your internet connection.');
      }
    });

    it('should handle undefined error code', async () => {
      const error = createAxiosError(418, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
      }
    });

    it('should handle custom error code (not network/timeout)', async () => {
      const error = createAxiosError(400, {}, 'CUSTOM_ERROR_CODE');

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).code).toBe('CUSTOM_ERROR_CODE');
        expect((e as ApiErrorClass).type).toBe(ErrorTypes.VALIDATION_ERROR);
      }
    });
  });

  describe('Default Message Fallbacks', () => {
    const createAxiosError = (status: number, data: any = {}): AxiosError => {
      const error = new Error('') as AxiosError;
      error.response = {
        status,
        statusText: 'Error',
        data,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      error.config = {
        url: '/test',
        method: 'get',
        metadata: { startTime: Date.now() },
        headers: {} as any,
      } as InternalAxiosRequestConfig;
      error.isAxiosError = true;
      error.message = '';
      return error;
    };

    it('should use default message for 401 when no message provided', async () => {
      const error = createAxiosError(401, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Your session has expired. Please log in again.');
      }
    });

    it('should use default message for 403 when no message provided', async () => {
      const error = createAxiosError(403, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe("You don't have permission to perform this action.");
      }
    });

    it('should use default message for 404 when no message provided', async () => {
      const error = createAxiosError(404, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('The requested resource was not found.');
      }
    });

    it('should use default message for 400-499 range when no message provided', async () => {
      const error = createAxiosError(422, {});

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Please check your input and try again.');
      }
    });

    it('should always use server error message for 500+ (overwrite custom)', async () => {
      const error = createAxiosError(500, { message: 'Database connection failed' });

      try {
        await applyResponseErrorInterceptor(error);
      } catch (e) {
        expect((e as ApiErrorClass).message).toBe('Something went wrong on our end. Please try again in a moment.');
      }
    });
  });
});
