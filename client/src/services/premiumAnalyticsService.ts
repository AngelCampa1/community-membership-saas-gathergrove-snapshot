import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Types for premium analytics data
export interface EngagementTrendData {
  period: string;
  memberEngagement: number;
  eventAttendance: number;
  communicationActivity: number;
  profileUpdates: number;
  averageScore: number;
}

export interface CohortData {
  cohort: string;
  totalMembers: number;
  retentionRates: { [key: string]: number };
  churnRate: number;
  averageLifetime: number;
}

export interface ROIData {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
}

export interface EventComparisonData {
  eventId: number;
  eventName: string;
  attendance: number;
  engagementScore: number;
  revenue: number;
  costs: number;
  roi: number;
  date: string;
}

export interface MemberSegmentData {
  segment: string;
  count: number;
  engagementLevel: 'high' | 'medium' | 'low';
  averageRevenue: number;
  churnRisk: number;
}

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
}

/**
 * Service for premium analytics functionality (Expand tier only)
 */
class PremiumAnalyticsService {
  /**
   * Get engagement trends with extended date ranges for Expand tier
   * @param clubId - Club ID
   * @param dateRange - Date range (unlimited for premium tier)
   * @returns Promise with engagement trend data
   */
  async getEngagementTrends(clubId: number, dateRange: AnalyticsDateRange): Promise<EngagementTrendData[]> {
    try {
      const response = await apiClient.get<EngagementTrendData[]>(
        `/clubs/${clubId}/analytics/premium/engagement-trends`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading engagement trends',
        action: 'Please try refreshing or selecting a different date range',
        customMessages: {
          403: 'Premium analytics requires Expand tier access',
          400: 'Invalid date range provided'
        }
      });
    }
  }

  /**
   * Get cohort analysis for member retention
   * @param clubId - Club ID
   * @param dateRange - Date range for cohort analysis
   * @returns Promise with cohort analysis data
   */
  async getCohortAnalysis(clubId: number, dateRange: AnalyticsDateRange): Promise<CohortData[]> {
    try {
      const response = await apiClient.get<CohortData[]>(
        `/clubs/${clubId}/analytics/premium/cohorts`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading cohort analysis',
        action: 'Please try again or contact support',
        customMessages: {
          403: 'Cohort analysis requires Expand tier access'
        }
      });
    }
  }

  /**
   * Get financial ROI tracking data
   * @param clubId - Club ID
   * @param dateRange - Date range for ROI analysis
   * @returns Promise with ROI data
   */
  async getFinancialROI(clubId: number, dateRange: AnalyticsDateRange): Promise<ROIData[]> {
    try {
      const response = await apiClient.get<ROIData[]>(
        `/clubs/${clubId}/analytics/premium/roi`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading ROI data',
        action: 'Please verify date range and try again',
        customMessages: {
          403: 'ROI tracking requires Expand tier access'
        }
      });
    }
  }

  /**
   * Compare event performance across multiple events
   * @param clubId - Club ID
   * @param eventIds - Array of event IDs to compare
   * @returns Promise with event comparison data
   */
  async compareEvents(clubId: number, eventIds: number[]): Promise<EventComparisonData[]> {
    try {
      const response = await apiClient.post<EventComparisonData[]>(
        `/clubs/${clubId}/analytics/premium/events/compare`,
        { eventIds }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'comparing events',
        action: 'Please select valid events and try again',
        customMessages: {
          403: 'Event comparison requires Expand tier access',
          400: 'Invalid event IDs provided'
        }
      });
    }
  }

  /**
   * Get member segmentation analysis
   * @param clubId - Club ID
   * @param criteria - Segmentation criteria
   * @returns Promise with member segment data
   */
  async getMemberSegmentation(clubId: number, criteria: string[] = []): Promise<MemberSegmentData[]> {
    try {
      const response = await apiClient.get<MemberSegmentData[]>(
        `/clubs/${clubId}/analytics/premium/segmentation`,
        {
          params: { criteria: criteria.join(',') }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member segmentation',
        action: 'Please try again with valid criteria',
        customMessages: {
          403: 'Member segmentation requires Expand tier access'
        }
      });
    }
  }

  /**
   * Export analytics data in various formats
   * @param clubId - Club ID
   * @param dataType - Type of data to export
   * @param format - Export format (pdf, excel, csv)
   * @param dateRange - Date range for export
   * @returns Promise with download URL
   */
  async exportData(
    clubId: number, 
    dataType: 'engagement' | 'cohorts' | 'roi' | 'events' | 'segmentation',
    format: 'pdf' | 'excel' | 'csv' | 'json',
    dateRange: AnalyticsDateRange
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await apiClient.post<{ downloadUrl: string; filename: string }>(
        `/clubs/${clubId}/analytics/premium/export`,
        {
          dataType,
          format,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting analytics data',
        action: 'Please try again or use a smaller date range',
        customMessages: {
          403: 'Data export requires Expand tier access',
          413: 'Date range too large for export'
        }
      });
    }
  }

  /**
   * Get real-time analytics metrics
   */
  async getRealTimeMetrics(clubId: number): Promise<{
    timestamp: Date;
    activeUsers: number;
    liveEvents: number;
    recentEngagement: number;
    alerts: Array<{
      id: string;
      type: 'warning' | 'info' | 'success' | 'error';
      title: string;
      message: string;
      timestamp: Date;
    }>;
  }> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/realtime`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading real-time metrics',
        action: 'Please try refreshing the page'
      });
    }
  }

  /**
   * Get predictive analytics data
   */
  async getPredictiveAnalytics(
    clubId: number,
    metric: 'engagement' | 'retention' | 'revenue',
    horizon: number = 30
  ): Promise<{
    predictions: Array<{
      date: string;
      predicted: number;
      confidence: number;
      upperBound: number;
      lowerBound: number;
    }>;
    accuracy: number;
    method: string;
    factors: Array<{
      name: string;
      impact: number;
      confidence: number;
    }>;
  }> {
    try {
      const response = await apiClient.post(
        `/clubs/${clubId}/analytics/premium/predictions`,
        { metric, horizon }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating predictions',
        action: 'Please try with a different metric or time horizon',
        customMessages: {
          422: 'Insufficient historical data for predictions'
        }
      });
    }
  }

  /**
   * Get goal tracking data
   */
  async getGoalTracking(clubId: number): Promise<Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    progress: number;
    deadline: Date;
    status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  }>> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/goals`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading goal tracking data',
        action: 'Please try refreshing or contact support'
      });
    }
  }

  /**
   * Get performance benchmarks
   */
  async getPerformanceBenchmarks(
    clubId: number,
    industry?: string
  ): Promise<Array<{
    metric: string;
    current: number;
    target: number;
    industry: number;
    best: number;
    status: 'excellent' | 'good' | 'average' | 'below_average';
  }>> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/benchmarks`,
        { params: { industry } }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading performance benchmarks',
        action: 'Benchmarks may be temporarily unavailable'
      });
    }
  }

  /**
   * Generate automated insights
   */
  async getAutomatedInsights(
    clubId: number,
    analysisType: 'performance' | 'opportunities' | 'risks' = 'performance'
  ): Promise<Array<{
    type: 'insight' | 'recommendation' | 'alert' | 'trend';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    confidence: number;
    actionItems: string[];
    dataPoints: Record<string, any>;
    visualizations?: string[];
  }>> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/insights`,
        { params: { analysisType } }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating insights',
        action: 'Please try again or contact support'
      });
    }
  }

  /**
   * Get data quality metrics
   */
  async getDataQuality(clubId: number): Promise<{
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
    overall: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedRecords: number;
    }>;
    lastUpdated: Date;
  }> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/data-quality`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'checking data quality',
        action: 'Data quality check failed, please try again'
      });
    }
  }

  /**
   * Create custom dashboard configuration
   */
  async saveDashboardConfig(
    clubId: number,
    config: {
      name: string;
      widgets: Array<{
        type: string;
        position: { x: number; y: number; width: number; height: number };
        settings: Record<string, any>;
      }>;
      filters: Record<string, unknown>;
      refreshInterval: number;
    }
  ): Promise<{ configId: string }> {
    try {
      const response = await apiClient.post(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        config
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'saving dashboard configuration',
        action: 'Please try again or simplify the configuration'
      });
    }
  }

  /**
   * Load dashboard configuration
   */
  async loadDashboardConfig(
    clubId: number,
    configId?: string
  ): Promise<{
    name: string;
    widgets: Array<{
      type: string;
      position: { x: number; y: number; width: number; height: number };
      settings: Record<string, any>;
    }>;
    filters: Record<string, any>;
    refreshInterval: number;
  }> {
    try {
      const response = await apiClient.get(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        { params: { configId } }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading dashboard configuration',
        action: 'Using default configuration'
      });
    }
  }
}

// Export singleton instance
const premiumAnalyticsService = new PremiumAnalyticsService();
export default premiumAnalyticsService;
