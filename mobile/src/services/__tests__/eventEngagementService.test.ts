/**
 * Event Engagement Service Tests
 * Tests tier-based authorization for event engagement analytics
 */

// Mock axios before any imports
jest.mock('axios', () => {
  const actualMockGet = jest.fn();
  // Export it to be accessible in tests
  (global as Record<string, unknown>).__mockAxiosGet = actualMockGet;

  return {
    create: jest.fn(() => ({
      get: actualMockGet,
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    isAxiosError: jest.fn(),
  };
});

jest.mock('../clubAuthorizationService');
jest.mock('../authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getStoredToken: jest.fn().mockResolvedValue('mock-token'),
    validateStoredSession: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    hasStoredToken: jest.fn(),
    removeStoredToken: jest.fn(),
    refreshSession: jest.fn(),
    setSessionTimeoutCallback: jest.fn(),
    cleanup: jest.fn(),
    validateJWTFormat: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  }
}));

import { eventEngagementService } from '../eventEngagementService';
import { clubAuthorizationService } from '../clubAuthorizationService';
import { authService } from '../authService';

// Get reference to mock after jest.mock is set up
const mockGet = (global as Record<string, unknown>).__mockAxiosGet as jest.Mock;

const mockClubAuthorizationService = clubAuthorizationService as jest.Mocked<typeof clubAuthorizationService>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock API responses
const mockEngagementAnalytics = {
  eventId: 1,
  eventName: 'Sample Event',
  eventDateTime: '2024-01-01T10:00:00Z',
  totalRegistrations: 50,
  totalAttendees: 42,
  attendanceRate: 0.84,
  engagementScore: 7.8,
  satisfactionRating: 4.2,
  engagementLevel: 'High',
  lastUpdated: '2024-01-01T12:00:00Z',
};

const mockMemberInsights = [{
  memberId: 1,
  memberName: 'John Doe',
  clubId: 1,
  analysisPeriod: 6,
  eventAttendanceRate: 0.75,
  rsvpAccuracyRate: 0.88,
  engagementTrend: 'Increasing',
  engagementLevel: 'High',
  recommendedActions: ['Invite to planning committee'],
  averageEngagementScore: 8.2,
  totalEventsAttended: 15,
  totalEventsRegistered: 20,
  lastEventAttended: '2024-01-01T10:00:00Z',
  engagementMetrics: { attendance: 0.75 },
}];

const mockPerformanceAnalysis = {
  eventId: 1,
  eventName: 'Sample Event',
  eventDate: '2024-01-01T10:00:00Z',
  performanceScore: 8.5,
  attendanceAnalysis: {
    totalRsvps: 50,
    totalAttended: 42,
    attendanceRate: 0.84,
    noShowRate: 0.16,
  },
  engagementBreakdown: { preEventEngagement: 0.78 },
  comparisonToAverage: { attendanceRateVsAverage: 1.12, engagementScoreVsAverage: 1.08 },
  improvementSuggestions: ['Send reminder notifications'],
};

const mockROIMetrics = {
  clubId: 1,
  analysisPeriodMonths: 12,
  totalEventCosts: 15000,
  totalMemberValue: 22500,
  roiPercentage: 50,
  costBreakdown: { venue: 8000 },
  valueDrivers: { memberRetention: 12000 },
  costPerMember: 150,
  valuePerMember: 225,
};

const mockBasicAnalytics = {
  eventId: 1,
  eventName: 'Sample Event',
  eventDateTime: '2024-01-01T10:00:00Z',
  totalRegistrations: 50,
  totalAttendees: 42,
  attendanceRate: 0.84,
  lastUpdated: '2024-01-01T12:00:00Z',
};

describe('EventEngagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default user setup - return proper UserSession structure
    mockAuthService.getCurrentUser.mockResolvedValue({
      token: 'mock-token',
      user: {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'Member',
        clubId: 1,
        clubTier: 'Expand'
      },
      isAuthenticated: true
    });

    // Set up default axios mock responses
    mockGet.mockImplementation((url: string) => {
      if (url.includes('engagement-analytics')) {
        return Promise.resolve({ data: mockEngagementAnalytics });
      }
      if (url.includes('engagement-insights')) {
        return Promise.resolve({ data: mockMemberInsights });
      }
      if (url.includes('performance-analysis')) {
        return Promise.resolve({ data: mockPerformanceAnalysis });
      }
      if (url.includes('roi-metrics')) {
        return Promise.resolve({ data: mockROIMetrics });
      }
      if (url.includes('/analytics')) {
        return Promise.resolve({ data: mockBasicAnalytics });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('EventEngagementAnalytics Authorization Tests', () => {
    it('should allow Expand tier access to EventEngagementAnalytics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Expand');

      // Act
      const result = await eventEngagementService.getEventEngagementAnalytics(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.eventId).toBe(1);
      expect(mockClubAuthorizationService.hasFeatureAccess).toHaveBeenCalledWith(1, 'EventEngagementAnalytics');
    });

    it('should deny Growth tier access to EventEngagementAnalytics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Growth');

      // Act & Assert
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: EventEngagementAnalytics requires Expand. Current tier: Growth');
    });

    it('should deny Basic tier access to EventEngagementAnalytics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Basic');

      // Act & Assert
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: EventEngagementAnalytics requires Expand. Current tier: Basic');
    });

    it('should deny access when user has no club access', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: No access to this club');
    });
  });

  describe('MemberEngagementInsights Authorization Tests', () => {
    it('should allow Expand tier access to MemberEngagementInsights', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Act
      const result = await eventEngagementService.getMemberEngagementInsights(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].memberId).toBe(1);
      expect(mockClubAuthorizationService.hasFeatureAccess).toHaveBeenCalledWith(1, 'MemberEngagementInsights');
    });

    it('should deny Growth tier access to MemberEngagementInsights', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Growth');

      // Act & Assert
      await expect(eventEngagementService.getMemberEngagementInsights(1, 1))
        .rejects.toThrow('Unauthorized: MemberEngagementInsights requires Expand. Current tier: Growth');
    });
  });

  describe('EventPerformanceAnalysis Authorization Tests', () => {
    it('should allow Expand tier access to EventPerformanceAnalysis', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Act
      const result = await eventEngagementService.getEventPerformanceAnalysis(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.eventId).toBe(1);
      expect(result.performanceScore).toBeDefined();
      expect(mockClubAuthorizationService.hasFeatureAccess).toHaveBeenCalledWith(1, 'EventPerformanceAnalysis');
    });

    it('should deny non-Expand tier access to EventPerformanceAnalysis', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Growth');

      // Act & Assert
      await expect(eventEngagementService.getEventPerformanceAnalysis(1, 1))
        .rejects.toThrow('Unauthorized: EventPerformanceAnalysis requires Expand. Current tier: Growth');
    });
  });

  describe('ROIMetrics Authorization Tests', () => {
    it('should allow Expand tier access to ROIMetrics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Act
      const result = await eventEngagementService.getEventROIMetrics(1, 12);

      // Assert
      expect(result).toBeDefined();
      expect(result.clubId).toBe(1);
      expect(result.roiPercentage).toBeDefined();
      expect(mockClubAuthorizationService.hasFeatureAccess).toHaveBeenCalledWith(1, 'ROIMetrics');
    });

    it('should deny non-Expand tier access to ROIMetrics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Basic');

      // Act & Assert
      await expect(eventEngagementService.getEventROIMetrics(1, 12))
        .rejects.toThrow('Unauthorized: ROIMetrics requires Expand. Current tier: Basic');
    });
  });

  describe('Basic Event Analytics for Growth Tier', () => {
    it('should allow Growth tier access to basic EventAnalytics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Act
      const result = await eventEngagementService.getBasicEventAnalytics(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.eventId).toBe(1);
      expect(result.totalRegistrations).toBeDefined();
      expect(result.attendanceRate).toBeDefined();
      // These should NOT be included for Growth tier
      expect(result.engagementScore).toBeUndefined();
      expect(result.satisfactionRating).toBeUndefined();
      expect(result.engagementLevel).toBeUndefined();
      expect(mockClubAuthorizationService.hasFeatureAccess).toHaveBeenCalledWith(1, 'EventAnalytics');
    });

    it('should deny Basic tier access to EventAnalytics', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(false);
      mockClubAuthorizationService.getClubTier.mockResolvedValue('Basic');

      // Act & Assert
      await expect(eventEngagementService.getBasicEventAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: EventAnalytics requires Growth tier or higher. Current tier: Basic');
    });
  });

  describe('Cross-tier Feature Validation', () => {
    it('should validate tier access before feature access', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: No access to this club');

      // Should not call feature access check if club access is denied
      expect(mockClubAuthorizationService.hasFeatureAccess).not.toHaveBeenCalled();
    });

    it('should handle authorization service errors gracefully', async () => {
      // Arrange
      mockClubAuthorizationService.validateClubAccess.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Database error');
    });
  });

  describe('Unauthenticated User Tests', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);
    });

    it('should deny unauthenticated user access to EventEngagementAnalytics', async () => {
      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: User not authenticated');
    });

    it('should deny unauthenticated user access to MemberEngagementInsights', async () => {
      await expect(eventEngagementService.getMemberEngagementInsights(1, 1))
        .rejects.toThrow('Unauthorized: User not authenticated');
    });

    it('should deny unauthenticated user access to EventPerformanceAnalysis', async () => {
      await expect(eventEngagementService.getEventPerformanceAnalysis(1, 1))
        .rejects.toThrow('Unauthorized: User not authenticated');
    });

    it('should deny unauthenticated user access to ROIMetrics', async () => {
      await expect(eventEngagementService.getEventROIMetrics(1, 12))
        .rejects.toThrow('Unauthorized: User not authenticated');
    });

    it('should deny unauthenticated user access to BasicEventAnalytics', async () => {
      await expect(eventEngagementService.getBasicEventAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: User not authenticated');
    });
  });

  describe('No Club Access Tests', () => {
    beforeEach(() => {
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(false);
    });

    it('should deny access to MemberEngagementInsights when user has no club access', async () => {
      await expect(eventEngagementService.getMemberEngagementInsights(1, 1))
        .rejects.toThrow('Unauthorized: No access to this club');
    });

    it('should deny access to EventPerformanceAnalysis when user has no club access', async () => {
      await expect(eventEngagementService.getEventPerformanceAnalysis(1, 1))
        .rejects.toThrow('Unauthorized: No access to this club');
    });

    it('should deny access to ROIMetrics when user has no club access', async () => {
      await expect(eventEngagementService.getEventROIMetrics(1, 12))
        .rejects.toThrow('Unauthorized: No access to this club');
    });

    it('should deny access to BasicEventAnalytics when user has no club access', async () => {
      await expect(eventEngagementService.getBasicEventAnalytics(1, 1))
        .rejects.toThrow('Unauthorized: No access to this club');
    });
  });

  describe('API Error Handling Tests', () => {
    beforeEach(() => {
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Save original __DEV__ value and set to false for production behavior
      (global as any).__DEV__ = false;
    });

    afterEach(() => {
      // Restore __DEV__
      (global as any).__DEV__ = true;
    });

    it('should handle API errors in getEventEngagementAnalytics (production)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Event engagement analytics are not available. Please try again later.');
    });

    it('should handle API errors in getMemberEngagementInsights (production)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getMemberEngagementInsights(1, 1))
        .rejects.toThrow('Member engagement insights are not available. Please try again later.');
    });

    it('should handle API errors in getEventPerformanceAnalysis (production)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventPerformanceAnalysis(1, 1))
        .rejects.toThrow('Event performance analysis is not available. Please try again later.');
    });

    it('should handle API errors in getEventROIMetrics (production)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventROIMetrics(1, 12))
        .rejects.toThrow('ROI metrics are not available. Please try again later.');
    });

    it('should handle API errors in getBasicEventAnalytics (production)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getBasicEventAnalytics(1, 1))
        .rejects.toThrow('Event analytics are not available. Please try again later.');
    });
  });

  describe('API Error Handling in Dev Mode', () => {
    beforeEach(() => {
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      // Set __DEV__ to true for development behavior
      (global as any).__DEV__ = true;
    });

    it('should log console warning in dev mode for getEventEngagementAnalytics', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventEngagementAnalytics(1, 1))
        .rejects.toThrow('Event engagement analytics are not available. Please try again later.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEngagement] API call failed'),
        'Network error'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log console warning in dev mode for getMemberEngagementInsights', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getMemberEngagementInsights(1, 1))
        .rejects.toThrow('Member engagement insights are not available. Please try again later.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEngagement] API call failed'),
        'Network error'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log console warning in dev mode for getEventPerformanceAnalysis', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventPerformanceAnalysis(1, 1))
        .rejects.toThrow('Event performance analysis is not available. Please try again later.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEngagement] API call failed'),
        'Network error'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log console warning in dev mode for getEventROIMetrics', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getEventROIMetrics(1, 12))
        .rejects.toThrow('ROI metrics are not available. Please try again later.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEngagement] API call failed'),
        'Network error'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log console warning in dev mode for getBasicEventAnalytics', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventEngagementService.getBasicEventAnalytics(1, 1))
        .rejects.toThrow('Event analytics are not available. Please try again later.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEngagement] API call failed'),
        'Network error'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Member Engagement Insights - Without Member ID', () => {
    it('should fetch all member insights when memberId is not provided', async () => {
      mockClubAuthorizationService.validateClubAccess.mockResolvedValue(true);
      mockClubAuthorizationService.hasFeatureAccess.mockResolvedValue(true);

      const result = await eventEngagementService.getMemberEngagementInsights(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/engagement-insights'));
      expect(mockGet).toHaveBeenCalledWith(expect.not.stringContaining('memberId='));
    });
  });
});
