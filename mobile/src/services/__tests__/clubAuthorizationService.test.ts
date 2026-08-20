import { clubAuthorizationService } from '../clubAuthorizationService';
import { authService } from '../authService';

// Mock authService
jest.mock('../authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Access private methods for testing
const privateService = clubAuthorizationService as any;

describe('ClubAuthorizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTierFeatures', () => {
    it('should return features for Basic tier', () => {
      const features = clubAuthorizationService.getTierFeatures('Basic');

      expect(features).toEqual([
        'BasicEventManagement',
        'MemberDirectory',
        'EventRSVP',
        'BasicReporting',
      ]);
    });

    it('should return features for Growth tier', () => {
      const features = clubAuthorizationService.getTierFeatures('Growth');

      expect(features).toContain('BasicEventManagement');
      expect(features).toContain('AdvancedEventManagement');
      expect(features).toContain('EventAnalytics');
      expect(features).toHaveLength(7);
    });

    it('should return features for Unlimited tier', () => {
      const features = clubAuthorizationService.getTierFeatures('Unlimited');

      expect(features).toContain('EventEngagementAnalytics');
      expect(features).toContain('MemberEngagementInsights');
      expect(features).toContain('ROIMetrics');
      expect(features).toHaveLength(13);
    });

    it('should return empty array for unknown tier', () => {
      const features = clubAuthorizationService.getTierFeatures('Premium');

      expect(features).toEqual([]);
    });
  });

  describe('doesTierHaveFeature', () => {
    it('should return true when Basic tier has BasicEventManagement', () => {
      const result = clubAuthorizationService.doesTierHaveFeature(
        'Basic',
        'BasicEventManagement'
      );

      expect(result).toBe(true);
    });

    it('should return false when Basic tier does not have EventAnalytics', () => {
      const result = clubAuthorizationService.doesTierHaveFeature('Basic', 'EventAnalytics');

      expect(result).toBe(false);
    });

    it('should return true when Growth tier has EventAnalytics', () => {
      const result = clubAuthorizationService.doesTierHaveFeature('Growth', 'EventAnalytics');

      expect(result).toBe(true);
    });

    it('should return true when Unlimited tier has ROIMetrics', () => {
      const result = clubAuthorizationService.doesTierHaveFeature('Unlimited', 'ROIMetrics');

      expect(result).toBe(true);
    });

    it('should return false for unknown tier', () => {
      const result = clubAuthorizationService.doesTierHaveFeature(
        'Unknown',
        'BasicEventManagement'
      );

      expect(result).toBe(false);
    });
  });

  describe('validateClubAccess', () => {
    it('should grant access when user is admin', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 100,
          clubId: 1,
          role: 'Admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.validateClubAccess(1, 100);

      expect(result).toBe(true);
    });

    it('should grant access when user is active member', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 200,
          clubId: 1,
          role: 'Member',
          email: 'member@example.com',
          fullName: 'Member User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.validateClubAccess(1, 200);

      expect(result).toBe(true);
    });

    it('should deny access when getCurrentUser returns null', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const result = await clubAuthorizationService.validateClubAccess(1, 300);

      expect(result).toBe(false);
    });

    it('should deny access when getCurrentUser throws error', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth error'));

      const result = await clubAuthorizationService.validateClubAccess(1, 400);

      expect(result).toBe(false);
    });
  });

  describe('hasFeatureAccess', () => {
    it('should grant access to feature available in club tier', async () => {
      // Service returns Unlimited tier by default
      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(true);
    });

    it('should deny access when feature name is empty', async () => {
      const result = await clubAuthorizationService.hasFeatureAccess(1, '');

      expect(result).toBe(false);
    });

    it('should deny access when feature is not in tier', async () => {
      // Mock getClubById to return Basic tier
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Basic Club',
        tier: 'Basic',
        createdByUserId: 1,
        trialExpiresAt: null,
      });

      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(false);
    });

    it('should deny access when trial has expired', async () => {
      const expiredDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Trial Club',
        tier: 'Unlimited',
        createdByUserId: 1,
        trialExpiresAt: expiredDate,
      });

      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(false);
    });

    it('should grant access when trial has not expired', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Trial Club',
        tier: 'Unlimited',
        createdByUserId: 1,
        trialExpiresAt: futureDate,
      });

      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(true);
    });

    it('should handle getClubById returning null', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue(null);

      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(privateService, 'getClubById').mockRejectedValue(new Error('API error'));

      const result = await clubAuthorizationService.hasFeatureAccess(1, 'ROIMetrics');

      expect(result).toBe(false);
    });
  });

  describe('getUserRoleInClub', () => {
    it('should return Owner when user created the club', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'My Club',
        tier: 'Growth',
        createdByUserId: 100,
        trialExpiresAt: null,
      });

      const result = await clubAuthorizationService.getUserRoleInClub(1, 100);

      expect(result).toBe('Owner');
    });

    it('should return Admin when user is admin but not owner', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 200,
          clubId: 1,
          role: 'Admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.getUserRoleInClub(1, 200);

      expect(result).toBe('Admin');
    });

    it('should return Member when user is active member', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 300,
          clubId: 1,
          role: 'Member',
          email: 'member@example.com',
          fullName: 'Member User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.getUserRoleInClub(1, 300);

      expect(result).toBe('Member');
    });

    it('should return None when user has no access', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const result = await clubAuthorizationService.getUserRoleInClub(1, 400);

      expect(result).toBe('None');
    });

    it('should return None on error', async () => {
      jest.spyOn(privateService, 'getClubById').mockRejectedValue(new Error('Error'));

      const result = await clubAuthorizationService.getUserRoleInClub(1, 500);

      expect(result).toBe('None');
    });
  });

  describe('hasAdministrativeAccess', () => {
    it('should return true when user is Owner', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 100,
        trialExpiresAt: null,
      });

      const result = await clubAuthorizationService.hasAdministrativeAccess(1, 100);

      expect(result).toBe(true);
    });

    it('should return true when user is Admin', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 200,
          clubId: 1,
          role: 'Admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.hasAdministrativeAccess(1, 200);

      expect(result).toBe(true);
    });

    it('should return false when user is only Member', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 300,
          clubId: 1,
          role: 'Member',
          email: 'member@example.com',
          fullName: 'Member User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await clubAuthorizationService.hasAdministrativeAccess(1, 300);

      expect(result).toBe(false);
    });

    it('should return false when user has no access', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: 'Growth',
        createdByUserId: 999,
        trialExpiresAt: null,
      });

      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const result = await clubAuthorizationService.hasAdministrativeAccess(1, 400);

      expect(result).toBe(false);
    });
  });

  describe('getClubTier', () => {
    it('should return club tier when club exists', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Premium Club',
        tier: 'Unlimited',
        createdByUserId: 1,
        trialExpiresAt: null,
      });

      const result = await clubAuthorizationService.getClubTier(1);

      expect(result).toBe('Unlimited');
    });

    it('should return Basic tier when club tier is null', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue({
        id: 1,
        name: 'Club',
        tier: null,
        createdByUserId: 1,
        trialExpiresAt: null,
      } as any);

      const result = await clubAuthorizationService.getClubTier(1);

      expect(result).toBe('Basic');
    });

    it('should return Basic tier when getClubById returns null', async () => {
      jest.spyOn(privateService, 'getClubById').mockResolvedValue(null);

      const result = await clubAuthorizationService.getClubTier(1);

      expect(result).toBe('Basic');
    });

    it('should return Basic tier on error', async () => {
      jest.spyOn(privateService, 'getClubById').mockRejectedValue(new Error('Error'));

      const result = await clubAuthorizationService.getClubTier(1);

      expect(result).toBe('Basic');
    });
  });

  describe('isClubAdmin (private method)', () => {
    it('should return true when user is Owner', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 100,
          clubId: 1,
          role: 'Owner',
          email: 'owner@example.com',
          fullName: 'Owner User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await privateService.isClubAdmin(1, 100);

      expect(result).toBe(true);
    });

    it('should return false when user belongs to different club', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 100,
          clubId: 2,
          role: 'Admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await privateService.isClubAdmin(1, 100);

      expect(result).toBe(false);
    });

    it('should return false when userId does not match', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 999,
          clubId: 1,
          role: 'Admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await privateService.isClubAdmin(1, 100);

      expect(result).toBe(false);
    });
  });

  describe('isActiveMember (private method)', () => {
    it('should return true when user ID matches', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 100,
          clubId: 1,
          role: 'Member',
          email: 'member@example.com',
          fullName: 'Member User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await privateService.isActiveMember(1, 100);

      expect(result).toBe(true);
    });

    it('should return false when user ID does not match', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: {
          userId: 999,
          clubId: 1,
          role: 'Member',
          email: 'member@example.com',
          fullName: 'Member User',
          clubTier: 'Unlimited',
        },
        token: 'token',
        isAuthenticated: true,
      });

      const result = await privateService.isActiveMember(1, 100);

      expect(result).toBe(false);
    });

    it('should return false when getCurrentUser returns null', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const result = await privateService.isActiveMember(1, 100);

      expect(result).toBe(false);
    });
  });
});
