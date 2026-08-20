import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

/**
 * At-risk member shape consumed by the engagement UI.
 * Fields are derived from the backend MemberEngagementScore + included Member.
 */
export interface AtRiskMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  joinDate: string;
  lastLogin: string;
  currentScore: number;
  previousScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  daysSinceLastLogin: number;
  declineRate: number;
  primaryReason: string;
  secondaryReasons: string[];
  suggestedActions: string[];
  membershipTier: string;
  totalContributions: number;
  eventsAttended: number;
  lastEventAttendance: string;
}

/** Member navigation object as serialized by the backend (camelCase). */
export interface BackendMember {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  joinDate?: string | null;
}

/** MemberEngagementScore as serialized by GET /MemberEngagement/club/{clubId}/at-risk. */
export interface BackendEngagementScore {
  id?: number;
  memberId: number;
  clubId?: number;
  overallScore: number;
  loginScore?: number;
  eventScore?: number;
  communicationScore?: number;
  featureUsageScore?: number;
  profileCompletenessScore?: number;
  lastLoginDate?: string | null;
  daysSinceLastLogin?: number;
  isAtRisk?: boolean;
  engagementLevel?: string;
  activityLevel?: string;
  member?: BackendMember | null;
}

/**
 * Classify a member's risk level from their overall engagement score.
 * Scores are 0-100; lower means more disengaged.
 */
export function classifyRiskLevel(overallScore: number): 'high' | 'medium' | 'low' {
  if (overallScore < 25) return 'high';
  if (overallScore < 35) return 'medium';
  return 'low';
}

const SUB_SCORE_FIELDS = {
  loginScore: true,
  eventScore: true,
  communicationScore: true,
  featureUsageScore: true,
  profileCompletenessScore: true,
} as const;

const REASON_LABELS: Record<keyof typeof SUB_SCORE_FIELDS, string> = {
  loginScore: 'Low login activity',
  eventScore: 'Reduced event participation',
  communicationScore: 'Low communication engagement',
  featureUsageScore: 'Limited feature usage',
  profileCompletenessScore: 'Incomplete profile',
};

const SUGGESTED_ACTIONS: Record<keyof typeof SUB_SCORE_FIELDS, string[]> = {
  loginScore: ['Send a personal check-in message', 'Share a re-engagement reminder'],
  eventScore: ['Invite to an upcoming event', 'Send an event preference survey'],
  communicationScore: ['Reach out directly', 'Add to a re-engagement campaign'],
  featureUsageScore: ['Share a feature usage guide', 'Highlight membership benefits'],
  profileCompletenessScore: ['Prompt to complete their profile', 'Offer onboarding help'],
};

/**
 * Derive the primary disengagement reason from the lowest contributing sub-score.
 * Returns a neutral default when no sub-scores are present.
 */
export function deriveReasons(score: BackendEngagementScore): {
  primaryReason: string;
  suggestedActions: string[];
} {
  const entries = (Object.keys(SUB_SCORE_FIELDS) as Array<keyof typeof SUB_SCORE_FIELDS>)
    .map((key) => ({ key, value: score[key] }))
    .filter((e): e is { key: keyof typeof SUB_SCORE_FIELDS; value: number } => typeof e.value === 'number');

  if (entries.length === 0) {
    return {
      primaryReason: 'Declining engagement score',
      suggestedActions: ['Reach out to check in'],
    };
  }

  const lowest = entries.reduce((min, e) => (e.value < min.value ? e : min));
  return {
    primaryReason: REASON_LABELS[lowest.key],
    suggestedActions: SUGGESTED_ACTIONS[lowest.key],
  };
}

/**
 * Map a backend MemberEngagementScore into the UI's AtRiskMember shape.
 * Only real backend data is used; fields the backend does not provide
 * (historical decline, contributions, event history, tier) default to
 * honest neutral values rather than fabricated figures.
 */
export function mapToAtRiskMember(score: BackendEngagementScore): AtRiskMember {
  const member = score.member ?? {};
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  const overallScore = typeof score.overallScore === 'number' ? score.overallScore : 0;
  const { primaryReason, suggestedActions } = deriveReasons(score);

  return {
    id: String(score.memberId),
    name: fullName || `Member ${score.memberId}`,
    email: member.email ?? '',
    avatar: null,
    joinDate: member.joinDate ?? '',
    lastLogin: score.lastLoginDate ?? '',
    currentScore: overallScore,
    // The at-risk endpoint does not return historical scores; without history
    // we cannot claim a decline figure, so previousScore mirrors current (0% delta).
    previousScore: overallScore,
    riskLevel: classifyRiskLevel(overallScore),
    daysSinceLastLogin: typeof score.daysSinceLastLogin === 'number' ? score.daysSinceLastLogin : 0,
    declineRate: 0,
    primaryReason,
    secondaryReasons: [],
    suggestedActions,
    membershipTier: '',
    totalContributions: 0,
    eventsAttended: 0,
    lastEventAttendance: '',
  };
}

/** Recent-activity summary as serialized by the backend ActivitySummary DTO. */
export interface EngagementActivitySummary {
  totalSessions: number;
  averageSessionDuration: number;
  topFeatureCategory: string;
  daysSinceLastLogin: number;
  peakActivityDay: string;
  peakActivityHour: number;
}

/** Engagement breakdown by category as serialized by the backend EngagementCategoryScore DTO. */
export interface EngagementCategoryScore {
  category: string;
  score: number;
  weight: number;
  contribution: number;
  trend: string;
}

/**
 * MemberEngagementScoreResponse as serialized by GET /MemberEngagement/{memberId}.
 * Mirrors backend/src/GatherGrove.Application/DTOs/MemberEngagementScoreResponse.cs.
 */
export interface MemberEngagementScoreResponse {
  memberId: number;
  memberName: string;
  memberEmail: string;
  overallScore: number;
  communicationScore: number;
  eventParticipationScore: number;
  featureUsageScore: number;
  activityFrequencyScore: number;
  engagementLevel: string;
  engagementColor: string;
  messagesCount: number;
  eventsAttended: number;
  uniqueFeatures: number;
  activeDays: number;
  lastActivity: string;
  calculatedAt: string;
  trend: string;
  trendPercentage: number | null;
  recentActivity: EngagementActivitySummary;
  categoryScores: EngagementCategoryScore[];
  recommendations: string[];
  isAtRisk: boolean;
  needsAttention: boolean;
  isHighlyEngaged: boolean;
}

/**
 * EngagementOverview as serialized by GET /MemberEngagement/club/{clubId}/overview.
 * Mirrors backend EngagementOverview (IMemberEngagementService.cs).
 */
export interface EngagementOverviewResponse {
  totalMembers: number;
  averageScore: number;
  highlyEngaged: number;
  moderatelyEngaged: number;
  atRisk: number;
  activeAlerts: number;
  criticalAlerts: number;
  scoreTrend: number;
  lastCalculated: string;
  componentBreakdown: Record<string, number>;
}

class MemberEngagementService {
  /**
   * Fetch the club-wide engagement overview statistics.
   * Requires Expand tier. The backend returns 403 otherwise, which is
   * surfaced as an ApiErrorClass with status 403 so callers can show an
   * honest upgrade message rather than fabricated metrics.
   */
  async getEngagementOverview(
    clubId: string | number
  ): Promise<EngagementOverviewResponse> {
    try {
      const response = await apiClient.get<EngagementOverviewResponse>(
        `/MemberEngagement/club/${clubId}/overview`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getEngagementOverview' });
    }
  }

  /**
   * Fetch the current engagement score for a single member.
   * Returns null when the backend has no calculated score (404).
   * Backend enforces club-access authorization.
   */
  async getMemberEngagementScore(
    memberId: string | number
  ): Promise<MemberEngagementScoreResponse | null> {
    try {
      const response = await apiClient.get<MemberEngagementScoreResponse>(
        `/MemberEngagement/${memberId}`
      );
      return response.data ?? null;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw ErrorHandler.handleApiError(error, { context: 'getMemberEngagementScore' });
    }
  }

  /**
   * Fetch members at risk of disengagement for a club.
   * Requires Expand tier (backend enforces a 403 otherwise).
   */
  async getAtRiskMembers(clubId: string | number, threshold = 40): Promise<AtRiskMember[]> {
    try {
      const response = await apiClient.get(`/MemberEngagement/club/${clubId}/at-risk`, {
        params: { threshold },
      });
      const data: BackendEngagementScore[] = Array.isArray(response.data) ? response.data : [];
      return data.map(mapToAtRiskMember);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getAtRiskMembers' });
    }
  }
}

export const memberEngagementService = new MemberEngagementService();
