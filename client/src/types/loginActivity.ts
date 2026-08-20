// Types for login activity tracking and member engagement analytics

export interface LoginActivityStats {
  clubId: number;
  periodDays: number;
  totalMembers: number;
  membersWithLogins: number;
  totalLogins: number;
  averageLoginsPerMember: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  inactiveMembers: number;
  loginTrends: LoginTrend[];
}

export interface MemberLoginActivity {
  memberId: number;
  memberName: string;
  email: string;
  lastLoginDate?: string;
  loginCount: number;
  daysSinceLastLogin?: number;
  activityLevel: 'HighlyActive' | 'Moderate' | 'LowActivity' | 'Inactive';
  isAtRisk: boolean;
  loginFrequency: string;
  platformsUsed: string[];
}

export interface LoginTrend {
  date: string;
  totalLogins: number;
  uniqueUsers: number;
  webLogins: number;
  mobileLogins: number;
}

export interface MemberEngagementScore {
  memberId: number;
  memberName: string;
  overallScore: number;
  loginScore: number;
  eventScore: number;
  communicationScore: number;
  featureUsageScore: number;
  profileCompletenessScore: number;
  activityLevel: string;
  lastLoginDate?: string;
  loginStreakDays: number;
  isAtRisk: boolean;
  calculatedDate: string;
}

export interface LoginActivityFilter {
  activityLevel?: 'HighlyActive' | 'Moderate' | 'LowActivity' | 'Inactive' | 'All';
  daysSinceLastLogin?: number;
  isAtRisk?: boolean;
  platform?: 'web' | 'mobile' | 'all';
}