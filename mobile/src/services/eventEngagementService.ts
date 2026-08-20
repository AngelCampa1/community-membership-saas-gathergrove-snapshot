/**
 * Event Engagement Analytics Service
 * Provides tier-based access to event engagement analytics with proper authorization
 */

import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { clubAuthorizationService } from './clubAuthorizationService';
import { API_CONFIG } from '@/constants';

export interface EventEngagementAnalytics {
  eventId: number;
  eventName: string;
  eventDateTime: Date;
  totalRegistrations: number;
  totalAttendees: number;
  attendanceRate: number;
  engagementScore: number;
  satisfactionRating: number;
  engagementLevel: string;
  lastUpdated: Date;
}

export interface MemberEngagementInsights {
  memberId: number;
  memberName: string;
  clubId: number;
  analysisPeriod: number;
  eventAttendanceRate: number;
  rsvpAccuracyRate: number;
  engagementTrend: string;
  engagementLevel: string;
  recommendedActions: string[];
  averageEngagementScore: number;
  totalEventsAttended: number;
  totalEventsRegistered: number;
  lastEventAttended: Date;
  engagementMetrics: Record<string, number>;
}

export interface EventPerformanceAnalysis {
  eventId: number;
  eventName: string;
  eventDate: Date;
  performanceScore: number;
  attendanceAnalysis: {
    totalRsvps: number;
    totalAttended: number;
    attendanceRate: number;
    noShowRate: number;
  };
  engagementBreakdown: Record<string, number>;
  comparisonToAverage: {
    attendanceRateVsAverage: number;
    engagementScoreVsAverage: number;
  };
  improvementSuggestions: string[];
}

export interface EventROIMetrics {
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

class EventEngagementService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-Client': 'true',
        'User-Agent': 'GatherGrove-Mobile/1.0.0',
      },
    });

    this.setupRequestInterceptor();
  }

  /**
   * Set up request interceptor to add JWT token to requests
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        config.headers['X-Mobile-Client'] = 'true';
        config.headers['User-Agent'] = 'GatherGrove-Mobile/1.0.0';

        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get event engagement analytics for a specific event
   * Requires Expand tier access to EventEngagementAnalytics feature
   */
  async getEventEngagementAnalytics(clubId: number, eventId: number): Promise<EventEngagementAnalytics> {
    // Check if user has access to the club
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: User not authenticated');
    }
    const hasClubAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
    
    if (!hasClubAccess) {
      throw new Error('Unauthorized: No access to this club');
    }

    // Check if club has access to EventEngagementAnalytics feature
    const hasFeatureAccess = await clubAuthorizationService.hasFeatureAccess(clubId, 'EventEngagementAnalytics');
    
    if (!hasFeatureAccess) {
      const clubTier = await clubAuthorizationService.getClubTier(clubId);
      throw new Error(`Unauthorized: EventEngagementAnalytics requires Expand. Current tier: ${clubTier}`);
    }

    // MOCK-02 fix: Make real API call instead of returning mock data
    try {
      const response = await this.axiosInstance.get<EventEngagementAnalytics>(
        API_CONFIG.ENDPOINTS.EVENT_ENGAGEMENT_ANALYTICS(clubId, eventId)
      );
      return {
        ...response.data,
        eventDateTime: new Date(response.data.eventDateTime),
        lastUpdated: new Date(response.data.lastUpdated),
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[EventEngagement] API call failed, analytics endpoint may not be implemented yet:', error instanceof Error ? error.message : error);
      }
      throw new Error('Event engagement analytics are not available. Please try again later.');
    }
  }

  /**
   * Get member engagement insights
   * Requires Expand tier access to MemberEngagementInsights feature
   */
  async getMemberEngagementInsights(clubId: number, memberId?: number): Promise<MemberEngagementInsights[]> {
    // Check club access
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: User not authenticated');
    }
    const hasClubAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
    
    if (!hasClubAccess) {
      throw new Error('Unauthorized: No access to this club');
    }

    const hasFeatureAccess = await clubAuthorizationService.hasFeatureAccess(clubId, 'MemberEngagementInsights');
    
    if (!hasFeatureAccess) {
      const clubTier = await clubAuthorizationService.getClubTier(clubId);
      throw new Error(`Unauthorized: MemberEngagementInsights requires Expand. Current tier: ${clubTier}`);
    }

    // MOCK-02 fix: Make real API call instead of returning mock data
    try {
      const url = memberId
        ? `${API_CONFIG.ENDPOINTS.MEMBER_ENGAGEMENT_INSIGHTS(clubId)}?memberId=${memberId}`
        : API_CONFIG.ENDPOINTS.MEMBER_ENGAGEMENT_INSIGHTS(clubId);
      const response = await this.axiosInstance.get<MemberEngagementInsights[]>(url);
      return response.data.map(insight => ({
        ...insight,
        lastEventAttended: new Date(insight.lastEventAttended),
      }));
    } catch (error) {
      if (__DEV__) {
        console.warn('[EventEngagement] API call failed, insights endpoint may not be implemented yet:', error instanceof Error ? error.message : error);
      }
      throw new Error('Member engagement insights are not available. Please try again later.');
    }
  }

  /**
   * Get event performance analysis
   * Requires Expand tier access to EventPerformanceAnalysis feature
   */
  async getEventPerformanceAnalysis(clubId: number, eventId: number): Promise<EventPerformanceAnalysis> {
    // Check authorization
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: User not authenticated');
    }
    const hasClubAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
    
    if (!hasClubAccess) {
      throw new Error('Unauthorized: No access to this club');
    }

    // Check feature access
    const hasFeatureAccess = await clubAuthorizationService.hasFeatureAccess(clubId, 'EventPerformanceAnalysis');

    if (!hasFeatureAccess) {
      const clubTier = await clubAuthorizationService.getClubTier(clubId);
      throw new Error(`Unauthorized: EventPerformanceAnalysis requires Expand. Current tier: ${clubTier}`);
    }

    // MOCK-02 fix: Make real API call instead of returning mock data
    try {
      const response = await this.axiosInstance.get<EventPerformanceAnalysis>(
        API_CONFIG.ENDPOINTS.EVENT_PERFORMANCE_ANALYSIS(clubId, eventId)
      );
      return {
        ...response.data,
        eventDate: new Date(response.data.eventDate),
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[EventEngagement] API call failed, performance analysis endpoint may not be implemented yet:', error instanceof Error ? error.message : error);
      }
      throw new Error('Event performance analysis is not available. Please try again later.');
    }
  }

  /**
   * Get ROI metrics for events
   * Requires Expand tier access to ROIMetrics feature
   */
  async getEventROIMetrics(clubId: number, periodMonths: number = 12): Promise<EventROIMetrics> {
    // Check authorization
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: User not authenticated');
    }
    const hasClubAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
    
    if (!hasClubAccess) {
      throw new Error('Unauthorized: No access to this club');
    }

    // Check feature access
    const hasFeatureAccess = await clubAuthorizationService.hasFeatureAccess(clubId, 'ROIMetrics');

    if (!hasFeatureAccess) {
      const clubTier = await clubAuthorizationService.getClubTier(clubId);
      throw new Error(`Unauthorized: ROIMetrics requires Expand. Current tier: ${clubTier}`);
    }

    // MOCK-02 fix: Make real API call instead of returning mock data
    try {
      const response = await this.axiosInstance.get<EventROIMetrics>(
        `${API_CONFIG.ENDPOINTS.EVENT_ROI_METRICS(clubId)}?periodMonths=${periodMonths}`
      );
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.warn('[EventEngagement] API call failed, ROI metrics endpoint may not be implemented yet:', error instanceof Error ? error.message : error);
      }
      throw new Error('ROI metrics are not available. Please try again later.');
    }
  }

  /**
   * Get engagement trends for Growth tier (limited analytics)
   * Growth tier gets basic EventAnalytics but not EventEngagementAnalytics
   */
  async getBasicEventAnalytics(clubId: number, eventId: number): Promise<Partial<EventEngagementAnalytics>> {
    // Check authorization
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: User not authenticated');
    }
    const hasClubAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
    
    if (!hasClubAccess) {
      throw new Error('Unauthorized: No access to this club');
    }

    // Growth tier has EventAnalytics but not EventEngagementAnalytics
    const hasEventAnalytics = await clubAuthorizationService.hasFeatureAccess(clubId, 'EventAnalytics');

    if (!hasEventAnalytics) {
      const clubTier = await clubAuthorizationService.getClubTier(clubId);
      throw new Error(`Unauthorized: EventAnalytics requires Growth tier or higher. Current tier: ${clubTier}`);
    }

    // MOCK-02 fix: Make real API call instead of returning mock data
    try {
      const response = await this.axiosInstance.get<Partial<EventEngagementAnalytics>>(
        API_CONFIG.ENDPOINTS.BASIC_EVENT_ANALYTICS(clubId, eventId)
      );
      return {
        ...response.data,
        eventDateTime: response.data.eventDateTime ? new Date(response.data.eventDateTime) : undefined,
        lastUpdated: response.data.lastUpdated ? new Date(response.data.lastUpdated) : undefined,
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[EventEngagement] API call failed, basic analytics endpoint may not be implemented yet:', error instanceof Error ? error.message : error);
      }
      throw new Error('Event analytics are not available. Please try again later.');
    }
  }
}

export const eventEngagementService = new EventEngagementService();
