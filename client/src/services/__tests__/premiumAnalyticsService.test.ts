/**
 * @jest-environment jsdom
 *
 * Premium Analytics Service Tests
 *
 * Comprehensive test suite for premium analytics functionality.
 * Tests follow apiClient mock pattern - mock only HTTP boundary, test real service logic.
 *
 * Coverage:
 * - getEngagementTrends: success, error handling (403, 400, network), data validation
 * - getCohortAnalysis: success, error handling, retention rates, churn metrics
 * - getFinancialROI: success, error handling, financial metrics, trend analysis
 * - compareEvents: success, error handling (400, 403), event metrics, multiple events
 * - getMemberSegmentation: default criteria, custom criteria, error handling
 * - exportData: all formats, all data types, error handling (403, 413), download URLs
 * - getRealTimeMetrics: success, alerts, active users, error handling
 * - getPredictiveAnalytics: default/custom horizon, error handling (422), predictions, factors
 * - getGoalTracking: success, goal progress, status tracking, error handling
 * - getPerformanceBenchmarks: with/without industry, benchmark status, error handling
 * - getAutomatedInsights: all analysis types, action items, error handling
 * - getDataQuality: quality scores, issues, error handling
 * - saveDashboardConfig: success, widget configuration, error handling
 * - loadDashboardConfig: with/without configId, error handling
 */

import apiClient from '../apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import premiumAnalyticsService, {
  AnalyticsDateRange,
  EngagementTrendData,
  CohortData,
  ROIData,
  EventComparisonData,
  MemberSegmentData,
} from '../premiumAnalyticsService';

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

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn(),
  },
}));

describe('PremiumAnalyticsService', () => {
  const clubId = 1;
  const mockDateRange: AnalyticsDateRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-throw errors by default for proper error handling tests
    (ErrorHandler.handleApiError as jest.Mock).mockImplementation((error) => {
      throw error;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mock response data
  const mockEngagementTrends: EngagementTrendData[] = [
    {
      period: '2025-01-01',
      memberEngagement: 85,
      eventAttendance: 72,
      communicationActivity: 90,
      profileUpdates: 45,
      averageScore: 73,
    },
    {
      period: '2025-01-15',
      memberEngagement: 88,
      eventAttendance: 75,
      communicationActivity: 92,
      profileUpdates: 48,
      averageScore: 75.75,
    },
  ];

  const mockCohortData: CohortData[] = [
    {
      cohort: '2024-Q4',
      totalMembers: 150,
      retentionRates: { '1m': 95, '3m': 88, '6m': 75 },
      churnRate: 12,
      averageLifetime: 18.5,
    },
    {
      cohort: '2024-Q3',
      totalMembers: 120,
      retentionRates: { '1m': 92, '3m': 85, '6m': 72 },
      churnRate: 15,
      averageLifetime: 16.2,
    },
  ];

  const mockROIData: ROIData[] = [
    {
      period: '2025-01',
      revenue: 10000,
      costs: 3000,
      profit: 7000,
      roi: 233,
      trend: 'up',
    },
    {
      period: '2024-12',
      revenue: 8000,
      costs: 3500,
      profit: 4500,
      roi: 128,
      trend: 'stable',
    },
  ];

  const mockEventComparison: EventComparisonData[] = [
    {
      eventId: 1,
      eventName: 'Annual Gala',
      attendance: 120,
      engagementScore: 88,
      revenue: 5000,
      costs: 1500,
      roi: 233,
      date: '2025-01-15',
    },
    {
      eventId: 2,
      eventName: 'Monthly Mixer',
      attendance: 45,
      engagementScore: 72,
      revenue: 1200,
      costs: 400,
      roi: 200,
      date: '2025-01-20',
    },
  ];

  const mockSegmentData: MemberSegmentData[] = [
    {
      segment: 'High Engagers',
      count: 50,
      engagementLevel: 'high',
      averageRevenue: 250,
      churnRisk: 5,
    },
    {
      segment: 'Medium Engagers',
      count: 75,
      engagementLevel: 'medium',
      averageRevenue: 150,
      churnRisk: 15,
    },
    {
      segment: 'Low Engagers',
      count: 30,
      engagementLevel: 'low',
      averageRevenue: 50,
      churnRisk: 40,
    },
  ];

  const mockRealTimeMetrics = {
    timestamp: new Date('2025-01-18T12:00:00Z'),
    activeUsers: 42,
    liveEvents: 3,
    recentEngagement: 85,
    alerts: [
      {
        id: 'alert-1',
        type: 'info' as const,
        title: 'New milestone',
        message: 'Club reached 500 members!',
        timestamp: new Date('2025-01-18T11:30:00Z'),
      },
      {
        id: 'alert-2',
        type: 'warning' as const,
        title: 'Low engagement',
        message: 'Event attendance is below average',
        timestamp: new Date('2025-01-18T11:45:00Z'),
      },
    ],
  };

  const mockPredictions = {
    predictions: [
      {
        date: '2025-02-01',
        predicted: 90,
        confidence: 85,
        upperBound: 95,
        lowerBound: 85,
      },
      {
        date: '2025-02-15',
        predicted: 92,
        confidence: 83,
        upperBound: 97,
        lowerBound: 87,
      },
    ],
    accuracy: 92,
    method: 'ARIMA',
    factors: [
      { name: 'Seasonality', impact: 0.3, confidence: 90 },
      { name: 'Event Frequency', impact: 0.25, confidence: 85 },
      { name: 'Member Growth', impact: 0.2, confidence: 88 },
    ],
  };

  const mockGoals = [
    {
      id: 'goal-1',
      name: 'Membership Growth',
      target: 500,
      current: 450,
      progress: 90,
      deadline: new Date('2025-12-31'),
      status: 'on_track' as const,
    },
    {
      id: 'goal-2',
      name: 'Event Attendance',
      target: 100,
      current: 75,
      progress: 75,
      deadline: new Date('2025-06-30'),
      status: 'at_risk' as const,
    },
  ];

  const mockBenchmarks = [
    {
      metric: 'Member Retention',
      current: 88,
      target: 90,
      industry: 82,
      best: 95,
      status: 'good' as const,
    },
    {
      metric: 'Event Attendance Rate',
      current: 72,
      target: 80,
      industry: 75,
      best: 90,
      status: 'average' as const,
    },
  ];

  const mockInsights = [
    {
      type: 'recommendation' as const,
      title: 'Increase Event Frequency',
      description: 'Data suggests more events could improve engagement',
      impact: 'high' as const,
      confidence: 85,
      actionItems: ['Schedule monthly events', 'Survey members for preferences'],
      dataPoints: { currentEvents: 3, recommendedEvents: 5 },
      visualizations: ['event_frequency_chart', 'engagement_correlation'],
    },
    {
      type: 'trend' as const,
      title: 'Growing Member Engagement',
      description: 'Engagement has increased 15% over the past month',
      impact: 'medium' as const,
      confidence: 92,
      actionItems: ['Continue current strategies', 'Analyze successful tactics'],
      dataPoints: { previousScore: 65, currentScore: 75 },
    },
  ];

  const mockDataQuality = {
    completeness: 95,
    accuracy: 92,
    timeliness: 88,
    consistency: 90,
    overall: 91,
    issues: [
      {
        type: 'missing_data',
        severity: 'low' as const,
        description: 'Some members missing phone numbers',
        affectedRecords: 15,
      },
      {
        type: 'outdated_data',
        severity: 'medium' as const,
        description: 'Last sync was 48 hours ago',
        affectedRecords: 50,
      },
    ],
    lastUpdated: new Date('2025-01-18T10:00:00Z'),
  };

  const mockDashboardConfig = {
    name: 'Executive Dashboard',
    widgets: [
      {
        type: 'engagement_chart',
        position: { x: 0, y: 0, width: 6, height: 4 },
        settings: { timeRange: '30d', chartType: 'line' },
      },
      {
        type: 'roi_tracker',
        position: { x: 6, y: 0, width: 6, height: 4 },
        settings: { showPredictions: true },
      },
    ],
    filters: { dateRange: '30d', segmentType: 'all' },
    refreshInterval: 300,
  };

  describe('getEngagementTrends', () => {
    it('should fetch engagement trends successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementTrends });

      const result = await premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/engagement-trends`,
        { params: { startDate: '2025-01-01', endDate: '2025-01-31' } }
      );
      expect(result).toEqual(mockEngagementTrends);
      expect(result).toHaveLength(2);
    });

    it('should return engagement metrics with correct values', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementTrends });

      const result = await premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange);

      expect(result[0].memberEngagement).toBe(85);
      expect(result[0].eventAttendance).toBe(72);
      expect(result[0].communicationActivity).toBe(90);
      expect(result[0].averageScore).toBe(73);
    });

    it('should handle multiple periods correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEngagementTrends });

      const result = await premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange);

      expect(result[0].period).toBe('2025-01-01');
      expect(result[1].period).toBe('2025-01-15');
      expect(result[1].averageScore).toBe(75.75);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange)
      ).rejects.toEqual(error);
    });

    it('should throw error on invalid date range (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid date range' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange)
      ).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getEngagementTrends(clubId, mockDateRange)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getCohortAnalysis', () => {
    it('should fetch cohort analysis successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortData });

      const result = await premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/cohorts`,
        { params: { startDate: '2025-01-01', endDate: '2025-01-31' } }
      );
      expect(result).toEqual(mockCohortData);
      expect(result).toHaveLength(2);
    });

    it('should return retention rates correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortData });

      const result = await premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange);

      expect(result[0].retentionRates['1m']).toBe(95);
      expect(result[0].retentionRates['3m']).toBe(88);
      expect(result[0].retentionRates['6m']).toBe(75);
    });

    it('should return churn metrics correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortData });

      const result = await premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange);

      expect(result[0].churnRate).toBe(12);
      expect(result[0].averageLifetime).toBe(18.5);
      expect(result[1].churnRate).toBe(15);
      expect(result[1].averageLifetime).toBe(16.2);
    });

    it('should handle multiple cohorts', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortData });

      const result = await premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange);

      expect(result[0].cohort).toBe('2024-Q4');
      expect(result[0].totalMembers).toBe(150);
      expect(result[1].cohort).toBe('2024-Q3');
      expect(result[1].totalMembers).toBe(120);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange)
      ).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getCohortAnalysis(clubId, mockDateRange)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getFinancialROI', () => {
    it('should fetch ROI data successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockROIData });

      const result = await premiumAnalyticsService.getFinancialROI(clubId, mockDateRange);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/roi`,
        { params: { startDate: '2025-01-01', endDate: '2025-01-31' } }
      );
      expect(result).toEqual(mockROIData);
      expect(result).toHaveLength(2);
    });

    it('should return financial metrics correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockROIData });

      const result = await premiumAnalyticsService.getFinancialROI(clubId, mockDateRange);

      expect(result[0].revenue).toBe(10000);
      expect(result[0].costs).toBe(3000);
      expect(result[0].profit).toBe(7000);
      expect(result[0].roi).toBe(233);
    });

    it('should return trend analysis correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockROIData });

      const result = await premiumAnalyticsService.getFinancialROI(clubId, mockDateRange);

      expect(result[0].trend).toBe('up');
      expect(result[1].trend).toBe('stable');
    });

    it('should handle multiple periods with different trends', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockROIData });

      const result = await premiumAnalyticsService.getFinancialROI(clubId, mockDateRange);

      expect(result[0].period).toBe('2025-01');
      expect(result[1].period).toBe('2024-12');
      expect(result[0].roi).toBeGreaterThan(result[1].roi);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getFinancialROI(clubId, mockDateRange)).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getFinancialROI(clubId, mockDateRange)).rejects.toThrow('Network error');
    });
  });

  describe('compareEvents', () => {
    it('should compare events successfully', async () => {
      const eventIds = [1, 2, 3];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockEventComparison });

      const result = await premiumAnalyticsService.compareEvents(clubId, eventIds);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/events/compare`,
        { eventIds }
      );
      expect(result).toEqual(mockEventComparison);
      expect(result).toHaveLength(2);
    });

    it('should return event comparison metrics', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockEventComparison });

      const result = await premiumAnalyticsService.compareEvents(clubId, [1, 2]);

      expect(result[0].eventName).toBe('Annual Gala');
      expect(result[0].attendance).toBe(120);
      expect(result[0].engagementScore).toBe(88);
      expect(result[0].roi).toBe(233);
    });

    it('should compare multiple events with different metrics', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockEventComparison });

      const result = await premiumAnalyticsService.compareEvents(clubId, [1, 2]);

      expect(result[0].attendance).toBeGreaterThan(result[1].attendance);
      expect(result[0].revenue).toBeGreaterThan(result[1].revenue);
    });

    it('should handle single event comparison', async () => {
      const singleEvent = [mockEventComparison[0]];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: singleEvent });

      const result = await premiumAnalyticsService.compareEvents(clubId, [1]);

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe(1);
    });

    it('should throw error on invalid events (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid event IDs' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.compareEvents(clubId, [])).rejects.toEqual(error);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.compareEvents(clubId, [1])).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.compareEvents(clubId, [1])).rejects.toThrow('Network error');
    });
  });

  describe('getMemberSegmentation', () => {
    it('should fetch segmentation with default criteria (empty array)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      const result = await premiumAnalyticsService.getMemberSegmentation(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/segmentation`,
        { params: { criteria: '' } }
      );
      expect(result).toEqual(mockSegmentData);
      expect(result).toHaveLength(3);
    });

    it('should fetch segmentation with custom criteria', async () => {
      const criteria = ['engagement', 'revenue', 'activity'];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      const result = await premiumAnalyticsService.getMemberSegmentation(clubId, criteria);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/segmentation`,
        { params: { criteria: 'engagement,revenue,activity' } }
      );
      expect(result).toEqual(mockSegmentData);
    });

    it('should return segment metrics correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      const result = await premiumAnalyticsService.getMemberSegmentation(clubId);

      expect(result[0].segment).toBe('High Engagers');
      expect(result[0].engagementLevel).toBe('high');
      expect(result[0].count).toBe(50);
      expect(result[0].churnRisk).toBe(5);
    });

    it('should handle all engagement levels', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      const result = await premiumAnalyticsService.getMemberSegmentation(clubId);

      expect(result[0].engagementLevel).toBe('high');
      expect(result[1].engagementLevel).toBe('medium');
      expect(result[2].engagementLevel).toBe('low');
    });

    it('should return churn risk correlation with engagement', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      const result = await premiumAnalyticsService.getMemberSegmentation(clubId);

      // Higher engagement should correlate with lower churn risk
      expect(result[0].churnRisk).toBeLessThan(result[1].churnRisk);
      expect(result[1].churnRisk).toBeLessThan(result[2].churnRisk);
    });

    it('should handle single criterion', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSegmentData });

      await premiumAnalyticsService.getMemberSegmentation(clubId, ['engagement']);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/segmentation`,
        { params: { criteria: 'engagement' } }
      );
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getMemberSegmentation(clubId)).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getMemberSegmentation(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('exportData', () => {
    const mockExportResponse = {
      downloadUrl: 'https://export.example.com/data.csv',
      filename: 'analytics_export_2025-01-18.csv',
    };

    it('should export engagement data as CSV', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockExportResponse });

      const result = await premiumAnalyticsService.exportData(
        clubId,
        'engagement',
        'csv',
        mockDateRange
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/export`,
        {
          dataType: 'engagement',
          format: 'csv',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        }
      );
      expect(result).toEqual(mockExportResponse);
      expect(result.downloadUrl).toContain('https://');
    });

    it('should export cohorts data as PDF', async () => {
      const pdfResponse = {
        ...mockExportResponse,
        filename: 'cohorts_2025-01-18.pdf',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: pdfResponse });

      const result = await premiumAnalyticsService.exportData(clubId, 'cohorts', 'pdf', mockDateRange);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/export`,
        expect.objectContaining({ dataType: 'cohorts', format: 'pdf' })
      );
      expect(result.filename).toContain('.pdf');
    });

    it('should export ROI data as Excel', async () => {
      const excelResponse = {
        ...mockExportResponse,
        filename: 'roi_2025-01-18.xlsx',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: excelResponse });

      const result = await premiumAnalyticsService.exportData(clubId, 'roi', 'excel', mockDateRange);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/export`,
        expect.objectContaining({ dataType: 'roi', format: 'excel' })
      );
      expect(result.filename).toContain('.xlsx');
    });

    it('should export events data as JSON', async () => {
      const jsonResponse = {
        ...mockExportResponse,
        filename: 'events_2025-01-18.json',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: jsonResponse });

      const result = await premiumAnalyticsService.exportData(clubId, 'events', 'json', mockDateRange);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/export`,
        expect.objectContaining({ dataType: 'events', format: 'json' })
      );
      expect(result.filename).toContain('.json');
    });

    it('should export segmentation data', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockExportResponse });

      await premiumAnalyticsService.exportData(clubId, 'segmentation', 'csv', mockDateRange);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/export`,
        expect.objectContaining({ dataType: 'segmentation' })
      );
    });

    it('should return download URL and filename', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockExportResponse });

      const result = await premiumAnalyticsService.exportData(
        clubId,
        'engagement',
        'csv',
        mockDateRange
      );

      expect(result.downloadUrl).toBe('https://export.example.com/data.csv');
      expect(result.filename).toBe('analytics_export_2025-01-18.csv');
    });

    it('should throw error on large date range (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload too large' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.exportData(clubId, 'engagement', 'csv', mockDateRange)
      ).rejects.toEqual(error);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.exportData(clubId, 'engagement', 'csv', mockDateRange)
      ).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.exportData(clubId, 'engagement', 'csv', mockDateRange)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should fetch real-time metrics successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await premiumAnalyticsService.getRealTimeMetrics(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/realtime`
      );
      expect(result).toEqual(mockRealTimeMetrics);
      expect(result.activeUsers).toBe(42);
      expect(result.liveEvents).toBe(3);
    });

    it('should return current activity metrics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await premiumAnalyticsService.getRealTimeMetrics(clubId);

      expect(result.recentEngagement).toBe(85);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return alerts with different types', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await premiumAnalyticsService.getRealTimeMetrics(clubId);

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts[0].type).toBe('info');
      expect(result.alerts[1].type).toBe('warning');
    });

    it('should return alert details', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await premiumAnalyticsService.getRealTimeMetrics(clubId);

      expect(result.alerts[0].title).toBe('New milestone');
      expect(result.alerts[0].message).toContain('500 members');
      expect(result.alerts[0].id).toBe('alert-1');
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getRealTimeMetrics(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getPredictiveAnalytics', () => {
    it('should fetch predictions with default horizon (30 days)', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      const result = await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement');

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/predictions`,
        { metric: 'engagement', horizon: 30 }
      );
      expect(result).toEqual(mockPredictions);
    });

    it('should fetch predictions with custom horizon', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'retention', 60);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/predictions`,
        { metric: 'retention', horizon: 60 }
      );
    });

    it('should return prediction data with confidence intervals', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      const result = await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'revenue');

      expect(result.predictions[0].predicted).toBe(90);
      expect(result.predictions[0].confidence).toBe(85);
      expect(result.predictions[0].upperBound).toBe(95);
      expect(result.predictions[0].lowerBound).toBe(85);
    });

    it('should return model accuracy and method', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      const result = await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement');

      expect(result.accuracy).toBe(92);
      expect(result.method).toBe('ARIMA');
    });

    it('should return influencing factors', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      const result = await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement');

      expect(result.factors).toHaveLength(3);
      expect(result.factors[0].name).toBe('Seasonality');
      expect(result.factors[0].impact).toBe(0.3);
      expect(result.factors[0].confidence).toBe(90);
    });

    it('should handle multiple prediction points', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockPredictions });

      const result = await premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement');

      expect(result.predictions).toHaveLength(2);
      expect(result.predictions[1].date).toBe('2025-02-15');
    });

    it('should throw error on insufficient data (422)', async () => {
      const error = { response: { status: 422, data: { message: 'Insufficient data' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement')
      ).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.getPredictiveAnalytics(clubId, 'engagement')
      ).rejects.toThrow('Network error');
    });
  });

  describe('getGoalTracking', () => {
    it('should fetch goals successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGoals });

      const result = await premiumAnalyticsService.getGoalTracking(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/goals`
      );
      expect(result).toEqual(mockGoals);
      expect(result).toHaveLength(2);
    });

    it('should return goal progress correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGoals });

      const result = await premiumAnalyticsService.getGoalTracking(clubId);

      expect(result[0].name).toBe('Membership Growth');
      expect(result[0].target).toBe(500);
      expect(result[0].current).toBe(450);
      expect(result[0].progress).toBe(90);
    });

    it('should return goal status', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGoals });

      const result = await premiumAnalyticsService.getGoalTracking(clubId);

      expect(result[0].status).toBe('on_track');
      expect(result[1].status).toBe('at_risk');
    });

    it('should return goal deadlines', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockGoals });

      const result = await premiumAnalyticsService.getGoalTracking(clubId);

      expect(result[0].deadline).toBeInstanceOf(Date);
      expect(result[1].deadline).toBeInstanceOf(Date);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getGoalTracking(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getPerformanceBenchmarks', () => {
    it('should fetch benchmarks without industry filter', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await premiumAnalyticsService.getPerformanceBenchmarks(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/benchmarks`,
        { params: { industry: undefined } }
      );
      expect(result).toEqual(mockBenchmarks);
      expect(result).toHaveLength(2);
    });

    it('should fetch benchmarks with industry filter', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      await premiumAnalyticsService.getPerformanceBenchmarks(clubId, 'nonprofit');

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/benchmarks`,
        { params: { industry: 'nonprofit' } }
      );
    });

    it('should return benchmark comparisons', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await premiumAnalyticsService.getPerformanceBenchmarks(clubId);

      expect(result[0].metric).toBe('Member Retention');
      expect(result[0].current).toBe(88);
      expect(result[0].target).toBe(90);
      expect(result[0].industry).toBe(82);
      expect(result[0].best).toBe(95);
    });

    it('should return benchmark status', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await premiumAnalyticsService.getPerformanceBenchmarks(clubId);

      expect(result[0].status).toBe('good');
      expect(result[1].status).toBe('average');
    });

    it('should compare against industry and best-in-class', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await premiumAnalyticsService.getPerformanceBenchmarks(clubId);

      // Current should be above industry average for 'good' status
      expect(result[0].current).toBeGreaterThan(result[0].industry);
      // But below best-in-class
      expect(result[0].current).toBeLessThan(result[0].best);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getPerformanceBenchmarks(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getAutomatedInsights', () => {
    it('should fetch insights with default type (performance)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await premiumAnalyticsService.getAutomatedInsights(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/insights`,
        { params: { analysisType: 'performance' } }
      );
      expect(result).toEqual(mockInsights);
      expect(result).toHaveLength(2);
    });

    it('should fetch insights with opportunities analysis', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      await premiumAnalyticsService.getAutomatedInsights(clubId, 'opportunities');

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/insights`,
        { params: { analysisType: 'opportunities' } }
      );
    });

    it('should fetch insights with risks analysis', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      await premiumAnalyticsService.getAutomatedInsights(clubId, 'risks');

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/insights`,
        { params: { analysisType: 'risks' } }
      );
    });

    it('should return actionable insights with recommendations', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await premiumAnalyticsService.getAutomatedInsights(clubId);

      expect(result[0].type).toBe('recommendation');
      expect(result[0].actionItems).toHaveLength(2);
      expect(result[0].impact).toBe('high');
      expect(result[0].confidence).toBe(85);
    });

    it('should return insights with different types', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await premiumAnalyticsService.getAutomatedInsights(clubId);

      expect(result[0].type).toBe('recommendation');
      expect(result[1].type).toBe('trend');
    });

    it('should return supporting data points', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await premiumAnalyticsService.getAutomatedInsights(clubId);

      expect(result[0].dataPoints).toEqual({
        currentEvents: 3,
        recommendedEvents: 5,
      });
      expect(result[1].dataPoints.previousScore).toBe(65);
      expect(result[1].dataPoints.currentScore).toBe(75);
    });

    it('should include visualization references', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await premiumAnalyticsService.getAutomatedInsights(clubId);

      expect(result[0].visualizations).toHaveLength(2);
      expect(result[0].visualizations).toContain('event_frequency_chart');
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getAutomatedInsights(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getDataQuality', () => {
    it('should fetch data quality metrics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDataQuality });

      const result = await premiumAnalyticsService.getDataQuality(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/data-quality`
      );
      expect(result).toEqual(mockDataQuality);
    });

    it('should return all quality dimensions', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDataQuality });

      const result = await premiumAnalyticsService.getDataQuality(clubId);

      expect(result.completeness).toBe(95);
      expect(result.accuracy).toBe(92);
      expect(result.timeliness).toBe(88);
      expect(result.consistency).toBe(90);
      expect(result.overall).toBe(91);
    });

    it('should return quality issues with severity levels', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDataQuality });

      const result = await premiumAnalyticsService.getDataQuality(clubId);

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].severity).toBe('low');
      expect(result.issues[1].severity).toBe('medium');
    });

    it('should return issue details and affected records', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDataQuality });

      const result = await premiumAnalyticsService.getDataQuality(clubId);

      expect(result.issues[0].type).toBe('missing_data');
      expect(result.issues[0].description).toContain('phone numbers');
      expect(result.issues[0].affectedRecords).toBe(15);
    });

    it('should return last updated timestamp', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDataQuality });

      const result = await premiumAnalyticsService.getDataQuality(clubId);

      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.getDataQuality(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('saveDashboardConfig', () => {
    it('should save dashboard config successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { configId: 'config-123' } });

      const result = await premiumAnalyticsService.saveDashboardConfig(clubId, mockDashboardConfig);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        mockDashboardConfig
      );
      expect(result.configId).toBe('config-123');
    });

    it('should save widget configurations', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { configId: 'config-123' } });

      await premiumAnalyticsService.saveDashboardConfig(clubId, mockDashboardConfig);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              type: 'engagement_chart',
              position: { x: 0, y: 0, width: 6, height: 4 },
            }),
          ]),
        })
      );
    });

    it('should save widget settings', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { configId: 'config-123' } });

      await premiumAnalyticsService.saveDashboardConfig(clubId, mockDashboardConfig);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              settings: { timeRange: '30d', chartType: 'line' },
            }),
            expect.objectContaining({
              settings: { showPredictions: true },
            }),
          ]),
        })
      );
    });

    it('should save filters and refresh interval', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { configId: 'config-123' } });

      await premiumAnalyticsService.saveDashboardConfig(clubId, mockDashboardConfig);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        expect.objectContaining({
          filters: { dateRange: '30d', segmentType: 'all' },
          refreshInterval: 300,
        })
      );
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        premiumAnalyticsService.saveDashboardConfig(clubId, mockDashboardConfig)
      ).rejects.toThrow('Network error');
    });
  });

  describe('loadDashboardConfig', () => {
    it('should load dashboard config without configId (default config)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboardConfig });

      const result = await premiumAnalyticsService.loadDashboardConfig(clubId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        { params: { configId: undefined } }
      );
      expect(result).toEqual(mockDashboardConfig);
    });

    it('should load dashboard config with specific configId', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboardConfig });

      await premiumAnalyticsService.loadDashboardConfig(clubId, 'config-123');

      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/premium/dashboard-config`,
        { params: { configId: 'config-123' } }
      );
    });

    it('should return widget configuration', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboardConfig });

      const result = await premiumAnalyticsService.loadDashboardConfig(clubId);

      expect(result.name).toBe('Executive Dashboard');
      expect(result.widgets).toHaveLength(2);
      expect(result.widgets[0].type).toBe('engagement_chart');
    });

    it('should return filters and refresh interval', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboardConfig });

      const result = await premiumAnalyticsService.loadDashboardConfig(clubId);

      expect(result.filters.dateRange).toBe('30d');
      expect(result.refreshInterval).toBe(300);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(premiumAnalyticsService.loadDashboardConfig(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('Service Export', () => {
    it('should export premiumAnalyticsService instance', () => {
      expect(premiumAnalyticsService).toBeDefined();
      expect(typeof premiumAnalyticsService).toBe('object');
    });

    it('should have all required methods', () => {
      const methods = [
        'getEngagementTrends',
        'getCohortAnalysis',
        'getFinancialROI',
        'compareEvents',
        'getMemberSegmentation',
        'exportData',
        'getRealTimeMetrics',
        'getPredictiveAnalytics',
        'getGoalTracking',
        'getPerformanceBenchmarks',
        'getAutomatedInsights',
        'getDataQuality',
        'saveDashboardConfig',
        'loadDashboardConfig',
      ];

      methods.forEach((method) => {
        expect(typeof (premiumAnalyticsService as any)[method]).toBe('function');
      });
    });
  });
});
