/**
 * @fileoverview Integration tests for Analytics Export functionality
 * @version 1.0.0
 * 
 * Test Coverage:
 * - End-to-end export workflows for different formats
 * - Integration between services and export components
 * - File generation and download verification
 * - Performance with large datasets
 * - Error handling across service boundaries
 * - Background job processing for complex exports
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { analyticsExportService } from '../../../client/src/services/analyticsExportService';
import { analyticsService } from '../../../client/src/services/analyticsService';
import apiClient from '../../../client/src/services/apiClient';

// Mock external dependencies
jest.mock('../../../client/src/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock file download functionality
const mockDownloadLink = {
  click: jest.fn(),
  href: '',
  download: '',
  style: { display: '' },
  remove: jest.fn(),
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'a') {
      return mockDownloadLink;
    }
    return document.createElement(tagName);
  }),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
  writable: true,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Analytics Export Integration Tests', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  const TEST_CLUB_ID = 123;
  const TEST_DATE_RANGE = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  const mockEngagementData = {
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
    dailyEngagement: Array.from({ length: 31 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      score: 60 + Math.random() * 30,
      activeMembers: 80 + Math.floor(Math.random() * 40),
    })),
  };

  const mockEventData = {
    totalEvents: 24,
    averageAttendance: 32.5,
    attendanceRate: 0.78,
    mostPopularEvents: Array.from({ length: 10 }, (_, i) => ({
      eventId: String(i + 1),
      eventName: `Event ${i + 1}`,
      attendees: 20 + Math.floor(Math.random() * 30),
      rsvpCount: 25 + Math.floor(Math.random() * 35),
      attendanceRate: 0.7 + Math.random() * 0.3,
      engagementScore: 70 + Math.random() * 25,
    })),
    eventTypeAnalysis: {
      'Networking': { count: 8, averageAttendance: 35.2, averageEngagement: 75.4 },
      'Workshop': { count: 6, averageAttendance: 22.8, averageEngagement: 82.1 },
      'Social': { count: 10, averageAttendance: 28.5, averageEngagement: 68.9 },
    },
    timeSlotAnalysis: {
      'Morning': { eventCount: 8, averageAttendance: 18.5 },
      'Afternoon': { eventCount: 6, averageAttendance: 25.2 },
      'Evening': { eventCount: 10, averageAttendance: 42.8 },
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });

    jest.clearAllMocks();

    // Setup default successful API responses
    mockApiClient.get.mockResolvedValue({ data: mockEngagementData });
    mockApiClient.post.mockResolvedValue({ 
      data: new Blob(['test,data\n1,2'], { type: 'text/csv' })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    queryClient.clear();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('CSV Export Integration', () => {
    it('should export engagement analytics as CSV successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagementData });

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEngagementCSV(engagementData);

      expect(csvContent).toContain('Date,Engagement Score,Active Members');
      expect(csvContent.split('\n')).toHaveLength(32); // Header + 31 days
      
      // Verify data integrity
      const lines = csvContent.split('\n');
      expect(lines[1]).toMatch(/^2024-01-01,\d+(\.\d+)?,\d+$/);
      expect(lines[31]).toMatch(/^2024-01-31,\d+(\.\d+)?,\d+$/);
    });

    it('should export event analytics as CSV with proper formatting', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEventData });

      const eventData = await analyticsExportService.getEventAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEventAnalyticsCSV(eventData);

      expect(csvContent).toContain('Event Name,Event ID,Attendees,RSVP Count,Attendance Rate,Engagement Score');
      
      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(11); // Header + 10 events
      
      // Verify percentage formatting
      lines.slice(1).forEach(line => {
        if (line.trim()) {
          expect(line).toMatch(/\d+\.\d%/); // Should contain percentage
        }
      });
    });

    it('should handle large datasets efficiently in CSV export', async () => {
      const largeEngagementData = {
        ...mockEngagementData,
        dailyEngagement: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          score: 60 + Math.random() * 30,
          activeMembers: 80 + Math.floor(Math.random() * 40),
        })),
      };

      mockApiClient.get.mockResolvedValue({ data: largeEngagementData });

      const startTime = performance.now();
      
      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEngagementCSV(engagementData);
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete in <500ms
      expect(csvContent.split('\n')).toHaveLength(366); // Header + 365 days
    });

    it('should handle special characters in CSV export correctly', async () => {
      const specialCharData = {
        ...mockEventData,
        mostPopularEvents: [
          {
            eventId: '1',
            eventName: 'Event with "quotes" and, commas',
            attendees: 45,
            rsvpCount: 52,
            attendanceRate: 0.865,
            engagementScore: 87.3,
          },
          {
            eventId: '2',
            eventName: 'Event with\nnewlines',
            attendees: 28,
            rsvpCount: 35,
            attendanceRate: 0.8,
            engagementScore: 82.1,
          },
        ],
      };

      mockApiClient.get.mockResolvedValue({ data: specialCharData });

      const eventData = await analyticsExportService.getEventAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEventAnalyticsCSV(eventData);

      expect(csvContent).toContain('"Event with ""quotes"" and, commas"');
      expect(csvContent).toContain('"Event with\nnewlines"');
    });
  });

  describe('Complex Export Workflows', () => {
    it('should handle background processing for complex exports', async () => {
      const complexExportOptions = {
        format: 'excel' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement', 'events', 'members', 'growth'] as const,
        granularity: 'daily' as const,
        includePredictions: true,
        includeSegmentation: true,
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { jobId: 'complex-export-job-123' }
      });

      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        complexExportOptions
      );

      expect(result).toEqual({ jobId: 'complex-export-job-123' });
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${TEST_CLUB_ID}/analytics/export/async`,
        complexExportOptions
      );
    });

    it('should handle multi-category data aggregation', async () => {
      // Mock responses for different data types
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockEngagementData })
        .mockResolvedValueOnce({ data: mockEventData })
        .mockResolvedValueOnce({ data: {
          totalMembers: 125,
          activeMembers: 98,
          newMembers: 15,
          churnedMembers: 3,
          retentionRate: 0.92,
          growthRate: 0.096,
          membersByType: { 'Premium': 45, 'Basic': 65, 'Trial': 15 },
          engagementDistribution: { high: 28, medium: 52, low: 35, inactive: 10 },
          cohortAnalysis: [],
        }});

      const [engagementData, eventData, memberData] = await Promise.all([
        analyticsExportService.getEngagementAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getEventAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getMemberAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
      ]);

      expect(engagementData.totalEngagementScore).toBe(8542.5);
      expect(eventData.totalEvents).toBe(24);
      expect(memberData.totalMembers).toBe(125);

      // All requests should have been made
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should handle PDF export with background processing', async () => {
      const pdfExportOptions = {
        format: 'pdf' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement'] as const,
        granularity: 'weekly' as const,
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { jobId: 'pdf-export-job-456' }
      });

      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        pdfExportOptions
      );

      expect(result).toEqual({ jobId: 'pdf-export-job-456' });
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${TEST_CLUB_ID}/analytics/export/async`,
        pdfExportOptions
      );
    });

    it('should handle JSON export for API consumption', async () => {
      const jsonExportOptions = {
        format: 'json' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement', 'events'] as const,
        granularity: 'daily' as const,
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { jobId: 'json-export-job-789' }
      });

      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        jsonExportOptions
      );

      expect(result).toEqual({ jobId: 'json-export-job-789' });
    });
  });

  describe('Custom Metrics Export Integration', () => {
    it('should export custom metrics with proper query handling', async () => {
      const customQueries = [
        'SELECT engagement_score FROM daily_metrics WHERE date_range = ?',
        'SELECT event_attendance FROM events WHERE category = ?',
      ];

      const expectedBlob = new Blob(['custom,data\n85.5,42'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: expectedBlob });

      const result = await analyticsExportService.exportCustomMetrics(
        TEST_CLUB_ID,
        customQueries,
        {
          format: 'csv',
          dateRange: TEST_DATE_RANGE,
          includeCategories: ['engagement'],
          granularity: 'daily',
        }
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${TEST_CLUB_ID}/analytics/custom/export`,
        {
          queries: customQueries,
          format: 'csv',
          dateRange: TEST_DATE_RANGE,
          includeCategories: ['engagement'],
          granularity: 'daily',
        },
        { responseType: 'blob' }
      );
    });

    it('should handle complex aggregation queries', async () => {
      const aggregationQueries = [
        'GROUP BY member_type WITH ROLLUP engagement_metrics',
        'PIVOT attendance_by_month FOR event_types',
        'WINDOW FUNCTION trend_analysis OVER (ORDER BY date)',
      ];

      const mockBlob = new Blob(['aggregated,data\n100,200,150'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const result = await analyticsExportService.exportCustomMetrics(
        TEST_CLUB_ID,
        aggregationQueries,
        {
          format: 'csv',
          dateRange: TEST_DATE_RANGE,
          includeCategories: ['engagement', 'events'],
          granularity: 'monthly',
        }
      );

      expect(result).toBeInstanceOf(Blob);
      
      // Verify blob content
      const text = await result.text();
      expect(text).toContain('aggregated,data');
      expect(text).toContain('100,200,150');
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle API failures with fallback data', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API temporarily unavailable'));

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      // Should return mock data instead of failing
      expect(engagementData).toBeDefined();
      expect(engagementData.totalEngagementScore).toBeGreaterThan(0);
      expect(engagementData.topEngagedMembers).toHaveLength(2);
    });

    it('should handle partial data failures gracefully', async () => {
      // First call succeeds, second fails, third succeeds
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockEngagementData })
        .mockRejectedValueOnce(new Error('Event data unavailable'))
        .mockResolvedValueOnce({ data: {
          totalMembers: 125,
          activeMembers: 98,
          newMembers: 15,
          churnedMembers: 3,
          retentionRate: 0.92,
          growthRate: 0.096,
          membersByType: {},
          engagementDistribution: { high: 0, medium: 0, low: 0, inactive: 0 },
          cohortAnalysis: [],
        }});

      const results = await Promise.allSettled([
        analyticsExportService.getEngagementAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getEventAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getMemberAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled'); // Should use fallback
      expect(results[2].status).toBe('fulfilled');

      // All should have valid data
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        }
      });
    });

    it('should handle timeout errors with appropriate fallbacks', async () => {
      mockApiClient.get.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const startTime = performance.now();
      
      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );
      
      const endTime = performance.now();

      // Should not take too long due to fallback
      expect(endTime - startTime).toBeLessThan(5000);
      expect(engagementData).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      mockApiClient.get.mockResolvedValue({ data: 'invalid-json-response' });

      const result = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      // Should fallback to mock data
      expect(result).toBeDefined();
      expect(typeof result.totalEngagementScore).toBe('number');
    });

    it('should handle network connectivity issues', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      const exportOptions = {
        format: 'csv' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement'] as const,
        granularity: 'daily' as const,
      };

      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        exportOptions
      );

      // Should return fallback blob
      expect(result).toBeInstanceOf(Blob);
      
      const text = await (result as Blob).text();
      expect(text).toContain('Date,Engagement Score,Active Members');
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle concurrent export requests efficiently', async () => {
      const mockBlob = new Blob(['concurrent,test\n1,2'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const exportOptions = {
        format: 'csv' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement'] as const,
        granularity: 'daily' as const,
      };

      const startTime = performance.now();

      // Fire 5 concurrent export requests
      const exportPromises = Array.from({ length: 5 }, () =>
        analyticsExportService.exportAnalyticsData(TEST_CLUB_ID, exportOptions)
      );

      const results = await Promise.all(exportPromises);

      const endTime = performance.now();

      // All should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Blob);
      });

      // Should complete in reasonable time (not 5x slower)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should handle very large dataset exports without memory issues', async () => {
      const largeDataset = {
        dailyEngagement: Array.from({ length: 10000 }, (_, i) => ({
          date: new Date(2020, 0, i + 1).toISOString().split('T')[0],
          score: Math.random() * 100,
          activeMembers: Math.floor(Math.random() * 200) + 50,
        })),
        totalEngagementScore: 500000,
        averageEngagementScore: 75,
        engagementTrend: 5.5,
        topEngagedMembers: [],
        engagementBySegment: {},
      };

      mockApiClient.get.mockResolvedValue({ data: largeDataset });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEngagementCSV(engagementData);

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(engagementData.dailyEngagement).toHaveLength(10000);
      expect(csvContent.split('\n')).toHaveLength(10001); // Header + 10000 rows
      
      // Memory increase should be reasonable (less than 100MB)
      if (memoryIncrease > 0) {
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      }
    });

    it('should optimize repeated data requests with caching behavior', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagementData });

      // Make the same request multiple times
      const requests = await Promise.all([
        analyticsExportService.getEngagementAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getEngagementAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
        analyticsExportService.getEngagementAnalytics(TEST_CLUB_ID, TEST_DATE_RANGE),
      ]);

      // All should succeed with same data
      requests.forEach(result => {
        expect(result.totalEngagementScore).toBe(8542.5);
      });

      // Should have made actual API calls (caching is at React Query level)
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain data consistency across multiple export formats', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagementData });

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      // Generate CSV
      const csvContent = analyticsExportService.generateEngagementCSV(engagementData);
      const csvLines = csvContent.split('\n').slice(1); // Remove header

      // Check data consistency
      const firstDataRow = csvLines[0].split(',');
      const correspondingDataPoint = engagementData.dailyEngagement[0];

      expect(firstDataRow[0]).toBe(correspondingDataPoint.date);
      expect(parseFloat(firstDataRow[1])).toBe(correspondingDataPoint.score);
      expect(parseInt(firstDataRow[2])).toBe(correspondingDataPoint.activeMembers);
    });

    it('should handle edge cases in data formatting', async () => {
      const edgeCaseData = {
        ...mockEngagementData,
        dailyEngagement: [
          { date: '2024-01-01', score: 0, activeMembers: 0 },
          { date: '2024-01-02', score: 100, activeMembers: 1000 },
          { date: '2024-01-03', score: 0.123456789, activeMembers: 1 },
        ],
      };

      mockApiClient.get.mockResolvedValue({ data: edgeCaseData });

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      const csvContent = analyticsExportService.generateEngagementCSV(engagementData);
      const lines = csvContent.split('\n');

      expect(lines[1]).toBe('2024-01-01,0,0');
      expect(lines[2]).toBe('2024-01-02,100,1000');
      expect(lines[3]).toBe('2024-01-03,0.123456789,1');
    });

    it('should validate exported data completeness', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagementData });

      const engagementData = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      // Verify all expected fields are present
      expect(engagementData).toHaveProperty('totalEngagementScore');
      expect(engagementData).toHaveProperty('averageEngagementScore');
      expect(engagementData).toHaveProperty('engagementTrend');
      expect(engagementData).toHaveProperty('topEngagedMembers');
      expect(engagementData).toHaveProperty('engagementBySegment');
      expect(engagementData).toHaveProperty('dailyEngagement');

      // Verify data types
      expect(typeof engagementData.totalEngagementScore).toBe('number');
      expect(Array.isArray(engagementData.topEngagedMembers)).toBe(true);
      expect(Array.isArray(engagementData.dailyEngagement)).toBe(true);
    });
  });

  describe('User Experience Integration', () => {
    it('should provide appropriate feedback for long-running exports', async () => {
      const slowExportOptions = {
        format: 'excel' as const,
        dateRange: TEST_DATE_RANGE,
        includeCategories: ['engagement', 'events', 'members', 'growth'] as const,
        granularity: 'daily' as const,
        includePredictions: true,
        includeSegmentation: true,
      };

      // Simulate slow response
      mockApiClient.post.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { jobId: 'slow-job-123' } }), 1000)
        )
      );

      const startTime = performance.now();
      
      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        slowExportOptions
      );

      const endTime = performance.now();

      expect(result).toEqual({ jobId: 'slow-job-123' });
      expect(endTime - startTime).toBeGreaterThan(1000); // Should have taken time
    });

    it('should handle file download simulation correctly', async () => {
      const mockBlob = new Blob(['test,data\n1,2'], { type: 'text/csv' });
      mockApiClient.post.mockResolvedValue({ data: mockBlob });

      const result = await analyticsExportService.exportAnalyticsData(
        TEST_CLUB_ID,
        {
          format: 'csv',
          dateRange: TEST_DATE_RANGE,
          includeCategories: ['engagement'],
          granularity: 'daily',
        }
      );

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
      
      // Verify blob content
      const text = await result.text();
      expect(text).toBe('test,data\n1,2');
    });
  });

  describe('Security and Privacy Integration', () => {
    it('should handle authentication errors appropriately', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } }
      });

      const result = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      // Should fallback gracefully without exposing auth errors
      expect(result).toBeDefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching engagement analytics:',
        expect.any(Object)
      );
    });

    it('should handle permission-based data filtering', async () => {
      const restrictedData = {
        ...mockEngagementData,
        topEngagedMembers: [], // PII restricted
        engagementBySegment: {}, // Detailed segmentation restricted
      };

      mockApiClient.get.mockResolvedValue({ data: restrictedData });

      const result = await analyticsExportService.getEngagementAnalytics(
        TEST_CLUB_ID,
        TEST_DATE_RANGE
      );

      expect(result.topEngagedMembers).toHaveLength(0);
      expect(Object.keys(result.engagementBySegment)).toHaveLength(0);
      expect(result.dailyEngagement).toBeDefined(); // Aggregated data still available
    });
  });
});