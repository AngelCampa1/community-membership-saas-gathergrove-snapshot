import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { billingService } from './billingService';
import { logger } from '@/lib/logger';

/**
 * Member Segmentation Service for Advanced Member Filtering and Analysis
 * 
 * Provides comprehensive member segmentation capabilities with dynamic filtering,
 * real-time preview, and advanced analytics for large clubs.
 * 
 * Features:
 * - Dynamic segment creation with complex filter criteria
 * - Real-time segment preview and member count estimation
 * - Advanced analytics and segment overlap analysis
 * - Performance optimization for large datasets
 * - Expand tier authorization enforcement
 * - Comprehensive caching and error handling
 */

export interface MemberSegment {
  id: number;
  clubId: number;
  name: string;
  description?: string;
  filterCriteria: SegmentFilterCriteria;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentFilterCriteria {
  // Basic member filters
  membershipTypeId?: number;
  duesStatus?: 'Current' | 'Overdue' | 'Exempt' | 'Unknown';
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  
  // Date range filters
  joinDateFrom?: string; // ISO date
  joinDateTo?: string;   // ISO date
  lastActivityFrom?: string;
  lastActivityTo?: string;
  
  // Engagement filters
  engagementLevel?: 'high' | 'medium' | 'low';
  eventAttendanceMin?: number;
  eventAttendanceMax?: number;
  
  // Tag filters
  tags?: string[]; // Tag names or IDs
  tagMatchMode?: 'any' | 'all' | 'none'; // How to match tags
  
  // Custom field filters
  customFields?: Record<string, string>; // fieldName: expectedValue
  
  // Advanced filters
  ageMin?: number;
  ageMax?: number;
  location?: string;
  membershipDurationMonths?: number;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  filterCriteria: SegmentFilterCriteria;
  isActive?: boolean;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  filterCriteria?: SegmentFilterCriteria;
  isActive?: boolean;
}

export interface SegmentMemberResult {
  segmentId: number;
  segmentName: string;
  totalCount: number;
  members: Array<{
    id: number;
    fullName: string;
    email: string;
    membershipTypeName: string;
    status: string;
    joinDate: string;
    duesStatus: string;
    engagementLevel: string;
    tags: string[];
  }>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SegmentPreviewResult {
  totalCount: number;
  members: Array<{
    id: number;
    fullName: string;
    email: string;
    membershipTypeName: string;
    status: string;
    joinDate: string;
    duesStatus: string;
    engagementLevel: string;
    tags: string[];
  }>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** @deprecated Use SegmentAnalyticsDashboard — kept only for any existing type references. Will be removed. */
export interface SegmentAnalytics {
  totalSegments: number;
  activeSegments: number;
  totalUniqueMembers: number;
  averageSegmentSize: number;
  segmentOverlap: {
    highOverlap: string[];
    mediumOverlap: string[];
    lowOverlap: string[];
  };
  popularCriteria: Array<{
    criteria: string;
    usage: number;
  }>;
}

export interface SegmentDashboardOverview {
  totalSegments: number;
  activeSegments: number;
  averageGrowthRate: number;
  averageHealthScore: number;
  alertCount: number;
}

export interface SegmentPerformanceSummary {
  segmentId: number;
  segmentName: string;
  memberCount: number;
  growthRate: number;
  healthScore: number;
  trend: string;
}

export interface SegmentAlertItem {
  segmentId: number;
  segmentName: string;
  alertType: string;
  message: string;
  severity: string;
  createdAt: string;
}

export interface SegmentTrendSummary {
  trendName: string;
  description: string;
  direction: string;
  magnitude: number;
  periodStart: string;
  periodEnd: string;
}

export interface SegmentAnalyticsDashboard {
  totalSegments: number;
  activeSegments: number;
  overview: SegmentDashboardOverview;
  topSegments: SegmentPerformanceSummary[];
  alertSegments: SegmentAlertItem[];
  recentTrends: SegmentTrendSummary[];
  lastUpdated: string;
}

export interface SegmentRecalculationResult {
  segmentId: number | null;
  clubId: number;
  segmentName: string | null;
  status: string;
  isSuccessful: boolean;
  membersProcessed: number;
  memberCount: number;
  membersAdded: number;
  membersRemoved: number;
  membersMoved: number;
  startedAt: string;
  completedAt: string | null;
}

export class MemberSegmentationService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private requestQueue = new Map<string, Promise<unknown>>();

  /**
   * Verify unlimited tier access for member segmentation
   */
  private async verifyUnlimitedAccess(): Promise<void> {
    try {
      const billingStatus = await billingService.getBillingStatus();
      if (billingStatus.currentTier !== 'Expand' && billingStatus.currentTier !== 'Unlimited') {
        throw new Error('Member segmentation is only available for Expand tier subscribers');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Member segmentation is only available')) {
        throw error;
      }
      // Continue with graceful degradation if billing service is unavailable
      logger.error('Billing service unavailable, proceeding with segmentation operation');
    }
  }

  /**
   * Get all segments for a club
   */
  async getSegments(clubId: number, options: {
    includeInactive?: boolean;
    sortBy?: 'name' | 'memberCount' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<MemberSegment[]> {
    await this.verifyUnlimitedAccess();

    const { includeInactive = false, sortBy = 'name', sortOrder = 'asc' } = options;
    
    const cacheKey = this.generateCacheKey('segments', { clubId, ...options });
    const cachedResult = this.getFromCache<MemberSegment[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await apiClient.get<MemberSegment[]>(`/clubs/${clubId}/segments?${params.toString()}`);
      
      const result = response.data;
      this.setCache(cacheKey, result, this.DEFAULT_TTL);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member segments',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view member segments',
          404: 'Club not found'
        }
      });
    }
  }

  /**
   * Create a new segment
   */
  async createSegment(clubId: number, request: CreateSegmentRequest): Promise<MemberSegment> {
    await this.verifyUnlimitedAccess();

    // Validate filter criteria
    this.validateFilterCriteria(request.filterCriteria);

    try {
      const response = await apiClient.post<MemberSegment>(`/clubs/${clubId}/segments`, request);
      
      // Invalidate caches
      this.invalidateSegmentCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating segment',
        action: 'Please check the segment configuration and try again',
        customMessages: {
          400: 'Invalid segment configuration',
          409: 'A segment with this name already exists',
          422: 'Segment validation failed'
        }
      });
    }
  }

  /**
   * Update an existing segment
   */
  async updateSegment(clubId: number, segmentId: number, request: UpdateSegmentRequest): Promise<MemberSegment> {
    await this.verifyUnlimitedAccess();

    // Validate filter criteria if provided
    if (request.filterCriteria) {
      this.validateFilterCriteria(request.filterCriteria);
    }

    try {
      const response = await apiClient.put<MemberSegment>(`/clubs/${clubId}/segments/${segmentId}`, request);
      
      // Invalidate caches
      this.invalidateSegmentCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating segment',
        action: 'Please check the segment configuration and try again',
        customMessages: {
          400: 'Invalid segment configuration',
          404: 'Segment not found',
          409: 'A segment with this name already exists'
        }
      });
    }
  }

  /**
   * Delete a segment
   */
  async deleteSegment(clubId: number, segmentId: number): Promise<{
    success: boolean;
  }> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.delete<{
        success: boolean;
      }>(`/clubs/${clubId}/segments/${segmentId}`);
      
      // Invalidate caches
      this.invalidateSegmentCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting segment',
        action: 'Please try again',
        customMessages: {
          404: 'Segment not found'
        }
      });
    }
  }

  /**
   * Get members in a segment
   */
  async getSegmentMembers(
    clubId: number,
    segmentId: number,
    page: number = 1,
    pageSize: number = 25
  ): Promise<SegmentMemberResult> {
    await this.verifyUnlimitedAccess();

    const cacheKey = this.generateCacheKey('segment-members', { clubId, segmentId, page, pageSize });
    const cachedResult = this.getFromCache<SegmentMemberResult>(cacheKey, 2 * 60 * 1000); // 2 minute cache
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await apiClient.get<SegmentMemberResult>(
        `/clubs/${clubId}/segments/${segmentId}/members?${params.toString()}`
      );
      
      const result = response.data;
      this.setCache(cacheKey, result, 2 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading segment members',
        action: 'Please try refreshing the page',
        customMessages: {
          404: 'Segment not found'
        }
      });
    }
  }

  /**
   * Preview members matching filter criteria without saving segment
   */
  async previewSegment(
    clubId: number,
    filterCriteria: SegmentFilterCriteria,
    page: number = 1,
    pageSize: number = 25
  ): Promise<SegmentPreviewResult> {
    await this.verifyUnlimitedAccess();

    // Validate filter criteria
    this.validateFilterCriteria(filterCriteria);

    const cacheKey = this.generateCacheKey('segment-preview', { clubId, filterCriteria, page, pageSize });
    const cachedResult = this.getFromCache<SegmentPreviewResult>(cacheKey, 1 * 60 * 1000); // 1 minute cache for preview
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await apiClient.post<SegmentPreviewResult>(
        `/clubs/${clubId}/segments/search`,
        {
          filterCriteria,
          page,
          pageSize
        }
      );
      
      const result = response.data;
      this.setCache(cacheKey, result, 1 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'previewing segment',
        action: 'Please check the filter criteria and try again',
        customMessages: {
          400: 'Invalid filter criteria'
        }
      });
    }
  }

  /**
   * Recalculate members for a single segment.
   * POSTs to /clubs/{clubId}/segments/{segmentId}/recalculate and invalidates
   * the local segment cache for the affected club.
   */
  async recalculateSegment(clubId: number, segmentId: number): Promise<SegmentRecalculationResult> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.post<SegmentRecalculationResult>(
        `/clubs/${clubId}/segments/${segmentId}/recalculate`
      );

      // Invalidate segment caches since membership has been recalculated
      this.invalidateSegmentCaches(clubId);

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'recalculating segment',
        action: 'Please try again'
      });
    }
  }

  /**
   * Get segment analytics dashboard.
   * GETs /clubs/{clubId}/segment-analytics/dashboard and returns the real
   * SegmentAnalyticsDashboard shape from the backend.
   */
  async getSegmentAnalytics(clubId: number): Promise<SegmentAnalyticsDashboard> {
    await this.verifyUnlimitedAccess();

    const cacheKey = this.generateCacheKey('segment-analytics', { clubId });
    const cachedResult = this.getFromCache<SegmentAnalyticsDashboard>(cacheKey, 30 * 60 * 1000); // 30 minute cache
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await apiClient.get<SegmentAnalyticsDashboard>(
        `/clubs/${clubId}/segment-analytics/dashboard`
      );

      const result = response.data;
      this.setCache(cacheKey, result, 30 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading segment analytics',
        action: 'Please try refreshing the page'
      });
    }
  }

  /**
   * Validate filter criteria
   */
  private validateFilterCriteria(criteria: SegmentFilterCriteria): void {
    // Validate date formats
    if (criteria.joinDateFrom && isNaN(Date.parse(criteria.joinDateFrom))) {
      throw new Error('Invalid joinDateFrom format. Use ISO date format.');
    }
    if (criteria.joinDateTo && isNaN(Date.parse(criteria.joinDateTo))) {
      throw new Error('Invalid joinDateTo format. Use ISO date format.');
    }
    if (criteria.lastActivityFrom && isNaN(Date.parse(criteria.lastActivityFrom))) {
      throw new Error('Invalid lastActivityFrom format. Use ISO date format.');
    }
    if (criteria.lastActivityTo && isNaN(Date.parse(criteria.lastActivityTo))) {
      throw new Error('Invalid lastActivityTo format. Use ISO date format.');
    }

    // Validate number ranges
    if (criteria.eventAttendanceMin !== undefined && criteria.eventAttendanceMin < 0) {
      throw new Error('Event attendance minimum cannot be negative.');
    }
    if (criteria.eventAttendanceMax !== undefined && criteria.eventAttendanceMax < 0) {
      throw new Error('Event attendance maximum cannot be negative.');
    }
    if (criteria.ageMin !== undefined && criteria.ageMin < 0) {
      throw new Error('Age minimum cannot be negative.');
    }
    if (criteria.ageMax !== undefined && criteria.ageMax < 0) {
      throw new Error('Age maximum cannot be negative.');
    }
    if (criteria.membershipDurationMonths !== undefined && criteria.membershipDurationMonths < 0) {
      throw new Error('Membership duration cannot be negative.');
    }

    // Validate range logic
    if (criteria.eventAttendanceMin !== undefined && criteria.eventAttendanceMax !== undefined) {
      if (criteria.eventAttendanceMin > criteria.eventAttendanceMax) {
        throw new Error('Event attendance minimum cannot be greater than maximum.');
      }
    }
    if (criteria.ageMin !== undefined && criteria.ageMax !== undefined) {
      if (criteria.ageMin > criteria.ageMax) {
        throw new Error('Age minimum cannot be greater than maximum.');
      }
    }
    if (criteria.joinDateFrom && criteria.joinDateTo) {
      if (new Date(criteria.joinDateFrom) > new Date(criteria.joinDateTo)) {
        throw new Error('Join date from cannot be after join date to.');
      }
    }

    // Validate enum values
    const validDuesStatuses = ['Current', 'Overdue', 'Exempt', 'Unknown'];
    if (criteria.duesStatus && !validDuesStatuses.includes(criteria.duesStatus)) {
      throw new Error(`Invalid dues status. Must be one of: ${validDuesStatuses.join(', ')}`);
    }

    const validStatuses = ['Active', 'Inactive', 'Suspended', 'Pending'];
    if (criteria.status && !validStatuses.includes(criteria.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const validEngagementLevels = ['high', 'medium', 'low'];
    if (criteria.engagementLevel && !validEngagementLevels.includes(criteria.engagementLevel)) {
      throw new Error(`Invalid engagement level. Must be one of: ${validEngagementLevels.join(', ')}`);
    }

    const validTagMatchModes = ['any', 'all', 'none'];
    if (criteria.tagMatchMode && !validTagMatchModes.includes(criteria.tagMatchMode)) {
      throw new Error(`Invalid tag match mode. Must be one of: ${validTagMatchModes.join(', ')}`);
    }
  }

  // Cache management methods
  private generateCacheKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    return `member-segmentation:${operation}:${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T>(key: string, customTtl?: number): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = customTtl || item.ttl;
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache(key: string, data: unknown, ttl: number): void {
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

  private invalidateSegmentCaches(clubId: number): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`\"clubId\":${clubId}`) || key.includes(`member-segmentation:`)) {
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
  getCacheStats(): {
    size: number;
    hitRatio: number;
    avgAge: number;
  } {
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
const memberSegmentationService = new MemberSegmentationService();
export default memberSegmentationService;
