/**
 * @fileoverview Comprehensive unit tests for Analytics Export Service
 * @version 1.0.0
 * 
 * Test Coverage:
 * - Data export functionality for multiple formats
 * - CSV generation and formatting
 * - Excel and PDF export capabilities
 * - Data transformation and aggregation
 * - Error handling and fallback mechanisms
 * - Performance with large datasets
 * - Mock data generation and validation
 */

import { 
  analyticsExportService,
  AnalyticsExportService,
  AnalyticsExportOptions,
  EngagementMetrics,
  EventAnalytics,
  MemberAnalytics,
  GrowthMetrics,
} from '../../../client/src/services/analyticsExportService';
import apiClient from '../../../client/src/services/apiClient';

// Mock dependencies
jest.mock('../../../client/src/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AnalyticsExportService', () => {
  const TEST_CLUB_ID = 123;
  const TEST_DATE_RANGE = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    mockApiClient.get.mockResolvedValue({ data: {} });
    mockApiClient.post.mockResolvedValue({ data: { jobId: 'test-job-123' } });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should create service instance correctly', () => {
      expect(analyticsExportService).toBeDefined();
      expect(analyticsExportService).toBeInstanceOf(AnalyticsExportService);
    });
  });

  describe('exportAnalyticsData', () => {
    const baseOptions: AnalyticsExportOptions = {
      format: 'csv',
      dateRange: TEST_DATE_RANGE,
      includeCategories: ['engagement', 'events'],
      granularity: 'daily',
    };

    describe('Simple CSV Export', () => {
      it('should export simple CSV data directly', async () => {
        const mockBlob = new Blob(['test,data\n1,2'], { type: 'text/csv' });
        mockApiClient.post.mockResolvedValue({ data: mockBlob });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          baseOptions
        );

        expect(result).toBeInstanceOf(Blob);
        expect(mockApiClient.post).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/export`,
          baseOptions,
          { responseType: 'blob' }
        );
      });

      it('should handle simple export without predictions or segmentation', async () => {
        const options = {
          ...baseOptions,
          includePredictions: false,
          includeSegmentation: false,
        };

        const mockBlob = new Blob(['engagement,events\n85.5,12'], { type: 'text/csv' });
        mockApiClient.post.mockResolvedValue({ data: mockBlob });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          options
        );

        expect(result).toBeInstanceOf(Blob);
      });
    });

    describe('Complex Analytics Export', () => {
      it('should use background processing for complex analytics', async () => {
        const complexOptions = {
          ...baseOptions,
          format: 'excel' as const,
          includePredictions: true,
          includeSegmentation: true,
        };

        mockApiClient.post.mockResolvedValue({ data: { jobId: 'complex-job-456' } });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          complexOptions
        );

        expect(result).toEqual({ jobId: 'complex-job-456' });
        expect(mockApiClient.post).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/export/async`,
          complexOptions
        );
      });

      it('should handle PDF export with background processing', async () => {
        const pdfOptions = {
          ...baseOptions,
          format: 'pdf' as const,
        };

        mockApiClient.post.mockResolvedValue({ data: { jobId: 'pdf-job-789' } });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          pdfOptions
        );

        expect(result).toEqual({ jobId: 'pdf-job-789' });
      });

      it('should handle JSON export', async () => {
        const jsonOptions = {
          ...baseOptions,
          format: 'json' as const,
        };

        mockApiClient.post.mockResolvedValue({ data: { jobId: 'json-job-101' } });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          jsonOptions
        );

        expect(result).toEqual({ jobId: 'json-job-101' });
      });
    });

    describe('Error Handling and Fallbacks', () => {
      it('should fallback to mock data on API error', async () => {
        mockApiClient.post.mockRejectedValue(new Error('API unavailable'));

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          baseOptions
        );

        expect(result).toBeInstanceOf(Blob);
        expect(console.error).toHaveBeenCalledWith(
          'Error exporting analytics data:',
          expect.any(Error)
        );
      });

      it('should handle network timeouts gracefully', async () => {
        mockApiClient.post.mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
        );

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          baseOptions
        );

        expect(result).toBeInstanceOf(Blob);
      });

      it('should handle invalid response formats', async () => {
        mockApiClient.post.mockResolvedValue({ data: null });

        const result = await analyticsExportService.exportAnalyticsData(
          TEST_CLUB_ID,
          baseOptions
        );

        expect(result).toBeInstanceOf(Blob);
      });
    });
  });

  describe('Analytics Data Fetching', () => {
    describe('getEngagementAnalytics', () => {
      const mockEngagementData: EngagementMetrics = {
        totalEngagementScore: 8542.5,
        averageEngagementScore: 68.3,
        engagementTrend: 12.5,
        topEngagedMembers: [
          {
            memberId: '1',
            memberName: 'Alice Johnson',
            engagementScore: 95.2,
            eventsAttended: 15,
          },
          {
            memberId: '2',
            memberName: 'Bob Smith',
            engagementScore: 88.7,
            eventsAttended: 12,
          },
        ],
        engagementBySegment: {
          'Premium': 78.5,
          'Basic': 58.2,
          'Trial': 42.1,
        },
        dailyEngagement: [
          { date: '2024-01-01', score: 65.2, activeMembers: 89 },
          { date: '2024-01-02', score: 72.1, activeMembers: 94 },
        ],
      };

      beforeEach(() => {
        mockApiClient.get.mockResolvedValue({ data: mockEngagementData });
      });

      it('should fetch engagement analytics successfully', async () => {
        const result = await analyticsExportService.getEngagementAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result).toEqual(mockEngagementData);
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/engagement`,
          { params: TEST_DATE_RANGE }
        );
      });

      it('should handle API errors with mock fallback', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Service unavailable'));

        const result = await analyticsExportService.getEngagementAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result).toBeDefined();
        expect(result.totalEngagementScore).toBeGreaterThan(0);
        expect(result.topEngagedMembers).toHaveLength(2);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching engagement analytics:',
          expect.any(Error)
        );
      });

      it('should validate date range parameters', async () => {
        const invalidDateRange = {
          startDate: '2024-13-01', // Invalid month
          endDate: '2024-01-31',
        };

        // Service should still call API with provided parameters
        await analyticsExportService.getEngagementAnalytics(
          TEST_CLUB_ID,
          invalidDateRange
        );

        expect(mockApiClient.get).toHaveBeenCalledWith(
          expect.any(String),
          { params: invalidDateRange }
        );
      });
    });

    describe('getEventAnalytics', () => {
      const mockEventData: EventAnalytics = {
        totalEvents: 24,
        averageAttendance: 32.5,
        attendanceRate: 0.78,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Monthly Networking',
            attendees: 45,
            rsvpCount: 52,
            attendanceRate: 0.865,
            engagementScore: 87.3,
          },
        ],
        eventTypeAnalysis: {
          'Networking': { count: 8, averageAttendance: 35.2, averageEngagement: 75.4 },
          'Workshop': { count: 6, averageAttendance: 22.8, averageEngagement: 82.1 },
        },
        timeSlotAnalysis: {
          'Morning': { eventCount: 8, averageAttendance: 18.5 },
          'Evening': { eventCount: 10, averageAttendance: 42.8 },
        },
      };

      beforeEach(() => {
        mockApiClient.get.mockResolvedValue({ data: mockEventData });
      });

      it('should fetch event analytics successfully', async () => {
        const result = await analyticsExportService.getEventAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result).toEqual(mockEventData);
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/events`,
          { params: TEST_DATE_RANGE }
        );
      });

      it('should handle empty event data gracefully', async () => {
        const emptyEventData = {
          ...mockEventData,
          totalEvents: 0,
          mostPopularEvents: [],
        };
        mockApiClient.get.mockResolvedValue({ data: emptyEventData });

        const result = await analyticsExportService.getEventAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result.totalEvents).toBe(0);
        expect(result.mostPopularEvents).toHaveLength(0);
      });
    });

    describe('getMemberAnalytics', () => {
      const mockMemberData: MemberAnalytics = {
        totalMembers: 125,
        activeMembers: 98,
        newMembers: 15,
        churnedMembers: 3,
        retentionRate: 0.92,
        growthRate: 0.096,
        membersByType: {
          'Premium': 45,
          'Basic': 65,
          'Trial': 15,
        },
        engagementDistribution: {
          high: 28,
          medium: 52,
          low: 35,
          inactive: 10,
        },
        cohortAnalysis: [
          {
            cohort: '2024-01',
            size: 25,
            retentionRates: [1.0, 0.96, 0.92, 0.88],
          },
        ],
      };

      beforeEach(() => {
        mockApiClient.get.mockResolvedValue({ data: mockMemberData });
      });

      it('should fetch member analytics successfully', async () => {
        const result = await analyticsExportService.getMemberAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result).toEqual(mockMemberData);
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/members`,
          { params: TEST_DATE_RANGE }
        );
      });

      it('should handle cohort analysis data correctly', async () => {
        const result = await analyticsExportService.getMemberAnalytics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result.cohortAnalysis).toBeDefined();
        expect(result.cohortAnalysis[0].retentionRates).toHaveLength(4);
        expect(result.cohortAnalysis[0].retentionRates[0]).toBe(1.0);
      });
    });

    describe('getGrowthMetrics', () => {
      const mockGrowthData: GrowthMetrics = {
        memberGrowthRate: 9.6,
        eventGrowthRate: 15.2,
        engagementGrowthRate: 12.8,
        revenueGrowthRate: 18.5,
        monthlyGrowthTrend: [
          {
            month: '2024-01',
            newMembers: 15,
            churnedMembers: 3,
            netGrowth: 12,
            growthRate: 9.6,
          },
        ],
        acquisitionChannels: {
          'Referral': { count: 45, retentionRate: 0.89, engagementScore: 78.5 },
          'Social Media': { count: 32, retentionRate: 0.75, engagementScore: 65.2 },
        },
      };

      beforeEach(() => {
        mockApiClient.get.mockResolvedValue({ data: mockGrowthData });
      });

      it('should fetch growth metrics successfully', async () => {
        const result = await analyticsExportService.getGrowthMetrics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result).toEqual(mockGrowthData);
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/clubs/${TEST_CLUB_ID}/analytics/growth`,
          { params: TEST_DATE_RANGE }
        );
      });

      it('should handle acquisition channel analysis', async () => {
        const result = await analyticsExportService.getGrowthMetrics(
          TEST_CLUB_ID,
          TEST_DATE_RANGE
        );

        expect(result.acquisitionChannels).toBeDefined();
        expect(Object.keys(result.acquisitionChannels)).toContain('Referral');
        expect(result.acquisitionChannels['Referral'].retentionRate).toBe(0.89);
      });
    });
  });

  describe('Custom Metrics Export', () => {
    it('should export custom metrics successfully', async () => {
      const mockBlob = new Blob(['custom,metrics\n1,2'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const metricQueries = ['engagement_by_day', 'retention_cohort'];
      const options: AnalyticsExportOptions = {
        format: 'csv',
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement'],
        granularity: 'daily',
      };

      const result = await analyticsExportService.exportCustomMetrics(
        TEST_CLUB_ID,
        metricQueries,
        options
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${TEST_CLUB_ID}/analytics/custom/export`,
        {
          queries: metricQueries,
          ...options,
        },
        { responseType: 'blob' }
      );
    });

    it('should handle custom metrics API errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Custom metrics unavailable'));

      const result = await analyticsExportService.exportCustomMetrics(
        TEST_CLUB_ID,
        ['test_metric'],
        {
          format: 'csv',
          dateRange: TEST_DATE_RANGE,
          includeCategories: ['engagement'],
          granularity: 'daily',
        }
      );

      expect(result).toBeInstanceOf(Blob);
      expect(console.error).toHaveBeenCalledWith(
        'Error exporting custom metrics:',
        expect.any(Error)
      );
    });
  });

  describe('CSV Generation', () => {
    describe('generateEngagementCSV', () => {
      const mockEngagementMetrics: EngagementMetrics = {
        totalEngagementScore: 8542.5,
        averageEngagementScore: 68.3,
        engagementTrend: 12.5,
        topEngagedMembers: [],
        engagementBySegment: {},
        dailyEngagement: [
          { date: '2024-01-01', score: 65.2, activeMembers: 89 },
          { date: '2024-01-02', score: 72.1, activeMembers: 94 },
          { date: '2024-01-03', score: 68.9, activeMembers: 91 },
        ],
      };

      it('should generate correctly formatted engagement CSV', () => {
        const csv = analyticsExportService.generateEngagementCSV(mockEngagementMetrics);

        const lines = csv.split('\n');
        expect(lines[0]).toBe('Date,Engagement Score,Active Members');
        expect(lines[1]).toBe('2024-01-01,65.2,89');
        expect(lines[2]).toBe('2024-01-02,72.1,94');
        expect(lines[3]).toBe('2024-01-03,68.9,91');
      });

      it('should handle empty engagement data', () => {
        const emptyMetrics = {
          ...mockEngagementMetrics,
          dailyEngagement: [],
        };

        const csv = analyticsExportService.generateEngagementCSV(emptyMetrics);

        expect(csv).toBe('Date,Engagement Score,Active Members');
      });

      it('should handle floating point precision correctly', () => {
        const precisionMetrics = {
          ...mockEngagementMetrics,
          dailyEngagement: [
            { date: '2024-01-01', score: 65.123456, activeMembers: 89 },
          ],
        };

        const csv = analyticsExportService.generateEngagementCSV(precisionMetrics);

        expect(csv).toContain('65.123456');
      });
    });

    describe('generateEventAnalyticsCSV', () => {
      const mockEventAnalytics: EventAnalytics = {
        totalEvents: 10,
        averageAttendance: 30,
        attendanceRate: 0.75,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Tech Meetup',
            attendees: 45,
            rsvpCount: 52,
            attendanceRate: 0.865,
            engagementScore: 87.3,
          },
          {
            eventId: '2',
            eventName: 'Workshop: "Advanced JavaScript"',
            attendees: 28,
            rsvpCount: 35,
            attendanceRate: 0.8,
            engagementScore: 82.1,
          },
        ],
        eventTypeAnalysis: {},
        timeSlotAnalysis: {},
      };

      it('should generate correctly formatted event analytics CSV', () => {
        const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

        const lines = csv.split('\n');
        expect(lines[0]).toBe('Event Name,Event ID,Attendees,RSVP Count,Attendance Rate,Engagement Score');
        expect(lines[1]).toBe('Tech Meetup,1,45,52,86.5%,87.3');
        expect(lines[2]).toBe('"Workshop: ""Advanced JavaScript""",2,28,35,80.0%,82.1');
      });

      it('should properly escape CSV special characters', () => {
        const eventWithSpecialChars: EventAnalytics = {
          ...mockEventAnalytics,
          mostPopularEvents: [
            {
              eventId: '1',
              eventName: 'Event, with "quotes" and \n newlines',
              attendees: 30,
              rsvpCount: 35,
              attendanceRate: 0.857,
              engagementScore: 75.5,
            },
          ],
        };

        const csv = analyticsExportService.generateEventAnalyticsCSV(eventWithSpecialChars);

        expect(csv).toContain('"Event, with ""quotes"" and \n newlines"');
      });

      it('should handle percentage formatting correctly', () => {
        const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

        expect(csv).toContain('86.5%');
        expect(csv).toContain('80.0%');
      });
    });

    describe('generateMemberAnalyticsCSV', () => {
      const mockMemberAnalytics: MemberAnalytics = {
        totalMembers: 125,
        activeMembers: 98,
        newMembers: 15,
        churnedMembers: 3,
        retentionRate: 0.92,
        growthRate: 0.096,
        membersByType: {},
        engagementDistribution: { high: 0, medium: 0, low: 0, inactive: 0 },
        cohortAnalysis: [],
      };

      it('should generate correctly formatted member analytics CSV', () => {
        const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);

        const lines = csv.split('\n');
        expect(lines[0]).toBe('Metric,Value');
        expect(lines[1]).toBe('Total Members,125');
        expect(lines[2]).toBe('Active Members,98');
        expect(lines[3]).toBe('New Members,15');
        expect(lines[4]).toBe('Churned Members,3');
        expect(lines[5]).toBe('Retention Rate,92.0%');
        expect(lines[6]).toBe('Growth Rate,9.6%');
      });

      it('should handle zero values correctly', () => {
        const zeroMetrics = {
          ...mockMemberAnalytics,
          newMembers: 0,
          churnedMembers: 0,
        };

        const csv = analyticsExportService.generateMemberAnalyticsCSV(zeroMetrics);

        expect(csv).toContain('New Members,0');
        expect(csv).toContain('Churned Members,0');
      });
    });
  });

  describe('Data Analysis Functions', () => {
    describe('calculateTrends', () => {
      it('should calculate trends correctly with positive growth', () => {
        const currentPeriod = { members: 120, events: 15, revenue: 5000 };
        const previousPeriod = { members: 100, events: 12, revenue: 4000 };

        const trends = analyticsExportService.calculateTrends(currentPeriod, previousPeriod);

        expect(trends.members).toBe(20); // 20% growth
        expect(trends.events).toBe(25); // 25% growth
        expect(trends.revenue).toBe(25); // 25% growth
      });

      it('should calculate trends correctly with negative growth', () => {
        const currentPeriod = { members: 80, events: 10 };
        const previousPeriod = { members: 100, events: 15 };

        const trends = analyticsExportService.calculateTrends(currentPeriod, previousPeriod);

        expect(trends.members).toBe(-20); // 20% decline
        expect(trends.events).toBe(-33.333333333333336); // ~33.33% decline
      });

      it('should handle zero previous values', () => {
        const currentPeriod = { members: 50 };
        const previousPeriod = { members: 0 };

        const trends = analyticsExportService.calculateTrends(currentPeriod, previousPeriod);

        expect(trends.members).toBe(0);
      });

      it('should ignore non-numeric values', () => {
        const currentPeriod = { members: 100, name: 'Test Club' };
        const previousPeriod = { members: 80, name: 'Test Club Old' };

        const trends = analyticsExportService.calculateTrends(currentPeriod, previousPeriod);

        expect(trends.members).toBe(25);
        expect(trends.name).toBeUndefined();
      });
    });

    describe('segmentMembers', () => {
      const mockMembers = [
        { id: 1, engagementScore: 90, lastActivityDays: 2 },
        { id: 2, engagementScore: 60, lastActivityDays: 10 },
        { id: 3, engagementScore: 30, lastActivityDays: 45 },
        { id: 4, engagementScore: 10, lastActivityDays: 90 },
      ];

      it('should segment members by engagement correctly', () => {
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        expect(segments.high).toHaveLength(1);
        expect(segments.medium).toHaveLength(1);
        expect(segments.low).toHaveLength(1);
        expect(segments.inactive).toHaveLength(1);

        expect(segments.high[0].engagementScore).toBe(90);
        expect(segments.medium[0].engagementScore).toBe(60);
        expect(segments.low[0].engagementScore).toBe(30);
        expect(segments.inactive[0].engagementScore).toBe(10);
      });

      it('should segment members by activity correctly', () => {
        const segments = analyticsExportService.segmentMembers(mockMembers, 'activity');

        expect(segments.active).toHaveLength(1); // <= 7 days
        expect(segments.moderate).toHaveLength(1); // 7-30 days
        expect(segments.inactive).toHaveLength(2); // > 30 days

        expect(segments.active[0].lastActivityDays).toBe(2);
        expect(segments.moderate[0].lastActivityDays).toBe(10);
      });

      it('should handle unknown criteria with default segmentation', () => {
        const segments = analyticsExportService.segmentMembers(mockMembers, 'unknown');

        expect(segments.all).toHaveLength(4);
        expect(segments.all).toEqual(mockMembers);
      });

      it('should handle empty member array', () => {
        const segments = analyticsExportService.segmentMembers([], 'engagement');

        expect(segments.high).toHaveLength(0);
        expect(segments.medium).toHaveLength(0);
        expect(segments.low).toHaveLength(0);
        expect(segments.inactive).toHaveLength(0);
      });
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate consistent mock engagement metrics', () => {
      const metrics1 = analyticsExportService['getMockEngagementMetrics']();
      const metrics2 = analyticsExportService['getMockEngagementMetrics']();

      expect(metrics1.totalEngagementScore).toBe(metrics2.totalEngagementScore);
      expect(metrics1.topEngagedMembers).toHaveLength(2);
      expect(metrics1.dailyEngagement).toHaveLength(3);
    });

    it('should generate realistic mock event analytics', () => {
      const analytics = analyticsExportService['getMockEventAnalytics']();

      expect(analytics.totalEvents).toBeGreaterThan(0);
      expect(analytics.attendanceRate).toBeGreaterThan(0);
      expect(analytics.attendanceRate).toBeLessThanOrEqual(1);
      expect(analytics.mostPopularEvents).toHaveLength(2);
      
      // Verify event data structure
      const firstEvent = analytics.mostPopularEvents[0];
      expect(firstEvent).toHaveProperty('eventId');
      expect(firstEvent).toHaveProperty('eventName');
      expect(firstEvent).toHaveProperty('attendees');
      expect(firstEvent).toHaveProperty('rsvpCount');
      expect(firstEvent).toHaveProperty('attendanceRate');
      expect(firstEvent).toHaveProperty('engagementScore');
    });

    it('should generate realistic mock member analytics', () => {
      const analytics = analyticsExportService['getMockMemberAnalytics']();

      expect(analytics.totalMembers).toBeGreaterThan(analytics.activeMembers);
      expect(analytics.retentionRate).toBeGreaterThan(0);
      expect(analytics.retentionRate).toBeLessThanOrEqual(1);
      expect(analytics.cohortAnalysis).toHaveLength(2);
      
      // Verify retention rates are decreasing over time
      const firstCohort = analytics.cohortAnalysis[0];
      expect(firstCohort.retentionRates[0]).toBe(1.0);
      expect(firstCohort.retentionRates[1]).toBeLessThan(1.0);
    });

    it('should generate realistic mock growth metrics', () => {
      const metrics = analyticsExportService['getMockGrowthMetrics']();

      expect(metrics.memberGrowthRate).toBeGreaterThan(0);
      expect(metrics.monthlyGrowthTrend).toHaveLength(2);
      expect(Object.keys(metrics.acquisitionChannels)).toContain('Referral');
      
      // Verify acquisition channel data
      const referralChannel = metrics.acquisitionChannels['Referral'];
      expect(referralChannel.retentionRate).toBeGreaterThan(0);
      expect(referralChannel.retentionRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null or undefined data gracefully', async () => {
      mockApiClient.get.mockResolvedValue({ data: null });

      const result = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      expect(result).toBeDefined();
      expect(result.totalEngagementScore).toBeGreaterThan(0);
    });

    it('should handle malformed API responses', async () => {
      mockApiClient.get.mockResolvedValue({ data: 'invalid json string' });

      const result = await analyticsExportService.getEventAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      expect(result).toBeDefined();
      expect(result.totalEvents).toBeGreaterThan(0);
    });

    it('should handle very large datasets without performance issues', async () => {
      const largeDataset = {
        dailyEngagement: Array.from({ length: 1000 }, (_, i) => ({
          date: `2024-01-${String(i % 31 + 1).padStart(2, '0')}`,
          score: Math.random() * 100,
          activeMembers: Math.floor(Math.random() * 200) + 50,
        })),
        totalEngagementScore: 50000,
        averageEngagementScore: 75,
        engagementTrend: 5.5,
        topEngagedMembers: [],
        engagementBySegment: {},
      };

      mockApiClient.get.mockResolvedValue({ data: largeDataset });

      const startTime = performance.now();
      const result = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );
      const endTime = performance.now();

      expect(result.dailyEngagement).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should process in <100ms
    });
  });

  describe('CSV Escaping and Special Characters', () => {
    it('should properly escape CSV fields with commas', () => {
      const testString = 'Event, with commas';
      const escaped = analyticsExportService['escapeCSV'](testString);

      expect(escaped).toBe('"Event, with commas"');
    });

    it('should properly escape CSV fields with quotes', () => {
      const testString = 'Event with "quotes"';
      const escaped = analyticsExportService['escapeCSV'](testString);

      expect(escaped).toBe('"Event with ""quotes"""');
    });

    it('should properly escape CSV fields with newlines', () => {
      const testString = 'Event with\nnewlines';
      const escaped = analyticsExportService['escapeCSV'](testString);

      expect(escaped).toBe('"Event with\nnewlines"');
    });

    it('should not escape simple strings without special characters', () => {
      const testString = 'Simple Event Name';
      const escaped = analyticsExportService['escapeCSV'](testString);

      expect(escaped).toBe('Simple Event Name');
    });

    it('should handle empty strings', () => {
      const escaped = analyticsExportService['escapeCSV']('');

      expect(escaped).toBe('');
    });
  });
});