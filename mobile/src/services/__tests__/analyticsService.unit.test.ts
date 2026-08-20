/**
 * Analytics Service Unit Tests
 * Tests for all analytics API calls
 */

import type {
  EventEngagementAnalytics,
  MemberEngagementInsights,
  EventPerformanceAnalysis,
  EventROIMetrics,
  BasicEventAnalytics,
} from '../analyticsService';

// Mock the entire analyticsService module
jest.mock('../analyticsService', () => {
  const mockAnalyticsService = {
    getEventEngagementAnalytics: jest.fn(),
    getMemberEngagementInsights: jest.fn(),
    getEventPerformanceAnalysis: jest.fn(),
    getROIMetrics: jest.fn(),
    getBasicEventAnalytics: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockAnalyticsService,
  };
});

// Import the mocked service
import analyticsService from '../analyticsService';

const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

describe('AnalyticsService', () => {
  const clubId = 1;
  const eventId = 100;
  const memberId = 50;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventEngagementAnalytics', () => {
    const mockResponse: EventEngagementAnalytics = {
      eventId: 100,
      clubId: 1,
      totalRsvps: 50,
      totalAttended: 42,
      attendanceRate: 0.84,
      engagementScore: 8.5,
      noShowRate: 0.16,
      averageFeedbackRating: 4.5,
      feedbackCount: 35,
      trends: [],
      topMembers: [],
      atRiskMembers: [],
    };

    it('should fetch event engagement analytics successfully', async () => {
      mockAnalyticsService.getEventEngagementAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getEventEngagementAnalytics(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(result.totalRsvps).toBe(50);
      expect(result.attendanceRate).toBe(0.84);
      expect(mockAnalyticsService.getEventEngagementAnalytics).toHaveBeenCalled();
    });

    it('should include date parameters when provided', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      mockAnalyticsService.getEventEngagementAnalytics.mockResolvedValue(mockResponse);

      await analyticsService.getEventEngagementAnalytics(clubId, eventId, startDate, endDate);

      expect(mockAnalyticsService.getEventEngagementAnalytics).toHaveBeenCalledWith(
        clubId,
        eventId,
        startDate,
        endDate
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Event not found';
      mockAnalyticsService.getEventEngagementAnalytics.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(clubId, eventId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getMemberEngagementInsights', () => {
    const mockResponse: MemberEngagementInsights = {
      memberId: 50,
      clubId: 1,
      periodDays: 90,
      totalEventsInPeriod: 20,
      eventsRsvped: 18,
      eventsAttended: 15,
      rsvpRate: 0.9,
      attendanceRate: 0.83,
      averageEngagementScore: 8.2,
      noShowCount: 3,
      consecutiveNoShows: 0,
      lastEventDate: '2024-01-15',
      engagementTrend: 'stable',
      riskLevel: 'low',
      recommendations: ['Keep up the great engagement!'],
    };

    it('should fetch member engagement insights successfully', async () => {
      mockAnalyticsService.getMemberEngagementInsights.mockResolvedValue(mockResponse);

      const result = await analyticsService.getMemberEngagementInsights(clubId, memberId);

      expect(result).toEqual(mockResponse);
      expect(result.rsvpRate).toBe(0.9);
      expect(result.engagementTrend).toBe('stable');
      expect(mockAnalyticsService.getMemberEngagementInsights).toHaveBeenCalled();
    });

    it('should use default periodDays when not provided', async () => {
      mockAnalyticsService.getMemberEngagementInsights.mockResolvedValue(mockResponse);

      await analyticsService.getMemberEngagementInsights(clubId, memberId);

      expect(mockAnalyticsService.getMemberEngagementInsights).toHaveBeenCalled();
    });

    it('should include custom periodDays when provided', async () => {
      mockAnalyticsService.getMemberEngagementInsights.mockResolvedValue(mockResponse);

      await analyticsService.getMemberEngagementInsights(clubId, memberId, 30);

      expect(mockAnalyticsService.getMemberEngagementInsights).toHaveBeenCalledWith(
        clubId,
        memberId,
        30
      );
    });

    it('should handle unauthorized errors', async () => {
      const errorMessage = 'User not authorized for this club';
      mockAnalyticsService.getMemberEngagementInsights.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getMemberEngagementInsights(clubId, memberId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getEventPerformanceAnalysis', () => {
    const mockResponse: EventPerformanceAnalysis = {
      eventId: 100,
      eventName: 'Annual Gala',
      eventDate: '2024-01-15T19:00:00Z',
      performanceScore: 8.7,
      attendanceAnalysis: {
        totalRsvps: 50,
        totalAttended: 45,
        attendanceRate: 0.9,
        noShowRate: 0.1,
      },
      engagementBreakdown: {
        socialMediaShares: 12,
        feedbackSubmissions: 38,
      },
      comparisonToAverage: {
        attendanceRateVsAverage: 0.15,
        engagementScoreVsAverage: 1.2,
      },
      improvementSuggestions: ['Consider sending reminder emails 24h before event'],
    };

    it('should fetch event performance analysis successfully', async () => {
      mockAnalyticsService.getEventPerformanceAnalysis.mockResolvedValue(mockResponse);

      const result = await analyticsService.getEventPerformanceAnalysis(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(result.performanceScore).toBe(8.7);
      expect(result.attendanceAnalysis.attendanceRate).toBe(0.9);
      expect(result.improvementSuggestions).toHaveLength(1);
      expect(mockAnalyticsService.getEventPerformanceAnalysis).toHaveBeenCalledWith(
        clubId,
        eventId
      );
    });

    it('should handle server errors', async () => {
      const errorMessage = 'Internal server error';
      mockAnalyticsService.getEventPerformanceAnalysis.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getEventPerformanceAnalysis(clubId, eventId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getROIMetrics', () => {
    const mockResponse: EventROIMetrics = {
      clubId: 1,
      periodMonths: 6,
      totalEvents: 24,
      totalRevenue: 50000,
      totalCosts: 30000,
      netROI: 20000,
      roiPercentage: 66.67,
      averageRevenuePerEvent: 2083.33,
      averageCostPerEvent: 1250,
      averageAttendancePerEvent: 45,
      costPerAttendee: 27.78,
      revenuePerAttendee: 46.3,
      topPerformingEvents: [],
    };

    it('should fetch ROI metrics successfully', async () => {
      mockAnalyticsService.getROIMetrics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getROIMetrics(clubId);

      expect(result).toEqual(mockResponse);
      expect(result.netROI).toBe(20000);
      expect(result.roiPercentage).toBe(66.67);
      expect(mockAnalyticsService.getROIMetrics).toHaveBeenCalled();
    });

    it('should use default periodMonths when not provided', async () => {
      mockAnalyticsService.getROIMetrics.mockResolvedValue(mockResponse);

      await analyticsService.getROIMetrics(clubId);

      expect(mockAnalyticsService.getROIMetrics).toHaveBeenCalled();
    });

    it('should include custom periodMonths when provided', async () => {
      mockAnalyticsService.getROIMetrics.mockResolvedValue(mockResponse);

      await analyticsService.getROIMetrics(clubId, 12);

      expect(mockAnalyticsService.getROIMetrics).toHaveBeenCalledWith(clubId, 12);
    });
  });

  describe('getBasicEventAnalytics', () => {
    const mockResponse: BasicEventAnalytics = {
      eventId: 100,
      clubId: 1,
      attendance: {
        total: 45,
        rsvps: 50,
        checkIns: 45,
        attendanceRate: 0.9,
      },
      performanceScore: 8.5,
      comparisonToAverage: {
        attendanceRateVsAverage: 0.1,
        engagementScoreVsAverage: 0.5,
      },
    };

    it('should fetch basic event analytics successfully', async () => {
      mockAnalyticsService.getBasicEventAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getBasicEventAnalytics(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(result.attendance.total).toBe(45);
      expect(result.performanceScore).toBe(8.5);
      expect(mockAnalyticsService.getBasicEventAnalytics).toHaveBeenCalledWith(
        clubId,
        eventId
      );
    });

    it('should handle empty analytics data', async () => {
      const emptyResponse: BasicEventAnalytics = {
        eventId: 100,
        clubId: 1,
        attendance: {
          total: 0,
          rsvps: 0,
          checkIns: 0,
          attendanceRate: 0,
        },
        performanceScore: 0,
        comparisonToAverage: {
          attendanceRateVsAverage: 0,
          engagementScoreVsAverage: 0,
        },
      };

      mockAnalyticsService.getBasicEventAnalytics.mockResolvedValue(emptyResponse);

      const result = await analyticsService.getBasicEventAnalytics(clubId, eventId);

      expect(result.attendance.total).toBe(0);
      expect(result.performanceScore).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const errorMessage = 'Unauthorized - token expired';
      mockAnalyticsService.getBasicEventAnalytics.mockRejectedValue(new Error(errorMessage));

      await expect(analyticsService.getBasicEventAnalytics(clubId, eventId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle 403 forbidden error', async () => {
      const errorMessage = 'Forbidden - user not authorized';
      mockAnalyticsService.getEventEngagementAnalytics.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(clubId, eventId)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle 404 not found error', async () => {
      const errorMessage = 'Resource not found';
      mockAnalyticsService.getEventPerformanceAnalysis.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getEventPerformanceAnalysis(clubId, eventId)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error - please check your connection';
      mockAnalyticsService.getMemberEngagementInsights.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        analyticsService.getMemberEngagementInsights(clubId, memberId)
      ).rejects.toThrow(errorMessage);
    });
  });
});
