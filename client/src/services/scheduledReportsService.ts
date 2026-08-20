import apiClient from './apiClient';

/**
 * Scheduled reports — wired to the real backend ExportController.
 *
 * ExportController is mounted at `[Route("api")]` (the only backend controller
 * without the `/api/v1` segment), so these calls target the host root plus an
 * explicit `/api/...` path through apiClient (axios keeps interceptors and
 * withCredentials when handed an absolute URL). This mirrors the proven pattern
 * in memberDataExportService / analyticsExportService.
 *
 * The backend has NO JsonStringEnumConverter registered, so enum values
 * (format, frequency) cross the wire as their integer ordinals, not names.
 *
 * Backend scheduled-report endpoints:
 *   POST   api/clubs/{clubId}/reports/scheduled
 *   GET    api/clubs/{clubId}/reports/scheduled
 *   PUT    api/reports/scheduled/{scheduleId}
 *   DELETE api/reports/scheduled/{scheduleId}
 *   POST   api/reports/scheduled/{scheduleId}/run
 *   GET    api/reports/scheduled/{scheduleId}/history?limit=50
 */
const SCHEDULED_REPORTS_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

/** Backend Domain.Enums.ExportFormat ordinals (CSV=0, Excel=1, PDF=2, JSON=3). */
const EXPORT_FORMAT_CODE: Record<'csv' | 'excel' | 'pdf' | 'json', number> = {
  csv: 0,
  excel: 1,
  pdf: 2,
  json: 3,
};

/**
 * Backend Domain.Enums.ReportFrequency ordinals
 * (Daily=0, Weekly=1, Monthly=2, Quarterly=3, Annually=4).
 * The backend has NO 'once' frequency.
 */
const REPORT_FREQUENCY_CODE: Record<
  'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually',
  number
> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  quarterly: 3,
  annually: 4,
};

/** Convert a client "HH:MM" schedule time into a .NET TimeSpan "HH:MM:SS". */
const toDeliveryTime = (time?: string): string | undefined => {
  if (!time) return undefined;
  // Already HH:MM:SS — pass through; otherwise append seconds.
  return /^\d{1,2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`;
};

export interface ScheduledReport {
  id: string;
  clubId: number;
  name: string;
  description?: string;
  reportType: 'member' | 'financial' | 'analytics' | 'event';
  format: 'csv' | 'excel' | 'json' | 'pdf';
  schedule: ReportSchedule;
  recipients: string[];
  includeFields?: string[];
  enabled: boolean;
  includeSummary?: boolean;
  includeCharts?: boolean;
  includeComparisons?: boolean;
  customFilters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

export interface ScheduledReportOptions {
  name: string;
  description?: string;
  reportType: 'member' | 'financial' | 'analytics' | 'event';
  format: 'csv' | 'excel' | 'json' | 'pdf';
  schedule: ReportSchedule;
  recipients: string[];
  includeFields: string[];
  enabled: boolean;
  includeSummary?: boolean;
  includeCharts?: boolean;
  includeComparisons?: boolean;
  customFilters?: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  dayOfWeek?: string; // e.g., 'monday', 'tuesday', etc.
  dayOfMonth?: number; // 1-31 for monthly
  monthOfQuarter?: number; // For quarterly
  time?: string; // HH:MM format
  timezone: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: 'member' | 'financial' | 'analytics' | 'event';
  defaultFormat: 'csv' | 'excel' | 'json' | 'pdf';
  availableFormats: ('csv' | 'excel' | 'json' | 'pdf')[];
  defaultFields: string[];
  customizable: boolean;
  category: string;
}

export interface ReportExecutionHistory {
  executionId: string;
  reportId: string;
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt?: string | null;
  downloadUrl?: string | null;
  recipientCount: number;
  errorMessage?: string | null;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  progress: number;
  errorMessage?: string;
  downloadUrl?: string;
  emailsSent: number;
  emailsTotal: number;
  fileSize?: number;
  recordsProcessed: number;
  totalRecords: number;
}

export interface QueueStatus {
  totalJobs: number;
  runningJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  queueHealth: 'healthy' | 'degraded' | 'critical';
}

export interface RunScheduledReportResult {
  executionId: string;
  status: string;
  startedAt: string;
  estimatedCompletionAt: string;
}

class ScheduledReportsService {
  private url(path: string): string {
    return `${SCHEDULED_REPORTS_API_BASE}/api/${path}`;
  }

  /**
   * Map the UI ScheduledReportOptions onto the flat backend
   * CreateScheduledReportRequest shape. Enums are sent as integer ordinals
   * because the backend has no string-enum converter registered.
   */
  private toRequestBody(report: ScheduledReportOptions): Record<string, unknown> {
    return {
      reportName: report.name,
      reportType: report.reportType,
      format: EXPORT_FORMAT_CODE[report.format],
      frequency: REPORT_FREQUENCY_CODE[report.schedule.frequency],
      recipients: report.recipients,
      deliveryTime: toDeliveryTime(report.schedule.time),
      isActive: report.enabled,
      description: report.description,
    };
  }

  async createScheduledReport(clubId: number, report: ScheduledReportOptions): Promise<ScheduledReport> {
    try {
      // Validate the schedule first
      const validation = this.validateSchedule(report.schedule);
      if (!validation.isValid) {
        throw new Error(`Schedule validation failed: ${validation.errors.join(', ')}`);
      }
      this.validateRecipients(report.recipients);

      const response = await apiClient.post<ScheduledReport>(
        this.url(`clubs/${clubId}/reports/scheduled`),
        this.toRequestBody(report),
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create scheduled report');
    }
  }

  validateRecipients(recipients: string[]): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }
  }

  async getScheduledReports(clubId: number, enabledOnly?: boolean): Promise<ScheduledReport[]> {
    try {
      const params = enabledOnly ? { enabled: 'true' } : {};
      const response = await apiClient.get<ScheduledReport[]>(
        this.url(`clubs/${clubId}/reports/scheduled`),
        { params },
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve scheduled reports: ${error.message}`);
      }
      throw new Error('Failed to retrieve scheduled reports');
    }
  }

  /**
   * Update a scheduled report. Backend route is PUT (not PATCH). Tolerant of
   * partial updates — e.g. the toggle path passes only `{ enabled }`.
   */
  async updateScheduledReport(reportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.reportName = updates.name;
      if (updates.enabled !== undefined) body.isActive = updates.enabled;
      if (updates.recipients !== undefined) body.recipients = updates.recipients;
      if (updates.schedule?.time !== undefined) {
        body.deliveryTime = toDeliveryTime(updates.schedule.time);
      }

      const response = await apiClient.put<ScheduledReport>(
        this.url(`reports/scheduled/${reportId}`),
        body,
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update scheduled report');
    }
  }

  async deleteScheduledReport(reportId: string): Promise<boolean> {
    try {
      await apiClient.delete(this.url(`reports/scheduled/${reportId}`));
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete scheduled report');
    }
  }

  async runScheduledReport(reportId: string): Promise<RunScheduledReportResult> {
    try {
      const response = await apiClient.post<RunScheduledReportResult>(
        this.url(`reports/scheduled/${reportId}/run`),
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to run report');
    }
  }

  async getReportExecutionHistory(reportId: string, limit: number = 50): Promise<ReportExecutionHistory[]> {
    try {
      const response = await apiClient.get<ReportExecutionHistory[]>(
        this.url(`reports/scheduled/${reportId}/history`),
        { params: { limit } },
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get report executions');
    }
  }

  validateSchedule(schedule: ReportSchedule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'];

    if (!schedule.frequency || !validFrequencies.includes(schedule.frequency)) {
      const error = `Invalid frequency: ${schedule.frequency}`;
      errors.push(error);
      throw new Error(error);
    }

    if (!schedule.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time)) {
      const error = `Invalid time format: ${schedule.time}`;
      errors.push(error);
      throw new Error(error);
    }

    if (!schedule.timezone) {
      const error = 'Timezone is required';
      errors.push(error);
      throw new Error(error);
    }

    if (schedule.frequency === 'weekly') {
      const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      if (!schedule.dayOfWeek || !validDays.includes(schedule.dayOfWeek.toLowerCase())) {
        const error = `Invalid day of week: ${schedule.dayOfWeek}`;
        errors.push(error);
        throw new Error(error);
      }
    }

    if (schedule.frequency === 'monthly') {
      if (schedule.dayOfMonth === undefined || isNaN(schedule.dayOfMonth) || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
        const error = `Invalid day of month: ${schedule.dayOfMonth}`;
        errors.push(error);
        throw new Error(error);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date();

    const nextRun = new Date();

    const [hours, minutes] = schedule.time!.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = dayNames.indexOf(schedule.dayOfWeek!.toLowerCase());
        const currentDay = nextRun.getDay();
        let daysUntilTarget = targetDay - currentDay;
        
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;

      case 'monthly':
        nextRun.setDate(schedule.dayOfMonth!);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'quarterly':
        nextRun.setDate(schedule.dayOfMonth || 1);
        while (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;

      case 'annually':
        nextRun.setDate(schedule.dayOfMonth || 1);
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
    }

    return nextRun;
  }

  formatScheduleDescription(schedule: ReportSchedule): string {
    const timeStr = schedule.time;
    
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${timeStr}`;
      
      case 'weekly':
        const dayName = schedule.dayOfWeek!.charAt(0).toUpperCase() + schedule.dayOfWeek!.slice(1);
        return `Weekly on ${dayName} at ${timeStr}`;
      
      case 'monthly':
        const suffix = this.getOrdinalSuffix(schedule.dayOfMonth!);
        return `Monthly on the ${schedule.dayOfMonth}${suffix} at ${timeStr}`;
      
      case 'quarterly':
        const qSuffix = this.getOrdinalSuffix(schedule.dayOfMonth || 1);
        return `Quarterly on the ${schedule.dayOfMonth || 1}${qSuffix} at ${timeStr}`;

      case 'annually':
        const aSuffix = this.getOrdinalSuffix(schedule.dayOfMonth || 1);
        return `Annually on the ${schedule.dayOfMonth || 1}${aSuffix} at ${timeStr}`;

      default:
        return 'Unknown schedule';
    }
  }

  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

}

export const scheduledReportsService = new ScheduledReportsService();