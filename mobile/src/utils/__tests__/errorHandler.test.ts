import { ErrorHandler } from '../errorHandler';
import { ERROR_MESSAGES } from '@/constants';
import { suppressConsoleErrors, createMockError, createMockNetworkError } from '../../test-utils/test-helpers';

describe('ErrorHandler', () => {
  describe('handleAuthError', () => {
    it('should handle 401 authentication errors (session expired)', async () => {
      const error = createMockError(401, 'Token expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(result.code).toBe('AUTH_SESSION_EXPIRED');
      expect(result.context).toBe('Login');
      expect(result.severity).toBe('high');
    });

    it('should handle 401 invalid credentials errors', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            detail: 'Invalid email or password.',
            title: 'Authentication Failed',
            status: 401
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(result.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(result.context).toBe('Login');
      expect(result.severity).toBe('medium');
    });

    it('should handle 401 account configuration errors', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'User account is not properly configured',
            status: 401
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toContain('account requires additional setup');
      expect(result.code).toBe('AUTH_ACCOUNT_CONFIGURATION');
      expect(result.severity).toBe('high');
    });

    it('should handle 403 account not activated errors', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            errorCode: 'ACCOUNT_NOT_ACTIVATED',
            status: 403
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe(ERROR_MESSAGES.ACCOUNT_NOT_ACTIVATED);
      expect(result.code).toBe('AUTH_ACCOUNT_NOT_ACTIVATED');
      expect(result.severity).toBe('high');
    });

    it('should handle 403 tier restriction errors', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Feature not available in your current tier',
            status: 403
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Feature Access');
      });

      expect(result.message).toBe(ERROR_MESSAGES.TIER_RESTRICTION);
      expect(result.code).toBe('AUTH_TIER_RESTRICTION');
      expect(result.severity).toBe('high');
    });

    it('should handle 403 access denied errors', async () => {
      const error = createMockError(403, 'Access denied');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Admin Panel');
      });

      expect(result.message).toBe(ERROR_MESSAGES.ACCESS_DENIED);
      expect(result.code).toBe('AUTH_ACCESS_DENIED');
      expect(result.severity).toBe('high');
    });

    it('should handle 422 validation errors with detailed messages', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['Email is invalid'],
              password: ['Password is too short']
            },
            status: 422
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Registration');
      });

      expect(result.code).toBe('AUTH_VALIDATION_ERROR');
      expect(result.severity).toBe('medium');
    });

    it('should handle 422 validation errors without detailed errors', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            status: 422
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Registration');
      });

      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe('AUTH_VALIDATION_ERROR');
    });

    it('should handle 500 server errors', async () => {
      const error = createMockError(500, 'Internal server error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SERVER_UNAVAILABLE);
      expect(result.code).toBe('AUTH_SERVER_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle network errors', async () => {
      const error = createMockNetworkError('NETWORK_ERROR', 'Network error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe(ERROR_MESSAGES.NETWORK_ERROR);
      expect(result.code).toBe('AUTH_NETWORK_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle invalid credentials', async () => {
      const error = createMockError(400, 'Invalid email or password');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(error, 'Login');
      });

      expect(result.message).toBe('Something went wrong. Please try again.');
      expect(result.code).toBe('AUTH_GENERIC_ERROR');
    });
  });

  describe('handlePaymentError', () => {
    it('should handle card declined errors', async () => {
      const error = createMockError(400, 'Your card was declined');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PAYMENT_DECLINED);
      expect(result.code).toBe('PAYMENT_DECLINED');
      expect(result.severity).toBe('medium');
    });

    it('should handle insufficient funds', async () => {
      const error = createMockError(400, 'Insufficient funds');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PAYMENT_INSUFFICIENT_FUNDS);
    });

    it('should handle expired card errors', async () => {
      const error = createMockError(400, 'Your card has expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PAYMENT_EXPIRED_CARD);
      expect(result.code).toBe('PAYMENT_EXPIRED_CARD');
    });

    it('should handle 401 payment authentication errors', async () => {
      const error = createMockError(401, 'Session expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(result.code).toBe('PAYMENT_AUTH_EXPIRED');
      expect(result.severity).toBe('high');
    });

    it('should handle 403 payment authorization errors', async () => {
      const error = createMockError(403, 'Payment not authorized');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toContain('Payment not authorized');
      expect(result.code).toBe('PAYMENT_NOT_AUTHORIZED');
      expect(result.severity).toBe('high');
    });

    it('should handle 500 payment server errors', async () => {
      const error = createMockError(500, 'Payment server error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PAYMENT_PROCESSING_ERROR);
      expect(result.code).toBe('PAYMENT_SERVER_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle Stripe API key not configured errors', async () => {
      const error = new Error('You did not provide an API key');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.STRIPE_NOT_CONFIGURED);
      expect(result.code).toBe('PAYMENT_STRIPE_NOT_CONFIGURED');
      expect(result.severity).toBe('high');
    });

    it('should handle Stripe connection errors', async () => {
      const error = new Error('Stripe connection failed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.STRIPE_CONNECTION_ERROR);
      expect(result.code).toBe('PAYMENT_STRIPE_ERROR');
    });

    it('should handle generic payment errors', async () => {
      const error = new Error('Unknown payment error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handlePaymentError(error, 'Payment Processing');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PAYMENT_FAILED);
      expect(result.code).toBe('PAYMENT_GENERIC_ERROR');
    });
  });

  describe('handleChatError', () => {
    it('should handle chat access denied', async () => {
      const error = createMockError(403, 'Chat access denied');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Chat Access');
      });

      expect(result.message).toBe('You do not have permission to access chat.');
      expect(result.code).toBe('CHAT_PERMISSIONS_ERROR');
    });

    it('should handle message sending failures', async () => {
      const error = createMockError(400, 'Message too long');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Send Message');
      });

      expect(result.message).toBe('Your message is too long. Please shorten it and try again.');
    });

    it('should handle 401 chat authentication errors', async () => {
      const error = createMockError(401, 'Session expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Chat');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(result.code).toBe('CHAT_AUTH_EXPIRED');
      expect(result.severity).toBe('high');
    });

    it('should handle 500 chat server errors', async () => {
      const error = createMockError(500, 'SignalR connection failed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Chat');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SERVER_UNAVAILABLE);
      expect(result.code).toBe('CHAT_SERVER_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle chat connection errors with connection context', async () => {
      const error = new Error('Connection failed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Chat Connection');
      });

      expect(result.message).toBe(ERROR_MESSAGES.CHAT_CONNECTION_FAILED);
      expect(result.code).toBe('CHAT_CONNECTION_FAILED');
      expect(result.severity).toBe('high');
    });

    it('should handle message sending errors with send context', async () => {
      const error = new Error('Failed to send');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Send Message');
      });

      expect(result.message).toBe(ERROR_MESSAGES.CHAT_SEND_FAILED);
      expect(result.code).toBe('CHAT_SEND_FAILED');
      expect(result.severity).toBe('medium');
    });

    it('should handle generic chat errors', async () => {
      const error = new Error('Unknown chat error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleChatError(error, 'Chat');
      });

      expect(result.message).toBe(ERROR_MESSAGES.CHAT_LOAD_FAILED);
      expect(result.code).toBe('CHAT_GENERIC_ERROR');
    });
  });

  describe('handleDirectoryError', () => {
    it('should handle directory access denied', async () => {
      const error = createMockError(403, 'Directory access not allowed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory Access');
      });

      expect(result.message).toBe('You do not have permission to view the member directory.');
      expect(result.code).toBe('DIRECTORY_PERMISSIONS_ERROR');
    });

    it('should handle 401 directory authentication errors', async () => {
      const error = createMockError(401, 'Session expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(result.code).toBe('DIRECTORY_AUTH_EXPIRED');
      expect(result.severity).toBe('high');
    });

    it('should handle directory search failures with search context', async () => {
      const error = new Error('Search failed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory Search');
      });

      expect(result.message).toBe(ERROR_MESSAGES.DIRECTORY_SEARCH_FAILED);
      expect(result.code).toBe('DIRECTORY_SEARCH_FAILED');
      expect(result.severity).toBe('medium');
    });

    it('should handle directory settings errors with settings context', async () => {
      const error = new Error('Settings update failed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory Settings');
      });

      expect(result.message).toBe(ERROR_MESSAGES.DIRECTORY_SETTINGS_FAILED);
      expect(result.code).toBe('DIRECTORY_SETTINGS_FAILED');
      expect(result.severity).toBe('medium');
    });

    it('should handle 500 directory server errors', async () => {
      const error = createMockError(500, 'Directory service unavailable');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SERVER_UNAVAILABLE);
      expect(result.code).toBe('DIRECTORY_SERVER_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle generic directory errors', async () => {
      const error = new Error('Unknown directory error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleDirectoryError(error, 'Directory');
      });

      expect(result.message).toBe(ERROR_MESSAGES.DIRECTORY_LOAD_FAILED);
      expect(result.code).toBe('DIRECTORY_GENERIC_ERROR');
    });
  });

  describe('handleEventError', () => {
    it('should handle RSVP deadline passed', async () => {
      const error = createMockError(400, 'RSVP deadline has passed');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'RSVP');
      });

      expect(result.message).toBe(ERROR_MESSAGES.RSVP_DEADLINE_PASSED);
      expect(result.code).toBe('EVENT_RSVP_DEADLINE_PASSED');
    });

    it('should handle event not found errors', async () => {
      const error = createMockError(404, 'Event not found');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event Access');
      });

      expect(result.message).toBe(ERROR_MESSAGES.EVENT_NOT_FOUND);
      expect(result.code).toBe('EVENT_NOT_FOUND');
      expect(result.severity).toBe('medium');
    });

    it('should handle event full errors', async () => {
      const error = createMockError(400, 'Event is at capacity');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'RSVP');
      });

      expect(result.message).toBe(ERROR_MESSAGES.EVENT_FULL);
      expect(result.code).toBe('EVENT_FULL');
      expect(result.severity).toBe('medium');
    });

    it('should handle 401 event authentication errors', async () => {
      const error = createMockError(401, 'Session expired');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event RSVP');
      });

      expect(result.message).toBe('Authentication required. Please login again.');
      expect(result.code).toBe('EVENT_AUTH_REQUIRED');
      expect(result.severity).toBe('high');
    });

    it('should handle 403 event access denied errors', async () => {
      const error = createMockError(403, 'Event access restricted');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event Access');
      });

      expect(result.message).toBe('Access denied. You do not have permission to view events.');
      expect(result.code).toBe('EVENT_ACCESS_DENIED');
      expect(result.severity).toBe('high');
    });

    it('should handle RSVP errors with RSVP context', async () => {
      const error = new Error('Failed to save RSVP');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event RSVP');
      });

      expect(result.message).toBe(ERROR_MESSAGES.RSVP_FAILED);
      expect(result.code).toBe('EVENT_RSVP_FAILED');
      expect(result.severity).toBe('medium');
    });

    it('should handle 500 event server errors', async () => {
      const error = createMockError(500, 'Event service unavailable');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SERVER_UNAVAILABLE);
      expect(result.code).toBe('EVENT_SERVER_ERROR');
      expect(result.severity).toBe('high');
    });

    it('should handle generic event errors with load context', async () => {
      const error = new Error('Unknown event error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Load Event');
      });

      expect(result.message).toBe(ERROR_MESSAGES.EVENTS_LOAD_FAILED);
      expect(result.code).toBe('EVENT_GENERIC_ERROR');
    });

    it('should handle generic event errors without load context', async () => {
      const error = new Error('Unknown event error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleEventError(error, 'Event');
      });

      expect(result.message).toBe(ERROR_MESSAGES.EVENT_LOAD_FAILED);
      expect(result.code).toBe('EVENT_GENERIC_ERROR');
    });
  });

  describe('Network and Generic Errors', () => {
    it('should handle network timeout errors', async () => {
      const error = createMockNetworkError('ECONNABORTED', 'timeout of 10000ms exceeded');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleApiError(error, 'API Call');
      });
      
      expect(result.message).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
      expect(result.code).toBe('API_TIMEOUT');
      expect(result.severity).toBe('medium');
    });

    it('should handle connection refused errors', async () => {
      const error = createMockNetworkError('ECONNREFUSED');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleApiError(error, 'API Call');
      });
      
      expect(result.message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
      expect(result.code).toBe('API_NETWORK_ERROR');
    });

    it('should handle unknown errors gracefully', async () => {
      const error = 'Some random error';

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleApiError(error, 'Unknown Operation');
      });
      
      expect(result.message).toBe(ERROR_MESSAGES.GENERIC_ERROR);
      expect(result.code).toBe('API_GENERIC_ERROR');
      expect(result.severity).toBe('medium');
    });
  });

  describe('handleProfileError', () => {
    it('should handle 404 profile not found errors', async () => {
      const error = createMockError(404, 'Profile not found');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PROFILE_NOT_FOUND);
      expect(result.code).toBe('PROFILE_NOT_FOUND');
      expect(result.category).toBe('data');
      expect(result.severity).toBe('high');
      expect(result.userAction).toBe('Please contact your club admin.');
    });

    it('should handle 401 session expired errors', async () => {
      const error = createMockError(401, 'Unauthorized');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(result.code).toBe('PROFILE_AUTH_EXPIRED');
      expect(result.category).toBe('authentication');
      expect(result.severity).toBe('high');
      expect(result.userAction).toBe('Please log in again.');
    });

    it('should handle 422 validation errors with errors object', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              firstName: ['First name is required'],
              lastName: ['Last name is required']
            }
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe('First name is required');
      expect(result.code).toBe('PROFILE_VALIDATION_ERROR');
      expect(result.category).toBe('validation');
      expect(result.severity).toBe('medium');
      expect(result.userAction).toBe('Please check your input and try again.');
    });

    it('should handle 422 validation errors with nested array format', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email field is required', 'The email must be valid']
            }
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe('The email field is required');
      expect(result.code).toBe('PROFILE_VALIDATION_ERROR');
    });

    it('should handle 422 validation errors with empty errors object', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {}
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
      expect(result.code).toBe('PROFILE_VALIDATION_ERROR');
    });

    it('should handle 422 invalid phone number errors', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Invalid phone number format'
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe(ERROR_MESSAGES.INVALID_PHONE_NUMBER);
      expect(result.code).toBe('PROFILE_INVALID_PHONE');
      expect(result.category).toBe('validation');
      expect(result.userAction).toBe('Please enter a valid phone number.');
    });

    it('should handle 422 invalid email errors', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Email address is invalid'
          }
        }
      };

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
      expect(result.code).toBe('PROFILE_INVALID_EMAIL');
      expect(result.category).toBe('validation');
      expect(result.userAction).toBe('Please enter a valid email address.');
    });

    it('should handle 500 server errors', async () => {
      const error = createMockError(500, 'Internal server error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile');
      });

      expect(result.message).toBe(ERROR_MESSAGES.SERVER_UNAVAILABLE);
      expect(result.code).toBe('PROFILE_SERVER_ERROR');
      expect(result.category).toBe('system');
      expect(result.severity).toBe('high');
      expect(result.userAction).toBe('Please try again later.');
    });

    it('should handle profile update failures with update context', async () => {
      const error = new Error('Network error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Update');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
      expect(result.code).toBe('PROFILE_UPDATE_FAILED');
      expect(result.category).toBe('data');
      expect(result.severity).toBe('medium');
      expect(result.userAction).toBe('Please check your information and try again.');
    });

    it('should handle profile update failures with save context', async () => {
      const error = new Error('Network error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Save Profile');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
      expect(result.code).toBe('PROFILE_UPDATE_FAILED');
    });

    it('should handle generic profile load failures', async () => {
      const error = new Error('Unknown error');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleProfileError(error, 'Profile Load');
      });

      expect(result.message).toBe(ERROR_MESSAGES.PROFILE_LOAD_FAILED);
      expect(result.code).toBe('PROFILE_GENERIC_ERROR');
      expect(result.category).toBe('data');
    });
  });

  describe('Utility Methods', () => {
    it('should determine if logout is needed', async () => {
      const unauthorizedError = createMockError(401, 'Unauthorized');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleAuthError(unauthorizedError, 'Test');
      });
      expect(ErrorHandler.shouldLogout(result)).toBe(true);
    });

    it('should determine if retry is possible', async () => {
      const networkError = createMockNetworkError('ECONNREFUSED');

      const result = await suppressConsoleErrors(() => {
        return ErrorHandler.handleApiError(networkError, 'Test');
      });
      expect(ErrorHandler.shouldRetry(result)).toBe(true);

      const validationError = createMockError(400, 'Validation failed');

      const validationResult = await suppressConsoleErrors(() => {
        return ErrorHandler.handleApiError(validationError, 'Test');
      });
      expect(ErrorHandler.shouldRetry(validationResult)).toBe(false);
    });
  });
}); 