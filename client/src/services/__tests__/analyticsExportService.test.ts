/**
 * Comprehensive Test Suite for analyticsExportService
 * Coverage Target: 350-450 LOC (70-90% of 497 LOC)
 *
 * Testing Strategy:
 * - apiClient mock for HTTP boundary mocking
 * - No internal service mocking (except logger)
 * - AAA pattern (Arrange, Act, Assert)
 * - Comprehensive edge cases and error handling
 * - CSV generation with special character testing
 */

import apiClient from '../apiClient';
import {
  analyticsExportService,
  type AnalyticsExportOptions,
  type EngagementMetrics,
  type EventAnalytics,
  type MemberAnalytics,
  type GrowthMetrics,
} from '../analyticsExportService';

// Mock apiClient
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock logger to prevent console noise
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('analyticsExportService', () => {
  const clubId = 123;
  const mockDateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data fixtures
  const mockEngagementMetrics: EngagementMetrics = {
    totalEngagementScore: 8542.5,
    averageEngagementScore: 68.3,
    engagementTrend: 12.5,
    topEngagedMembers: [
      { memberId: '1', memberName: 'Alice Johnson', engagementScore: 95.2, eventsAttended: 15 },
      { memberId: '2', memberName: 'Bob Smith', engagementScore: 88.7, eventsAttended: 12 },
    ],
    engagementBySegment: { Premium: 78.5, Basic: 58.2, Trial: 42.1 },
    dailyEngagement: [
      { date: '2024-01-01', score: 65.2, activeMembers: 89 },
      { date: '2024-01-02', score: 72.1, activeMembers: 94 },
      { date: '2024-01-03', score: 68.9, activeMembers: 91 },
    ],
  };

  const mockEventAnalytics: EventAnalytics = {
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
      {
        eventId: '2',
        eventName: 'Tech Workshop',
        attendees: 28,
        rsvpCount: 35,
        attendanceRate: 0.8,
        engagementScore: 82.1,
      },
    ],
    eventTypeAnalysis: {
      Networking: { count: 8, averageAttendance: 35.2, averageEngagement: 75.4 },
      Workshop: { count: 6, averageAttendance: 22.8, averageEngagement: 82.1 },
    },
    timeSlotAnalysis: {
      Morning: { eventCount: 8, averageAttendance: 18.5 },
      Evening: { eventCount: 10, averageAttendance: 42.8 },
    },
  };

  const mockMemberAnalytics: MemberAnalytics = {
    totalMembers: 125,
    activeMembers: 98,
    newMembers: 15,
    churnedMembers: 3,
    retentionRate: 0.92,
    growthRate: 0.096,
    membersByType: { Premium: 45, Basic: 65, Trial: 15 },
    engagementDistribution: { high: 28, medium: 52, low: 35, inactive: 10 },
    cohortAnalysis: [
      { cohort: '2024-01', size: 25, retentionRates: [1.0, 0.96, 0.92] },
    ],
  };

  const mockGrowthMetrics: GrowthMetrics = {
    memberGrowthRate: 9.6,
    eventGrowthRate: 15.2,
    engagementGrowthRate: 12.8,
    revenueGrowthRate: 18.5,
    monthlyGrowthTrend: [
      { month: '2024-01', newMembers: 15, churnedMembers: 3, netGrowth: 12, growthRate: 9.6 },
    ],
    acquisitionChannels: {
      Referral: { count: 45, retentionRate: 0.89, engagementScore: 78.5 },
      'Social Media': { count: 32, retentionRate: 0.75, engagementScore: 65.2 },
    },
  };

  describe('exportAnalyticsData', () => {
    const EXPORT_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/export`;
    const downloadUrlFor = (filename: string) =>
      `http://localhost:8050/api/clubs/${clubId}/analytics/premium/downloads/${filename}`;

    describe('End-to-end export (POST request -> GET file blob)', () => {
      it('should POST an export request then GET the generated file as a Blob', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'csv',
          dateRange: mockDateRange,
          includeCategories: ['engagement', 'events'],
          granularity: 'daily',
        };
        const filename = 'analytics-engagement-123-x.csv';
        const mockBlob = new Blob(['csv content'], { type: 'text/csv' });

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
        });
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

        // Act
        const result = await analyticsExportService.exportAnalyticsData(clubId, options);

        // Assert
        expect(result).toBeInstanceOf(Blob);

        const [postUrl, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
        expect(postUrl).toBe(EXPORT_URL);
        // First category 'engagement' maps to dataType 'engagement'.
        expect(postBody).toMatchObject({
          dataType: 'engagement',
          format: 'csv',
          startDate: mockDateRange.startDate,
          endDate: mockDateRange.endDate,
        });

        const [getUrl, getConfig] = (apiClient.get as jest.Mock).mock.calls[0];
        expect(getUrl).toBe(downloadUrlFor(filename));
        expect(getConfig).toMatchObject({ responseType: 'blob' });
      });

      it('should map category "members" to dataType "segmentation"', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'excel',
          dateRange: mockDateRange,
          includeCategories: ['members'],
          granularity: 'monthly',
        };
        const filename = 'analytics-segmentation-123-x.xlsx';
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
        });
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['xlsx']) });

        // Act
        await analyticsExportService.exportAnalyticsData(clubId, options);

        // Assert
        const [, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
        expect(postBody.dataType).toBe('segmentation');
        expect(postBody.format).toBe('excel');
      });

      it('should map category "growth" to dataType "cohorts"', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'pdf',
          dateRange: mockDateRange,
          includeCategories: ['growth'],
          granularity: 'monthly',
        };
        const filename = 'analytics-cohorts-123-x.pdf';
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
        });
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['pdf']) });

        // Act
        await analyticsExportService.exportAnalyticsData(clubId, options);

        // Assert
        const [, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
        expect(postBody.dataType).toBe('cohorts');
      });

      it('should default to dataType "engagement" when categories are empty', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'csv',
          dateRange: mockDateRange,
          includeCategories: [],
          granularity: 'daily',
        };
        const filename = 'analytics-engagement-123-x.csv';
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
        });
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['csv']) });

        // Act
        await analyticsExportService.exportAnalyticsData(clubId, options);

        // Assert
        const [, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
        expect(postBody.dataType).toBe('engagement');
      });
    });

    describe('Unsupported format (JSON honest failure)', () => {
      it('should reject JSON format without making any request', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'json',
          dateRange: mockDateRange,
          includeCategories: ['engagement'],
          granularity: 'daily',
        };

        // Act & Assert
        await expect(
          analyticsExportService.exportAnalyticsData(clubId, options)
        ).rejects.toMatchObject({ message: expect.stringContaining('Error exportAnalyticsData:') });
        expect(apiClient.post).not.toHaveBeenCalled();
        expect(apiClient.get).not.toHaveBeenCalled();
      });
    });

    describe('Error Propagation (I-005: no fabricated data)', () => {
      it('should propagate the error on export request failure instead of returning fabricated data', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'csv',
          dateRange: mockDateRange,
          includeCategories: ['engagement'],
          granularity: 'daily',
        };

        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        // Act & Assert
        await expect(
          analyticsExportService.exportAnalyticsData(clubId, options)
        ).rejects.toMatchObject({ message: expect.stringContaining('Error exportAnalyticsData:') });
      });

      it('should propagate the error when the file download fails', async () => {
        // Arrange
        const options: AnalyticsExportOptions = {
          format: 'excel',
          dateRange: mockDateRange,
          includeCategories: ['engagement'],
          granularity: 'weekly',
        };
        const filename = 'analytics-engagement-123-x.xlsx';
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
        });
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

        // Act & Assert
        await expect(
          analyticsExportService.exportAnalyticsData(clubId, options)
        ).rejects.toMatchObject({ message: expect.stringContaining('Error exportAnalyticsData:') });
      });
    });
  });

  describe('exportEventAnalytics (quick export)', () => {
    const EXPORT_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/export`;

    it('should POST to the absolute premium export URL with the events dataType and return a Blob', async () => {
      // Arrange
      const filename = 'analytics-events-123-x.csv';
      const mockBlob = new Blob(['events csv'], { type: 'text/csv' });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
      });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

      // Act
      const result = await analyticsExportService.exportEventAnalytics(clubId, { format: 'csv' });

      // Assert
      expect(result).toBeInstanceOf(Blob);
      const [url, body] = (apiClient.post as jest.Mock).mock.calls[0];
      expect(url).toBe(EXPORT_URL);
      expect(body.dataType).toBe('events');
    });

    it('should support excel exports and return a Blob', async () => {
      // Arrange
      const filename = 'analytics-events-123-x.xlsx';
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
      });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: new Blob(['xlsx']) });

      // Act
      const result = await analyticsExportService.exportEventAnalytics(clubId, { format: 'excel' });

      // Assert
      expect(result).toBeInstanceOf(Blob);
    });

    it('should propagate errors instead of fabricating data', async () => {
      // Arrange
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.exportEventAnalytics(clubId, { format: 'csv' })
      ).rejects.toMatchObject({ message: expect.stringContaining('Error exportAnalyticsData:') });
    });
  });

  describe('exportEngagementData (quick export)', () => {
    const EXPORT_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/export`;

    it('should POST to the absolute premium export URL with the engagement dataType and return a Blob', async () => {
      // Arrange
      const filename = 'analytics-engagement-123-x.csv';
      const mockBlob = new Blob(['engagement csv'], { type: 'text/csv' });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
      });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

      // Act
      const result = await analyticsExportService.exportEngagementData(clubId, { format: 'csv' });

      // Assert
      expect(result).toBeInstanceOf(Blob);
      const [url, body] = (apiClient.post as jest.Mock).mock.calls[0];
      expect(url).toBe(EXPORT_URL);
      expect(body.dataType).toBe('engagement');
    });

    it('should propagate errors instead of fabricating data', async () => {
      // Arrange
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.exportEngagementData(clubId, { format: 'csv' })
      ).rejects.toMatchObject({ message: expect.stringContaining('Error exportAnalyticsData:') });
    });
  });

  describe('getEngagementAnalytics', () => {
    it('should fetch engagement analytics successfully', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementMetrics });

      // Act
      const result = await analyticsExportService.getEngagementAnalytics(clubId, mockDateRange);

      // Assert
      expect(result).toEqual(mockEngagementMetrics);
      expect(result.totalEngagementScore).toBe(8542.5);
      expect(result.averageEngagementScore).toBe(68.3);
      expect(result.engagementTrend).toBe(12.5);
      // MemberEngagement lives under /api/v1, which apiClient prepends — so the path is bare.
      const [url] = (apiClient.get as jest.Mock).mock.calls[0];
      expect(url).toBe(`/MemberEngagement/club/${clubId}/overview`);
    });

    it('should return top engaged members', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementMetrics });

      // Act
      const result = await analyticsExportService.getEngagementAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.topEngagedMembers).toHaveLength(2);
      expect(result.topEngagedMembers[0].memberName).toBe('Alice Johnson');
      expect(result.topEngagedMembers[0].engagementScore).toBe(95.2);
    });

    it('should return engagement by segment', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementMetrics });

      // Act
      const result = await analyticsExportService.getEngagementAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.engagementBySegment.Premium).toBe(78.5);
      expect(result.engagementBySegment.Basic).toBe(58.2);
      expect(result.engagementBySegment.Trial).toBe(42.1);
    });

    it('should return daily engagement data', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementMetrics });

      // Act
      const result = await analyticsExportService.getEngagementAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.dailyEngagement).toHaveLength(3);
      expect(result.dailyEngagement[0].date).toBe('2024-01-01');
      expect(result.dailyEngagement[0].score).toBe(65.2);
      expect(result.dailyEngagement[0].activeMembers).toBe(89);
    });

    it('should propagate the error on 404 instead of returning fabricated data', async () => {
      // Arrange
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        analyticsExportService.getEngagementAnalytics(clubId, mockDateRange)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getEngagementAnalytics:') });
    });

    it('should propagate the error on 500 instead of returning fabricated data', async () => {
      // Arrange
      const error = new Error('Server error');
      (error as any).response = { status: 500 };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        analyticsExportService.getEngagementAnalytics(clubId, mockDateRange)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getEngagementAnalytics:') });
    });

    it('should propagate the error on network failure instead of returning fabricated data', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.getEngagementAnalytics(clubId, mockDateRange)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getEngagementAnalytics:') });
    });
  });

  describe('getMemberAnalytics', () => {
    const SEGMENTATION_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/segmentation`;

    it('should fetch member analytics successfully from the absolute premium segmentation URL', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMemberAnalytics });

      // Act
      const result = await analyticsExportService.getMemberAnalytics(clubId, mockDateRange);

      // Assert
      expect(result).toEqual(mockMemberAnalytics);
      expect(result.totalMembers).toBe(125);
      expect(result.activeMembers).toBe(98);
      const [url] = (apiClient.get as jest.Mock).mock.calls[0];
      expect(url).toBe(SEGMENTATION_URL);
    });

    it('should return member distribution data', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMemberAnalytics });

      // Act
      const result = await analyticsExportService.getMemberAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.engagementDistribution.high).toBe(28);
      expect(result.engagementDistribution.medium).toBe(52);
      expect(result.engagementDistribution.low).toBe(35);
      expect(result.engagementDistribution.inactive).toBe(10);
    });

    it('should return member by type analysis', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMemberAnalytics });

      // Act
      const result = await analyticsExportService.getMemberAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.membersByType.Premium).toBe(45);
      expect(result.membersByType.Basic).toBe(65);
      expect(result.membersByType.Trial).toBe(15);
    });

    it('should return cohort analysis', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMemberAnalytics });

      // Act
      const result = await analyticsExportService.getMemberAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.cohortAnalysis).toHaveLength(1);
      expect(result.cohortAnalysis[0].cohort).toBe('2024-01');
      expect(result.cohortAnalysis[0].size).toBe(25);
    });

    it('should return retention and growth rates', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMemberAnalytics });

      // Act
      const result = await analyticsExportService.getMemberAnalytics(clubId, mockDateRange);

      // Assert
      expect(result.retentionRate).toBe(0.92);
      expect(result.growthRate).toBe(0.096);
    });

    it('should propagate the error on API failure instead of returning fabricated data', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.getMemberAnalytics(clubId, mockDateRange)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getMemberAnalytics:') });
    });
  });

  describe('getGrowthMetrics', () => {
    const COHORTS_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/cohorts`;

    it('should fetch growth metrics successfully from the absolute premium cohorts URL', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGrowthMetrics });

      // Act
      const result = await analyticsExportService.getGrowthMetrics(clubId, mockDateRange);

      // Assert
      expect(result).toEqual(mockGrowthMetrics);
      expect(result.memberGrowthRate).toBe(9.6);
      expect(result.eventGrowthRate).toBe(15.2);
      const [url] = (apiClient.get as jest.Mock).mock.calls[0];
      expect(url).toBe(COHORTS_URL);
    });

    it('should return all growth rates', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGrowthMetrics });

      // Act
      const result = await analyticsExportService.getGrowthMetrics(clubId, mockDateRange);

      // Assert
      expect(result.engagementGrowthRate).toBe(12.8);
      expect(result.revenueGrowthRate).toBe(18.5);
    });

    it('should return monthly growth trend', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGrowthMetrics });

      // Act
      const result = await analyticsExportService.getGrowthMetrics(clubId, mockDateRange);

      // Assert
      expect(result.monthlyGrowthTrend).toHaveLength(1);
      expect(result.monthlyGrowthTrend[0].month).toBe('2024-01');
      expect(result.monthlyGrowthTrend[0].newMembers).toBe(15);
      expect(result.monthlyGrowthTrend[0].churnedMembers).toBe(3);
      expect(result.monthlyGrowthTrend[0].netGrowth).toBe(12);
    });

    it('should return acquisition channels analysis', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGrowthMetrics });

      // Act
      const result = await analyticsExportService.getGrowthMetrics(clubId, mockDateRange);

      // Assert
      expect(result.acquisitionChannels.Referral.count).toBe(45);
      expect(result.acquisitionChannels.Referral.retentionRate).toBe(0.89);
      expect(result.acquisitionChannels['Social Media'].engagementScore).toBe(65.2);
    });

    it('should propagate the error on API failure instead of returning fabricated data', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.getGrowthMetrics(clubId, mockDateRange)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getGrowthMetrics:') });
    });
  });

  describe('exportCustomMetrics', () => {
    const EXPORT_URL = `http://localhost:8050/api/clubs/${clubId}/analytics/premium/export`;
    const DOWNLOAD_URL = (filename: string) =>
      `http://localhost:8050/api/clubs/${clubId}/analytics/premium/downloads/${filename}`;

    it('should run the POST-then-GET-blob flow against the absolute premium URLs', async () => {
      // Arrange
      const metricQueries = ['engagement', 'retention'];
      const options: AnalyticsExportOptions = {
        format: 'csv',
        dateRange: mockDateRange,
        includeCategories: ['engagement'],
        granularity: 'monthly',
      };

      const filename = 'custom-export.csv';
      const mockBlob = new Blob(['custom metrics'], { type: 'text/csv' });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: `/api/clubs/${clubId}/analytics/premium/downloads/${filename}`, filename },
      });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

      // Act
      const result = await analyticsExportService.exportCustomMetrics(
        clubId,
        metricQueries,
        options
      );

      // Assert — POST builds an ExportRequestDto (dataType derived from first query)
      expect(result).toBeInstanceOf(Blob);
      const [postUrl, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
      expect(postUrl).toBe(EXPORT_URL);
      expect(postBody).toEqual({
        dataType: 'engagement',
        format: 'csv',
        startDate: mockDateRange.startDate,
        endDate: mockDateRange.endDate,
      });
      // GET fetches the generated file as a blob
      const [getUrl, getConfig] = (apiClient.get as jest.Mock).mock.calls[0];
      expect(getUrl).toBe(DOWNLOAD_URL(filename));
      expect(getConfig).toMatchObject({ responseType: 'blob' });
    });

    it('should map members category to the segmentation dataType for excel exports', async () => {
      // Arrange
      const metricQueries = ['members'];
      const options: AnalyticsExportOptions = {
        format: 'excel',
        dateRange: mockDateRange,
        includeCategories: ['members'],
        granularity: 'weekly',
      };

      const filename = 'segmentation.xlsx';
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: `/x/${filename}`, filename },
      });
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: new Blob(['excel content'], { type: 'application/vnd.ms-excel' }),
      });

      // Act
      const result = await analyticsExportService.exportCustomMetrics(
        clubId,
        metricQueries,
        options
      );

      // Assert
      expect(result).toBeInstanceOf(Blob);
      const [, postBody] = (apiClient.post as jest.Mock).mock.calls[0];
      expect(postBody).toMatchObject({ dataType: 'segmentation', format: 'excel' });
    });

    it('should reject JSON format before making any request', async () => {
      // Arrange
      const options: AnalyticsExportOptions = {
        format: 'json',
        dateRange: mockDateRange,
        includeCategories: ['engagement'],
        granularity: 'monthly',
      };

      // Act & Assert
      await expect(
        analyticsExportService.exportCustomMetrics(clubId, ['engagement'], options)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error exportCustomMetrics:') });
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should propagate the error on API failure instead of returning a fabricated blob', async () => {
      // Arrange
      const metricQueries = ['engagement'];
      const options: AnalyticsExportOptions = {
        format: 'csv',
        dateRange: mockDateRange,
        includeCategories: ['engagement'],
        granularity: 'daily',
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        analyticsExportService.exportCustomMetrics(clubId, metricQueries, options)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error exportCustomMetrics:') });
    });

    it('should propagate the error when the file download fails', async () => {
      // Arrange
      const metricQueries = ['engagement'];
      const options: AnalyticsExportOptions = {
        format: 'csv',
        dateRange: mockDateRange,
        includeCategories: ['engagement'],
        granularity: 'monthly',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { downloadUrl: '/x/f.csv', filename: 'f.csv' },
      });
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        analyticsExportService.exportCustomMetrics(clubId, metricQueries, options)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error exportCustomMetrics:') });
    });
  });

  describe('generateEngagementCSV', () => {
    it('should generate CSV with headers', () => {
      // Act
      const csv = analyticsExportService.generateEngagementCSV(mockEngagementMetrics);

      // Assert
      expect(csv).toContain('Date,Engagement Score,Active Members');
    });

    it('should include all daily engagement data', () => {
      // Act
      const csv = analyticsExportService.generateEngagementCSV(mockEngagementMetrics);

      // Assert
      expect(csv).toContain('2024-01-01,65.2,89');
      expect(csv).toContain('2024-01-02,72.1,94');
      expect(csv).toContain('2024-01-03,68.9,91');
    });

    it('should format CSV rows correctly', () => {
      // Act
      const csv = analyticsExportService.generateEngagementCSV(mockEngagementMetrics);
      const lines = csv.split('\n');

      // Assert
      expect(lines).toHaveLength(4); // 1 header + 3 data rows
      expect(lines[0]).toBe('Date,Engagement Score,Active Members');
    });

    it('should handle empty daily engagement data', () => {
      // Arrange
      const emptyMetrics: EngagementMetrics = {
        ...mockEngagementMetrics,
        dailyEngagement: [],
      };

      // Act
      const csv = analyticsExportService.generateEngagementCSV(emptyMetrics);
      const lines = csv.split('\n');

      // Assert
      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toBe('Date,Engagement Score,Active Members');
    });
  });

  describe('generateEventAnalyticsCSV', () => {
    it('should generate CSV with event headers', () => {
      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

      // Assert
      expect(csv).toContain('Event Name,Event ID,Attendees,RSVP Count,Attendance Rate,Engagement Score');
    });

    it('should include event data', () => {
      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

      // Assert
      expect(csv).toContain('Monthly Networking');
      expect(csv).toContain('Tech Workshop');
    });

    it('should format attendance rate as percentage', () => {
      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

      // Assert
      expect(csv).toContain('86.5%');
      expect(csv).toContain('80.0%');
    });

    it('should format engagement scores correctly', () => {
      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(mockEventAnalytics);

      // Assert
      expect(csv).toContain('87.3');
      expect(csv).toContain('82.1');
    });

    it('should escape event names with commas', () => {
      // Arrange
      const dataWithCommas: EventAnalytics = {
        ...mockEventAnalytics,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Event, With Comma',
            attendees: 10,
            rsvpCount: 12,
            attendanceRate: 0.83,
            engagementScore: 75,
          },
        ],
      };

      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(dataWithCommas);

      // Assert
      expect(csv).toContain('"Event, With Comma"');
    });

    it('should escape event names with quotes', () => {
      // Arrange
      const dataWithQuotes: EventAnalytics = {
        ...mockEventAnalytics,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Event "With Quotes"',
            attendees: 10,
            rsvpCount: 12,
            attendanceRate: 0.83,
            engagementScore: 75,
          },
        ],
      };

      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(dataWithQuotes);

      // Assert
      expect(csv).toContain('"Event ""With Quotes"""');
    });

    it('should escape event names with newlines', () => {
      // Arrange
      const dataWithNewlines: EventAnalytics = {
        ...mockEventAnalytics,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Event\nWith Newline',
            attendees: 10,
            rsvpCount: 12,
            attendanceRate: 0.83,
            engagementScore: 75,
          },
        ],
      };

      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(dataWithNewlines);

      // Assert
      expect(csv).toContain('"Event\nWith Newline"');
    });

    it('should handle multiple special characters in event name', () => {
      // Arrange
      const dataWithMultipleChars: EventAnalytics = {
        ...mockEventAnalytics,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Event, "With" Multiple\nSpecial',
            attendees: 10,
            rsvpCount: 12,
            attendanceRate: 0.83,
            engagementScore: 75,
          },
        ],
      };

      // Act
      const csv = analyticsExportService.generateEventAnalyticsCSV(dataWithMultipleChars);

      // Assert
      expect(csv).toContain('"Event, ""With"" Multiple\nSpecial"');
    });
  });

  describe('generateMemberAnalyticsCSV', () => {
    it('should generate CSV with metric headers', () => {
      // Act
      const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);

      // Assert
      expect(csv).toContain('Metric,Value');
    });

    it('should include all member metrics', () => {
      // Act
      const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);

      // Assert
      expect(csv).toContain('Total Members,125');
      expect(csv).toContain('Active Members,98');
      expect(csv).toContain('New Members,15');
      expect(csv).toContain('Churned Members,3');
    });

    it('should format retention rate as percentage', () => {
      // Act
      const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);

      // Assert
      expect(csv).toContain('Retention Rate,92.0%');
    });

    it('should format growth rate as percentage', () => {
      // Act
      const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);

      // Assert
      expect(csv).toContain('Growth Rate,9.6%');
    });

    it('should generate exactly 7 lines (1 header + 6 metrics)', () => {
      // Act
      const csv = analyticsExportService.generateMemberAnalyticsCSV(mockMemberAnalytics);
      const lines = csv.split('\n');

      // Assert
      expect(lines).toHaveLength(7);
    });
  });

  describe('calculateTrends', () => {
    it('should calculate percentage change for numeric fields', () => {
      // Arrange
      const current = { members: 100, engagement: 80 };
      const previous = { members: 80, engagement: 70 };

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(trends.members).toBe(25); // (100-80)/80 * 100 = 25%
      expect(trends.engagement).toBeCloseTo(14.29, 1); // (80-70)/70 * 100
    });

    it('should handle zero values in previous period', () => {
      // Arrange
      const current = { members: 100, events: 50 };
      const previous = { members: 0, events: 0 };

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(trends.members).toBe(0);
      expect(trends.events).toBe(0);
    });

    it('should ignore non-numeric fields', () => {
      // Arrange
      const current = { members: 100, name: 'Club A', date: '2024-01-01' };
      const previous = { members: 80, name: 'Club A', date: '2023-12-01' };

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(trends.members).toBeDefined();
      expect(trends.name).toBeUndefined();
      expect(trends.date).toBeUndefined();
    });

    it('should calculate negative trends correctly', () => {
      // Arrange
      const current = { members: 80, revenue: 5000 };
      const previous = { members: 100, revenue: 8000 };

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(trends.members).toBe(-20); // (80-100)/100 * 100 = -20%
      expect(trends.revenue).toBe(-37.5); // (5000-8000)/8000 * 100 = -37.5%
    });

    it('should handle empty objects', () => {
      // Arrange
      const current = {};
      const previous = {};

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(Object.keys(trends)).toHaveLength(0);
    });

    it('should handle fields that exist in current but not previous', () => {
      // Arrange
      const current = { members: 100, newField: 50 };
      const previous = { members: 80 };

      // Act
      const trends = analyticsExportService.calculateTrends(current, previous);

      // Assert
      expect(trends.members).toBe(25);
      expect(trends.newField).toBeUndefined();
    });
  });

  describe('segmentMembers', () => {
    const mockMembers = [
      { id: 1, engagementScore: 90, lastActivityDays: 2 },
      { id: 2, engagementScore: 65, lastActivityDays: 15 },
      { id: 3, engagementScore: 35, lastActivityDays: 45 },
      { id: 4, engagementScore: 10, lastActivityDays: 60 },
      { id: 5, engagementScore: 85, lastActivityDays: 5 },
    ];

    describe('Engagement Segmentation', () => {
      it('should segment by engagement level correctly', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        // Assert
        expect(segments.high).toHaveLength(2); // 90, 85
        expect(segments.medium).toHaveLength(1); // 65
        expect(segments.low).toHaveLength(1); // 35
        expect(segments.inactive).toHaveLength(1); // 10
      });

      it('should include correct members in high engagement (>=80)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        // Assert
        expect(segments.high[0].engagementScore).toBe(90);
        expect(segments.high[1].engagementScore).toBe(85);
      });

      it('should include correct members in medium engagement (50-79)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        // Assert
        expect(segments.medium[0].engagementScore).toBe(65);
      });

      it('should include correct members in low engagement (20-49)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        // Assert
        expect(segments.low[0].engagementScore).toBe(35);
      });

      it('should include correct members in inactive (<20)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'engagement');

        // Assert
        expect(segments.inactive[0].engagementScore).toBe(10);
      });
    });

    describe('Activity Segmentation', () => {
      it('should segment by activity level correctly', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'activity');

        // Assert
        expect(segments.active).toHaveLength(2); // 2, 5 days
        expect(segments.moderate).toHaveLength(1); // 15 days
        expect(segments.inactive).toHaveLength(2); // 45, 60 days
      });

      it('should include correct members in active (<=7 days)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'activity');

        // Assert
        expect(segments.active[0].lastActivityDays).toBe(2);
        expect(segments.active[1].lastActivityDays).toBe(5);
      });

      it('should include correct members in moderate (8-30 days)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'activity');

        // Assert
        expect(segments.moderate[0].lastActivityDays).toBe(15);
      });

      it('should include correct members in inactive (>30 days)', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'activity');

        // Assert
        expect(segments.inactive[0].lastActivityDays).toBe(45);
        expect(segments.inactive[1].lastActivityDays).toBe(60);
      });
    });

    describe('Edge Cases', () => {
      it('should return all members for unknown criteria', () => {
        // Act
        const segments = analyticsExportService.segmentMembers(mockMembers, 'unknown');

        // Assert
        expect(segments.all).toHaveLength(5);
      });

      it('should handle empty member list', () => {
        // Act
        const segments = analyticsExportService.segmentMembers([], 'engagement');

        // Assert
        expect(segments.high).toHaveLength(0);
        expect(segments.medium).toHaveLength(0);
        expect(segments.low).toHaveLength(0);
        expect(segments.inactive).toHaveLength(0);
      });

      it('should handle boundary value for high engagement (exactly 80)', () => {
        // Arrange
        const members = [{ id: 1, engagementScore: 80, lastActivityDays: 5 }];

        // Act
        const segments = analyticsExportService.segmentMembers(members, 'engagement');

        // Assert
        expect(segments.high).toHaveLength(1);
      });

      it('should handle boundary value for medium engagement (exactly 50)', () => {
        // Arrange
        const members = [{ id: 1, engagementScore: 50, lastActivityDays: 5 }];

        // Act
        const segments = analyticsExportService.segmentMembers(members, 'engagement');

        // Assert
        expect(segments.medium).toHaveLength(1);
      });

      it('should handle boundary value for low engagement (exactly 20)', () => {
        // Arrange
        const members = [{ id: 1, engagementScore: 20, lastActivityDays: 5 }];

        // Act
        const segments = analyticsExportService.segmentMembers(members, 'engagement');

        // Assert
        expect(segments.low).toHaveLength(1);
      });
    });
  });
});
