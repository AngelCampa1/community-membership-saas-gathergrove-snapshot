/**
 * ARCHITECTURE DECISION RECORD: Event Data Type Hierarchies
 * 
 * Problem: Multiple conflicting event data types causing TypeScript compilation errors
 * - EventPerformanceSummary vs EventAttendanceData type mismatches
 * - Missing location, expectedAttendance properties in EventEngagementDashboard
 * - Inconsistent data structures across analytics components
 * 
 * Solution: Unified hierarchical type system with proper inheritance and composition
 */

// Base event interface with common properties
export interface BaseEvent {
  eventId: number;
  eventName: string;
  eventDate: Date | string;
  eventType?: 'meeting' | 'workshop' | 'social' | 'tournament' | 'competition' | 'other';
  category?: string;
  duration?: number; // in minutes
  location?: string;
  eventLocation?: string; // Alternative property name
}

// Core attendance data extending base event
export interface EventAttendanceData extends BaseEvent {
  expectedAttendance: number;
  actualAttendance: number;
  totalRsvps: number;
  totalAttended: number;
  attendanceRate: number;
  rsvpRate: number;
  noShowRate?: number;
  engagementScore?: number;
  performanceScore?: number;
  totalRsvpCount?: number; // Alternative to totalRsvps
}

// Performance metrics extending attendance data
export interface EventPerformanceSummary extends EventAttendanceData {
  engagementScore: number;
  performanceScore: number;
  satisfactionScore?: number;
  recommendationScore?: number;
  improvementSuggestions?: string[];
  strengths?: string[];
  // Explicitly add inherited properties for TypeScript clarity
  eventLocation?: string;
  totalRsvpCount?: number;
}

// Complete analytics data with all metrics
export interface EventAnalyticsData extends EventPerformanceSummary {
  // Additional analytics fields
  conversionRate?: number;
  memberEngagementBreakdown?: MemberEngagementMetric[];
  feedbackData?: EventFeedbackData;
  impactMetrics?: EventImpactMetrics;
}

// Member engagement metrics for specific events
export interface MemberEngagementMetric {
  memberId: number;
  memberName: string;
  attended: boolean;
  rsvped: boolean;
  rating?: number;
  feedback?: string;
  engagementLevel: 'high' | 'medium' | 'low';
}

// Feedback data structure
export interface EventFeedbackData {
  totalResponses: number;
  overallRating: number;
  ratings: {
    organization: number;
    content: number;
    venue: number;
    timing: number;
    value: number;
  };
  feedback: {
    positive: string[];
    negative: string[];
    suggestions: string[];
  };
  npsScore: number;
  responseRate: number;
}

// Impact metrics structure
export interface EventImpactMetrics {
  membershipGrowth: number;
  memberRetention: number;
  revenueImpact: number;
  followUpEngagement: number;
  socialMediaMentions: number;
  referrals: number;
  overallImpactScore: number;
}

// Dashboard-specific data structure
export interface EventDashboardData {
  clubId: number;
  clubName: string;
  analyticsDateRange: {
    start: Date | string;
    end: Date | string;
  };
  overallEngagementScore: number;
  eventMetrics: EventPerformanceSummary[];
  memberEngagementBreakdown: MemberEngagement[];
  upcomingEvents: EventAttendanceData[];
  topPerformingEvents: EventPerformanceSummary[];
  keyInsights: string[];
  recommendations: string[];
}

// Member engagement data for dashboard
export interface MemberEngagement {
  memberId: number;
  memberName: string;
  engagementLevel: 'success' | 'warning' | 'destructive';
  eventAttendanceRate: number;
  overallScore: number;
  eventsAttended?: number;
  totalEventsInvited?: number;
  averageRating?: number;
  engagementTrend?: 'increasing' | 'stable' | 'decreasing';
  lastEventAttended?: Date | string;
  preferredEventTypes?: string[];
}

// Enhanced member event engagement with all properties for MemberEventScoreCard
export interface MemberEventEngagement extends MemberEngagement {
  eventsAttended: number;
  totalEventsInvited: number;
  averageRating: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  lastEventAttended: Date | string;
  preferredEventTypes: string[];
  // Add the missing engagement property
  engagement?: {
    level: string;
    color: string;
    icon: React.ReactNode;
  };
}

// Type guards for safe type checking
export const isEventAttendanceData = (event: unknown): event is EventAttendanceData => {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return !!(e && 
    typeof e.eventId === 'number' &&
    typeof e.eventName === 'string' &&
    typeof e.expectedAttendance === 'number' &&
    typeof e.actualAttendance === 'number' &&
    typeof e.attendanceRate === 'number');
};

export const isEventPerformanceSummary = (event: unknown): event is EventPerformanceSummary => {
  return isEventAttendanceData(event) &&
    typeof event.engagementScore === 'number' &&
    typeof event.performanceScore === 'number';
};

export const isMemberEventEngagement = (member: unknown): member is MemberEventEngagement => {
  if (!member || typeof member !== 'object') return false;
  const m = member as Record<string, unknown>;
  return !!(m &&
    typeof m.memberId === 'number' &&
    typeof m.memberName === 'string' &&
    typeof m.eventsAttended === 'number' &&
    typeof m.totalEventsInvited === 'number' &&
    typeof m.averageRating === 'number' &&
    typeof m.engagementTrend === 'string' &&
    Array.isArray(m.preferredEventTypes));
};

// Utility types for common patterns
export type EventDataUnion = BaseEvent | EventAttendanceData | EventPerformanceSummary | EventAnalyticsData;
export type MemberEngagementUnion = MemberEngagement | MemberEventEngagement;

// Safe access utilities
export const safeEventAccess = {
  getLocation: (event: BaseEvent): string => event.location || 'TBA',
  getExpectedAttendance: (event: EventAttendanceData | undefined): number => event?.expectedAttendance || 0,
  getEngagementScore: (event: EventPerformanceSummary | undefined): number => event?.engagementScore || 0,
  getUpcomingEventsLength: (events: EventAttendanceData[] | undefined): number => events?.length || 0,
};

export const safeMemberAccess = {
  getEngagementProperty: (member: MemberEventEngagement): NonNullable<MemberEventEngagement['engagement']> =>
    member.engagement || { level: 'Unknown', color: 'text-muted-foreground', icon: null },
  getPreferredEventTypes: (member: MemberEventEngagement): string[] => member.preferredEventTypes || [],
  getLastEventAttended: (member: MemberEventEngagement): Date =>
    new Date(member.lastEventAttended || Date.now()),
};