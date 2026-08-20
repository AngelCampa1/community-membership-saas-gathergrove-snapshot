/**
 * Tests for logger.ts - Centralized logging service
 * Following boundary mocking pattern: mock only window/process.env
 * @jest-environment jsdom
 */

describe('Logger', () => {
  let originalEnv: string | undefined;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleGroupSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
  });

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv;

    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();

    // Clear module cache to get fresh logger instance
    jest.resetModules();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    describe('debug()', () => {
      it('logs debug message without category', () => {
        const { logger } = require('../logger');
        logger.debug('Test debug message');

        expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
      });

      it('logs debug message with context', () => {
        const { logger } = require('../logger');
        const context = { userId: 123, action: 'test' };
        logger.debug('Test debug message', context);

        expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', context);
      });

      it('logs debug message with category', () => {
        const { logger } = require('../logger');
        logger.debug('AUTH', 'User logged in');

        expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] [AUTH] User logged in', '');
      });

      it('logs debug message with category and context', () => {
        const { logger } = require('../logger');
        const context = { userId: 123 };
        logger.debug('AUTH', 'User logged in', context);

        expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] [AUTH] User logged in', context);
      });
    });

    describe('info()', () => {
      it('logs info message without category', () => {
        const { logger } = require('../logger');
        logger.info('Test info message');

        expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test info message', '');
      });

      it('logs info message with context', () => {
        const { logger } = require('../logger');
        const context = { component: 'Dashboard' };
        logger.info('Dashboard loaded', context);

        expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Dashboard loaded', context);
      });

      it('logs info message with category', () => {
        const { logger } = require('../logger');
        logger.info('EVENTS', 'Event created');

        expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] [EVENTS] Event created', '');
      });

      it('logs info message with category and context', () => {
        const { logger } = require('../logger');
        const context = { eventId: 456 };
        logger.info('EVENTS', 'Event created', context);

        expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] [EVENTS] Event created', context);
      });
    });

    describe('warn()', () => {
      it('logs warning message without category', () => {
        const { logger } = require('../logger');
        logger.warn('Test warning');

        expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Test warning', '');
      });

      it('logs warning message with context', () => {
        const { logger } = require('../logger');
        const context = { reason: 'rate limit' };
        logger.warn('API rate limit approaching', context);

        expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] API rate limit approaching', context);
      });

      it('logs warning message with category', () => {
        const { logger } = require('../logger');
        logger.warn('PAYMENT', 'Payment pending');

        expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] [PAYMENT] Payment pending', '');
      });

      it('logs warning message with category and context', () => {
        const { logger } = require('../logger');
        const context = { paymentId: 789 };
        logger.warn('PAYMENT', 'Payment pending', context);

        expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] [PAYMENT] Payment pending', context);
      });
    });

    describe('error()', () => {
      it('logs error message only', () => {
        const { logger } = require('../logger');
        logger.error('Test error');

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error', '');
      });

      it('logs error message with Error object', () => {
        const { logger } = require('../logger');
        const error = new Error('Something went wrong');
        logger.error('Test error', error);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error', error, '');
      });

      it('logs error message with context', () => {
        const { logger } = require('../logger');
        const context = { userId: 123 };
        logger.error('Test error', context);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error', context);
      });

      it('logs error message with Error and context', () => {
        const { logger } = require('../logger');
        const error = new Error('Failed');
        const context = { operation: 'save' };
        logger.error('Test error', error, context);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error', error, context);
      });

      it('logs error with category and message', () => {
        const { logger } = require('../logger');
        logger.error('DATABASE', 'Connection failed');

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [DATABASE] Connection failed', '');
      });

      it('logs error with category, message, and context', () => {
        const { logger } = require('../logger');
        const context = { host: 'localhost' };
        logger.error('DATABASE', 'Connection failed', context);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [DATABASE] Connection failed', context);
      });

      it('logs error with category, message, and Error object', () => {
        const { logger } = require('../logger');
        const error = new Error('Timeout');
        logger.error('DATABASE', 'Connection failed', error);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [DATABASE] Connection failed', error, '');
      });

      it('handles error-like object with message and stack', () => {
        const { logger } = require('../logger');
        const errorLike = { message: 'Custom error', stack: 'stack trace' };
        logger.error('Test error', errorLike);

        // Should convert error-like object to Error
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    describe('performance()', () => {
      it('logs performance metric in development', () => {
        const { logger } = require('../logger');
        logger.performance('api-call', 150);

        expect(consoleLogSpy).toHaveBeenCalledWith('[PERF] api-call: 150ms', '');
      });

      it('logs performance metric with context', () => {
        const { logger } = require('../logger');
        const context = { endpoint: '/api/events' };
        logger.performance('api-call', 150, context);

        expect(consoleLogSpy).toHaveBeenCalledWith('[PERF] api-call: 150ms', context);
      });
    });

    describe('event()', () => {
      it('logs event without properties', () => {
        const { logger } = require('../logger');
        logger.event('button-click');

        expect(consoleLogSpy).toHaveBeenCalledWith('[EVENT] button-click', '');
      });

      it('logs event with properties', () => {
        const { logger } = require('../logger');
        const properties = { buttonId: 'submit', page: 'checkout' };
        logger.event('button-click', properties);

        expect(consoleLogSpy).toHaveBeenCalledWith('[EVENT] button-click', properties);
      });
    });

    describe('pageView()', () => {
      it('logs page view with just name', () => {
        const { logger } = require('../logger');
        logger.pageView('Dashboard');

        expect(consoleLogSpy).toHaveBeenCalledWith('[PAGEVIEW] Dashboard', undefined, '');
      });

      it('logs page view with name and URL', () => {
        const { logger } = require('../logger');
        logger.pageView('Dashboard', '/admin/dashboard');

        expect(consoleLogSpy).toHaveBeenCalledWith('[PAGEVIEW] Dashboard', '/admin/dashboard', '');
      });

      it('logs page view with all properties', () => {
        const { logger } = require('../logger');
        const properties = { referrer: '/home' };
        logger.pageView('Dashboard', '/admin/dashboard', properties);

        expect(consoleLogSpy).toHaveBeenCalledWith('[PAGEVIEW] Dashboard', '/admin/dashboard', properties);
      });
    });

    describe('startTimer()', () => {
      it('measures elapsed time and logs performance', () => {
        const { logger } = require('../logger');
        const performanceSpy = jest.spyOn(logger, 'performance');

        const stopTimer = logger.startTimer('operation');
        stopTimer();

        expect(performanceSpy).toHaveBeenCalledWith('operation', expect.any(Number));
        performanceSpy.mockRestore();
      });
    });

    describe('group()', () => {
      it('groups logs together in development', () => {
        const { logger } = require('../logger');
        const callback = jest.fn();

        logger.group('Test Group', callback);

        expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
        expect(callback).toHaveBeenCalled();
        expect(consoleGroupEndSpy).toHaveBeenCalled();
      });
    });

    describe('api()', () => {
      it('logs API call with method and URL only', () => {
        const { logger } = require('../logger');
        logger.api('GET', '/api/events');

        expect(consoleLogSpy).toHaveBeenCalledWith('[API] GET /api/events', '');
      });

      it('logs API call with status code', () => {
        const { logger } = require('../logger');
        logger.api('GET', '/api/events', 200);

        expect(consoleLogSpy).toHaveBeenCalledWith('[API] GET /api/events [200]', '');
      });

      it('logs API call with duration', () => {
        const { logger } = require('../logger');
        logger.api('GET', '/api/events', 200, 150);

        expect(consoleLogSpy).toHaveBeenCalledWith('[API] GET /api/events [200] (150ms)', '');
      });

      it('logs API call with all parameters', () => {
        const { logger } = require('../logger');
        const context = { cacheHit: false };
        logger.api('GET', '/api/events', 200, 150, context);

        expect(consoleLogSpy).toHaveBeenCalledWith('[API] GET /api/events [200] (150ms)', context);
      });

      it('logs failed API call with error console', () => {
        const { logger } = require('../logger');
        logger.api('POST', '/api/events', 500);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[API] POST /api/events [500]', '');
      });

      it('logs API call with 4xx status as error', () => {
        const { logger } = require('../logger');
        logger.api('GET', '/api/events', 404);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[API] GET /api/events [404]', '');
      });
    });

    describe('flush()', () => {
      it('does nothing in development environment', () => {
        const { logger } = require('../logger');
        // Should not throw
        expect(() => logger.flush()).not.toThrow();
      });
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    describe('info()', () => {
      it('sends info breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.info('Test info');

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'info',
            message: 'Test info',
            level: 'info',
          })
        );
      });

      it('sends info breadcrumb with category', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const context = { userId: 123 };
        logger.info('EVENTS', 'Event created', context);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'info',
            message: '[EVENTS] Event created',
            data: context,
            level: 'info',
          })
        );
      });
    });

    describe('warn()', () => {
      it('sends warning breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.warn('Test warning');

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'warning',
            message: 'Test warning',
            level: 'warning',
          })
        );
      });

      it('sends warning breadcrumb with category and context', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const context = { severity: 'medium' };
        logger.warn('PAYMENT', 'Payment delayed', context);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'warning',
            message: '[PAYMENT] Payment delayed',
            data: context,
            level: 'warning',
          })
        );
      });
    });

    describe('error()', () => {
      it('captures exception in Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.error('Test error');

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({ extra: expect.objectContaining({ message: 'Test error' }) })
        );
      });

      it('captures provided Error object in Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const error = new Error('Something failed');
        logger.error('Test error', error);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({ extra: expect.objectContaining({ message: 'Test error' }) })
        );
      });

      it('captures error with category context in Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const context = { operation: 'delete' };
        logger.error('DATABASE', 'Delete failed', context);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            extra: expect.objectContaining({
              message: '[DATABASE] Delete failed',
              category: 'DATABASE',
            }),
          })
        );
      });
    });

    describe('performance()', () => {
      it('sends performance breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.performance('api-call', 200);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'performance',
            message: 'api-call',
            data: expect.objectContaining({ duration: 200 }),
            level: 'info',
          })
        );
      });

      it('sends performance breadcrumb with context', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const context = { endpoint: '/api/events' };
        logger.performance('api-call', 200, context);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'performance',
            message: 'api-call',
            data: expect.objectContaining({ duration: 200, endpoint: '/api/events' }),
          })
        );
      });
    });

    describe('event()', () => {
      it('sends event breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.event('button-click');

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'event',
            message: 'button-click',
            level: 'info',
          })
        );
      });

      it('sends event breadcrumb with properties', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const properties = { buttonId: 'submit' };
        logger.event('button-click', properties);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'event',
            message: 'button-click',
            data: properties,
          })
        );
      });
    });

    describe('pageView()', () => {
      it('sends navigation breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.pageView('Dashboard', '/admin/dashboard');

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'navigation',
            message: 'Dashboard',
            data: expect.objectContaining({ url: '/admin/dashboard' }),
            level: 'info',
          })
        );
      });

      it('sends navigation breadcrumb with extra properties', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        const properties = { referrer: '/home' };
        logger.pageView('Dashboard', '/admin/dashboard', properties);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'navigation',
            message: 'Dashboard',
            data: expect.objectContaining({ url: '/admin/dashboard', referrer: '/home' }),
          })
        );
      });
    });

    describe('api()', () => {
      it('sends successful API breadcrumb to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.api('GET', '/api/events', 200, 150);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'http',
            data: expect.objectContaining({
              url: '/api/events',
              method: 'GET',
              status_code: 200,
              duration: 150,
            }),
            level: 'info',
          })
        );
      });

      it('sends failed API breadcrumb with error level to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.api('POST', '/api/events', 500, 250);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'http',
            data: expect.objectContaining({ status_code: 500 }),
            level: 'error',
          })
        );
      });

      it('sends 4xx API breadcrumb with error level to Sentry', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.api('GET', '/api/events', 404);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({ level: 'error' })
        );
      });
    });

    describe('flush()', () => {
      it('calls Sentry.flush in production', async () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        await logger.flush();

        expect(Sentry.flush).toHaveBeenCalledWith(2000);
      });

      it('accepts a custom timeout', async () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        await logger.flush(5000);

        expect(Sentry.flush).toHaveBeenCalledWith(5000);
      });

      it('does not throw if Sentry.flush throws', async () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        Sentry.flush.mockRejectedValueOnce(new Error('flush failed'));

        await expect(logger.flush()).resolves.not.toThrow();
      });
    });

    describe('api() edge cases', () => {
      it('sends API breadcrumb without status code', () => {
        const { logger } = require('../logger');
        const Sentry = require('@sentry/nextjs');
        logger.api('GET', '/api/events');

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'http',
            data: expect.objectContaining({
              url: '/api/events',
              method: 'GET',
              status_code: undefined,
            }),
            level: 'info',
          })
        );
      });
    });

    describe('group()', () => {
      it('executes callback without console grouping in production', () => {
        const { logger } = require('../logger');
        const callback = jest.fn();

        logger.group('Test Group', callback);

        expect(callback).toHaveBeenCalled();
        expect(consoleGroupSpy).not.toHaveBeenCalled();
        expect(consoleGroupEndSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Graceful Degradation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('does not throw when Sentry.addBreadcrumb throws', () => {
      const Sentry = require('@sentry/nextjs');
      Sentry.addBreadcrumb.mockImplementationOnce(() => {
        throw new Error('Sentry unavailable');
      });

      const { logger } = require('../logger');
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.event('test')).not.toThrow();
      expect(() => logger.pageView('test')).not.toThrow();
      expect(() => logger.performance('test', 100)).not.toThrow();
      expect(() => logger.api('GET', '/test', 200, 50)).not.toThrow();
    });

    it('does not throw when Sentry.captureException throws', () => {
      const Sentry = require('@sentry/nextjs');
      Sentry.captureException.mockImplementationOnce(() => {
        throw new Error('Sentry unavailable');
      });

      const { logger } = require('../logger');
      expect(() => logger.error('something broke')).not.toThrow();
    });
  });
});
