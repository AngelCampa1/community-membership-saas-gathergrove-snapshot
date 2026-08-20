import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { MemberResponse } from './memberService';
import { logger } from '@/lib/logger';
import {
  CursorPaginatedMembersResponse,
  MemberSearchOptions,
  AdvancedSearchOptions,
  MemberAnalyticsResponse,
  MemberAnalyticsOptions,
  BulkOperationResponse,
  RecommendedFiltersResponse,
  MemberExportOptions,
  MemberImportOptions,
  MemberImportResponse,
  CacheEntry,
  CacheStatistics
} from '@/types/factories';

/**
 * Optimized Member Service with advanced performance features
 *
 * This service provides enhanced member management operations with:
 * - Cursor-based pagination for better performance at scale
 * - Server-side filtering and sorting
 * - Optimized query patterns
 * - Advanced caching strategies
 * - Bulk operations support
 */

export interface BulkMemberOperation {
  memberIds: number[];
  operation: 'archive' | 'unarchive' | 'update_membership_type' | 'update_status';
  data?: Record<string, unknown>;
}

class OptimizedMemberService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private requestQueue = new Map<string, Promise<unknown>>();

  /**
   * Get members with cursor-based pagination for optimal performance
   */
  async getMembersWithCursor(
    clubId: number,
    options: MemberSearchOptions = {},
    cursor?: string,
    pageSize: number = 25
  ): Promise<CursorPaginatedMembersResponse> {
    const cacheKey = this.generateCacheKey('cursor-members', {
      clubId,
      ...options,
      cursor,
      pageSize
    });

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult as CursorPaginatedMembersResponse;
    }

    // Deduplicate simultaneous requests
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey) as Promise<CursorPaginatedMembersResponse>;
    }

    const requestPromise = this.executeCursorMembersQuery(clubId, options, cursor, pageSize);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.setCache(cacheKey, result, this.DEFAULT_TTL);
      return result as CursorPaginatedMembersResponse;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading members with cursor pagination',
        action: 'Please try refreshing the page',
      });
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async executeCursorMembersQuery(
    clubId: number,
    options: MemberSearchOptions,
    cursor?: string,
    pageSize: number = 25
  ): Promise<CursorPaginatedMembersResponse> {
    const params = new URLSearchParams();
    params.append('pageSize', pageSize.toString());
    
    if (cursor) params.append('cursor', cursor);
    if (options.searchTerm) params.append('search', options.searchTerm);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.includeAnalytics) params.append('includeAnalytics', 'true');

    // Add filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(`filter.${key}`, value.toString());
        }
      });
    }

    const response = await apiClient.get<CursorPaginatedMembersResponse>(
      `/clubs/${clubId}/members/cursor?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Advanced search with server-side filtering and full-text search
   */
  async searchMembersAdvanced(
    clubId: number,
    searchTerm: string,
    options: AdvancedSearchOptions = {}
  ): Promise<MemberResponse[]> {
    const cacheKey = this.generateCacheKey('advanced-search', {
      clubId,
      searchTerm,
      ...options
    });

    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult as MemberResponse[];
    }

    try {
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      if (options.fuzzySearch) params.append('fuzzy', 'true');
      if (options.includeArchived) params.append('includeArchived', 'true');
      if (options.limit) params.append('limit', options.limit.toString());

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(`filter.${key}`, value.toString());
          }
        });
      }

      const response = await apiClient.get<MemberResponse[]>(
        `/clubs/${clubId}/members/search/advanced?${params.toString()}`
      );

      const result = response.data;
      this.setCache(cacheKey, result, this.DEFAULT_TTL / 2); // Shorter TTL for search
      return result as MemberResponse[];
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'searching members',
        action: 'Please try a different search term',
      });
    }
  }

  /**
   * Get member analytics and statistics
   */
  async getMemberAnalytics(
    clubId: number,
    options: MemberAnalyticsOptions = {}
  ): Promise<MemberAnalyticsResponse> {
    const cacheKey = this.generateCacheKey('member-analytics', { clubId, ...options });

    const cachedResult = this.getFromCache(cacheKey, 10 * 60 * 1000); // 10 minute cache
    if (cachedResult) {
      return cachedResult as MemberAnalyticsResponse;
    }

    try {
      const params = new URLSearchParams();
      if (options.dateRange) {
        params.append('from', options.dateRange.from);
        params.append('to', options.dateRange.to);
      }
      if (options.includeEngagement) params.append('includeEngagement', 'true');
      if (options.includeGrowthTrends) params.append('includeGrowthTrends', 'true');

      const response = await apiClient.get<MemberAnalyticsResponse>(
        `/clubs/${clubId}/members/analytics?${params.toString()}`
      );

      const result = response.data;
      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minute cache
      return result as MemberAnalyticsResponse;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member analytics',
        action: 'Please try refreshing the page',
      });
    }
  }

  /**
   * Bulk operations for efficient member management
   */
  async executeBulkOperation(
    clubId: number,
    operation: BulkMemberOperation
  ): Promise<BulkOperationResponse> {
    try {
      const response = await apiClient.post<BulkOperationResponse>(
        `/clubs/${clubId}/members/bulk`,
        operation
      );

      // Invalidate relevant caches
      this.invalidateMemberCaches(clubId);

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: `executing bulk ${operation.operation}`,
        action: 'Please try again or contact support if the issue persists',
      });
    }
  }

  /**
   * Get member export data with various formats
   */
  async exportMembers(
    clubId: number,
    options: MemberExportOptions
  ): Promise<Blob | object> {
    try {
      const params = new URLSearchParams();
      params.append('format', options.format);
      if (options.includeCustomFields) params.append('includeCustomFields', 'true');
      if (options.includeAnalytics) params.append('includeAnalytics', 'true');

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(`filter.${key}`, value.toString());
          }
        });
      }

      const response = await apiClient.get(
        `/clubs/${clubId}/members/export?${params.toString()}`,
        {
          responseType: options.format === 'json' ? 'json' : 'blob'
        }
      );

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting member data',
        action: 'Please try again or reduce the amount of data being exported',
      });
    }
  }

  /**
   * Optimized member import with validation and progress tracking
   */
  async importMembersOptimized(
    clubId: number,
    file: File,
    options: MemberImportOptions = {}
  ): Promise<MemberImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skipDuplicates', (options.skipDuplicates || false).toString());
    formData.append('validateOnly', (options.validateOnly || false).toString());
    formData.append('batchSize', (options.batchSize || 100).toString());

    try {
      const response = await apiClient.post<MemberImportResponse>(
        `/clubs/${clubId}/members/import/optimized`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const _progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress({
                processed: progressEvent.loaded,
                total: progressEvent.total,
                errors: []
              });
            }
          },
        }
      );

      // Invalidate caches after successful import
      if (!options.validateOnly) {
        this.invalidateMemberCaches(clubId);
      }

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'importing member data',
        action: 'Please check your file format and try again',
      });
    }
  }

  /**
   * Get recommended filters based on member data patterns
   */
  async getRecommendedFilters(clubId: number): Promise<RecommendedFiltersResponse> {
    const cacheKey = this.generateCacheKey('recommended-filters', { clubId });

    const cachedResult = this.getFromCache(cacheKey, 30 * 60 * 1000); // 30 minute cache
    if (cachedResult) {
      return cachedResult as RecommendedFiltersResponse;
    }

    try {
      const response = await apiClient.get<RecommendedFiltersResponse>(
        `/clubs/${clubId}/members/filters/recommendations`
      );

      const result = response.data;
      this.setCache(cacheKey, result, 30 * 60 * 1000);
      return result as RecommendedFiltersResponse;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading filter recommendations',
        action: 'Please try refreshing the page',
      });
    }
  }

  /**
   * Preload data for better UX
   */
  async preloadMemberData(clubId: number): Promise<void> {
    try {
      // Preload first page
      await this.getMembersWithCursor(clubId, {}, undefined, 25);
      
      // Preload member analytics
      await this.getMemberAnalytics(clubId);
      
      // Preload recommended filters
      await this.getRecommendedFilters(clubId);
    } catch (error) {
      // Silent failure for preloading
      logger.error('Failed to preload member data', error);
    }
  }

  // Cache management methods
  private generateCacheKey(operation: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    return `${operation}:${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T = unknown>(key: string, customTtl?: number): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = customTtl || item.ttl;
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache<T = unknown>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private invalidateMemberCaches(clubId: number): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`"clubId":${clubId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStatistics {
    const now = Date.now();
    let totalAge = 0;
    
    for (const item of this.cache.values()) {
      totalAge += now - item.timestamp;
    }

    return {
      size: this.cache.size,
      hitRatio: 0, // Would need to track hits/misses to calculate
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }
}

// Export singleton instance
const optimizedMemberService = new OptimizedMemberService();
export default optimizedMemberService;
