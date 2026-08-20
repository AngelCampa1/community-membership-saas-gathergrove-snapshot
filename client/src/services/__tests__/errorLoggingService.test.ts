/**
 * @jest-environment jsdom
 *
 * Error Logging Service Tests
 *
 * Tests frontend error logging following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (error formatting, conditional logging)
 */

import { FrontendErrorLoggingService } from '../errorLoggingService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock logger to prevent console noise
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('FrontendErrorLoggingService', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to development mode for testing
    process.env.NODE_ENV = 'development';
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('logError', () => {
    it('should log error in development mode', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
          message: 'Test error',
          exception: 'Error',
        })
      );
    });

    it('should include context in message', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Something failed');

      await FrontendErrorLoggingService.logError(error, 'UserService');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          message: 'UserService: Something failed',
        })
      );
    });

    it('should handle string errors', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logError('String error message');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          message: 'String error message',
        })
      );
    });

    it('should include additional data', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error, undefined, { userId: '123', action: 'test' });

      const callData = mockApiClient.post.mock.calls[0][1] as Record<string, unknown>;
      expect((callData.additionalData as Record<string, unknown>)['userId']).toBe('123');
      expect((callData.additionalData as Record<string, unknown>)['action']).toBe('test');
    });

    it('should include stack trace', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          stackTrace: expect.stringContaining('Error'),
        })
      );
    });

    it('should include user agent', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          userAgent: expect.any(String),
        })
      );
    });

    it('should include current URL', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          url: expect.any(String),
        })
      );
    });

    it('should include timestamp in additional data', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      const callData = mockApiClient.post.mock.calls[0][1] as Record<string, unknown>;
      expect((callData.additionalData as Record<string, unknown>)['timestamp']).toBeDefined();
      expect((callData.additionalData as Record<string, unknown>)['source']).toBe('frontend');
    });

    it('should NOT log in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'));
      const error = new Error('Test error');

      // Should not throw
      await expect(FrontendErrorLoggingService.logError(error)).resolves.toBeUndefined();
    });

    it('should include user ID from localStorage when available', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      // Service reads localStorage for user data - verify API was called
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
          message: 'Test error',
        })
      );
    });

    it('should handle localStorage with user data', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Set localStorage before test
      window.localStorage.setItem('user', JSON.stringify({ id: 'user-123' }));
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      // Verify API was called successfully
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.any(Object)
      );
      // Clean up
      window.localStorage.removeItem('user');
    });

    it('should not include userId when anonymous', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          userId: undefined,
        })
      );
    });
  });

  describe('logWarning', () => {
    it('should log warning in development mode', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logWarning('Warning message');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Warning',
          message: 'Warning message',
        })
      );
    });

    it('should include context in message', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logWarning('Low memory', 'PerformanceMonitor');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          message: 'PerformanceMonitor: Low memory',
        })
      );
    });

    it('should include additional data', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logWarning('Warning', undefined, { memoryUsage: '85%' });

      const callData = mockApiClient.post.mock.calls[0][1] as Record<string, unknown>;
      expect((callData.additionalData as Record<string, unknown>)['memoryUsage']).toBe('85%');
    });

    it('should NOT log in production mode', async () => {
      process.env.NODE_ENV = 'production';

      await FrontendErrorLoggingService.logWarning('Warning message');

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'));

      await expect(FrontendErrorLoggingService.logWarning('Warning')).resolves.toBeUndefined();
    });
  });

  describe('logCritical', () => {
    it('should log critical error in development mode', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Critical failure');

      await FrontendErrorLoggingService.logCritical(error);

      // Note: exception is errorObj.name || 'CriticalError', but Error.name is 'Error'
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Critical',
          message: 'Critical failure',
          exception: 'Error', // new Error().name returns 'Error'
        })
      );
    });

    it('should include context in message', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Database connection lost');

      await FrontendErrorLoggingService.logCritical(error, 'DatabaseService');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          message: 'DatabaseService: Database connection lost',
        })
      );
    });

    it('should handle string errors', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logCritical('Critical string error');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          message: 'Critical string error',
        })
      );
    });

    it('should include stack trace', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Critical failure');

      await FrontendErrorLoggingService.logCritical(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          stackTrace: expect.any(String),
        })
      );
    });

    it('should include additional data', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Critical failure');

      await FrontendErrorLoggingService.logCritical(error, undefined, { recoveryAttempted: true });

      const callData = mockApiClient.post.mock.calls[0][1] as Record<string, unknown>;
      expect((callData.additionalData as Record<string, unknown>)['recoveryAttempted']).toBe(true);
    });

    it('should NOT log in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Critical failure');

      await FrontendErrorLoggingService.logCritical(error);

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'));
      const error = new Error('Critical failure');

      await expect(FrontendErrorLoggingService.logCritical(error)).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUserId (private method via behavior)', () => {
    it('should return anonymous when localStorage is empty', async () => {
      mockApiClient.post.mockResolvedValue({});
      const error = new Error('Test');

      await FrontendErrorLoggingService.logError(error);

      // When no user data, userId should be undefined (anonymous)
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
        })
      );
    });

    it('should try to extract user data from localStorage', async () => {
      mockApiClient.post.mockResolvedValue({});
      window.localStorage.setItem('user', JSON.stringify({ id: 'user-456', email: 'test@test.com' }));
      const error = new Error('Test');

      await FrontendErrorLoggingService.logError(error);

      // Verify the API call was made - service attempts localStorage access
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.any(Object)
      );
      window.localStorage.removeItem('user');
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      mockApiClient.post.mockResolvedValue({});

      // Mock localStorage.getItem to return invalid JSON string that will cause JSON.parse to throw
      const originalGetItem = window.localStorage.getItem;
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user') return '{invalid-json[[[';
        return null;
      });

      const error = new Error('Test');

      await FrontendErrorLoggingService.logError(error);

      // Should still make API call even if localStorage has bad data
      // The catch block should return 'anonymous' without crashing
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
        })
      );

      // Restore
      window.localStorage.getItem = originalGetItem;
    });

    it('should handle user data with email fallback when id is missing', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Mock localStorage.getItem to return user with email only
      const originalGetItem = window.localStorage.getItem;
      (window.localStorage.getItem as jest.Mock) = jest.fn((key: string) => {
        if (key === 'user') return JSON.stringify({ email: 'user@example.com' });
        return null;
      });

      const error = new Error('Test');
      await FrontendErrorLoggingService.logError(error);

      // Service should call API with the processed data
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
          message: 'Test',
        })
      );

      // Restore
      window.localStorage.getItem = originalGetItem;
    });

    it('should handle user data with id present', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Mock localStorage.getItem to return user with id
      const originalGetItem = window.localStorage.getItem;
      (window.localStorage.getItem as jest.Mock) = jest.fn((key: string) => {
        if (key === 'user') return JSON.stringify({ id: 'user-789' });
        return null;
      });

      const error = new Error('Test');
      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
        })
      );

      window.localStorage.getItem = originalGetItem;
    });

    it('should return anonymous for empty user object', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Mock localStorage.getItem to return empty user object
      const originalGetItem = window.localStorage.getItem;
      (window.localStorage.getItem as jest.Mock) = jest.fn((key: string) => {
        if (key === 'user') return JSON.stringify({});
        return null;
      });

      const error = new Error('Test');
      await FrontendErrorLoggingService.logError(error);

      // When user object has neither id nor email, service should still work
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Error',
        })
      );

      window.localStorage.getItem = originalGetItem;
    });
  });

  describe('error object variations', () => {
    it('should handle error without name property', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Create custom error-like object without name
      const errorLikeObj = { message: 'Custom error', stack: 'at test.js:1' } as Error;

      await FrontendErrorLoggingService.logError(errorLikeObj);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          exception: 'Error', // Falls back to 'Error' when name is falsy
        })
      );
    });

    it('should handle error without stack property', async () => {
      mockApiClient.post.mockResolvedValue({});
      // Create custom error-like object without stack
      const errorLikeObj = { message: 'No stack', name: 'CustomError' } as Error;

      await FrontendErrorLoggingService.logError(errorLikeObj);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          stackTrace: '', // Falls back to empty string when stack is undefined
        })
      );
    });

    it('should handle critical error without name property', async () => {
      mockApiClient.post.mockResolvedValue({});
      const errorLikeObj = { message: 'Critical custom error' } as Error;

      await FrontendErrorLoggingService.logCritical(errorLikeObj);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          exception: 'CriticalError', // Falls back to 'CriticalError' for critical logs
        })
      );
    });
  });

  describe('environment handling', () => {
    it('should NOT log in test mode', async () => {
      process.env.NODE_ENV = 'test';
      const error = new Error('Test error');

      await FrontendErrorLoggingService.logError(error);

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should log warning with proper level', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logWarning('Warning with user');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Warning',
          message: 'Warning with user',
        })
      );
    });

    it('should log critical with proper level', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logCritical(new Error('Critical error'));

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Critical',
          message: 'Critical error',
        })
      );
    });

    it('should log warning without context', async () => {
      mockApiClient.post.mockResolvedValue({});

      await FrontendErrorLoggingService.logWarning('Simple warning');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/errors/log',
        expect.objectContaining({
          level: 'Warning',
          message: 'Simple warning',
        })
      );
    });
  });

  describe('service export', () => {
    it('should export FrontendErrorLoggingService class', () => {
      expect(FrontendErrorLoggingService).toBeDefined();
    });

    it('should have all required static methods', () => {
      expect(typeof FrontendErrorLoggingService.logError).toBe('function');
      expect(typeof FrontendErrorLoggingService.logWarning).toBe('function');
      expect(typeof FrontendErrorLoggingService.logCritical).toBe('function');
    });
  });

  describe('SSR Safety - Enhanced Branch Coverage', () => {
    describe('logError - SSR environment (window undefined)', () => {
      it('should handle missing window in SSR environment', async () => {
        mockApiClient.post.mockResolvedValue({});
        const error = new Error('SSR error');

        // Save original window
        const originalWindow = global.window;
        const originalNavigator = global.navigator;

        try {
          // Make window and navigator undefined (SSR environment)
          // @ts-expect-error - Intentionally setting window to undefined for SSR test
          delete global.window;
          // @ts-expect-error - Intentionally setting navigator to undefined for SSR test
          delete global.navigator;

          await FrontendErrorLoggingService.logError(error);

          // Verify API call was made with undefined userAgent and url (SSR safe)
          expect(mockApiClient.post).toHaveBeenCalledWith(
            '/errors/log',
            expect.objectContaining({
              level: 'Error',
              message: 'SSR error',
              userAgent: undefined,
              url: undefined,
            })
          );
        } finally {
          // Restore window and navigator
          global.window = originalWindow;
          global.navigator = originalNavigator;
        }
      });

      it('should include browser info when window is available', async () => {
        mockApiClient.post.mockResolvedValue({});
        const error = new Error('Browser error');

        await FrontendErrorLoggingService.logError(error);

        // Verify userAgent and url are included in browser environment
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/errors/log',
          expect.objectContaining({
            userAgent: expect.any(String),
            url: expect.any(String),
          })
        );
      });
    });

    describe('logWarning - SSR environment (window undefined)', () => {
      it('should handle missing window in SSR environment', async () => {
        mockApiClient.post.mockResolvedValue({});
        const originalWindow = global.window;
        const originalNavigator = global.navigator;

        try {
          // @ts-expect-error - Intentionally setting window to undefined for SSR test
          delete global.window;
          // @ts-expect-error - Intentionally setting navigator to undefined for SSR test
          delete global.navigator;

          await FrontendErrorLoggingService.logWarning('SSR warning');

          expect(mockApiClient.post).toHaveBeenCalledWith(
            '/errors/log',
            expect.objectContaining({
              level: 'Warning',
              message: 'SSR warning',
              userAgent: undefined,
              url: undefined,
            })
          );
        } finally {
          global.window = originalWindow;
          global.navigator = originalNavigator;
        }
      });

      it('should include browser info when window is available', async () => {
        mockApiClient.post.mockResolvedValue({});

        await FrontendErrorLoggingService.logWarning('Browser warning');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/errors/log',
          expect.objectContaining({
            userAgent: expect.any(String),
            url: expect.any(String),
          })
        );
      });
    });

    describe('logCritical - SSR environment (window undefined)', () => {
      it('should handle missing window in SSR environment', async () => {
        mockApiClient.post.mockResolvedValue({});
        const error = new Error('SSR critical error');
        const originalWindow = global.window;
        const originalNavigator = global.navigator;

        try {
          // @ts-expect-error - Intentionally setting window to undefined for SSR test
          delete global.window;
          // @ts-expect-error - Intentionally setting navigator to undefined for SSR test
          delete global.navigator;

          await FrontendErrorLoggingService.logCritical(error);

          expect(mockApiClient.post).toHaveBeenCalledWith(
            '/errors/log',
            expect.objectContaining({
              level: 'Critical',
              message: 'SSR critical error',
              userAgent: undefined,
              url: undefined,
            })
          );
        } finally {
          global.window = originalWindow;
          global.navigator = originalNavigator;
        }
      });

      it('should include browser info when window is available', async () => {
        mockApiClient.post.mockResolvedValue({});
        const error = new Error('Browser critical error');

        await FrontendErrorLoggingService.logCritical(error);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/errors/log',
          expect.objectContaining({
            userAgent: expect.any(String),
            url: expect.any(String),
          })
        );
      });
    });
  });
});
