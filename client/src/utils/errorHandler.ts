import { logger } from '@/lib/logger';

export class ErrorHandler {
  static handle(error: Error | string, context?: string) {
    const message = typeof error === 'string' ? error : error.message;
    logger.error('api', `ErrorHandler: ${context || 'Error'}`, {
      message,
      error: typeof error === 'string' ? error : { message: error.message, stack: error.stack },
      context
    });
  }

  static logError(error: Error | string, additionalInfo?: Record<string, any>) {
    const message = typeof error === 'string' ? error : error.message;
    logger.error('api', 'ErrorHandler logged error', {
      message,
      error: typeof error === 'string' ? error : { message: error.message, stack: error.stack },
      additionalInfo
    });
  }

  static async reportError(error: Error, userContext?: Record<string, any>) {
    // In a real application, this would send to an error reporting service
    logger.error('api', 'ErrorHandler reporting error', {
      error: { message: error.message, stack: error.stack, name: error.name },
      userContext
    });
  }
}

export default ErrorHandler;