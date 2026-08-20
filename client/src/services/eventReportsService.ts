import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

export interface ReportOptions {
  startDate: string;
  endDate: string;
  eventIds?: string[];
  includeCharts?: boolean;
  includeMemberDetails?: boolean;
  format?: 'pdf' | 'xlsx' | 'csv';
  period?: string;
  lookbackDays?: number;
}

export interface AttendanceDataPoint {
  date: string;
  eventName: string;
  rsvps: number;
  attended: number;
  attendanceRate: number;
}

export interface EngagementInsights {
  topPerformingEvents: Array<{ id: string; name: string; score: number }>;
  trends: Record<string, number>;
  recommendations: string[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
  change: number;
}

export interface MemberSummaryItem {
  memberId: number;
  name: string;
  eventsAttended: number;
  attendanceRate: number;
}

export interface ReportData {
  metadata: {
    clubId: number;
    reportType: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    generatedAt: string;
    eventsIncluded: number;
    totalMembers: number;
  };
  summary: {
    totalEvents: number;
    totalRSVPs: number;
    totalAttendees: number;
    averageAttendanceRate: number;
    highestEngagementEvent: {
      id: string;
      name: string;
      date: string;
      attendanceRate: number;
    };
    overallEngagementScore: number;
  };
  metrics: Record<string, number | string>;
  attendanceData: AttendanceDataPoint[];
  engagementInsights: EngagementInsights;
  trendData: TrendDataPoint[];
  memberSummary: MemberSummaryItem[];
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    actions: string[];
  }>;
}

/**
 * Event reporting service.
 *
 * These methods proxy the backend event-report endpoints. On failure they
 * propagate a normalized error (via ErrorHandler) so the UI can surface an
 * honest failure state. They MUST NOT fabricate report data or export blobs —
 * returning fake "sample" data would silently mislead admins into believing
 * they are looking at real figures (violates the project honesty rule).
 */
class EventReportsService {
  async generateComprehensiveReport(clubId: number, options: ReportOptions): Promise<{ data: ReportData }> {
    try {
      const response = await apiClient.post(`/events/${clubId}/reports/comprehensive`, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'generateComprehensiveReport' });
    }
  }

  async exportAttendanceData(clubId: number, options: ReportOptions): Promise<Blob> {
    try {
      const response = await apiClient.post(`/events/${clubId}/reports/attendance/export`, options, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'exportAttendanceData' });
    }
  }

  async exportEngagementMetrics(clubId: number, options: ReportOptions): Promise<Blob> {
    try {
      const response = await apiClient.post(`/events/${clubId}/reports/engagement/export`, options, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'exportEngagementMetrics' });
    }
  }

  async exportMemberParticipation(clubId: number, options: ReportOptions): Promise<Blob> {
    try {
      const response = await apiClient.post(`/events/${clubId}/reports/members/export`, options, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'exportMemberParticipation' });
    }
  }
}

export const eventReportsService = new EventReportsService();
