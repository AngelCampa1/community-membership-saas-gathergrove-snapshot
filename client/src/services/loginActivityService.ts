import apiClient from './apiClient';
import { 
  LoginActivityStats, 
  MemberLoginActivity, 
  LoginTrend, 
  MemberEngagementScore as _MemberEngagementScore 
} from '../types/loginActivity';

/**
 * Service for managing login activity tracking and member engagement analytics
 */
export class LoginActivityService {
  // apiClient already carries the /api/v1 baseURL, so paths are relative to it.
  private static readonly BASE_URL = '/analytics/login-activity';

  /**
   * Get login activity statistics for a club
   */
  static async getLoginStats(clubId: number, days: number = 30): Promise<LoginActivityStats> {
    const response = await apiClient.get(`${this.BASE_URL}/stats/${clubId}?days=${days}`);
    return response.data;
  }

  /**
   * Get member login activity details
   */
  static async getMemberLoginActivity(clubId: number, days: number = 30): Promise<MemberLoginActivity[]> {
    const response = await apiClient.get(`${this.BASE_URL}/members/${clubId}?days=${days}`);
    return response.data;
  }

  /**
   * Get inactive members at risk of churn
   */
  static async getInactiveMembers(clubId: number, inactiveDays: number = 30): Promise<MemberLoginActivity[]> {
    const response = await apiClient.get(`${this.BASE_URL}/inactive-members/${clubId}?inactiveDays=${inactiveDays}`);
    return response.data;
  }

  /**
   * Get login trends over time for visualization
   */
  static async getLoginTrends(clubId: number, days: number = 90): Promise<LoginTrend[]> {
    const response = await apiClient.get(`${this.BASE_URL}/trends/${clubId}?days=${days}`);
    return response.data;
  }

  /**
   * Trigger manual engagement score calculation
   */
  static async calculateEngagementScores(clubId: number): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/calculate-engagement-scores/${clubId}`);
  }

  /**
   * Format activity level for display
   */
  static formatActivityLevel(level: string): string {
    switch (level) {
      case 'HighlyActive': return 'Highly Active';
      case 'LowActivity': return 'Low Activity';
      default: return level;
    }
  }

  /**
   * Get activity level color for UI
   */
  static getActivityLevelColor(level: string): string {
    switch (level) {
      case 'HighlyActive': return 'text-success';
      case 'Moderate': return 'text-warning';
      case 'LowActivity': return 'text-warning';
      case 'Inactive': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  }

  /**
   * Calculate days since last login for display
   */
  static formatDaysSinceLastLogin(days?: number): string {
    if (!days) return 'Never';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  /**
   * Filter members by activity criteria
   */
  static filterMemberActivity(
    members: MemberLoginActivity[], 
    filter: {
      activityLevel?: string;
      daysSinceLastLogin?: number;
      isAtRisk?: boolean;
      searchTerm?: string;
    }
  ): MemberLoginActivity[] {
    return members.filter(member => {
      // Activity level filter
      if (filter.activityLevel && filter.activityLevel !== 'All' && member.activityLevel !== filter.activityLevel) {
        return false;
      }

      // Days since last login filter
      if (filter.daysSinceLastLogin && 
          (!member.daysSinceLastLogin || member.daysSinceLastLogin < filter.daysSinceLastLogin)) {
        return false;
      }

      // At-risk filter
      if (filter.isAtRisk !== undefined && member.isAtRisk !== filter.isAtRisk) {
        return false;
      }

      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesName = member.memberName.toLowerCase().includes(searchLower);
        const matchesEmail = member.email.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }
}