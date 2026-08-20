import axios, { AxiosError, AxiosInstance } from 'axios';
import { authService } from '../authService';
import { API_CONFIG } from '@/constants';

// Define types locally to avoid importing the service prematurely
interface EventEngagementAnalytics {
  eventId: number;
  clubId: number;
  totalRsvps: number;
  totalAttended: number;
  attendanceRate: number;
  engagementScore: number;
  noShowRate: number;
  averageFeedbackRating?: number;
  feedbackCount: number;
  trends: any[];
  topMembers: any[];
  atRiskMembers: any[];
}

interface MemberEngagementInsights {
  memberId: number;
  clubId: number;
  periodDays: number;
  totalEventsInPeriod: number;
  eventsRsvped: number;
  eventsAttended: number;
  rsvpRate: number;
  attendanceRate: number;
  averageEngagementScore: number;
  noShowCount: number;
  consecutiveNoShows: number;
  lastEventDate?: string;
  engagementTrend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface EventPerformanceAnalysis {
  eventId: number;
  eventName: string;
  eventDate: string;
  performanceScore: number;
  attendanceAnalysis: {
    totalRsvps: number;
    totalAttended: number;
    attendanceRate: number;
    noShowRate: number;
  };
  engagementBreakdown: Record<string, unknown>;
  comparisonToAverage: {
    attendanceRateVsAverage: number;
    engagementScoreVsAverage: number;
  };
  improvementSuggestions: string[];
}

interface EventROIMetrics {
  clubId: number;
  periodMonths: number;
  totalEvents: number;
  totalRevenue: number;
  totalCosts: number;
  netROI: number;
  roiPercentage: number;
  averageRevenuePerEvent: number;
  averageCostPerEvent: number;
  averageAttendancePerEvent: number;
  costPerAttendee: number;
  revenuePerAttendee: number;
  topPerformingEvents: any[];
}

interface BasicEventAnalytics {
  eventId: number;
  clubId: number;
  attendance: {
    total: number;
    rsvps: number;
    checkIns: number;
    attendanceRate: number;
  };
  performanceScore: number;
  comparisonToAverage: {
    attendanceRateVsAverage: number;
    engagementScoreVsAverage: number;
  };
}

// Mock dependencies
jest.mock('axios');
jest.mock('../authService', () => ({
  authService: {
    getStoredToken: jest.fn(),
  },
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('AnalyticsService', () => {
  const mockToken = 'mock-jwt-token';
  const mockClubId = 123;
  const mockEventId = 456;
  const mockMemberId = 789;

  let mockAxiosInstance: jest.Mocked<AxiosInstance>;
  let requestInterceptor: ((config: any) => Promise<any>) | null = null;
  let responseInterceptorSuccess: ((response: any) => any) | null = null;
  let responseInterceptorError: ((error: any) => Promise<never>) | null = null;
  let analyticsService: any;

  beforeAll(() => {
    // Mock axios.isAxiosError to recognize our test errors
    mockAxios.isAxiosError = jest.fn((error: any) => {
      return error && error.isAxiosError === true;
    }) as unknown as typeof mockAxios.isAxiosError;

    // Setup axios mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((success, _error) => {
            requestInterceptor = success;
            return 0;
          }),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn((success, error) => {
            responseInterceptorSuccess = success;
            responseInterceptorError = error;
            return 0;
          }),
          eject: jest.fn(),
        },
      },
    } as any;

    mockAxios.create.mockReturnValue(mockAxiosInstance);

    // Now import the service
    analyticsService = require('../analyticsService').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getStoredToken as jest.Mock).mockResolvedValue(mockToken);
  });

  // Note: Initialization and interceptor setup are implicitly tested through the service method tests below

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', async () => {
      const config = { headers: {} };
      const result = await requestInterceptor!(config);

      expect(authService.getStoredToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add authorization header when token is null', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);
      const config = { headers: {} };
      const result = await requestInterceptor!(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should pass through successful responses', () => {
      const response = { data: { test: 'data' }, status: 200 };
      const result = responseInterceptorSuccess!(response);
      expect(result).toBe(response);
    });

    it('should handle 401 unauthorized errors', async () => {
      const error: Partial<AxiosError> = {
        response: { status: 401 } as any,
        isAxiosError: true,
      };

      await expect(responseInterceptorError!(error)).rejects.toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Analytics API: Unauthorized - token may be expired'
      );
    });

    it('should handle 403 forbidden errors', async () => {
      const error: Partial<AxiosError> = {
        response: { status: 403 } as any,
        isAxiosError: true,
      };

      await expect(responseInterceptorError!(error)).rejects.toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Analytics API: Forbidden - user not authorized for this resource'
      );
    });

    it('should handle 404 not found errors', async () => {
      const error: Partial<AxiosError> = {
        response: { status: 404 } as any,
        isAxiosError: true,
      };

      await expect(responseInterceptorError!(error)).rejects.toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Analytics API: Resource not found');
    });

    it('should handle timeout errors', async () => {
      const error: Partial<AxiosError> = {
        code: 'ECONNABORTED',
        isAxiosError: true,
      };

      await expect(responseInterceptorError!(error)).rejects.toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Analytics API: Request timeout');
    });

    it('should handle network errors', async () => {
      const error: Partial<AxiosError> = {
        request: {},
        isAxiosError: true,
      };

      await expect(responseInterceptorError!(error)).rejects.toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Analytics API: Network error - please check connection'
      );
    });
  });

  describe('getEventEngagementAnalytics', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockAnalytics: EventEngagementAnalytics = {
      eventId: mockEventId,
      clubId: mockClubId,
      totalRsvps: 50,
      totalAttended: 45,
      attendanceRate: 90,
      engagementScore: 85,
      noShowRate: 10,
      feedbackCount: 30,
      trends: [],
      topMembers: [],
      atRiskMembers: [],
    };

    it('should fetch event engagement analytics without date filters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockAnalytics });

      const result = await analyticsService.getEventEngagementAnalytics(
        mockClubId,
        mockEventId
      );

      expect(result).toEqual(mockAnalytics);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.EVENT_ENGAGEMENT_ANALYTICS(mockClubId, mockEventId)
      );
    });

    it('should fetch event engagement analytics with start date', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockAnalytics });

      await analyticsService.getEventEngagementAnalytics(
        mockClubId,
        mockEventId,
        '2025-01-01'
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2025-01-01')
      );
    });

    it('should fetch event engagement analytics with both date filters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockAnalytics });

      await analyticsService.getEventEngagementAnalytics(
        mockClubId,
        mockEventId,
        '2025-01-01',
        '2025-12-31'
      );

      const call = mockAxiosInstance.get.mock.calls[0][0];
      expect(call).toContain('startDate=2025-01-01');
      expect(call).toContain('endDate=2025-12-31');
    });

    // Note: Error handling is covered by the interceptor tests above
  });

  describe('getMemberEngagementInsights', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockInsights: MemberEngagementInsights = {
      memberId: mockMemberId,
      clubId: mockClubId,
      periodDays: 90,
      totalEventsInPeriod: 20,
      eventsRsvped: 18,
      eventsAttended: 16,
      rsvpRate: 90,
      attendanceRate: 88.89,
      averageEngagementScore: 85,
      noShowCount: 2,
      consecutiveNoShows: 0,
      engagementTrend: 'improving',
      riskLevel: 'low',
      recommendations: [],
    };

    it('should fetch member engagement insights with default period', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockInsights });

      const result = await analyticsService.getMemberEngagementInsights(mockClubId);

      expect(result).toEqual(mockInsights);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('periodDays=90')
      );
    });

    it('should fetch member engagement insights with custom period', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockInsights });

      await analyticsService.getMemberEngagementInsights(mockClubId, undefined, 30);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('periodDays=30')
      );
    });

    it('should fetch member engagement insights with member ID', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockInsights });

      await analyticsService.getMemberEngagementInsights(mockClubId, mockMemberId);

      const call = mockAxiosInstance.get.mock.calls[0][0];
      expect(call).toContain('memberId=789');
      expect(call).toContain('periodDays=90');
    });

    it('should fetch member engagement insights with all params', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockInsights });

      await analyticsService.getMemberEngagementInsights(mockClubId, mockMemberId, 60);

      const call = mockAxiosInstance.get.mock.calls[0][0];
      expect(call).toContain('memberId=789');
      expect(call).toContain('periodDays=60');
    });

    // Note: Error handling is covered by the interceptor tests above
  });

  describe('getEventPerformanceAnalysis', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockAnalysis: EventPerformanceAnalysis = {
      eventId: mockEventId,
      eventName: 'Test Event',
      eventDate: '2025-01-15',
      performanceScore: 85,
      attendanceAnalysis: {
        totalRsvps: 50,
        totalAttended: 45,
        attendanceRate: 90,
        noShowRate: 10,
      },
      engagementBreakdown: {},
      comparisonToAverage: {
        attendanceRateVsAverage: 5,
        engagementScoreVsAverage: 10,
      },
      improvementSuggestions: [],
    };

    it('should fetch event performance analysis', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockAnalysis });

      const result = await analyticsService.getEventPerformanceAnalysis(
        mockClubId,
        mockEventId
      );

      expect(result).toEqual(mockAnalysis);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.EVENT_PERFORMANCE_ANALYSIS(mockClubId, mockEventId)
      );
    });

    // Note: Error handling is covered by the interceptor tests above
  });

  describe('getROIMetrics', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockROI: EventROIMetrics = {
      clubId: mockClubId,
      periodMonths: 6,
      totalEvents: 24,
      totalRevenue: 10000,
      totalCosts: 6000,
      netROI: 4000,
      roiPercentage: 66.67,
      averageRevenuePerEvent: 416.67,
      averageCostPerEvent: 250,
      averageAttendancePerEvent: 45,
      costPerAttendee: 5.56,
      revenuePerAttendee: 9.26,
      topPerformingEvents: [],
    };

    it('should fetch ROI metrics with default period', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockROI });

      const result = await analyticsService.getROIMetrics(mockClubId);

      expect(result).toEqual(mockROI);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('periodMonths=6')
      );
    });

    it('should fetch ROI metrics with custom period', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockROI });

      await analyticsService.getROIMetrics(mockClubId, 12);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('periodMonths=12')
      );
    });

    // Note: Error handling is covered by the interceptor tests above
  });

  describe('getBasicEventAnalytics', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockBasicAnalytics: BasicEventAnalytics = {
      eventId: mockEventId,
      clubId: mockClubId,
      attendance: {
        total: 50,
        rsvps: 55,
        checkIns: 45,
        attendanceRate: 90,
      },
      performanceScore: 85,
      comparisonToAverage: {
        attendanceRateVsAverage: 5,
        engagementScoreVsAverage: 10,
      },
    };

    it('should fetch basic event analytics', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockBasicAnalytics });

      const result = await analyticsService.getBasicEventAnalytics(
        mockClubId,
        mockEventId
      );

      expect(result).toEqual(mockBasicAnalytics);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.BASIC_EVENT_ANALYTICS(mockClubId, mockEventId)
      );
    });

    it('should handle API errors and call handleError', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: { message: 'Server error' } },
        request: {},
      };
      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getBasicEventAnalytics(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'Server error',
        code: '500',
        details: { message: 'Server error' },
      });
    });
  });

  describe('Error Handling', () => {
    const mockClubId = 123;
    const mockEventId = 456;

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle request interceptor errors', async () => {
      // Test the request interceptor error path
      const requestError = new Error('Request failed');
      mockAxiosInstance.get.mockRejectedValueOnce(requestError);
      mockAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(
        analyticsService.getEventEngagementAnalytics(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: requestError,
      });
    });

    it('should handle getEventEngagementAnalytics errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Event not found' } },
        request: {},
      };
      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getEventEngagementAnalytics(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'Event not found',
        code: '404',
        details: { message: 'Event not found' },
      });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get event engagement analytics:',
        axiosError
      );
    });

    it('should handle getMemberEngagementInsights errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 403, data: { message: 'Access denied' } },
        request: {},
      };
      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getMemberEngagementInsights(mockClubId)
      ).rejects.toEqual({
        message: 'Access denied',
        code: '403',
        details: { message: 'Access denied' },
      });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get member engagement insights:',
        axiosError
      );
    });

    it('should handle getEventPerformanceAnalysis errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: {} },
        request: {},
      };
      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getEventPerformanceAnalysis(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'Failed to fetch analytics data',
        code: '500',
        details: {},
      });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get event performance analysis:',
        axiosError
      );
    });

    it('should handle getROIMetrics errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 401, data: { message: 'Unauthorized' } },
        request: {},
      };
      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getROIMetrics(mockClubId)
      ).rejects.toEqual({
        message: 'Unauthorized',
        code: '401',
        details: { message: 'Unauthorized' },
      });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get ROI metrics:',
        axiosError
      );
    });

    it('should handle network errors (no response)', async () => {
      const networkError = {
        isAxiosError: true,
        request: {},
        response: undefined,
      };
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        analyticsService.getBasicEventAnalytics(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Something went wrong');
      mockAxiosInstance.get.mockRejectedValueOnce(unknownError);
      mockAxios.isAxiosError.mockReturnValueOnce(false);

      await expect(
        analyticsService.getBasicEventAnalytics(mockClubId, mockEventId)
      ).rejects.toEqual({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: unknownError,
      });
    });
  });
});
