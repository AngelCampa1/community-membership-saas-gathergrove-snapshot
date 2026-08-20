import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { AnalyticsDateRange } from '@/types/analytics';

// Enhanced types for cohort analysis
export interface CohortMember {
  memberId: string;
  joinDate: string;
  membershipType: 'basic' | 'premium' | 'enterprise';
  acquisitionChannel: string;
  initialValue: number;
  lifetimeValue: number;
  churnDate?: string;
  isActive: boolean;
}

export interface CohortRetentionData {
  cohortId: string;
  cohortStartDate: string;
  cohortLabel: string;
  initialSize: number;
  retentionRates: number[];
  retentionPercentages: number[];
  averageLifetime: number;
  totalRevenue: number;
  churnRate: number;
  segments: CohortSegment[];
}

export interface CohortSegment {
  segmentName: string;
  memberCount: number;
  retentionRate: number;
  averageValue: number;
  characteristics: Record<string, any>;
}

export interface CohortAnalysisFilters {
  dateRange: AnalyticsDateRange;
  membershipTypes?: string[];
  acquisitionChannels?: string[];
  minimumCohortSize?: number;
  includeInactive?: boolean;
  granularity: 'weekly' | 'monthly' | 'quarterly';
}

export interface CohortPrediction {
  cohortId: string;
  predictedRetention: number[];
  confidenceInterval: [number, number][];
  predictedLifetimeValue: number;
  predictedChurnDate: string;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

export interface CohortComparison {
  cohortA: CohortRetentionData;
  cohortB: CohortRetentionData;
  significanceTesting: {
    isSignificant: boolean;
    pValue: number;
    confidenceLevel: number;
  };
  keyDifferences: Array<{
    metric: string;
    differencePercent: number;
    significance: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Advanced Cohort Analysis Service for Expand tier
 * Provides comprehensive member retention and lifecycle analysis
 */
class CohortAnalysisService {
  private readonly baseUrl = '/clubs';

  /**
   * Get comprehensive cohort retention analysis
   */
  async getCohortAnalysis(
    clubId: number, 
    filters: CohortAnalysisFilters
  ): Promise<CohortRetentionData[]> {
    try {
      const response = await apiClient.get<CohortRetentionData[]>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/retention`,
        {
          params: {
            startDate: filters.dateRange.startDate,
            endDate: filters.dateRange.endDate,
            membershipTypes: filters.membershipTypes?.join(','),
            acquisitionChannels: filters.acquisitionChannels?.join(','),
            minimumCohortSize: filters.minimumCohortSize,
            includeInactive: filters.includeInactive,
            granularity: filters.granularity
          }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading cohort analysis',
        action: 'Please check your filters and try again',
        customMessages: {
          403: 'Cohort analysis requires Expand tier access',
          400: 'Invalid cohort analysis parameters'
        }
      });
    }
  }

  /**
   * Get detailed member-level cohort data
   */
  async getCohortMembers(
    clubId: number,
    cohortId: string,
    options: {
      includeChurned?: boolean;
      sortBy?: 'joinDate' | 'lifetimeValue' | 'churnRisk';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ members: CohortMember[]; total: number }> {
    try {
      const response = await apiClient.get<{ members: CohortMember[]; total: number }>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/${cohortId}/members`,
        { params: options }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading cohort members',
        action: 'Please verify the cohort ID and try again',
        customMessages: {
          404: 'Cohort not found',
          403: 'Insufficient permissions to view member data'
        }
      });
    }
  }

  /**
   * Generate cohort predictions using ML models
   */
  async getCohortPredictions(
    clubId: number,
    cohortIds: string[],
    predictionHorizon: number = 12
  ): Promise<CohortPrediction[]> {
    try {
      const response = await apiClient.post<CohortPrediction[]>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/predictions`,
        {
          cohortIds,
          predictionHorizon
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating cohort predictions',
        action: 'Please try again with fewer cohorts',
        customMessages: {
          403: 'Predictive analytics requires Expand tier',
          422: 'Insufficient data for predictions'
        }
      });
    }
  }

  /**
   * Compare multiple cohorts with statistical significance testing
   */
  async compareCohorts(
    clubId: number,
    cohortAId: string,
    cohortBId: string,
    metrics: string[] = ['retention', 'revenue', 'lifetime_value']
  ): Promise<CohortComparison> {
    try {
      const response = await apiClient.post<CohortComparison>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/compare`,
        {
          cohortAId,
          cohortBId,
          metrics
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'comparing cohorts',
        action: 'Please verify cohort IDs and try again',
        customMessages: {
          404: 'One or more cohorts not found',
          400: 'Invalid comparison parameters'
        }
      });
    }
  }

  /**
   * Get cohort segmentation analysis
   */
  async getCohortSegmentation(
    clubId: number,
    cohortId: string,
    segmentBy: 'membershipType' | 'acquisitionChannel' | 'geography' | 'behavior'
  ): Promise<CohortSegment[]> {
    try {
      const response = await apiClient.get<CohortSegment[]>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/${cohortId}/segments`,
        {
          params: { segmentBy }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading cohort segmentation',
        action: 'Please try a different segmentation method',
        customMessages: {
          403: 'Segmentation analysis requires Expand tier'
        }
      });
    }
  }

  /**
   * Calculate member churn risk scores
   */
  async getChurnRiskAnalysis(
    clubId: number,
    cohortId?: string,
    riskThreshold: number = 0.7
  ): Promise<Array<{
    memberId: string;
    memberName: string;
    churnRisk: number;
    riskFactors: Array<{
      factor: string;
      impact: number;
      recommendation: string;
    }>;
    recommendedActions: string[];
  }>> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${clubId}/analytics/churn-risk`,
        {
          params: {
            cohortId,
            riskThreshold
          }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'analyzing churn risk',
        action: 'Please adjust risk threshold and try again',
        customMessages: {
          403: 'Churn risk analysis requires Expand tier'
        }
      });
    }
  }

  /**
   * Export cohort analysis data
   */
  async exportCohortData(
    clubId: number,
    cohortIds: string[],
    format: 'csv' | 'excel' | 'json',
    includeMembers: boolean = false
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await apiClient.post<{ downloadUrl: string; filename: string }>(
        `${this.baseUrl}/${clubId}/analytics/cohorts/export`,
        {
          cohortIds,
          format,
          includeMembers
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting cohort data',
        action: 'Please try with fewer cohorts or different format',
        customMessages: {
          413: 'Export too large, please reduce scope'
        }
      });
    }
  }

  /**
   * Get cohort benchmarks based on industry data
   */
  async getCohortBenchmarks(
    clubId: number,
    industryType?: string
  ): Promise<{
    industry: string;
    benchmarks: {
      retention: {
        period1: number;
        period3: number;
        period6: number;
        period12: number;
      };
      averageLifetime: number;
      churnRate: number;
      percentiles: {
        p25: number;
        p50: number;
        p75: number;
        p90: number;
      };
    };
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${clubId}/analytics/cohorts/benchmarks`,
        {
          params: { industryType }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading cohort benchmarks',
        action: 'Please try again later'
      });
    }
  }

  /**
   * Generate automated cohort insights
   */
  async getCohortInsights(
    clubId: number,
    analysisType: 'performance' | 'optimization' | 'trends' = 'performance'
  ): Promise<Array<{
    type: 'insight' | 'warning' | 'opportunity';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendedActions: string[];
    dataPoints: Record<string, any>;
  }>> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${clubId}/analytics/cohorts/insights`,
        {
          params: { analysisType }
        }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating cohort insights',
        action: 'Please try again or contact support'
      });
    }
  }

  /**
   * Real-time cohort metrics for dashboard
   */
  async getRealTimeCohortMetrics(clubId: number): Promise<{
    activeCohorts: number;
    newMembersToday: number;
    churnedMembersToday: number;
    averageRetentionTrend: number;
    topPerformingCohort: {
      id: string;
      label: string;
      retentionRate: number;
    };
    alerts: Array<{
      type: 'retention_drop' | 'churn_spike' | 'cohort_milestone';
      message: string;
      severity: 'info' | 'warning' | 'error';
      cohortId?: string;
    }>;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${clubId}/analytics/cohorts/realtime`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading real-time cohort metrics',
        action: 'Real-time data may be temporarily unavailable'
      });
    }
  }
}

// Export singleton instance
const cohortAnalysisService = new CohortAnalysisService();
export default cohortAnalysisService;
