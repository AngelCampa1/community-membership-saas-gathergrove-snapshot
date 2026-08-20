import apiClient from './apiClient';
import { logger } from '@/lib/logger';

// API Request Types
export interface RecordEventAttendanceRequest {
  memberId: number;
  attendedAt?: string;
  notes?: string;
}

export interface SubmitEventFeedbackRequest {
  memberId: number;
  rating: number;
  comments?: string;
  tags?: string[];
}

// Backend DTO response types (camelCase, matching backend serialization)
export interface EventEngagementMetricsResponse {
  eventId: number;
  eventName: string;
  eventDateTime: string;
  totalInvited: number;
  totalRsvps: number;
  totalAttended: number;
  rsvpRate: number;
  attendanceRate: number;
  engagementScore: number;
  engagementLevel: string;
  memberTypeBreakdown: Record<string, number>;
  topEngagementFactors: string[];
}

export interface DailyEventEngagementResponse {
  date: string;
  eventsHeld: number;
  totalAttendance: number;
  averageEngagementScore: number;
}

export interface EventEngagementTrendsResponse {
  clubId: number;
  dailyTrends: DailyEventEngagementResponse[];
  averageEngagementScore: number;
  trendDirection: number;
  totalEvents: number;
  totalAttendances: number;
}

// Member item as returned inside lowEngagementMembers (different shape from history response)
export interface MemberEventEngagementItem {
  memberId: number;
  memberName: string;
  email: string;
  eventsInvited: number;
  eventsRsvped: number;
  eventsAttended: number;
  eventEngagementScore: number;
  engagementLevel: string;
  lastEventAttendance: string;
  preferredEventTypes: string[];
}

export interface ClubEventEngagementResponse {
  clubId: number;
  clubName: string;
  totalEvents: number;
  totalMembers: number;
  averageEventAttendance: number;
  clubEventEngagementScore: number;
  trends: EventEngagementTrendsResponse;
  topEvents: EventEngagementMetricsResponse[];
  lowEngagementMembers: MemberEventEngagementItem[];
}

export interface EventAttendanceResponse {
  id: number;
  eventId: number;
  memberId: number;
  attendedAt: string;
  createdAt: string;
  notes?: string | null;
  eventName: string;
  eventDateTime: string;
}

export interface MemberEventEngagementHistoryResponse {
  memberId: number;
  daysAnalyzed: number;
  eventEngagementScore: number;
  totalEventsAttended: number;
  attendanceHistory: EventAttendanceResponse[];
}

export interface EventAnalyticsResponse {
  clubId: number | null;
  daysAnalyzed: number;
  totalEvents: number;
  totalMembers: number;
  averageEngagementScore: number;
  topPerformingEvents: EventEngagementMetricsResponse[];
  generatedAt: string;
}

export interface EventFeedbackResponse {
  eventId: number;
  memberId: number;
  rating: number;
  comments?: string | null;
  submittedAt: string;
  status: string;
}

export interface EventRecommendationResponse {
  eventId: number;
  eventName: string;
  eventDateTime: string;
  location: string;
  recommendationScore: number;
  recommendationReasons: string[];
  attendanceProbability: number;
}

// Legacy shape used by EventEngagementDashboard component (kept for backward compatibility)
export interface LegacyEventAnalyticsResponse {
  metrics: {
    totalEvents: number;
    totalAttendance: number;
    averageAttendanceRate: number;
    memberEngagementScore: number;
    eventSatisfactionScore: number;
    repeatAttendanceRate: number;
    noShowRate: number;
    lastUpdated: string;
  };
  attendanceData: {
    eventId: number;
    eventName: string;
    eventDate: string;
    expectedAttendance: number;
    actualAttendance: number;
    attendanceRate: number;
    category: string;
    eventType: 'meeting' | 'workshop' | 'social' | 'tournament' | 'competition' | 'other';
    duration: number;
    location: string;
  }[];
  feedbackData: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  memberEngagement: Record<string, unknown>[];
  impactMetrics: Record<string, unknown>[];
  trendData: {
    month: string;
    eventsHeld: number;
    totalAttendance: number;
    averageRating: number;
    memberEngagement: number;
    revenueGenerated: number;
  }[];
  topPerformingEvents: {
    eventId: number;
    eventName: string;
    eventDate: string;
    rsvpCount: number;
    attendanceCount: number;
    attendanceRate: number;
  }[];
  upcomingEvents: {
    eventId: number;
    eventName: string;
    eventDate: string;
    rsvpCount: number;
    attendanceCount: number;
    attendanceRate: number;
  }[];
}

class EventEngagementApiService {
  /**
   * Get comprehensive engagement metrics for a specific event
   */
  async getEventEngagement(eventId: number): Promise<EventEngagementMetricsResponse> {
    const response = await apiClient.get<EventEngagementMetricsResponse>(
      `/events/${eventId}/engagement`
    );
    return response.data;
  }

  /**
   * Get event engagement overview for all events in a club
   */
  async getClubEventsEngagement(
    clubId: number,
    timeframe: string = 'all',
    daysBack: number = 90
  ): Promise<ClubEventEngagementResponse> {
    const response = await apiClient.get<ClubEventEngagementResponse>(
      `/clubs/${clubId}/events/engagement?timeframe=${timeframe}&daysBack=${daysBack}`
    );
    return response.data;
  }

  /**
   * Get comprehensive event analytics dashboard data
   */
  async getEventAnalyticsDashboard(
    clubId?: number,
    daysBack: number = 90
  ): Promise<EventAnalyticsResponse> {
    const params = new URLSearchParams();
    if (clubId) params.append('clubId', clubId.toString());
    params.append('daysBack', daysBack.toString());

    const response = await apiClient.get<EventAnalyticsResponse>(
      `/events/analytics?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get event engagement history for a specific member
   */
  async getMemberEventEngagement(
    memberId: number,
    daysBack: number = 180
  ): Promise<MemberEventEngagementHistoryResponse> {
    const response = await apiClient.get<MemberEventEngagementHistoryResponse>(
      `/members/${memberId}/events/engagement?daysBack=${daysBack}`
    );
    return response.data;
  }

  /**
   * Record event attendance for a member
   */
  async recordEventAttendance(
    eventId: number,
    request: RecordEventAttendanceRequest
  ): Promise<EventAttendanceResponse> {
    const response = await apiClient.post<EventAttendanceResponse>(
      `/events/${eventId}/attendance`,
      request
    );
    return response.data;
  }

  /**
   * Submit feedback for an event
   */
  async submitEventFeedback(
    eventId: number,
    request: SubmitEventFeedbackRequest
  ): Promise<EventFeedbackResponse> {
    const response = await apiClient.post<EventFeedbackResponse>(
      `/events/${eventId}/feedback`,
      request
    );
    return response.data;
  }

  /**
   * Get personalized event recommendations for a member
   */
  async getEventRecommendations(
    memberId: number,
    limit: number = 10
  ): Promise<EventRecommendationResponse[]> {
    const response = await apiClient.get<EventRecommendationResponse[]>(
      `/events/recommendations/${memberId}?limit=${limit}`
    );
    return response.data;
  }

  /**
   * Transform analytics dashboard response to match legacy interface.
   * Maps ONLY real backend fields; unavailable metrics are set to honest
   * neutral defaults (0 / '' / []) — never random or invented values.
   */
  async getEventAnalytics(clubId: number, timeRange: number): Promise<LegacyEventAnalyticsResponse> {
    try {
      const [dashboard, clubEvents] = await Promise.all([
        this.getEventAnalyticsDashboard(clubId, timeRange),
        this.getClubEventsEngagement(clubId, 'all', timeRange)
      ]);

      const legacyResponse: LegacyEventAnalyticsResponse = {
        metrics: {
          totalEvents: dashboard.totalEvents,
          totalAttendance: clubEvents.trends.totalAttendances,
          averageAttendanceRate: clubEvents.averageEventAttendance,
          memberEngagementScore: dashboard.averageEngagementScore,
          eventSatisfactionScore: 0,    // backend has no satisfaction metric
          repeatAttendanceRate: 0,      // not available
          noShowRate: 0,                // not available
          lastUpdated: dashboard.generatedAt
        },
        attendanceData: clubEvents.topEvents.map(e => ({
          eventId: e.eventId,
          eventName: e.eventName,
          eventDate: e.eventDateTime,
          expectedAttendance: e.totalRsvps,
          actualAttendance: e.totalAttended,
          attendanceRate: e.attendanceRate,
          category: '',
          eventType: 'other' as const,
          duration: 0,
          location: ''
        })),
        feedbackData: [],
        recommendations: [],
        memberEngagement: [],
        impactMetrics: [],
        trendData: clubEvents.trends.dailyTrends.map(d => ({
          month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
          eventsHeld: d.eventsHeld,
          totalAttendance: d.totalAttendance,
          averageRating: 0,           // no rating data from backend
          memberEngagement: d.averageEngagementScore,
          revenueGenerated: 0         // no revenue data from backend
        })),
        topPerformingEvents: clubEvents.topEvents.map(e => ({
          eventId: e.eventId,
          eventName: e.eventName,
          eventDate: e.eventDateTime,
          rsvpCount: e.totalRsvps,
          attendanceCount: e.totalAttended,
          attendanceRate: e.attendanceRate
        })),
        upcomingEvents: []  // no upcoming-events endpoint exists
      };

      return legacyResponse;
    } catch (error) {
      logger.error('Error transforming event analytics data', error);
      throw error;
    }
  }

  /**
   * Helper method to track feature usage with current session
   */
  trackFeature(clubId: number, featureName: string, platform: string = 'web', metadata?: Record<string, unknown>): void {
    // Get or create session ID
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }

    // Use feature analytics service for tracking
    // BUG FIX: Added .catch() for dynamic import to handle module load errors
    import('./featureAnalyticsService').then(({ featureAnalyticsService }) => {
      featureAnalyticsService.trackFeatureUsage(clubId, {
        featureName,
        platform,
        sessionId,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }).catch(error => {
        logger.error('Failed to track feature usage', error);
      });
    }).catch(error => {
      logger.error('Failed to load featureAnalyticsService module', error);
    });
  }
}

export const eventEngagementApiService = new EventEngagementApiService();
