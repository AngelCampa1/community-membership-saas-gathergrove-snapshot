/**
 * Logger Tests - Sentry Integration
 * TDD Approach: Tests written FIRST before implementation
 *
 * Verifies that the logger integrates with Sentry for:
 * - Event tracking via addBreadcrumb
 * - Error/exception tracking via captureException
 * - Graceful error handling
 */

import { logger } from '../logger';

// Mock Sentry
jest.mock('@sentry/react-native');

import * as Sentry from '@sentry/react-native';
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;
const mockWithScope = Sentry.withScope as jest.Mock;

describe('Logger - Sentry Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default withScope mock — invoke the callback immediately
    mockWithScope.mockImplementation((cb: (scope: unknown) => void) => {
      cb({ setContext: jest.fn() });
    });

    // Mock __DEV__ to false for production behavior
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    // Restore __DEV__
    (global as any).__DEV__ = true;
  });

  describe('Event Tracking', () => {
    it('should track info events with category and message via addBreadcrumb', () => {
      logger.info('auth', 'User logged in', { userId: '123', clubId: '456' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'auth',
          message: 'User logged in',
          data: expect.objectContaining({
            userId: '123',
            clubId: '456',
          }),
        })
      );
    });

    it('should track warning events with category prefix and warning level', () => {
      logger.warn('network', 'Slow API response', { endpoint: '/api/members' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'network',
          message: 'Slow API response',
          data: expect.objectContaining({
            endpoint: '/api/members',
            level: 'warning',
          }),
        })
      );
    });

    it('should track performance events with duration', () => {
      logger.performance('API.GetMembers', 1500, { count: 50 });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: 'API.GetMembers',
          data: expect.objectContaining({
            duration: 1500,
            count: 50,
          }),
        })
      );
    });

    it('should track network errors (status >= 400)', () => {
      logger.network('GET', '/api/events', 404, 250, { retry: 1 });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'network',
          message: 'GET /api/events',
          data: expect.objectContaining({
            status: 404,
            duration: 250,
            retry: 1,
          }),
        })
      );
    });

    it('should not track successful network requests (status < 400)', () => {
      logger.network('GET', '/api/events', 200, 150);

      expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('Error Tracking', () => {
    it('should track errors via withScope and captureException', () => {
      const error = new Error('Network timeout');
      logger.error('network', 'API request failed', error, {
        endpoint: '/api/members',
        method: 'GET',
      });

      expect(mockWithScope).toHaveBeenCalled();
      expect(mockCaptureException).toHaveBeenCalled();
    });

    it('should pass the error object to captureException', () => {
      const error = new Error('Auth failure');
      logger.error('auth', 'Login failed', error);

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Auth failure' })
      );
    });

    it('should handle non-Error objects in error tracking', () => {
      logger.error('app', 'Unknown error occurred', { code: 'UNKNOWN', details: 'Something went wrong' });

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('UNKNOWN'),
        })
      );
    });

    it('should include error stack trace when available', () => {
      const error = new Error('Test error');
      logger.error('auth', 'Login failed', error);

      const exceptionArg = mockCaptureException.mock.calls[0][0];
      expect(exceptionArg).toHaveProperty('stack');
    });
  });

  describe('Development Mode Behavior', () => {
    beforeEach(() => {
      // Enable dev mode
      (global as any).__DEV__ = true;
      mockAddBreadcrumb.mockClear();
      mockCaptureException.mockClear();
    });

    it('should not send events to Sentry in development', () => {
      logger.info('app', 'Test event');

      expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    });

    it('should not send errors to Sentry in development', () => {
      logger.error('app', 'Test error', new Error('Dev error'));

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should still call console methods in development', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.info('app', 'Info message');
      logger.error('app', 'Error message', new Error('Test'));

      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should call console.debug for debug logs in development', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

      logger.debug('app', 'Debug message', { testData: 'value' });

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] [app] Debug message',
        expect.objectContaining({ testData: 'value' })
      );

      consoleDebugSpy.mockRestore();
    });

    it('should call console.warn for warning logs in development', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('security', 'Security warning', { threat: 'low' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] [security] Security warning',
        expect.objectContaining({ threat: 'low' })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should call console.log for performance logs in development', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.performance('API.GetMembers', 1500, { count: 50 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PERF] API.GetMembers: 1500ms',
        expect.objectContaining({ count: 50 })
      );

      consoleLogSpy.mockRestore();
    });

    it('should call console.log for successful network requests in development', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.network('GET', '/api/events', 200, 150);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NETWORK] GET /api/events',
        expect.objectContaining({ status: 200, duration: 150 })
      );

      consoleLogSpy.mockRestore();
    });

    it('should call console.error for failed network requests in development', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.network('POST', '/api/events', 500, 200);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[NETWORK] POST /api/events',
        expect.objectContaining({ status: 500, duration: 200 })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not crash when addBreadcrumb fails in production', () => {
      (global as any).__DEV__ = false;
      mockAddBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      expect(() => logger.info('app', 'Test event')).not.toThrow();
    });

    it('should not crash when captureException fails in production', () => {
      (global as any).__DEV__ = false;
      mockWithScope.mockImplementationOnce(() => {
        throw new Error('Exception tracking failed');
      });

      expect(() => {
        logger.error('app', 'Test error', new Error('Test'));
      }).not.toThrow();
    });
  });

  describe('Error Resilience', () => {
    it('should not crash if Sentry addBreadcrumb throws an error', () => {
      mockAddBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      expect(() => {
        logger.info('app', 'Test event');
      }).not.toThrow();
    });

    it('should not crash if Sentry withScope throws an error', () => {
      mockWithScope.mockImplementationOnce(() => {
        throw new Error('Exception tracking failed');
      });

      expect(() => {
        logger.error('app', 'Test error', new Error('Test'));
      }).not.toThrow();
    });
  });

  describe('Context Propagation', () => {
    it('should include all context properties in tracked events', () => {
      logger.info('events', 'Event created', {
        eventId: 'evt-123',
        clubId: 'club-456',
        userId: 'user-789',
        eventName: 'Monthly Meeting',
        attendeeCount: 25,
      });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'events',
          message: 'Event created',
          data: expect.objectContaining({
            eventId: 'evt-123',
            clubId: 'club-456',
            userId: 'user-789',
            eventName: 'Monthly Meeting',
            attendeeCount: 25,
          }),
        })
      );
    });

    it('should merge context with additional properties for warnings', () => {
      logger.warn('performance', 'Slow operation', {
        operation: 'loadMembers',
        duration: 3000,
      });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: 'Slow operation',
          data: expect.objectContaining({
            operation: 'loadMembers',
            duration: 3000,
            level: 'warning',
          }),
        })
      );
    });
  });

  describe('Category Handling', () => {
    const categories: Array<'app' | 'auth' | 'events' | 'members' | 'notifications' | 'performance' | 'security' | 'ui' | 'network' | 'sso'> = [
      'app',
      'auth',
      'events',
      'members',
      'notifications',
      'performance',
      'security',
      'ui',
      'network',
      'sso',
    ];

    it('should support all defined categories', () => {
      categories.forEach((category) => {
        mockAddBreadcrumb.mockClear();
        logger.info(category, 'Test message');

        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({ category, message: 'Test message' })
        );
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should track complete error scenario with context', () => {
      const error = new Error('Authentication failed');
      error.stack = 'Error: Authentication failed\n    at login (auth.ts:123)';

      logger.error('auth', 'User login attempt failed', error, {
        userId: 'user-123',
        email: 'test@example.com',
        attemptNumber: 3,
        ipAddress: '192.168.1.1',
      });

      expect(mockWithScope).toHaveBeenCalled();
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        })
      );
    });

    it('should track failed network requests', () => {
      logger.network('POST', '/api/events', 500, 1200, {
        eventId: 'evt-123',
        size: '2.5KB',
      });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'network',
          message: 'POST /api/events',
          data: expect.objectContaining({
            status: 500,
            duration: 1200,
            eventId: 'evt-123',
            size: '2.5KB',
          }),
        })
      );
    });
  });
});
