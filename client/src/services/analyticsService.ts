import authService from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

interface _ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Analytics Data Types
export interface EventEngagementAnalytics {
  clubId: number;
  clubName: string;
  analyticsDateRange: {
    start: Date | string;
    end: Date | string;
  };
  overallEngagementScore: number;
  eventMetrics: EventMetric[];
  memberEngagementBreakdown: MemberEngagement[];
  keyInsights: string[];
  recommendations: string[];
}

export interface EventMetric {
  eventId: number;
  eventName: string;
  eventDate: Date | string;
  totalRsvps: number;
  totalAttended: number;
  rsvpRate: number;
  attendanceRate: number;
  engagementScore: number;
}

export interface MemberEngagement {
  memberId: number;
  memberName: string;
  engagementLevel: 'Green' | 'Yellow' | 'Red';
  eventAttendanceRate: number;
  overallScore: number;
}

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
  eventAnalysis: EventMetric[];
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

class AnalyticsService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getEventEngagementAnalytics(
    clubId: number,
    startDate: Date,
    endDate: Date
  ): Promise<EventEngagementAnalytics> {
    // Validation
    if (clubId <= 0) {
      throw new Error('Club ID must be greater than 0');
    }
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // Updated to use MemberEngagementController endpoint
    const endpoint = `/api/v1/MemberEngagement/club/${clubId}/trends?daysBack=30`;
    return this.makeRequest<EventEngagementAnalytics>(endpoint);
  }

  async getEngagementTrends(clubId: number, daysBack: number): Promise<EngagementTrends> {
    if (daysBack <= 0) {
      throw new Error('Days back must be greater than 0');
    }
    if (daysBack > 365) {
      throw new Error('Days back cannot exceed 365');
    }

    // Updated to use AdvancedAnalyticsController endpoint
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const endpoint = `/api/clubs/${clubId}/analytics/premium/engagement-trends?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    return this.makeRequest<EngagementTrends>(endpoint);
  }

  async getEngagementBenchmarks(clubId: number): Promise<EngagementBenchmarks> {
    // Updated to use MemberEngagementController endpoint for overview
    const endpoint = `/api/v1/MemberEngagement/club/${clubId}/overview`;
    return this.makeRequest<EngagementBenchmarks>(endpoint);
  }

  async getMemberEngagementInsights(
    clubId: number,
    memberId: number,
    analysisPeriodDays: number
  ): Promise<MemberEngagementInsights> {
    // Updated to use MemberEngagementController endpoint
    const endpoint = `/api/v1/MemberEngagement/${memberId}/history?daysBack=${analysisPeriodDays}`;
    return this.makeRequest<MemberEngagementInsights>(endpoint);
  }

  async getEventRecommendations(
    clubId: number,
    memberId: number,
    maxRecommendations: number
  ): Promise<EventRecommendation[]> {
    if (maxRecommendations <= 0) {
      throw new Error('Max recommendations must be greater than 0');
    }
    if (maxRecommendations > 20) {
      throw new Error('Max recommendations cannot exceed 20');
    }

    // Updated to call real backend endpoint
    const endpoint = `/api/clubs/${clubId}/analytics/premium/event-recommendations?memberId=${memberId}&maxRecommendations=${maxRecommendations}`;
    return this.makeRequest<EventRecommendation[]>(endpoint);
  }

  async analyzeEventPerformance(eventId: number, clubId: number): Promise<EventPerformanceAnalysis> {
    // Updated to call real backend endpoint
    const endpoint = `/api/clubs/${clubId}/analytics/premium/event-performance/${eventId}`;
    return this.makeRequest<EventPerformanceAnalysis>(endpoint);
  }

  async predictEventSuccess(eventId: number, clubId: number): Promise<EventSuccessPrediction> {
    // Updated to call real backend endpoint
    const endpoint = `/api/clubs/${clubId}/analytics/premium/event-success-prediction/${eventId}`;
    return this.makeRequest<EventSuccessPrediction>(endpoint);
  }

  async generateEngagementReport(
    clubId: number,
    reportType: 'basic' | 'comprehensive' | 'executive',
    startDate: Date,
    endDate: Date
  ): Promise<EngagementReport> {
    if (!['basic', 'comprehensive', 'executive'].includes(reportType)) {
      throw new Error('Invalid report type');
    }

    // Updated to call real backend endpoint
    const endpoint = `/api/clubs/${clubId}/analytics/premium/engagement-report`;
    return this.makeRequest<EngagementReport>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    });
  }

  async getROIMetrics(clubId: number, periodMonths: number): Promise<ROIMetrics> {
    if (periodMonths <= 0) {
      throw new Error('Period months must be greater than 0');
    }
    if (periodMonths > 36) {
      throw new Error('Period months cannot exceed 36');
    }

    // Updated to use AdvancedAnalyticsController endpoint
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periodMonths);
    const endpoint = `/api/clubs/${clubId}/analytics/premium/roi?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    return this.makeRequest<ROIMetrics>(endpoint);
  }
}

export const analyticsService = new AnalyticsService();

// Export individual functions for backward compatibility
export const getEventEngagementAnalytics = (clubId: number, startDate: Date, endDate: Date) => 
  analyticsService.getEventEngagementAnalytics(clubId, startDate, endDate);

export const getEngagementTrends = (clubId: number, daysBack: number) => 
  analyticsService.getEngagementTrends(clubId, daysBack);

export const getEngagementBenchmarks = (clubId: number) => 
  analyticsService.getEngagementBenchmarks(clubId);

export const getMemberEngagementInsights = (clubId: number, memberId: number, periodDays: number) => 
  analyticsService.getMemberEngagementInsights(clubId, memberId, periodDays);

export const getEventRecommendations = (clubId: number, memberId?: number, maxRecommendations?: number) => 
  analyticsService.getEventRecommendations(clubId, memberId ?? 0, maxRecommendations ?? 10);

export const analyzeEventPerformance = (eventId: number, clubId: number) =>
  analyticsService.analyzeEventPerformance(eventId, clubId);

export const predictEventSuccess = (eventId: number, clubId: number) =>
  analyticsService.predictEventSuccess(eventId, clubId);

export const generateEngagementReport = (clubId: number, reportType: 'basic' | 'comprehensive' | 'executive', startDate: Date, endDate: Date) => 
  analyticsService.generateEngagementReport(clubId, reportType, startDate, endDate);

export const getROIMetrics = (clubId: number, periodMonths: number) => 
  analyticsService.getROIMetrics(clubId, periodMonths);