namespace GatherGrove.Application.Configuration;

/// <summary>
/// Configuration settings for Resend email service
/// </summary>
public class ResendSettings
{
    /// <summary>
    /// Resend API token - Required
    /// Get from https://resend.com/api-keys
    /// </summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>
    /// From email address for sending emails
    /// Must be from a verified domain in Resend
    /// Default: noreply@gathergrove.club
    /// </summary>
    public string FromEmailAddress { get; set; } = "noreply@gathergrove.club";

    /// <summary>
    /// Display name for the sender
    /// Default: GatherGrove
    /// </summary>
    public string FromName { get; set; } = "GatherGrove";

    /// <summary>
    /// Ventora Labs from email address
    /// For sending emails from ventoralabs.com domain
    /// Default: noreply@ventoralabs.com
    /// </summary>
    public string VentoraLabsFromAddress { get; set; } = "noreply@ventoralabs.com";

    /// <summary>
    /// Display name for Ventora Labs sender
    /// Default: Ventora Labs
    /// </summary>
    public string VentoraLabsFromName { get; set; } = "Ventora Labs";

    /// <summary>
    /// Webhook signing secret for verifying webhook requests
    /// Get from Resend webhook settings
    /// </summary>
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>
    /// Admin email address for forwarding all inbound emails
    /// Default: noreply@gathergrove.club
    /// </summary>
    public string AdminEmailAddress { get; set; } = "noreply@gathergrove.club";
}
