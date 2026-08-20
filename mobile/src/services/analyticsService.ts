/**
 * Analytics Service
 * Handles all analytics-related API calls for engagement metrics, performance analysis, and ROI
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '@/constants';
import { authService } from './authService';

// Types for analytics responses
export interface EventEngagementAnalytics {
  eventId: number;
  clubId: number;
  totalRsvps: number;
  totalAttended: number;
  attendanceRate: number;
  engagementScore: number;
  noShowRate: number;
  averageFeedbackRating?: number;
  feedbackCount: number;
  trends: EngagementTrend[];
  topMembers: TopMember[];
  atRiskMembers: AtRiskMember[];
}

export interface EngagementTrend {
  date: string;
  rsvpCount: number;
  attendanceCount: number;
  engagementScore: number;
}

export interface TopMember {
  memberId: number;
  memberName: string;
  eventsAttended: number;
  averageEngagement: number;
  rsvpRate: number;
}

export interface AtRiskMember {
  memberId: number;
  memberName: string;
  riskScore: number;
  lastEventDate?: string;
  consecutiveNoShows: number;
}

export interface MemberEngagementInsights {
  memberId: number;
  clubId: number;
  periodDays: number;
  totalEventsInPeriod: number;
  eventsRsvped: number;
  eventsAttended: number;
  rsvpRate: number;
  attendanceRate: number;
  averageEngagementScore: number;
  noShowCount: number;
  consecutiveNoShows: number;
  lastEventDate?: string;
  engagementTrend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface EventPerformanceAnalysis {
  eventId: number;
  eventName: string;
  eventDate: string;
  performanceScore: number;
  attendanceAnalysis: {
    totalRsvps: number;
    totalAttended: number;
    attendanceRate: number;
    noShowRate: number;
  };
  engagementBreakdown: Record<string, unknown>;
  comparisonToAverage: {
    attendanceRateVsAverage: number;
    engagementScoreVsAverage: number;
  };
  improvementSuggestions: string[];
}

export interface EventROIMetrics {
  clubId: number;
  periodMonths: number;
  totalEvents: number;
  totalRevenue: number;
  totalCosts: number;
  netROI: number;
  roiPercentage: number;
  averageRevenuePerEvent: number;
  averageCostPerEvent: number;
  averageAttendancePerEvent: number;
  costPerAttendee: number;
  revenuePerAttendee: number;
  topPerformingEvents: TopPerformingEvent[];
}

export interface TopPerformingEvent {
  eventId: number;
  eventName: string;
  eventDate: string;
  revenue: number;
  attendance: number;
  roi: number;
}

export interface BasicEventAnalytics {
  eventId: number;
  clubId: number;
  attendance: {
    total: number;
    rsvps: number;
    checkIns: number;
    attendanceRate: number;
  };
  performanceScore: number;
  comparisonToAverage: {
    attendanceRateVsAverage: number;
    engagementScoreVsAverage: number;
  };
}

export interface AnalyticsError {
  message: string;
  code?: string;
  details?: unknown;
}

class AnalyticsService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - token expired or invalid
          console.error('Analytics API: Unauthorized - token may be expired');
        } else if (error.response?.status === 403) {
          // Handle forbidden - user doesn't have access to this club/resource
          console.error('Analytics API: Forbidden - user not authorized for this resource');
        } else if (error.response?.status === 404) {
          // Handle not found - event/club doesn't exist
          console.error('Analytics API: Resource not found');
        } else if (error.code === 'ECONNABORTED') {
          // Handle timeout
          console.error('Analytics API: Request timeout');
        } else if (!error.response) {
          // Network error
          console.error('Analytics API: Network error - please check connection');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get event engagement analytics
   * @param clubId - The club ID
   * @param eventId - The event ID
   * @param startDate - Optional start date for analytics period
   * @param endDate - Optional end date for analytics period
   * @returns Event engagement analytics data
   */
  async getEventEngagementAnalytics(
    clubId: number,
    eventId: number,
    startDate?: string,
    endDate?: string
  ): Promise<EventEngagementAnalytics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = API_CONFIG.ENDPOINTS.EVENT_ENGAGEMENT_ANALYTICS(clubId, eventId);
      const queryString = params.toString();
      const response = await this.axiosInstance.get(
        queryString ? `${url}?${queryString}` : url
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get event engagement analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get member engagement insights
   * @param clubId - The club ID
   * @param memberId - Optional member ID (defaults to current user)
   * @param periodDays - Number of days to analyze (default: 90)
   * @returns Member engagement insights
   */
  async getMemberEngagementInsights(
    clubId: number,
    memberId?: number,
    periodDays: number = 90
  ): Promise<MemberEngagementInsights> {
    try {
      const params = new URLSearchParams();
      if (memberId) params.append('memberId', memberId.toString());
      params.append('periodDays', periodDays.toString());

      const url = API_CONFIG.ENDPOINTS.MEMBER_ENGAGEMENT_INSIGHTS(clubId);
      const response = await this.axiosInstance.get(`${url}?${params.toString()}`);

      return response.data;
    } catch (error) {
      console.error('Failed to get member engagement insights:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get event performance analysis
   * @param clubId - The club ID
   * @param eventId - The event ID
   * @returns Event performance analysis
   */
  async getEventPerformanceAnalysis(
    clubId: number,
    eventId: number
  ): Promise<EventPerformanceAnalysis> {
    try {
      const url = API_CONFIG.ENDPOINTS.EVENT_PERFORMANCE_ANALYSIS(clubId, eventId);
      const response = await this.axiosInstance.get(url);

      return response.data;
    } catch (error) {
      console.error('Failed to get event performance analysis:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get ROI metrics for a club
   * @param clubId - The club ID
   * @param periodMonths - Number of months to analyze (default: 6)
   * @returns ROI metrics
   */
  async getROIMetrics(
    clubId: number,
    periodMonths: number = 6
  ): Promise<EventROIMetrics> {
    try {
      const params = new URLSearchParams();
      params.append('periodMonths', periodMonths.toString());

      const url = API_CONFIG.ENDPOINTS.EVENT_ROI_METRICS(clubId);
      const response = await this.axiosInstance.get(`${url}?${params.toString()}`);

      return response.data;
    } catch (error) {
      console.error('Failed to get ROI metrics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get basic event analytics (attendance, RSVPs, check-ins)
   * @param clubId - The club ID
   * @param eventId - The event ID
   * @returns Basic event analytics
   */
  async getBasicEventAnalytics(
    clubId: number,
    eventId: number
  ): Promise<BasicEventAnalytics> {
    try {
      const url = API_CONFIG.ENDPOINTS.BASIC_EVENT_ANALYTICS(clubId, eventId);
      const response = await this.axiosInstance.get(url);

      return response.data;
    } catch (error) {
      console.error('Failed to get basic event analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: unknown): AnalyticsError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.response) {
        // Server responded with error status
        return {
          message: axiosError.response.data?.message || 'Failed to fetch analytics data',
          code: axiosError.response.status.toString(),
          details: axiosError.response.data,
        };
      } else if (axiosError.request) {
        // Request made but no response received
        return {
          message: 'Network error - please check your connection',
          code: 'NETWORK_ERROR',
        };
      }
    }

    // Unknown error
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }
}

// Export singleton instance
export default new AnalyticsService();
