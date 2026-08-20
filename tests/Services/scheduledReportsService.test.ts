/**
 * TDD RED PHASE: scheduledReportsService Test Suite
 * Tests for US-005 Data Export & Reporting Engine - Scheduled Reports
 * 
 * CRITICAL: These tests MUST fail initially - no implementation exists yet
 * Following TDD RED→GREEN→REFACTOR cycle
 */

import { 
  scheduledReportsService, 
  type ScheduledReport, 
  type ScheduledReportOptions, 
  type ReportSchedule,
  type ReportTemplate
} from '@/services/scheduledReportsService';

// Mock dependencies
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('scheduledReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('createScheduledReport', () => {
    it('should create a new scheduled report with weekly frequency', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Weekly Member Report',
        description: 'Weekly overview of member activity and engagement',
        reportType: 'member',
        format: 'pdf',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          time: '09:00',
          timezone: 'America/New_York'
        },
        recipients: ['admin@club.com', 'manager@club.com'],
        includeFields: ['firstName', 'lastName', 'email', 'engagement'],
        enabled: true
      };

      const mockReport: ScheduledReport = {
        id: 'report_12345',
        clubId,
        name: options.name,
        description: options.description,
        reportType: options.reportType,
        format: options.format,
        schedule: options.schedule,
        recipients: options.recipients,
        includeFields: options.includeFields,
        enabled: options.enabled,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        lastRunAt: null,
        nextRunAt: '2024-01-08T09:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReport)
      });

      const result = await scheduledReportsService.createScheduledReport(clubId, options);

      expect(result).toEqual(mockReport);
      expect(mockFetch).toHaveBeenCalledWith(`/api/clubs/${clubId}/reports/scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
    });

    it('should create monthly financial report with advanced options', async () => {
      const clubId = 456;
      const options: ScheduledReportOptions = {
        name: 'Monthly Financial Summary',
        description: 'Comprehensive monthly financial report',
        reportType: 'financial',
        format: 'excel',
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '08:00',
          timezone: 'UTC'
        },
        recipients: ['finance@club.com', 'treasurer@club.com'],
        includeFields: ['amount', 'date', 'category', 'memberDetails'],
        includeSummary: true,
        includeCharts: true,
        customFilters: {
          dateRange: 'previousMonth',
          categories: ['billing', 'payments', 'events']
        },
        enabled: true
      };

      const mockReport: ScheduledReport = {
        id: 'report_67890',
        clubId,
        ...options,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        lastRunAt: null,
        nextRunAt: '2024-02-01T08:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReport)
      });

      const result = await scheduledReportsService.createScheduledReport(clubId, options);

      expect(result).toEqual(mockReport);
      expect(result.includeCharts).toBe(true);
    });

    it('should validate schedule configuration before creating', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Invalid Schedule Report',
        description: 'Test invalid schedule',
        reportType: 'member',
        format: 'csv',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'invalid_day' as any, // Invalid day
          time: '09:00',
          timezone: 'America/New_York'
        },
        recipients: ['test@club.com'],
        includeFields: ['firstName'],
        enabled: true
      };

      await expect(scheduledReportsService.createScheduledReport(clubId, options))
        .rejects.toThrow('Invalid day of week: invalid_day');
    });

    it('should validate recipient email addresses', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Test Report',
        description: 'Test with invalid emails',
        reportType: 'member',
        format: 'csv',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          time: '09:00',
          timezone: 'America/New_York'
        },
        recipients: ['invalid-email', 'valid@email.com'], // Invalid email format
        includeFields: ['firstName'],
        enabled: true
      };

      await expect(scheduledReportsService.createScheduledReport(clubId, options))
        .rejects.toThrow('Invalid email address: invalid-email');
    });
  });

  describe('getScheduledReports', () => {
    it('should retrieve all scheduled reports for a club', async () => {
      const clubId = 123;
      const mockReports: ScheduledReport[] = [
        {
          id: 'report_1',
          clubId,
          name: 'Weekly Member Report',
          description: 'Weekly member activity',
          reportType: 'member',
          format: 'pdf',
          schedule: {
            frequency: 'weekly',
            dayOfWeek: 'monday',
            time: '09:00',
            timezone: 'America/New_York'
          },
          recipients: ['admin@club.com'],
          includeFields: ['firstName', 'lastName'],
          enabled: true,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          lastRunAt: '2024-01-01T09:00:00Z',
          nextRunAt: '2024-01-08T09:00:00Z'
        },
        {
          id: 'report_2',
          clubId,
          name: 'Monthly Financial Report',
          description: 'Monthly financial summary',
          reportType: 'financial',
          format: 'excel',
          schedule: {
            frequency: 'monthly',
            dayOfMonth: 1,
            time: '08:00',
            timezone: 'UTC'
          },
          recipients: ['finance@club.com'],
          includeFields: ['amount', 'category'],
          enabled: false,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          lastRunAt: null,
          nextRunAt: null
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReports)
      });

      const result = await scheduledReportsService.getScheduledReports(clubId);

      expect(result).toEqual(mockReports);
      expect(result.length).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/clubs/${clubId}/reports/scheduled`,
        { method: 'GET' }
      );
    });

    it('should filter reports by enabled status', async () => {
      const clubId = 123;
      const enabledOnly = true;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      await scheduledReportsService.getScheduledReports(clubId, enabledOnly);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/clubs/${clubId}/reports/scheduled?enabled=true`,
        { method: 'GET' }
      );
    });
  });

  describe('updateScheduledReport', () => {
    it('should update an existing scheduled report', async () => {
      const reportId = 'report_12345';
      const updates = {
        name: 'Updated Weekly Report',
        enabled: false,
        recipients: ['newadmin@club.com', 'manager@club.com']
      };

      const mockUpdatedReport: ScheduledReport = {
        id: reportId,
        clubId: 123,
        name: updates.name,
        description: 'Weekly member activity',
        reportType: 'member',
        format: 'pdf',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          time: '09:00',
          timezone: 'America/New_York'
        },
        recipients: updates.recipients,
        includeFields: ['firstName', 'lastName'],
        enabled: updates.enabled,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z',
        lastRunAt: '2024-01-01T09:00:00Z',
        nextRunAt: null // Disabled, so no next run
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpdatedReport)
      });

      const result = await scheduledReportsService.updateScheduledReport(reportId, updates);

      expect(result).toEqual(mockUpdatedReport);
      expect(result.name).toBe(updates.name);
      expect(result.enabled).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(`/api/reports/scheduled/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    });
  });

  describe('deleteScheduledReport', () => {
    it('should delete a scheduled report', async () => {
      const reportId = 'report_12345';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted: true })
      });

      const result = await scheduledReportsService.deleteScheduledReport(reportId);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(`/api/reports/scheduled/${reportId}`, {
        method: 'DELETE'
      });
    });

    it('should handle deletion failure', async () => {
      const reportId = 'nonexistent_report';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(scheduledReportsService.deleteScheduledReport(reportId))
        .rejects.toThrow('Failed to delete scheduled report: 404 Not Found');
    });
  });

  describe('runScheduledReport', () => {
    it('should manually trigger a scheduled report', async () => {
      const reportId = 'report_12345';

      const mockRunResult = {
        executionId: 'exec_67890',
        status: 'running',
        startedAt: '2024-01-01T12:00:00Z',
        estimatedCompletionAt: '2024-01-01T12:05:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRunResult)
      });

      const result = await scheduledReportsService.runScheduledReport(reportId);

      expect(result).toEqual(mockRunResult);
      expect(mockFetch).toHaveBeenCalledWith(`/api/reports/scheduled/${reportId}/run`, {
        method: 'POST'
      });
    });
  });

  describe('getReportExecutionHistory', () => {
    it('should retrieve execution history for a scheduled report', async () => {
      const reportId = 'report_12345';
      const limit = 10;

      const mockHistory = [
        {
          executionId: 'exec_1',
          reportId,
          status: 'completed',
          startedAt: '2024-01-01T09:00:00Z',
          completedAt: '2024-01-01T09:03:00Z',
          downloadUrl: '/downloads/exec_1.pdf',
          recipientCount: 2,
          errorMessage: null
        },
        {
          executionId: 'exec_2',
          reportId,
          status: 'failed',
          startedAt: '2023-12-25T09:00:00Z',
          completedAt: null,
          downloadUrl: null,
          recipientCount: 0,
          errorMessage: 'Email delivery failed'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory)
      });

      const result = await scheduledReportsService.getReportExecutionHistory(reportId, limit);

      expect(result).toEqual(mockHistory);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/reports/scheduled/${reportId}/history?limit=${limit}`,
        { method: 'GET' }
      );
    });
  });

  describe('getAvailableTemplates', () => {
    it('should retrieve available report templates', async () => {
      const mockTemplates: ReportTemplate[] = [
        {
          id: 'template_member_weekly',
          name: 'Weekly Member Activity',
          description: 'Standard weekly member engagement report',
          reportType: 'member',
          defaultFormat: 'pdf',
          availableFormats: ['pdf', 'excel', 'csv'],
          defaultFields: ['firstName', 'lastName', 'email', 'engagement'],
          customizable: true,
          category: 'member-management'
        },
        {
          id: 'template_financial_monthly',
          name: 'Monthly Financial Summary',
          description: 'Comprehensive monthly financial overview',
          reportType: 'financial',
          defaultFormat: 'excel',
          availableFormats: ['excel', 'pdf', 'csv'],
          defaultFields: ['amount', 'date', 'category', 'memberDetails'],
          customizable: true,
          category: 'financial'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplates)
      });

      const result = await scheduledReportsService.getAvailableTemplates();

      expect(result).toEqual(mockTemplates);
      expect(result.length).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith('/api/reports/templates', {
        method: 'GET'
      });
    });
  });

  describe('validateSchedule', () => {
    it('should validate weekly schedule configuration', () => {
      const schedule: ReportSchedule = {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '09:00',
        timezone: 'America/New_York'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .not.toThrow();
    });

    it('should validate monthly schedule configuration', () => {
      const schedule: ReportSchedule = {
        frequency: 'monthly',
        dayOfMonth: 1,
        time: '08:00',
        timezone: 'UTC'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .not.toThrow();
    });

    it('should throw error for invalid frequency', () => {
      const schedule: ReportSchedule = {
        frequency: 'invalid' as any,
        time: '09:00',
        timezone: 'UTC'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .toThrow('Invalid frequency: invalid');
    });

    it('should throw error for invalid day of week', () => {
      const schedule: ReportSchedule = {
        frequency: 'weekly',
        dayOfWeek: 'funday' as any,
        time: '09:00',
        timezone: 'UTC'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .toThrow('Invalid day of week: funday');
    });

    it('should throw error for invalid day of month', () => {
      const schedule: ReportSchedule = {
        frequency: 'monthly',
        dayOfMonth: 32, // Invalid day
        time: '09:00',
        timezone: 'UTC'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .toThrow('Invalid day of month: 32');
    });

    it('should throw error for invalid time format', () => {
      const schedule: ReportSchedule = {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '25:00', // Invalid time
        timezone: 'UTC'
      };

      expect(() => scheduledReportsService.validateSchedule(schedule))
        .toThrow('Invalid time format: 25:00');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when creating scheduled report', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Test Report',
        description: 'Test',
        reportType: 'member',
        format: 'csv',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          time: '09:00',
          timezone: 'UTC'
        },
        recipients: ['test@club.com'],
        includeFields: ['firstName'],
        enabled: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request - Invalid schedule configuration'
      });

      await expect(scheduledReportsService.createScheduledReport(clubId, options))
        .rejects.toThrow('Failed to create scheduled report: 400 Bad Request - Invalid schedule configuration');
    });

    it('should handle network errors gracefully', async () => {
      const clubId = 123;

      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(scheduledReportsService.getScheduledReports(clubId))
        .rejects.toThrow('Failed to retrieve scheduled reports: Network connection failed');
    });
  });

  describe('Complex Scheduling Scenarios', () => {
    it('should handle quarterly reports with specific end-of-quarter timing', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Quarterly Board Report',
        description: 'Comprehensive quarterly report for board meetings',
        reportType: 'analytics',
        format: 'pdf',
        schedule: {
          frequency: 'quarterly',
          monthOfQuarter: 3, // End of quarter
          dayOfMonth: 5, // 5 days after quarter end
          time: '07:00',
          timezone: 'America/New_York'
        },
        recipients: ['board@club.com', 'president@club.com'],
        includeFields: ['all'],
        includeSummary: true,
        includeCharts: true,
        includeComparisons: true,
        enabled: true
      };

      const mockReport: ScheduledReport = {
        id: 'report_quarterly',
        clubId,
        ...options,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        lastRunAt: null,
        nextRunAt: '2024-04-05T07:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReport)
      });

      const result = await scheduledReportsService.createScheduledReport(clubId, options);

      expect(result).toEqual(mockReport);
      expect(result.schedule.frequency).toBe('quarterly');
    });

    it('should handle one-time scheduled reports', async () => {
      const clubId = 123;
      const options: ScheduledReportOptions = {
        name: 'Year-End Special Report',
        description: 'Special one-time year-end report',
        reportType: 'financial',
        format: 'excel',
        schedule: {
          frequency: 'once',
          scheduledDateTime: '2024-12-31T23:59:00Z',
          timezone: 'UTC'
        },
        recipients: ['ceo@club.com'],
        includeFields: ['all'],
        enabled: true
      };

      const mockReport: ScheduledReport = {
        id: 'report_onetime',
        clubId,
        ...options,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        lastRunAt: null,
        nextRunAt: '2024-12-31T23:59:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReport)
      });

      const result = await scheduledReportsService.createScheduledReport(clubId, options);

      expect(result).toEqual(mockReport);
      expect(result.schedule.frequency).toBe('once');
    });
  });
});