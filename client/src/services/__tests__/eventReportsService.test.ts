/**
 * @jest-environment jsdom
 *
 * Event Reports Service Tests
 *
 * Tests event reporting functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, error handling)
 */

import { eventReportsService, ReportOptions } from '../eventReportsService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
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

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('EventReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;
  const mockReportOptions: ReportOptions = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    includeCharts: true,
    includeMemberDetails: true,
    format: 'pdf',
  };

  // Mock response data
  const mockReportData = {
    metadata: {
      clubId: 1,
      reportType: 'comprehensive',
      dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' },
      generatedAt: '2025-01-15T10:00:00Z',
      eventsIncluded: 10,
      totalMembers: 125,
    },
    summary: {
      totalEvents: 10,
      totalRSVPs: 200,
      totalAttendees: 180,
      averageAttendanceRate: 90,
      highestEngagementEvent: {
        id: '1',
        name: 'Monthly Gala',
        date: '2025-01-15',
        attendanceRate: 95,
      },
      overallEngagementScore: 85,
    },
    metrics: { responseRate: 90, avgDuration: 120 },
    attendanceData: [
      { date: '2025-01-15', eventName: 'Monthly Gala', rsvps: 50, attended: 48, attendanceRate: 96 },
    ],
    engagementInsights: {
      topPerformingEvents: [{ id: '1', name: 'Monthly Gala', score: 95 }],
      trends: { engagement: 12 },
      recommendations: ['Increase event frequency'],
    },
    trendData: [{ period: '2025-01', value: 85, change: 5 }],
    memberSummary: [{ memberId: 1, name: 'John Doe', eventsAttended: 8, attendanceRate: 80 }],
    recommendations: [
      {
        type: 'attendance',
        priority: 'high',
        title: 'Improve Communication',
        description: 'Send reminder emails',
        actions: ['Setup automated reminders'],
      },
    ],
  };

  describe('generateComprehensiveReport', () => {
    it('should generate comprehensive report successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: { data: mockReportData } });

      const result = await eventReportsService.generateComprehensiveReport(clubId, mockReportOptions);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/events/${clubId}/reports/comprehensive`,
        mockReportOptions
      );
      expect(result.data).toBeDefined();
    });

    it('should include report metadata', async () => {
      mockApiClient.post.mockResolvedValue({ data: { data: mockReportData } });

      const result = await eventReportsService.generateComprehensiveReport(clubId, mockReportOptions);

      expect(result.data.metadata.clubId).toBe(clubId);
      expect(result.data.metadata.reportType).toBe('comprehensive');
    });

    it('should include summary data', async () => {
      mockApiClient.post.mockResolvedValue({ data: { data: mockReportData } });

      const result = await eventReportsService.generateComprehensiveReport(clubId, mockReportOptions);

      expect(result.data.summary.totalEvents).toBe(10);
      expect(result.data.summary.averageAttendanceRate).toBe(90);
    });

    it('should propagate the error instead of fabricating report data', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      // The service must NOT silently return fabricated "sample" report data —
      // doing so would mislead admins into trusting fake figures.
      await expect(
        eventReportsService.generateComprehensiveReport(clubId, mockReportOptions)
      ).rejects.toMatchObject({
        message: expect.stringContaining('Error generateComprehensiveReport:'),
      });
    });
  });

  describe('exportAttendanceData', () => {
    it('should export attendance data as blob', async () => {
      const mockBlob = new Blob(['attendance data'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const result = await eventReportsService.exportAttendanceData(clubId, mockReportOptions);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/events/${clubId}/reports/attendance/export`,
        mockReportOptions,
        { responseType: 'blob' }
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should propagate the error instead of fabricating a blob', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        eventReportsService.exportAttendanceData(clubId, mockReportOptions)
      ).rejects.toMatchObject({
        message: expect.stringContaining('Error exportAttendanceData:'),
      });
    });

    it('should include event IDs when provided', async () => {
      const optionsWithIds = { ...mockReportOptions, eventIds: ['1', '2', '3'] };
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      await eventReportsService.exportAttendanceData(clubId, optionsWithIds);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ eventIds: ['1', '2', '3'] }),
        expect.any(Object)
      );
    });
  });

  describe('exportEngagementMetrics', () => {
    it('should export engagement metrics as blob', async () => {
      const mockBlob = new Blob(['engagement data'], { type: 'application/pdf' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const result = await eventReportsService.exportEngagementMetrics(clubId, mockReportOptions);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/events/${clubId}/reports/engagement/export`,
        mockReportOptions,
        { responseType: 'blob' }
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should propagate the error instead of fabricating a blob', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        eventReportsService.exportEngagementMetrics(clubId, mockReportOptions)
      ).rejects.toMatchObject({
        message: expect.stringContaining('Error exportEngagementMetrics:'),
      });
    });
  });

  describe('exportMemberParticipation', () => {
    it('should export member participation as blob', async () => {
      const mockBlob = new Blob(['member data'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const result = await eventReportsService.exportMemberParticipation(clubId, mockReportOptions);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/events/${clubId}/reports/members/export`,
        mockReportOptions,
        { responseType: 'blob' }
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should propagate the error instead of fabricating a blob', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        eventReportsService.exportMemberParticipation(clubId, mockReportOptions)
      ).rejects.toMatchObject({
        message: expect.stringContaining('Error exportMemberParticipation:'),
      });
    });

    it('should include member details option', async () => {
      const options = { ...mockReportOptions, includeMemberDetails: true };
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      await eventReportsService.exportMemberParticipation(clubId, options);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ includeMemberDetails: true }),
        expect.any(Object)
      );
    });
  });

  describe('service export', () => {
    it('should export eventReportsService instance', () => {
      expect(eventReportsService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof eventReportsService.generateComprehensiveReport).toBe('function');
      expect(typeof eventReportsService.exportAttendanceData).toBe('function');
      expect(typeof eventReportsService.exportEngagementMetrics).toBe('function');
      expect(typeof eventReportsService.exportMemberParticipation).toBe('function');
    });
  });
});
