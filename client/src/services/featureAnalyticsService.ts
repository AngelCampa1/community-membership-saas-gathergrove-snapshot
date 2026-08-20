import apiClient from './apiClient';
import { logger } from '@/lib/logger';

export interface TrackFeatureUsageRequest {
  featureName: string;
  platform: string;
  sessionId?: string;
  metadata?: string;
  memberId?: number;
}

export interface FeatureUsageStatistic {
  featureName: string;
  totalUsageEvents: number;
  uniqueUsers: number;
  adoptionRate: number;
  averageUsesPerUser: number;
  lastUsed: string;
  dailyUsage: DailyUsageCount[];
}

export interface DailyUsageCount {
  date: string;
  usageCount: number;
  uniqueUsers: number;
}

export interface PlatformUsageComparison {
  webUsageEvents: number;
  mobileUsageEvents: number;
  webUsagePercentage: number;
  mobileUsagePercentage: number;
  featurePlatformBreakdown: FeaturePlatformUsage[];
}

export interface FeaturePlatformUsage {
  featureName: string;
  webUsage: number;
  mobileUsage: number;
  webPercentage: number;
  mobilePercentage: number;
}

export interface TenureUsagePattern {
  tenureRange: string;
  memberCount: number;
  averageFeatureUsage: number;
  mostUsedFeatures: string[];
}

export interface AdoptionTrendDataPoint {
  date: string;
  featureName: string;
  adoptionRate: number;
  uniqueUsers: number;
  totalEvents: number;
}

export interface FeatureUsageAnalyticsResponse {
  featureUsage: FeatureUsageStatistic[];
  platformUsage: PlatformUsageComparison;
  adoptionTrends: AdoptionTrendDataPoint[];
  tenurePatterns: TenureUsagePattern[];
}

export interface MemberEngagementSummary {
  memberId: number;
  memberName: string;
  overallScore: number;
  engagementLevel: string;
  lastActivity: string;
  daysSinceLastLogin: number;
  scoreBreakdown: EngagementScoreBreakdown;
}

export interface EngagementScoreBreakdown {
  loginScore: number;
  eventScore: number;
  communicationScore: number;
  featureUsageScore: number;
  profileCompletenessScore: number;
}

export interface ClubEngagementSummary {
  averageEngagementScore: number;
  totalMembers: number;
  highlyActiveMembers: number;
  moderateMembers: number;
  inactiveMembers: number;
  retentionRate: number;
}

export interface EngagementDistribution {
  highlyActive: number;
  active: number;
  moderate: number;
  lowEngagement: number;
  inactive: number;
}

export interface EngagementTrendDataPoint {
  date: string;
  averageScore: number;
  activeMembers: number;
  newMembers: number;
  churnedMembers: number;
}

export interface MemberEngagementAnalyticsResponse {
  memberScores: MemberEngagementSummary[];
  clubSummary: ClubEngagementSummary;
  distribution: EngagementDistribution;
  trends: EngagementTrendDataPoint[];
}

class FeatureAnalyticsService {
  /**
   * Track feature usage for engagement analytics
   */
  async trackFeatureUsage(clubId: number, request: TrackFeatureUsageRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/analytics/clubs/${clubId}/feature-usage`,
      request
    );
    return response.data;
  }

  /**
   * Get feature usage analytics for a club
   */
  async getFeatureUsageAnalytics(clubId: number, days: number = 30): Promise<FeatureUsageAnalyticsResponse> {
    const response = await apiClient.get<FeatureUsageAnalyticsResponse>(
      `/analytics/clubs/${clubId}/feature-usage?days=${days}`
    );
    return response.data;
  }

  /**
   * Get member engagement analytics for a club
   */
  async getMemberEngagementAnalytics(clubId: number): Promise<MemberEngagementAnalyticsResponse> {
    const response = await apiClient.get<MemberEngagementAnalyticsResponse>(
      `/analytics/clubs/${clubId}/member-engagement`
    );
    return response.data;
  }

  /**
   * Calculate engagement scores for all members in a club
   */
  async calculateEngagementScores(clubId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/analytics/clubs/${clubId}/calculate-engagement-scores`
    );
    return response.data;
  }

  /**
   * Get members with low engagement scores
   */
  async getLowEngagementMembers(clubId: number, threshold: number = 40): Promise<MemberEngagementSummary[]> {
    const response = await apiClient.get<MemberEngagementSummary[]>(
      `/analytics/clubs/${clubId}/low-engagement-members?threshold=${threshold}`
    );
    return response.data;
  }

  /**
   * Helper method to track feature usage with current session
   */
  trackFeature(clubId: number, featureName: string, platform: string = 'web', metadata?: Record<string, unknown>): void {
    // Get or create session ID
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }

    // Track asynchronously without blocking UI
    this.trackFeatureUsage(clubId, {
      featureName,
      platform,
      sessionId,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }).catch(error => {
      logger.error('Failed to track feature usage', error);
    });
  }
}

export const featureAnalyticsService = new FeatureAnalyticsService();