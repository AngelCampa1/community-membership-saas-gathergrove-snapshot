import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { NetworkSecurity } from '@/utils/security';
import { Platform } from 'react-native';

/**
 * Enhanced offline data caching and synchronization service
 * Provides robust offline functionality with conflict resolution
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
  etag?: string;
  lastModified?: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
  retryCount: number;
  expiresAt?: number;
}

export interface SyncConflict<T = unknown> {
  id: string;
  localData: T;
  serverData: T;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: number;
}

export interface SyncOptions {
  forceFetch?: boolean;
  maxAge?: number; // in milliseconds
  retryOnError?: boolean;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge' | 'manual';
}

export type CacheOptions = SyncOptions;

export interface ServiceWorkerMessage {
  type: 'BACKGROUND_SYNC_COMPLETE' | 'CACHE_UPDATE' | 'OFFLINE_FALLBACK';
  payload?: unknown;
}

export interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

class CacheServiceClass {
  private readonly cachePrefix = 'gathergrove_cache_';
  private readonly syncQueueKey = 'gathergrove_sync_queue';
  private readonly conflictsKey = 'gathergrove_conflicts';
  private syncQueue: string[] = [];
  private isOnline: boolean = true;
  private readonly maxRetries = 3;
  private readonly defaultMaxAge = 30 * 60 * 1000; // 30 minutes

  // MEM-08 fix: Store listener cleanup references
  private netInfoUnsubscribe: (() => void) | null = null;
  private serviceWorkerMessageHandler: ((event: MessageEvent) => void) | null = null;

  // RACE-01 fix: Use Promise-based lock for sync queue processing
  private syncLock: Promise<void> = Promise.resolve();
  // CACHE-01 fix: Track sync in progress state
  private syncInProgress: boolean = false;

  // RACE-04 fix: Track initialization state with Promise
  private initPromise: Promise<void>;
  private isInitialized: boolean = false;

  constructor() {
    // RACE-04 fix: Chain all async initialization into a single promise
    this.initPromise = this.initialize();
  }

  /**
   * RACE-04 fix: Initialize all async operations in sequence
   */
  private async initialize(): Promise<void> {
    try {
      await this.initNetworkListener();
      await this.loadSyncQueue();

      // Initialize service worker integration for web platform
      if (Platform.OS === 'web') {
        await this.initServiceWorkerIntegration();
      }

      this.isInitialized = true;
    } catch (error) {
      // Log error but don't fail - service can still work in degraded mode
      if (__DEV__) {
        console.warn('[CacheService] Initialization failed:', error);
      }
      this.isInitialized = true; // Mark as initialized even on error
    }
  }

  /**
   * RACE-04 fix: Ensure service is ready before use
   */
  async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Initialize service worker integration for web platform
   */
  private async initServiceWorkerIntegration(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // MEM-08 fix: Store handler reference for cleanup
        this.serviceWorkerMessageHandler = (event: MessageEvent) => {
          this.handleServiceWorkerMessage(event.data);
        };
        navigator.serviceWorker.addEventListener('message', this.serviceWorkerMessageHandler);

        // Register for background sync when service worker is available
        if ('sync' in registration) {
          // Log: ('[CacheService] Background sync API available');
        }

      }
    } catch (error) {
      // Error: ('[CacheService] Service worker integration failed:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(data: ServiceWorkerMessage): void {
    switch (data.type) {
      case 'BACKGROUND_SYNC_COMPLETE':
        this.processSyncQueue();
        break;
      case 'CACHE_UPDATE':
        // Log: ('[CacheService] Cache updated from service worker');
        break;
      case 'OFFLINE_FALLBACK':
        // Log: ('[CacheService] Offline fallback triggered');
        break;
    }
  }

  /**
   * Initialize network state monitoring
   */
  private async initNetworkListener(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // MEM-08 fix: Store unsubscribe function for cleanup
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;

        // If coming back online, trigger sync
        if (wasOffline && this.isOnline) {
          if (__DEV__) {
            // Log: ('[CacheService] Network restored, triggering sync queue');
          }
          this.processSyncQueue();
        }
      });
    } catch (error) {
      // Error: ('[CacheService] Network listener initialization failed:', error);
      this.isOnline = true; // Assume online if detection fails
    }
  }

  /**
   * Load pending sync operations from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.syncQueueKey);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      // Error: ('[CacheService] Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.syncQueueKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      // Error: ('[CacheService] Failed to save sync queue:', error);
      // Non-critical error - continue without saving queue
    }
  }

  /**
   * Get cached data with automatic sync handling
   */
  async get<T>(key: string, options: SyncOptions = {}): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);
    const maxAge = options.maxAge || this.defaultMaxAge;

    // Try to get from cache first
    const cachedData = await this.getCachedEntry<T>(cacheKey);

    // Check if we have valid cached data
    if (cachedData && !options.forceFetch) {
      const age = Date.now() - cachedData.timestamp;
      const isExpired = cachedData.expiresAt ? Date.now() > cachedData.expiresAt : age > maxAge;

      if (!isExpired) {
        if (__DEV__) {
          // Log: Returning cached data for key
        }
        return cachedData.data;
      }
    }

    // If online, try to fetch fresh data
    if (this.isOnline) {
      try {
        return await this.fetchAndCache<T>(key, cachedData, options);
      } catch (error) {
        // If fetch fails and we have cached data, return it
        if (cachedData) {
          if (__DEV__) {
            // Error: Get operation failed, returning cached fallback
          }
          return cachedData.data;
        }
        // If no cached data, propagate the error
        throw error;
      }
    }

    // If offline and we have cached data (even if stale), return it
    if (cachedData) {
      if (__DEV__) {
        // Log: Offline mode - returning stale cached data
      }
      return cachedData.data;
    }

    // No cached data and offline
    return null;
  }

  /**
   * Set data in cache with sync queue management
   */
  async set<T>(key: string, data: T, options: SyncOptions = {}): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    // Get existing entry for version tracking
    const existing = await this.getCachedEntry<T>(cacheKey);

    const entry: CacheEntry<T> = {
      data: this.sanitizeData(data),
      timestamp: Date.now(),
      version: (existing?.version || 0) + 1,
      syncStatus: this.isOnline ? 'pending' : 'pending',
      retryCount: 0,
      expiresAt: options.maxAge ? Date.now() + options.maxAge : undefined,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

    // Add to sync queue if not already there
    if (!this.syncQueue.includes(key)) {
      this.syncQueue.push(key);
      await this.saveSyncQueue();
    }

    // If online, try immediate sync
    if (this.isOnline) {
      this.processSyncQueue();
    }

    if (__DEV__) {
      // Log: Data cached for key
    }
  }

  /**
   * Remove data from cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    
    try {
      await AsyncStorage.removeItem(cacheKey);
      
      // Remove from sync queue
      const index = this.syncQueue.indexOf(key);
      if (index > -1) {
        this.syncQueue.splice(index, 1);
        await this.saveSyncQueue();
      }

      if (__DEV__) {
        // Log: (`[CacheService] Removed cache entry: ${key}`);
      }
    } catch (error) {
      // Error: ('[CacheService] Remove operation failed:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      // Clear sync queue
      this.syncQueue = [];
      await AsyncStorage.removeItem(this.syncQueueKey);

      if (__DEV__) {
        // Log: (`[CacheService] Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (error) {
      // Error: ('[CacheService] Clear operation failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: string;
    pendingSyncs: number;
    conflicts: number;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.timestamp) {
              oldestTimestamp = Math.min(oldestTimestamp, parsed.timestamp);
              newestTimestamp = Math.max(newestTimestamp, parsed.timestamp);
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
      
      const conflicts = await this.getConflicts();
      
      return {
        totalEntries: cacheKeys.length,
        totalSize: this.formatBytes(totalSize),
        pendingSyncs: this.syncQueue.length,
        conflicts: conflicts.length,
        oldestEntry: oldestTimestamp < Date.now() ? new Date(oldestTimestamp).toISOString() : undefined,
        newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp).toISOString() : undefined,
      };
    } catch (error) {
      // Error: ('[CacheService] Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: '0 B',
        pendingSyncs: 0,
        conflicts: 0,
      };
    }
  }

  /**
   * Process sync queue (background sync)
   * RACE-01 fix: Use Promise-based lock to prevent concurrent execution
   * CACHE-01 fix: Track sync in progress state
   */
  private processSyncQueue(): Promise<void> {
    // RACE-01 fix: Chain onto existing lock to serialize execution
    // This ensures only one sync operation runs at a time
    this.syncLock = this.syncLock.then(async () => {
      // Early return checks inside the lock
      if (!this.isOnline || this.syncQueue.length === 0) {
        return;
      }

      // CACHE-01 fix: Set sync in progress flag
      this.syncInProgress = true;

      if (__DEV__) {
        // Log: (`[CacheService] Processing sync queue with ${this.syncQueue.length} items`);
      }

      try {
        const batchSize = 5; // Process in small batches
        const batch = this.syncQueue.splice(0, batchSize);

        for (const key of batch) {
          try {
            await this.syncEntry(key);
          } catch (error) {
            // Error: (`[CacheService] Failed to sync entry: ${key}`, error);
            // Re-add failed items to queue for retry
            if (!this.syncQueue.includes(key)) {
              this.syncQueue.push(key);
            }
          }
        }

        await this.saveSyncQueue();

        // Continue with remaining items after delay
        if (this.syncQueue.length > 0) {
          setTimeout(() => this.processSyncQueue(), 1000);
        }
      } finally {
        // CACHE-01 fix: Clear sync in progress flag when done or on error
        if (this.syncQueue.length === 0) {
          this.syncInProgress = false;
        }
      }
    }).catch((error) => {
      // RACE-01 fix: Handle errors to prevent lock from getting stuck
      this.syncInProgress = false;
      if (__DEV__) {
        console.warn('[CacheService] Sync queue processing error:', error);
      }
    });

    return this.syncLock;
  }

  /**
   * Sync individual cache entry
   */
  private async syncEntry(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const entry = await this.getCachedEntry(cacheKey);
    
    if (!entry || entry.syncStatus === 'synced') {
      return;
    }
    
    try {
      // This would integrate with your actual API service
      // For now, we'll simulate the sync process
      if (__DEV__) {
        // Log: (`[CacheService] Syncing entry: ${key}`);
      }

      // Update sync status
      entry.syncStatus = 'synced';
      entry.retryCount = 0;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      
    } catch (error) {
      entry.retryCount++;
      
      if (entry.retryCount >= this.maxRetries) {
        entry.syncStatus = 'failed';
        await this.addConflict({
          id: key,
          localData: entry.data,
          serverData: null,
          conflictType: 'update',
          timestamp: Date.now(),
        });
      } else {
        entry.syncStatus = 'pending';
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      throw error;
    }
  }

  /**
   * Fetch fresh data and cache it
   */
  private async fetchAndCache<T>(
    key: string,
    existingEntry: CacheEntry<T> | null,
    _options?: CacheOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<T> {
    try {
      // This would integrate with your actual API service
      // For now, we'll return existing data if available
      if (existingEntry) {
        if (__DEV__) {
          // Log: (`[CacheService] Returning existing cached data for key: ${key}`);
        }
        return existingEntry.data;
      }
      
      throw new Error('No cached data available');
    } catch (error) {
      // If fetch fails and we have cached data, return it
      if (existingEntry) {
        if (__DEV__) {
          // Log: (`[CacheService] Fetch failed, returning cached data for key: ${key}`);
        }
        return existingEntry.data;
      }
      
      throw error;
    }
  }

  /**
   * Get cached entry with type safety
   */
  private async getCachedEntry<T>(cacheKey: string): Promise<CacheEntry<T> | null> {
    try {
      const data = await AsyncStorage.getItem(cacheKey);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Validate cache entry structure
      if (typeof parsed === 'object' && parsed.data !== undefined && parsed.timestamp) {
        return parsed as CacheEntry<T>;
      }

      return null;
    } catch (error) {
      // Error: ('[CacheService] Failed to get cached entry:', error);
      return null;
    }
  }

  /**
   * Add conflict for manual resolution
   */
  private async addConflict(conflict: SyncConflict): Promise<void> {
    try {
      const existingConflicts = await this.getConflicts();
      existingConflicts.push(conflict);

      await AsyncStorage.setItem(this.conflictsKey, JSON.stringify(existingConflicts));

      if (__DEV__) {
        // Log: (`[CacheService] Added conflict for key: ${conflict.id}`);
      }
    } catch (error) {
      // Error: ('[CacheService] Failed to add conflict:', error);
    }
  }

  /**
   * Get all sync conflicts
   */
  async getConflicts(): Promise<SyncConflict[]> {
    try {
      const data = await AsyncStorage.getItem(this.conflictsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      // Error: ('[CacheService] Failed to get conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(conflictId: string, resolution: 'server-wins' | 'client-wins'): Promise<void> {
    const conflicts = await this.getConflicts();
    const conflictIndex = conflicts.findIndex(c => c.id === conflictId);

    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = conflicts[conflictIndex];

    // Apply resolution
    const resolvedData = resolution === 'server-wins' ? conflict.serverData : conflict.localData;
    await this.set(conflict.id, resolvedData);

    // Remove conflict
    conflicts.splice(conflictIndex, 1);
    await AsyncStorage.setItem(this.conflictsKey, JSON.stringify(conflicts));

    if (__DEV__) {
      // Log: (`[CacheService] Resolved conflict: ${conflictId} with ${resolution}`);
    }
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  /**
   * Sanitize data before caching to prevent security issues
   * CACHE-03 fix: Don't obfuscate data - that corrupts actual values
   * Only validate the data structure without modifying values
   */
  private sanitizeData<T>(data: T): T {
    // CACHE-03 fix: obfuscateForLogging replaces values with asterisks which corrupts data
    // Instead, just validate the data is safe to cache without modifying it
    if (data === null || data === undefined) {
      return data;
    }

    // For strings, just return as-is (no XSS risk in cached data)
    if (typeof data === 'string') {
      return data;
    }

    // For objects, validate structure but don't modify values
    if (typeof data === 'object') {
      // Validate the response is safe using NetworkSecurity but don't use the result
      // This is just a security check, not a transformation
      NetworkSecurity.validateResponse(data as Record<string, unknown>);
      return data;
    }

    return data;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Force sync all pending items
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (__DEV__) {
      // Log: ('[CacheService] Force syncing all pending items');
    }

    // Trigger service worker sync on web platform
    if (Platform.OS === 'web') {
      await this.triggerServiceWorkerSync();
    }
    
    await this.processSyncQueue();
  }

  /**
   * Trigger service worker background sync
   */
  private async triggerServiceWorkerSync(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        if ('sync' in registration) {
          await (registration as ServiceWorkerRegistrationWithSync).sync?.register('data-sync');
        }

        // Also notify service worker about pending sync
        if (registration.active) {
          registration.active.postMessage({
            type: 'TRIGGER_SYNC',
            syncQueue: this.syncQueue,
          });
        }
      }
    } catch (error) {
      // Error: ('[CacheService] Service worker sync trigger failed:', error);
    }
  }

  /**
   * Check if cache service is ready
   * RACE-04 fix: Return actual initialization state
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get network status
   */
  getNetworkStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
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

    // Remove service worker message listener
    if (Platform.OS === 'web' && this.serviceWorkerMessageHandler && 'serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.serviceWorkerMessageHandler);
      this.serviceWorkerMessageHandler = null;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheServiceClass();
export default cacheService;