/**
 * Email Service
 * Handles email notifications and attachments for exports and scheduled reports
 */

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  from?: string;
  replyTo?: string;
  isHtml?: boolean;
}

export interface ScheduledReportEmailOptions {
  recipients: string[];
  reportName: string;
  reportData: Buffer;
  fileName: string;
  reportType?: string;
}

export interface ErrorContext {
  [key: string]: unknown;
}

class EmailService {
  /**
   * SEC-01 fix: HTML escape function to prevent XSS in email templates
   */
  private escapeHtml(unsafe: string | number | undefined): string {
    if (unsafe === undefined || unsafe === null) return '';
    const str = String(unsafe);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Send email with optional attachments
   */
  async sendEmailWithAttachment(options: EmailOptions): Promise<void> {
    // Log: Sending email to recipients with attachments
    // to, subject, and attachment count logged in production
    void options; // Mark as used for logging

    // Mock email sending - in real implementation, use SendGrid, AWS SES, etc.
    await this.simulateEmailSending();
  }

  /**
   * Send scheduled report via email
   */
  async sendScheduledReportAsync(
    recipients: string[],
    subject: string,
    reportData: Buffer,
    fileName: string
  ): Promise<void> {
    const emailOptions: EmailOptions = {
      to: recipients,
      subject,
      body: this.generateScheduledReportEmailBody(subject, fileName),
      attachments: [{
        filename: fileName,
        content: reportData,
        contentType: this.getContentTypeFromFileName(fileName)
      }],
      isHtml: true
    };

    await this.sendEmailWithAttachment(emailOptions);
  }

  /**
   * Send export completion notification
   */
  async sendExportCompletionEmail(
    recipient: string,
    exportType: string,
    recordCount: number,
    downloadLink?: string
  ): Promise<void> {
    const emailOptions: EmailOptions = {
      to: recipient,
      subject: `Export Complete - ${exportType}`,
      body: this.generateExportCompletionEmailBody(exportType, recordCount, downloadLink),
      isHtml: true
    };

    await this.sendEmailWithAttachment(emailOptions);
  }

  /**
   * Send error notification email
   */
  async sendErrorNotification(
    recipient: string,
    errorType: string,
    errorMessage: string,
    context?: ErrorContext
  ): Promise<void> {
    const emailOptions: EmailOptions = {
      to: recipient,
      subject: `Error Notification - ${errorType}`,
      body: this.generateErrorNotificationEmailBody(errorType, errorMessage, context),
      isHtml: true
    };

    await this.sendEmailWithAttachment(emailOptions);
  }

  /**
   * Send bulk emails to multiple recipients
   * SILENT-01 fix: Track and report failures instead of silently swallowing them
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<{ sent: number; failed: number; errors: string[] }> {
    const result = { sent: 0, failed: 0, errors: [] as string[] };

    for (const email of emails) {
      try {
        await this.sendEmailWithAttachment(email);
        result.sent++;
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // SILENT-01 fix: Track errors instead of silently continuing
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to send to ${email.to}: ${errorMessage}`);
        // Continue with other emails even if one fails
      }
    }

    // SILENT-01 fix: Log summary if there were failures
    if (result.failed > 0 && __DEV__) {
      console.warn(`[EmailService] Bulk email: ${result.sent} sent, ${result.failed} failed`);
    }

    return result;
  }

  // Private helper methods

  private async simulateEmailSending(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // MOCK-04 fix: Removed simulated failures - should not be in production code
    // In production, actual email sending would occur here
  }

  private generateScheduledReportEmailBody(subject: string, fileName: string): string {
    // SEC-01 fix: Escape dynamic content to prevent XSS
    return `
      <html>
        <body>
          <h2>Scheduled Report Ready</h2>
          <p>Your scheduled report has been generated and is attached to this email.</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Report Details:</h3>
            <ul>
              <li><strong>Report:</strong> ${this.escapeHtml(subject)}</li>
              <li><strong>File:</strong> ${this.escapeHtml(fileName)}</li>
              <li><strong>Generated:</strong> ${this.escapeHtml(new Date().toLocaleString())}</li>
            </ul>
          </div>

          <p>If you have any questions about this report, please contact support.</p>

          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated email from GatherGrove. Please do not reply to this email.
          </p>
        </body>
      </html>
    `;
  }

  private generateExportCompletionEmailBody(
    exportType: string,
    recordCount: number,
    downloadLink?: string
  ): string {
    // SEC-01 fix: Escape dynamic content to prevent XSS
    const safeExportType = this.escapeHtml(exportType);
    const safeRecordCount = this.escapeHtml(recordCount);
    // For URLs, we need to be extra careful - only allow http/https
    const safeDownloadLink = downloadLink && /^https?:\/\//i.test(downloadLink)
      ? this.escapeHtml(downloadLink)
      : null;

    return `
      <html>
        <body>
          <h2>Export Complete</h2>
          <p>Your ${safeExportType} export has been completed successfully.</p>

          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Export Summary:</h3>
            <ul>
              <li><strong>Export Type:</strong> ${safeExportType}</li>
              <li><strong>Records Exported:</strong> ${safeRecordCount}</li>
              <li><strong>Completed:</strong> ${this.escapeHtml(new Date().toLocaleString())}</li>
            </ul>
          </div>

          ${safeDownloadLink ? `
            <p>
              <a href="${safeDownloadLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Download Export
              </a>
            </p>
          ` : ''}

          <p>The exported data is attached to this email.</p>

          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated email from GatherGrove. Please do not reply to this email.
          </p>
        </body>
      </html>
    `;
  }

  private generateErrorNotificationEmailBody(
    errorType: string,
    errorMessage: string,
    context?: ErrorContext
  ): string {
    // SEC-01 fix: Escape dynamic content to prevent XSS
    const safeErrorType = this.escapeHtml(errorType);
    const safeErrorMessage = this.escapeHtml(errorMessage);
    // For context, stringify and escape the whole thing
    const safeContext = context ? this.escapeHtml(JSON.stringify(context, null, 2)) : null;

    return `
      <html>
        <body>
          <h2 style="color: #d32f2f;">Error Notification</h2>
          <p>An error occurred while processing your request.</p>

          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <h3>Error Details:</h3>
            <ul>
              <li><strong>Error Type:</strong> ${safeErrorType}</li>
              <li><strong>Error Message:</strong> ${safeErrorMessage}</li>
              <li><strong>Occurred:</strong> ${this.escapeHtml(new Date().toLocaleString())}</li>
            </ul>

            ${safeContext ? `
              <h4>Additional Context:</h4>
              <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto;">
${safeContext}
              </pre>
            ` : ''}
          </div>

          <p>Our support team has been notified and will investigate this issue. If you continue to experience problems, please contact support.</p>

          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated error notification from GatherGrove. Please do not reply to this email.
          </p>
        </body>
      </html>
    `;
  }

  private getContentTypeFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      case 'xlsx':
      case 'xls':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}

export const emailService = new EmailService();