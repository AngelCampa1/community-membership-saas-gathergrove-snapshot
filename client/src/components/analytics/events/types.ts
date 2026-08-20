export interface EventAttendanceData {
  eventId: number;
  eventName: string;
  eventDate: string;
  expectedAttendance: number;
  actualAttendance: number;
  attendanceRate: number;
  category: string;
  eventType: 'meeting' | 'workshop' | 'social' | 'tournament' | 'competition' | 'other';
  duration: number; // in minutes
  location: string;
}

export interface EventEngagementMetrics {
  totalEvents: number;
  totalAttendance: number;
  averageAttendanceRate: number;
  memberEngagementScore: number;
  eventSatisfactionScore: number;
  repeatAttendanceRate: number;
  noShowRate: number;
  lastUpdated: string;
}

export interface EventFeedbackData {
  eventId: number;
  eventName: string;
  eventDate: string;
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

export interface EventRecommendation {
  eventType: string;
  category: string;
  recommendedTime: string;
  recommendedDuration: number;
  targetAudience: string[];
  expectedAttendance: number;
  confidence: number;
  reasoning: string[];
  basedOnEvents: string[];
}

export interface MemberEventEngagement {
  memberId: number;
  memberName: string;
  eventsAttended: number;
  totalEventsInvited: number;
  attendanceRate: number;
  averageRating: number;
  preferredEventTypes: string[];
  lastEventAttended: string;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface EventImpactMetrics {
  eventId: number;
  eventName: string;
  membershipGrowth: number;
  memberRetention: number;
  revenueImpact: number;
  followUpEngagement: number;
  socialMediaMentions: number;
  referrals: number;
  overallImpactScore: number;
}

export interface EventTrendData {
  month: string;
  eventsHeld: number;
  totalAttendance: number;
  averageRating: number;
  memberEngagement: number;
  revenueGenerated: number;
}

export interface EventAnalyticsResponse {
  metrics: EventEngagementMetrics;
  attendanceData: EventAttendanceData[];
  feedbackData: EventFeedbackData[];
  recommendations: EventRecommendation[];
  memberEngagement: MemberEventEngagement[];
  impactMetrics: EventImpactMetrics[];
  trendData: EventTrendData[];
  topPerformingEvents: EventAttendanceData[];
  upcomingEvents: EventAttendanceData[];
}

// Additional interfaces for new components
export interface ConversionFunnelData {
  invited: number;
  signedUp: number;
  attended: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface MemberScoreMetrics {
  memberId: number;
  memberName: string;
  overallScore: number;
  attendanceScore: number;
  engagementScore: number;
  consistencyScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  rank: number;
  percentile: number;
}

export interface EventPerformanceAnalytics {
  eventId: number;
  eventName: string;
  performanceScore: number;
  conversionRate: number;
  satisfactionScore: number;
  recommendationScore: number;
  improvements: string[];
  strengths: string[];
}

export interface AnalyticsExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'png';
  includeCharts: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
}