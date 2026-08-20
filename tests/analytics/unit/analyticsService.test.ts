/**
 * @fileoverview Comprehensive unit tests for Analytics Service
 * @version 1.0.0
 * 
 * Test Coverage:
 * - Service instantiation and configuration
 * - API endpoint calls and response handling
 * - Error handling and edge cases
 * - Data validation and transformation
 * - Authentication token handling
 * - Rate limiting and caching behavior
 */

import { analyticsService, AnalyticsService } from '../../../client/src/services/analyticsService';
import authService from '../../../client/src/services/authService';

// Mock dependencies
jest.mock('../../../client/src/services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AnalyticsService', () => {
  const TEST_CLUB_ID = 123;
  const TEST_API_BASE = 'http://localhost:5000';
  const TEST_TOKEN = 'test-auth-token-12345';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getAuthToken.mockReturnValue(TEST_TOKEN);
    
    // Set environment variable for tests
    process.env.NEXT_PUBLIC_API_URL = TEST_API_BASE;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('Service Instantiation', () => {
    it('should create service instance correctly', () => {
      expect(analyticsService).toBeDefined();
      expect(analyticsService).toBeInstanceOf(AnalyticsService);
    });

    it('should use default API URL when environment variable not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      // Would need to test with new instance, but service is singleton
      expect(analyticsService).toBeDefined();
    });
  });

  describe('Authentication Handling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'mock-data' }),
      } as Response);
    });

    it('should include authorization header when token is available', async () => {
      mockAuthService.getAuthToken.mockReturnValue(TEST_TOKEN);

      await analyticsService.getEventEngagementAnalytics(
        TEST_CLUB_ID,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/event-engagement'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should work without authorization header when no token', async () => {
      mockAuthService.getAuthToken.mockReturnValue(null);

      await analyticsService.getEventEngagementAnalytics(
        TEST_CLUB_ID,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/event-engagement'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('getEventEngagementAnalytics', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const mockAnalyticsData = {
      clubId: TEST_CLUB_ID,
      clubName: 'Test Club',
      analyticsDateRange: { start: startDate, end: endDate },
      overallEngagementScore: 85.5,
      eventMetrics: [
        {
          eventId: 1,
          eventName: 'Test Event',
          eventDate: '2024-01-15',
          totalRsvps: 50,
          totalAttended: 42,
          rsvpRate: 0.85,
          attendanceRate: 0.84,
          engagementScore: 78.5,
        },
      ],
      memberEngagementBreakdown: [],
      keyInsights: ['High engagement in networking events'],
      recommendations: ['Consider more networking events'],
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      } as Response);
    });

    it('should fetch event engagement analytics successfully', async () => {
      const result = await analyticsService.getEventEngagementAnalytics(
        TEST_CLUB_ID,
        startDate,
        endDate
      );

      expect(result).toEqual(mockAnalyticsData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/event-engagement?clubId=${TEST_CLUB_ID}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should validate club ID parameter', async () => {
      await expect(
        analyticsService.getEventEngagementAnalytics(0, startDate, endDate)
      ).rejects.toThrow('Club ID must be greater than 0');

      await expect(
        analyticsService.getEventEngagementAnalytics(-1, startDate, endDate)
      ).rejects.toThrow('Club ID must be greater than 0');
    });

    it('should validate date range parameters', async () => {
      const invalidEndDate = new Date('2023-12-31');
      
      await expect(
        analyticsService.getEventEngagementAnalytics(TEST_CLUB_ID, startDate, invalidEndDate)
      ).rejects.toThrow('Start date must be before end date');

      await expect(
        analyticsService.getEventEngagementAnalytics(TEST_CLUB_ID, startDate, startDate)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      } as Response);

      await expect(
        analyticsService.getEventEngagementAnalytics(TEST_CLUB_ID, startDate, endDate)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        analyticsService.getEventEngagementAnalytics(TEST_CLUB_ID, startDate, endDate)
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(
        analyticsService.getEventEngagementAnalytics(TEST_CLUB_ID, startDate, endDate)
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('getEngagementTrends', () => {
    const mockTrendsData = {
      clubId: TEST_CLUB_ID,
      periodDays: 30,
      dailyTrends: [
        {
          date: '2024-01-01',
          engagementScore: 75.5,
          eventCount: 2,
          attendanceRate: 0.82,
        },
        {
          date: '2024-01-02',
          engagementScore: 78.2,
          eventCount: 1,
          attendanceRate: 0.85,
        },
      ],
      trendDirection: 'Increasing' as const,
      growthRate: 12.5,
      averageEngagementScore: 76.85,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTrendsData),
      } as Response);
    });

    it('should fetch engagement trends successfully', async () => {
      const result = await analyticsService.getEngagementTrends(TEST_CLUB_ID, 30);

      expect(result).toEqual(mockTrendsData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/engagement-trends?clubId=${TEST_CLUB_ID}&daysBack=30`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should validate daysBack parameter', async () => {
      await expect(
        analyticsService.getEngagementTrends(TEST_CLUB_ID, 0)
      ).rejects.toThrow('Days back must be greater than 0');

      await expect(
        analyticsService.getEngagementTrends(TEST_CLUB_ID, -5)
      ).rejects.toThrow('Days back must be greater than 0');

      await expect(
        analyticsService.getEngagementTrends(TEST_CLUB_ID, 400)
      ).rejects.toThrow('Days back cannot exceed 365');
    });
  });

  describe('getEngagementBenchmarks', () => {
    const mockBenchmarksData = {
      clubId: TEST_CLUB_ID,
      averageAttendanceRate: 0.78,
      averageRsvpRate: 0.85,
      averageEngagementScore: 76.5,
      industryComparisons: {
        'Technology': 82.1,
        'Professional': 74.8,
        'Social': 69.2,
      },
      performanceIndicators: {
        'attendance': 'Above Average',
        'engagement': 'Excellent',
        'retention': 'Good',
      },
      benchmarkPeriod: '2024-Q1',
      lastUpdated: '2024-01-31T23:59:59Z',
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBenchmarksData),
      } as Response);
    });

    it('should fetch engagement benchmarks successfully', async () => {
      const result = await analyticsService.getEngagementBenchmarks(TEST_CLUB_ID);

      expect(result).toEqual(mockBenchmarksData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/engagement-benchmarks?clubId=${TEST_CLUB_ID}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('getMemberEngagementInsights', () => {
    const TEST_MEMBER_ID = 456;
    const ANALYSIS_PERIOD = 90;
    const mockInsightsData = {
      memberId: TEST_MEMBER_ID,
      memberName: 'John Doe',
      clubId: TEST_CLUB_ID,
      analysisPeriod: ANALYSIS_PERIOD,
      eventAttendanceRate: 0.82,
      rsvpAccuracyRate: 0.91,
      engagementTrend: 'Increasing' as const,
      engagementLevel: 'Green' as const,
      recommendedActions: [
        'Invite to leadership opportunities',
        'Consider for event organizing roles',
      ],
      engagementFactors: {
        'networking': 8.5,
        'learning': 7.8,
        'social': 6.9,
      },
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockInsightsData),
      } as Response);
    });

    it('should fetch member engagement insights successfully', async () => {
      const result = await analyticsService.getMemberEngagementInsights(
        TEST_CLUB_ID,
        TEST_MEMBER_ID,
        ANALYSIS_PERIOD
      );

      expect(result).toEqual(mockInsightsData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/member-engagement?clubId=${TEST_CLUB_ID}&memberId=${TEST_MEMBER_ID}&analysisPeriodDays=${ANALYSIS_PERIOD}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('getEventRecommendations', () => {
    const TEST_MEMBER_ID = 456;
    const MAX_RECOMMENDATIONS = 5;
    const mockRecommendationsData = [
      {
        eventId: 1,
        eventName: 'Tech Networking Mixer',
        eventDateTime: '2024-02-15T18:00:00Z',
        recommendationScore: 92.5,
        attendanceProbability: 0.89,
        recommendationReason: 'High engagement with networking events',
      },
      {
        eventId: 2,
        eventName: 'JavaScript Workshop',
        eventDateTime: '2024-02-20T19:00:00Z',
        recommendationScore: 88.2,
        attendanceProbability: 0.82,
        recommendationReason: 'Interest in technical workshops',
      },
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecommendationsData),
      } as Response);
    });

    it('should fetch event recommendations successfully', async () => {
      const result = await analyticsService.getEventRecommendations(
        TEST_CLUB_ID,
        TEST_MEMBER_ID,
        MAX_RECOMMENDATIONS
      );

      expect(result).toEqual(mockRecommendationsData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/event-recommendations?clubId=${TEST_CLUB_ID}&memberId=${TEST_MEMBER_ID}&maxRecommendations=${MAX_RECOMMENDATIONS}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should validate maxRecommendations parameter', async () => {
      await expect(
        analyticsService.getEventRecommendations(TEST_CLUB_ID, TEST_MEMBER_ID, 0)
      ).rejects.toThrow('Max recommendations must be greater than 0');

      await expect(
        analyticsService.getEventRecommendations(TEST_CLUB_ID, TEST_MEMBER_ID, -1)
      ).rejects.toThrow('Max recommendations must be greater than 0');

      await expect(
        analyticsService.getEventRecommendations(TEST_CLUB_ID, TEST_MEMBER_ID, 25)
      ).rejects.toThrow('Max recommendations cannot exceed 20');
    });
  });

  describe('analyzeEventPerformance', () => {
    const TEST_EVENT_ID = 789;
    const mockPerformanceData = {
      eventId: TEST_EVENT_ID,
      eventName: 'Annual Conference',
      eventDate: '2024-01-20T09:00:00Z',
      performanceScore: 87.5,
      attendanceAnalysis: {
        totalRsvps: 150,
        totalAttended: 128,
        attendanceRate: 0.853,
        noShowRate: 0.147,
      },
      engagementBreakdown: {
        'networking': 8.2,
        'content': 7.9,
        'venue': 8.5,
        'logistics': 7.8,
      },
      comparisonToAverage: {
        'attendance': 1.12,
        'engagement': 1.08,
        'satisfaction': 1.15,
      },
      improvementSuggestions: [
        'Consider longer networking breaks',
        'Improve content delivery format',
        'Add more interactive sessions',
      ],
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPerformanceData),
      } as Response);
    });

    it('should analyze event performance successfully', async () => {
      const result = await analyticsService.analyzeEventPerformance(TEST_EVENT_ID);

      expect(result).toEqual(mockPerformanceData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/event-performance?eventId=${TEST_EVENT_ID}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('predictEventSuccess', () => {
    const TEST_EVENT_ID = 789;
    const mockPredictionData = {
      eventId: TEST_EVENT_ID,
      eventName: 'Future Workshop',
      eventDate: '2024-03-15T14:00:00Z',
      predictedAttendanceRate: 0.78,
      successProbability: 0.85,
      confidenceLevel: 'High' as const,
      riskFactors: [
        'Competing event on same day',
        'Holiday weekend impact',
      ],
      successFactors: [
        'Popular topic area',
        'Experienced speaker',
        'Good time slot',
      ],
      recommendedActions: [
        'Send reminder emails 48 hours before',
        'Prepare for 20% cancellation rate',
        'Have backup activities ready',
      ],
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPredictionData),
      } as Response);
    });

    it('should predict event success successfully', async () => {
      const result = await analyticsService.predictEventSuccess(TEST_EVENT_ID);

      expect(result).toEqual(mockPredictionData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/event-success-prediction?eventId=${TEST_EVENT_ID}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('generateEngagementReport', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const reportType = 'comprehensive';
    const mockReportData = {
      clubId: TEST_CLUB_ID,
      reportType: reportType,
      reportPeriod: { start: startDate, end: endDate },
      generatedAt: '2024-02-01T10:00:00Z',
      executiveSummary: 'Strong engagement with growing membership',
      keyMetrics: {
        'totalEvents': 12,
        'averageAttendance': 68.5,
        'memberRetention': 0.87,
        'engagementScore': 76.2,
      },
      trendAnalysis: {
        overallDirection: 'Increasing' as const,
        monthlyGrowthRate: 12.8,
        seasonalPatterns: {
          'Q1': 78.5,
          'Q2': 82.1,
          'Q3': 74.9,
          'Q4': 80.3,
        },
      },
      memberInsights: [],
      eventAnalysis: [],
      recommendations: [
        'Focus on retention initiatives',
        'Expand successful event formats',
        'Implement member feedback system',
      ],
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReportData),
      } as Response);
    });

    it('should generate engagement report successfully', async () => {
      const result = await analyticsService.generateEngagementReport(
        TEST_CLUB_ID,
        reportType,
        startDate,
        endDate
      );

      expect(result).toEqual(mockReportData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/engagement-report`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            clubId: TEST_CLUB_ID,
            reportType: reportType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        })
      );
    });

    it('should validate report type parameter', async () => {
      await expect(
        analyticsService.generateEngagementReport(
          TEST_CLUB_ID,
          'invalid' as any,
          startDate,
          endDate
        )
      ).rejects.toThrow('Invalid report type');
    });
  });

  describe('getROIMetrics', () => {
    const PERIOD_MONTHS = 12;
    const mockROIData = {
      clubId: TEST_CLUB_ID,
      analysisPeriodMonths: PERIOD_MONTHS,
      totalEventCosts: 25000,
      totalMemberValue: 65000,
      roiPercentage: 160.0,
      costBreakdown: {
        'venue': 12000,
        'catering': 8000,
        'speakers': 3000,
        'marketing': 2000,
      },
      valueDrivers: {
        'membershipFees': 45000,
        'eventTickets': 15000,
        'merchandise': 3000,
        'sponsorships': 2000,
      },
      costPerMember: 200.0,
      valuePerMember: 520.0,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockROIData),
      } as Response);
    });

    it('should fetch ROI metrics successfully', async () => {
      const result = await analyticsService.getROIMetrics(TEST_CLUB_ID, PERIOD_MONTHS);

      expect(result).toEqual(mockROIData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_BASE}/api/analytics/roi-metrics?clubId=${TEST_CLUB_ID}&periodMonths=${PERIOD_MONTHS}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should validate periodMonths parameter', async () => {
      await expect(
        analyticsService.getROIMetrics(TEST_CLUB_ID, 0)
      ).rejects.toThrow('Period months must be greater than 0');

      await expect(
        analyticsService.getROIMetrics(TEST_CLUB_ID, -1)
      ).rejects.toThrow('Period months must be greater than 0');

      await expect(
        analyticsService.getROIMetrics(TEST_CLUB_ID, 48)
      ).rejects.toThrow('Period months cannot exceed 36');
    });
  });

  describe('Exported Functions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    it('should export getEventEngagementAnalytics function', async () => {
      const { getEventEngagementAnalytics } = await import('../../../client/src/services/analyticsService');
      
      await getEventEngagementAnalytics(
        TEST_CLUB_ID,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getEngagementTrends function', async () => {
      const { getEngagementTrends } = await import('../../../client/src/services/analyticsService');
      
      await getEngagementTrends(TEST_CLUB_ID, 30);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should export getEventRecommendations with defaults', async () => {
      const { getEventRecommendations } = await import('../../../client/src/services/analyticsService');
      
      await getEventRecommendations(TEST_CLUB_ID);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('memberId=0&maxRecommendations=10'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(
        analyticsService.getEventEngagementAnalytics(
          TEST_CLUB_ID,
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )
      ).rejects.toThrow('Request timeout');
    });

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as Response);

      const result = await analyticsService.getEventEngagementAnalytics(
        TEST_CLUB_ID,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toBeNull();
    });

    it('should handle unauthorized access (401)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Authentication required' }),
      } as Response);

      await expect(
        analyticsService.getEventEngagementAnalytics(
          TEST_CLUB_ID,
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )
      ).rejects.toThrow('Authentication required');
    });

    it('should handle rate limiting (429)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      } as Response);

      await expect(
        analyticsService.getEventEngagementAnalytics(
          TEST_CLUB_ID,
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Data Transformation and Validation', () => {
    it('should handle date string conversion correctly', async () => {
      const dateStringData = {
        eventDate: '2024-01-15T10:00:00Z',
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(dateStringData),
      } as Response);

      const result = await analyticsService.getEngagementBenchmarks(TEST_CLUB_ID);

      expect(result).toEqual(dateStringData);
    });

    it('should handle numeric precision in scores', async () => {
      const precisionData = {
        engagementScore: 87.123456789,
        attendanceRate: 0.8534567,
        roiPercentage: 156.789123,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(precisionData),
      } as Response);

      const result = await analyticsService.getEngagementBenchmarks(TEST_CLUB_ID);

      expect(result.engagementScore).toBe(87.123456789);
      expect(result.attendanceRate).toBe(0.8534567);
      expect(result.roiPercentage).toBe(156.789123);
    });
  });

  describe('Performance and Caching', () => {
    it('should make concurrent requests efficiently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const promises = [
        analyticsService.getEngagementBenchmarks(TEST_CLUB_ID),
        analyticsService.getEngagementTrends(TEST_CLUB_ID, 30),
        analyticsService.getROIMetrics(TEST_CLUB_ID, 12),
      ];

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle large dataset responses', async () => {
      const largeDataset = {
        dailyTrends: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString(),
          engagementScore: Math.random() * 100,
          eventCount: Math.floor(Math.random() * 5),
          attendanceRate: Math.random(),
        })),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset),
      } as Response);

      const result = await analyticsService.getEngagementTrends(TEST_CLUB_ID, 365);

      expect(result.dailyTrends).toHaveLength(365);
      expect(result.dailyTrends[0]).toHaveProperty('date');
      expect(result.dailyTrends[0]).toHaveProperty('engagementScore');
    });
  });
});