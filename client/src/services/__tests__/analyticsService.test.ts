/**
 * @jest-environment jsdom
 *
 * Analytics Service Tests
 *
 * Tests analytics service following boundary mocking pattern:
 * - Mock ONLY the fetch API (HTTP boundary)
 * - Mock authService.getAuthToken (external dependency)
 * - Test REAL service logic (validation, request formatting, error handling)
 */

import { analyticsService, getEventEngagementAnalytics, getEngagementTrends, getEngagementBenchmarks, getMemberEngagementInsights, getEventRecommendations, analyzeEventPerformance, predictEventSuccess, generateEngagementReport, getROIMetrics } from '../analyticsService';
import authService from '../authService';

// Mock authService at the boundary
jest.mock('../authService', () => ({
  __esModule: true,
  default: {
    getAuthToken: jest.fn(),
    getUser: jest.fn(() => ({ clubId: 1, id: 1, role: 'Owner' })),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AnalyticsService', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockAuthService.getAuthToken.mockReturnValue('test-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getEventEngagementAnalytics', () => {
    it('should fetch analytics data successfully', async () => {
      const mockData = {
        clubId: 1,
        clubName: 'Test Club',
        overallEngagementScore: 85,
        eventMetrics: [],
        memberEngagementBreakdown: [],
        keyInsights: ['Good engagement'],
        recommendations: ['Keep it up'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getEventEngagementAnalytics(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/MemberEngagement/club/1/trends'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should throw error when club ID is invalid', async () => {
      await expect(
        analyticsService.getEventEngagementAnalytics(0, new Date('2024-01-01'), new Date('2024-01-31'))
      ).rejects.toThrow('Club ID must be greater than 0');

      await expect(
        analyticsService.getEventEngagementAnalytics(-1, new Date('2024-01-01'), new Date('2024-01-31'))
      ).rejects.toThrow('Club ID must be greater than 0');
    });

    it('should throw error when start date is after end date', async () => {
      await expect(
        analyticsService.getEventEngagementAnalytics(1, new Date('2024-01-31'), new Date('2024-01-01'))
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should throw error when dates are equal', async () => {
      const sameDate = new Date('2024-01-15');
      await expect(
        analyticsService.getEventEngagementAnalytics(1, sameDate, sameDate)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Access denied' }),
      });

      await expect(
        analyticsService.getEventEngagementAnalytics(1, new Date('2024-01-01'), new Date('2024-01-31'))
      ).rejects.toThrow('Access denied');
    });

    it('should handle HTTP errors when JSON parse fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        analyticsService.getEventEngagementAnalytics(1, new Date('2024-01-01'), new Date('2024-01-31'))
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should not include Authorization header when no token', async () => {
      mockAuthService.getAuthToken.mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await analyticsService.getEventEngagementAnalytics(1, new Date('2024-01-01'), new Date('2024-01-31'));

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });

  describe('getEngagementTrends', () => {
    it('should fetch trends data successfully', async () => {
      const mockData = {
        clubId: 1,
        periodDays: 30,
        dailyTrends: [],
        trendDirection: 'Increasing',
        growthRate: 5.5,
        averageEngagementScore: 78,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getEngagementTrends(1, 30);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/engagement-trends'),
        expect.any(Object)
      );
    });

    it('should throw error when daysBack is zero', async () => {
      await expect(analyticsService.getEngagementTrends(1, 0)).rejects.toThrow(
        'Days back must be greater than 0'
      );
    });

    it('should throw error when daysBack is negative', async () => {
      await expect(analyticsService.getEngagementTrends(1, -5)).rejects.toThrow(
        'Days back must be greater than 0'
      );
    });

    it('should throw error when daysBack exceeds 365', async () => {
      await expect(analyticsService.getEngagementTrends(1, 366)).rejects.toThrow(
        'Days back cannot exceed 365'
      );

      await expect(analyticsService.getEngagementTrends(1, 500)).rejects.toThrow(
        'Days back cannot exceed 365'
      );
    });

    it('should accept daysBack at boundary values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // Should not throw for 1 and 365
      await expect(analyticsService.getEngagementTrends(1, 1)).resolves.toBeDefined();
      await expect(analyticsService.getEngagementTrends(1, 365)).resolves.toBeDefined();
    });
  });

  describe('getEngagementBenchmarks', () => {
    it('should fetch benchmarks data successfully', async () => {
      const mockData = {
        clubId: 1,
        averageAttendanceRate: 75,
        averageRsvpRate: 85,
        averageEngagementScore: 80,
        industryComparisons: { similar_clubs: 72 },
        performanceIndicators: { rating: 'Above Average' },
        benchmarkPeriod: '2024-Q1',
        lastUpdated: '2024-03-01',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getEngagementBenchmarks(1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/MemberEngagement/club/1/overview'),
        expect.any(Object)
      );
    });
  });

  describe('getMemberEngagementInsights', () => {
    it('should fetch member insights successfully', async () => {
      const mockData = {
        memberId: 123,
        memberName: 'John Doe',
        clubId: 1,
        analysisPeriod: 30,
        eventAttendanceRate: 85,
        rsvpAccuracyRate: 92,
        engagementTrend: 'Increasing',
        engagementLevel: 'Green',
        recommendedActions: ['Invite to leadership role'],
        engagementFactors: { events: 90, communication: 85 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getMemberEngagementInsights(1, 123, 30);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/MemberEngagement/123/history?daysBack=30'),
        expect.any(Object)
      );
    });
  });

  describe('getEventRecommendations', () => {
    it('should fetch event recommendations successfully', async () => {
      const mockData = [
        {
          eventId: 1,
          eventName: 'Club Meeting',
          eventDateTime: '2024-02-15',
          recommendationScore: 95,
          attendanceProbability: 0.85,
          recommendationReason: 'Based on past attendance',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getEventRecommendations(1, 123, 5);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/event-recommendations'),
        expect.any(Object)
      );
    });

    it('should throw error when maxRecommendations is zero', async () => {
      await expect(analyticsService.getEventRecommendations(1, 123, 0)).rejects.toThrow(
        'Max recommendations must be greater than 0'
      );
    });

    it('should throw error when maxRecommendations is negative', async () => {
      await expect(analyticsService.getEventRecommendations(1, 123, -5)).rejects.toThrow(
        'Max recommendations must be greater than 0'
      );
    });

    it('should throw error when maxRecommendations exceeds 20', async () => {
      await expect(analyticsService.getEventRecommendations(1, 123, 21)).rejects.toThrow(
        'Max recommendations cannot exceed 20'
      );

      await expect(analyticsService.getEventRecommendations(1, 123, 50)).rejects.toThrow(
        'Max recommendations cannot exceed 20'
      );
    });

    it('should accept maxRecommendations at boundary values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // Should not throw for 1 and 20
      await expect(analyticsService.getEventRecommendations(1, 123, 1)).resolves.toBeDefined();
      await expect(analyticsService.getEventRecommendations(1, 123, 20)).resolves.toBeDefined();
    });
  });

  describe('analyzeEventPerformance', () => {
    it('should analyze event performance successfully', async () => {
      const mockData = {
        eventId: 1,
        eventName: 'Annual Gala',
        eventDate: '2024-01-20',
        performanceScore: 88,
        attendanceAnalysis: {
          totalRsvps: 100,
          totalAttended: 85,
          attendanceRate: 85,
          noShowRate: 15,
        },
        engagementBreakdown: { networking: 90, participation: 85 },
        comparisonToAverage: { attendanceVsAvg: 5 },
        improvementSuggestions: ['Send reminders earlier'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.analyzeEventPerformance(1, 1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/event-performance/1'),
        expect.any(Object)
      );
    });
  });

  describe('predictEventSuccess', () => {
    it('should predict event success successfully', async () => {
      const mockData = {
        eventId: 1,
        eventName: 'Summer Picnic',
        eventDate: '2024-06-15',
        predictedAttendanceRate: 78,
        successProbability: 0.85,
        confidenceLevel: 'High',
        riskFactors: ['Weather dependent'],
        successFactors: ['Popular venue', 'Good timing'],
        recommendedActions: ['Prepare backup plan'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.predictEventSuccess(1, 1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/event-success-prediction/1'),
        expect.any(Object)
      );
    });
  });

  describe('generateEngagementReport', () => {
    it('should generate report successfully', async () => {
      const mockData = {
        clubId: 1,
        reportType: 'comprehensive',
        reportPeriod: { start: '2024-01-01', end: '2024-03-31' },
        generatedAt: '2024-04-01',
        executiveSummary: 'Strong quarter with improved engagement',
        keyMetrics: { avgAttendance: 82, avgEngagement: 78 },
        trendAnalysis: {
          overallDirection: 'Increasing',
          monthlyGrowthRate: 3.5,
          seasonalPatterns: { spring: 85 },
        },
        memberInsights: [],
        eventAnalysis: [],
        recommendations: ['Continue current strategy'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.generateEngagementReport(
        1,
        'comprehensive',
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/engagement-report'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('comprehensive'),
        })
      );
    });

    it('should throw error for invalid report type', async () => {
      await expect(
        analyticsService.generateEngagementReport(
          1,
          'invalid' as any,
          new Date('2024-01-01'),
          new Date('2024-03-31')
        )
      ).rejects.toThrow('Invalid report type');
    });

    it('should accept valid report types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(
        analyticsService.generateEngagementReport(1, 'basic', new Date('2024-01-01'), new Date('2024-03-31'))
      ).resolves.toBeDefined();

      await expect(
        analyticsService.generateEngagementReport(
          1,
          'comprehensive',
          new Date('2024-01-01'),
          new Date('2024-03-31')
        )
      ).resolves.toBeDefined();

      await expect(
        analyticsService.generateEngagementReport(
          1,
          'executive',
          new Date('2024-01-01'),
          new Date('2024-03-31')
        )
      ).resolves.toBeDefined();
    });
  });

  describe('getROIMetrics', () => {
    it('should fetch ROI metrics successfully', async () => {
      const mockData = {
        clubId: 1,
        analysisPeriodMonths: 12,
        totalEventCosts: 50000,
        totalMemberValue: 150000,
        roiPercentage: 200,
        costBreakdown: { venue: 25000, catering: 20000, marketing: 5000 },
        valueDrivers: { membership: 100000, events: 50000 },
        costPerMember: 250,
        valuePerMember: 750,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await analyticsService.getROIMetrics(1, 12);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clubs/1/analytics/premium/roi'),
        expect.any(Object)
      );
    });

    it('should throw error when periodMonths is zero', async () => {
      await expect(analyticsService.getROIMetrics(1, 0)).rejects.toThrow(
        'Period months must be greater than 0'
      );
    });

    it('should throw error when periodMonths is negative', async () => {
      await expect(analyticsService.getROIMetrics(1, -3)).rejects.toThrow(
        'Period months must be greater than 0'
      );
    });

    it('should throw error when periodMonths exceeds 36', async () => {
      await expect(analyticsService.getROIMetrics(1, 37)).rejects.toThrow(
        'Period months cannot exceed 36'
      );

      await expect(analyticsService.getROIMetrics(1, 48)).rejects.toThrow(
        'Period months cannot exceed 36'
      );
    });

    it('should accept periodMonths at boundary values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(analyticsService.getROIMetrics(1, 1)).resolves.toBeDefined();
      await expect(analyticsService.getROIMetrics(1, 36)).resolves.toBeDefined();
    });
  });

  describe('backward compatibility exports', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    it('should export getEventEngagementAnalytics function', async () => {
      await getEventEngagementAnalytics(1, new Date('2024-01-01'), new Date('2024-01-31'));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getEngagementTrends function', async () => {
      await getEngagementTrends(1, 30);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getEngagementBenchmarks function', async () => {
      await getEngagementBenchmarks(1);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getMemberEngagementInsights function', async () => {
      await getMemberEngagementInsights(1, 123, 30);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getEventRecommendations function with defaults', async () => {
      await getEventRecommendations(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('memberId=0'),
        expect.any(Object)
      );
    });

    it('should export getEventRecommendations function with custom values', async () => {
      await getEventRecommendations(1, 123, 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('memberId=123'),
        expect.any(Object)
      );
    });

    it('should export analyzeEventPerformance function', async () => {
      await analyzeEventPerformance(1, 1);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export predictEventSuccess function', async () => {
      await predictEventSuccess(1, 1);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export generateEngagementReport function', async () => {
      await generateEngagementReport(1, 'basic', new Date('2024-01-01'), new Date('2024-03-31'));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getROIMetrics function', async () => {
      await getROIMetrics(1, 12);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('service instance', () => {
    it('should export analyticsService singleton', () => {
      expect(analyticsService).toBeDefined();
      expect(typeof analyticsService.getEventEngagementAnalytics).toBe('function');
      expect(typeof analyticsService.getEngagementTrends).toBe('function');
      expect(typeof analyticsService.getEngagementBenchmarks).toBe('function');
      expect(typeof analyticsService.getMemberEngagementInsights).toBe('function');
      expect(typeof analyticsService.getEventRecommendations).toBe('function');
      expect(typeof analyticsService.analyzeEventPerformance).toBe('function');
      expect(typeof analyticsService.predictEventSuccess).toBe('function');
      expect(typeof analyticsService.generateEngagementReport).toBe('function');
      expect(typeof analyticsService.getROIMetrics).toBe('function');
    });
  });

  describe('makeRequest - Enhanced Branch Coverage', () => {
    describe('Error response with valid JSON but no error field', () => {
      it('should use fallback message when error field missing', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ message: 'Some other field' }),
        });

        await expect(
          analyticsService.getEventEngagementAnalytics(1, new Date('2024-01-01'), new Date('2024-01-31'))
        ).rejects.toThrow('HTTP 400: Bad Request');
      });

      it('should use fallback message for 404 errors without error field', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        });

        await expect(
          analyticsService.getEngagementBenchmarks(1)
        ).rejects.toThrow('HTTP 404: Not Found');
      });

      it('should use fallback message for 500 errors with empty object', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        });

        await expect(
          analyticsService.getEngagementTrends(1, 30)
        ).rejects.toThrow('HTTP 500: Internal Server Error');
      });
    });
  });

  describe('Export function default parameters - Enhanced Coverage', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    describe('getEventRecommendations - default parameter variations', () => {
      it('should use memberId default (0) when only memberId omitted', async () => {
        await getEventRecommendations(1, undefined, 15);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=0'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=15'),
          expect.any(Object)
        );
      });

      it('should use maxRecommendations default (10) when only maxRecs omitted', async () => {
        await getEventRecommendations(1, 456);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=456'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=10'),
          expect.any(Object)
        );
      });

      it('should use both defaults when both optional params omitted', async () => {
        await getEventRecommendations(1);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=0'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=10'),
          expect.any(Object)
        );
      });

      it('should use provided values when both params supplied', async () => {
        await getEventRecommendations(1, 789, 20);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=789'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=20'),
          expect.any(Object)
        );
      });

      it('should apply defaults with explicit undefined values', async () => {
        await getEventRecommendations(1, undefined, undefined);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=0'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=10'),
          expect.any(Object)
        );
      });

      it('should handle memberId=0 explicitly (different from default)', async () => {
        // When memberId is explicitly 0 (not undefined), it should be 0
        // This tests that ?? doesn't trigger for 0 (falsy but not nullish)
        await getEventRecommendations(1, 0, 5);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('memberId=0'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxRecommendations=5'),
          expect.any(Object)
        );
      });
    });
  });
});
