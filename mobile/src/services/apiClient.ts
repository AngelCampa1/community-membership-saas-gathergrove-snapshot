/* eslint-disable @typescript-eslint/no-explicit-any */
// API client uses any for generic error handling and response types

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { cacheService } from './cacheService';
import { API_CONFIG } from '@/constants';
import { NetworkSecurity } from '@/utils/security';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition: (error: any) => boolean;
}

// Queue item interface with proper typing for persistence and retry tracking
interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retryCount: number;
  timestamp: number;
}

// Serializable queue item for persistence
interface SerializableQueueItem {
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

// Constants for queue management
const QUEUE_STORAGE_KEY = 'gathergrove_offline_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRY_COUNT = 3;
const QUEUE_ITEM_MAX_AGE = 60 * 60 * 1000; // 1 hour

class ApiClient {
  private static instance: ApiClient;
  public client: AxiosInstance;
  private isOnline: boolean = true;
  private requestQueue: QueuedRequest[] = [];
  private netInfoUnsubscribe: NetInfoSubscription | null = null;
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      const status = error.response?.status;
      // Retry on network errors, timeouts, and 5xx errors
      return !error.response || error.code === 'NETWORK_ERROR' || status >= 500;
    },
  };

  private constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000, // Increased timeout for mobile networks (NET-08 fix)
      headers: {
        'Content-Type': 'application/json',
        ...NetworkSecurity.getSecureHeaders(),
      },
    });

    this.setupInterceptors();
    // Initialize network monitoring asynchronously (NET-07 fix - don't block)
    this.initNetworkMonitoring().catch(error => {
      if (__DEV__) {
        console.warn('[ApiClient] Network monitoring init failed:', error);
      }
    });
    // Restore any persisted queue items (NET-02 fix)
    this.restoreQueue().catch(error => {
      if (__DEV__) {
        console.warn('[ApiClient] Queue restoration failed:', error);
      }
    });
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Initialize network monitoring for offline handling
   * NET-07: Made async and non-blocking
   * NET-09: Store unsubscribe function for cleanup
   */
  private async initNetworkMonitoring(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // Store the subscription for cleanup (NET-09 fix)
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;

        // Process queued requests when coming back online
        if (wasOffline && this.isOnline) {
          this.processRequestQueue();
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[ApiClient] Network monitoring initialization failed:', error);
      }
      this.isOnline = true;
    }
  }

  /**
   * Process queued requests when network comes back
   * NET-03: Re-queue failed requests with retry limit
   * NET-05: Add retry count limit for queued requests
   */
  private async processRequestQueue(): Promise<void> {
    if (__DEV__) {
      console.log(`[ApiClient] Processing ${this.requestQueue.length} queued requests`);
    }

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const item of queue) {
      try {
        const response = await this.client.request(item.config);
        item.resolve(response);
      } catch (error) {
        // Increment retry count
        item.retryCount = (item.retryCount || 0) + 1;

        // Re-queue if under retry limit (NET-03 fix)
        if (item.retryCount < MAX_RETRY_COUNT) {
          if (__DEV__) {
            console.log(`[ApiClient] Re-queuing failed request (retry ${item.retryCount}/${MAX_RETRY_COUNT})`);
          }
          this.requestQueue.push(item);
        } else {
          // Give up after max retries
          if (__DEV__) {
            console.warn('[ApiClient] Queued request failed after max retries:', error);
          }
          item.reject(error);
        }
      }
    }

    // Persist updated queue
    await this.persistQueue();
  }

  /**
   * Persist queue to storage for crash recovery (NET-02 fix)
   */
  private async persistQueue(): Promise<void> {
    try {
      const serializable: SerializableQueueItem[] = this.requestQueue.map(r => ({
        url: r.config.url || '',
        method: r.config.method || 'GET',
        data: r.config.data,
        headers: r.config.headers as Record<string, string>,
        timestamp: r.timestamp,
        retryCount: r.retryCount,
      }));
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      if (__DEV__) {
        console.warn('[ApiClient] Failed to persist queue:', error);
      }
    }
  }

  /**
   * Restore queue from storage on app startup (NET-02 fix)
   */
  private async restoreQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!stored) return;

      const items: SerializableQueueItem[] = JSON.parse(stored);
      const now = Date.now();

      // Filter out stale items (older than 1 hour)
      const freshItems = items.filter(item =>
        (now - item.timestamp) < QUEUE_ITEM_MAX_AGE
      );

      if (__DEV__ && freshItems.length > 0) {
        console.log(`[ApiClient] Restored ${freshItems.length} queued requests`);
      }

      // Re-create request promises for fresh items
      for (const item of freshItems) {
        // These will be processed when network comes online
        // Note: We can't restore the original resolve/reject, so these will just retry
        const config: AxiosRequestConfig = {
          url: item.url,
          method: item.method,
          data: item.data,
          headers: item.headers,
        };

        this.requestQueue.push({
          config,
          resolve: () => {}, // Restored items can't notify original caller
          reject: () => {},
          retryCount: item.retryCount,
          timestamp: item.timestamp,
        });
      }

      // Clear the stored queue after restoration
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) {
        console.warn('[ApiClient] Failed to restore queue:', error);
      }
    }
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token and handle offline scenarios
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication token
          const token = await authService.getStoredToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;

            // AUTH-01 fix: Refresh session on authenticated API requests
            authService.refreshSession();
          }

          // Add security headers
          config.headers = {
            ...config.headers,
            ...NetworkSecurity.getSecureHeaders(),
          } as any;

          // Validate request data
          if (config.data && typeof config.data === 'object') {
            if (!NetworkSecurity.validateResponse(config.data)) {
              throw new Error('Invalid request data detected');
            }
          }

          // Add request timestamp for debugging
          (config as any).metadata = {
            ...(config as any).metadata,
            requestTime: Date.now(),
          };

        } catch (error) {
          // Error: ('[ApiClient] Request interceptor enhancement failed:', error);
          // Continue with request even if some enhancements fail
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for comprehensive error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Validate response data for security
        if (response.data && !NetworkSecurity.validateResponse(response.data)) {
          // Error: ('[ApiClient] Response validation failed - potential security issue');
          // In production, you might want to block this response
        }

        // Log response time in development
        if (__DEV__ && (response.config as any).metadata?.requestTime) {
          const responseTime = Date.now() - (response.config as any).metadata.requestTime;
          if (responseTime > 2000) {
            // Warning: (`[ApiClient] Slow response detected: ${responseTime}ms`);
          }
        }

        // Refresh session on successful authenticated requests
        if (response.config.headers.Authorization) {
          authService.refreshSession();
        }

        // Clean up request metadata after response (MEM-05 fix)
        delete (response.config as any).metadata;

        return response;
      },
      async (error) => {
        // Handle specific error types
        if (error.response?.status === 401) {
          // Trigger re-authentication if callback is set
          if (authService.onSessionExpired) {
            authService.onSessionExpired();
          }
        }

        if (error.response?.status === 403) {
          // Error: ('[ApiClient] Access forbidden - insufficient permissions');
        }

        if (error.response?.status >= 500) {
          // Error: ('[ApiClient] Server error:', error.response?.status);
        }

        // Log network errors
        if (error.code === 'NETWORK_ERROR' || !error.response) {
          // Error: ('[ApiClient] Network error - request failed to reach server');
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig & { useCache?: boolean; cacheKey?: string }): Promise<T> {
    // Try cache first if enabled
    if (config?.useCache && config?.cacheKey) {
      const cached = await cacheService.get<T>(config.cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // If offline and no cache, queue the request (NET-04 fix)
    if (!this.isOnline) {
      return this.queueRequest<T>(url, 'GET', undefined, config);
    }

    const response = await this.executeWithRetry(() => this.client.get<T>(url, config));

    // Cache the response if caching is enabled
    if (config?.useCache && config?.cacheKey && response.data) {
      await cacheService.set(config.cacheKey, response.data);
    }

    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Queue request if offline (NET-04 fix)
    if (!this.isOnline) {
      return this.queueRequest<T>(url, 'POST', data, config);
    }

    const response = await this.executeWithRetry(() => this.client.post<T>(url, data, config));
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Queue request if offline (NET-04 fix)
    if (!this.isOnline) {
      return this.queueRequest<T>(url, 'PUT', data, config);
    }

    const response = await this.executeWithRetry(() => this.client.put<T>(url, data, config));
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Queue request if offline (NET-04 fix)
    if (!this.isOnline) {
      return this.queueRequest<T>(url, 'PATCH', data, config);
    }

    const response = await this.executeWithRetry(() => this.client.patch<T>(url, data, config));
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Queue request if offline (NET-04 fix)
    if (!this.isOnline) {
      return this.queueRequest<T>(url, 'DELETE', undefined, config);
    }

    const response = await this.executeWithRetry(() => this.client.delete<T>(url, config));
    return response.data;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<AxiosResponse<T>> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await requestFn();

        if (attempt > 0 && __DEV__) {
          // Log: (`[ApiClient] Request succeeded on retry attempt ${attempt + 1}`);
        }

        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxRetries || !config.retryCondition(error)) {
          break;
        }

        // Exponential backoff with jitter (NET-06 fix)
        const baseDelay = config.retryDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // 0-1000ms random jitter
        const delay = baseDelay + jitter;

        if (__DEV__) {
          console.log(`[ApiClient] Retrying request (attempt ${attempt + 1}/${config.maxRetries}) after ${Math.round(delay)}ms`);
        }

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Queue request for when network comes back online
   * NET-01: Add queue size limit
   * NET-04: Store serializable config instead of function
   */
  private async queueRequest<T>(url: string, method: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // NET-01: Check queue size limit
      if (this.requestQueue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest request to make room
        const oldest = this.requestQueue.shift();
        if (oldest) {
          oldest.reject(new Error('Request queue full - request dropped'));
          if (__DEV__) {
            console.warn('[ApiClient] Dropped oldest request due to queue limit');
          }
        }
      }

      // NET-04: Store serializable config
      const queuedRequest: QueuedRequest = {
        config: {
          url,
          method,
          data,
          ...config,
        },
        resolve: (response: AxiosResponse<T>) => resolve(response.data),
        reject,
        retryCount: 0,
        timestamp: Date.now(),
      };

      // NET-01 fix: Enforce MAX_QUEUE_SIZE to prevent memory exhaustion
      if (this.requestQueue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest item from queue (FIFO)
        const removed = this.requestQueue.shift();
        if (removed && __DEV__) {
          console.warn('[ApiClient] Queue full, removing oldest request');
        }
        // Reject the removed request
        if (removed) {
          removed.reject(new Error('Request queue full - oldest request dropped'));
        }
      }

      this.requestQueue.push(queuedRequest);

      // Persist queue to storage
      this.persistQueue().catch(() => {
        // Silently fail persistence - request is still queued in memory
      });

      if (__DEV__) {
        console.log(`[ApiClient] Request queued for offline processing (${this.requestQueue.length}/${MAX_QUEUE_SIZE})`);
      }
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get network status
   */
  public getNetworkStatus(): { isOnline: boolean; queuedRequests: number } {
    return {
      isOnline: this.isOnline,
      queuedRequests: this.requestQueue.length,
    };
  }

  /**
   * Clear request queue (useful for logout)
   */
  public async clearRequestQueue(): Promise<void> {
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('Request cancelled'));
    });
    this.requestQueue = [];

    // Clear persisted queue as well
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) {
        console.warn('[ApiClient] Failed to clear persisted queue:', error);
      }
    }

    if (__DEV__) {
      console.log('[ApiClient] Request queue cleared');
    }
  }

  /**
   * Cleanup resources (NET-09 fix)
   * Call this on app cleanup or when switching users
   */
  public cleanup(): void {
    // Remove NetInfo listener
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Clear request queue
    this.clearRequestQueue().catch(() => {});

    if (__DEV__) {
      console.log('[ApiClient] Cleanup complete');
    }
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
export default apiClient;

// Export types
export type { RetryConfig };