using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Svix;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs.Resend;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for processing Resend inbound email webhooks and forwarding to admin
/// </summary>
public class ResendWebhookService : IResendWebhookService
{
    private readonly IEmailService _emailService;
    private readonly ResendSettings _settings;
    private readonly ILogger<ResendWebhookService> _logger;

    /// <summary>
    /// Allowed recipient domains for this webhook handler.
    /// Only emails to these domains will be processed.
    /// </summary>
    private static readonly HashSet<string> AllowedDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "gathergrove.club"
    };

    public ResendWebhookService(
        IEmailService emailService,
        IOptions<ResendSettings> settings,
        ILogger<ResendWebhookService> logger)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        if (string.IsNullOrWhiteSpace(_settings.WebhookSecret))
        {
            _logger.LogWarning("Resend webhook secret not configured. Webhook signature verification will fail.");
        }

        if (string.IsNullOrWhiteSpace(_settings.AdminEmailAddress))
        {
            throw new InvalidOperationException("Admin email address not configured for email forwarding.");
        }
    }

    /// <summary>
    /// Processes inbound email webhook from Resend
    /// </summary>
    public async Task<bool> ProcessInboundEmailWebhookAsync(string payload, Dictionary<string, string> headers)
    {
        try
        {
            // 1. Verify Svix signature
            VerifyWebhookSignature(payload, headers);

            // 2. Deserialize webhook event
            var webhookEvent = JsonSerializer.Deserialize<ResendWebhookEvent>(payload, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (webhookEvent == null)
            {
                _logger.LogError("Failed to deserialize Resend webhook payload");
                return true; // Return true to prevent retries
            }

            // 3. Filter for email.received events only
            if (webhookEvent.Type != "email.received")
            {
                _logger.LogInformation("Ignoring non-email.received event: {EventType}", webhookEvent.Type);
                return true;
            }

            // 4. Filter: only process emails to GatherGrove domains
            var emailData = webhookEvent.Data;
            if (!IsGatherGroveRecipient(emailData.To))
            {
                _logger.LogDebug("Ignoring email to non-GatherGrove domain: {Recipients}",
                    string.Join(", ", emailData.To ?? new List<string>()));
                return true; // Return true to acknowledge receipt (no retry)
            }

            // 5. Forward the email
            await ForwardEmailAsync(emailData);

            _logger.LogInformation("Successfully forwarded email from {From} to {AdminEmail}",
                webhookEvent.Data.From, _settings.AdminEmailAddress);

            return true;
        }
        catch (ArgumentException ex)
        {
            // Signature verification failed - let this bubble up to return 400
            _logger.LogError(ex, "Webhook signature verification failed");
            throw;
        }
        catch (Exception ex)
        {
            // Log other errors but return true to prevent Resend retries
            _logger.LogError(ex, "Error processing Resend webhook");
            return true;
        }
    }

    /// <summary>
    /// Verifies Svix webhook signature
    /// </summary>
    private void VerifyWebhookSignature(string payload, Dictionary<string, string> headers)
    {
        if (string.IsNullOrWhiteSpace(_settings.WebhookSecret))
        {
            throw new ArgumentException("Webhook secret not configured");
        }

        if (!headers.ContainsKey("svix-id") ||
            !headers.ContainsKey("svix-timestamp") ||
            !headers.ContainsKey("svix-signature"))
        {
            throw new ArgumentException("Missing required Svix signature headers");
        }

        var webhook = new Webhook(_settings.WebhookSecret);
        var webHeaders = new WebHeaderCollection
        {
            ["svix-id"] = headers["svix-id"],
            ["svix-timestamp"] = headers["svix-timestamp"],
            ["svix-signature"] = headers["svix-signature"]
        };

        // This will throw ArgumentException if signature is invalid
        webhook.Verify(payload, webHeaders);
    }

    /// <summary>
    /// Forwards email to admin address
    /// </summary>
    private async Task ForwardEmailAsync(ResendEmailData emailData)
    {
        // Format forwarded email with metadata header
        var forwardedBody = FormatForwardedEmail(emailData);
        var subject = $"[Forwarded] {emailData.Subject}";

        // Check for attachments
        if (emailData.Attachments != null && emailData.Attachments.Any())
        {
            // Handle emails with attachments
            foreach (var attachment in emailData.Attachments)
            {
                try
                {
                    // Decode Base64 attachment
                    var attachmentData = Convert.FromBase64String(attachment.Content);

                    // Check attachment size (skip if > 9MB to avoid Resend limits)
                    if (attachmentData.Length > 9 * 1024 * 1024)
                    {
                        _logger.LogWarning("Skipping large attachment: {Filename} ({Size} MB)",
                            attachment.Filename, attachmentData.Length / (1024.0 * 1024.0));
                        continue;
                    }

                    await _emailService.SendEmailWithAttachmentAsync(
                        _settings.AdminEmailAddress,
                        subject,
                        forwardedBody,
                        attachmentData,
                        attachment.Filename);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to forward attachment: {Filename}", attachment.Filename);
                }
            }
        }
        else
        {
            // Simple email without attachments
            await _emailService.SendEmailAsync(
                _settings.AdminEmailAddress,
                subject,
                forwardedBody);
        }
    }

    /// <summary>
    /// Formats forwarded email with metadata header
    /// </summary>
    private string FormatForwardedEmail(ResendEmailData emailData)
    {
        var metadataHeader = $@"
        <div style='background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2e6b4d; margin-bottom: 20px; font-family: Arial, sans-serif;'>
            <h3 style='margin: 0 0 10px 0; color: #2e6b4d;'>📧 Forwarded Email</h3>
            <p style='margin: 5px 0;'><strong>From:</strong> {System.Net.WebUtility.HtmlEncode(emailData.From)}</p>
            <p style='margin: 5px 0;'><strong>To:</strong> {System.Net.WebUtility.HtmlEncode(string.Join(", ", emailData.To))}</p>
            <p style='margin: 5px 0;'><strong>Subject:</strong> {System.Net.WebUtility.HtmlEncode(emailData.Subject)}</p>
            <p style='margin: 5px 0;'><strong>Received:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            {(emailData.Attachments != null && emailData.Attachments.Any() ? $"<p style='margin: 5px 0;'><strong>Attachments:</strong> {emailData.Attachments.Count}</p>" : "")}
        </div>";

        // Use HTML if available, otherwise wrap text in pre tag
        var body = !string.IsNullOrEmpty(emailData.Html)
            ? emailData.Html
            : $"<pre style='font-family: monospace; white-space: pre-wrap;'>{System.Net.WebUtility.HtmlEncode(emailData.Text)}</pre>";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;'>
    {metadataHeader}
    <div style='margin-top: 20px;'>
        {body}
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Checks if any recipient is a GatherGrove domain.
    /// </summary>
    private static bool IsGatherGroveRecipient(List<string>? recipients)
    {
        if (recipients == null || recipients.Count == 0)
            return false;

        foreach (var recipient in recipients)
        {
            if (string.IsNullOrEmpty(recipient))
                continue;

            var atIndex = recipient.LastIndexOf('@');
            if (atIndex > 0 && atIndex < recipient.Length - 1)
            {
                var domain = recipient.Substring(atIndex + 1).Trim().ToLowerInvariant();
                // Remove any trailing '>' from address format like "Name <email@domain.com>"
                domain = domain.TrimEnd('>');

                if (AllowedDomains.Contains(domain))
                    return true;
            }
        }
        return false;
    }
}
