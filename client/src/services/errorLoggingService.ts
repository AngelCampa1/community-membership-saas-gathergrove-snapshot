import apiClient from './apiClient';
import { logger } from '@/lib/logger';

// Interface for frontend error logging
interface FrontendErrorLog {
  level: 'Error' | 'Warning' | 'Information' | 'Critical';
  message: string;
  exception?: string;
  stackTrace?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

// Service for logging frontend errors to the database (development only)
export class FrontendErrorLoggingService {
  private static isEnabled(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static async logError(
    error: Error | string,
    context?: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    if (!this.isEnabled()) {
      return; // Only log to database in development
    }

    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const currentUserId = this.getCurrentUserId();

      const errorLog: FrontendErrorLog = {
        level: 'Error',
        message: context ? `${context}: ${errorObj.message}` : errorObj.message,
        exception: errorObj.name || 'Error',
        stackTrace: errorObj.stack || '',
        userId: currentUserId !== 'anonymous' ? currentUserId : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        additionalData: {
          timestamp: new Date().toISOString(),
          source: 'frontend',
          ...additionalData
        }
      };

      // Send to backend error logging endpoint
      await apiClient.post('/errors/log', errorLog);
    } catch (loggingError) {
      // Don't let logging errors break the app
      logger.error('Failed to log error to database', loggingError);
    }
  }

  static async logWarning(
    message: string,
    context?: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const currentUserId = this.getCurrentUserId();

      const errorLog: FrontendErrorLog = {
        level: 'Warning',
        message: context ? `${context}: ${message}` : message,
        userId: currentUserId !== 'anonymous' ? currentUserId : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        additionalData: {
          timestamp: new Date().toISOString(),
          source: 'frontend',
          ...additionalData
        }
      };

      await apiClient.post('/errors/log', errorLog);
    } catch (loggingError) {
      logger.error('Failed to log warning to database', loggingError);
    }
  }

  static async logCritical(
    error: Error | string,
    context?: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const currentUserId = this.getCurrentUserId();

      const errorLog: FrontendErrorLog = {
        level: 'Critical',
        message: context ? `${context}: ${errorObj.message}` : errorObj.message,
        exception: errorObj.name || 'CriticalError',
        stackTrace: errorObj.stack || '',
        userId: currentUserId !== 'anonymous' ? currentUserId : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        additionalData: {
          timestamp: new Date().toISOString(),
          source: 'frontend',
          ...additionalData
        }
      };

      await apiClient.post('/errors/log', errorLog);
    } catch (loggingError) {
      logger.error('Failed to log critical error to database', loggingError);
    }
  }

  private static getCurrentUserId(): string {
    try {
      // Try to get from local storage, cookies, or context
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.email || 'anonymous';
      }
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  }
}