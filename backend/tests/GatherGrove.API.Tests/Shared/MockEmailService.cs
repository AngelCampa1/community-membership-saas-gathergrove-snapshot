using GatherGrove.Application.Services;
using Microsoft.Extensions.Logging;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Mock email service for unit and integration tests
/// Provides test-safe implementation without external dependencies
/// </summary>
public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public async Task SendPaymentRequestEmailAsync(string toEmail, string memberName, string clubName, decimal amount, string description, string paymentUrl)
    {
        _logger.LogInformation("[TEST] Payment request email would be sent to: {ToEmail}, Member: {MemberName}, Club: {ClubName}, Amount: {Amount}",
            toEmail, memberName, clubName, amount);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendBulkEmailAsync(string toEmail, string memberName, string clubName, string subject, string body)
    {
        _logger.LogInformation("[TEST] Bulk email would be sent to: {ToEmail}, Member: {MemberName}, Subject: {Subject}",
            toEmail, memberName, subject);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendMemberActivationEmailAsync(string toEmail, string memberName, string clubName, string activationToken)
    {
        _logger.LogInformation("[TEST] Activation email would be sent to: {ToEmail}, Member: {MemberName}, Club: {ClubName}",
            toEmail, memberName, clubName);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendLeadMagnetEmailAsync(string toEmail, string? name, string leadMagnetType, byte[] pdfContent)
    {
        _logger.LogInformation("[TEST] Lead magnet email would be sent to: {ToEmail}, Name: {Name}, Type: {Type}, PDF Size: {Size} bytes",
            toEmail, name, leadMagnetType, pdfContent.Length);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendScheduledReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName)
    {
        _logger.LogInformation("[TEST] Scheduled report email would be sent to: {RecipientCount} recipients, Subject: {Subject}, File: {FileName}, Size: {Size} bytes",
            recipients.Count, subject, fileName, reportData.Length);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendScheduledFinancialReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName)
    {
        _logger.LogInformation("[TEST] Scheduled financial report email would be sent to: {RecipientCount} recipients, Subject: {Subject}, File: {FileName}, Size: {Size} bytes",
            recipients.Count, subject, fileName, reportData.Length);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendExportCompletionNotificationAsync(string toEmail, string subject, string exportId, long fileSizeBytes)
    {
        _logger.LogInformation("[TEST] Export completion notification would be sent to: {ToEmail}, Subject: {Subject}, ExportId: {ExportId}, Size: {Size} bytes",
            toEmail, subject, exportId, fileSizeBytes);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, string? fromAddress = null)
    {
        _logger.LogInformation("[TEST] Generic email would be sent to: {To}, Subject: {Subject}, From: {From}",
            to, subject, fromAddress ?? "default");
        await Task.Delay(1); // Simulate minimal async operation
        return true;
    }

    public async Task<bool> SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachmentData, string attachmentFileName, string? fromAddress = null)
    {
        _logger.LogInformation("[TEST] Email with attachment would be sent to: {To}, Subject: {Subject}, From: {From}, Attachment: {FileName} ({Size} bytes)",
            to, subject, fromAddress ?? "default", attachmentFileName, attachmentData.Length);
        await Task.Delay(1); // Simulate minimal async operation
        return true;
    }

    public async Task<bool> SendNotificationEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation("[TEST] Notification email would be sent to: {To}, Subject: {Subject}",
            to, subject);
        await Task.Delay(1); // Simulate minimal async operation
        return true;
    }

    public async Task SendEventPaymentConfirmationEmailAsync(
        string toEmail,
        string memberName,
        string clubName,
        string eventName,
        DateTime eventDateTime,
        string eventLocation,
        decimal amountPaid,
        string paymentIntentId,
        string confirmationNumber)
    {
        _logger.LogInformation("[TEST] Event payment confirmation email would be sent to: {ToEmail}, Member: {MemberName}, Event: {EventName}, Amount: {Amount}, Confirmation: {ConfirmationNumber}",
            toEmail, memberName, eventName, amountPaid, confirmationNumber);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendGuestEventPaymentConfirmationEmailAsync(
        string toEmail,
        string guestName,
        string eventName,
        DateTime eventDateTime,
        string eventLocation,
        decimal totalAmount,
        bool membershipIncluded,
        string confirmationNumber,
        bool accountCreated,
        string? loginEmail)
    {
        _logger.LogInformation("[TEST] Guest event payment confirmation email would be sent to: {ToEmail}, Guest: {GuestName}, Event: {EventName}, Amount: {Amount}, Confirmation: {ConfirmationNumber}, MembershipIncluded: {MembershipIncluded}, AccountCreated: {AccountCreated}",
            toEmail, guestName, eventName, totalAmount, confirmationNumber, membershipIncluded, accountCreated);
        await Task.Delay(1); // Simulate minimal async operation
    }

    public async Task SendAdminInvitationEmailAsync(string toEmail, string clubName, string inviterName, string invitationToken)
    {
        _logger.LogInformation("[TEST] Admin invitation email would be sent to: {ToEmail}, Club: {ClubName}, Inviter: {InviterName}, Token: {Token}",
            toEmail, clubName, inviterName, invitationToken);
        await Task.Delay(1); // Simulate minimal async operation
    }
}
