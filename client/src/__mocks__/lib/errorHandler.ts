// Mock ErrorHandler class that matches the original structure
export class ErrorHandler {
  // Core error handling methods
  static handleApiError = jest.fn();
  static handleApiErrorAsync = jest.fn();
  static parseError = jest.fn();
  static handleAndToast = jest.fn();
  static handleValidationErrors = jest.fn(() => ({}));

  // Toast methods
  static showErrorToast = jest.fn();
  static showSuccessToast = jest.fn();
  static showWarningToast = jest.fn();
  static showInfoToast = jest.fn();

  // Domain-specific error handlers
  static handleAuthError = jest.fn();
  static handlePaymentError = jest.fn();
  static handleMemberError = jest.fn();
  static handleEventError = jest.fn();
  static handleChatError = jest.fn();
  static handleBillingError = jest.fn();
  static handlePushNotificationError = jest.fn();
}

// Hook error handler class mock
export class HookErrorHandler {
  static handleDataFetchError = jest.fn();
  static handleFormSubmissionError = jest.fn();
}

// Individual toast functions for backward compatibility
export const showErrorToast = jest.fn();
export const showSuccessToast = jest.fn();
export const showWarningToast = jest.fn();
export const showInfoToast = jest.fn();