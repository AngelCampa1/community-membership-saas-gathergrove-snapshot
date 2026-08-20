import cohortAnalysisService from '../cohortAnalysisService';
import apiClient from '../apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Mock apiClient
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn(),
  },
}));

describe('CohortAnalysisService', () => {
  const clubId = 1;

  // Re-establish mock implementation before each test
  beforeEach(() => {
    (ErrorHandler.handleApiError as jest.Mock).mockImplementation((error) => {
      throw error;
    });
  });

  const mockDateRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  };

  const mockCohortRetentionData = [
    {
      cohortId: 'cohort-2025-01',
      cohortStartDate: '2025-01-01',
      cohortLabel: 'January 2025',
      initialSize: 100,
      retentionRates: [100, 95, 90, 85],
      retentionPercentages: [100, 95, 90, 85],
      averageLifetime: 12.5,
      totalRevenue: 50000,
      churnRate: 0.15,
      segments: [
        {
          segmentName: 'Premium',
          memberCount: 40,
          retentionRate: 0.92,
          averageValue: 1500,
          characteristics: { tier: 'premium' },
        },
      ],
    },
    {
      cohortId: 'cohort-2024-12',
      cohortStartDate: '2024-12-01',
      cohortLabel: 'December 2024',
      initialSize: 85,
      retentionRates: [85, 80, 75, 70],
      retentionPercentages: [100, 94, 88, 82],
      averageLifetime: 11.2,
      totalRevenue: 42000,
      churnRate: 0.18,
      segments: [],
    },
  ];

  const mockCohortMembers = {
    members: [
      {
        memberId: 'member-1',
        joinDate: '2025-01-05',
        membershipType: 'premium' as const,
        acquisitionChannel: 'referral',
        initialValue: 1000,
        lifetimeValue: 5000,
        isActive: true,
      },
      {
        memberId: 'member-2',
        joinDate: '2025-01-10',
        membershipType: 'basic' as const,
        acquisitionChannel: 'organic',
        initialValue: 500,
        lifetimeValue: 2500,
        churnDate: '2025-02-01',
        isActive: false,
      },
    ],
    total: 2,
  };

  const mockCohortPredictions = [
    {
      cohortId: 'cohort-2025-01',
      predictedRetention: [95, 90, 85, 80],
      confidenceInterval: [
        [93, 97],
        [88, 92],
        [83, 87],
        [78, 82],
      ] as [number, number][],
      predictedLifetimeValue: 15000,
      predictedChurnDate: '2025-12-31',
      factors: [
        {
          factor: 'engagement',
          impact: 0.75,
          confidence: 0.9,
          description: 'High engagement correlates with retention',
        },
      ],
    },
  ];

  const mockCohortComparison = {
    cohortA: mockCohortRetentionData[0],
    cohortB: mockCohortRetentionData[1],
    significanceTesting: {
      isSignificant: true,
      pValue: 0.03,
      confidenceLevel: 0.95,
    },
    keyDifferences: [
      {
        metric: 'retention',
        differencePercent: 12.5,
        significance: 'high' as const,
      },
      {
        metric: 'revenue',
        differencePercent: 8.2,
        significance: 'medium' as const,
      },
    ],
  };

  const mockCohortSegments = [
    {
      segmentName: 'Premium',
      memberCount: 40,
      retentionRate: 0.92,
      averageValue: 1500,
      characteristics: { tier: 'premium' },
    },
    {
      segmentName: 'Basic',
      memberCount: 35,
      retentionRate: 0.78,
      averageValue: 800,
      characteristics: { tier: 'basic' },
    },
  ];

  const mockChurnRiskAnalysis = [
    {
      memberId: 'member-at-risk-1',
      memberName: 'John Doe',
      churnRisk: 0.85,
      riskFactors: [
        {
          factor: 'Low engagement',
          impact: 0.6,
          recommendation: 'Send re-engagement campaign',
        },
        {
          factor: 'Payment issues',
          impact: 0.4,
          recommendation: 'Contact for payment update',
        },
      ],
      recommendedActions: ['Send personalized email', 'Offer discount'],
    },
  ];

  const mockExportResponse = {
    downloadUrl: 'https://example.com/cohort-export.csv',
    filename: 'cohort-analysis-2025-01-15.csv',
  };

  const mockBenchmarks = {
    industry: 'Professional Associations',
    benchmarks: {
      retention: {
        period1: 0.95,
        period3: 0.88,
        period6: 0.82,
        period12: 0.75,
      },
      averageLifetime: 14.5,
      churnRate: 0.12,
      percentiles: {
        p25: 0.65,
        p50: 0.75,
        p75: 0.85,
        p90: 0.92,
      },
    },
  };

  const mockInsights = [
    {
      type: 'insight' as const,
      title: 'Strong January cohort performance',
      description: 'January cohort showing 15% above-average retention',
      impact: 'high' as const,
      recommendedActions: ['Continue current acquisition strategy', 'Document success factors'],
      dataPoints: { retentionRate: 0.95, cohortSize: 100 },
    },
    {
      type: 'warning' as const,
      title: 'Declining Q4 retention',
      description: 'Q4 cohorts showing declining retention trend',
      impact: 'medium' as const,
      recommendedActions: ['Review onboarding process', 'Increase early engagement'],
      dataPoints: { retentionDrop: 0.08 },
    },
  ];

  const mockRealTimeMetrics = {
    activeCohorts: 12,
    newMembersToday: 8,
    churnedMembersToday: 2,
    averageRetentionTrend: 0.87,
    topPerformingCohort: {
      id: 'cohort-2025-01',
      label: 'January 2025',
      retentionRate: 0.95,
    },
    alerts: [
      {
        type: 'retention_drop' as const,
        message: 'December cohort retention dropped 5%',
        severity: 'warning' as const,
        cohortId: 'cohort-2024-12',
      },
      {
        type: 'cohort_milestone' as const,
        message: 'January cohort reached 100 members',
        severity: 'info' as const,
        cohortId: 'cohort-2025-01',
      },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCohortAnalysis', () => {
    const mockFilters = {
      dateRange: mockDateRange,
      membershipTypes: ['premium', 'basic'],
      acquisitionChannels: ['referral', 'organic'],
      minimumCohortSize: 10,
      includeInactive: true,
      granularity: 'monthly' as const,
    };

    it('should fetch cohort analysis with all filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortRetentionData });

      const result = await cohortAnalysisService.getCohortAnalysis(clubId, mockFilters);

      expect(result).toEqual(mockCohortRetentionData);
      expect(result).toHaveLength(2);
      expect(result[0].cohortId).toBe('cohort-2025-01');
      expect(result[0].retentionRates).toEqual([100, 95, 90, 85]);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/retention`,
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            membershipTypes: 'premium,basic',
            acquisitionChannels: 'referral,organic',
            minimumCohortSize: 10,
            includeInactive: true,
            granularity: 'monthly',
          }),
        })
      );
    });

    it('should fetch cohort analysis with minimal filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortRetentionData });

      const result = await cohortAnalysisService.getCohortAnalysis(clubId, {
        dateRange: mockDateRange,
        granularity: 'weekly',
      });

      expect(result).toEqual(mockCohortRetentionData);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/retention`,
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            granularity: 'weekly',
          }),
        })
      );
    });

    it('should join membershipTypes array correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortRetentionData });

      await cohortAnalysisService.getCohortAnalysis(clubId, {
        dateRange: mockDateRange,
        membershipTypes: ['premium', 'enterprise', 'basic'],
        granularity: 'monthly',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            membershipTypes: 'premium,enterprise,basic',
          }),
        })
      );
    });

    it('should join acquisitionChannels array correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortRetentionData });

      await cohortAnalysisService.getCohortAnalysis(clubId, {
        dateRange: mockDateRange,
        acquisitionChannels: ['referral', 'organic', 'paid'],
        granularity: 'monthly',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            acquisitionChannels: 'referral,organic,paid',
          }),
        })
      );
    });

    it('should handle different granularity options', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortRetentionData });

      await cohortAnalysisService.getCohortAnalysis(clubId, {
        dateRange: mockDateRange,
        granularity: 'quarterly',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            granularity: 'quarterly',
          }),
        })
      );
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortAnalysis(clubId, mockFilters)
      ).rejects.toEqual(error);

      expect(ErrorHandler.handleApiError).toHaveBeenCalled();
    });

    it('should throw error when invalid parameters (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortAnalysis(clubId, mockFilters)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortAnalysis(clubId, mockFilters)
      ).rejects.toThrow('Network Error');
    });
  });

  describe('getCohortMembers', () => {
    const cohortId = 'cohort-2025-01';

    it('should fetch cohort members with all options', async () => {
      const options = {
        includeChurned: true,
        sortBy: 'lifetimeValue' as const,
        limit: 50,
        offset: 10,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortMembers });

      const result = await cohortAnalysisService.getCohortMembers(clubId, cohortId, options);

      expect(result).toEqual(mockCohortMembers);
      expect(result.members).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/${cohortId}/members`,
        expect.objectContaining({
          params: expect.objectContaining({
            includeChurned: true,
            sortBy: 'lifetimeValue',
            limit: 50,
            offset: 10,
          }),
        })
      );
    });

    it('should fetch cohort members with minimal options', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortMembers });

      const result = await cohortAnalysisService.getCohortMembers(clubId, cohortId);

      expect(result).toEqual(mockCohortMembers);
      expect(result.members[0].memberId).toBe('member-1');
    });

    it('should support sortBy joinDate', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortMembers });

      await cohortAnalysisService.getCohortMembers(clubId, cohortId, {
        sortBy: 'joinDate',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: 'joinDate',
          }),
        })
      );
    });

    it('should support sortBy churnRisk', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortMembers });

      await cohortAnalysisService.getCohortMembers(clubId, cohortId, {
        sortBy: 'churnRisk',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: 'churnRisk',
          }),
        })
      );
    });

    it('should handle pagination with limit and offset', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { members: [], total: 100 } });

      const result = await cohortAnalysisService.getCohortMembers(clubId, cohortId, {
        limit: 25,
        offset: 50,
      });

      expect(result.total).toBe(100);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 25,
            offset: 50,
          }),
        })
      );
    });

    it('should throw error when cohort not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortMembers(clubId, cohortId)
      ).rejects.toEqual(error);
    });

    it('should throw error when insufficient permissions (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortMembers(clubId, cohortId)
      ).rejects.toEqual(error);
    });
  });

  describe('getCohortPredictions', () => {
    it('should fetch predictions for multiple cohorts', async () => {
      const cohortIds = ['cohort-2025-01', 'cohort-2024-12'];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortPredictions });

      const result = await cohortAnalysisService.getCohortPredictions(clubId, cohortIds);

      expect(result).toEqual(mockCohortPredictions);
      expect(result[0].predictedRetention).toEqual([95, 90, 85, 80]);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/predictions`,
        expect.objectContaining({
          cohortIds,
          predictionHorizon: 12,
        })
      );
    });

    it('should fetch predictions for single cohort', async () => {
      const cohortIds = ['cohort-2025-01'];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortPredictions });

      const result = await cohortAnalysisService.getCohortPredictions(clubId, cohortIds);

      expect(result).toEqual(mockCohortPredictions);
    });

    it('should support custom predictionHorizon', async () => {
      const cohortIds = ['cohort-2025-01'];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortPredictions });

      await cohortAnalysisService.getCohortPredictions(clubId, cohortIds, 24);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          predictionHorizon: 24,
        })
      );
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortPredictions(clubId, ['cohort-1'])
      ).rejects.toEqual(error);
    });

    it('should throw error when insufficient data (422)', async () => {
      const error = { response: { status: 422, data: { message: 'Unprocessable Entity' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortPredictions(clubId, ['cohort-1'])
      ).rejects.toEqual(error);
    });
  });

  describe('compareCohorts', () => {
    const cohortAId = 'cohort-2025-01';
    const cohortBId = 'cohort-2024-12';

    it('should compare cohorts with default metrics', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortComparison });

      const result = await cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId);

      expect(result).toEqual(mockCohortComparison);
      expect(result.cohortA.cohortId).toBe('cohort-2025-01');
      expect(result.cohortB.cohortId).toBe('cohort-2024-12');
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/compare`,
        expect.objectContaining({
          cohortAId,
          cohortBId,
          metrics: ['retention', 'revenue', 'lifetime_value'],
        })
      );
    });

    it('should compare cohorts with custom metrics', async () => {
      const customMetrics = ['retention', 'engagement', 'churn_rate'];
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortComparison });

      await cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId, customMetrics);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metrics: customMetrics,
        })
      );
    });

    it('should include significance testing in response', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortComparison });

      const result = await cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId);

      expect(result.significanceTesting.isSignificant).toBe(true);
      expect(result.significanceTesting.pValue).toBe(0.03);
      expect(result.significanceTesting.confidenceLevel).toBe(0.95);
    });

    it('should include key differences in response', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockCohortComparison });

      const result = await cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId);

      expect(result.keyDifferences).toHaveLength(2);
      expect(result.keyDifferences[0].metric).toBe('retention');
      expect(result.keyDifferences[0].differencePercent).toBe(12.5);
      expect(result.keyDifferences[0].significance).toBe('high');
    });

    it('should throw error when cohort not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId)
      ).rejects.toEqual(error);
    });

    it('should throw error when invalid parameters (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.compareCohorts(clubId, cohortAId, cohortBId)
      ).rejects.toEqual(error);
    });
  });

  describe('getCohortSegmentation', () => {
    const cohortId = 'cohort-2025-01';

    it('should fetch segmentation by membershipType', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortSegments });

      const result = await cohortAnalysisService.getCohortSegmentation(
        clubId,
        cohortId,
        'membershipType'
      );

      expect(result).toEqual(mockCohortSegments);
      expect(result[0].segmentName).toBe('Premium');
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/${cohortId}/segments`,
        expect.objectContaining({
          params: expect.objectContaining({
            segmentBy: 'membershipType',
          }),
        })
      );
    });

    it('should fetch segmentation by acquisitionChannel', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortSegments });

      await cohortAnalysisService.getCohortSegmentation(clubId, cohortId, 'acquisitionChannel');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            segmentBy: 'acquisitionChannel',
          }),
        })
      );
    });

    it('should fetch segmentation by geography', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortSegments });

      await cohortAnalysisService.getCohortSegmentation(clubId, cohortId, 'geography');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            segmentBy: 'geography',
          }),
        })
      );
    });

    it('should fetch segmentation by behavior', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockCohortSegments });

      await cohortAnalysisService.getCohortSegmentation(clubId, cohortId, 'behavior');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            segmentBy: 'behavior',
          }),
        })
      );
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.getCohortSegmentation(clubId, cohortId, 'membershipType')
      ).rejects.toEqual(error);
    });
  });

  describe('getChurnRiskAnalysis', () => {
    it('should fetch churn risk with cohortId', async () => {
      const cohortId = 'cohort-2025-01';
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockChurnRiskAnalysis });

      const result = await cohortAnalysisService.getChurnRiskAnalysis(clubId, cohortId);

      expect(result).toEqual(mockChurnRiskAnalysis);
      expect(result[0].churnRisk).toBe(0.85);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/churn-risk`,
        expect.objectContaining({
          params: expect.objectContaining({
            cohortId,
            riskThreshold: 0.7,
          }),
        })
      );
    });

    it('should fetch churn risk without cohortId (all members)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockChurnRiskAnalysis });

      const result = await cohortAnalysisService.getChurnRiskAnalysis(clubId);

      expect(result).toEqual(mockChurnRiskAnalysis);
    });

    it('should support custom riskThreshold', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockChurnRiskAnalysis });

      await cohortAnalysisService.getChurnRiskAnalysis(clubId, undefined, 0.85);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            riskThreshold: 0.85,
          }),
        })
      );
    });

    it('should include risk factors in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockChurnRiskAnalysis });

      const result = await cohortAnalysisService.getChurnRiskAnalysis(clubId);

      expect(result[0].riskFactors).toHaveLength(2);
      expect(result[0].riskFactors[0].factor).toBe('Low engagement');
      expect(result[0].riskFactors[0].recommendation).toBe('Send re-engagement campaign');
    });

    it('should include recommended actions in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockChurnRiskAnalysis });

      const result = await cohortAnalysisService.getChurnRiskAnalysis(clubId);

      expect(result[0].recommendedActions).toEqual(['Send personalized email', 'Offer discount']);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(cohortAnalysisService.getChurnRiskAnalysis(clubId)).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(cohortAnalysisService.getChurnRiskAnalysis(clubId)).rejects.toThrow('Network Error');
    });
  });

  describe('exportCohortData', () => {
    const cohortIds = ['cohort-2025-01', 'cohort-2024-12'];

    it('should export cohort data as CSV', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockExportResponse });

      const result = await cohortAnalysisService.exportCohortData(clubId, cohortIds, 'csv');

      expect(result.downloadUrl).toContain('https://');
      expect(result.filename).toContain('.csv');
      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/export`,
        expect.objectContaining({
          cohortIds,
          format: 'csv',
          includeMembers: false,
        })
      );
    });

    it('should export cohort data as Excel', async () => {
      const excelResponse = {
        downloadUrl: 'https://example.com/cohort-export.xlsx',
        filename: 'cohort-analysis.xlsx',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: excelResponse });

      const result = await cohortAnalysisService.exportCohortData(clubId, cohortIds, 'excel');

      expect(result.filename).toContain('.xlsx');
    });

    it('should export cohort data as JSON', async () => {
      const jsonResponse = {
        downloadUrl: 'https://example.com/cohort-export.json',
        filename: 'cohort-analysis.json',
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: jsonResponse });

      const result = await cohortAnalysisService.exportCohortData(clubId, cohortIds, 'json');

      expect(result.filename).toContain('.json');
    });

    it('should include members when includeMembers is true', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockExportResponse });

      await cohortAnalysisService.exportCohortData(clubId, cohortIds, 'csv', true);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          includeMembers: true,
        })
      );
    });

    it('should throw error when export too large (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload Too Large' } } };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.exportCohortData(clubId, cohortIds, 'csv')
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        cohortAnalysisService.exportCohortData(clubId, cohortIds, 'csv')
      ).rejects.toThrow('Network Error');
    });
  });

  describe('getCohortBenchmarks', () => {
    it('should fetch benchmarks with industryType', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await cohortAnalysisService.getCohortBenchmarks(
        clubId,
        'Professional Associations'
      );

      expect(result).toEqual(mockBenchmarks);
      expect(result.industry).toBe('Professional Associations');
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/benchmarks`,
        expect.objectContaining({
          params: expect.objectContaining({
            industryType: 'Professional Associations',
          }),
        })
      );
    });

    it('should fetch benchmarks without industryType', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await cohortAnalysisService.getCohortBenchmarks(clubId);

      expect(result).toEqual(mockBenchmarks);
    });

    it('should include retention periods in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await cohortAnalysisService.getCohortBenchmarks(clubId);

      expect(result.benchmarks.retention.period1).toBe(0.95);
      expect(result.benchmarks.retention.period3).toBe(0.88);
      expect(result.benchmarks.retention.period6).toBe(0.82);
      expect(result.benchmarks.retention.period12).toBe(0.75);
    });

    it('should include percentiles in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBenchmarks });

      const result = await cohortAnalysisService.getCohortBenchmarks(clubId);

      expect(result.benchmarks.percentiles.p25).toBe(0.65);
      expect(result.benchmarks.percentiles.p50).toBe(0.75);
      expect(result.benchmarks.percentiles.p75).toBe(0.85);
      expect(result.benchmarks.percentiles.p90).toBe(0.92);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(cohortAnalysisService.getCohortBenchmarks(clubId)).rejects.toThrow('Network Error');
    });
  });

  describe('getCohortInsights', () => {
    it('should fetch performance insights', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await cohortAnalysisService.getCohortInsights(clubId, 'performance');

      expect(result).toEqual(mockInsights);
      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/analytics/cohorts/insights`,
        expect.objectContaining({
          params: expect.objectContaining({
            analysisType: 'performance',
          }),
        })
      );
    });

    it('should fetch optimization insights', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      await cohortAnalysisService.getCohortInsights(clubId, 'optimization');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            analysisType: 'optimization',
          }),
        })
      );
    });

    it('should fetch trends insights', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      await cohortAnalysisService.getCohortInsights(clubId, 'trends');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            analysisType: 'trends',
          }),
        })
      );
    });

    it('should include different insight types in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockInsights });

      const result = await cohortAnalysisService.getCohortInsights(clubId);

      expect(result[0].type).toBe('insight');
      expect(result[0].impact).toBe('high');
      expect(result[1].type).toBe('warning');
      expect(result[1].impact).toBe('medium');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(cohortAnalysisService.getCohortInsights(clubId)).rejects.toThrow('Network Error');
    });
  });

  describe('getRealTimeCohortMetrics', () => {
    it('should fetch real-time cohort metrics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await cohortAnalysisService.getRealTimeCohortMetrics(clubId);

      expect(result).toEqual(mockRealTimeMetrics);
      expect(result.activeCohorts).toBe(12);
      expect(result.newMembersToday).toBe(8);
      expect(result.churnedMembersToday).toBe(2);
    });

    it('should include top performing cohort in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await cohortAnalysisService.getRealTimeCohortMetrics(clubId);

      expect(result.topPerformingCohort.id).toBe('cohort-2025-01');
      expect(result.topPerformingCohort.label).toBe('January 2025');
      expect(result.topPerformingCohort.retentionRate).toBe(0.95);
    });

    it('should include alerts in response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRealTimeMetrics });

      const result = await cohortAnalysisService.getRealTimeCohortMetrics(clubId);

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts[0].type).toBe('retention_drop');
      expect(result.alerts[0].severity).toBe('warning');
      expect(result.alerts[1].type).toBe('cohort_milestone');
      expect(result.alerts[1].severity).toBe('info');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(cohortAnalysisService.getRealTimeCohortMetrics(clubId)).rejects.toThrow('Network Error');
    });
  });
});
