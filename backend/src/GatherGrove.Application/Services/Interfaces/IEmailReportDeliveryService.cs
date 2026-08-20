using GatherGrove.Application.DTOs.Export;

namespace GatherGrove.Application.Services.Interfaces;

public interface IEmailReportDeliveryService
{
    Task<EmailDeliveryRecord> SendReportAsync(BulkEmailRequest request);
    Task<EmailDeliveryRecord> SendExportCompletionNotification(string recipientEmail, string clubName, string reportType, string downloadUrl, long fileSizeBytes);
    Task<EmailDeliveryRecord> SendScheduledReportEmail(string recipients, string reportName, byte[] reportData, string fileName, int clubId);
    Task<EmailDeliveryStatistics> GetDeliveryStatisticsAsync(DateTime startDate, DateTime endDate);
    Task<List<EmailDeliveryRecord>> GetDeliveryHistoryAsync(int limit = 50);

    // Additional methods expected by tests
    Task SendExportFailureNotification(string recipientEmail, string clubName, string reportType, string errorMessage, DateTime occurredAt);
    Task SendBulkReportEmails(string recipients, string subject, byte[] reportData, string fileName);
    Task<EmailTemplate> GetEmailTemplate(string templateType, int clubId);
    Task CustomizeEmailTemplate(string templateType, EmailBrandingOptions brandingOptions, int clubId);
    Task<EmailDeliveryRecord?> TrackEmailDelivery(string deliveryId, string status, DateTime? deliveredAt = null);
    Task<List<EmailDeliveryRecord>> GetEmailDeliveryHistory(int clubId, int limit = 50);
    Task<EmailDeliveryStatistics> GetEmailDeliveryStatistics(DateTime startDate, DateTime endDate, int clubId);

    // Missing methods from tests
    Task<EmailRetryResult> SendEmailWithRetry(string recipientEmail, string subject, string body, int maxRetries = 3);
    Task HandleEmailBounce(EmailBounceNotification bounceNotification);
    Task SendReportReadyNotification(string recipientEmail, string reportName, string downloadUrl);
    Task SendReportDeliveryDigest(string recipientEmail, List<string> recentReports);
}

/// <summary>
/// Email branding options for customizing email templates
/// </summary>
public class EmailBrandingOptions
{
    public string? Logo { get; set; }
    public string? ClubLogo { get; set; }
    public string? ClubName { get; set; }
    public string? FooterText { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? FontFamily { get; set; }
    public Dictionary<string, string> CustomProperties { get; set; } = new();
}