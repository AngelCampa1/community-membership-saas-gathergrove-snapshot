/**
 * Club Authorization Service
 * Handles club-level authorization and tier-based feature access control
 */

import { authService } from './authService';

export interface ClubTierFeatures {
  [tier: string]: string[];
}

export interface Club {
  id: number;
  name: string;
  tier: string;
  createdByUserId: number;
  trialExpiresAt: string | null;
}

class ClubAuthorizationService {
  // Define tier-based feature access rules matching backend implementation
  private static readonly TIER_FEATURE_ACCESS: ClubTierFeatures = {
    'Basic': [
      'BasicEventManagement',
      'MemberDirectory', 
      'EventRSVP',
      'BasicReporting'
    ],
    'Growth': [
      'BasicEventManagement',
      'MemberDirectory',
      'EventRSVP', 
      'BasicReporting',
      'AdvancedEventManagement',
      'MemberCommunication',
      'EventAnalytics'
    ],
    'Unlimited': [
      'BasicEventManagement',
      'MemberDirectory',
      'EventRSVP',
      'BasicReporting',
      'AdvancedEventManagement', 
      'MemberCommunication',
      'EventAnalytics',
      'EventEngagementAnalytics',
      'MemberEngagementInsights',
      'EventPerformanceAnalysis',
      'EngagementTrends',
      'EventRecommendations',
      'ROIMetrics'
    ],
    'Expand': [
      'BasicEventManagement',
      'MemberDirectory',
      'EventRSVP',
      'BasicReporting',
      'AdvancedEventManagement', 
      'MemberCommunication',
      'EventAnalytics',
      'EventEngagementAnalytics',
      'MemberEngagementInsights',
      'EventPerformanceAnalysis',
      'EngagementTrends',
      'EventRecommendations',
      'ROIMetrics'
    ]
  };

  /**
   * Validate if a user has access to a specific club
   */
  async validateClubAccess(clubId: number, userId: number): Promise<boolean> {
    try {
      // Check if user is a club admin (owner/admin role)
      const isAdmin = await this.isClubAdmin(clubId, userId);
      if (isAdmin) {
        return true;
      }

      // Check if user is an active member
      const isMember = await this.isActiveMember(clubId, userId);
      return isMember;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a club has access to a specific feature based on tier
   */
  async hasFeatureAccess(clubId: number, featureName: string): Promise<boolean> {
    try {
      if (!featureName) {
        return false;
      }

      const club = await this.getClubById(clubId);
      if (!club) {
        return false;
      }

      // DATE-02 fix: Use explicit timestamp comparison for timezone consistency
      if (club.trialExpiresAt) {
        const expiresAt = new Date(club.trialExpiresAt).getTime();
        if (expiresAt < Date.now()) {
          return false;
        }
      }

      const clubTier = club.tier || 'Basic';

      // Check if the tier has access to the requested feature
      if (ClubAuthorizationService.TIER_FEATURE_ACCESS[clubTier]) {
        const hasAccess = ClubAuthorizationService.TIER_FEATURE_ACCESS[clubTier].includes(featureName);

        if (!hasAccess) {
          /* Feature not available for this tier */
        }

        return hasAccess;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's role within a club
   */
  async getUserRoleInClub(clubId: number, userId: number): Promise<string> {
    try {
      // Check if user is owner (created the club)
      const club = await this.getClubById(clubId);
      if (club && club.createdByUserId === userId) {
        return 'Owner';
      }

      // Check if user is admin
      const isAdmin = await this.isClubAdmin(clubId, userId);
      if (isAdmin) {
        return 'Admin';
      }

      // Check if user is member
      const isMember = await this.isActiveMember(clubId, userId);
      if (isMember) {
        return 'Member';
      }

      return 'None';
    } catch (error) {
      return 'None';
    }
  }

  /**
   * Check if user has administrative permissions in a club
   */
  async hasAdministrativeAccess(clubId: number, userId: number): Promise<boolean> {
    const role = await this.getUserRoleInClub(clubId, userId);
    return role === 'Owner' || role === 'Admin';
  }

  /**
   * Get club tier for a specific club
   */
  async getClubTier(clubId: number): Promise<string> {
    try {
      const club = await this.getClubById(clubId);
      return club?.tier || 'Basic';
    } catch (error) {
      return 'Basic';
    }
  }

  // Private helper methods

  private async getClubById(clubId: number): Promise<Club> {
    // Mock implementation - in real app, this would fetch from API
    return {
      id: clubId,
      name: 'Sample Club',
      tier: 'Expand', // Can be 'Basic', 'Growth', 'Expand', or legacy 'Unlimited'
      createdByUserId: 1,
      trialExpiresAt: null // or a future date
    };
  }

  private async isClubAdmin(clubId: number, userId: number): Promise<boolean> {
    // MOCK-03 fix: Use actual user data instead of hardcoded test values
    // Check if the current authenticated user has admin role for this club
    const currentUser = await authService.getCurrentUser();
    if (!currentUser?.user) {
      return false;
    }

    // User is admin if they have the Admin role and belong to this club
    const isAdmin = currentUser.user.role === 'Admin' || currentUser.user.role === 'Owner';
    const belongsToClub = currentUser.user.clubId === clubId;
    const isCorrectUser = currentUser.user.userId === userId;

    return isAdmin && belongsToClub && isCorrectUser;
  }

  private async isActiveMember(_clubId: number, userId: number): Promise<boolean> {
    // Mock implementation - in real app, this would check member status
    const currentUser = await authService.getCurrentUser();
    
    // For testing, assume user is active member if they have access to the club
    return currentUser?.user?.userId === userId || false;
  }

  /**
   * Get all features available to a specific tier
   */
  getTierFeatures(tier: string): string[] {
    return ClubAuthorizationService.TIER_FEATURE_ACCESS[tier] || [];
  }

  /**
   * Check if a specific tier has access to a feature
   */
  doesTierHaveFeature(tier: string, featureName: string): boolean {
    const tierFeatures = this.getTierFeatures(tier);
    return tierFeatures.includes(featureName);
  }
}

export const clubAuthorizationService = new ClubAuthorizationService();
