/**
 * Network Error Handler Service
 * Provides comprehensive error handling for network failures,
 * retry mechanisms, and user-friendly error messages
 */

import { Platform } from 'react-native';
import { cacheService } from './cacheService';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkError extends Error {
  code?: string;
  status?: number;
  timeout?: boolean;
  offline?: boolean;
  retryable?: boolean;
  userMessage?: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: NetworkError) => boolean;
}

export interface ErrorHandlerConfig {
  enableOfflineQueue: boolean;
  showUserNotifications: boolean;
  enableAutomaticRetry: boolean;
  defaultRetryConfig: RetryConfig;
  customErrorMessages: Record<string, string>;
}

// Type for queued offline requests
interface QueuedRequest<T = unknown> {
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: NetworkError) => void;
  timestamp: number;
}

// Type for window with gtag analytics
interface WindowWithGtag extends Window {
  gtag?: (
    command: string,
    eventName: string,
    params: Record<string, unknown>
  ) => void;
}

class NetworkErrorHandlerService {
  private config: ErrorHandlerConfig;
  private offlineQueue: QueuedRequest[] = [];
  private isOnline = true;
  private retryAttempts = new Map<string, number>();

  // MEM-08 fix: Store listener cleanup references
  private netInfoUnsubscribe: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  // RACE-02 fix: Use Promise-based lock for queue operations
  private queueLock: Promise<void> = Promise.resolve();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      enableOfflineQueue: true,
      showUserNotifications: true,
      enableAutomaticRetry: true,
      defaultRetryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryCondition: (error) => this.isRetryableError(error),
      },
      customErrorMessages: {
        'NETWORK_ERROR': 'Please check your internet connection and try again.',
        'TIMEOUT_ERROR': 'The request timed out. Please try again.',
        'SERVER_ERROR': 'Server is temporarily unavailable. Please try again later.',
        'AUTH_ERROR': 'Your session has expired. Please log in again.',
        'NOT_FOUND': 'The requested resource was not found.',
        'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
        'OFFLINE': 'You are currently offline. Your request will be processed when you reconnect.',
      },
      ...config,
    };

    this.initNetworkMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private async initNetworkMonitoring(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // MEM-08 fix: Store handler references for cleanup
        this.onlineHandler = this.handleOnline.bind(this);
        this.offlineHandler = this.handleOffline.bind(this);
        window.addEventListener('online', this.onlineHandler);
        window.addEventListener('offline', this.offlineHandler);
        this.isOnline = navigator.onLine;
      } else {
        // React Native network monitoring
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected ?? true;

        // MEM-08 fix: Store unsubscribe function for cleanup
        this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
          const wasOffline = !this.isOnline;
          this.isOnline = state.isConnected ?? false;

          if (wasOffline && this.isOnline) {
            this.handleOnline();
          } else if (!wasOffline && !this.isOnline) {
            this.handleOffline();
          }
        });
      }

    } catch (error) {
      // Error: ('[NetworkErrorHandler] Network monitoring init failed:', error);
      // Assume online if monitoring fails
      this.isOnline = true;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    // Log: ('[NetworkErrorHandler] Device is offline - queuing requests');
  }

  /**
   * Main error handling method
   */
  async handleError(
    error: unknown,
    context?: string
  ): Promise<NetworkError> {
    const networkError = this.normalizeError(error, context);
    

    // Log error for analytics
    this.logError(networkError, context);

    // Handle offline errors
    if (!this.isOnline || networkError.offline) {
      networkError.offline = true;
      networkError.userMessage = this.config.customErrorMessages.OFFLINE;
      return networkError;
    }

    // Show user notification if enabled
    if (this.config.showUserNotifications) {
      this.showErrorNotification(networkError);
    }

    return networkError;
  }

  /**
   * Execute request with error handling and retry logic
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    context?: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config.defaultRetryConfig, ...retryConfig };
    const requestId = this.generateRequestId(context || 'unknown');

    // If offline and offline queue is enabled, queue the request
    if (!this.isOnline && this.config.enableOfflineQueue) {
      return this.queueOfflineRequest(requestFn, context);
    }

    let lastError: NetworkError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Reset retry count on success
        this.retryAttempts.delete(requestId);
        
        const result = await requestFn();

        if (attempt > 0) {
          /* Request succeeded after retry */
        }

        return result;
      } catch (error) {
        lastError = await this.handleError(error, context);
        
        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === config.maxRetries || !config.retryCondition?.(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        if (__DEV__) {
          // Log: (`[NetworkErrorHandler] Retrying request (attempt ${attempt + 1}/${config.maxRetries})`);
        }

        // Store retry attempt
        this.retryAttempts.set(requestId, attempt + 1);
        
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Queue request for offline processing
   * RACE-02 fix: Use lock to prevent concurrent queue modifications
   */
  private queueOfflineRequest<T>(
    requestFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // RACE-02 fix: Wrap queue operations in lock
      this.queueLock = this.queueLock.then(() => {
        this.offlineQueue.push({
          request: requestFn as () => Promise<unknown>,
          resolve: resolve as (value: unknown) => void,
          reject,
          timestamp: Date.now(),
        });

        if (__DEV__ && context) {
          // Log: (`[NetworkErrorHandler] Queued offline request for: ${context}`);
        }

        // Cleanup old queued requests (older than 1 hour)
        const cutoff = Date.now() - 60 * 60 * 1000;
        this.offlineQueue = this.offlineQueue.filter(item => item.timestamp > cutoff);
      }).catch((error) => {
        if (__DEV__) {
          console.warn('[NetworkErrorHandler] Queue operation error:', error);
        }
      });
    });
  }

  /**
   * Process queued offline requests when connection is restored
   * RACE-02 fix: Use lock to prevent concurrent queue modifications
   */
  private processOfflineQueue(): Promise<void> {
    // RACE-02 fix: Chain onto lock to serialize queue access
    this.queueLock = this.queueLock.then(async () => {
      if (this.offlineQueue.length === 0) {
        return;
      }

      // Log: (`[NetworkErrorHandler] Processing ${this.offlineQueue.length} queued offline requests`);

      // Copy and clear queue atomically within the lock
      const queue = [...this.offlineQueue];
      this.offlineQueue = [];

      for (const item of queue) {
        try {
          const result = await item.request();
          item.resolve(result);
        } catch (error) {
          const networkError = await this.handleError(error, 'offline_queue');
          item.reject(networkError);
        }
      }

      // Log: ('[NetworkErrorHandler] Offline queue processing complete');
    }).catch((error) => {
      if (__DEV__) {
        console.warn('[NetworkErrorHandler] Queue processing error:', error);
      }
    });

    return this.queueLock;
  }

  /**
   * Normalize various error types into NetworkError
   */
  private normalizeError(error: unknown, context?: string): NetworkError {
    const networkError: NetworkError = new Error() as NetworkError;
    
    if (error instanceof Error) {
      networkError.message = error.message;
      networkError.name = error.name;
      networkError.stack = error.stack;
    } else {
      networkError.message = String(error);
    }

    if (context && __DEV__) {
      // Log: (`[NetworkErrorHandler] Normalizing error in context: ${context}`);
    }

    // Handle different error types
    // Type guard for HTTP response errors
    const hasResponse = (err: unknown): err is { response: { status: number } } => {
      return typeof err === 'object' && err !== null && 'response' in err &&
        typeof (err as { response: unknown }).response === 'object' &&
        (err as { response: unknown }).response !== null &&
        'status' in (err as { response: { status: unknown } }).response;
    };

    // Type guard for network errors with code
    const hasCode = (err: unknown): err is { code: string } => {
      return typeof err === 'object' && err !== null && 'code' in err &&
        typeof (err as { code: unknown }).code === 'string';
    };

    if (hasResponse(error)) {
      // HTTP response error
      networkError.status = error.response.status;
      networkError.code = `HTTP_${error.response.status}`;

      switch (error.response.status) {
        case 401:
        case 403:
          networkError.code = 'AUTH_ERROR';
          networkError.userMessage = this.config.customErrorMessages.AUTH_ERROR;
          networkError.retryable = false;
          break;
        case 404:
          networkError.code = 'NOT_FOUND';
          networkError.userMessage = this.config.customErrorMessages.NOT_FOUND;
          networkError.retryable = false;
          break;
        case 429:
          networkError.code = 'RATE_LIMIT';
          networkError.userMessage = this.config.customErrorMessages.RATE_LIMIT;
          networkError.retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          networkError.code = 'SERVER_ERROR';
          networkError.userMessage = this.config.customErrorMessages.SERVER_ERROR;
          networkError.retryable = true;
          break;
        default:
          networkError.retryable = error.response.status >= 500;
      }
    } else if (hasCode(error)) {
      // Network/connection error
      switch (error.code) {
        case 'ECONNREFUSED':
        case 'ENOTFOUND':
        case 'ECONNRESET':
        case 'ETIMEDOUT':
          networkError.code = 'NETWORK_ERROR';
          networkError.userMessage = this.config.customErrorMessages.NETWORK_ERROR;
          networkError.retryable = true;
          break;
        case 'ECONNABORTED':
          networkError.code = 'TIMEOUT_ERROR';
          networkError.timeout = true;
          networkError.userMessage = this.config.customErrorMessages.TIMEOUT_ERROR;
          networkError.retryable = true;
          break;
        default:
          networkError.code = error.code;
          networkError.retryable = true;
      }
    } else {
      // Generic error
      networkError.code = 'UNKNOWN_ERROR';
      networkError.retryable = true;
    }

    // Set default user message if not set
    if (!networkError.userMessage) {
      networkError.userMessage = networkError.message || 'An unexpected error occurred';
    }

    return networkError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: NetworkError): boolean {
    if (error.retryable === false) {
      return false;
    }

    // Don't retry client errors (4xx) except rate limiting
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }

    // Retry server errors (5xx), network errors, and timeouts
    return error.status === undefined || error.status >= 500 || error.timeout || error.code === 'NETWORK_ERROR';
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(error: NetworkError): void {
    if (Platform.OS === 'web') {
      // Web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Network Error', {
          body: error.userMessage,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        });
      }
    } else {
      // React Native notification would be handled by the UI layer
    }
  }

  /**
   * Log error for analytics and monitoring
   */
  private logError(error: NetworkError, context?: string): void {
    const errorData = {
      message: error.message,
      code: error.code,
      status: error.status,
      context,
      timestamp: new Date().toISOString(),
      offline: error.offline,
      retryable: error.retryable,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : `ReactNative-${Platform.OS}`,
    };

    // Log to console in development
    if (__DEV__) {
      // Log: ('[NetworkErrorHandler] Error logged:', errorData);
    }

    // Send to analytics service
    if (Platform.OS === 'web') {
      const windowWithGtag = window as WindowWithGtag;
      if (typeof windowWithGtag.gtag !== 'undefined') {
        windowWithGtag.gtag('event', 'network_error', {
          event_category: 'Error',
          event_label: error.code || 'Unknown',
          custom_map: errorData,
        });
      }
    }

    // Store in local cache for offline analysis
    cacheService.set(`error_log_${Date.now()}`, errorData, { maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    retryStats: { requestId: string; attempts: number }[];
    queuedRequests: number;
  }> {
    // Stats would be calculated from cached error logs in production

    return {
      totalErrors: 0, // Would be calculated from cached error logs
      errorsByType: {},
      retryStats: Array.from(this.retryAttempts.entries()).map(([requestId, attempts]) => ({
        requestId,
        attempts,
      })),
      queuedRequests: this.offlineQueue.length,
    };
  }

  /**
   * Clear error statistics and queues
   */
  clearErrorData(): void {
    this.retryAttempts.clear();
    this.offlineQueue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Utility methods
  
  private generateRequestId(context: string): string {
    return `${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get network status
   */
  getNetworkStatus(): {
    isOnline: boolean;
    queuedRequests: number;
    activeRetries: number;
  } {
    return {
      isOnline: this.isOnline,
      queuedRequests: this.offlineQueue.length,
      activeRetries: this.retryAttempts.size,
    };
  }

  /**
   * Test error handling (development only)
   */
  async testErrorHandling(): Promise<void> {
    if (!__DEV__) {
      return;
    }

    // Log: ('[NetworkErrorHandler] Running error handling tests...');

    const testCases = [
      { name: 'Network Error', error: { code: 'ECONNREFUSED' } },
      { name: 'Timeout Error', error: { code: 'ECONNABORTED' } },
      { name: 'Server Error', error: { response: { status: 500 } } },
      { name: 'Auth Error', error: { response: { status: 401 } } },
      { name: 'Not Found', error: { response: { status: 404 } } },
    ];

    for (const testCase of testCases) {
      try {
        await this.handleError(testCase.error, testCase.name);
      } catch (error) {
        // Expected - errors should be thrown after handling
      }
    }

    // Log: ('[NetworkErrorHandler] Error handling tests complete');
  }

  /**
   * MEM-08 fix: Cleanup all listeners and resources
   */
  destroy(): void {
    // Unsubscribe from NetInfo
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Remove web event listeners
    if (Platform.OS === 'web') {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
        this.onlineHandler = null;
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
        this.offlineHandler = null;
      }
    }

    // Clear queues
    this.offlineQueue = [];
    this.retryAttempts.clear();
  }

  /**
   * Reinitialize service (for testing purposes)
   * Resets all state and re-runs network monitoring initialization
   */
  async reinitialize(): Promise<void> {
    // First cleanup existing listeners
    this.destroy();

    // Reset internal state
    this.isOnline = true;
    this.queueLock = Promise.resolve();

    // Re-run network monitoring initialization
    await this.initNetworkMonitoring();
  }
}

// Export singleton instance
export const networkErrorHandler = new NetworkErrorHandlerService();
export default networkErrorHandler;