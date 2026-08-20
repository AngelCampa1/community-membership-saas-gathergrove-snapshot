/**
 * Tests for errorHandler.ts - Centralized error handling
 * Following boundary mocking pattern: mock only toast, logger, and external services
 * @jest-environment jsdom
 */

import { toast } from 'sonner';
import { ErrorHandler, HookErrorHandler } from '../errorHandler';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';
import { trackError } from '@/lib/sentry';
import { FrontendErrorLoggingService } from '@/services/errorLoggingService';
import { logger } from '@/lib/logger';

// Mock external dependencies
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/sentry', () => ({
  trackError: jest.fn(),
}));

jest.mock('@/services/errorLoggingService', () => ({
  FrontendErrorLoggingService: {
    logError: jest.fn().mockImplementation(() => Promise.resolve()),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockToast = toast as jest.Mocked<typeof toast>;
const mockTrackError = trackError as jest.MockedFunction<typeof trackError>;
const mockLogError = FrontendErrorLoggingService.logError as jest.MockedFunction<typeof FrontendErrorLoggingService.logError>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore the Promise implementation after clearAll
    mockLogError.mockImplementation(() => Promise.resolve());
  });

  describe('parseError()', () => {
    it('returns ApiErrorClass unchanged if already parsed', () => {
      const apiError = new ApiErrorClass('Test error', 400, ErrorTypes.VALIDATION_ERROR);
      const result = ErrorHandler.parseError(apiError);

      expect(result).toBe(apiError);
    });

    it('parses Axios error with response', () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            message: 'Not found',
            code: 'RESOURCE_NOT_FOUND',
          },
        },
        message: 'Request failed',
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(result.status).toBe(404);
      expect(result.type).toBe(ErrorTypes.NOT_FOUND_ERROR);
      expect(result.message).toBe('Not found');
    });

    it('parses Axios 401 error as authentication error', () => {
      const axiosError = {
        response: {
          status: 401,
          data: {},
        },
        // No message property - will use default
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.type).toBe(ErrorTypes.AUTHENTICATION_ERROR);
      expect(result.message).toBe('Authentication required');
    });

    it('parses Axios 403 error as authorization error', () => {
      const axiosError = {
        response: {
          status: 403,
          data: {},
        },
        // No message property - will use default
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.type).toBe(ErrorTypes.AUTHORIZATION_ERROR);
      expect(result.message).toBe('Access denied');
    });

    it('parses Axios 500 error as server error', () => {
      const axiosError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.type).toBe(ErrorTypes.SERVER_ERROR);
      expect(result.message).toBe('Internal server error'); // Uses message from data
    });

    it('parses Axios network error', () => {
      const axiosError = {
        response: {
          status: 0,
          data: {},
        },
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.type).toBe(ErrorTypes.NETWORK_ERROR);
      expect(result.message).toBe('Network connection failed');
    });

    it('parses Axios timeout error', () => {
      const axiosError = {
        response: {
          status: 0,
          data: {},
        },
        code: 'TIMEOUT',
        message: 'Request timeout',
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.type).toBe(ErrorTypes.TIMEOUT_ERROR);
      expect(result.message).toBe('Request timeout');
    });

    it('parses generic Error instance', () => {
      const error = new Error('Something went wrong');
      const result = ErrorHandler.parseError(error);

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(result.message).toBe('Something went wrong');
      expect(result.type).toBe(ErrorTypes.UNKNOWN_ERROR);
    });

    it('parses string error', () => {
      const result = ErrorHandler.parseError('Error message');

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(result.message).toBe('Error message');
      expect(result.type).toBe(ErrorTypes.UNKNOWN_ERROR);
    });

    it('handles unknown error types', () => {
      const result = ErrorHandler.parseError({ unknown: 'error' });

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.type).toBe(ErrorTypes.UNKNOWN_ERROR);
    });

    it('extracts validation details from Axios error', () => {
      const axiosError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            details: {
              validationErrors: [
                { field: 'email', message: 'Invalid email' },
              ],
            },
          },
        },
      };

      const result = ErrorHandler.parseError(axiosError);

      expect(result.details).toBeDefined();
      expect(result.details?.validationErrors).toHaveLength(1);
    });
  });

  describe('handleApiError()', () => {
    it('parses error and tracks to Application Insights', () => {
      const error = new Error('Test error');
      const options = { context: 'test', action: 'save' };

      ErrorHandler.handleApiError(error, options);

      expect(mockTrackError).toHaveBeenCalledWith(
        expect.any(ApiErrorClass),
        expect.objectContaining({
          context: 'test',
          action: 'save',
        })
      );
    });

    it('logs error to database', () => {
      const error = new Error('Test error');

      ErrorHandler.handleApiError(error);

      expect(mockLogError).toHaveBeenCalled();
    });

    it('applies custom messages based on status code', () => {
      const axiosError = {
        response: {
          status: 404,
          data: {},
        },
      };

      const result = ErrorHandler.handleApiError(axiosError, {
        customMessages: {
          404: 'Custom not found message',
        },
      });

      expect(result.message).toBe('Custom not found message');
    });

    it('adds context to error message', () => {
      const error = new Error('Original error');

      const result = ErrorHandler.handleApiError(error, {
        context: 'user registration',
      });

      expect(result.message).toContain('Error user registration');
    });

    it('adds action to error message', () => {
      const error = new Error('Original error');

      const result = ErrorHandler.handleApiError(error, {
        action: 'Please try again',
      });

      expect(result.message).toContain('Please try again');
    });

    it('handles database logging errors gracefully', async () => {
      mockLogError.mockRejectedValueOnce(new Error('Logging failed'));
      const error = new Error('Test error');

      ErrorHandler.handleApiError(error);

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleApiErrorAsync()', () => {
    it('parses error and tracks to Application Insights', async () => {
      const error = new Error('Test error');
      const options = { context: 'async test', action: 'load' };

      await ErrorHandler.handleApiErrorAsync(error, options);

      expect(mockTrackError).toHaveBeenCalledWith(
        expect.any(ApiErrorClass),
        expect.objectContaining({
          context: 'async test',
          action: 'load',
        })
      );
    });

    it('waits for database logging to complete', async () => {
      const error = new Error('Test error');

      await ErrorHandler.handleApiErrorAsync(error);

      expect(mockLogError).toHaveBeenCalled();
    });

    it('handles database logging errors without throwing', async () => {
      mockLogError.mockRejectedValueOnce(new Error('Logging failed'));
      const error = new Error('Test error');

      const result = await ErrorHandler.handleApiErrorAsync(error);

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('applies custom messages and context', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: {},
        },
      };

      const result = await ErrorHandler.handleApiErrorAsync(axiosError, {
        context: 'loading data',
        customMessages: {
          500: 'Server is down',
        },
      });

      expect(result.message).toContain('Server is down');
      expect(result.message).toContain('Error loading data');
    });
  });

  describe('Toast Methods', () => {
    describe('showErrorToast()', () => {
      it('shows error toast with default message', () => {
        const error = new ApiErrorClass('Error message', 400, ErrorTypes.VALIDATION_ERROR);

        ErrorHandler.showErrorToast(error);

        expect(mockToast.error).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object)
        );
      });

      it('shows error toast with custom message', () => {
        const error = new Error('Original error');

        ErrorHandler.showErrorToast(error, 'Custom error message');

        expect(mockToast.error).toHaveBeenCalledWith(
          'Custom error message',
          expect.any(Object)
        );
      });

      it('applies toast options', () => {
        const error = new Error('Test');
        const action = jest.fn();

        ErrorHandler.showErrorToast(error, undefined, {
          duration: 5000,
          position: 'top-right',
          dismissible: true,
          action: {
            label: 'Retry',
            onClick: action,
          },
        });

        expect(mockToast.error).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            duration: 5000,
            position: 'top-right',
            dismissible: true,
            action: {
              label: 'Retry',
              onClick: action,
            },
          })
        );
      });
    });

    describe('showSuccessToast()', () => {
      it('shows success toast with message', () => {
        ErrorHandler.showSuccessToast('Operation successful');

        expect(mockToast.success).toHaveBeenCalledWith(
          'Operation successful',
          expect.any(Object)
        );
      });

      it('applies toast options', () => {
        ErrorHandler.showSuccessToast('Success', {
          duration: 3000,
          position: 'bottom-center',
        });

        expect(mockToast.success).toHaveBeenCalledWith(
          'Success',
          expect.objectContaining({
            duration: 3000,
            position: 'bottom-center',
          })
        );
      });
    });

    describe('showWarningToast()', () => {
      it('shows warning toast with message', () => {
        ErrorHandler.showWarningToast('Warning message');

        expect(mockToast.warning).toHaveBeenCalledWith(
          'Warning message',
          expect.any(Object)
        );
      });
    });

    describe('showInfoToast()', () => {
      it('shows info toast with message', () => {
        ErrorHandler.showInfoToast('Info message');

        expect(mockToast.info).toHaveBeenCalledWith(
          'Info message',
          expect.any(Object)
        );
      });
    });
  });

  describe('handleValidationErrors()', () => {
    it('extracts validation errors from API error', () => {
      const axiosError = {
        response: {
          status: 422,
          data: {
            details: {
              validationErrors: [
                { field: 'email', message: 'Invalid email' },
                { field: 'password', message: 'Too weak' },
              ],
            },
          },
        },
      };

      const result = ErrorHandler.handleValidationErrors(axiosError);

      expect(result).toEqual({
        email: 'Invalid email',
        password: 'Too weak',
      });
    });

    it('handles validation error without details', () => {
      const error = new ApiErrorClass('Validation failed', 422, ErrorTypes.VALIDATION_ERROR);

      const result = ErrorHandler.handleValidationErrors(error);

      expect(result).toEqual({
        general: 'Validation failed',
      });
    });

    it('returns empty object for non-validation errors', () => {
      const error = new Error('Generic error');

      const result = ErrorHandler.handleValidationErrors(error);

      expect(result).toEqual({});
    });
  });

  describe('handleAndToast()', () => {
    it('handles error and shows toast', () => {
      const error = new Error('Test error');

      const result = ErrorHandler.handleAndToast(error);

      expect(result).toBeInstanceOf(ApiErrorClass);
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('applies options and shows toast', () => {
      const error = new Error('Test error');

      ErrorHandler.handleAndToast(error, {
        context: 'test context',
      });

      expect(mockTrackError).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe('Domain-Specific Error Handlers', () => {
    describe('handleAuthError()', () => {
      it('applies authentication-specific messages for 401', () => {
        const axiosError = {
          response: {
            status: 401,
            data: {},
          },
        };

        const result = ErrorHandler.handleAuthError(axiosError);

        expect(result.message).toContain('email or password is incorrect');
      });

      it('applies authentication-specific messages for 429', () => {
        const axiosError = {
          response: {
            status: 429,
            data: {},
          },
        };

        const result = ErrorHandler.handleAuthError(axiosError);

        expect(result.message).toContain('Too many login attempts');
      });
    });

    describe('handlePaymentError()', () => {
      it('applies payment-specific messages for 402', () => {
        const axiosError = {
          response: {
            status: 402,
            data: {},
          },
        };

        const result = ErrorHandler.handlePaymentError(axiosError);

        expect(result.message).toContain('card was declined');
      });

      it('applies payment-specific messages for 409', () => {
        const axiosError = {
          response: {
            status: 409,
            data: {},
          },
        };

        const result = ErrorHandler.handlePaymentError(axiosError);

        expect(result.message).toContain('payment is already in progress');
      });
    });

    describe('handleMemberError()', () => {
      it('applies member-specific messages for 409', () => {
        const axiosError = {
          response: {
            status: 409,
            data: {},
          },
        };

        const result = ErrorHandler.handleMemberError(axiosError);

        expect(result.message).toContain('member with this email already exists');
      });
    });

    describe('handleEventError()', () => {
      it('applies event-specific messages for 409', () => {
        const axiosError = {
          response: {
            status: 409,
            data: {},
          },
        };

        const result = ErrorHandler.handleEventError(axiosError);

        expect(result.message).toContain('RSVP deadline has passed');
      });

      it('applies event-specific messages for 410', () => {
        const axiosError = {
          response: {
            status: 410,
            data: {},
          },
        };

        const result = ErrorHandler.handleEventError(axiosError);

        expect(result.message).toContain('event link has expired');
      });
    });

    describe('handleChatError()', () => {
      it('applies chat-specific messages for 413', () => {
        const axiosError = {
          response: {
            status: 413,
            data: {},
          },
        };

        const result = ErrorHandler.handleChatError(axiosError);

        expect(result.message).toContain('message is too long');
      });

      it('applies chat-specific messages for 429', () => {
        const axiosError = {
          response: {
            status: 429,
            data: {},
          },
        };

        const result = ErrorHandler.handleChatError(axiosError);

        expect(result.message).toContain('sending messages too quickly');
      });
    });

    describe('handleBillingError()', () => {
      it('applies billing-specific messages for 402', () => {
        const axiosError = {
          response: {
            status: 402,
            data: {},
          },
        };

        const result = ErrorHandler.handleBillingError(axiosError);

        expect(result.message).toContain('Payment failed');
      });

      it('applies billing-specific messages for 503', () => {
        const axiosError = {
          response: {
            status: 503,
            data: {},
          },
        };

        const result = ErrorHandler.handleBillingError(axiosError);

        expect(result.message).toContain('Payment processing is not currently available');
      });
    });

    describe('handlePushNotificationError()', () => {
      it('applies push notification messages for 500', () => {
        const axiosError = {
          response: {
            status: 500,
            data: {},
          },
        };

        const result = ErrorHandler.handlePushNotificationError(axiosError);

        expect(result.message).toContain('No members have registered devices');
      });
    });
  });
});

describe('HookErrorHandler', () => {
  describe('handleDataFetchError()', () => {
    it('returns user-friendly message for network error', () => {
      const error = new ApiErrorClass('Network failed', 0, ErrorTypes.NETWORK_ERROR);

      const result = HookErrorHandler.handleDataFetchError(error, 'members');

      expect(result).toContain('check your internet connection');
      expect(result).toContain('members');
    });

    it('returns user-friendly message for authentication error', () => {
      const error = new ApiErrorClass('Not authenticated', 401, ErrorTypes.AUTHENTICATION_ERROR);

      const result = HookErrorHandler.handleDataFetchError(error, 'events');

      expect(result).toContain('log in again');
      expect(result).toContain('events');
    });

    it('returns user-friendly message for authorization error', () => {
      const error = new ApiErrorClass('Forbidden', 403, ErrorTypes.AUTHORIZATION_ERROR);

      const result = HookErrorHandler.handleDataFetchError(error, 'billing');

      expect(result).toContain("don't have permission");
      expect(result).toContain('billing');
    });

    it('returns user-friendly message for not found error', () => {
      const error = new ApiErrorClass('Not found', 404, ErrorTypes.NOT_FOUND_ERROR);

      const result = HookErrorHandler.handleDataFetchError(error, 'event');

      expect(result).toContain('Event not found');
    });

    it('returns user-friendly message for server error', () => {
      const error = new ApiErrorClass('Server error', 500, ErrorTypes.SERVER_ERROR);

      const result = HookErrorHandler.handleDataFetchError(error, 'data');

      expect(result).toContain('server error');
    });

    it('returns default message for unknown error', () => {
      const error = new Error('Unknown');

      const result = HookErrorHandler.handleDataFetchError(error);

      expect(result).toContain('Failed to load data');
    });
  });

  describe('handleFormSubmissionError()', () => {
    it('returns validation message for validation error', () => {
      const error = new ApiErrorClass('Validation failed', 422, ErrorTypes.VALIDATION_ERROR);

      const result = HookErrorHandler.handleFormSubmissionError(error, 'submit');

      expect(result).toContain('check your input');
    });

    it('returns network message for network error', () => {
      const error = new ApiErrorClass('Network failed', 0, ErrorTypes.NETWORK_ERROR);

      const result = HookErrorHandler.handleFormSubmissionError(error, 'save');

      expect(result).toContain('check your internet connection');
      expect(result).toContain('save');
    });

    it('returns conflict message for conflict error', () => {
      const error = new ApiErrorClass('Conflict', 409, ErrorTypes.CONFLICT_ERROR);

      const result = HookErrorHandler.handleFormSubmissionError(error);

      expect(result).toContain('conflicts with existing data');
    });

    it('returns default message for unknown error', () => {
      const error = new Error('Unknown');

      const result = HookErrorHandler.handleFormSubmissionError(error, 'delete');

      expect(result).toContain('Failed to delete');
    });
  });
});
