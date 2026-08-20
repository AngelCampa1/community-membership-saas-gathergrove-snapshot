using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Resend;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.Generated;

namespace GatherGrove.Application.Services;

/// <summary>
/// Resend Email Service implementation
/// Uses Resend API for sending all email communications
/// </summary>
public class ResendEmailService : IEmailService
{
    // Design token colors — update shared/design-tokens/colors.json + run npm run tokens:build
    private const string BrandColor = DesignTokens.Colors.BrandPrimary700;  // email brand primary
    private const string MutedColor = DesignTokens.Colors.Neutral500;        // footer/muted text

    private readonly IResend _resend;
    private readonly ResendSettings _settings;
    private readonly ILogger<ResendEmailService> _logger;
    private readonly IUrlService _urlService;

    public ResendEmailService(
        IResend resend,
        IOptions<ResendSettings> settings,
        ILogger<ResendEmailService> logger,
        IUrlService urlService)
    {
        _resend = resend ?? throw new ArgumentNullException(nameof(resend));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _urlService = urlService ?? throw new ArgumentNullException(nameof(urlService));

        if (string.IsNullOrWhiteSpace(_settings.ApiToken))
        {
            throw new InvalidOperationException("Resend API token is not configured. Set Resend:ApiToken in configuration.");
        }

        if (string.IsNullOrWhiteSpace(_settings.FromEmailAddress))
        {
            _settings.FromEmailAddress = "support@gathergrove.club";
        }

        _logger.LogInformation("🚀 Resend Email Service initialized with from address: {FromAddress}",
            _settings.FromEmailAddress);
    }

    /// <summary>
    /// Sends a payment request email to a member
    /// </summary>
    public async Task SendPaymentRequestEmailAsync(string toEmail, string memberName, string clubName, decimal amount, string description, string paymentUrl)
    {
        ValidateEmail(toEmail);
        ValidateRequired(memberName, nameof(memberName));
        ValidateRequired(clubName, nameof(clubName));

        try
        {
            var subject = $"Payment Request from {clubName}";
            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Payment Request</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .payment-details {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {BrandColor}; }}
        .amount {{ font-size: 24px; font-weight: bold; color: {BrandColor}; }}
        .pay-button {{ display: inline-block; background-color: {BrandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Payment Request</h1>
        <p>from {clubName}</p>
    </div>
    <div class='content'>
        <p>Hi {memberName},</p>
        <p>It's time to pay your dues for <strong>{clubName}</strong>.</p>

        <div class='payment-details'>
            <h3>Payment Details</h3>
            <p><strong>Amount:</strong> <span class='amount'>${amount:F2}</span></p>
            <p><strong>Description:</strong> {description}</p>
        </div>

        <p>Click the button below to pay securely online:</p>
        <p><a href='{paymentUrl}' class='pay-button'>Pay Now</a></p>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href='{paymentUrl}'>{paymentUrl}</a></p>

        <p>Thank you for your prompt payment!</p>
        <p>Best regards,<br>{clubName}</p>
    </div>
    <div class='footer'>
        <p>This email was sent by GatherGrove on behalf of {clubName}</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending payment request email to {Email} for {Amount:C} from {Club}",
                toEmail, amount, clubName);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Payment request email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send payment request email to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends a bulk email to a member
    /// </summary>
    public async Task SendBulkEmailAsync(string toEmail, string memberName, string clubName, string subject, string body)
    {
        ValidateEmail(toEmail);
        ValidateRequired(memberName, nameof(memberName));
        ValidateRequired(subject, nameof(subject));
        ValidateRequired(body, nameof(body));

        try
        {
            // Check if body contains HTML tags
            var isHtml = body.Contains("<") && body.Contains(">");
            var htmlContent = isHtml ? WrapInEmailTemplate(body, clubName, memberName) : WrapInEmailTemplate($"<p>{body.Replace("\n", "<br>")}</p>", clubName, memberName);

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending bulk email to {Email} - Subject: {Subject}", toEmail, subject);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Bulk email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send bulk email to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends a member account activation email with activation link
    /// </summary>
    public async Task SendMemberActivationEmailAsync(string toEmail, string memberName, string clubName, string activationToken)
    {
        ValidateEmail(toEmail);
        ValidateRequired(memberName, nameof(memberName));
        ValidateRequired(activationToken, nameof(activationToken));

        try
        {
            var activationUrl = _urlService.GenerateActivationUrl(activationToken);
            var subject = $"Activate Your Account - {clubName}";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Activate Your Account</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .activate-button {{ display: inline-block; background-color: {BrandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Welcome to {clubName}!</h1>
    </div>
    <div class='content'>
        <p>Hi {memberName},</p>
        <p>Welcome to <strong>{clubName}</strong>! We're excited to have you as a member.</p>

        <p>Please activate your account by clicking the button below:</p>
        <p><a href='{activationUrl}' class='activate-button'>Activate Your Account</a></p>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href='{activationUrl}'>{activationUrl}</a></p>

        <p><strong>Important:</strong> This activation link will expire in 24 hours for security reasons.</p>

        <p>If you didn't request this account, please ignore this email.</p>

        <p>Best regards,<br>{clubName}</p>
    </div>
    <div class='footer'>
        <p>This email was sent by GatherGrove on behalf of {clubName}</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending activation email to {Email} for {Club}", toEmail, clubName);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Activation email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send activation email to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends a lead magnet email with PDF attachment
    /// </summary>
    public async Task SendLeadMagnetEmailAsync(string toEmail, string? name, string leadMagnetType, byte[] pdfContent)
    {
        ValidateEmail(toEmail);

        try
        {
            var subject = GetLeadMagnetSubject(leadMagnetType);
            var title = GetLeadMagnetTitle(leadMagnetType);
            var displayName = string.IsNullOrWhiteSpace(name) ? "there" : name;

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>📚 Your Free Guide is Here!</h1>
    </div>
    <div class='content'>
        <p>Hi {displayName},</p>
        <p>Thank you for your interest in <strong>{title}</strong>!</p>

        <p>Your free guide is attached to this email. You can download it and start reading right away.</p>

        <p>We hope you find it valuable for managing your club!</p>

        <p>Best regards,<br>The GatherGrove Team</p>
    </div>
    <div class='footer'>
        <p>GatherGrove - Membership Management Made Simple</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent,
                Attachments = new List<Resend.EmailAttachment>
                {
                    new Resend.EmailAttachment
                    {
                        Filename = $"{leadMagnetType}.pdf",
                        Content = pdfContent,
                        ContentType = "application/pdf"
                    }
                }
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending lead magnet email ({Type}) with attachment to {Email}", leadMagnetType, toEmail);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Lead magnet email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send lead magnet email to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends a scheduled report via email
    /// </summary>
    public async Task SendScheduledReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName)
    {
        foreach (var recipient in recipients)
        {
            ValidateEmail(recipient);
        }

        try
        {
            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Scheduled Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>📊 Scheduled Report</h1>
    </div>
    <div class='content'>
        <p>Your scheduled report is attached to this email.</p>
        <p><strong>Report:</strong> {fileName}</p>
        <p><strong>Generated:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC</p>
    </div>
    <div class='footer'>
        <p>GatherGrove - Membership Management Made Simple</p>
    </div>
</body>
</html>";

            foreach (var recipient in recipients)
            {
                var message = new EmailMessage
                {
                    From = FormatFromAddress(),
                    Subject = subject,
                    HtmlBody = htmlContent,
                    Attachments = new List<Resend.EmailAttachment>
                    {
                        new Resend.EmailAttachment
                        {
                            Filename = fileName,
                            Content = reportData,
                            ContentType = GetMimeType(fileName)
                        }
                    }
                };
                message.To.Add(recipient);

                _logger.LogInformation("📧 Sending scheduled report to {Email} - File: {FileName}", recipient, fileName);

                await _resend.EmailSendAsync(message);

                _logger.LogInformation("✅ Scheduled report sent successfully to {Email}", recipient);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send scheduled report");
            throw;
        }
    }

    /// <summary>
    /// Sends a scheduled financial report via email
    /// </summary>
    public async Task SendScheduledFinancialReportAsync(List<string> recipients, string subject, byte[] reportData, string fileName)
    {
        // Same implementation as SendScheduledReportAsync
        await SendScheduledReportAsync(recipients, subject, reportData, fileName);
    }

    /// <summary>
    /// Sends export completion notification email
    /// </summary>
    public async Task SendExportCompletionNotificationAsync(string toEmail, string subject, string exportId, long fileSizeBytes)
    {
        ValidateEmail(toEmail);

        try
        {
            var fileSizeMB = fileSizeBytes / (1024.0 * 1024.0);

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Export Ready</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>✅ Export Complete</h1>
    </div>
    <div class='content'>
        <p>Your export is ready for download!</p>
        <p><strong>Export ID:</strong> {exportId}</p>
        <p><strong>File Size:</strong> {fileSizeMB:F2} MB</p>
        <p>Please log in to your account to download the export.</p>
    </div>
    <div class='footer'>
        <p>GatherGrove - Membership Management Made Simple</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Export completion notification sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send export completion notification to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Generic email sending method
    /// </summary>
    public async Task<bool> SendEmailAsync(string to, string subject, string body, string? fromAddress = null)
    {
        try
        {
            ValidateEmail(to);
            ValidateRequired(subject, nameof(subject));
            ValidateRequired(body, nameof(body));

            var message = new EmailMessage
            {
                From = string.IsNullOrWhiteSpace(fromAddress) ? FormatFromAddress() : FormatFromAddress(fromAddress),
                Subject = subject,
                HtmlBody = body
            };
            message.To.Add(to);

            _logger.LogInformation("📧 Sending generic email to {Email} - Subject: {Subject}", to, subject);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Generic email sent successfully to {Email}", to);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send email to {Email}", to);
            return false;
        }
    }

    /// <summary>
    /// Sends an email with attachment
    /// </summary>
    public async Task<bool> SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachmentData, string attachmentFileName, string? fromAddress = null)
    {
        try
        {
            ValidateEmail(to);
            ValidateRequired(subject, nameof(subject));
            ValidateRequired(body, nameof(body));

            var message = new EmailMessage
            {
                From = string.IsNullOrWhiteSpace(fromAddress) ? FormatFromAddress() : FormatFromAddress(fromAddress),
                Subject = subject,
                HtmlBody = body,
                Attachments = new List<Resend.EmailAttachment>
                {
                    new Resend.EmailAttachment
                    {
                        Filename = attachmentFileName,
                        Content = attachmentData,
                        ContentType = GetMimeType(attachmentFileName)
                    }
                }
            };
            message.To.Add(to);

            _logger.LogInformation("📧 Sending email with attachment to {Email} - File: {FileName}", to, attachmentFileName);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Email with attachment sent successfully to {Email}", to);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send email with attachment to {Email}", to);
            return false;
        }
    }

    /// <summary>
    /// Sends a notification email for background task completion
    /// </summary>
    public async Task<bool> SendNotificationEmailAsync(string to, string subject, string body)
    {
        return await SendEmailAsync(to, subject, body);
    }

    /// <summary>
    /// Sends event payment confirmation email with payment receipt and RSVP details
    /// </summary>
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
        ValidateEmail(toEmail);
        ValidateRequired(memberName, nameof(memberName));

        try
        {
            var subject = $"Event Payment Confirmation - {eventName}";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Event Payment Confirmation</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .event-details {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {BrandColor}; }}
        .confirmation {{ font-size: 18px; font-weight: bold; color: {BrandColor}; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>✅ Payment Confirmed!</h1>
    </div>
    <div class='content'>
        <p>Hi {memberName},</p>
        <p>Thank you for your payment! Your registration for <strong>{eventName}</strong> is confirmed.</p>

        <div class='event-details'>
            <h3>Event Details</h3>
            <p><strong>Event:</strong> {eventName}</p>
            <p><strong>Date & Time:</strong> {eventDateTime:MMMM dd, yyyy 'at' h:mm tt}</p>
            <p><strong>Location:</strong> {eventLocation}</p>
            <p><strong>Amount Paid:</strong> ${amountPaid:F2}</p>
            <p class='confirmation'><strong>Confirmation Number:</strong> {confirmationNumber}</p>
        </div>

        <p>We look forward to seeing you at the event!</p>

        <p>Best regards,<br>{clubName}</p>
    </div>
    <div class='footer'>
        <p>This email was sent by GatherGrove on behalf of {clubName}</p>
        <p>Payment ID: {paymentIntentId}</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending event payment confirmation to {Email} - Event: {Event}, Confirmation: {Confirmation}",
                toEmail, eventName, confirmationNumber);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Event payment confirmation sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send event payment confirmation to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends guest event payment confirmation email with optional account and membership details
    /// </summary>
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
        ValidateEmail(toEmail);
        ValidateRequired(guestName, nameof(guestName));

        try
        {
            var subject = $"Event Payment Confirmation - {eventName}";

            var membershipSection = membershipIncluded
                ? "<p>✅ <strong>Membership included!</strong> You're now a member with full benefits.</p>"
                : "";

            var accountSection = accountCreated
                ? $"<p>✅ <strong>Account created!</strong> You can log in with: <strong>{loginEmail}</strong></p>"
                : "";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Event Payment Confirmation</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .event-details {{ background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {BrandColor}; }}
        .confirmation {{ font-size: 18px; font-weight: bold; color: {BrandColor}; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>✅ Payment Confirmed!</h1>
    </div>
    <div class='content'>
        <p>Hi {guestName},</p>
        <p>Thank you for your payment! Your registration for <strong>{eventName}</strong> is confirmed.</p>

        {membershipSection}
        {accountSection}

        <div class='event-details'>
            <h3>Event Details</h3>
            <p><strong>Event:</strong> {eventName}</p>
            <p><strong>Date & Time:</strong> {eventDateTime:MMMM dd, yyyy 'at' h:mm tt}</p>
            <p><strong>Location:</strong> {eventLocation}</p>
            <p><strong>Total Amount:</strong> ${totalAmount:F2}</p>
            <p class='confirmation'><strong>Confirmation Number:</strong> {confirmationNumber}</p>
        </div>

        <p>We look forward to seeing you at the event!</p>

        <p>Best regards,<br>The GatherGrove Team</p>
    </div>
    <div class='footer'>
        <p>GatherGrove - Membership Management Made Simple</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending guest event payment confirmation to {Email} - Event: {Event}, Confirmation: {Confirmation}",
                toEmail, eventName, confirmationNumber);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Guest event payment confirmation sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send guest event payment confirmation to {Email}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends an admin invitation email with a secure invitation link
    /// </summary>
    public async Task SendAdminInvitationEmailAsync(string toEmail, string clubName, string inviterName, string invitationToken)
    {
        ValidateEmail(toEmail);
        ValidateRequired(clubName, nameof(clubName));
        ValidateRequired(inviterName, nameof(inviterName));

        try
        {
            var invitationUrl = $"https://gathergrove.club/accept-invitation?token={invitationToken}";
            var subject = $"You've been invited to manage {clubName}";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Admin Invitation</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .accept-button {{ display: inline-block; background-color: {BrandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>🎉 You've Been Invited!</h1>
    </div>
    <div class='content'>
        <p>Hi there,</p>
        <p><strong>{inviterName}</strong> has invited you to be an administrator for <strong>{clubName}</strong>.</p>

        <p>As an admin, you'll be able to manage members, events, communications, and more.</p>

        <p>Click the button below to accept the invitation and get started:</p>
        <p><a href='{invitationUrl}' class='accept-button'>Accept Invitation</a></p>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href='{invitationUrl}'>{invitationUrl}</a></p>

        <p><strong>Important:</strong> This invitation link will expire in 7 days.</p>

        <p>Best regards,<br>The GatherGrove Team</p>
    </div>
    <div class='footer'>
        <p>GatherGrove - Membership Management Made Simple</p>
    </div>
</body>
</html>";

            var message = new EmailMessage
            {
                From = FormatFromAddress(),
                Subject = subject,
                HtmlBody = htmlContent
            };
            message.To.Add(toEmail);

            _logger.LogInformation("📧 Sending admin invitation to {Email} for {Club} from {Inviter}",
                toEmail, clubName, inviterName);

            await _resend.EmailSendAsync(message);

            _logger.LogInformation("✅ Admin invitation sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send admin invitation to {Email}", toEmail);
            throw;
        }
    }

    #region Helper Methods

    private string FormatFromAddress(string? customFrom = null)
    {
        var fromEmail = string.IsNullOrWhiteSpace(customFrom) ? _settings.FromEmailAddress : customFrom;
        var fromName = _settings.FromName;

        return $"{fromName} <{fromEmail}>";
    }

    private string WrapInEmailTemplate(string content, string clubName, string recipientName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {BrandColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .footer {{ text-align: center; margin-top: 30px; color: {MutedColor}; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>{clubName}</h1>
    </div>
    <div class='content'>
        <p>Hi {recipientName},</p>
        {content}
        <p>Best regards,<br>{clubName}</p>
    </div>
    <div class='footer'>
        <p>This email was sent by GatherGrove on behalf of {clubName}</p>
    </div>
</body>
</html>";
    }

    private static string GetLeadMagnetSubject(string leadMagnetType) => leadMagnetType switch
    {
        "club-management-guide" => "🎯 Your Free Complete Guide to Club Management",
        "member-retention" => "🤝 Your Free Member Retention Strategies Guide",
        "event-planning" => "📅 Your Free Event Planning Mastery Guide",
        "financial-management" => "💰 Your Free Financial Management Guide",
        _ => "📚 Your Free Club Management Guide"
    };

    private static string GetLeadMagnetTitle(string leadMagnetType) => leadMagnetType switch
    {
        "club-management-guide" => "The Complete Guide to Club Management",
        "member-retention" => "Member Retention Strategies That Work",
        "event-planning" => "Event Planning Mastery for Clubs",
        "financial-management" => "Financial Management for Small Clubs",
        _ => "Club Management Best Practices Guide"
    };

    private static string GetMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".csv" => "text/csv",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".xls" => "application/vnd.ms-excel",
            ".zip" => "application/zip",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
    }

    private static void ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email address cannot be null or empty.", nameof(email));
        }

        if (!email.Contains("@") || !email.Contains("."))
        {
            throw new ArgumentException($"Invalid email address: {email}. Must be a valid email format.", nameof(email));
        }
    }

    private static void ValidateRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{paramName} cannot be null or empty.", paramName);
        }
    }

    #endregion
}
