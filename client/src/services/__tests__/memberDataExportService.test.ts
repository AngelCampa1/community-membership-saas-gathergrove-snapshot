/**
 * memberDataExportService tests
 *
 * Boundary mocking: only the apiClient HTTP layer is mocked. The real
 * memberDataExportService runs, so these tests exercise genuine option →
 * request-body mapping, integer enum encoding, status normalization, and
 * absolute-URL targeting against the real backend ExportController contract.
 *
 * ExportController is mounted at `[Route("api")]` (no `/api/v1`), so the
 * service targets the host root plus an explicit `/api/...` path. The backend
 * registers no JsonStringEnumConverter, so enums cross the wire as integer
 * ordinals — these tests assert the numeric Format codes and decode the
 * integer ExportStatus ordinals back to the stable string union.
 */

import apiClient from '@/services/apiClient';
import {
  memberDataExportService,
  type MemberExportOptions,
  type MemberExportData,
} from '@/services/memberDataExportService';

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

describe('memberDataExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportMembers', () => {
    it('posts to the absolute ExportController route with a numeric CSV format code', async () => {
      const clubId = 123;
      const options: MemberExportOptions = {
        format: 'csv',
        includeFields: ['firstName', 'lastName', 'email'],
      };

      mockPost.mockResolvedValueOnce({
        data: {
          exportId: 'exp-1',
          status: 2,
          fileName: 'members_123.csv',
          fileSizeBytes: 2048,
          downloadUrl: '/api/clubs/123/exports/exp-1/download',
          recordCount: 57,
        },
      });

      const result = await memberDataExportService.exportMembers(clubId, options);

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe(`${HOST}/api/clubs/123/members/export`);
      expect(body).toMatchObject({
        format: 0, // csv ordinal
        includePersonalInfo: true,
        includeMembershipDetails: false,
      });

      expect(result).toEqual({
        exportId: 'exp-1',
        status: 'completed',
        fileName: 'members_123.csv',
        fileSizeBytes: 2048,
        requestedAt: undefined,
        createdAt: undefined,
        completedAt: null,
        downloadUrl: '/api/clubs/123/exports/exp-1/download',
        errorMessage: null,
        exportedAt: null,
        recordCount: 57,
      });
    });

    it('encodes the excel format as ordinal 1 and flags membership details', async () => {
      const clubId = 456;
      const options: MemberExportOptions = {
        format: 'excel',
        includeFields: ['membershipType', 'joinDate'],
        includeEngagementData: true,
      };

      mockPost.mockResolvedValueOnce({ data: { exportId: 'exp-2', status: 1 } });

      await memberDataExportService.exportMembers(clubId, options);

      const [url, body] = mockPost.mock.calls[0];
      expect(url).toBe(`${HOST}/api/clubs/456/members/export`);
      expect(body).toMatchObject({
        format: 1, // excel ordinal
        includePersonalInfo: false,
        includeMembershipDetails: true,
      });
    });

    it('encodes pdf and json as ordinals 2 and 3', async () => {
      mockPost.mockResolvedValue({ data: { exportId: 'x', status: 0 } });

      await memberDataExportService.exportMembers(1, {
        format: 'pdf',
        includeFields: ['firstName'],
      });
      expect(mockPost.mock.calls[0][1]).toMatchObject({ format: 2 });

      await memberDataExportService.exportMembers(1, {
        format: 'json',
        includeFields: ['firstName'],
      });
      expect(mockPost.mock.calls[1][1]).toMatchObject({ format: 3 });
    });

    it('passes the date range through as dateFrom/dateTo', async () => {
      mockPost.mockResolvedValueOnce({ data: { exportId: 'exp-3', status: 0 } });

      await memberDataExportService.exportMembers(7, {
        format: 'csv',
        includeFields: ['firstName'],
        dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
      });

      expect(mockPost.mock.calls[0][1]).toMatchObject({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });
    });

    it('normalizes a queued status response', async () => {
      mockPost.mockResolvedValueOnce({ data: { exportId: 'exp-4', status: 0 } });

      const result = await memberDataExportService.exportMembers(1, {
        format: 'csv',
        includeFields: ['firstName'],
      });

      expect(result.status).toBe('queued');
      expect(result.exportId).toBe('exp-4');
    });

    it('validates required fields before making a request', async () => {
      await expect(
        memberDataExportService.exportMembers(1, {
          format: 'csv',
          includeFields: [],
        }),
      ).rejects.toThrow('At least one field must be selected for export');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('propagates a backend error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Request failed with status code 500'));

      await expect(
        memberDataExportService.exportMembers(1, {
          format: 'csv',
          includeFields: ['firstName'],
        }),
      ).rejects.toThrow('Request failed with status code 500');
    });
  });

  describe('getExportStatus', () => {
    it('gets the absolute status route and normalizes the integer status', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          exportId: 'exp-9',
          status: 1,
          progressPercentage: 45,
          progress: 45,
          downloadUrl: null,
        },
      });

      const result = await memberDataExportService.getExportStatus(123, 'exp-9');

      expect(mockGet).toHaveBeenCalledWith(
        `${HOST}/api/clubs/123/members/export/exp-9/status`,
      );
      expect(result.status).toBe('processing');
      expect(result.progressPercentage).toBe(45);
      expect(result.progress).toBe(45);
    });

    it('falls back to progress when progressPercentage is absent', async () => {
      mockGet.mockResolvedValueOnce({
        data: { exportId: 'exp-10', status: 2, progress: 100 },
      });

      const result = await memberDataExportService.getExportStatus(5, 'exp-10');

      expect(result.status).toBe('completed');
      expect(result.progressPercentage).toBe(100);
      expect(result.progress).toBe(100);
    });

    it('preserves the requested exportId when the response omits it', async () => {
      mockGet.mockResolvedValueOnce({ data: { status: 3 } });

      const result = await memberDataExportService.getExportStatus(5, 'exp-fallback');

      expect(result.exportId).toBe('exp-fallback');
      expect(result.status).toBe('failed');
    });
  });

  describe('downloadExport', () => {
    it('requests the download route as a blob', async () => {
      const blob = new Blob(['csv,data'], { type: 'text/csv' });
      mockGet.mockResolvedValueOnce({ data: blob });

      const result = await memberDataExportService.downloadExport(123, 'exp-9');

      expect(mockGet).toHaveBeenCalledWith(
        `${HOST}/api/clubs/123/exports/exp-9/download`,
        { responseType: 'blob' },
      );
      expect(result).toBe(blob);
    });
  });

  describe('validateExportOptions', () => {
    it('accepts a valid option set', () => {
      expect(() =>
        memberDataExportService.validateExportOptions({
          format: 'pdf',
          includeFields: ['firstName'],
        }),
      ).not.toThrow();
    });

    it('rejects an empty field selection', () => {
      expect(() =>
        memberDataExportService.validateExportOptions({
          format: 'csv',
          includeFields: [],
        }),
      ).toThrow('At least one field must be selected for export');
    });

    it('rejects an invalid format', () => {
      expect(() =>
        memberDataExportService.validateExportOptions({
          format: 'xml' as unknown as MemberExportOptions['format'],
          includeFields: ['firstName'],
        }),
      ).toThrow('Invalid export format: xml');
    });
  });

  describe('getSupportedFormats', () => {
    it('returns the four backend-supported formats', () => {
      expect(memberDataExportService.getSupportedFormats()).toEqual([
        'csv',
        'excel',
        'pdf',
        'json',
      ]);
    });
  });

  describe('generateMemberCSV', () => {
    const members: MemberExportData[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-0123',
        membershipType: 'Premium',
        joinDate: '2023-01-15',
        engagementScore: 85.5,
        totalEventsAttended: 12,
        attendanceRate: 80,
        customFields: { interests: 'Technology, Music' },
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        membershipType: 'Basic',
        joinDate: '2023-03-20',
      },
    ];

    it('generates a header plus a row per member', () => {
      const csv = memberDataExportService.generateMemberCSV(members, {
        format: 'csv',
        includeFields: ['firstName', 'lastName', 'email'],
      });

      expect(csv).toContain('First Name,Last Name,Email,Membership Type,Join Date');
      expect(csv).toContain('John,Doe,john@example.com,Premium,2023-01-15');
      expect(csv).toContain('Jane,Smith,jane@example.com,Basic,2023-03-20');
    });

    it('includes phone when requested', () => {
      const csv = memberDataExportService.generateMemberCSV(members, {
        format: 'csv',
        includeFields: ['firstName', 'lastName', 'phone'],
      });

      expect(csv).toContain('Phone');
      expect(csv).toContain('555-0123');
    });

    it('includes engagement columns when requested', () => {
      const csv = memberDataExportService.generateMemberCSV(members, {
        format: 'csv',
        includeFields: ['firstName', 'lastName'],
        includeEngagementData: true,
      });

      expect(csv).toContain('Engagement Score');
      expect(csv).toContain('Events Attended');
      expect(csv).toContain('Attendance Rate');
      expect(csv).toContain('85.5');
    });

    it('includes custom fields when requested', () => {
      const csv = memberDataExportService.generateMemberCSV(members, {
        format: 'csv',
        includeFields: ['firstName'],
        includeCustomFields: true,
      });

      expect(csv).toContain('Custom Fields');
      expect(csv).toContain('interests');
    });

    it('escapes commas, quotes, and newlines', () => {
      const tricky: MemberExportData[] = [
        {
          ...members[0],
          firstName: 'Smith, John',
          lastName: 'John "Johnny"',
          email: 'a\nb',
        },
      ];

      const csv = memberDataExportService.generateMemberCSV(tricky, {
        format: 'csv',
        includeFields: ['firstName', 'lastName', 'email'],
      });

      expect(csv).toContain('"Smith, John"');
      expect(csv).toContain('"John ""Johnny"""');
      expect(csv).toContain('"a\nb"');
    });

    it('renders zero engagement values', () => {
      const zeroed: MemberExportData[] = [
        { ...members[0], engagementScore: 0, totalEventsAttended: 0, attendanceRate: 0 },
      ];

      const csv = memberDataExportService.generateMemberCSV(zeroed, {
        format: 'csv',
        includeFields: ['firstName'],
        includeEngagementData: true,
      });

      expect(csv).toContain('0,0,0');
    });

    it('handles an empty members array (header only)', () => {
      const csv = memberDataExportService.generateMemberCSV([], {
        format: 'csv',
        includeFields: ['firstName', 'lastName'],
      });

      expect(csv.split('\n')).toHaveLength(1);
      expect(csv).toContain('First Name,Last Name');
    });
  });
});
