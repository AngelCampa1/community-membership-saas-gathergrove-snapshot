/**
 * financialExportService
 *
 * Wiring contract (backend `ExportController`, mounted at `[Route("api")]` with
 * NO `/api/v1` segment):
 *   - POST `/api/clubs/{clubId}/financial/export`  (Admin only)
 *       body  → FinancialExportRequest (Format is an INTEGER ExportFormat ordinal)
 *       returns JSON ExportResult (NOT a blob); the backend generates the file
 *       synchronously and responds with Status = Completed plus a DownloadUrl.
 *   - GET  `/api/clubs/{clubId}/exports/{exportId}/download`
 *       returns the generated file as a blob (shared download route).
 *
 * ExportController lives at the host root (`/api/...`), so we target an absolute
 * host base rather than apiClient's `/api/v1` baseURL. The backend registers no
 * JsonStringEnumConverter, so enums cross the wire as integer ordinals — Format
 * is encoded as a number and ExportStatus is decoded from an integer ordinal.
 *
 * There is no financial export status/polling endpoint: financial exports are
 * produced synchronously, so a non-completed status is surfaced as an error.
 */

import apiClient from './apiClient';

const FINANCIAL_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

/** ExportFormat ordinal codes (backend enum, integer serialization). */
const EXPORT_FORMAT_CODE: Record<FinancialExportOptions['format'], number> = {
  csv: 0,
  excel: 1,
  pdf: 2,
  json: 3,
};

/** ExportStatus ordinal → stable string union (backend enum). */
const EXPORT_STATUS_NAME: Record<number, FinancialExportStatus> = {
  0: 'queued',
  1: 'processing',
  2: 'completed',
  3: 'failed',
  4: 'cancelled',
  5: 'expired',
};

export type FinancialExportStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface FinancialExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeCategories: ('billing' | 'payments' | 'dues' | 'events' | 'refunds')[];
  includeMemberDetails?: boolean;
  groupBy?: 'date' | 'member' | 'category' | 'event';
  currency?: string;
  /** UI toggle for revenue projections; the backend export does not yet model this. */
  includeProjections?: boolean;
}

export interface FinancialTransaction {
  id: string;
  type: 'payment' | 'refund' | 'dues' | 'event_fee' | 'other';
  amount: number;
  currency: string;
  date: string;
  description: string;
  memberId?: string;
  memberName?: string;
  eventId?: string;
  eventName?: string;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  fees?: number;
  netAmount?: number;
  notes?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransactionAmount: number;
  revenueByCategory: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    net: number;
  }>;
  topRevenueEvents: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    attendees: number;
    revenuePerAttendee: number;
  }>;
}

export interface FinancialExportData {
  summary: FinancialSummary;
  transactions: FinancialTransaction[];
  metadata: {
    clubId: number;
    exportDate: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    currency: string;
    totalRecords: number;
  };
}

/** Normalized projection of the backend `ExportResult` for financial exports. */
export interface FinancialExportResult {
  exportId: string;
  status: FinancialExportStatus;
  fileName: string | null;
  fileSizeBytes: number | null;
  downloadUrl: string | null;
  recordCount: number | null;
  requestedAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
  exportedAt: string | null;
  errorMessage: string | null;
}

/** Raw backend ExportResult shape (camelCase, integer status). */
interface RawExportResult {
  exportId?: string;
  status?: number | string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  downloadUrl?: string | null;
  recordCount?: number | null;
  requestedAt?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  exportedAt?: string | null;
  errorMessage?: string | null;
}

class FinancialExportService {
  private url(path: string): string {
    return `${FINANCIAL_API_BASE}/api/${path}`;
  }

  private normalizeStatus(status: number | string | undefined): FinancialExportStatus {
    if (typeof status === 'number') {
      return EXPORT_STATUS_NAME[status] ?? 'queued';
    }
    if (typeof status === 'string') {
      const lower = status.toLowerCase();
      const known: FinancialExportStatus[] = [
        'queued',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'expired',
      ];
      return (known.find((s) => s === lower) as FinancialExportStatus) ?? 'queued';
    }
    return 'queued';
  }

  private normalizeResult(
    raw: RawExportResult,
    fallbackExportId = '',
  ): FinancialExportResult {
    return {
      exportId: raw.exportId ?? fallbackExportId,
      status: this.normalizeStatus(raw.status),
      fileName: raw.fileName ?? null,
      fileSizeBytes: raw.fileSizeBytes ?? null,
      downloadUrl: raw.downloadUrl ?? null,
      recordCount: raw.recordCount ?? null,
      requestedAt: raw.requestedAt ?? null,
      createdAt: raw.createdAt ?? null,
      completedAt: raw.completedAt ?? null,
      exportedAt: raw.exportedAt ?? null,
      errorMessage: raw.errorMessage ?? null,
    };
  }

  /**
   * Maps the client option set to the backend `FinancialExportRequest`.
   * Format is encoded as an integer ExportFormat ordinal.
   */
  private toRequestBody(options: FinancialExportOptions) {
    const categories = options.includeCategories ?? [];
    return {
      format: EXPORT_FORMAT_CODE[options.format],
      reportType: 'Financial',
      includeRevenue:
        categories.includes('payments') ||
        categories.includes('dues') ||
        categories.includes('events') ||
        categories.includes('billing'),
      includeExpenses: categories.includes('refunds'),
      dateFrom: options.dateRange.startDate,
      dateTo: options.dateRange.endDate,
      includeMembershipFees: categories.includes('dues'),
      includeDonations: false,
      includeEventRevenue: categories.includes('events'),
      currency: options.currency ?? 'USD',
      includeTaxInfo: false,
      groupByCategory: options.groupBy === 'category',
      notes: '',
    };
  }

  /**
   * Requests a financial export. The backend produces the file synchronously
   * and returns a JSON ExportResult (with a DownloadUrl) — never a blob.
   */
  async exportFinancialData(
    clubId: number,
    options: FinancialExportOptions,
  ): Promise<FinancialExportResult> {
    this.validateFinancialExportOptions(options);

    const response = await apiClient.post<RawExportResult>(
      this.url(`clubs/${clubId}/financial/export`),
      this.toRequestBody(options),
    );

    return this.normalizeResult(response.data ?? {});
  }

  /**
   * Downloads a completed financial export file as a blob via the shared
   * download route.
   */
  async downloadFinancialExport(clubId: number, exportId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      this.url(`clubs/${clubId}/exports/${exportId}/download`),
      { responseType: 'blob' },
    );
    return response.data;
  }

  validateFinancialExportOptions(options: FinancialExportOptions): void {
    const startDate = new Date(options.dateRange.startDate);
    const endDate = new Date(options.dateRange.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    if (!options.includeCategories || options.includeCategories.length === 0) {
      throw new Error('At least one financial category must be selected');
    }

    const maxDays = 5 * 365; // 5 years
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      throw new Error('Date range exceeds maximum allowed period for direct export');
    }

    const validFormats = ['csv', 'excel', 'json', 'pdf'];
    if (!validFormats.includes(options.format)) {
      throw new Error(`Invalid export format: ${options.format}`);
    }
  }

  generateFinancialCSV(data: FinancialExportData): string {
    const headers = [
      'Date',
      'Type',
      'Description',
      'Amount',
      'Currency',
      'Member',
      'Event',
      'Payment Method',
      'Status',
      'Fees',
      'Net Amount',
    ];

    const rows = data.transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      this.escapeCSV(transaction.description),
      transaction.amount.toString(),
      transaction.currency,
      this.escapeCSV(transaction.memberName || ''),
      this.escapeCSV(transaction.eventName || ''),
      this.escapeCSV(transaction.paymentMethod || ''),
      transaction.status,
      (transaction.fees || 0).toString(),
      (transaction.netAmount || transaction.amount).toString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  calculateMetrics(transactions: FinancialTransaction[]): FinancialSummary {
    const revenue = transactions
      .filter((t) => t.type !== 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'refund' || (t.fees && t.fees > 0))
      .reduce((sum, t) => sum + (t.type === 'refund' ? t.amount : t.fees || 0), 0);

    const revenueByCategory = transactions
      .filter((t) => t.status === 'completed')
      .reduce(
        (acc, t) => {
          acc[t.type] = (acc[t.type] || 0) + t.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netIncome: revenue - expenses,
      transactionCount: transactions.length,
      averageTransactionAmount: transactions.length > 0 ? revenue / transactions.length : 0,
      revenueByCategory,
      monthlyTrends: this.calculateMonthlyTrends(transactions),
      topRevenueEvents: this.calculateTopRevenueEvents(transactions),
    };
  }

  private calculateMonthlyTrends(transactions: FinancialTransaction[]): Array<{
    month: string;
    revenue: number;
    expenses: number;
    net: number;
  }> {
    const monthlyData = transactions.reduce(
      (acc, t) => {
        const month = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { revenue: 0, expenses: 0 };
        }

        if (t.status === 'completed') {
          if (t.type === 'refund') {
            acc[month].expenses += t.amount;
          } else {
            acc[month].revenue += t.amount;
            acc[month].expenses += t.fees || 0;
          }
        }

        return acc;
      },
      {} as Record<string, { revenue: number; expenses: number }>,
    );

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      net: data.revenue - data.expenses,
    }));
  }

  private calculateTopRevenueEvents(transactions: FinancialTransaction[]): Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    attendees: number;
    revenuePerAttendee: number;
  }> {
    const eventRevenue = transactions
      .filter((t) => t.eventId && t.status === 'completed' && t.type !== 'refund')
      .reduce(
        (acc, t) => {
          if (!acc[t.eventId!]) {
            acc[t.eventId!] = {
              eventId: t.eventId!,
              eventName: t.eventName || 'Unknown Event',
              revenue: 0,
              attendees: 0,
            };
          }
          acc[t.eventId!].revenue += t.amount;
          acc[t.eventId!].attendees += 1;
          return acc;
        },
        {} as Record<
          string,
          { eventId: string; eventName: string; revenue: number; attendees: number }
        >,
      );

    return Object.values(eventRevenue)
      .map((event) => ({
        ...event,
        revenuePerAttendee: event.attendees > 0 ? event.revenue / event.attendees : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export const financialExportService = new FinancialExportService();
