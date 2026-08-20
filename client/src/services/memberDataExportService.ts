import apiClient from './apiClient';

/**
 * Member data export — wired to the real backend ExportController.
 *
 * ExportController is mounted at `[Route("api")]` (it is the ONLY backend
 * controller without the `/api/v1` segment). apiClient's baseURL already
 * carries `/api/v1`, so these calls target the host root plus an explicit
 * `/api/...` path — the same proven pattern analyticsExportService uses.
 *
 * The backend has NO JsonStringEnumConverter registered, so enum values
 * (Format, Status) cross the wire as their integer ordinals, not names.
 *
 * The backend exposes exactly three member-export operations — export →
 * status → download. There is NO job-queue, cancel, or history endpoint, so
 * this service intentionally does not expose those (they were previously
 * fabricated against routes the API never had).
 */
const EXPORT_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

/** UI-facing export format. */
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

/** Backend Domain.Enums.ExportFormat ordinals (CSV=0, Excel=1, PDF=2, JSON=3). */
const EXPORT_FORMAT_CODE: Record<ExportFormat, number> = {
  csv: 0,
  excel: 1,
  pdf: 2,
  json: 3,
};

/** Backend Domain.Enums.ExportStatus, normalized to a stable string union. */
export type ExportStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

const EXPORT_STATUS_NAME: Record<number, ExportStatus> = {
  0: 'queued',
  1: 'processing',
  2: 'completed',
  3: 'failed',
  4: 'cancelled',
  5: 'expired',
};

const normalizeStatus = (status: unknown): ExportStatus => {
  if (typeof status === 'number') {
    return EXPORT_STATUS_NAME[status] ?? 'queued';
  }
  if (typeof status === 'string') {
    const lower = status.toLowerCase() as ExportStatus;
    if (lower in EXPORT_STATUS_NAME || Object.values(EXPORT_STATUS_NAME).includes(lower)) {
      return lower;
    }
  }
  return 'queued';
};

export interface MemberExportOptions {
  format: ExportFormat;
  includeFields: string[];
  excludeFields?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeCustomFields?: boolean;
  includeEngagementData?: boolean;
  includeAttendanceHistory?: boolean;
  largeDataset?: boolean;
  filterBy?: {
    membershipType?: string[];
    engagementLevel?: string[];
    lastActivityDate?: string;
  };
}

// Type for custom field values - can be primitive types or nested objects
export type CustomFieldValue = string | number | boolean | Date | null | CustomFieldObject;
export interface CustomFieldObject {
  [key: string]: CustomFieldValue;
}

export interface MemberExportData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipType: string;
  joinDate: string;
  lastActivityDate?: string;
  engagementScore?: number;
  totalEventsAttended?: number;
  attendanceRate?: number;
  customFields?: Record<string, CustomFieldValue>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

/** Mirrors the backend ExportResult returned by POST .../members/export. */
export interface MemberExportResult {
  exportId: string;
  status: ExportStatus;
  fileName: string;
  fileSizeBytes?: number | null;
  requestedAt?: string;
  createdAt?: string;
  completedAt?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  exportedAt?: string | null;
  recordCount?: number | null;
}

/** Mirrors the backend ExportStatusResponse from the status endpoint. */
export interface ExportStatusResponse {
  exportId: string;
  status: ExportStatus;
  progressPercentage: number;
  estimatedCompletion?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  progress: number;
  message?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
}

/** Raw shape returned by the backend (enums as integer ordinals). */
interface RawExportResult {
  exportId?: string;
  status?: number | string;
  fileName?: string;
  fileSizeBytes?: number | null;
  requestedAt?: string;
  createdAt?: string;
  completedAt?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  exportedAt?: string | null;
  recordCount?: number | null;
}

interface RawExportStatusResponse {
  exportId?: string;
  status?: number | string;
  progressPercentage?: number;
  estimatedCompletion?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  progress?: number;
  message?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
}

class MemberDataExportService {
  private url(path: string): string {
    return `${EXPORT_API_BASE}/api/${path}`;
  }

  /**
   * Map the UI options object onto the backend MemberExportRequest shape.
   * The backend request is intentionally coarse: a numeric format, two
   * inclusion booleans, and an optional date range.
   */
  private toRequestBody(options: MemberExportOptions): Record<string, unknown> {
    const personalFields = ['firstName', 'lastName', 'email', 'phone', 'address'];
    const includePersonalInfo = options.includeFields.some((f) => personalFields.includes(f));
    const includeMembershipDetails =
      options.includeFields.includes('membershipType') ||
      options.includeFields.includes('joinDate') ||
      Boolean(options.includeEngagementData);

    return {
      format: EXPORT_FORMAT_CODE[options.format],
      includePersonalInfo,
      includeMembershipDetails,
      dateFrom: options.dateRange?.startDate,
      dateTo: options.dateRange?.endDate,
      options,
    };
  }

  /**
   * Request a member export. Returns the backend ExportResult describing the
   * generated export (status + downloadUrl when complete).
   */
  async exportMembers(clubId: number, options: MemberExportOptions): Promise<MemberExportResult> {
    this.validateExportOptions(options);

    const response = await apiClient.post<RawExportResult>(
      this.url(`clubs/${clubId}/members/export`),
      this.toRequestBody(options),
    );

    const data = response.data ?? {};
    return {
      exportId: data.exportId ?? '',
      status: normalizeStatus(data.status),
      fileName: data.fileName ?? '',
      fileSizeBytes: data.fileSizeBytes ?? null,
      requestedAt: data.requestedAt,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? null,
      downloadUrl: data.downloadUrl ?? null,
      errorMessage: data.errorMessage ?? null,
      exportedAt: data.exportedAt ?? null,
      recordCount: data.recordCount ?? null,
    };
  }

  /**
   * Poll the status of a previously requested export.
   * Backend: GET api/clubs/{clubId}/members/export/{exportId}/status
   */
  async getExportStatus(clubId: number, exportId: string): Promise<ExportStatusResponse> {
    const response = await apiClient.get<RawExportStatusResponse>(
      this.url(`clubs/${clubId}/members/export/${exportId}/status`),
    );

    const data = response.data ?? {};
    return {
      exportId: data.exportId ?? exportId,
      status: normalizeStatus(data.status),
      progressPercentage: data.progressPercentage ?? data.progress ?? 0,
      estimatedCompletion: data.estimatedCompletion ?? null,
      downloadUrl: data.downloadUrl ?? null,
      errorMessage: data.errorMessage ?? null,
      progress: data.progress ?? data.progressPercentage ?? 0,
      message: data.message ?? null,
      createdAt: data.createdAt ?? null,
      completedAt: data.completedAt ?? null,
    };
  }

  /**
   * Download a completed export as a Blob.
   * Backend: GET api/clubs/{clubId}/exports/{exportId}/download
   */
  async downloadExport(clubId: number, exportId: string): Promise<Blob> {
    const response = await apiClient.get(
      this.url(`clubs/${clubId}/exports/${exportId}/download`),
      { responseType: 'blob' },
    );
    return response.data as Blob;
  }

  /**
   * Validate export options before dispatching a request.
   */
  validateExportOptions(options: MemberExportOptions): void {
    if (!options.includeFields || options.includeFields.length === 0) {
      throw new Error('At least one field must be selected for export');
    }

    const validFormats: ExportFormat[] = ['csv', 'excel', 'pdf', 'json'];
    if (!validFormats.includes(options.format)) {
      throw new Error(`Invalid export format: ${options.format}`);
    }
  }

  /**
   * Get available export formats.
   */
  getSupportedFormats(): ExportFormat[] {
    return ['csv', 'excel', 'pdf', 'json'];
  }

  generateMemberCSV(members: MemberExportData[], options: MemberExportOptions): string {
    const headers = this.getCSVHeaders(options);
    const rows = members.map((member) => this.memberToCSVRow(member, options));
    return [headers, ...rows].join('\n');
  }

  private getCSVHeaders(options: MemberExportOptions): string {
    const baseHeaders = ['First Name', 'Last Name', 'Email', 'Membership Type', 'Join Date'];

    if (options.includeFields.includes('phone')) baseHeaders.push('Phone');
    if (options.includeEngagementData) {
      baseHeaders.push('Engagement Score', 'Events Attended', 'Attendance Rate');
    }
    if (options.includeCustomFields) {
      baseHeaders.push('Custom Fields');
    }

    return baseHeaders.join(',');
  }

  private memberToCSVRow(member: MemberExportData, options: MemberExportOptions): string {
    const row = [
      this.escapeCSV(member.firstName),
      this.escapeCSV(member.lastName),
      this.escapeCSV(member.email),
      this.escapeCSV(member.membershipType),
      member.joinDate,
    ];

    if (options.includeFields.includes('phone')) {
      row.push(this.escapeCSV(member.phone || ''));
    }

    if (options.includeEngagementData) {
      row.push(
        (member.engagementScore || 0).toString(),
        (member.totalEventsAttended || 0).toString(),
        (member.attendanceRate || 0).toString(),
      );
    }

    if (options.includeCustomFields && member.customFields) {
      row.push(this.escapeCSV(JSON.stringify(member.customFields)));
    }

    return row.join(',');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export const memberDataExportService = new MemberDataExportService();
