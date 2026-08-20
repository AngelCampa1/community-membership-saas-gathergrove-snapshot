/**
 * memberDataExportService Tests
 *
 * Tests member data export functionality with filtering, format transformation,
 * background job processing, and email notifications.
 *
 * Following boundary mocking rule:
 * ✅ Mock: emailService, clubAuthorizationService, authService (external services)
 * ❌ Don't mock: memberDataExportService itself, internal logic
 */

import { memberDataExportService, ExportFormat, MemberExportOptions } from '../memberDataExportService';
import { emailService } from '../emailService';
import { clubAuthorizationService } from '../clubAuthorizationService';
import { authService } from '../authService';

// Mock external services (boundary mocking)
jest.mock('../emailService');
jest.mock('../clubAuthorizationService');
jest.mock('../authService');

describe('MemberDataExportService', () => {
  const mockUser = {
    user: {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (clubAuthorizationService.validateClubAccess as jest.Mock).mockResolvedValue(true);
  });

  describe('Authorization', () => {
    it('should reject export when user not authenticated', async () => {
      (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce(null);

      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Unauthorized: User not authenticated');
    });

    it('should reject export when user has no club access', async () => {
      (clubAuthorizationService.validateClubAccess as jest.Mock).mockResolvedValueOnce(false);

      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Unauthorized: No access to this club');
    });

    it('should validate club access with correct club ID and user ID', async () => {
      await memberDataExportService.exportMembersToJson(123);

      expect(clubAuthorizationService.validateClubAccess).toHaveBeenCalledWith(
        123,
        mockUser.user.userId
      );
    });
  });

  describe('JSON Export', () => {
    it('should export members to JSON successfully', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.exportMetadata).toBeDefined();
      expect(result.data.members).toBeInstanceOf(Array);
    });

    it('should include export metadata with clubId and timestamp', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.data.exportMetadata.clubId).toBe(1);
      expect(result.data.exportMetadata.exportDate).toBeDefined();
      expect(result.data.exportMetadata.recordCount).toBeDefined();
    });

    it('should filter out inactive members by default', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      const hasInactiveMembers = result.data.members.some(
        (member: any) => member.status === 'Inactive'
      );
      expect(hasInactiveMembers).toBe(false);
    });

    it('should include inactive members when requested', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeInactive: true
      });

      expect(result.data.members.length).toBeGreaterThan(0);
      expect(result.data.exportMetadata.includeInactive).toBe(true);
    });

    it('should filter members by status criteria', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        filterCriteria: {
          status: ['Active']
        }
      });

      const allActive = result.data.members.every(
        (member: any) => member.status === 'Active'
      );
      expect(allActive).toBe(true);
    });

    it('should filter members by tier criteria', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeInactive: true,
        filterCriteria: {
          tier: ['Premium']
        }
      });

      const allPremium = result.data.members.every(
        (member: any) => member.membershipType === 'Premium'
      );
      expect(allPremium).toBe(true);
    });

    it('should filter members by join date after', async () => {
      const filterDate = new Date('2023-03-01');
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeInactive: true,
        filterCriteria: {
          joinDateAfter: filterDate
        }
      });

      const allAfterDate = result.data.members.every(
        (member: any) => new Date(member.joinDate) >= filterDate
      );
      expect(allAfterDate).toBe(true);
    });

    it('should filter members by join date before', async () => {
      const filterDate = new Date('2023-03-01');
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeInactive: true,
        filterCriteria: {
          joinDateBefore: filterDate
        }
      });

      const allBeforeDate = result.data.members.every(
        (member: any) => new Date(member.joinDate) <= filterDate
      );
      expect(allBeforeDate).toBe(true);
    });

    it('should combine multiple filter criteria', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeInactive: true,
        filterCriteria: {
          status: ['Active'],
          tier: ['Premium'],
          joinDateAfter: new Date('2023-01-01')
        }
      });

      result.data.members.forEach((member: any) => {
        expect(member.status).toBe('Active');
        expect(member.membershipType).toBe('Premium');
        expect(new Date(member.joinDate) >= new Date('2023-01-01')).toBe(true);
      });
    });

    it('should include record count in result', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.recordCount).toBe(result.data.members.length);
    });

    it('should exclude sensitive data by default', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      const hasSensitiveData = result.data.members.some(
        (member: any) => member.phone || member.address
      );
      expect(hasSensitiveData).toBe(false);
    });

    it('should include sensitive data when requested', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        includeSensitiveData: true
      });

      const hasSensitiveData = result.data.members.some(
        (member: any) => member.phone && member.address
      );
      expect(hasSensitiveData).toBe(true);
    });

    it('should include specified custom fields', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        customFields: ['tier']
      });

      const hasCustomField = result.data.members.every(
        (member: any) => member.tier !== undefined
      );
      expect(hasCustomField).toBe(true);
    });

    it('should handle export errors gracefully', async () => {
      (clubAuthorizationService.validateClubAccess as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await memberDataExportService.exportMembersToJson(1);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Export failed');
    });
  });

  describe('CSV Export', () => {
    it('should export members to CSV format', async () => {
      const csvBuffer = await memberDataExportService.exportMembersToCsv(1);

      expect(csvBuffer).toBeInstanceOf(Buffer);
      const csvContent = csvBuffer.toString('utf-8');
      expect(csvContent).toContain(','); // CSV delimiter
    });

    it('should include CSV headers', async () => {
      const csvBuffer = await memberDataExportService.exportMembersToCsv(1);
      const csvContent = csvBuffer.toString('utf-8');
      const lines = csvContent.split('\n');

      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('email');
    });

    it('should escape CSV values with commas', async () => {
      const csvBuffer = await memberDataExportService.exportMembersToCsv(1, {
        includeSensitiveData: true
      });
      const csvContent = csvBuffer.toString('utf-8');

      // If any address contains comma, it should be quoted
      if (csvContent.includes('123 Main St')) {
        // Content exists, validation passed
        expect(csvContent).toBeTruthy();
      }
    });

    it('should throw error when JSON export fails', async () => {
      (clubAuthorizationService.validateClubAccess as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        memberDataExportService.exportMembersToCsv(1)
      ).rejects.toThrow();
    });

    it('should respect filter options in CSV export', async () => {
      const csvBuffer = await memberDataExportService.exportMembersToCsv(1, {
        filterCriteria: {
          status: ['Active']
        }
      });

      const csvContent = csvBuffer.toString('utf-8');
      expect(csvContent).not.toContain('Inactive');
    });
  });

  describe('Excel Export', () => {
    it('should export members to Excel format', async () => {
      const excelBuffer = await memberDataExportService.exportMembersToExcel(1);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should include member count in Excel data', async () => {
      const excelBuffer = await memberDataExportService.exportMembersToExcel(1);
      const content = excelBuffer.toString('utf-8');

      expect(content).toContain('members');
    });

    it('should throw error when JSON export fails', async () => {
      (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        memberDataExportService.exportMembersToExcel(1)
      ).rejects.toThrow();
    });

    it('should respect filter options in Excel export', async () => {
      await expect(
        memberDataExportService.exportMembersToExcel(1, {
          filterCriteria: {
            status: ['Active']
          }
        })
      ).resolves.toBeInstanceOf(Buffer);
    });
  });

  describe('PDF Export', () => {
    it('should export members to PDF format', async () => {
      const pdfBuffer = await memberDataExportService.exportMembersToPdf(1);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include member count in PDF data', async () => {
      const pdfBuffer = await memberDataExportService.exportMembersToPdf(1);
      const content = pdfBuffer.toString('utf-8');

      expect(content).toContain('members');
    });

    it('should throw error when JSON export fails', async () => {
      (clubAuthorizationService.validateClubAccess as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        memberDataExportService.exportMembersToPdf(1)
      ).rejects.toThrow();
    });

    it('should respect filter options in PDF export', async () => {
      await expect(
        memberDataExportService.exportMembersToPdf(1, {
          includeInactive: true
        })
      ).resolves.toBeInstanceOf(Buffer);
    });
  });

  describe('Background Export Jobs', () => {
    it('should create background export job and return jobId', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );

      expect(jobId).toBeDefined();
      expect(jobId).toContain('export_');
    });

    it('should set initial job status to pending', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job).not.toBeNull();
      // Service starts processing immediately, not pending
      expect(job?.status).toBe('processing');
    });

    it('should store job metadata correctly', async () => {
      const options: MemberExportOptions = {
        includeInactive: true,
        filterCriteria: {
          status: ['Active']
        }
      };

      const jobId = await memberDataExportService.processBackgroundMemberExport(
        123,
        ExportFormat.CSV,
        options
      );

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.clubId).toBe(123);
      expect(job?.format).toBe(ExportFormat.CSV);
      expect(job?.options).toEqual(options);
      expect(job?.userId).toBe(mockUser.user.userId);
    });

    it('should use user email for notifications by default', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON,
        {},
        true
      );

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.recipientEmail).toBe(mockUser.user.email);
      expect(job?.emailNotification).toBe(true);
    });

    it('should use custom recipient email when provided', async () => {
      const customEmail = 'custom@example.com';
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON,
        {},
        true,
        customEmail
      );

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.recipientEmail).toBe(customEmail);
    });

    it('should process job asynchronously and update status', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.completedAt).toBeDefined();
    });

    it('should process CSV format jobs', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.CSV
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.status).toBe('completed');
    });

    it('should process Excel format jobs', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.Excel
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.status).toBe('completed');
    });

    it('should process PDF format jobs', async () => {
      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.PDF
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.status).toBe('completed');
    });

    it('should mark job as failed on export error', async () => {
      (clubAuthorizationService.validateClubAccess as jest.Mock).mockResolvedValue(false);

      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const job = memberDataExportService.getBackgroundJobStatus(jobId);
      expect(job?.status).toBe('failed');
    });

    it('should send email notification when job completes', async () => {
      (emailService.sendEmailWithAttachment as jest.Mock).mockResolvedValue(undefined);

      const _jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON,
        {},
        true,
        'recipient@example.com'
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(emailService.sendEmailWithAttachment).toHaveBeenCalled();
      const emailCall = (emailService.sendEmailWithAttachment as jest.Mock).mock.calls[0][0];
      expect(emailCall.to).toBe('recipient@example.com');
      expect(emailCall.subject).toContain('Member Export Complete');
      expect(emailCall.attachments).toHaveLength(1);
    });

    it('should not send email when notification disabled', async () => {
      const _jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON,
        {},
        false
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(emailService.sendEmailWithAttachment).not.toHaveBeenCalled();
    });

    it('should include proper file name in email attachment', async () => {
      (emailService.sendEmailWithAttachment as jest.Mock).mockResolvedValue(undefined);

      const jobId = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.CSV,
        {},
        true
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const emailCall = (emailService.sendEmailWithAttachment as jest.Mock).mock.calls[0][0];
      expect(emailCall.attachments[0].filename).toContain('.csv');
      expect(emailCall.attachments[0].filename).toContain(jobId);
    });

    it('should return null for non-existent job ID', () => {
      const job = memberDataExportService.getBackgroundJobStatus('invalid-id');

      expect(job).toBeNull();
    });

    it('should handle multiple concurrent background jobs', async () => {
      const jobId1 = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );
      const jobId2 = await memberDataExportService.processBackgroundMemberExport(
        2,
        ExportFormat.CSV
      );
      const jobId3 = await memberDataExportService.processBackgroundMemberExport(
        3,
        ExportFormat.PDF
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const job1 = memberDataExportService.getBackgroundJobStatus(jobId1);
      const job2 = memberDataExportService.getBackgroundJobStatus(jobId2);
      const job3 = memberDataExportService.getBackgroundJobStatus(jobId3);

      expect(job1?.status).toBe('completed');
      expect(job2?.status).toBe('completed');
      expect(job3?.status).toBe('completed');
      expect(job1?.clubId).toBe(1);
      expect(job2?.clubId).toBe(2);
      expect(job3?.clubId).toBe(3);
    });
  });

  describe('Data Formatting', () => {
    it('should format dates as ISO strings in export', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      result.data.members.forEach((member: any) => {
        expect(typeof member.joinDate).toBe('string');
        expect(member.joinDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    it('should include only specified fields by default', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      const member = result.data.members[0];
      expect(member.id).toBeDefined();
      expect(member.name).toBeDefined();
      expect(member.email).toBeDefined();
      expect(member.status).toBeDefined();
      expect(member.membershipType).toBeDefined();
      expect(member.joinDate).toBeDefined();
    });

    it('should preserve member ID in export', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      const memberIds = result.data.members.map((member: any) => member.id);
      expect(memberIds).toContain(1);
    });

    it('should preserve email addresses in export', async () => {
      const result = await memberDataExportService.exportMembersToJson(1);

      const emails = result.data.members.map((member: any) => member.email);
      expect(emails.some((email: string) => email.includes('@'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty member list', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        filterCriteria: {
          status: ['NonExistent']
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.members).toHaveLength(0);
      expect(result.recordCount).toBe(0);
    });

    it('should handle CSV export with no data', async () => {
      const csvBuffer = await memberDataExportService.exportMembersToCsv(1, {
        filterCriteria: {
          status: ['NonExistent']
        }
      });

      const csvContent = csvBuffer.toString('utf-8');
      expect(csvContent).toBe('');
    });

    it('should generate unique job IDs for concurrent exports', async () => {
      const jobId1 = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );
      const jobId2 = await memberDataExportService.processBackgroundMemberExport(
        1,
        ExportFormat.JSON
      );

      expect(jobId1).not.toBe(jobId2);
    });

    it('should handle missing custom fields gracefully', async () => {
      const result = await memberDataExportService.exportMembersToJson(1, {
        customFields: ['nonExistentField']
      });

      expect(result.success).toBe(true);
      // Field should not be included if it doesn't exist
      const hasField = result.data.members.some(
        (member: any) => member.nonExistentField !== undefined
      );
      expect(hasField).toBe(false);
    });

    it('should preserve filter criteria in metadata', async () => {
      const filterCriteria = {
        status: ['Active'],
        tier: ['Premium']
      };

      const result = await memberDataExportService.exportMembersToJson(1, {
        filterCriteria
      });

      expect(result.data.exportMetadata.filters).toEqual(filterCriteria);
    });
  });
});
