import { toast } from 'sonner';
import { ApiErrorClass, ErrorTypes, getUserFriendlyMessage, ValidationError, FormErrors } from '@/types/errors';
import { trackError } from '@/lib/sentry';
import { FrontendErrorLoggingService } from '@/services/errorLoggingService';
import { logger } from '@/lib/logger';

// Options for advanced error handling
export interface ErrorHandlerOptions {
  context?: string;
  action?: string;
  customMessages?: Record<number, string>;
  showToast?: boolean;
}

// Enhanced toast options
export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Enhanced error handler with better user experience
export class ErrorHandler {
  /**
   * Handles API errors with appropriate user feedback and advanced options (synchronous version)
   */
  static handleApiError(error: unknown, options?: ErrorHandlerOptions): ApiErrorClass {
    const apiError = this.parseError(error);
    
    // Track error to Application Insights (only in staging/production)
    trackError(apiError, {
      context: options?.context,
      action: options?.action,
      errorType: apiError.type,
      statusCode: apiError.status,
      originalMessage: apiError.message
    });

    // Log error to database asynchronously (fire and forget in development)
    FrontendErrorLoggingService.logError(
      apiError,
      options?.context,
      {
        action: options?.action,
        errorType: apiError.type,
        statusCode: apiError.status,
        originalMessage: apiError.message
      }
    ).catch(loggingError => {
      // Don't let logging errors break the app
      logger.error('api', 'Failed to log error to database', { loggingError, originalError: apiError.message });
    });
    
    // Apply custom messages based on context
    if (options?.customMessages?.[apiError.status]) {
      apiError.message = options.customMessages[apiError.status];
    }

    // Add context and action to error message if provided
    if (options?.context || options?.action) {
      let enhancedMessage = apiError.message;
      if (options.context) {
        enhancedMessage = `Error ${options.context}: ${enhancedMessage}`;
      }
      if (options.action) {
        enhancedMessage += ` ${options.action}`;
      }
      apiError.message = enhancedMessage;
    }

    return apiError;
  }

  /**
   * Handles API errors with appropriate user feedback and advanced options (async version)
   */
  static async handleApiErrorAsync(error: unknown, options?: ErrorHandlerOptions): Promise<ApiErrorClass> {
    const apiError = this.parseError(error);
    
    // Track error to Application Insights (only in staging/production)
    trackError(apiError, {
      context: options?.context,
      action: options?.action,
      errorType: apiError.type,
      statusCode: apiError.status,
      originalMessage: apiError.message
    });

    // Log error to database (only in development)
    try {
      await FrontendErrorLoggingService.logError(
        apiError,
        options?.context,
        {
          action: options?.action,
          errorType: apiError.type,
          statusCode: apiError.status,
          originalMessage: apiError.message
        }
      );
    } catch (loggingError) {
      // Don't let logging errors break the app
      logger.error('api', 'Failed to log error to database in async handler', { loggingError, originalError: apiError.message });
    }
    
    // Apply custom messages based on context
    if (options?.customMessages?.[apiError.status]) {
      apiError.message = options.customMessages[apiError.status];
    }

    // Add context and action to error message if provided
    if (options?.context || options?.action) {
      let enhancedMessage = apiError.message;
      if (options.context) {
        enhancedMessage = `Error ${options.context}: ${enhancedMessage}`;
      }
      if (options.action) {
        enhancedMessage += ` ${options.action}`;
      }
      apiError.message = enhancedMessage;
    }

    return apiError;
  }

  /**
   * Shows error toast with user-friendly message
   */
  static showErrorToast(error: unknown, customMessage?: string, options?: ToastOptions): void {
    const message = customMessage || getUserFriendlyMessage(error);
    toast.error(message, {
      duration: options?.duration,
      position: options?.position,
      dismissible: options?.dismissible,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Shows success toast with optional action
   */
  static showSuccessToast(message: string, options?: ToastOptions): void {
    toast.success(message, {
      duration: options?.duration,
      position: options?.position,
      dismissible: options?.dismissible,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Shows warning toast for non-critical issues
   */
  static showWarningToast(message: string, options?: ToastOptions): void {
    toast.warning(message, {
      duration: options?.duration,
      position: options?.position,
      dismissible: options?.dismissible,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Shows info toast for informational messages
   */
  static showInfoToast(message: string, options?: ToastOptions): void {
    toast.info(message, {
      duration: options?.duration,
      position: options?.position,
      dismissible: options?.dismissible,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Handles form validation errors and returns formatted errors
   */
  static handleValidationErrors(error: unknown): FormErrors {
    const apiError = this.parseError(error);
    const formErrors: FormErrors = {};

    if (apiError.details?.validationErrors) {
      const validationErrors = apiError.details.validationErrors as ValidationError[];
      validationErrors.forEach((validationError) => {
        formErrors[validationError.field] = validationError.message;
      });
    } else if (apiError.type === ErrorTypes.VALIDATION_ERROR) {
      // Generic validation error
      formErrors.general = apiError.message;
    }

    return formErrors;
  }

  /**
   * Convenience method that handles error and shows toast
   */
  static handleAndToast(error: unknown, options?: ErrorHandlerOptions): ApiErrorClass {
    const apiError = this.handleApiError(error, options);
    this.showErrorToast(apiError);
    return apiError;
  }

  /**
   * Parses various error types into standardized ApiErrorClass
   */
  static parseError(error: unknown): ApiErrorClass {
    // Already parsed error
    if (error instanceof ApiErrorClass) {
      return error;
    }

    // Axios error
    if (this.isAxiosError(error)) {
      const axiosError = error as { response?: { status?: number; data?: Record<string, unknown> }; message?: string; code?: string };
      const status = axiosError.response?.status || 0;
      const data = axiosError.response?.data;

      // Type guard for error data properties
      const getDataProperty = (key: string): string | undefined => {
        if (typeof data === 'object' && data !== null && key in data) {
          const value = data[key];
          return typeof value === 'string' ? value : undefined;
        }
        return undefined;
      };

      let message = getDataProperty('message') || getDataProperty('detail') || axiosError.message || '';
      let type = this.getErrorTypeFromStatus(status);
      const code = getDataProperty('code');
      const details = (typeof data === 'object' && data !== null && 'details' in data ? data.details as Record<string, unknown> : undefined);

      // Handle specific error scenarios
      if (status === 401) {
        type = ErrorTypes.AUTHENTICATION_ERROR;
        message = message || 'Authentication required';
      } else if (status === 403) {
        type = ErrorTypes.AUTHORIZATION_ERROR;
        message = message || 'Access denied';
      } else if (status === 404) {
        type = ErrorTypes.NOT_FOUND_ERROR;
        message = message || 'Resource not found';
      } else if (status >= 400 && status < 500) {
        type = ErrorTypes.VALIDATION_ERROR;
        message = message || 'Validation error';
      } else if (status >= 500) {
        type = ErrorTypes.SERVER_ERROR;
        message = message || 'Server error occurred';
      }

      // Final fallback if message is still empty
      if (!message) {
        message = 'Unknown error';
      }

      // Handle network errors
      if (axiosError.code === 'NETWORK_ERROR' || axiosError.code === 'ERR_NETWORK') {
        type = ErrorTypes.NETWORK_ERROR;
        message = 'Network connection failed';
      } else if (axiosError.code === 'TIMEOUT' || axiosError.code === 'ECONNABORTED') {
        type = ErrorTypes.TIMEOUT_ERROR;
        message = 'Request timeout';
      }

      return new ApiErrorClass(message, status, type, code, details);
    }

    // Fetch API error
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const fetchError = error as { response: { status: number; data?: Record<string, unknown> }; message?: string };
      const status = fetchError.response.status;
      const message = fetchError.message || `HTTP ${status}`;
      const type = this.getErrorTypeFromStatus(status);

      return new ApiErrorClass(message, status, type);
    }

    // Generic Error instance
    if (error instanceof Error) {
      return new ApiErrorClass(error.message, 0, ErrorTypes.UNKNOWN_ERROR);
    }

    // String error
    if (typeof error === 'string') {
      return new ApiErrorClass(error, 0, ErrorTypes.UNKNOWN_ERROR);
    }

    // Fallback
    return new ApiErrorClass('An unknown error occurred', 0, ErrorTypes.UNKNOWN_ERROR);
  }

  private static isAxiosError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: unknown }).response === 'object'
    );
  }

  /**
   * Maps HTTP status codes to error types
   */
  private static getErrorTypeFromStatus(status: number): ErrorTypes {
    if (status === 401) return ErrorTypes.AUTHENTICATION_ERROR;
    if (status === 403) return ErrorTypes.AUTHORIZATION_ERROR;
    if (status === 404) return ErrorTypes.NOT_FOUND_ERROR;
    if (status >= 400 && status < 500) return ErrorTypes.VALIDATION_ERROR;
    if (status >= 500) return ErrorTypes.SERVER_ERROR;
    if (status === 0) return ErrorTypes.NETWORK_ERROR;
    return ErrorTypes.UNKNOWN_ERROR;
  }

  // Specialized domain-specific error handlers

  /**
   * Handle authentication-specific errors with enhanced context
   */
  static handleAuthError(error: unknown, context: string = 'authentication'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        401: 'Your email or password is incorrect. Please try again.',
        403: 'Your account may not be activated. Please check your email for activation instructions.',
        422: 'Please check that all required fields are filled in correctly.',
        429: 'Too many login attempts. Please wait a few minutes before trying again.',
        500: 'Authentication service is temporarily unavailable. Please try again later.'
      }
    });
  }

  /**
   * Handle payment-specific errors with Stripe context
   */
  static handlePaymentError(error: unknown, context: string = 'processing payment'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        400: 'Invalid payment information. Please check your card details.',
        402: 'Your card was declined. Please try a different payment method.',
        403: 'You do not have permission to make payments for this club.',
        409: 'A payment is already in progress. Please wait before trying again.',
        422: 'Payment information is incomplete. Please fill in all required fields.',
        500: 'Payment processing is temporarily unavailable. Please try again later.'
      }
    });
  }

  /**
   * Handle member management errors with specific context
   */
  static handleMemberError(error: unknown, context: string = 'managing member'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        403: 'You do not have permission to manage members in this club.',
        404: 'Member not found. They may have been removed from the club.',
        409: 'A member with this email already exists in the club.',
        422: 'Member information is incomplete or invalid.',
        500: 'Member management is temporarily unavailable. Please try again later.'
      }
    });
  }

  /**
   * Handle event management errors
   */
  static handleEventError(error: unknown, context: string = 'managing event'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        403: 'You do not have permission to manage events in this club.',
        404: 'Event not found. It may have been cancelled or deleted.',
        409: 'RSVP deadline has passed or event is full.',
        410: 'This event link has expired.',
        423: 'Event registration is temporarily disabled.',
        500: 'Event management is temporarily unavailable. Please try again later.'
      }
    });
  }

  /**
   * Handle chat-related errors
   */
  static handleChatError(error: unknown, context: string = 'using chat'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        403: 'Chat is not available for your membership level or has been disabled.',
        413: 'Your message is too long. Please shorten it and try again.',
        423: 'Chat has been temporarily disabled by club administrators.',
        429: 'You are sending messages too quickly. Please wait a moment.',
        500: 'Chat service is temporarily unavailable. Please try again later.'
      }
    });
  }

  /**
   * Handle billing and subscription errors (synchronous version for backward compatibility)
   */
  static handleBillingError(error: unknown, context: string = 'managing billing'): ApiErrorClass {
    const apiError = this.parseError(error);
    
    // Track error to Application Insights (only in staging/production)
    trackError(apiError, {
      context,
      errorType: apiError.type,
      statusCode: apiError.status,
      originalMessage: apiError.message
    });

    // Log to database asynchronously (fire and forget)
    FrontendErrorLoggingService.logError(
      apiError,
      context,
      {
        errorType: apiError.type,
        statusCode: apiError.status,
        originalMessage: apiError.message
      }
    ).catch(loggingError => {
      logger.error('billing', 'Failed to log billing error to database', { loggingError, originalError: apiError.message });
    });

    // Apply custom messages
    const customMessages = {
      402: 'Payment failed. Please update your payment method.',
      403: 'You do not have permission to manage billing for this club.',
      409: 'A billing operation is already in progress.',
      423: 'Billing is temporarily locked. Please contact support@gathergrove.club.',
      500: 'Billing service is temporarily unavailable. Please try again later.',
      503: 'Payment processing is not currently available. Please contact support@gathergrove.club to enable this feature.'
    };

    if (customMessages[apiError.status as keyof typeof customMessages]) {
      apiError.message = customMessages[apiError.status as keyof typeof customMessages];
    }

    // Add context to error message
    if (context) {
      apiError.message = `Error ${context}: ${apiError.message}`;
    }

    return apiError;
  }

  /**
   * Handle push notification errors with specific context
   */
  static handlePushNotificationError(error: unknown, context: string = 'sending push notification'): ApiErrorClass {
    return this.handleApiError(error, {
      context,
      customMessages: {
        400: 'Push notification content is invalid. Please check your title and message.',
        403: 'You do not have permission to send push notifications for this club.',
        404: 'Push notification service is not configured for this club.',
        409: 'A push notification is already being sent. Please wait before trying again.',
        422: 'Push notification information is incomplete. Please fill in all required fields.',
        423: 'Push notifications are temporarily disabled. Please contact support@gathergrove.club.',
        500: 'No members have registered devices for push notifications. Ask members to enable push notifications in the mobile app.',
        503: 'Push notification service is temporarily unavailable. Please try again later.'
      }
    });
  }
}

// Hook-specific error handling utilities
export class HookErrorHandler {
  /**
   * Handle errors in data fetching hooks
   */
  static handleDataFetchError(error: unknown, dataType: string = 'data'): string {
    const apiError = ErrorHandler.parseError(error);
    
    switch (apiError.type) {
      case ErrorTypes.NETWORK_ERROR:
        return `Unable to load ${dataType}. Please check your internet connection.`;
      case ErrorTypes.AUTHENTICATION_ERROR:
        return `Please log in again to view ${dataType}.`;
      case ErrorTypes.AUTHORIZATION_ERROR:
        return `You don't have permission to view this ${dataType}.`;
      case ErrorTypes.NOT_FOUND_ERROR:
        return `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} not found.`;
      case ErrorTypes.SERVER_ERROR:
        return `Unable to load ${dataType} due to a server error. Please try again later.`;
      default:
        return `Failed to load ${dataType}. Please try again.`;
    }
  }

  /**
   * Handle errors in form submission hooks
   */
  static handleFormSubmissionError(error: unknown, actionType: string = 'save'): string {
    const apiError = ErrorHandler.parseError(error);
    
    switch (apiError.type) {
      case ErrorTypes.VALIDATION_ERROR:
        return `Please check your input and try again.`;
      case ErrorTypes.NETWORK_ERROR:
        return `Unable to ${actionType}. Please check your internet connection.`;
      case ErrorTypes.AUTHENTICATION_ERROR:
        return `Please log in again to ${actionType}.`;
      case ErrorTypes.AUTHORIZATION_ERROR:
        return `You don't have permission to ${actionType}.`;
      case ErrorTypes.CONFLICT_ERROR:
        return `This information conflicts with existing data. Please review and try again.`;
      default:
        return `Failed to ${actionType}. Please try again.`;
    }
  }
}

// Export individual toast functions for backward compatibility
export const showErrorToast = ErrorHandler.showErrorToast.bind(ErrorHandler);
export const showSuccessToast = ErrorHandler.showSuccessToast.bind(ErrorHandler);
export const showWarningToast = ErrorHandler.showWarningToast.bind(ErrorHandler);
export const showInfoToast = ErrorHandler.showInfoToast.bind(ErrorHandler); 