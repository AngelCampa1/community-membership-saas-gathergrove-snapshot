/* eslint-disable @typescript-eslint/no-explicit-any */
import { ERROR_MESSAGES, ERROR_SEVERITY, ERROR_CATEGORIES, ErrorSeverity, ErrorCategory } from '@/constants';

// Enhanced error interface for better error handling
export interface AppError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  context?: string;
  originalError?: unknown;
  timestamp: Date;
  userAction?: string; // Suggested action for the user
}

// API Error structure that matches backend responses
export interface ApiErrorResponse {
  message: string;
  errorCode?: string;
  title?: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Network error detection
const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.code === 'ECONNREFUSED' ||
         error?.message?.includes('Network Error') ||
         error?.message?.includes('Connection refused') ||
         error?.message?.includes('fetch') ||
         error?.request && !error?.response;
};

// Connection issue detection
const isConnectionError = (error: any): boolean => {
  return error?.code === 'ENOTFOUND' ||
         error?.code === 'ECONNRESET' ||
         error?.message?.includes('getaddrinfo ENOTFOUND') ||
         error?.message?.includes('Connection reset');
};

// Axios error detection
const isAxiosError = (error: any): boolean => {
  return error && typeof error === 'object' && 
         (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError');
};

// Timeout error detection
const isTimeoutError = (error: any): boolean => {
  return error?.code === 'ECONNABORTED' || 
         error?.message?.includes('timeout') ||
         error?.message?.includes('TIMEOUT');
};

/**
 * Centralized error handler that maps errors to user-friendly messages
 * with appropriate categorization and severity levels
 */
export class ErrorHandler {
  /**
   * Handle authentication-related errors
   */
  static handleAuthError(error: unknown, context: string = 'Authentication'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as ApiErrorResponse;

      switch (status) {
        case 401:
          // Check for authentication failures vs session expiry
          if (data?.errorCode === 'INVALID_CREDENTIALS' || 
              (data as any)?.detail?.toLowerCase().includes('invalid email or password') ||
              data?.message?.toLowerCase().includes('invalid email or password') ||
              data?.title?.toLowerCase().includes('authentication failed')) {
            return this.createError({
              message: ERROR_MESSAGES.INVALID_CREDENTIALS,
              category: ERROR_CATEGORIES.AUTHENTICATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'AUTH_INVALID_CREDENTIALS',
              context,
              userAction: 'Please check your email and password and try again.'
            });
          }
          // Check for account configuration issues (admin users without proper ClubAdmin records)
          if (data?.message?.toLowerCase().includes('user account is not properly configured') ||
              data?.message?.toLowerCase().includes('account is not properly configured')) {
            return this.createError({
              message: 'Your account requires additional setup. Please contact your club administrator for assistance.',
              category: ERROR_CATEGORIES.AUTHENTICATION,
              severity: ERROR_SEVERITY.HIGH,
              code: 'AUTH_ACCOUNT_CONFIGURATION',
              context,
              userAction: 'Please contact your club administrator to complete your account setup.'
            });
          }
          // Default to session expired for other 401 errors (e.g., expired JWT tokens)
          return this.createError({
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'AUTH_SESSION_EXPIRED',
            context,
            userAction: 'Please log in again to continue.'
          });

        case 403:
          if (data?.errorCode === 'ACCOUNT_NOT_ACTIVATED') {
            return this.createError({
              message: ERROR_MESSAGES.ACCOUNT_NOT_ACTIVATED,
              category: ERROR_CATEGORIES.AUTHENTICATION,
              severity: ERROR_SEVERITY.HIGH,
              code: 'AUTH_ACCOUNT_NOT_ACTIVATED',
              context,
              userAction: 'Please check your email for the activation link.'
            });
          }
          if (data?.message?.toLowerCase().includes('tier')) {
            return this.createError({
              message: ERROR_MESSAGES.TIER_RESTRICTION,
              category: ERROR_CATEGORIES.AUTHORIZATION,
              severity: ERROR_SEVERITY.HIGH,
              code: 'AUTH_TIER_RESTRICTION',
              context,
              userAction: 'Please contact your club admin to upgrade your subscription.'
            });
          }
          return this.createError({
            message: ERROR_MESSAGES.ACCESS_DENIED,
            category: ERROR_CATEGORIES.AUTHORIZATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'AUTH_ACCESS_DENIED',
            context
          });

        case 422:
          // Validation errors
          if (data?.errors) {
            // SECURITY FIX: Validate errors object has values before accessing index
            const errors = Object.values(data.errors);
            const firstError = errors.length > 0 ? errors[0] : null;
            const errorMessage = firstError
              ? (Array.isArray(firstError) ? firstError[0] : firstError)
              : ERROR_MESSAGES.VALIDATION_ERROR;
            return this.createError({
              message: errorMessage || ERROR_MESSAGES.VALIDATION_ERROR,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'AUTH_VALIDATION_ERROR',
              context,
              userAction: 'Please check your input and try again.'
            });
          }
          return this.createError({
            message: data?.message || ERROR_MESSAGES.VALIDATION_ERROR,
            category: ERROR_CATEGORIES.VALIDATION,
            severity: ERROR_SEVERITY.MEDIUM,
            code: 'AUTH_VALIDATION_ERROR',
            context
          });

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
            category: ERROR_CATEGORIES.SYSTEM,
            severity: ERROR_SEVERITY.HIGH,
            code: 'AUTH_SERVER_ERROR',
            context,
            userAction: 'Please try again in a few minutes.'
          });
      }
    }

    if (isNetworkError(error)) {
      return this.createError({
        message: ERROR_MESSAGES.NETWORK_ERROR,
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        code: 'AUTH_NETWORK_ERROR',
        context,
        userAction: 'Please check your internet connection and try again.'
      });
    }

    return this.createError({
      message: ERROR_MESSAGES.GENERIC_ERROR,
      category: ERROR_CATEGORIES.SYSTEM,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'AUTH_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle payment-related errors
   */
  static handlePaymentError(error: unknown, context: string = 'Payment'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      switch (status) {
        case 400:
          if (data?.message?.toLowerCase().includes('declined')) {
            return this.createError({
              message: ERROR_MESSAGES.PAYMENT_DECLINED,
              category: ERROR_CATEGORIES.PAYMENT,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PAYMENT_DECLINED',
              context,
              userAction: 'Please try a different payment method or contact your bank.'
            });
          }
          if (data?.message?.toLowerCase().includes('insufficient')) {
            return this.createError({
              message: ERROR_MESSAGES.PAYMENT_INSUFFICIENT_FUNDS,
              category: ERROR_CATEGORIES.PAYMENT,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PAYMENT_INSUFFICIENT_FUNDS',
              context,
              userAction: 'Please try a different payment method.'
            });
          }
          if (data?.message?.toLowerCase().includes('expired')) {
            return this.createError({
              message: ERROR_MESSAGES.PAYMENT_EXPIRED_CARD,
              category: ERROR_CATEGORIES.PAYMENT,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PAYMENT_EXPIRED_CARD',
              context,
              userAction: 'Please update your payment information.'
            });
          }
          return this.createError({
            message: data?.message || ERROR_MESSAGES.PAYMENT_INVALID_CARD,
            category: ERROR_CATEGORIES.PAYMENT,
            severity: ERROR_SEVERITY.MEDIUM,
            code: 'PAYMENT_INVALID_INPUT',
            context,
            userAction: 'Please check your payment details.'
          });

        case 401:
          return this.createError({
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PAYMENT_AUTH_EXPIRED',
            context,
            userAction: 'Please log in again and retry your payment.'
          });

        case 403:
          return this.createError({
            message: 'Payment not authorized. Please check your membership status.',
            category: ERROR_CATEGORIES.AUTHORIZATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PAYMENT_NOT_AUTHORIZED',
            context,
            userAction: 'Please contact your club admin.'
          });

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.PAYMENT_PROCESSING_ERROR,
            category: ERROR_CATEGORIES.PAYMENT,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PAYMENT_SERVER_ERROR',
            context,
            userAction: 'Please try again or contact support@gathergrove.club.'
          });
      }
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      
      // Check for Stripe API key issues (admin hasn't configured Stripe)
      if (errorMessage.toLowerCase().includes('api key') || 
          errorMessage.toLowerCase().includes('you did not provide an api key') ||
          errorMessage.toLowerCase().includes('no api key provided') ||
          errorMessage.toLowerCase().includes('invalid api key') ||
          errorMessage.toLowerCase().includes('api_key_invalid')) {
        return this.createError({
          message: ERROR_MESSAGES.STRIPE_NOT_CONFIGURED,
          category: ERROR_CATEGORIES.PAYMENT,
          severity: ERROR_SEVERITY.HIGH,
          code: 'PAYMENT_STRIPE_NOT_CONFIGURED',
          context,
          userAction: 'Please contact your club administrator to set up payment processing.'
        });
      }
      
      if (errorMessage.toLowerCase().includes('stripe')) {
        return this.createError({
          message: ERROR_MESSAGES.STRIPE_CONNECTION_ERROR,
          category: ERROR_CATEGORIES.PAYMENT,
          severity: ERROR_SEVERITY.HIGH,
          code: 'PAYMENT_STRIPE_ERROR',
          context,
          userAction: 'Please try again later.'
        });
      }
    }

    return this.createError({
      message: ERROR_MESSAGES.PAYMENT_FAILED,
      category: ERROR_CATEGORIES.PAYMENT,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'PAYMENT_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle event-related errors
   */
  static handleEventError(error: unknown, context: string = 'Events'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      switch (status) {
        case 404:
          return this.createError({
            message: ERROR_MESSAGES.EVENT_NOT_FOUND,
            category: ERROR_CATEGORIES.DATA,
            severity: ERROR_SEVERITY.MEDIUM,
            code: 'EVENT_NOT_FOUND',
            context,
            userAction: 'Please try refreshing the events list.'
          });

        case 401:
          return this.createError({
            message: 'Authentication required. Please login again.',
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'EVENT_AUTH_REQUIRED',
            context,
            userAction: 'Please log in again to view events.'
          });

        case 403:
          return this.createError({
            message: 'Access denied. You do not have permission to view events.',
            category: ERROR_CATEGORIES.AUTHORIZATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'EVENT_ACCESS_DENIED',
            context,
            userAction: 'Please contact your club admin.'
          });

        case 400:
          if (data?.message?.toLowerCase().includes('rsvp') && data?.message?.toLowerCase().includes('deadline')) {
            return this.createError({
              message: ERROR_MESSAGES.RSVP_DEADLINE_PASSED,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'EVENT_RSVP_DEADLINE_PASSED',
              context,
              userAction: 'You can no longer RSVP to this event.'
            });
          }
          if (data?.message?.toLowerCase().includes('full') || data?.message?.toLowerCase().includes('capacity')) {
            return this.createError({
              message: ERROR_MESSAGES.EVENT_FULL,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'EVENT_FULL',
              context,
              userAction: 'This event is at full capacity.'
            });
          }
          break;

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
            category: ERROR_CATEGORIES.SYSTEM,
            severity: ERROR_SEVERITY.HIGH,
            code: 'EVENT_SERVER_ERROR',
            context,
            userAction: 'Please try again later.'
          });
      }
    }

    if (context.toLowerCase().includes('rsvp')) {
      return this.createError({
        message: ERROR_MESSAGES.RSVP_FAILED,
        category: ERROR_CATEGORIES.DATA,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'EVENT_RSVP_FAILED',
        context,
        userAction: 'Please try again.'
      });
    }

    return this.createError({
      message: context.toLowerCase().includes('load') ? ERROR_MESSAGES.EVENTS_LOAD_FAILED : ERROR_MESSAGES.EVENT_LOAD_FAILED,
      category: ERROR_CATEGORIES.DATA,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'EVENT_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle directory-related errors
   */
  static handleDirectoryError(error: unknown, context: string = 'Directory'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      switch (status) {
        case 403:
          if (data?.message?.toLowerCase().includes('directory') && data?.message?.toLowerCase().includes('disabled')) {
            return this.createError({
              message: ERROR_MESSAGES.DIRECTORY_NOT_ENABLED,
              category: ERROR_CATEGORIES.AUTHORIZATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'DIRECTORY_NOT_ENABLED',
              context,
              userAction: 'Please contact your club admin to enable the directory.'
            });
          }
          return this.createError({
            message: ERROR_MESSAGES.DIRECTORY_PERMISSIONS_ERROR,
            category: ERROR_CATEGORIES.AUTHORIZATION,
            severity: ERROR_SEVERITY.MEDIUM,
            code: 'DIRECTORY_PERMISSIONS_ERROR',
            context,
            userAction: 'Please contact your club admin.'
          });

        case 401:
          return this.createError({
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'DIRECTORY_AUTH_EXPIRED',
            context,
            userAction: 'Please log in again.'
          });

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
            category: ERROR_CATEGORIES.SYSTEM,
            severity: ERROR_SEVERITY.HIGH,
            code: 'DIRECTORY_SERVER_ERROR',
            context,
            userAction: 'Please try again later.'
          });
      }
    }

    if (context.toLowerCase().includes('search')) {
      return this.createError({
        message: ERROR_MESSAGES.DIRECTORY_SEARCH_FAILED,
        category: ERROR_CATEGORIES.DATA,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'DIRECTORY_SEARCH_FAILED',
        context,
        userAction: 'Please try your search again.'
      });
    }

    if (context.toLowerCase().includes('settings')) {
      return this.createError({
        message: ERROR_MESSAGES.DIRECTORY_SETTINGS_FAILED,
        category: ERROR_CATEGORIES.DATA,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'DIRECTORY_SETTINGS_FAILED',
        context,
        userAction: 'Please try saving your settings again.'
      });
    }

    return this.createError({
      message: ERROR_MESSAGES.DIRECTORY_LOAD_FAILED,
      category: ERROR_CATEGORIES.DATA,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'DIRECTORY_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle chat-related errors
   */
  static handleChatError(error: unknown, context: string = 'Chat'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      switch (status) {
        case 403:
          if (data?.message?.toLowerCase().includes('chat') && data?.message?.toLowerCase().includes('disabled')) {
            return this.createError({
              message: ERROR_MESSAGES.CHAT_NOT_ENABLED,
              category: ERROR_CATEGORIES.AUTHORIZATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'CHAT_NOT_ENABLED',
              context,
              userAction: 'Please contact your club admin to enable chat.'
            });
          }
          return this.createError({
            message: ERROR_MESSAGES.CHAT_PERMISSIONS_ERROR,
            category: ERROR_CATEGORIES.AUTHORIZATION,
            severity: ERROR_SEVERITY.MEDIUM,
            code: 'CHAT_PERMISSIONS_ERROR',
            context,
            userAction: 'Please contact your club admin.'
          });

        case 401:
          return this.createError({
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'CHAT_AUTH_EXPIRED',
            context,
            userAction: 'Please log in again.'
          });

        case 400:
          if (data?.message?.toLowerCase().includes('message') && data?.message?.toLowerCase().includes('empty')) {
            return this.createError({
              message: ERROR_MESSAGES.MESSAGE_EMPTY,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.LOW,
              code: 'CHAT_MESSAGE_EMPTY',
              context,
              userAction: 'Please enter a message before sending.'
            });
          }
          if (data?.message?.toLowerCase().includes('too long')) {
            return this.createError({
              message: ERROR_MESSAGES.MESSAGE_TOO_LONG,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.LOW,
              code: 'CHAT_MESSAGE_TOO_LONG',
              context,
              userAction: 'Please shorten your message and try again.'
            });
          }
          break;

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
            category: ERROR_CATEGORIES.SYSTEM,
            severity: ERROR_SEVERITY.HIGH,
            code: 'CHAT_SERVER_ERROR',
            context,
            userAction: 'Please try again later.'
          });
      }
    }

    if (context.toLowerCase().includes('send')) {
      return this.createError({
        message: ERROR_MESSAGES.CHAT_SEND_FAILED,
        category: ERROR_CATEGORIES.DATA,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'CHAT_SEND_FAILED',
        context,
        userAction: 'Please check your connection and try again.'
      });
    }

    if (context.toLowerCase().includes('connection')) {
      return this.createError({
        message: ERROR_MESSAGES.CHAT_CONNECTION_FAILED,
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        code: 'CHAT_CONNECTION_FAILED',
        context,
        userAction: 'Please check your internet connection.'
      });
    }

    return this.createError({
      message: ERROR_MESSAGES.CHAT_LOAD_FAILED,
      category: ERROR_CATEGORIES.DATA,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'CHAT_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle profile-related errors
   */
  static handleProfileError(error: unknown, context: string = 'Profile'): AppError {
    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      switch (status) {
        case 404:
          return this.createError({
            message: ERROR_MESSAGES.PROFILE_NOT_FOUND,
            category: ERROR_CATEGORIES.DATA,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PROFILE_NOT_FOUND',
            context,
            userAction: 'Please contact your club admin.'
          });

        case 401:
          return this.createError({
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            category: ERROR_CATEGORIES.AUTHENTICATION,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PROFILE_AUTH_EXPIRED',
            context,
            userAction: 'Please log in again.'
          });

        case 422:
          if (data?.errors) {
            // VAL-01 fix: Check if errors object has values before accessing
            const errors = Object.values(data.errors);
            const firstError = errors.length > 0 ? errors[0] : null;
            const errorMessage = firstError
              ? (Array.isArray(firstError) ? firstError[0] : firstError)
              : ERROR_MESSAGES.VALIDATION_ERROR;
            return this.createError({
              message: errorMessage || ERROR_MESSAGES.VALIDATION_ERROR,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PROFILE_VALIDATION_ERROR',
              context,
              userAction: 'Please check your input and try again.'
            });
          }
          if (data?.message?.toLowerCase().includes('phone')) {
            return this.createError({
              message: ERROR_MESSAGES.INVALID_PHONE_NUMBER,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PROFILE_INVALID_PHONE',
              context,
              userAction: 'Please enter a valid phone number.'
            });
          }
          if (data?.message?.toLowerCase().includes('email')) {
            return this.createError({
              message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
              category: ERROR_CATEGORIES.VALIDATION,
              severity: ERROR_SEVERITY.MEDIUM,
              code: 'PROFILE_INVALID_EMAIL',
              context,
              userAction: 'Please enter a valid email address.'
            });
          }
          break;

        case 500:
          return this.createError({
            message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
            category: ERROR_CATEGORIES.SYSTEM,
            severity: ERROR_SEVERITY.HIGH,
            code: 'PROFILE_SERVER_ERROR',
            context,
            userAction: 'Please try again later.'
          });
      }
    }

    if (context.toLowerCase().includes('update') || context.toLowerCase().includes('save')) {
      return this.createError({
        message: ERROR_MESSAGES.PROFILE_UPDATE_FAILED,
        category: ERROR_CATEGORIES.DATA,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'PROFILE_UPDATE_FAILED',
        context,
        userAction: 'Please check your information and try again.'
      });
    }

    return this.createError({
      message: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
      category: ERROR_CATEGORIES.DATA,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'PROFILE_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Handle generic API errors
   */
  static handleApiError(error: unknown, context: string = 'API'): AppError {
    if (isTimeoutError(error)) {
      return this.createError({
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        code: 'API_TIMEOUT',
        context,
        userAction: 'Please check your connection and try again.'
      });
    }

    if (isNetworkError(error)) {
      return this.createError({
        message: ERROR_MESSAGES.NETWORK_ERROR,
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        code: 'API_NETWORK_ERROR',
        context,
        userAction: 'Please check your internet connection and try again.'
      });
    }

    if (isConnectionError(error)) {
      return this.createError({
        message: ERROR_MESSAGES.CONNECTION_ERROR,
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        code: 'API_CONNECTION_ERROR',
        context,
        userAction: 'Unable to connect to the server. Please try again later.'
      });
    }

    if (isAxiosError(error)) {
      const axiosError = error as any;
      const status = axiosError.response?.status;

      if (status >= 500) {
        return this.createError({
          message: ERROR_MESSAGES.SERVER_UNAVAILABLE,
          category: ERROR_CATEGORIES.SYSTEM,
          severity: ERROR_SEVERITY.HIGH,
          code: 'API_SERVER_ERROR',
          context,
          userAction: 'Please try again in a few minutes.'
        });
      }

      if (status === 401) {
        return this.createError({
          message: ERROR_MESSAGES.SESSION_EXPIRED,
          category: ERROR_CATEGORIES.AUTHENTICATION,
          severity: ERROR_SEVERITY.HIGH,
          code: 'API_AUTH_EXPIRED',
          context,
          userAction: 'Please log in again.'
        });
      }

      if (status === 403) {
        return this.createError({
          message: ERROR_MESSAGES.ACCESS_DENIED,
          category: ERROR_CATEGORIES.AUTHORIZATION,
          severity: ERROR_SEVERITY.HIGH,
          code: 'API_ACCESS_DENIED',
          context,
          userAction: 'Please contact your club admin.'
        });
      }
    }

    return this.createError({
      message: ERROR_MESSAGES.GENERIC_ERROR,
      category: ERROR_CATEGORIES.SYSTEM,
      severity: ERROR_SEVERITY.MEDIUM,
      code: 'API_GENERIC_ERROR',
      context,
      originalError: error
    });
  }

  /**
   * Create a standardized AppError object
   */
  private static createError({
    message,
    category,
    severity,
    code,
    context,
    userAction,
    originalError
  }: {
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    code?: string;
    context?: string;
    userAction?: string;
    originalError?: unknown;
  }): AppError {
    const appError: AppError = {
      message,
      category,
      severity,
      timestamp: new Date(),
      code,
      context,
      userAction,
      originalError
    };

    // Log error in development mode
    if (__DEV__) {
      const { logger } = require('./logger');
      logger.error('app', `ErrorHandler: ${code}`, originalError, {
        code,
        severity,
        userAction
      });
    }

    return appError;
  }

  /**
   * Get user-friendly message from any error
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as AppError).message;
    }
    if (error && typeof error === 'object' && 'toString' in error) {
      return error.toString();
    }
    return ERROR_MESSAGES.GENERIC_ERROR;
  }

  /**
   * Check if error should trigger automatic logout
   */
  static shouldLogout(error: AppError): boolean {
    return error.code === 'AUTH_SESSION_EXPIRED' || 
           error.code === 'AUTH_TOKEN_INVALID' ||
           (error.category === ERROR_CATEGORIES.AUTHENTICATION && error.severity === ERROR_SEVERITY.HIGH);
  }

  /**
   * Check if error should be retried automatically
   */
  static shouldRetry(error: AppError): boolean {
    return error.category === ERROR_CATEGORIES.NETWORK || 
           error.code === 'API_TIMEOUT' ||
           (error.severity === ERROR_SEVERITY.LOW);
  }
} 