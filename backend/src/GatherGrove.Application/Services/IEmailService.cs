namespace GatherGrove.Application.Services;

/// <summary>
/// Service for sending emails
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a payment request email to a member
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="memberName">The member's name</param>
    /// <param name="clubName">The club name</param>
    /// <param name="amount">The payment amount</param>
    /// <param name="description">The payment description</param>
    /// <param name="paymentUrl">The secure payment URL</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendPaymentRequestEmailAsync(string toEmail, string memberName, string clubName, decimal amount, string description, string paymentUrl);

    /// <summary>
    /// Sends a bulk email to a member
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="memberName">The member's name</param>
    /// <param name="clubName">The club name</param>
    /// <param name="subject">The email subject</param>
    /// <param name="body">The email body</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendBulkEmailAsync(string toEmail, string memberName, string clubName, string subject, string body);

    /// <summary>
    /// Sends a member account activation email with activation link
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="memberName">The member's name</param>
    /// <param name="clubName">The club name</param>
    /// <param name="activationToken">The activation token for the secure link</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendMemberActivationEmailAsync(string toEmail, string memberName, string clubName, string activationToken);

    /// <summary>
    /// Sends a lead magnet email with PDF attachment
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="name">The lead's name (optional)</param>
    /// <param name="leadMagnetType">Type of lead magnet</param>
    /// <param name="pdfContent">PDF content as byte array</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendLeadMagnetEmailAsync(string toEmail, string? name, string leadMagnetType, byte[] pdfContent);

    /// <summary>
    /// Sends a scheduled report via email
    /// US-005 Data Export & Reporting Engine
    /// </summary>
    /// <param name="recipients">List of recipient email addresses</param>
    /// <param name="subject">Email subject</param>
    /// <param name="reportData">Report content as byte array</param>
    /// <param name="fileName">Report filename</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendScheduledReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName);

    /// <summary>
    /// Sends a scheduled financial report via email
    /// US-005 Data Export & Reporting Engine
    /// </summary>
    /// <param name="recipients">List of recipient email addresses</param>
    /// <param name="subject">Email subject</param>
    /// <param name="reportData">Report content as byte array</param>
    /// <param name="fileName">Report filename</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendScheduledFinancialReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName);

    /// <summary>
    /// Sends export completion notification email
    /// US-005 Data Export & Reporting Engine
    /// </summary>
    /// <param name="toEmail">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="exportId">Export ID</param>
    /// <param name="fileSizeBytes">File size in bytes</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendExportCompletionNotificationAsync(string toEmail, string subject, string exportId, long fileSizeBytes);

    /// <summary>
    /// Generic email sending method
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="body">Email body content</param>
    /// <param name="fromAddress">Optional sender email address</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendEmailAsync(string to, string subject, string body, string? fromAddress = null);

    /// <summary>
    /// Sends an email with attachment
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="body">Email body content</param>
    /// <param name="attachmentData">Attachment data as byte array</param>
    /// <param name="attachmentFileName">Attachment filename</param>
    /// <param name="fromAddress">Optional sender email address</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachmentData, string attachmentFileName, string? fromAddress = null);

    /// <summary>
    /// Sends a notification email for background task completion
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="body">Email body content</param>
    /// <returns>True if email was sent successfully</returns>
    Task<bool> SendNotificationEmailAsync(string to, string subject, string body);

    /// <summary>
    /// Sends event payment confirmation email with payment receipt and RSVP details
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="memberName">The member's name</param>
    /// <param name="clubName">The club name</param>
    /// <param name="eventName">The event name</param>
    /// <param name="eventDateTime">Date and time of the event</param>
    /// <param name="eventLocation">Location of the event</param>
    /// <param name="amountPaid">Amount paid for the event</param>
    /// <param name="paymentIntentId">Stripe payment intent ID</param>
    /// <param name="confirmationNumber">RSVP confirmation number</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendEventPaymentConfirmationEmailAsync(
        string toEmail,
        string memberName,
        string clubName,
        string eventName,
        DateTime eventDateTime,
        string eventLocation,
        decimal amountPaid,
        string paymentIntentId,
        string confirmationNumber);

    /// <summary>
    /// Sends guest event payment confirmation email with optional account and membership details
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="guestName">The guest's name</param>
    /// <param name="eventName">The event name</param>
    /// <param name="eventDateTime">Date and time of the event</param>
    /// <param name="eventLocation">Location of the event</param>
    /// <param name="totalAmount">Total amount paid</param>
    /// <param name="membershipIncluded">Whether membership was purchased</param>
    /// <param name="confirmationNumber">RSVP confirmation number</param>
    /// <param name="accountCreated">Whether a user account was created</param>
    /// <param name="loginEmail">Login email if account was created</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendGuestEventPaymentConfirmationEmailAsync(
        string toEmail,
        string guestName,
        string eventName,
        DateTime eventDateTime,
        string eventLocation,
        decimal totalAmount,
        bool membershipIncluded,
        string confirmationNumber,
        bool accountCreated,
        string? loginEmail);

    /// <summary>
    /// Sends an admin invitation email with a secure invitation link
    /// </summary>
    /// <param name="toEmail">The recipient email address</param>
    /// <param name="clubName">The club name they're being invited to</param>
    /// <param name="inviterName">Name of the person sending the invitation</param>
    /// <param name="invitationToken">The secure invitation token</param>
    /// <returns>Task that completes when email is sent</returns>
    Task SendAdminInvitationEmailAsync(string toEmail, string clubName, string inviterName, string invitationToken);
}
