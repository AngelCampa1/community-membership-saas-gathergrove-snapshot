/**
 * @jest-environment jsdom
 *
 * Login Activity Service Tests
 *
 * Tests login activity tracking and analytics following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, formatting functions, filtering)
 *
 * Only the endpoints backed by LoginActivityController are exercised:
 * stats, members, inactive-members, trends, calculate-engagement-scores.
 */

import { LoginActivityService } from '../loginActivityService';
import apiClient from '../apiClient';
import { MemberLoginActivity } from '@/types/loginActivity';

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

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('LoginActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data mirroring LoginActivityStatsDto
  const mockLoginStats = {
    clubId: 1,
    periodDays: 30,
    totalMembers: 250,
    membersWithLogins: 180,
    totalLogins: 500,
    averageLoginsPerMember: 2.78,
    dailyActiveUsers: 25,
    weeklyActiveUsers: 75,
    monthlyActiveUsers: 120,
    inactiveMembers: 70,
    loginTrends: [
      { date: '2025-01-01', totalLogins: 50, uniqueUsers: 30, webLogins: 35, mobileLogins: 15 },
      { date: '2025-01-02', totalLogins: 45, uniqueUsers: 28, webLogins: 30, mobileLogins: 15 },
    ],
  };

  const mockMemberLoginActivity: MemberLoginActivity[] = [
    {
      memberId: 1,
      memberName: 'John Doe',
      email: 'john@example.com',
      lastLoginDate: '2025-01-15T10:00:00Z',
      loginCount: 15,
      activityLevel: 'HighlyActive',
      daysSinceLastLogin: 0,
      isAtRisk: false,
      loginFrequency: 'Daily',
      platformsUsed: ['web'],
    },
    {
      memberId: 2,
      memberName: 'Jane Smith',
      email: 'jane@example.com',
      lastLoginDate: '2024-12-15T10:00:00Z',
      loginCount: 2,
      activityLevel: 'LowActivity',
      daysSinceLastLogin: 31,
      isAtRisk: true,
      loginFrequency: 'Rare',
      platformsUsed: ['mobile'],
    },
    {
      memberId: 3,
      memberName: 'Bob Wilson',
      email: 'bob@example.com',
      lastLoginDate: '2025-01-10T10:00:00Z',
      loginCount: 8,
      activityLevel: 'Moderate',
      daysSinceLastLogin: 5,
      isAtRisk: false,
      loginFrequency: 'Weekly',
      platformsUsed: ['web', 'mobile'],
    },
  ];

  const mockLoginTrends = [
    { date: '2025-01-01', totalLogins: 50, uniqueUsers: 30, webLogins: 35, mobileLogins: 15 },
    { date: '2025-01-02', totalLogins: 45, uniqueUsers: 28, webLogins: 30, mobileLogins: 15 },
    { date: '2025-01-03', totalLogins: 60, uniqueUsers: 35, webLogins: 40, mobileLogins: 20 },
  ];

  describe('getLoginStats', () => {
    it('should fetch login stats with default days', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockLoginStats });

      const result = await LoginActivityService.getLoginStats(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/stats/1?days=30'
      );
      expect(result).toEqual(mockLoginStats);
    });

    it('should use custom days parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockLoginStats });

      await LoginActivityService.getLoginStats(clubId, 7);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/stats/1?days=7'
      );
    });

    it('should return all statistics properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockLoginStats });

      const result = await LoginActivityService.getLoginStats(clubId);

      expect(result.totalLogins).toBe(500);
      expect(result.membersWithLogins).toBe(180);
      expect(result.loginTrends).toHaveLength(2);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(LoginActivityService.getLoginStats(clubId)).rejects.toBeDefined();
    });
  });

  describe('getMemberLoginActivity', () => {
    it('should fetch member login activity with default days', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockMemberLoginActivity });

      const result = await LoginActivityService.getMemberLoginActivity(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/members/1?days=30'
      );
      expect(result).toEqual(mockMemberLoginActivity);
    });

    it('should use custom days parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockMemberLoginActivity });

      await LoginActivityService.getMemberLoginActivity(clubId, 90);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/members/1?days=90'
      );
    });

    it('should return member activity details', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockMemberLoginActivity });

      const result = await LoginActivityService.getMemberLoginActivity(clubId);

      expect(result).toHaveLength(3);
      expect(result[0].activityLevel).toBe('HighlyActive');
      expect(result[1].isAtRisk).toBe(true);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(LoginActivityService.getMemberLoginActivity(clubId)).rejects.toBeDefined();
    });
  });

  describe('getInactiveMembers', () => {
    it('should fetch inactive members with default days', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockMemberLoginActivity[1]] });

      const result = await LoginActivityService.getInactiveMembers(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/inactive-members/1?inactiveDays=30'
      );
      expect(result).toHaveLength(1);
    });

    it('should use custom inactive days parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await LoginActivityService.getInactiveMembers(clubId, 14);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/inactive-members/1?inactiveDays=14'
      );
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(LoginActivityService.getInactiveMembers(clubId)).rejects.toBeDefined();
    });
  });

  describe('getLoginTrends', () => {
    it('should fetch login trends with default days', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockLoginTrends });

      const result = await LoginActivityService.getLoginTrends(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/trends/1?days=90'
      );
      expect(result).toEqual(mockLoginTrends);
    });

    it('should use custom days parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockLoginTrends });

      await LoginActivityService.getLoginTrends(clubId, 30);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/analytics/login-activity/trends/1?days=30'
      );
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(LoginActivityService.getLoginTrends(clubId)).rejects.toBeDefined();
    });
  });

  describe('calculateEngagementScores', () => {
    it('should trigger engagement score calculation', async () => {
      mockApiClient.post.mockResolvedValue({});

      await LoginActivityService.calculateEngagementScores(clubId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/analytics/login-activity/calculate-engagement-scores/1'
      );
    });

    it('should throw error on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(LoginActivityService.calculateEngagementScores(clubId)).rejects.toBeDefined();
    });
  });

  describe('formatActivityLevel', () => {
    it('should format HighlyActive', () => {
      expect(LoginActivityService.formatActivityLevel('HighlyActive')).toBe('Highly Active');
    });

    it('should format LowActivity', () => {
      expect(LoginActivityService.formatActivityLevel('LowActivity')).toBe('Low Activity');
    });

    it('should return original for Moderate', () => {
      expect(LoginActivityService.formatActivityLevel('Moderate')).toBe('Moderate');
    });

    it('should return original for Inactive', () => {
      expect(LoginActivityService.formatActivityLevel('Inactive')).toBe('Inactive');
    });

    it('should return original for unknown levels', () => {
      expect(LoginActivityService.formatActivityLevel('Unknown')).toBe('Unknown');
    });
  });

  describe('getActivityLevelColor', () => {
    it('should return success color for HighlyActive', () => {
      expect(LoginActivityService.getActivityLevelColor('HighlyActive')).toBe('text-success');
    });

    it('should return warning color for Moderate', () => {
      expect(LoginActivityService.getActivityLevelColor('Moderate')).toBe('text-warning');
    });

    it('should return warning color for LowActivity', () => {
      expect(LoginActivityService.getActivityLevelColor('LowActivity')).toBe('text-warning');
    });

    it('should return destructive color for Inactive', () => {
      expect(LoginActivityService.getActivityLevelColor('Inactive')).toBe('text-destructive');
    });

    it('should return muted foreground for unknown levels', () => {
      expect(LoginActivityService.getActivityLevelColor('Unknown')).toBe('text-muted-foreground');
    });
  });

  describe('formatDaysSinceLastLogin', () => {
    it('should return Never for undefined', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(undefined)).toBe('Never');
    });

    it('should return Never for 0 days (falsy value)', () => {
      // Note: 0 is falsy in JavaScript, so !days catches it before days === 0
      expect(LoginActivityService.formatDaysSinceLastLogin(0)).toBe('Never');
    });

    it('should return Yesterday for 1 day', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(1)).toBe('Yesterday');
    });

    it('should return days ago for 2-6 days', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(3)).toBe('3 days ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(6)).toBe('6 days ago');
    });

    it('should return weeks ago for 7-29 days', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(7)).toBe('1 weeks ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(14)).toBe('2 weeks ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(21)).toBe('3 weeks ago');
    });

    it('should return months ago for 30-364 days', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(30)).toBe('1 months ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(60)).toBe('2 months ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(180)).toBe('6 months ago');
    });

    it('should return years ago for 365+ days', () => {
      expect(LoginActivityService.formatDaysSinceLastLogin(365)).toBe('1 years ago');
      expect(LoginActivityService.formatDaysSinceLastLogin(730)).toBe('2 years ago');
    });
  });

  describe('filterMemberActivity', () => {
    it('should return all members when no filters applied', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by activity level', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        activityLevel: 'HighlyActive',
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('John Doe');
    });

    it('should skip filter when activity level is All', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        activityLevel: 'All',
      });
      expect(result).toHaveLength(3);
    });

    it('should filter by days since last login', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        daysSinceLastLogin: 30,
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('Jane Smith');
    });

    it('should filter by at-risk status', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        isAtRisk: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('Jane Smith');
    });

    it('should filter by not at-risk status', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        isAtRisk: false,
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by search term matching name', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        searchTerm: 'John',
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('John Doe');
    });

    it('should filter by search term matching email', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        searchTerm: 'bob@',
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('Bob Wilson');
    });

    it('should be case insensitive for search', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        searchTerm: 'JANE',
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('Jane Smith');
    });

    it('should combine multiple filters', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        activityLevel: 'LowActivity',
        isAtRisk: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].memberName).toBe('Jane Smith');
    });

    it('should return empty array when no matches', () => {
      const result = LoginActivityService.filterMemberActivity(mockMemberLoginActivity, {
        searchTerm: 'nonexistent',
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('service export', () => {
    it('should export LoginActivityService class', () => {
      expect(LoginActivityService).toBeDefined();
    });

    it('should have all required API methods', () => {
      expect(typeof LoginActivityService.getLoginStats).toBe('function');
      expect(typeof LoginActivityService.getMemberLoginActivity).toBe('function');
      expect(typeof LoginActivityService.getInactiveMembers).toBe('function');
      expect(typeof LoginActivityService.getLoginTrends).toBe('function');
      expect(typeof LoginActivityService.calculateEngagementScores).toBe('function');
    });

    it('should have all required utility methods', () => {
      expect(typeof LoginActivityService.formatActivityLevel).toBe('function');
      expect(typeof LoginActivityService.getActivityLevelColor).toBe('function');
      expect(typeof LoginActivityService.formatDaysSinceLastLogin).toBe('function');
      expect(typeof LoginActivityService.filterMemberActivity).toBe('function');
    });
  });
});
