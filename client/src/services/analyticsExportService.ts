import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// The premium analytics controller is routed at `api/clubs/{clubId}/analytics/premium`
// (NO `/api/v1`). apiClient's baseURL already includes `/api/v1`, so we must hit these
// endpoints via absolute host-base URLs — matching analyticsService's proven pattern.
const ANALYTICS_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

export interface AnalyticsExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeCategories: ('engagement' | 'events' | 'members' | 'growth' | 'retention')[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  includeComparisons?: boolean;
  includePredictions?: boolean;
  includeSegmentation?: boolean;
}

export interface EngagementMetrics {
  totalEngagementScore: number;
  averageEngagementScore: number;
  engagementTrend: number; // percentage change
  topEngagedMembers: Array<{
    memberId: string;
    memberName: string;
    engagementScore: number;
    eventsAttended: number;
  }>;
  engagementBySegment: Record<string, number>;
  dailyEngagement: Array<{
    date: string;
    score: number;
    activeMembers: number;
  }>;
}

export interface EventAnalytics {
  totalEvents: number;
  averageAttendance: number;
  attendanceRate: number;
  mostPopularEvents: Array<{
    eventId: string;
    eventName: string;
    attendees: number;
    rsvpCount: number;
    attendanceRate: number;
    engagementScore: number;
  }>;
  eventTypeAnalysis: Record<string, {
    count: number;
    averageAttendance: number;
    averageEngagement: number;
  }>;
  timeSlotAnalysis: Record<string, {
    eventCount: number;
    averageAttendance: number;
  }>;
}

export interface MemberAnalytics {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  churnedMembers: number;
  retentionRate: number;
  growthRate: number;
  membersByType: Record<string, number>;
  engagementDistribution: {
    high: number;
    medium: number;
    low: number;
    inactive: number;
  };
  cohortAnalysis: Array<{
    cohort: string;
    size: number;
    retentionRates: number[];
  }>;
}

export interface GrowthMetrics {
  memberGrowthRate: number;
  eventGrowthRate: number;
  engagementGrowthRate: number;
  revenueGrowthRate: number;
  monthlyGrowthTrend: Array<{
    month: string;
    newMembers: number;
    churnedMembers: number;
    netGrowth: number;
    growthRate: number;
  }>;
  acquisitionChannels: Record<string, {
    count: number;
    retentionRate: number;
    engagementScore: number;
  }>;
}

export interface AnalyticsExportData {
  metadata: {
    clubId: number;
    exportDate: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    granularity: string;
    categories: string[];
  };
  engagement?: EngagementMetrics;
  events?: EventAnalytics;
  members?: MemberAnalytics;
  growth?: GrowthMetrics;
  rawData?: {
    memberActivity: Array<{
      memberId: string;
      date: string;
      activityType: string;
      engagementValue: number;
    }>;
    eventMetrics: Array<{
      eventId: string;
      date: string;
      rsvpCount: number;
      attendeeCount: number;
      engagementMetrics: Record<string, number>;
    }>;
  };
}

const DEFAULT_LAST_30_DAYS = (): { startDate: string; endDate: string } => ({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

// Maps the UI export category to the backend `DataType` understood by the premium
// analytics export endpoint. Falls back to 'engagement' for empty/unknown categories.
const CATEGORY_TO_DATA_TYPE: Record<string, string> = {
  engagement: 'engagement',
  events: 'events',
  members: 'segmentation',
  growth: 'cohorts',
  retention: 'cohorts',
};

class AnalyticsExportService {
  /**
   * Exports analytics data E2E: POSTs an export request to the premium controller
   * (which generates a file and returns its download URL + filename), then fetches
   * that file as a Blob. The backend only produces csv/excel/pdf — JSON is rejected.
   */
  async exportAnalyticsData(clubId: number, options: AnalyticsExportOptions): Promise<Blob> {
    try {
      if (options.format === 'json') {
        throw ErrorHandler.handleApiError(
          new Error('JSON format is not supported for analytics exports'),
          { context: 'exportAnalyticsData' }
        );
      }

      const dataType = CATEGORY_TO_DATA_TYPE[options.includeCategories[0]] ?? 'engagement';
      const format = options.format; // 'csv' | 'excel' | 'pdf' (json rejected above)

      const exportResponse = await apiClient.post<{ downloadUrl: string; filename: string }>(
        `${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/export`,
        {
          dataType,
          format,
          startDate: options.dateRange.startDate,
          endDate: options.dateRange.endDate,
        }
      );

      const { filename } = exportResponse.data;

      const fileResponse = await apiClient.get(
        `${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/downloads/${filename}`,
        { responseType: 'blob' }
      );

      return fileResponse.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'exportAnalyticsData' });
    }
  }

  /**
   * Convenience export of event analytics as a downloadable file.
   * Used by the data export center UI.
   */
  async exportEventAnalytics(clubId: number, options: { format: 'csv' | 'excel' | 'json' | 'pdf' }): Promise<Blob> {
    return this.exportAnalyticsData(clubId, {
      format: options.format,
      dateRange: DEFAULT_LAST_30_DAYS(),
      includeCategories: ['events'],
      granularity: 'daily',
    });
  }

  /**
   * Convenience export of engagement data as a downloadable file.
   * Used by the data export center UI.
   */
  async exportEngagementData(clubId: number, options: { format: 'csv' | 'excel' | 'json' | 'pdf' }): Promise<Blob> {
    return this.exportAnalyticsData(clubId, {
      format: options.format,
      dateRange: DEFAULT_LAST_30_DAYS(),
      includeCategories: ['engagement'],
      granularity: 'daily',
    });
  }

  async getEngagementAnalytics(clubId: number, dateRange: { startDate: string; endDate: string }): Promise<EngagementMetrics> {
    try {
      // MemberEngagement genuinely lives under /api/v1 (apiClient prepends the baseURL).
      const response = await apiClient.get(`/MemberEngagement/club/${clubId}/overview`, {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getEngagementAnalytics' });
    }
  }

  async getMemberAnalytics(clubId: number, dateRange: { startDate: string; endDate: string }): Promise<MemberAnalytics> {
    try {
      const response = await apiClient.get(`${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/segmentation`, {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getMemberAnalytics' });
    }
  }

  async getGrowthMetrics(clubId: number, dateRange: { startDate: string; endDate: string }): Promise<GrowthMetrics> {
    try {
      const response = await apiClient.get(`${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/cohorts`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getGrowthMetrics' });
    }
  }

  /**
   * Exports a custom selection of metrics. The premium export endpoint does not accept
   * arbitrary metric queries; it exports by `dataType`. We map the requested queries to
   * the closest supported dataType (falling back to engagement) and run the same
   * POST-then-GET-blob flow as {@link exportAnalyticsData}. JSON is not produced by the
   * backend, so it is rejected up front rather than failing opaquely downstream.
   */
  async exportCustomMetrics(clubId: number, metricQueries: string[], options: AnalyticsExportOptions): Promise<Blob> {
    try {
      if (options.format === 'json') {
        throw ErrorHandler.handleApiError(
          new Error('JSON format is not supported for analytics exports'),
          { context: 'exportCustomMetrics' }
        );
      }

      // Derive the backend dataType from the first metric query, then the export
      // category, defaulting to engagement when neither maps to a known dataType.
      const dataType =
        CATEGORY_TO_DATA_TYPE[metricQueries[0]] ??
        CATEGORY_TO_DATA_TYPE[options.includeCategories[0]] ??
        'engagement';

      const exportResponse = await apiClient.post<{ downloadUrl: string; filename: string }>(
        `${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/export`,
        {
          dataType,
          format: options.format,
          startDate: options.dateRange.startDate,
          endDate: options.dateRange.endDate,
        }
      );

      const { filename } = exportResponse.data;

      const fileResponse = await apiClient.get(
        `${ANALYTICS_API_BASE}/api/clubs/${clubId}/analytics/premium/downloads/${filename}`,
        { responseType: 'blob' }
      );

      return fileResponse.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'exportCustomMetrics' });
    }
  }

  generateEngagementCSV(metrics: EngagementMetrics): string {
    const headers = ['Date', 'Engagement Score', 'Active Members'];
    const rows = metrics.dailyEngagement.map(day => [
      day.date,
      day.score.toString(),
      day.activeMembers.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  generateEventAnalyticsCSV(analytics: EventAnalytics): string {
    const headers = [
      'Event Name',
      'Event ID',
      'Attendees',
      'RSVP Count',
      'Attendance Rate',
      'Engagement Score'
    ];

    const rows = analytics.mostPopularEvents.map(event => [
      this.escapeCSV(event.eventName),
      event.eventId,
      event.attendees.toString(),
      event.rsvpCount.toString(),
      (event.attendanceRate * 100).toFixed(1) + '%',
      event.engagementScore.toFixed(1)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  generateMemberAnalyticsCSV(analytics: MemberAnalytics): string {
    const headers = [
      'Metric',
      'Value'
    ];

    const rows = [
      ['Total Members', analytics.totalMembers.toString()],
      ['Active Members', analytics.activeMembers.toString()],
      ['New Members', analytics.newMembers.toString()],
      ['Churned Members', analytics.churnedMembers.toString()],
      ['Retention Rate', (analytics.retentionRate * 100).toFixed(1) + '%'],
      ['Growth Rate', (analytics.growthRate * 100).toFixed(1) + '%']
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  calculateTrends(currentPeriod: Record<string, unknown>, previousPeriod: Record<string, unknown>): Record<string, number> {
    const trends: Record<string, number> = {};

    Object.keys(currentPeriod).forEach(key => {
      if (typeof currentPeriod[key] === 'number' && typeof previousPeriod[key] === 'number') {
        const current = currentPeriod[key] as number;
        const previous = previousPeriod[key] as number;
        const change = previous > 0
          ? ((current - previous) / previous) * 100
          : 0;
        trends[key] = change;
      }
    });

    return trends;
  }

  segmentMembers<T extends { engagementScore?: number; lastActivityDays?: number }>(
    members: T[],
    criteria: string
  ): Record<string, T[]> {
    switch (criteria) {
      case 'engagement':
        return {
          high: members.filter(m => (m.engagementScore ?? 0) >= 80),
          medium: members.filter(m => (m.engagementScore ?? 0) >= 50 && (m.engagementScore ?? 0) < 80),
          low: members.filter(m => (m.engagementScore ?? 0) >= 20 && (m.engagementScore ?? 0) < 50),
          inactive: members.filter(m => (m.engagementScore ?? 0) < 20)
        };

      case 'activity':
        return {
          active: members.filter(m => (m.lastActivityDays ?? Infinity) <= 7),
          moderate: members.filter(m => (m.lastActivityDays ?? Infinity) > 7 && (m.lastActivityDays ?? Infinity) <= 30),
          inactive: members.filter(m => (m.lastActivityDays ?? Infinity) > 30)
        };

      default:
        return { all: members };
    }
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export const analyticsExportService = new AnalyticsExportService();
