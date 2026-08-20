/**
 * Timing constants used throughout the application
 * Centralized to make tuning and testing easier
 */

// Debounce and throttle timings
export const DEBOUNCE_MS = {
  SEARCH: 300,
  SCROLL: 100,
  RESIZE: 150,
  INPUT: 300,
  API_CALL: 500,
} as const;

// Scroll tracking constants
export const SCROLL = {
  NEAR_TOP_THRESHOLD: 100,          // px from top to be considered "near top"
  NEAR_BOTTOM_PERCENTAGE: 90,       // % scrolled to be considered "near bottom"
  RAPID_SCROLL_THRESHOLD: 200,      // px/interval for rapid scroll detection
  TRACKING_DEBOUNCE_MS: 100,
} as const;

// Exit intent detection
export const EXIT_INTENT = {
  MINIMUM_TIME_ON_PAGE_MS: 30000,   // 30 seconds minimum before triggering
  MOUSE_SENSITIVITY_PX: 50,          // How close to top edge triggers exit
  MOBILE_SCROLL_THRESHOLD: 0.4,      // 40% scroll threshold for mobile
  MOBILE_CHECK_INTERVAL_MS: 5000,    // Check every 5 seconds on mobile
} as const;

// Service worker and PWA
export const PWA = {
  UPDATE_CHECK_INTERVAL_MS: 60000,   // Check for updates every minute
  CACHE_EXPIRY_MS: 86400000,         // 24 hours
  OFFLINE_RETRY_DELAY_MS: 5000,      // Retry failed requests after 5 seconds
} as const;

// Animation and transition timings
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Toast/notification display times
export const NOTIFICATION = {
  SUCCESS_DURATION_MS: 3000,
  ERROR_DURATION_MS: 5000,
  INFO_DURATION_MS: 4000,
  WARNING_DURATION_MS: 4000,
} as const;

// Session and timeout constants
export const SESSION = {
  IDLE_TIMEOUT_MS: 1800000,          // 30 minutes
  WARNING_BEFORE_TIMEOUT_MS: 300000, // 5 minutes warning
  HEARTBEAT_INTERVAL_MS: 60000,      // Send heartbeat every minute
} as const;

// Polling intervals
export const POLLING = {
  FAST: 1000,        // 1 second (real-time data)
  NORMAL: 5000,      // 5 seconds (frequent updates)
  SLOW: 30000,       // 30 seconds (periodic updates)
  VERY_SLOW: 60000,  // 1 minute (background updates)
} as const;

// SignalR connection settings
export const SIGNALR = {
  BASE_RETRY_DELAY_MS: 1000,           // Base delay for exponential backoff
  MAX_RECONNECT_ATTEMPTS: 5,           // Maximum reconnection attempts
  RETRY_DELAYS: [0, 2000, 10000, 30000] as readonly number[], // Custom retry delays
} as const;

// Engagement tracking
export const ENGAGEMENT = {
  REFRESH_INTERVAL_MS: 30000,          // 30 seconds - refresh engagement metrics
  MEMORY_MONITORING_INTERVAL_MS: 5000, // 5 seconds - monitor memory usage
  PERFORMANCE_STATS_INTERVAL_MS: 2000, // 2 seconds - collect performance stats
} as const;

// Performance monitoring
export const PERFORMANCE = {
  MEMORY_CHECK_INTERVAL_MS: 5000,      // 5 seconds - check memory usage
  METRICS_COLLECTION_INTERVAL_MS: 2000, // 2 seconds - collect metrics
  REPORT_INTERVAL_MS: 60000,            // 1 minute - generate reports
} as const;
