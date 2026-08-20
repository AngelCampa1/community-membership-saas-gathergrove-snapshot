import { eventEngagementApiService } from '../eventEngagementApiService';
import apiClient from '../apiClient';
import type {
  EventEngagementMetricsResponse,
  ClubEventEngagementResponse,
  EventAnalyticsResponse,
  MemberEventEngagementHistoryResponse,
  EventAttendanceResponse,
  EventFeedbackResponse,
  EventRecommendationResponse,
  RecordEventAttendanceRequest,
  SubmitEventFeedbackRequest,
} from '../eventEngagementApiService';

// Mock only the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../featureAnalyticsService', () => ({
  featureAnalyticsService: {
    trackFeatureUsage: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('EventEngagementApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventEngagement', () => {
    it('calls correct bare path and returns backend DTO', async () => {
      const mockResponse: EventEngagementMetricsResponse = {
        eventId: 1,
        eventName: 'Test Event',
        eventDateTime: '2024-01-15T10:00:00Z',
        totalInvited: 60,
        totalRsvps: 50,
        totalAttended: 32,
        rsvpRate: 83.3,
        attendanceRate: 64.0,
        engagementScore: 72.5,
        engagementLevel: 'medium',
        memberTypeBreakdown: { regular: 30, premium: 2 },
        topEngagementFactors: ['early_rsvp', 'repeat_attender'],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.getEventEngagement(1);

      expect(apiClient.get).toHaveBeenCalledWith('/events/1/engagement');
      expect(result.eventId).toBe(1);
      expect(result.eventDateTime).toBe('2024-01-15T10:00:00Z');
      expect(result.totalRsvps).toBe(50);
      expect(result.attendanceRate).toBe(64.0);
      expect(result.memberTypeBreakdown).toEqual({ regular: 30, premium: 2 });
    });

    it('propagates errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Server error'));
      await expect(eventEngagementApiService.getEventEngagement(1)).rejects.toThrow('Server error');
    });
  });

  describe('getClubEventsEngagement', () => {
    it('calls correct bare path with default params', async () => {
      const mockResponse: ClubEventEngagementResponse = {
        clubId: 1,
        clubName: 'Test Club',
        totalEvents: 25,
        totalMembers: 100,
        averageEventAttendance: 20.4,
        clubEventEngagementScore: 74.2,
        trends: {
          clubId: 1,
          dailyTrends: [],
          averageEngagementScore: 74.2,
          trendDirection: 1,
          totalEvents: 25,
          totalAttendances: 510,
        },
        topEvents: [],
        lowEngagementMembers: [],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.getClubEventsEngagement(1);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/1/events/engagement?timeframe=all&daysBack=90');
      expect(result.clubId).toBe(1);
      expect(result.trends.totalAttendances).toBe(510);
    });

    it('passes custom timeframe and daysBack', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { clubId: 1, clubName: '', totalEvents: 0, totalMembers: 0, averageEventAttendance: 0, clubEventEngagementScore: 0, trends: { clubId: 1, dailyTrends: [], averageEngagementScore: 0, trendDirection: 0, totalEvents: 0, totalAttendances: 0 }, topEvents: [], lowEngagementMembers: [] } });

      await eventEngagementApiService.getClubEventsEngagement(5, 'recent', 30);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/5/events/engagement?timeframe=recent&daysBack=30');
    });
  });

  describe('getEventAnalyticsDashboard', () => {
    it('calls correct bare path with clubId', async () => {
      const mockResponse: EventAnalyticsResponse = {
        clubId: 1,
        daysAnalyzed: 90,
        totalEvents: 50,
        totalMembers: 200,
        averageEngagementScore: 68.5,
        topPerformingEvents: [],
        generatedAt: '2024-01-15T12:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.getEventAnalyticsDashboard(1);

      expect(apiClient.get).toHaveBeenCalledWith('/events/analytics?clubId=1&daysBack=90');
      expect(result.totalEvents).toBe(50);
      expect(result.averageEngagementScore).toBe(68.5);
    });

    it('omits clubId param when not provided', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { clubId: null, daysAnalyzed: 90, totalEvents: 0, totalMembers: 0, averageEngagementScore: 0, topPerformingEvents: [], generatedAt: '' } });

      await eventEngagementApiService.getEventAnalyticsDashboard();

      expect(apiClient.get).toHaveBeenCalledWith('/events/analytics?daysBack=90');
    });
  });

  describe('getMemberEventEngagement', () => {
    it('calls correct bare path and returns history DTO', async () => {
      const mockResponse: MemberEventEngagementHistoryResponse = {
        memberId: 7,
        daysAnalyzed: 180,
        eventEngagementScore: 82.1,
        totalEventsAttended: 15,
        attendanceHistory: [
          { id: 1, eventId: 10, memberId: 7, attendedAt: '2024-01-10T10:00:00Z', createdAt: '2024-01-10T10:05:00Z', eventName: 'Workshop', eventDateTime: '2024-01-10T10:00:00Z' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.getMemberEventEngagement(7);

      expect(apiClient.get).toHaveBeenCalledWith('/members/7/events/engagement?daysBack=180');
      expect(result.memberId).toBe(7);
      expect(result.eventEngagementScore).toBe(82.1);
      expect(result.totalEventsAttended).toBe(15);
      expect(result.attendanceHistory).toHaveLength(1);
      expect(result.attendanceHistory[0].eventName).toBe('Workshop');
    });

    it('passes custom daysBack', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { memberId: 1, daysAnalyzed: 60, eventEngagementScore: 0, totalEventsAttended: 0, attendanceHistory: [] } });

      await eventEngagementApiService.getMemberEventEngagement(1, 60);

      expect(apiClient.get).toHaveBeenCalledWith('/members/1/events/engagement?daysBack=60');
    });
  });

  describe('recordEventAttendance', () => {
    it('POSTs to correct bare path and returns DTO', async () => {
      const request: RecordEventAttendanceRequest = { memberId: 3, attendedAt: '2024-01-15T10:00:00Z', notes: 'On time' };
      const mockResponse: EventAttendanceResponse = {
        id: 42,
        eventId: 5,
        memberId: 3,
        attendedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-15T10:02:00Z',
        notes: 'On time',
        eventName: 'Meeting',
        eventDateTime: '2024-01-15T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.recordEventAttendance(5, request);

      expect(apiClient.post).toHaveBeenCalledWith('/events/5/attendance', request);
      expect(result.id).toBe(42);
      expect(result.eventName).toBe('Meeting');
    });
  });

  describe('submitEventFeedback', () => {
    it('POSTs to correct bare path and returns DTO', async () => {
      const request: SubmitEventFeedbackRequest = { memberId: 2, rating: 4, comments: 'Good event', tags: ['engaging'] };
      const mockResponse: EventFeedbackResponse = {
        eventId: 8,
        memberId: 2,
        rating: 4,
        comments: 'Good event',
        submittedAt: '2024-01-15T12:00:00Z',
        status: 'submitted',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.submitEventFeedback(8, request);

      expect(apiClient.post).toHaveBeenCalledWith('/events/8/feedback', request);
      expect(result.rating).toBe(4);
      expect(result.status).toBe('submitted');
    });
  });

  describe('getEventRecommendations', () => {
    it('calls correct bare path and returns DTO array', async () => {
      const mockResponse: EventRecommendationResponse[] = [
        {
          eventId: 11,
          eventName: 'Recommended Workshop',
          eventDateTime: '2024-02-01T10:00:00Z',
          location: 'Room A',
          recommendationScore: 0.92,
          recommendationReasons: ['past_attendance', 'similar_interests'],
          attendanceProbability: 0.88,
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await eventEngagementApiService.getEventRecommendations(4);

      expect(apiClient.get).toHaveBeenCalledWith('/events/recommendations/4?limit=10');
      expect(result).toHaveLength(1);
      expect(result[0].recommendationScore).toBe(0.92);
      expect(result[0].attendanceProbability).toBe(0.88);
    });

    it('passes custom limit', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await eventEngagementApiService.getEventRecommendations(4, 5);

      expect(apiClient.get).toHaveBeenCalledWith('/events/recommendations/4?limit=5');
    });
  });

  describe('getEventAnalytics (honest legacy mapping)', () => {
    const mockDashboard: EventAnalyticsResponse = {
      clubId: 1,
      daysAnalyzed: 90,
      totalEvents: 50,
      totalMembers: 200,
      averageEngagementScore: 65.0,
      topPerformingEvents: [],
      generatedAt: '2024-01-15T12:00:00Z',
    };

    const mockClubEvents: ClubEventEngagementResponse = {
      clubId: 1,
      clubName: 'Test Club',
      totalEvents: 50,
      totalMembers: 200,
      averageEventAttendance: 22.5,
      clubEventEngagementScore: 65.0,
      trends: {
        clubId: 1,
        dailyTrends: [
          { date: '2024-01-01', eventsHeld: 2, totalAttendance: 40, averageEngagementScore: 70.0 },
          { date: '2024-01-08', eventsHeld: 3, totalAttendance: 60, averageEngagementScore: 75.0 },
        ],
        averageEngagementScore: 72.5,
        trendDirection: 1,
        totalEvents: 50,
        totalAttendances: 510,
      },
      topEvents: [
        {
          eventId: 1,
          eventName: 'Top Workshop',
          eventDateTime: '2024-01-10T09:00:00Z',
          totalInvited: 30,
          totalRsvps: 25,
          totalAttended: 22,
          rsvpRate: 83.3,
          attendanceRate: 88.0,
          engagementScore: 90.0,
          engagementLevel: 'high',
          memberTypeBreakdown: {},
          topEngagementFactors: [],
        },
      ],
      lowEngagementMembers: [],
    };

    beforeEach(() => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockDashboard })
        .mockResolvedValueOnce({ data: mockClubEvents });
    });

    it('maps totalEvents from dashboard', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.totalEvents).toBe(50);
    });

    it('maps totalAttendance from clubEvents.trends.totalAttendances', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.totalAttendance).toBe(510);
    });

    it('maps averageAttendanceRate from clubEvents.averageEventAttendance', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.averageAttendanceRate).toBe(22.5);
    });

    it('maps memberEngagementScore from dashboard.averageEngagementScore', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.memberEngagementScore).toBe(65.0);
    });

    it('sets eventSatisfactionScore to 0 (backend has no satisfaction metric)', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.eventSatisfactionScore).toBe(0);
    });

    it('sets repeatAttendanceRate to 0 (not available)', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.repeatAttendanceRate).toBe(0);
    });

    it('sets noShowRate to 0 (not available)', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.metrics.noShowRate).toBe(0);
    });

    it('maps trendData from dailyTrends with revenueGenerated=0 and averageRating=0', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.trendData).toHaveLength(2);
      expect(result.trendData[0].eventsHeld).toBe(2);
      expect(result.trendData[0].totalAttendance).toBe(40);
      expect(result.trendData[0].memberEngagement).toBe(70.0);
      expect(result.trendData[0].averageRating).toBe(0);
      expect(result.trendData[0].revenueGenerated).toBe(0);
    });

    it('maps topPerformingEvents from clubEvents.topEvents', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.topPerformingEvents).toHaveLength(1);
      expect(result.topPerformingEvents[0].eventId).toBe(1);
      expect(result.topPerformingEvents[0].rsvpCount).toBe(25);
      expect(result.topPerformingEvents[0].attendanceCount).toBe(22);
    });

    it('sets upcomingEvents to [] (no upcoming-events endpoint)', async () => {
      const result = await eventEngagementApiService.getEventAnalytics(1, 90);
      expect(result.upcomingEvents).toEqual([]);
    });

    it('produces deterministic output (no Math.random) across two calls with same input', async () => {
      // Reset and re-mock for second call
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockDashboard })
        .mockResolvedValueOnce({ data: mockClubEvents })
        .mockResolvedValueOnce({ data: mockDashboard })
        .mockResolvedValueOnce({ data: mockClubEvents });

      const result1 = await eventEngagementApiService.getEventAnalytics(1, 90);
      const result2 = await eventEngagementApiService.getEventAnalytics(1, 90);

      expect(result1.metrics).toEqual(result2.metrics);
      expect(result1.trendData).toEqual(result2.trendData);
      expect(result1.topPerformingEvents).toEqual(result2.topPerformingEvents);
    });

    it('propagates errors', async () => {
      (apiClient.get as jest.Mock).mockReset();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(eventEngagementApiService.getEventAnalytics(1, 90)).rejects.toThrow('Network error');
    });
  });

  describe('trackFeature', () => {
    it('does not throw', () => {
      expect(() => eventEngagementApiService.trackFeature(1, 'event_analytics')).not.toThrow();
    });

    it('accepts optional platform and metadata', () => {
      expect(() =>
        eventEngagementApiService.trackFeature(1, 'event_analytics', 'mobile', { tab: 'overview' })
      ).not.toThrow();
    });
  });
});
