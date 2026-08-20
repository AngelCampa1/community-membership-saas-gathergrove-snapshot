/**
 * financialExportService tests
 *
 * Boundary mocking: only the apiClient HTTP layer is mocked. The real
 * financialExportService runs, so these tests exercise genuine option →
 * request-body mapping, integer enum encoding, status normalization, and
 * absolute-URL targeting against the real backend ExportController contract.
 *
 * ExportController is mounted at `[Route("api")]` (no `/api/v1`), so the
 * service targets the host root plus an explicit `/api/...` path. The backend
 * registers no JsonStringEnumConverter, so enums cross the wire as integer
 * ordinals — these tests assert the numeric Format codes and decode the integer
 * ExportStatus ordinals back to the stable string union. The financial export
 * endpoint responds synchronously with a JSON ExportResult (never a blob).
 */

import apiClient from '@/services/apiClient';
import {
  financialExportService,
  type FinancialExportOptions,
  type FinancialExportData,
} from '@/services/financialExportService';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

const HOST = 'http://localhost:8050';

const baseOptions: FinancialExportOptions = {
  format: 'csv',
  dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
  includeCategories: ['billing', 'payments'],
};

describe('financialExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportFinancialData', () => {
    it('posts to the absolute financial export route with a numeric CSV format code', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          exportId: 'fin-1',
          status: 2,
          fileName: 'financial-export.csv',
          fileSizeBytes: 4096,
          downloadUrl: '/api/clubs/123/exports/fin-1/download',
          recordCount: 42,
        },
      });

      const result = await financialExportService.exportFinancialData(123, baseOptions);

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe(`${HOST}/api/clubs/123/financial/export`);
      expect(body).toMatchObject({
        format: 0, // csv ordinal
        reportType: 'Financial',
        includeRevenue: true, // billing/payments present
        includeExpenses: false, // no refunds category
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        includeMembershipFees: false, // no dues category
        includeEventRevenue: false, // no events category
        currency: 'USD',
        groupByCategory: false,
      });

      expect(result).toEqual({
        exportId: 'fin-1',
        status: 'completed',
        fileName: 'financial-export.csv',
        fileSizeBytes: 4096,
        downloadUrl: '/api/clubs/123/exports/fin-1/download',
        recordCount: 42,
        requestedAt: null,
        createdAt: null,
        completedAt: null,
        exportedAt: null,
        errorMessage: null,
      });
    });

    it('encodes excel/pdf/json formats as ordinals 1/2/3', async () => {
      mockPost.mockResolvedValue({ data: { exportId: 'x', status: 2 } });

      await financialExportService.exportFinancialData(1, { ...baseOptions, format: 'excel' });
      expect(mockPost.mock.calls[0][1]).toMatchObject({ format: 1 });

      await financialExportService.exportFinancialData(1, { ...baseOptions, format: 'pdf' });
      expect(mockPost.mock.calls[1][1]).toMatchObject({ format: 2 });

      await financialExportService.exportFinancialData(1, { ...baseOptions, format: 'json' });
      expect(mockPost.mock.calls[2][1]).toMatchObject({ format: 3 });
    });

    it('maps categories to revenue/expense/membership/event flags', async () => {
      mockPost.mockResolvedValueOnce({ data: { exportId: 'fin-2', status: 2 } });

      await financialExportService.exportFinancialData(7, {
        format: 'csv',
        dateRange: { startDate: '2024-01-01', endDate: '2024-06-30' },
        includeCategories: ['dues', 'events', 'refunds'],
        groupBy: 'category',
        currency: 'EUR',
      });

      expect(mockPost.mock.calls[0][1]).toMatchObject({
        includeRevenue: true, // dues/events present
        includeExpenses: true, // refunds present
        includeMembershipFees: true, // dues present
        includeEventRevenue: true, // events present
        currency: 'EUR',
        groupByCategory: true,
      });
    });

    it('normalizes a queued status response', async () => {
      mockPost.mockResolvedValueOnce({ data: { exportId: 'fin-3', status: 0 } });

      const result = await financialExportService.exportFinancialData(1, baseOptions);

      expect(result.status).toBe('queued');
      expect(result.exportId).toBe('fin-3');
    });

    it('validates the date range before making a request', async () => {
      await expect(
        financialExportService.exportFinancialData(1, {
          ...baseOptions,
          dateRange: { startDate: '2024-12-31', endDate: '2024-01-01' },
        }),
      ).rejects.toThrow('End date must be after start date');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('validates that at least one category is selected', async () => {
      await expect(
        financialExportService.exportFinancialData(1, {
          ...baseOptions,
          includeCategories: [],
        }),
      ).rejects.toThrow('At least one financial category must be selected');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('propagates a backend error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Request failed with status code 403'));

      await expect(
        financialExportService.exportFinancialData(1, baseOptions),
      ).rejects.toThrow('Request failed with status code 403');
    });
  });

  describe('downloadFinancialExport', () => {
    it('requests the shared download route as a blob', async () => {
      const blob = new Blob(['csv,data'], { type: 'text/csv' });
      mockGet.mockResolvedValueOnce({ data: blob });

      const result = await financialExportService.downloadFinancialExport(123, 'fin-9');

      expect(mockGet).toHaveBeenCalledWith(
        `${HOST}/api/clubs/123/exports/fin-9/download`,
        { responseType: 'blob' },
      );
      expect(result).toBe(blob);
    });
  });

  describe('validateFinancialExportOptions', () => {
    it('accepts a valid option set', () => {
      expect(() =>
        financialExportService.validateFinancialExportOptions(baseOptions),
      ).not.toThrow();
    });

    it('rejects a date range that exceeds five years', () => {
      expect(() =>
        financialExportService.validateFinancialExportOptions({
          ...baseOptions,
          dateRange: { startDate: '2010-01-01', endDate: '2024-12-31' },
        }),
      ).toThrow('Date range exceeds maximum allowed period for direct export');
    });

    it('rejects an invalid format', () => {
      expect(() =>
        financialExportService.validateFinancialExportOptions({
          ...baseOptions,
          format: 'xml' as unknown as FinancialExportOptions['format'],
        }),
      ).toThrow('Invalid export format: xml');
    });
  });

  describe('generateFinancialCSV', () => {
    const data: FinancialExportData = {
      summary: {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        averageTransactionAmount: 0,
        revenueByCategory: {},
        monthlyTrends: [],
        topRevenueEvents: [],
      },
      transactions: [
        {
          id: '1',
          type: 'dues',
          amount: 50,
          currency: 'USD',
          date: '2024-01-15',
          description: 'Monthly Dues',
          memberName: 'John Doe',
          paymentMethod: 'Credit Card',
          status: 'completed',
          fees: 1.5,
          netAmount: 48.5,
        },
        {
          id: '2',
          type: 'event_fee',
          amount: 25,
          currency: 'USD',
          date: '2024-01-20',
          description: 'Workshop, Advanced',
          memberName: 'Jane "JS" Smith',
          eventName: 'Tech Workshop',
          paymentMethod: 'PayPal',
          status: 'completed',
        },
      ],
      metadata: {
        clubId: 1,
        exportDate: '2024-02-01',
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
        currency: 'USD',
        totalRecords: 2,
      },
    };

    it('generates a header plus a row per transaction', () => {
      const csv = financialExportService.generateFinancialCSV(data);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Date,Type,Description,Amount,Currency');
      expect(lines).toHaveLength(3);
      expect(csv).toContain('2024-01-15,dues');
    });

    it('escapes commas and quotes in fields', () => {
      const csv = financialExportService.generateFinancialCSV(data);
      expect(csv).toContain('"Workshop, Advanced"');
      expect(csv).toContain('"Jane ""JS"" Smith"');
    });

    it('falls back to amount when netAmount is absent', () => {
      const csv = financialExportService.generateFinancialCSV(data);
      // second transaction has no netAmount → uses amount (25)
      expect(csv).toContain('Tech Workshop,PayPal,completed,0,25');
    });
  });

  describe('calculateMetrics', () => {
    it('computes revenue, expenses, net income and category breakdown', () => {
      const summary = financialExportService.calculateMetrics([
        {
          id: '1',
          type: 'dues',
          amount: 100,
          currency: 'USD',
          date: '2024-01-15',
          description: 'Dues',
          status: 'completed',
          fees: 3,
        },
        {
          id: '2',
          type: 'refund',
          amount: 20,
          currency: 'USD',
          date: '2024-01-20',
          description: 'Refund',
          status: 'completed',
        },
        {
          id: '3',
          type: 'event_fee',
          amount: 50,
          currency: 'USD',
          date: '2024-02-10',
          description: 'Event',
          eventId: 'e1',
          eventName: 'Gala',
          status: 'completed',
        },
      ]);

      expect(summary.totalRevenue).toBe(150); // dues 100 + event 50
      expect(summary.totalExpenses).toBe(23); // refund 20 + fees 3
      expect(summary.netIncome).toBe(127);
      expect(summary.transactionCount).toBe(3);
      expect(summary.revenueByCategory).toMatchObject({ dues: 100, refund: 20, event_fee: 50 });
      expect(summary.topRevenueEvents[0]).toMatchObject({
        eventId: 'e1',
        eventName: 'Gala',
        revenue: 50,
        attendees: 1,
        revenuePerAttendee: 50,
      });
      expect(summary.monthlyTrends.length).toBeGreaterThanOrEqual(1);
    });
  });
});
