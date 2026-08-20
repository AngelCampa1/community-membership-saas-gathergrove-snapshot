/**
 * Test suite for scheduledReportsService.
 *
 * Boundary mocking: ONLY the HTTP boundary (apiClient) is mocked. The real
 * service, its request-body mapper, and its schedule validators all run.
 *
 * Verified backend contract (ExportController is mounted at `[Route("api")]`,
 * NOT `/api/v1`):
 *   POST   api/clubs/{clubId}/reports/scheduled
 *   GET    api/clubs/{clubId}/reports/scheduled
 *   PUT    api/reports/scheduled/{scheduleId}
 *   DELETE api/reports/scheduled/{scheduleId}
 *   POST   api/reports/scheduled/{scheduleId}/run
 *   GET    api/reports/scheduled/{scheduleId}/history?limit=50
 *
 * Enums cross the wire as integer ordinals (no string-enum converter):
 *   format:    csv=0, excel=1, pdf=2, json=3
 *   frequency: daily=0, weekly=1, monthly=2, quarterly=3, annually=4
 */

import apiClient from '../apiClient';
import {
  scheduledReportsService,
  type ScheduledReport,
  type ScheduledReportOptions,
  type ReportSchedule,
  type ReportExecutionHistory,
  type RunScheduledReportResult,
} from '../scheduledReportsService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const API_BASE = 'http://localhost:8050';
const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const clubId = 123;

const buildOptions = (overrides: Partial<ScheduledReportOptions> = {}): ScheduledReportOptions => ({
  name: 'Weekly Member Report',
  description: 'Weekly overview of member activities',
  reportType: 'member',
  format: 'excel',
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 'monday',
    time: '09:00',
    timezone: 'America/New_York',
  },
  recipients: ['admin@example.com', 'manager@example.com'],
  includeFields: ['firstName', 'lastName'],
  enabled: true,
  ...overrides,
});

const buildReport = (overrides: Partial<ScheduledReport> = {}): ScheduledReport => ({
  id: 'report_1',
  clubId,
  name: 'Weekly Member Report',
  reportType: 'member',
  format: 'excel',
  schedule: { frequency: 'weekly', dayOfWeek: 'monday', time: '09:00', timezone: 'UTC' },
  recipients: ['admin@example.com'],
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastRunAt: null,
  nextRunAt: '2024-01-08T09:00:00Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createScheduledReport', () => {
  it('POSTs to the absolute api/clubs/{clubId}/reports/scheduled URL', async () => {
    mockPost.mockResolvedValueOnce({ data: buildReport() });

    await scheduledReportsService.createScheduledReport(clubId, buildOptions());

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe(`${API_BASE}/api/clubs/${clubId}/reports/scheduled`);
  });

  it('maps options to the flat backend body with integer format/frequency and HH:MM:00 deliveryTime', async () => {
    mockPost.mockResolvedValueOnce({ data: buildReport() });

    await scheduledReportsService.createScheduledReport(
      clubId,
      buildOptions({ format: 'pdf', schedule: { frequency: 'quarterly', dayOfMonth: 1, time: '17:30', timezone: 'UTC' } }),
    );

    expect(mockPost.mock.calls[0][1]).toEqual({
      reportName: 'Weekly Member Report',
      reportType: 'member',
      format: 2, // pdf
      frequency: 3, // quarterly
      recipients: ['admin@example.com', 'manager@example.com'],
      deliveryTime: '17:30:00',
      isActive: true,
      description: 'Weekly overview of member activities',
    });
  });

  it('encodes each format ordinal correctly', async () => {
    const cases: Array<[ScheduledReportOptions['format'], number]> = [
      ['csv', 0],
      ['excel', 1],
      ['pdf', 2],
      ['json', 3],
    ];
    for (const [format, code] of cases) {
      mockPost.mockResolvedValueOnce({ data: buildReport() });
      await scheduledReportsService.createScheduledReport(
        clubId,
        buildOptions({ format, schedule: { frequency: 'daily', time: '08:00', timezone: 'UTC' } }),
      );
      expect(mockPost.mock.calls.at(-1)![1].format).toBe(code);
    }
  });

  it('encodes each frequency ordinal correctly', async () => {
    const cases: Array<[ReportSchedule['frequency'], number, Partial<ReportSchedule>]> = [
      ['daily', 0, {}],
      ['weekly', 1, { dayOfWeek: 'monday' }],
      ['monthly', 2, { dayOfMonth: 1 }],
      ['quarterly', 3, { dayOfMonth: 1 }],
      ['annually', 4, { dayOfMonth: 1 }],
    ];
    for (const [frequency, code, extra] of cases) {
      mockPost.mockResolvedValueOnce({ data: buildReport() });
      await scheduledReportsService.createScheduledReport(
        clubId,
        buildOptions({ schedule: { frequency, time: '08:00', timezone: 'UTC', ...extra } }),
      );
      expect(mockPost.mock.calls.at(-1)![1].frequency).toBe(code);
    }
  });

  it('returns the created report from the response', async () => {
    const report = buildReport({ id: 'report_99' });
    mockPost.mockResolvedValueOnce({ data: report });

    const result = await scheduledReportsService.createScheduledReport(clubId, buildOptions());

    expect(result).toEqual(report);
  });

  it('validates the schedule before posting (invalid frequency throws, no request)', async () => {
    await expect(
      scheduledReportsService.createScheduledReport(
        clubId,
        buildOptions({ schedule: { frequency: 'once' as never, time: '09:00', timezone: 'UTC' } }),
      ),
    ).rejects.toThrow('Invalid frequency: once');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('validates recipients before posting', async () => {
    await expect(
      scheduledReportsService.createScheduledReport(
        clubId,
        buildOptions({ recipients: ['not-an-email'] }),
      ),
    ).rejects.toThrow('Invalid email address: not-an-email');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('rethrows Error from the HTTP layer', async () => {
    mockPost.mockRejectedValueOnce(new Error('network down'));
    await expect(
      scheduledReportsService.createScheduledReport(clubId, buildOptions()),
    ).rejects.toThrow('network down');
  });

  it('wraps non-Error rejections with a default message', async () => {
    mockPost.mockRejectedValueOnce('boom');
    await expect(
      scheduledReportsService.createScheduledReport(clubId, buildOptions()),
    ).rejects.toThrow('Failed to create scheduled report');
  });
});

describe('getScheduledReports', () => {
  it('GETs the absolute list URL with no params by default', async () => {
    mockGet.mockResolvedValueOnce({ data: [buildReport()] });

    const result = await scheduledReportsService.getScheduledReports(clubId);

    expect(mockGet).toHaveBeenCalledWith(
      `${API_BASE}/api/clubs/${clubId}/reports/scheduled`,
      { params: {} },
    );
    expect(result).toHaveLength(1);
  });

  it('passes the enabled param when enabledOnly is true', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await scheduledReportsService.getScheduledReports(clubId, true);

    expect(mockGet).toHaveBeenCalledWith(
      `${API_BASE}/api/clubs/${clubId}/reports/scheduled`,
      { params: { enabled: 'true' } },
    );
  });

  it('rethrows Error with a descriptive message', async () => {
    mockGet.mockRejectedValueOnce(new Error('500'));
    await expect(scheduledReportsService.getScheduledReports(clubId)).rejects.toThrow(
      'Failed to retrieve scheduled reports: 500',
    );
  });

  it('wraps non-Error rejections', async () => {
    mockGet.mockRejectedValueOnce('boom');
    await expect(scheduledReportsService.getScheduledReports(clubId)).rejects.toThrow(
      'Failed to retrieve scheduled reports',
    );
  });
});

describe('updateScheduledReport', () => {
  it('uses PUT at the absolute reports/scheduled/{id} URL', async () => {
    mockPut.mockResolvedValueOnce({ data: buildReport() });

    await scheduledReportsService.updateScheduledReport('report_1', { name: 'Renamed' });

    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut.mock.calls[0][0]).toBe(`${API_BASE}/api/reports/scheduled/report_1`);
  });

  it('maps a full update to the UpdateScheduledReportRequest shape', async () => {
    mockPut.mockResolvedValueOnce({ data: buildReport() });

    await scheduledReportsService.updateScheduledReport('report_1', {
      name: 'Renamed',
      enabled: false,
      recipients: ['ops@example.com'],
      schedule: { frequency: 'daily', time: '07:15', timezone: 'UTC' },
    });

    expect(mockPut.mock.calls[0][1]).toEqual({
      reportName: 'Renamed',
      isActive: false,
      recipients: ['ops@example.com'],
      deliveryTime: '07:15:00',
    });
  });

  it('tolerates a partial toggle update of only { enabled }', async () => {
    mockPut.mockResolvedValueOnce({ data: buildReport({ enabled: true }) });

    await scheduledReportsService.updateScheduledReport('report_1', { enabled: true });

    expect(mockPut.mock.calls[0][1]).toEqual({ isActive: true });
  });

  it('rethrows Error from the HTTP layer', async () => {
    mockPut.mockRejectedValueOnce(new Error('conflict'));
    await expect(
      scheduledReportsService.updateScheduledReport('report_1', { enabled: true }),
    ).rejects.toThrow('conflict');
  });

  it('wraps non-Error rejections', async () => {
    mockPut.mockRejectedValueOnce('boom');
    await expect(
      scheduledReportsService.updateScheduledReport('report_1', { enabled: true }),
    ).rejects.toThrow('Failed to update scheduled report');
  });
});

describe('deleteScheduledReport', () => {
  it('DELETEs the absolute reports/scheduled/{id} URL and returns true', async () => {
    mockDelete.mockResolvedValueOnce({});

    const result = await scheduledReportsService.deleteScheduledReport('report_1');

    expect(mockDelete).toHaveBeenCalledWith(`${API_BASE}/api/reports/scheduled/report_1`);
    expect(result).toBe(true);
  });

  it('rethrows Error from the HTTP layer', async () => {
    mockDelete.mockRejectedValueOnce(new Error('404'));
    await expect(scheduledReportsService.deleteScheduledReport('report_1')).rejects.toThrow('404');
  });

  it('wraps non-Error rejections', async () => {
    mockDelete.mockRejectedValueOnce('boom');
    await expect(scheduledReportsService.deleteScheduledReport('report_1')).rejects.toThrow(
      'Failed to delete scheduled report',
    );
  });
});

describe('runScheduledReport', () => {
  it('POSTs the absolute run URL and returns the result', async () => {
    const result: RunScheduledReportResult = {
      executionId: 'exec_1',
      status: 'queued',
      startedAt: '2024-01-01T00:00:00Z',
      estimatedCompletionAt: '2024-01-01T00:05:00Z',
    };
    mockPost.mockResolvedValueOnce({ data: result });

    const returned = await scheduledReportsService.runScheduledReport('report_1');

    expect(mockPost).toHaveBeenCalledWith(`${API_BASE}/api/reports/scheduled/report_1/run`);
    expect(returned).toEqual(result);
  });

  it('rethrows Error from the HTTP layer', async () => {
    mockPost.mockRejectedValueOnce(new Error('busy'));
    await expect(scheduledReportsService.runScheduledReport('report_1')).rejects.toThrow('busy');
  });

  it('wraps non-Error rejections', async () => {
    mockPost.mockRejectedValueOnce('boom');
    await expect(scheduledReportsService.runScheduledReport('report_1')).rejects.toThrow(
      'Failed to run report',
    );
  });
});

describe('getReportExecutionHistory', () => {
  it('GETs the absolute history URL with the default limit param', async () => {
    const history: ReportExecutionHistory[] = [
      {
        executionId: 'exec_1',
        reportId: 'report_1',
        status: 'completed',
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:05:00Z',
        downloadUrl: null,
        recipientCount: 2,
        errorMessage: null,
      },
    ];
    mockGet.mockResolvedValueOnce({ data: history });

    const result = await scheduledReportsService.getReportExecutionHistory('report_1');

    expect(mockGet).toHaveBeenCalledWith(
      `${API_BASE}/api/reports/scheduled/report_1/history`,
      { params: { limit: 50 } },
    );
    expect(result).toEqual(history);
  });

  it('passes a custom limit param', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await scheduledReportsService.getReportExecutionHistory('report_1', 5);

    expect(mockGet).toHaveBeenCalledWith(
      `${API_BASE}/api/reports/scheduled/report_1/history`,
      { params: { limit: 5 } },
    );
  });

  it('rethrows Error from the HTTP layer', async () => {
    mockGet.mockRejectedValueOnce(new Error('gone'));
    await expect(scheduledReportsService.getReportExecutionHistory('report_1')).rejects.toThrow('gone');
  });

  it('wraps non-Error rejections', async () => {
    mockGet.mockRejectedValueOnce('boom');
    await expect(scheduledReportsService.getReportExecutionHistory('report_1')).rejects.toThrow(
      'Failed to get report executions',
    );
  });
});

describe('validateRecipients', () => {
  it('accepts valid email addresses', () => {
    expect(() =>
      scheduledReportsService.validateRecipients(['a@b.com', 'c.d@e.io']),
    ).not.toThrow();
  });

  it('throws on the first invalid address', () => {
    expect(() => scheduledReportsService.validateRecipients(['ok@x.com', 'bad'])).toThrow(
      'Invalid email address: bad',
    );
  });
});

describe('validateSchedule', () => {
  it('accepts a valid daily schedule', () => {
    expect(
      scheduledReportsService.validateSchedule({ frequency: 'daily', time: '09:00', timezone: 'UTC' }),
    ).toEqual({ isValid: true, errors: [] });
  });

  it('rejects an invalid frequency (including the removed "once")', () => {
    expect(() =>
      scheduledReportsService.validateSchedule({ frequency: 'once' as never, time: '09:00', timezone: 'UTC' }),
    ).toThrow('Invalid frequency: once');
  });

  it('requires a valid time for every frequency', () => {
    expect(() =>
      scheduledReportsService.validateSchedule({ frequency: 'daily', time: '99:99', timezone: 'UTC' }),
    ).toThrow('Invalid time format: 99:99');
  });

  it('requires a timezone', () => {
    expect(() =>
      scheduledReportsService.validateSchedule({ frequency: 'daily', time: '09:00', timezone: '' }),
    ).toThrow('Timezone is required');
  });

  it('requires a valid dayOfWeek for weekly', () => {
    expect(() =>
      scheduledReportsService.validateSchedule({ frequency: 'weekly', time: '09:00', timezone: 'UTC' }),
    ).toThrow('Invalid day of week');
  });

  it('accepts a valid weekly schedule', () => {
    expect(
      scheduledReportsService.validateSchedule({
        frequency: 'weekly',
        dayOfWeek: 'Friday',
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toEqual({ isValid: true, errors: [] });
  });

  it('requires a valid dayOfMonth for monthly', () => {
    expect(() =>
      scheduledReportsService.validateSchedule({ frequency: 'monthly', dayOfMonth: 40, time: '09:00', timezone: 'UTC' }),
    ).toThrow('Invalid day of month');
  });

  it('accepts a valid annually schedule', () => {
    expect(
      scheduledReportsService.validateSchedule({ frequency: 'annually', time: '09:00', timezone: 'UTC' }),
    ).toEqual({ isValid: true, errors: [] });
  });
});

describe('calculateNextRun', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-15T12:00:00'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('rolls a passed daily time to tomorrow', () => {
    const next = scheduledReportsService.calculateNextRun({ frequency: 'daily', time: '08:00', timezone: 'UTC' });
    expect(next.getDate()).toBe(16);
  });

  it('keeps a future daily time today', () => {
    const next = scheduledReportsService.calculateNextRun({ frequency: 'daily', time: '20:00', timezone: 'UTC' });
    expect(next.getDate()).toBe(15);
  });

  it('computes the next weekly occurrence', () => {
    const next = scheduledReportsService.calculateNextRun({
      frequency: 'weekly',
      dayOfWeek: 'monday',
      time: '09:00',
      timezone: 'UTC',
    });
    expect(next.getDay()).toBe(1);
  });

  it('computes the next monthly occurrence', () => {
    const next = scheduledReportsService.calculateNextRun({
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'UTC',
    });
    expect(next.getDate()).toBe(1);
    expect(next.getMonth()).toBe(1); // February
  });

  it('computes the next quarterly occurrence', () => {
    const next = scheduledReportsService.calculateNextRun({
      frequency: 'quarterly',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'UTC',
    });
    expect(next.getTime()).toBeGreaterThan(Date.now());
  });

  it('rolls a passed annual date to next year', () => {
    const next = scheduledReportsService.calculateNextRun({
      frequency: 'annually',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'UTC',
    });
    expect(next.getFullYear()).toBe(2025);
  });

  it('keeps a future annual date this year', () => {
    const next = scheduledReportsService.calculateNextRun({
      frequency: 'annually',
      dayOfMonth: 28,
      time: '09:00',
      timezone: 'UTC',
    });
    expect(next.getFullYear()).toBe(2024);
  });
});

describe('formatScheduleDescription', () => {
  it('formats daily', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({ frequency: 'daily', time: '09:00', timezone: 'UTC' }),
    ).toBe('Daily at 09:00');
  });

  it('formats weekly with a capitalized day', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Weekly on Monday at 09:00');
  });

  it('formats monthly with an ordinal suffix', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'monthly',
        dayOfMonth: 1,
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Monthly on the 1st at 09:00');
  });

  it('formats quarterly with an ordinal suffix', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'quarterly',
        dayOfMonth: 2,
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Quarterly on the 2nd at 09:00');
  });

  it('formats annually with an ordinal suffix', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'annually',
        dayOfMonth: 3,
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Annually on the 3rd at 09:00');
  });

  it('defaults the quarterly day to the 1st', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({ frequency: 'quarterly', time: '09:00', timezone: 'UTC' }),
    ).toBe('Quarterly on the 1st at 09:00');
  });

  it('returns Unknown schedule for an unrecognized frequency', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({ frequency: 'bogus' as never, time: '09:00', timezone: 'UTC' }),
    ).toBe('Unknown schedule');
  });

  it('handles teen-day ordinal suffixes', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'monthly',
        dayOfMonth: 12,
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Monthly on the 12th at 09:00');
  });

  it('uses the default "th" suffix for other days', () => {
    expect(
      scheduledReportsService.formatScheduleDescription({
        frequency: 'monthly',
        dayOfMonth: 4,
        time: '09:00',
        timezone: 'UTC',
      }),
    ).toBe('Monthly on the 4th at 09:00');
  });
});

describe('toDeliveryTime mapping (via update, which skips validation)', () => {
  it('passes through an HH:MM:SS time unchanged', async () => {
    mockPut.mockResolvedValueOnce({ data: buildReport() });
    await scheduledReportsService.updateScheduledReport('report_1', {
      schedule: { frequency: 'daily', time: '06:30:45', timezone: 'UTC' },
    });
    expect(mockPut.mock.calls[0][1].deliveryTime).toBe('06:30:45');
  });
});
