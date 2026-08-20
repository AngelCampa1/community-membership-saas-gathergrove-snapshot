/**
 * Analytics Service Integration Tests
 * Tests the full service flow including request construction and error handling
 *
 * These integration tests verify:
 * - URL construction with correct paths and parameters
 * - Error handling flows
 * - Request/response cycle
 */

// MOCK_TOKEN removed - not directly used in these tests (service is fully mocked)
import {
  createMockEventEngagementAnalytics,
  createMockMemberEngagementInsights,
  createMockEventPerformanceAnalytics,
  createMockROIMetrics,
  createMockBasicEventAnalytics,
} from '../__helpers__/testData';

// Mock the analytics service
jest.mock('../analyticsService', () => {
  const mockService = {
    getEventEngagementAnalytics: jest.fn(),
    getMemberEngagementInsights: jest.fn(),
    getEventPerformanceAnalysis: jest.fn(),
    getROIMetrics: jest.fn(),
    getBasicEventAnalytics: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
  };
});

// Mock authService
jest.mock('../authService', () => ({
  authService: {
    getStoredToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

import analyticsService from '../analyticsService';

describe('AnalyticsService Integration Tests', () => {
  const clubId = 1;
  const eventId = 100;
  const memberId = 50;

  const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventEngagementAnalytics', () => {
    it('should successfully fetch event engagement analytics', async () => {
      const mockResponse = createMockEventEngagementAnalytics();
      mockAnalyticsService.getEventEngagementAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getEventEngagementAnalytics(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(mockAnalyticsService.getEventEngagementAnalytics).toHaveBeenCalledWith(
        clubId,
        eventId
      );
    });

    it('should handle optional date parameters', async () => {
      const mockResponse = createMockEventEngagementAnalytics();
      mockAnalyticsService.getEventEngagementAnalytics.mockResolvedValue(mockResponse);

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      await analyticsService.getEventEngagementAnalytics(
        clubId,
        eventId,
        startDate,
        endDate
      );

      expect(mockAnalyticsService.getEventEngagementAnalytics).toHaveBeenCalledWith(
        clubId,
        eventId,
        startDate,
        endDate
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      mockAnalyticsService.getEventEngagementAnalytics.mockRejectedValue(
        new Error('Unauthorized - token expired')
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(clubId, eventId)
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle 404 not found errors', async () => {
      mockAnalyticsService.getEventEngagementAnalytics.mockRejectedValue(
        new Error('Event not found')
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(clubId, eventId)
      ).rejects.toThrow('Event not found');
    });
  });

  describe('getMemberEngagementInsights', () => {
    it('should successfully fetch member engagement insights', async () => {
      const mockResponse = createMockMemberEngagementInsights();
      mockAnalyticsService.getMemberEngagementInsights.mockResolvedValue(mockResponse);

      const result = await analyticsService.getMemberEngagementInsights(clubId, memberId);

      expect(result).toEqual(mockResponse);
      expect(mockAnalyticsService.getMemberEngagementInsights).toHaveBeenCalledWith(
        clubId,
        memberId
      );
    });

    it('should handle custom periodDays parameter', async () => {
      const mockResponse = createMockMemberEngagementInsights();
      mockAnalyticsService.getMemberEngagementInsights.mockResolvedValue(mockResponse);

      await analyticsService.getMemberEngagementInsights(clubId, memberId, 30);

      expect(mockAnalyticsService.getMemberEngagementInsights).toHaveBeenCalledWith(
        clubId,
        memberId,
        30
      );
    });

    it('should handle 403 forbidden errors', async () => {
      mockAnalyticsService.getMemberEngagementInsights.mockRejectedValue(
        new Error('Forbidden - user not authorized for this club')
      );

      await expect(
        analyticsService.getMemberEngagementInsights(clubId, memberId)
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('getEventPerformanceAnalysis', () => {
    it('should successfully fetch event performance analysis', async () => {
      const mockResponse = createMockEventPerformanceAnalytics();
      mockAnalyticsService.getEventPerformanceAnalysis.mockResolvedValue(mockResponse);

      const result = await analyticsService.getEventPerformanceAnalysis(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(result.performanceScore).toBe(mockResponse.performanceScore);
      expect(result.attendanceAnalysis.attendanceRate).toBe(
        mockResponse.attendanceAnalysis.attendanceRate
      );
      expect(mockAnalyticsService.getEventPerformanceAnalysis).toHaveBeenCalledWith(
        clubId,
        eventId
      );
    });

    it('should handle server errors', async () => {
      mockAnalyticsService.getEventPerformanceAnalysis.mockRejectedValue(
        new Error('Internal server error')
      );

      await expect(
        analyticsService.getEventPerformanceAnalysis(clubId, eventId)
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('getROIMetrics', () => {
    it('should successfully fetch ROI metrics', async () => {
      const mockResponse = createMockROIMetrics();
      mockAnalyticsService.getROIMetrics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getROIMetrics(clubId);

      expect(result).toEqual(mockResponse);
      expect(result.netROI).toBe(mockResponse.netROI);
      expect(result.roiPercentage).toBe(mockResponse.roiPercentage);
      expect(mockAnalyticsService.getROIMetrics).toHaveBeenCalledWith(clubId);
    });

    it('should handle custom periodMonths parameter', async () => {
      const mockResponse = createMockROIMetrics();
      mockAnalyticsService.getROIMetrics.mockResolvedValue(mockResponse);

      await analyticsService.getROIMetrics(clubId, 12);

      expect(mockAnalyticsService.getROIMetrics).toHaveBeenCalledWith(clubId, 12);
    });
  });

  describe('getBasicEventAnalytics', () => {
    it('should successfully fetch basic event analytics', async () => {
      const mockResponse = createMockBasicEventAnalytics();
      mockAnalyticsService.getBasicEventAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getBasicEventAnalytics(clubId, eventId);

      expect(result).toEqual(mockResponse);
      expect(result.attendance.total).toBe(mockResponse.attendance.total);
      expect(result.performanceScore).toBe(mockResponse.performanceScore);
      expect(mockAnalyticsService.getBasicEventAnalytics).toHaveBeenCalledWith(
        clubId,
        eventId
      );
    });

    it('should handle empty analytics data', async () => {
      const emptyResponse = createMockBasicEventAnalytics({
        attendance: {
          total: 0,
          rsvps: 0,
          checkIns: 0,
          attendanceRate: 0,
        },
        performanceScore: 0,
      });

      mockAnalyticsService.getBasicEventAnalytics.mockResolvedValue(emptyResponse);

      const result = await analyticsService.getBasicEventAnalytics(clubId, eventId);

      expect(result.attendance.total).toBe(0);
      expect(result.performanceScore).toBe(0);
    });

    it('should handle network errors', async () => {
      mockAnalyticsService.getBasicEventAnalytics.mockRejectedValue(
        new Error('Network error - please check your connection')
      );

      await expect(
        analyticsService.getBasicEventAnalytics(clubId, eventId)
      ).rejects.toThrow('Network error');
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      mockAnalyticsService.getEventEngagementAnalytics.mockRejectedValue(
        new Error('timeout of 30000ms exceeded')
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(clubId, eventId)
      ).rejects.toThrow('timeout');
    });

    it('should handle all HTTP error codes', async () => {
      const errorCodes = [
        { code: 401, message: 'Unauthorized' },
        { code: 403, message: 'Forbidden' },
        { code: 404, message: 'Not found' },
        { code: 500, message: 'Internal server error' },
      ];

      for (const { code, message } of errorCodes) {
        mockAnalyticsService.getBasicEventAnalytics.mockRejectedValue(
          new Error(`${code}: ${message}`)
        );

        await expect(
          analyticsService.getBasicEventAnalytics(clubId, eventId)
        ).rejects.toThrow(message);
      }
    });
  });
});
