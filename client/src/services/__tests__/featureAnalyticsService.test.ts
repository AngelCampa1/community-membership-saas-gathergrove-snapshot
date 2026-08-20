import { featureAnalyticsService } from '../featureAnalyticsService';
import apiClient from '../apiClient';
import type { 
  TrackFeatureUsageRequest, 
  FeatureUsageAnalyticsResponse,
  MemberEngagementAnalyticsResponse 
} from '../featureAnalyticsService';

// Mock apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('FeatureAnalyticsService', () => {
  const clubId = 123;

  beforeEach(() => {
    // Clear API client mocks
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    mockApiClient.delete.mockClear();

    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});

    // Clear logger mocks explicitly without calling jest.clearAllMocks()
    const { logger } = require('@/lib/logger');
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.info.mockClear();
    logger.debug.mockClear();
  });

  describe('trackFeatureUsage', () => {
    it('should make POST request with correct parameters', async () => {
      const request: TrackFeatureUsageRequest = {
        featureName: 'member_directory',
        platform: 'web',
        sessionId: 'test-session-123',
        metadata: '{"page": "directory"}',
        memberId: 456,
      };

      const mockResponse = { success: true, message: 'Usage tracked successfully' };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.trackFeatureUsage(clubId, request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors properly', async () => {
      const request: TrackFeatureUsageRequest = {
        featureName: 'event_management',
        platform: 'mobile',
      };

      const apiError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(apiError);

      await expect(featureAnalyticsService.trackFeatureUsage(clubId, request))
        .rejects.toThrow('Network error');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        request
      );
    });
  });

  describe('getFeatureUsageAnalytics', () => {
    it('should make GET request with default days parameter', async () => {
      const mockResponse: FeatureUsageAnalyticsResponse = {
        featureUsage: [],
        platformUsage: {
          webUsageEvents: 100,
          mobileUsageEvents: 50,
          webUsagePercentage: 66.7,
          mobileUsagePercentage: 33.3,
          featurePlatformBreakdown: []
        },
        adoptionTrends: [],
        tenurePatterns: []
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.getFeatureUsageAnalytics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage?days=30`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with custom days parameter', async () => {
      const days = 7;
      const mockResponse: FeatureUsageAnalyticsResponse = {
        featureUsage: [],
        platformUsage: {
          webUsageEvents: 50,
          mobileUsageEvents: 25,
          webUsagePercentage: 66.7,
          mobileUsagePercentage: 33.3,
          featurePlatformBreakdown: []
        },
        adoptionTrends: [],
        tenurePatterns: []
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.getFeatureUsageAnalytics(clubId, days);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage?days=${days}`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(apiError);

      await expect(featureAnalyticsService.getFeatureUsageAnalytics(clubId))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('getMemberEngagementAnalytics', () => {
    it('should make GET request for member engagement data', async () => {
      const mockResponse: MemberEngagementAnalyticsResponse = {
        memberScores: [],
        clubSummary: {
          averageEngagementScore: 75.5,
          totalMembers: 100,
          highlyActiveMembers: 25,
          moderateMembers: 50,
          inactiveMembers: 25,
          retentionRate: 85.0
        },
        distribution: {
          highlyActive: 25,
          active: 20,
          moderate: 30,
          lowEngagement: 15,
          inactive: 10
        },
        trends: []
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.getMemberEngagementAnalytics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/member-engagement`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Server error');
      mockApiClient.get.mockRejectedValue(apiError);

      await expect(featureAnalyticsService.getMemberEngagementAnalytics(clubId))
        .rejects.toThrow('Server error');
    });
  });

  describe('calculateEngagementScores', () => {
    it('should make POST request to calculate engagement scores', async () => {
      const mockResponse = { success: true, message: 'Engagement scores calculated successfully' };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.calculateEngagementScores(clubId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/calculate-engagement-scores`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle calculation errors', async () => {
      const apiError = new Error('Calculation failed');
      mockApiClient.post.mockRejectedValue(apiError);

      await expect(featureAnalyticsService.calculateEngagementScores(clubId))
        .rejects.toThrow('Calculation failed');
    });
  });

  describe('getLowEngagementMembers', () => {
    it('should make GET request with default threshold', async () => {
      const mockResponse = [
        {
          memberId: 1,
          memberName: 'John Doe',
          overallScore: 35,
          engagementLevel: 'Low',
          lastActivity: '2024-01-10T10:00:00Z',
          daysSinceLastLogin: 15,
          scoreBreakdown: {
            loginScore: 20,
            eventScore: 30,
            communicationScore: 40,
            featureUsageScore: 45,
            profileCompletenessScore: 80
          }
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.getLowEngagementMembers(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/low-engagement-members?threshold=40`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with custom threshold', async () => {
      const threshold = 25;
      const mockResponse: any[] = [];

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await featureAnalyticsService.getLowEngagementMembers(clubId, threshold);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/low-engagement-members?threshold=${threshold}`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Access denied');
      mockApiClient.get.mockRejectedValue(apiError);

      await expect(featureAnalyticsService.getLowEngagementMembers(clubId))
        .rejects.toThrow('Access denied');
    });
  });

  describe('trackFeature helper method', () => {
    it('should generate new session ID when none exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      featureAnalyticsService.trackFeature(clubId, 'member_directory', 'web');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('analytics_session_id');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'analytics_session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]{9}$/)
      );
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      featureAnalyticsService.trackFeature(clubId, 'event_management', 'mobile');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('analytics_session_id');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should call trackFeatureUsage with correct parameters', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      const metadata = { page: 'dashboard', section: 'events' };
      featureAnalyticsService.trackFeature(clubId, 'event_management', 'web', metadata);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        {
          featureName: 'event_management',
          platform: 'web',
          sessionId: existingSessionId,
          metadata: JSON.stringify(metadata)
        }
      );
    });

    it('should use default platform when not specified', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      featureAnalyticsService.trackFeature(clubId, 'communications');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        {
          featureName: 'communications',
          platform: 'web',
          sessionId: existingSessionId,
          metadata: undefined
        }
      );
    });

    it('should handle tracking errors gracefully without throwing', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);

      // Mock API failure - this will be caught and logged
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(networkError);

      // trackFeature is intentionally fire-and-forget and should not throw
      // even when the underlying API call fails
      expect(() => {
        featureAnalyticsService.trackFeature(clubId, 'member_directory');
      }).not.toThrow();

      // Verify the API was attempted to be called (synchronous check)
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        expect.objectContaining({
          featureName: 'member_directory',
          platform: 'web',
          sessionId: existingSessionId
        })
      );

      // Note: We don't verify logger.error is called because trackFeature()
      // is fire-and-forget, and the promise rejection happens asynchronously
      // after the test completes. The important behavior is that it doesn't throw.
    });

    it('should handle metadata serialization correctly', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      // Test with complex metadata object
      const metadata = {
        user: { id: 123, role: 'admin' },
        features: ['feature1', 'feature2'],
        timestamp: new Date().toISOString(),
        nested: { level: 2, active: true }
      };

      featureAnalyticsService.trackFeature(clubId, 'advanced_analytics', 'web', metadata);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        {
          featureName: 'advanced_analytics',
          platform: 'web',
          sessionId: existingSessionId,
          metadata: JSON.stringify(metadata)
        }
      );
    });

    it('should handle undefined metadata correctly', () => {
      const existingSessionId = 'session_123456789_abc123def';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      featureAnalyticsService.trackFeature(clubId, 'simple_feature', 'mobile', undefined);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/analytics/clubs/${clubId}/feature-usage`,
        {
          featureName: 'simple_feature',
          platform: 'mobile',
          sessionId: existingSessionId,
          metadata: undefined
        }
      );
    });
  });

  describe('Session ID Generation', () => {
    it('should generate session IDs with correct format', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock Date.now() to return a known timestamp
      const mockTimestamp = 1641024000000; // 2022-01-01 12:00:00 UTC
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      
      // Mock Math.random() to return predictable value
      const mockRandomValue = 0.123456789;
      jest.spyOn(Math, 'random').mockReturnValue(mockRandomValue);
      
      // Calculate expected random string: Math.random().toString(36).substr(2, 9)
      const expectedRandomString = mockRandomValue.toString(36).substr(2, 9);
      
      // Mock successful API call
      mockApiClient.post.mockResolvedValue({ data: { success: true, message: 'Tracked' } });

      featureAnalyticsService.trackFeature(clubId, 'test_feature');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'analytics_session_id',
        `session_${mockTimestamp}_${expectedRandomString}`
      );

      // Restore mocks
      (Date.now as jest.Mock).mockRestore();
      (Math.random as jest.Mock).mockRestore();
    });
  });

  describe('API Error Handling', () => {
    const testCases = [
      { method: 'trackFeatureUsage', params: [clubId, { featureName: 'test', platform: 'web' }] },
      { method: 'getFeatureUsageAnalytics', params: [clubId] },
      { method: 'getMemberEngagementAnalytics', params: [clubId] },
      { method: 'calculateEngagementScores', params: [clubId] },
      { method: 'getLowEngagementMembers', params: [clubId] },
    ];

    testCases.forEach(({ method, params }) => {
      it(`should propagate network errors for ${method}`, async () => {
        const networkError = new Error('Network timeout');
        mockApiClient.get.mockRejectedValue(networkError);
        mockApiClient.post.mockRejectedValue(networkError);

        const serviceMethod = (featureAnalyticsService as any)[method];
        await expect(serviceMethod(...params)).rejects.toThrow('Network timeout');
      });

      it(`should propagate HTTP errors for ${method}`, async () => {
        const httpError = { response: { status: 403, data: { message: 'Forbidden' } } };
        mockApiClient.get.mockRejectedValue(httpError);
        mockApiClient.post.mockRejectedValue(httpError);

        const serviceMethod = (featureAnalyticsService as any)[method];
        await expect(serviceMethod(...params)).rejects.toEqual(httpError);
      });
    });
  });

  describe('Type Safety', () => {
    it('should handle malformed API responses gracefully', async () => {
      // Test with response missing expected properties
      const malformedResponse = { data: { someUnexpectedProperty: true } };
      mockApiClient.get.mockResolvedValue(malformedResponse);

      const result = await featureAnalyticsService.getFeatureUsageAnalytics(clubId);
      
      // Should return whatever the API returns without throwing
      expect(result).toEqual(malformedResponse.data);
    });

    it('should handle null/undefined responses', async () => {
      mockApiClient.get.mockResolvedValue({ data: null });

      const result = await featureAnalyticsService.getMemberEngagementAnalytics(clubId);
      expect(result).toBeNull();
    });
  });
});