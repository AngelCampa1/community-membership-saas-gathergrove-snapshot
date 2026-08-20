/**
 * ErrorHandler Tests - Full Coverage
 *
 * Target: 100% coverage on errorHandler.ts
 */

import { ErrorHandler } from '../errorHandler';
import { logger } from '@/lib/logger';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should handle Error object with context', () => {
      const error = new Error('Test error message');
      const context = 'TestContext';

      ErrorHandler.handle(error, context);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler: TestContext',
        expect.objectContaining({
          message: 'Test error message',
          error: expect.objectContaining({
            message: 'Test error message',
            stack: expect.any(String),
          }),
          context: 'TestContext',
        })
      );
    });

    it('should handle Error object without context', () => {
      const error = new Error('Another test error');

      ErrorHandler.handle(error);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler: Error',
        expect.objectContaining({
          message: 'Another test error',
          error: expect.objectContaining({
            message: 'Another test error',
          }),
        })
      );
    });

    it('should handle string error with context', () => {
      const errorString = 'String error message';
      const context = 'StringContext';

      ErrorHandler.handle(errorString, context);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler: StringContext',
        expect.objectContaining({
          message: 'String error message',
          error: 'String error message',
          context: 'StringContext',
        })
      );
    });

    it('should handle string error without context', () => {
      const errorString = 'Simple string error';

      ErrorHandler.handle(errorString);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler: Error',
        expect.objectContaining({
          message: 'Simple string error',
          error: 'Simple string error',
        })
      );
    });
  });

  describe('logError', () => {
    it('should log Error object with additional info', () => {
      const error = new Error('Logged error');
      const additionalInfo = { userId: 123, action: 'submit' };

      ErrorHandler.logError(error, additionalInfo);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler logged error',
        expect.objectContaining({
          message: 'Logged error',
          error: expect.objectContaining({
            message: 'Logged error',
            stack: expect.any(String),
          }),
          additionalInfo: { userId: 123, action: 'submit' },
        })
      );
    });

    it('should log Error object without additional info', () => {
      const error = new Error('Error without info');

      ErrorHandler.logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler logged error',
        expect.objectContaining({
          message: 'Error without info',
          error: expect.objectContaining({
            message: 'Error without info',
          }),
        })
      );
    });

    it('should log string error with additional info', () => {
      const errorString = 'String logged error';
      const additionalInfo = { component: 'TestComponent' };

      ErrorHandler.logError(errorString, additionalInfo);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler logged error',
        expect.objectContaining({
          message: 'String logged error',
          error: 'String logged error',
          additionalInfo: { component: 'TestComponent' },
        })
      );
    });

    it('should log string error without additional info', () => {
      const errorString = 'Simple logged string';

      ErrorHandler.logError(errorString);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler logged error',
        expect.objectContaining({
          message: 'Simple logged string',
          error: 'Simple logged string',
        })
      );
    });
  });

  describe('reportError', () => {
    it('should report error with user context', async () => {
      const error = new Error('Reported error');
      error.name = 'CustomError';
      const userContext = { userId: 456, sessionId: 'abc123' };

      await ErrorHandler.reportError(error, userContext);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler reporting error',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Reported error',
            stack: expect.any(String),
            name: 'CustomError',
          }),
          userContext: { userId: 456, sessionId: 'abc123' },
        })
      );
    });

    it('should report error without user context', async () => {
      const error = new Error('Error to report');

      await ErrorHandler.reportError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler reporting error',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Error to report',
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should include error name in report', async () => {
      const error = new TypeError('Type error occurred');

      await ErrorHandler.reportError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler reporting error',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'TypeError',
          }),
        })
      );
    });

    it('should handle errors with custom properties', async () => {
      const error = new Error('Custom error') as Error & { code?: string };
      error.name = 'NetworkError';
      error.code = 'ECONNREFUSED';
      const userContext = { endpoint: '/api/users' };

      await ErrorHandler.reportError(error, userContext);

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler reporting error',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Custom error',
            name: 'NetworkError',
          }),
          userContext: { endpoint: '/api/users' },
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple errors in sequence', () => {
      ErrorHandler.handle('Error 1', 'Context1');
      ErrorHandler.handle(new Error('Error 2'), 'Context2');
      ErrorHandler.logError('Error 3');

      expect(logger.error).toHaveBeenCalledTimes(3);
    });

    it('should preserve error stack traces', () => {
      const error = new Error('Stack trace test');
      const originalStack = error.stack;

      ErrorHandler.handle(error, 'StackContext');

      const loggedError = (logger.error as jest.Mock).mock.calls[0][2].error;
      expect(loggedError.stack).toBe(originalStack);
    });

    it('should handle errors with empty messages', () => {
      const error = new Error('');

      ErrorHandler.handle(error, 'EmptyMessage');

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'ErrorHandler: EmptyMessage',
        expect.objectContaining({
          message: '',
        })
      );
    });
  });
});
