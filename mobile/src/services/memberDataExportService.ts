/* eslint-disable @typescript-eslint/no-explicit-any */
// Export service uses any for generic data transformation

/**
 * Member Data Export Service
 * Handles member data export with filtering, validation, and email notifications
 */

import { emailService } from './emailService';
import { clubAuthorizationService } from './clubAuthorizationService';
import { authService } from './authService';

export interface MemberExportOptions {
  includeInactive?: boolean;
  includeSensitiveData?: boolean;
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  membershipTypes?: string[];
  customFields?: string[];
  filterCriteria?: {
    status?: string[];
    tier?: string[];
    joinDateAfter?: Date;
    joinDateBefore?: Date;
  };
}

export interface ExportResult {
  success: boolean;
  data?: any;
  filePath?: string;
  recordCount?: number;
  errorMessage?: string;
}

export interface BackgroundExportJob {
  jobId: string;
  clubId: number;
  userId: number;
  format: ExportFormat;
  options: MemberExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  emailNotification?: boolean;
  recipientEmail?: string;
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  Excel = 'Excel',
  PDF = 'PDF'
}

class MemberDataExportService {
  private backgroundJobs: Map<string, BackgroundExportJob> = new Map();

  /**
   * Export members to JSON format with proper filtering
   */
  async exportMembersToJson(clubId: number, options: MemberExportOptions = {}): Promise<ExportResult> {
    try {
      // Validate authorization
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errorMessage: 'Unauthorized: User not authenticated'
        };
      }
      const hasAccess = await clubAuthorizationService.validateClubAccess(clubId, currentUser.user.userId);
      
      if (!hasAccess) {
        return {
          success: false,
          errorMessage: 'Unauthorized: No access to this club'
        };
      }

      // Get member data with filters applied
      const members = await this.getMembersWithFilters(clubId, options);
      
      // Format as JSON with proper structure
      const jsonData = {
        exportMetadata: {
          clubId,
          exportDate: new Date().toISOString(),
          recordCount: members.length,
          filters: options.filterCriteria || {},
          includeInactive: options.includeInactive || false
        },
        members: members.map(member => this.formatMemberForExport(member, options))
      };

      return {
        success: true,
        data: jsonData,
        recordCount: members.length
      };
    } catch (_error) {
      return {
        success: false,
        errorMessage: 'Export failed'
      };
    }
  }

  /**
   * Export members to CSV format
   */
  async exportMembersToCsv(clubId: number, options: MemberExportOptions = {}): Promise<Buffer> {
    const result = await this.exportMembersToJson(clubId, options);
    
    if (!result.success || !result.data) {
      throw new Error(result.errorMessage || 'Export failed');
    }

    // Convert JSON to CSV
    const csvContent = this.convertJsonToCsv(result.data.members);
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Export members to Excel format
   */
  async exportMembersToExcel(clubId: number, options: MemberExportOptions = {}): Promise<Buffer> {
    const result = await this.exportMembersToJson(clubId, options);
    
    if (!result.success || !result.data) {
      throw new Error(result.errorMessage || 'Export failed');
    }

    // Mock Excel generation - in real implementation, use ExcelJS or similar
    const excelContent = this.convertJsonToExcel(result.data.members);
    return Buffer.from(excelContent, 'utf-8');
  }

  /**
   * Export members to PDF format
   */
  async exportMembersToPdf(clubId: number, options: MemberExportOptions = {}): Promise<Buffer> {
    const result = await this.exportMembersToJson(clubId, options);
    
    if (!result.success || !result.data) {
      throw new Error(result.errorMessage || 'Export failed');
    }

    // Mock PDF generation - in real implementation, use PDFKit or similar
    const pdfContent = this.convertJsonToPdf(result.data.members);
    return Buffer.from(pdfContent, 'utf-8');
  }

  /**
   * Process background member export with email notification
   */
  async processBackgroundMemberExport(
    clubId: number, 
    format: ExportFormat, 
    options: MemberExportOptions = {},
    emailNotification: boolean = false,
    recipientEmail?: string
  ): Promise<string> {
    const currentUser = await authService.getCurrentUser();
    const jobId = this.generateJobId();
    
    // Create background job
    const job: BackgroundExportJob = {
      jobId,
      clubId,
      userId: currentUser.user.userId,
      format,
      options,
      status: 'pending',
      createdAt: new Date(),
      emailNotification,
      recipientEmail: recipientEmail || currentUser.user.email
    };

    this.backgroundJobs.set(jobId, job);

    // Process job asynchronously
    this.processExportJob(jobId).catch(() => {
      const failedJob = this.backgroundJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        this.backgroundJobs.set(jobId, failedJob);
      }
    });

    return jobId;
  }

  /**
   * Get background export job status
   */
  getBackgroundJobStatus(jobId: string): BackgroundExportJob | null {
    return this.backgroundJobs.get(jobId) || null;
  }

  // Private helper methods

  private async processExportJob(jobId: string): Promise<void> {
    const job = this.backgroundJobs.get(jobId);
    if (!job) return;

    try {
      // Update status to processing
      job.status = 'processing';
      this.backgroundJobs.set(jobId, job);

      // Perform export
      let exportData: Buffer;
      switch (job.format) {
        case ExportFormat.JSON: {
          const jsonResult = await this.exportMembersToJson(job.clubId, job.options);
          if (!jsonResult.success) throw new Error(jsonResult.errorMessage);
          exportData = Buffer.from(JSON.stringify(jsonResult.data, null, 2));
          break;
        }
        case ExportFormat.CSV:
          exportData = await this.exportMembersToCsv(job.clubId, job.options);
          break;
        case ExportFormat.Excel:
          exportData = await this.exportMembersToExcel(job.clubId, job.options);
          break;
        case ExportFormat.PDF:
          exportData = await this.exportMembersToPdf(job.clubId, job.options);
          break;
        default:
          throw new Error(`Unsupported export format: ${job.format}`);
      }

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date();
      this.backgroundJobs.set(jobId, job);

      // Send email notification if requested
      if (job.emailNotification && job.recipientEmail) {
        await this.sendExportCompletionEmail(job, exportData);
      }
    } catch (_error) {
      job.status = 'failed';
      this.backgroundJobs.set(jobId, job);
      throw _error;
    }
  }

  private async sendExportCompletionEmail(job: BackgroundExportJob, exportData: Buffer): Promise<void> {
    if (!job.recipientEmail) return;

    const fileName = `members-export-${job.jobId}.${job.format.toLowerCase()}`;
    
    await emailService.sendEmailWithAttachment({
      to: job.recipientEmail,
      subject: `Member Export Complete - ${job.format}`,
      body: `
        Your member export has been completed successfully.
        
        Export Details:
        - Club ID: ${job.clubId}
        - Format: ${job.format}
        - Completed: ${job.completedAt?.toISOString()}
        - Job ID: ${job.jobId}
        
        Please find the exported data attached.
      `,
      attachments: [{
        filename: fileName,
        content: exportData
      }]
    });
  }

  private async getMembersWithFilters(clubId: number, options: MemberExportOptions): Promise<any[]> {
    // Mock implementation - in real app, this would query the database
    const allMembers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'Active',
        membershipType: 'Premium',
        joinDate: new Date('2023-01-15'),
        phone: '+1234567890',
        address: '123 Main St',
        tier: 'Premium'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'Inactive',
        membershipType: 'Basic',
        joinDate: new Date('2023-06-20'),
        phone: '+1234567891',
        address: '456 Oak Ave',
        tier: 'Basic'
      }
    ];

    // Apply filters
    let filteredMembers = allMembers;

    if (!options.includeInactive) {
      filteredMembers = filteredMembers.filter(member => member.status === 'Active');
    }

    if (options.filterCriteria?.status) {
      filteredMembers = filteredMembers.filter(member => 
        options.filterCriteria!.status!.includes(member.status)
      );
    }

    if (options.filterCriteria?.tier) {
      filteredMembers = filteredMembers.filter(member => 
        options.filterCriteria!.tier!.includes(member.tier)
      );
    }

    if (options.filterCriteria?.joinDateAfter) {
      filteredMembers = filteredMembers.filter(member => 
        member.joinDate >= options.filterCriteria!.joinDateAfter!
      );
    }

    if (options.filterCriteria?.joinDateBefore) {
      filteredMembers = filteredMembers.filter(member => 
        member.joinDate <= options.filterCriteria!.joinDateBefore!
      );
    }

    return filteredMembers;
  }

  private formatMemberForExport(member: any, options: MemberExportOptions): any {
    const formatted: any = {
      id: member.id,
      name: member.name,
      email: member.email,
      status: member.status,
      membershipType: member.membershipType,
      joinDate: member.joinDate.toISOString()
    };

    // Include sensitive data only if requested and authorized
    if (options.includeSensitiveData) {
      formatted.phone = member.phone;
      formatted.address = member.address;
    }

    // Include custom fields if specified
    if (options.customFields) {
      options.customFields.forEach(field => {
        if (member[field] !== undefined) {
          formatted[field] = member[field];
        }
      });
    }

    return formatted;
  }

  private convertJsonToCsv(members: any[]): string {
    if (members.length === 0) return '';

    const headers = Object.keys(members[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...members.map(member => 
        headers.map(header => {
          const value = member[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private convertJsonToExcel(members: any[]): string {
    // Mock Excel conversion - in real implementation, use ExcelJS
    return `Excel format data for ${members.length} members`;
  }

  private convertJsonToPdf(members: any[]): string {
    // Mock PDF conversion - in real implementation, use PDFKit
    return `PDF format data for ${members.length} members`;
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const memberDataExportService = new MemberDataExportService();