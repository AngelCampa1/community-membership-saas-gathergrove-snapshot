/**
 * Comprehensive TypeScript Type Definitions for Factories and Services
 *
 * Provides strict type definitions for:
 * - Component factory patterns (component registration, lazy loading, props mapping)
 * - Service factory patterns (service registration, dependency injection)
 * - Event engagement tracking (feature tracking, analytics events)
 * - Member service operations (search, filter, pagination, bulk operations)
 * - Bulk operation types (batch updates, imports, exports)
 * - API response patterns specific to these services
 */

import { ComponentType, ReactNode, ComponentProps } from 'react';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// COMPONENT FACTORY TYPES
// ============================================================================

/**
 * HOC (Higher-Order Component) options
 */
export interface HOCOptions {
  displayName?: string;
  forwardRef?: boolean;
  memo?: boolean;
  defaultProps?: Record<string, unknown>;
}

/**
 * HOC factory function type
 */
export type HOCFactory<TInjectedProps extends object, TOriginalProps extends object = Record<string, unknown>> = (
  WrappedComponent: ComponentType<TOriginalProps & TInjectedProps>
) => ComponentType<TOriginalProps>;

/**
 * Compound component props base interface
 */
export interface CompoundComponentProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Render prop component interface
 */
export interface RenderPropComponent<T> {
  children: (props: T) => ReactNode;
}

/**
 * Slot component props mapping
 */
export type SlotComponentProps<TSlots extends Record<string, ComponentType<any>>> = {
  [K in keyof TSlots]?: ComponentProps<TSlots[K]>;
};

/**
 * Lazy component loader interface
 */
export interface LazyComponentLoader<T extends ComponentType<any>> {
  importFn: () => Promise<{ default: T }>;
  fallback?: ReactNode;
}

/**
 * Form field wrapper props
 */
export interface FormFieldWrapperProps {
  label?: string;
  helperText?: string;
  required?: boolean;
  error?: string | string[];
  className?: string;
}

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'elevated' | 'outlined';

/**
 * Card component props
 */
export interface CardComponentProps extends CompoundComponentProps {
  variant?: CardVariant;
}

/**
 * Component registration entry
 */
export interface ComponentRegistryEntry<T = any> {
  component: ComponentType<T>;
  displayName: string;
  lazy?: boolean;
  preload?: boolean;
}

/**
 * Component registry map
 */
export type ComponentRegistry = Map<string, ComponentRegistryEntry>;

/**
 * Component loader result
 */
export interface ComponentLoaderResult<T extends ComponentType<any>> {
  Component: T;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// SERVICE FACTORY TYPES
// ============================================================================

/**
 * Service configuration
 */
export interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  version?: string;
}

/**
 * Service options for requests
 */
export interface ServiceOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Service registry entry
 */
export interface ServiceRegistryEntry {
  service: BaseServiceInterface;
  config: ServiceConfig;
}

/**
 * Base service interface
 */
export interface BaseServiceInterface {
  readonly baseUrl: string;
  cancelRequests(): void;
}

/**
 * Service registry map
 */
export type ServiceRegistryMap = Map<string, ServiceRegistryEntry>;

/**
 * Service method decorator options
 */
export interface ServiceDecoratorOptions {
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  debounce?: boolean;
  debounceDelay?: number;
}

/**
 * Service request config with extended options
 */
export interface EnhancedRequestConfig extends AxiosRequestConfig {
  retries?: number;
  params?: Record<string, unknown>;
}

/**
 * Service factory interface
 */
export interface ServiceFactoryInterface {
  create<T extends BaseServiceInterface>(
    ServiceClass: new (config: ServiceConfig) => T,
    config: ServiceConfig,
    name?: string
  ): T;
  get<T extends BaseServiceInterface>(name: string): T;
  has(name: string): boolean;
  list(): string[];
  clear(): void;
}

// ============================================================================
// EVENT ENGAGEMENT TYPES
// ============================================================================

/**
 * Event RSVP statistics
 */
export interface EventRsvpStatistics {
  totalRsvps: number;
  yesCount: number;
  noCount: number;
  maybeCount: number;
}

/**
 * Event attendance statistics
 */
export interface EventAttendanceStatistics {
  totalAttendees: number;
  expectedAttendees: number;
  attendanceRate: number;
}

/**
 * Member engagement summary
 */
export interface MemberEngagementSummary {
  memberId: number;
  memberName: string;
  memberEmail: string;
  engagementScore: number;
  engagementLevel: string;
}

/**
 * Daily trend data point
 */
export interface DailyTrend {
  date: string;
  count: number;
}

/**
 * Event engagement trends
 */
export interface EventEngagementTrends {
  rsvpTrends: DailyTrend[];
}

/**
 * Event engagement metrics response
 */
export interface EventEngagementMetricsResponse {
  eventId: number;
  eventName: string;
  eventDate: string;
  location: string;
  clubId: number;
  rsvpStatistics: EventRsvpStatistics;
  attendanceStatistics: EventAttendanceStatistics;
  memberEngagement: MemberEngagementSummary[];
  engagementTrends: EventEngagementTrends;
  generatedAt: string;
}

/**
 * Event performance summary
 */
export interface EventPerformanceSummary {
  eventId: number;
  eventName: string;
  eventDate: string;
  rsvpCount: number;
  attendanceCount: number;
  attendanceRate: number;
}

/**
 * Club events engagement response
 */
export interface ClubEventsEngagementResponse {
  clubId: number;
  timeframe: string;
  daysAnalyzed: number;
  totalEvents: number;
  totalRsvps: number;
  totalAttendees: number;
  averageAttendanceRate: number;
  topPerformingEvents: EventPerformanceSummary[];
  engagementOverview: Record<string, unknown>;
  generatedAt: string;
}

/**
 * Member event activity
 */
export interface MemberEventActivity {
  eventId: number;
  eventName: string;
  eventDate: string;
  activityType: string;
  attendedAt: string;
  notes?: string;
}

/**
 * Member event engagement response
 */
export interface MemberEventEngagementResponse {
  memberId: number;
  memberName: string;
  clubId: number;
  analysisPeriodDays: number;
  totalEventsInPeriod: number;
  totalRsvps: number;
  totalAttendances: number;
  rsvpRate: number;
  attendanceRate: number;
  recentActivities: MemberEventActivity[];
  currentEngagementScore: number;
  engagementTrend: string;
  generatedAt: string;
}

/**
 * Record event attendance request
 */
export interface RecordEventAttendanceRequest {
  memberId: number;
  attendedAt?: string;
  notes?: string;
  allowDuplicates?: boolean;
}

/**
 * Submit event feedback request
 */
export interface SubmitEventFeedbackRequest {
  memberId: number;
  rating: number;
  comments?: string;
  suggestions?: string;
  wouldRecommend?: boolean;
  feedbackCategories?: string[];
}

/**
 * Event attendance response
 */
export interface EventAttendanceResponse {
  attendanceId: number;
  eventId: number;
  eventName: string;
  memberId: number;
  memberName: string;
  attendedAt: string;
  notes?: string;
  recordedAt: string;
}

/**
 * Event feedback response
 */
export interface EventFeedbackResponse {
  feedbackId: number;
  eventId: number;
  eventName: string;
  memberId: number;
  memberName: string;
  rating: number;
  comments?: string;
  submittedAt: string;
}

/**
 * Feature tracking options
 */
export interface FeatureTrackingOptions {
  featureName: string;
  platform: string;
  sessionId: string;
  metadata?: string;
}

/**
 * Analytics event metadata
 */
export interface AnalyticsEventMetadata {
  eventType: string;
  timestamp: string;
  userId?: number;
  clubId?: number;
  additionalData?: Record<string, unknown>;
}

// ============================================================================
// MEMBER SERVICE TYPES
// ============================================================================

/**
 * Member response
 */
export interface MemberResponse {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  joinDate: string;
  membershipTypeId?: number;
  membershipTypeName?: string;
  duesStatus?: 'Current' | 'Overdue' | 'Upcoming' | 'Unpaid' | 'Partial';
  hasSmsConsent: boolean;
  status: 'Active' | 'Archived';
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Paginated members response
 */
export interface PaginatedMembersResponse {
  members: MemberResponse[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Cursor-based paginated members response
 */
export interface CursorPaginatedMembersResponse extends PaginatedMembersResponse {
  nextCursor?: string;
  previousCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Optimized member filters
 */
export interface OptimizedMemberFilters {
  membershipTypeId?: number;
  duesStatus?: 'Current' | 'Overdue' | 'Upcoming' | 'Unpaid' | 'Partial';
  hasSmsConsent?: boolean;
  joinDateFrom?: string;
  joinDateTo?: string;
  engagementLevel?: 'high' | 'medium' | 'low' | 'inactive';
  status?: 'Active' | 'Archived' | 'All';
}

/**
 * Member search options
 */
export interface MemberSearchOptions {
  searchTerm?: string;
  filters?: OptimizedMemberFilters;
  sortBy?: 'name' | 'email' | 'joinDate' | 'duesStatus' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  includeAnalytics?: boolean;
}

/**
 * Advanced search options
 */
export interface AdvancedSearchOptions {
  filters?: OptimizedMemberFilters;
  fuzzySearch?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

/**
 * Member analytics response
 */
export interface MemberAnalyticsResponse {
  totalMembers: number;
  activeMembers: number;
  archivedMembers: number;
  membersByType: Record<string, number>;
  duesStatistics: Record<string, number>;
  growthTrends?: Array<{ date: string; count: number }>;
  engagementMetrics?: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
    inactive: number;
  };
}

/**
 * Member analytics options
 */
export interface MemberAnalyticsOptions {
  dateRange?: { from: string; to: string };
  includeEngagement?: boolean;
  includeGrowthTrends?: boolean;
}

/**
 * Recommended filters response
 */
export interface RecommendedFiltersResponse {
  popularFilters: Array<{
    name: string;
    type: string;
    values: Array<{ value: string; count: number }>;
  }>;
  suggestions: Array<{
    filter: string;
    reason: string;
    memberCount: number;
  }>;
}

/**
 * Member export options
 */
export interface MemberExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  filters?: OptimizedMemberFilters;
  includeCustomFields?: boolean;
  includeAnalytics?: boolean;
}

/**
 * Member import progress
 */
export interface MemberImportProgress {
  processed: number;
  total: number;
  errors: Array<{
    row: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}

/**
 * Member import options
 */
export interface MemberImportOptions {
  skipDuplicates?: boolean;
  validateOnly?: boolean;
  batchSize?: number;
  onProgress?: (progress: MemberImportProgress) => void;
}

/**
 * Member import response
 */
export interface MemberImportResponse {
  importId: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>;
}

// ============================================================================
// BULK OPERATIONS TYPES
// ============================================================================

/**
 * Bulk operation status
 */
export type BulkOperationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

/**
 * Bulk operation type
 */
export type BulkOperationType =
  | 'delete'
  | 'update'
  | 'tag'
  | 'custom_fields'
  | 'export';

/**
 * Base bulk operation request
 */
export interface BaseBulkOperationRequest {
  memberIds: number[];
  operation: BulkOperationType;
}

/**
 * Bulk delete request
 */
export interface BulkDeleteRequest extends BaseBulkOperationRequest {
  operation: 'delete';
  confirmDeletion: boolean;
  reason?: string;
}

/**
 * Bulk update request
 */
export interface BulkUpdateRequest extends BaseBulkOperationRequest {
  operation: 'update';
  updates: {
    membershipTypeId?: number;
    status?: string;
    hasSmsConsent?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Bulk tag action
 */
export type BulkTagAction = 'add' | 'remove' | 'replace';

/**
 * Bulk tag request
 */
export interface BulkTagRequest extends BaseBulkOperationRequest {
  operation: 'tag';
  tagAction: BulkTagAction;
  tagIds: number[];
}

/**
 * Custom field value
 */
export interface CustomFieldValue {
  customFieldId: number;
  fieldValue: string;
}

/**
 * Bulk custom field request
 */
export interface BulkCustomFieldRequest extends BaseBulkOperationRequest {
  operation: 'custom_fields';
  customFieldValues: CustomFieldValue[];
}

/**
 * Bulk export format
 */
export type BulkExportFormat = 'csv' | 'xlsx' | 'json';

/**
 * Bulk export request
 */
export interface BulkExportRequest extends BaseBulkOperationRequest {
  operation: 'export';
  format: BulkExportFormat;
  includeCustomFields?: boolean;
  includeTags?: boolean;
  includeAnalytics?: boolean;
  useStreaming?: boolean;
  chunkSize?: number;
}

/**
 * Bulk operation error
 */
export interface BulkOperationError {
  memberId: number;
  error: string;
  details?: Record<string, unknown>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  operationId: string;
  operation: string;
  status: string;
  totalMembers: number;
  processedMembers: number;
  successfulOperations: number;
  failedOperations: number;
  errors: BulkOperationError[];
  startedAt: string;
  completedAt: string | null;
  processingTime: number;
  estimatedRemainingTime: number | null;
}

/**
 * Bulk operation status response
 */
export interface BulkOperationStatusResponse extends BulkOperationResponse {
  progressPercentage: number;
}

/**
 * Bulk operation history entry
 */
export interface BulkOperationHistoryEntry {
  operationId: string;
  operation: string;
  status: string;
  totalMembers: number;
  successfulOperations: number;
  failedOperations: number;
  startedAt: string;
  completedAt: string | null;
  initiatedBy: string;
}

/**
 * Bulk operation history response
 */
export interface BulkOperationHistoryResponse {
  operations: BulkOperationHistoryEntry[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Bulk operation history options
 */
export interface BulkOperationHistoryOptions {
  page?: number;
  pageSize?: number;
  operation?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Bulk operation metrics
 */
export interface BulkOperationMetrics {
  totalOperationsLast30Days: number;
  averageProcessingTime: number;
  successRate: number;
  mostCommonOperations: Array<{
    operation: string;
    count: number;
    averageTime: number;
  }>;
  peakUsageHours: Array<{
    hour: number;
    operationCount: number;
  }>;
}

/**
 * Processing time estimation
 */
export interface ProcessingTimeEstimation {
  estimatedTimeSeconds: number;
  estimatedTimeFormatted: string;
  confidence: 'low' | 'medium' | 'high';
  basedOnHistoricalData: boolean;
}

/**
 * Cancel operation response
 */
export interface CancelOperationResponse {
  success: boolean;
  message: string;
  operationId: string;
  finalStatus: string;
}

/**
 * Retry operation response
 */
export interface RetryOperationResponse {
  success: boolean;
  message: string;
  newOperationId: string;
}

/**
 * Generic bulk operation request
 */
export type BulkOperationRequest =
  | BaseBulkOperationRequest
  | BulkDeleteRequest
  | BulkUpdateRequest
  | BulkTagRequest
  | BulkCustomFieldRequest
  | BulkExportRequest;

// ============================================================================
// CACHE MANAGEMENT TYPES
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  size: number;
  hitRatio: number;
  avgAge: number;
}

/**
 * Cache manager interface
 */
export interface CacheManagerInterface {
  get<T>(key: string, customTtl?: number): T | null;
  set<T>(key: string, data: T, ttl: number): void;
  delete(key: string): void;
  clear(): void;
  cleanup(): void;
  getStats(): CacheStatistics;
}

// ============================================================================
// REQUEST QUEUE TYPES
// ============================================================================

/**
 * Request queue entry
 */
export interface RequestQueueEntry<T = unknown> {
  key: string;
  promise: Promise<T>;
  timestamp: number;
}

/**
 * Request queue interface
 */
export interface RequestQueueInterface {
  has(key: string): boolean;
  get<T>(key: string): Promise<T> | undefined;
  set<T>(key: string, promise: Promise<T>): void;
  delete(key: string): void;
  clear(): void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract props from component type
 */
export type ExtractProps<T> = T extends ComponentType<infer P> ? P : never;

/**
 * Extract return type from async function
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : never;

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make certain keys required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Make certain keys optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

/**
 * Extract keys of certain type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Function type helpers
 */
export type Fn = (...args: any[]) => any;
export type AsyncFn = (...args: any[]) => Promise<any>;

/**
 * API method type
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * HTTP status code ranges
 */
export type SuccessStatusCode = 200 | 201 | 202 | 203 | 204;
export type ClientErrorStatusCode = 400 | 401 | 403 | 404 | 422 | 429;
export type ServerErrorStatusCode = 500 | 502 | 503 | 504;
export type HttpStatusCode = SuccessStatusCode | ClientErrorStatusCode | ServerErrorStatusCode;

/**
 * Axios response wrapper
 */
export type ApiResponse<T> = AxiosResponse<T>;

/**
 * Axios request wrapper
 */
export type ApiRequest = AxiosRequestConfig;