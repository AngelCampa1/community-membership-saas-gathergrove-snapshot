// Error types and interfaces for consistent error handling across the application

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormErrors {
  [key: string]: string | string[];
}

export interface ErrorResponse {
  message: string;
  errors?: ValidationError[];
  code?: string;
  status: number;
}

// Error types for different categories
export enum ErrorTypes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom error class for API errors
export class ApiErrorClass extends Error {
  public status: number;
  public code?: string;
  public details?: Record<string, unknown>;
  public type: ErrorTypes;

  constructor(
    message: string,
    status: number,
    type: ErrorTypes = ErrorTypes.UNKNOWN_ERROR,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

// User-friendly error messages for common scenarios
export const ERROR_MESSAGES = {
  NETWORK: {
    OFFLINE: 'You appear to be offline. Please check your internet connection and try again.',
    TIMEOUT: 'The request is taking longer than expected. Please try again.',
    CONNECTION_FAILED: 'Unable to connect to the server. Please try again in a moment.',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    ACCESS_DENIED: 'You don\'t have permission to perform this action.',
    ACCOUNT_LOCKED: 'Your account has been temporarily locked. Please contact support@gathergrove.club.',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    PASSWORD_TOO_SHORT: 'Password must be at least 12 characters long.',
    PASSWORDS_DONT_MATCH: 'Passwords don\'t match.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    INVALID_DATE: 'Please enter a valid date.',
  },
  PAYMENT: {
    CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
    INSUFFICIENT_FUNDS: 'Your card has insufficient funds. Please try a different payment method.',
    EXPIRED_CARD: 'Your card has expired. Please use a different payment method.',
    INVALID_CARD: 'The card information you entered is invalid. Please check and try again.',
    PAYMENT_FAILED: 'Payment processing failed. Please try again or use a different payment method.',
    STRIPE_ERROR: 'There was an issue with the payment processor. Please try again.',
  },
  SERVER: {
    GENERIC: 'Something went wrong on our end. Please try again in a moment.',
    MAINTENANCE: 'The system is currently undergoing maintenance. Please try again later.',
    OVERLOADED: 'The server is currently busy. Please try again in a few minutes.',
  },
  DATA: {
    NOT_FOUND: 'The requested information could not be found.',
    ALREADY_EXISTS: 'This item already exists.',
    INVALID_FORMAT: 'The data format is invalid.',
    TOO_LARGE: 'The file is too large. Please choose a smaller file.',
  }
} as const;

// Helper function to get user-friendly error message
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiErrorClass) {
    switch (error.type) {
      case ErrorTypes.NETWORK_ERROR:
        return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
      case ErrorTypes.AUTHENTICATION_ERROR:
        return error.status === 401 
          ? ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS 
          : ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
      case ErrorTypes.AUTHORIZATION_ERROR:
        return ERROR_MESSAGES.AUTH.ACCESS_DENIED;
      case ErrorTypes.PAYMENT_ERROR:
      case ErrorTypes.STRIPE_ERROR:
        return ERROR_MESSAGES.PAYMENT.PAYMENT_FAILED;
      case ErrorTypes.NOT_FOUND_ERROR:
        return ERROR_MESSAGES.DATA.NOT_FOUND;
      case ErrorTypes.SERVER_ERROR:
        return ERROR_MESSAGES.SERVER.GENERIC;
      case ErrorTypes.TIMEOUT_ERROR:
        return ERROR_MESSAGES.NETWORK.TIMEOUT;
      default:
        return error.message || ERROR_MESSAGES.SERVER.GENERIC;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.SERVER.GENERIC;
} 