/**
 * Get the API base URL - always points to production for development testing
 */
function getApiBaseUrl(): string {
  return 'https://api.gathergrove.club';
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    CURRENT_SESSION: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    MEMBER_PROFILE: (clubId: number) => `/api/v1/clubs/${clubId}/members/me`,
    EVENTS: (clubId: number) => `/api/v1/clubs/${clubId}/events`,
    DEVICE_TOKENS: '/api/v1/users/me/device-tokens',
    MEMBERSHIP_CARD: '/api/v1/users/me/membership-card',
    // SSO Endpoints
    SSO_GOOGLE: '/api/v1/auth/google',
    SSO_APPLE: '/api/v1/auth/apple',
    SSO_LINKED_PROVIDERS: '/api/v1/auth/linked-providers',
    SSO_LINK_PROVIDER: '/api/v1/auth/link-provider',
    SSO_UNLINK_PROVIDER: (provider: string) => `/api/v1/auth/unlink-provider/${provider}`,
    SSO_SET_PASSWORD: '/api/v1/auth/set-password',
    // Analytics Endpoints
    EVENT_ENGAGEMENT_ANALYTICS: (clubId: number, eventId: number) => `/api/v1/clubs/${clubId}/events/${eventId}/engagement-analytics`,
    MEMBER_ENGAGEMENT_INSIGHTS: (clubId: number) => `/api/v1/clubs/${clubId}/members/engagement-insights`,
    EVENT_PERFORMANCE_ANALYSIS: (clubId: number, eventId: number) => `/api/v1/clubs/${clubId}/events/${eventId}/performance-analysis`,
    EVENT_ROI_METRICS: (clubId: number) => `/api/v1/clubs/${clubId}/analytics/roi-metrics`,
    BASIC_EVENT_ANALYTICS: (clubId: number, eventId: number) => `/api/v1/clubs/${clubId}/events/${eventId}/analytics`,
  },
  TIMEOUT: 10000, // 10 seconds
};

// Debug: Log the API URL being used in development
if (__DEV__) {
  /* API URL logging disabled in production */
}

// Keychain Configuration
export const KEYCHAIN_CONFIG = {
  SERVICE_NAME: 'GatherGrove',
  TOKEN_KEY: 'jwt_token',
};

// App Constants
export const APP_CONFIG = {
  NAME: 'GatherGrove',
  VERSION: '0.1.0',
  SUPPORTED_CLUB_TIERS: ['Grow', 'Expand', 'Unlimited'], // Unlimited is kept for legacy clubs
};

// Comprehensive Error Messages with context and actionable guidance
export const ERROR_MESSAGES = {
  // Network & Connection Errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  CONNECTION_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request took too long to complete. Please check your connection and try again.',
  SERVER_UNAVAILABLE: 'The server is temporarily unavailable. Please try again in a few minutes.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  
  // Authentication Errors
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please check your credentials and try again.',
  ACCOUNT_NOT_ACTIVATED: 'Your account has not been activated yet. Please check your email for the activation link.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again to continue.',
  TOKEN_INVALID: 'Your login session is no longer valid. Please log in again.',
  
  // Authorization Errors
  ACCESS_DENIED: 'You do not have permission to access this feature. Please contact your club admin.',
  TIER_RESTRICTION: 'Your club must be on a paid tier to use the mobile app. Please contact your club admin to upgrade.',
  MEMBER_ONLY_FEATURE: 'This feature is only available to club members.',
  ADMIN_ONLY_FEATURE: 'This feature is only available to club administrators.',
  
  // Profile & Member Data Errors
  PROFILE_NOT_FOUND: 'Your member profile could not be found. Please contact your club admin.',
  PROFILE_UPDATE_FAILED: 'Unable to update your profile. Please check your information and try again.',
  PROFILE_LOAD_FAILED: 'Unable to load your profile information. Please try refreshing the app.',
  INVALID_PHONE_NUMBER: 'Please enter a valid phone number.',
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
  
  // Payment & Dues Errors
  PAYMENT_FAILED: 'Your payment could not be processed. Please check your payment method and try again.',
  PAYMENT_DECLINED: 'Your payment was declined. Please try a different payment method or contact your bank.',
  PAYMENT_INSUFFICIENT_FUNDS: 'Your payment was declined due to insufficient funds. Please try a different payment method.',
  PAYMENT_EXPIRED_CARD: 'Your payment method has expired. Please update your payment information.',
  PAYMENT_INVALID_CARD: 'The payment information you entered is invalid. Please check your card details.',
  PAYMENT_PROCESSING_ERROR: 'There was an error processing your payment. Please try again or contact support@gathergrove.club.',
  STRIPE_CONNECTION_ERROR: 'Unable to connect to payment services. Please try again later.',
  STRIPE_NOT_CONFIGURED: 'Payment processing is not available. Your club administrator needs to set up Stripe payment credentials.',
  DUES_CALCULATION_ERROR: 'Unable to calculate your dues amount. Please contact your club admin.',
  
  // Events Errors
  EVENT_NOT_FOUND: 'The event you are looking for could not be found. It may have been deleted or moved.',
  EVENT_LOAD_FAILED: 'Unable to load event information. Please try refreshing the screen.',
  EVENTS_LOAD_FAILED: 'Unable to load events. Please check your connection and try again.',
  RSVP_FAILED: 'Unable to save your RSVP. Please try again.',
  RSVP_DEADLINE_PASSED: 'The RSVP deadline for this event has passed.',
  EVENT_FULL: 'This event is at full capacity and no longer accepting RSVPs.',
  
  // Directory Errors
  DIRECTORY_NOT_ENABLED: 'The member directory is not enabled for your club. Please contact your club admin.',
  DIRECTORY_LOAD_FAILED: 'Unable to load the member directory. Please try refreshing the screen.',
  DIRECTORY_SEARCH_FAILED: 'Unable to search the directory. Please try again.',
  DIRECTORY_SETTINGS_FAILED: 'Unable to save your directory settings. Please try again.',
  DIRECTORY_PERMISSIONS_ERROR: 'You do not have permission to view the member directory.',
  
  // Chat Errors
  CHAT_NOT_ENABLED: 'Chat is not enabled for your club. Please contact your club admin.',
  CHAT_LOAD_FAILED: 'Unable to load chat messages. Please try refreshing the screen.',
  CHAT_SEND_FAILED: 'Unable to send your message. Please check your connection and try again.',
  CHAT_CONNECTION_FAILED: 'Unable to connect to chat. Please check your connection and try again.',
  CHAT_PERMISSIONS_ERROR: 'You do not have permission to access chat.',
  MESSAGE_TOO_LONG: 'Your message is too long. Please shorten it and try again.',
  MESSAGE_EMPTY: 'Please enter a message before sending.',
  
  // Membership Card Errors
  MEMBERSHIP_CARD_LOAD_FAILED: 'Unable to load your membership card. Please try refreshing the screen.',
  MEMBERSHIP_CARD_EXPIRED: 'Your membership has expired. Please contact your club admin or pay your dues.',
  MEMBERSHIP_INACTIVE: 'Your membership is currently inactive. Please contact your club admin.',
  
  // Form Validation Errors
  FIELD_REQUIRED: 'This field is required.',
  EMAIL_REQUIRED: 'Email address is required.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_INPUT: 'Please check your input and try again.',
  
  // Data Loading Errors
  DATA_LOAD_FAILED: 'Unable to load data. Please try refreshing the screen.',
  DATA_SAVE_FAILED: 'Unable to save changes. Please try again.',
  DATA_SYNC_FAILED: 'Unable to sync data. Please check your connection.',
  
  // Push Notification Errors
  NOTIFICATION_PERMISSION_DENIED: 'Push notifications are disabled. Please enable them in your device settings to receive important updates.',
  NOTIFICATION_SETUP_FAILED: 'Unable to set up push notifications. You may not receive important updates.',
  
  // File & Media Errors
  FILE_TOO_LARGE: 'The file you selected is too large. Please choose a smaller file.',
  FILE_INVALID_TYPE: 'The file type you selected is not supported.',
  PHOTO_UPLOAD_FAILED: 'Unable to upload photo. Please try again.',
  
  // Generic Errors
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. If this continues, please contact support@gathergrove.club.',
  FEATURE_UNAVAILABLE: 'This feature is temporarily unavailable. Please try again later.',
  MAINTENANCE_MODE: 'The app is currently undergoing maintenance. Please try again later.',
  
  // Validation Errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  MISSING_REQUIRED_FIELDS: 'Please fill in all required fields.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_TIME: 'Please enter a valid time.',
  
  // Club-specific Errors
  CLUB_NOT_FOUND: 'Your club information could not be found. Please contact support@gathergrove.club.',
  CLUB_INACTIVE: 'Your club is currently inactive. Please contact your club admin.',
  CLUB_SUSPENDED: 'Your club has been suspended. Please contact support@gathergrove.club.',
  
  // Custom Field Errors
  CUSTOM_FIELD_ERROR: 'Unable to save custom field information. Please try again.',
  CUSTOM_FIELD_VALIDATION_ERROR: 'Please check the custom field values and try again.',
};

// Error severity levels for different types of errors
export const ERROR_SEVERITY = {
  LOW: 'low',        // Non-critical errors that don't block user flow
  MEDIUM: 'medium',  // Errors that affect functionality but have workarounds
  HIGH: 'high',      // Critical errors that block user flow
  CRITICAL: 'critical' // System-level errors requiring immediate attention
} as const;

export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];

// Error categories for better error handling and analytics
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication', 
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  PAYMENT: 'payment',
  DATA: 'data',
  SYSTEM: 'system',
  USER_INPUT: 'user_input'
} as const;

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES]; 
