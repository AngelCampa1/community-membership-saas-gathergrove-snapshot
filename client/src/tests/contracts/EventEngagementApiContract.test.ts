/**
 * Contract Tests for Event Engagement Analytics API
 * Verifies each method calls the exact bare endpoint path and correctly
 * unwraps the backend DTO shape.
 */

import { eventEngagementApiService } from '../../services/eventEngagementApiService';
import apiClient from '../../services/apiClient';
import type {
  EventEngagementMetricsResponse,
  ClubEventEngagementResponse,
  EventAnalyticsResponse,
  MemberEventEngagementHistoryResponse,
  EventAttendanceResponse,
  EventFeedbackResponse,
  EventRecommendationResponse,
} from '../../services/eventEngagementApiService';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }));
jest.mock('../../services/featureAnalyticsService', () => ({
  featureAnalyticsService: { trackFeatureUsage: jest.fn().mockResolvedValue(undefined) },
}));

beforeEach(() => jest.clearAllMocks());

describe('EventEngagementApiService — contract tests', () => {
  describe('GET /events/{eventId}/engagement', () => {
    it('calls bare path and returns EventEngagementMetricsResponse fields', async () => {
      const dto: EventEngagementMetricsResponse = {
        eventId: 10,
        eventName: 'Contract Event',
        eventDateTime: '2024-03-01T09:00:00Z',
        totalInvited: 50,
        totalRsvps: 40,
        totalAttended: 35,
        rsvpRate: 80.0,
        attendanceRate: 87.5,
        engagementScore: 84.0,
        engagementLevel: 'high',
        memberTypeBreakdown: { regular: 30, premium: 5 },
        topEngagementFactors: ['punctuality'],
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.getEventEngagement(10);

      expect(apiClient.get).toHaveBeenCalledWith('/events/10/engagement');
      expect(result.eventId).toBe(10);
      expect(result.engagementLevel).toBe('high');
      expect(result.topEngagementFactors).toContain('punctuality');
    });
  });

  describe('GET /clubs/{clubId}/events/engagement', () => {
    it('calls bare path with query params and returns ClubEventEngagementResponse', async () => {
      const dto: ClubEventEngagementResponse = {
        clubId: 2,
        clubName: 'Club Two',
        totalEvents: 10,
        totalMembers: 80,
        averageEventAttendance: 18.0,
        clubEventEngagementScore: 70.0,
        trends: {
          clubId: 2,
          dailyTrends: [],
          averageEngagementScore: 70.0,
          trendDirection: 0,
          totalEvents: 10,
          totalAttendances: 180,
        },
        topEvents: [],
        lowEngagementMembers: [],
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.getClubEventsEngagement(2, 'all', 90);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/2/events/engagement?timeframe=all&daysBack=90');
      expect(result.clubId).toBe(2);
      expect(result.trends.totalAttendances).toBe(180);
    });
  });

  describe('GET /events/analytics', () => {
    it('calls bare path with clubId and returns EventAnalyticsResponse', async () => {
      const dto: EventAnalyticsResponse = {
        clubId: 3,
        daysAnalyzed: 90,
        totalEvents: 20,
        totalMembers: 150,
        averageEngagementScore: 72.0,
        topPerformingEvents: [],
        generatedAt: '2024-03-15T00:00:00Z',
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.getEventAnalyticsDashboard(3, 90);

      expect(apiClient.get).toHaveBeenCalledWith('/events/analytics?clubId=3&daysBack=90');
      expect(result.averageEngagementScore).toBe(72.0);
      expect(result.generatedAt).toBe('2024-03-15T00:00:00Z');
    });
  });

  describe('GET /members/{memberId}/events/engagement', () => {
    it('calls bare path and returns MemberEventEngagementHistoryResponse', async () => {
      const dto: MemberEventEngagementHistoryResponse = {
        memberId: 5,
        daysAnalyzed: 180,
        eventEngagementScore: 78.5,
        totalEventsAttended: 12,
        attendanceHistory: [
          {
            id: 1,
            eventId: 20,
            memberId: 5,
            attendedAt: '2024-02-15T10:00:00Z',
            createdAt: '2024-02-15T10:01:00Z',
            eventName: 'Monthly Meetup',
            eventDateTime: '2024-02-15T10:00:00Z',
          },
        ],
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.getMemberEventEngagement(5);

      expect(apiClient.get).toHaveBeenCalledWith('/members/5/events/engagement?daysBack=180');
      expect(result.memberId).toBe(5);
      expect(result.eventEngagementScore).toBe(78.5);
      expect(result.attendanceHistory[0].eventName).toBe('Monthly Meetup');
    });
  });

  describe('POST /events/{eventId}/attendance', () => {
    it('POSTs to bare path and returns EventAttendanceResponse', async () => {
      const dto: EventAttendanceResponse = {
        id: 99,
        eventId: 7,
        memberId: 5,
        attendedAt: '2024-03-01T09:00:00Z',
        createdAt: '2024-03-01T09:01:00Z',
        eventName: 'Workshop',
        eventDateTime: '2024-03-01T09:00:00Z',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.recordEventAttendance(7, { memberId: 5 });

      expect(apiClient.post).toHaveBeenCalledWith('/events/7/attendance', { memberId: 5 });
      expect(result.id).toBe(99);
      expect(result.eventName).toBe('Workshop');
    });
  });

  describe('POST /events/{eventId}/feedback', () => {
    it('POSTs to bare path and returns EventFeedbackResponse', async () => {
      const dto: EventFeedbackResponse = {
        eventId: 7,
        memberId: 5,
        rating: 5,
        comments: 'Excellent',
        submittedAt: '2024-03-01T11:00:00Z',
        status: 'submitted',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.submitEventFeedback(7, { memberId: 5, rating: 5, comments: 'Excellent' });

      expect(apiClient.post).toHaveBeenCalledWith('/events/7/feedback', { memberId: 5, rating: 5, comments: 'Excellent' });
      expect(result.rating).toBe(5);
      expect(result.status).toBe('submitted');
    });
  });

  describe('GET /events/recommendations/{memberId}', () => {
    it('calls bare path and returns EventRecommendationResponse[]', async () => {
      const dto: EventRecommendationResponse[] = [
        {
          eventId: 30,
          eventName: 'Upcoming Workshop',
          eventDateTime: '2024-04-01T10:00:00Z',
          location: 'Hall B',
          recommendationScore: 0.91,
          recommendationReasons: ['high_engagement', 'topic_match'],
          attendanceProbability: 0.85,
        },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: dto });

      const result = await eventEngagementApiService.getEventRecommendations(5, 10);

      expect(apiClient.get).toHaveBeenCalledWith('/events/recommendations/5?limit=10');
      expect(result).toHaveLength(1);
      expect(result[0].attendanceProbability).toBe(0.85);
      expect(result[0].recommendationReasons).toContain('high_engagement');
    });
  });
});
