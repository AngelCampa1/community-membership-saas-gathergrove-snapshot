/**
 * ARCHITECTURE DECISION RECORD: Unified Analytics Service Interfaces
 * 
 * Problem: Multiple analytics service interfaces causing data flow inconsistencies
 * - Different return types across analytics functions
 * - Inconsistent error handling patterns
 * - Mixed service layer implementations
 * 
 * Solution: Unified analytics service interfaces with consistent patterns
 */

import { 
  EventDashboardData, 
  EventPerformanceSummary,
  MemberEngagement 
} from './EventDataTypes';

// Base API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date | string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Error response structure
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: Date | string;
}

// Service result type for consistent error handling
export type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
};

// Analytics service interface definitions
export interface IAnalyticsService {
  // Event engagement analytics
  getEventEngagementAnalytics(
    clubId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResult<EventDashboardData>>;
  
  // Engagement trends
  getEngagementTrends(
    clubId: number, 
    daysBack: number
  ): Promise<ServiceResult<EngagementTrends>>;
  
  // Engagement benchmarks
  getEngagementBenchmarks(
    clubId: number
  ): Promise<ServiceResult<EngagementBenchmarks>>;
  
  // Member engagement insights
  getMemberEngagementInsights(
    clubId: number, 
    memberId: number, 
    analysisPeriodDays: number
  ): Promise<ServiceResult<MemberEngagementInsights>>;
  
  // Event recommendations
  getEventRecommendations(
    clubId: number, 
    memberId?: number, 
    maxRecommendations?: number
  ): Promise<ServiceResult<EventRecommendation[]>>;
  
  // Event performance analysis
  analyzeEventPerformance(
    eventId: number
  ): Promise<ServiceResult<EventPerformanceAnalysis>>;
  
  // Event success prediction
  predictEventSuccess(
    eventId: number
  ): Promise<ServiceResult<EventSuccessPrediction>>;
  
  // Engagement report generation
  generateEngagementReport(
    clubId: number, 
    reportType: 'basic' | 'comprehensive' | 'executive',
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResult<EngagementReport>>;
  
  // ROI metrics
  getROIMetrics(
    clubId: number, 
    periodMonths: number
  ): Promise<ServiceResult<ROIMetrics>>;
}

// Supporting type definitions that extend our base types
export interface EngagementTrends {
  clubId: number;
  periodDays: number;
  dailyTrends: DailyTrend[];
  trendDirection: 'Increasing' | 'Decreasing' | 'Stable';
  growthRate: number;
  averageEngagementScore: number;
}

export interface DailyTrend {
  date: Date | string;
  engagementScore: number;
  eventCount: number;
  attendanceRate: number;
}

export interface EngagementBenchmarks {
  clubId: number;
  averageAttendanceRate: number;
  averageRsvpRate: number;
  averageEngagementScore: number;
  industryComparisons: Record<string, number>;
  performanceIndicators: Record<string, string>;
  benchmarkPeriod: string;
  lastUpdated: Date | string;
}

export interface MemberEngagementInsights {
  memberId: number;
  memberName: string;
  clubId: number;
  analysisPeriod: number;
  eventAttendanceRate: number;
  rsvpAccuracyRate: number;
  engagementTrend: 'Increasing' | 'Decreasing' | 'Stable';
  engagementLevel: 'Green' | 'Yellow' | 'Red';
  recommendedActions: string[];
  engagementFactors: Record<string, number>;
}

export interface EventRecommendation {
  eventId: number;
  eventName: string;
  eventDateTime: Date | string;
  recommendationScore: number;
  attendanceProbability: number;
  recommendationReason: string;
}

export interface EventPerformanceAnalysis {
  eventId: number;
  eventName: string;
  eventDate: Date | string;
  performanceScore: number;
  attendanceAnalysis: {
    totalRsvps: number;
    totalAttended: number;
    attendanceRate: number;
    noShowRate: number;
  };
  engagementBreakdown: Record<string, number>;
  comparisonToAverage: Record<string, number>;
  improvementSuggestions: string[];
}

export interface EventSuccessPrediction {
  eventId: number;
  eventName: string;
  eventDate: Date | string;
  predictedAttendanceRate: number;
  successProbability: number;
  confidenceLevel: 'Low' | 'Medium' | 'High';
  riskFactors: string[];
  successFactors: string[];
  recommendedActions: string[];
}

export interface EngagementReport {
  clubId: number;
  reportType: 'basic' | 'comprehensive' | 'executive';
  reportPeriod: {
    start: Date | string;
    end: Date | string;
  };
  generatedAt: Date | string;
  executiveSummary: string;
  keyMetrics: Record<string, number>;
  trendAnalysis: {
    overallDirection: 'Increasing' | 'Decreasing' | 'Stable';
    monthlyGrowthRate: number;
    seasonalPatterns: Record<string, number>;
  };
  memberInsights: MemberEngagement[];
  eventAnalysis: EventPerformanceSummary[];
  recommendations: string[];
}

export interface ROIMetrics {
  clubId: number;
  analysisPeriodMonths: number;
  totalEventCosts: number;
  totalMemberValue: number;
  roiPercentage: number;
  costBreakdown: Record<string, number>;
  valueDrivers: Record<string, number>;
  costPerMember: number;
  valuePerMember: number;
}

// Service configuration interface
export interface AnalyticsServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTimeout: number;
}

// Request options interface
export interface AnalyticsRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// Service method signatures with consistent patterns
export interface AnalyticsServiceMethods {
  // Validation helpers
  validateClubId(clubId: number): void;
  validateDateRange(startDate: Date, endDate: Date): void;
  validatePeriod(period: number, min: number, max: number): void;
  
  // HTTP request helpers
  makeRequest<T>(
    endpoint: string, 
    options?: RequestInit & AnalyticsRequestOptions
  ): Promise<ServiceResult<T>>;
  
  // Error handling
  handleError(error: unknown): ApiError;
  
  // Response transformation
  transformResponse<T>(response: Response): Promise<T>;
  
  // Caching
  getCachedResult<T>(key: string): ServiceResult<T> | null;
  setCachedResult<T>(key: string, result: ServiceResult<T>): void;
}

// Complete analytics service interface
export interface ICompleteAnalyticsService extends IAnalyticsService, AnalyticsServiceMethods {
  readonly config: AnalyticsServiceConfig;
}

// Factory function type for creating analytics service
export type AnalyticsServiceFactory = (config: Partial<AnalyticsServiceConfig>) => ICompleteAnalyticsService;

// Service event types for monitoring and debugging
export interface AnalyticsServiceEvents {
  'request:start': { method: string; endpoint: string; timestamp: Date };
  'request:success': { method: string; endpoint: string; duration: number; timestamp: Date };
  'request:error': { method: string; endpoint: string; error: ApiError; timestamp: Date };
  'cache:hit': { key: string; timestamp: Date };
  'cache:miss': { key: string; timestamp: Date };
}

// Service health check interface
export interface AnalyticsServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  dependencies: {
    api: 'healthy' | 'unhealthy';
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
}

// Utility type for method result extraction
export type ExtractServiceResult<T> = T extends (...args: unknown[]) => Promise<ServiceResult<infer R>> 
  ? R 
  : never;

// Service method names type
export type AnalyticsServiceMethodNames = keyof IAnalyticsService;

// Service batch operation support
export interface BatchAnalyticsRequest {
  operations: Array<{
    method: AnalyticsServiceMethodNames;
    params: unknown[];
    id: string;
  }>;
}

export interface BatchAnalyticsResponse {
  results: Array<{
    id: string;
    success: boolean;
    data?: unknown;
    error?: ApiError;
  }>;
}