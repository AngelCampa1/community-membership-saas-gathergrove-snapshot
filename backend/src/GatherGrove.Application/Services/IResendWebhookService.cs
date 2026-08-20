namespace GatherGrove.Application.Services;

/// <summary>
/// Service for processing Resend inbound email webhooks
/// </summary>
public interface IResendWebhookService
{
    /// <summary>
    /// Processes a Resend webhook event and forwards the email
    /// </summary>
    /// <param name="payload">Raw webhook payload (JSON string)</param>
    /// <param name="headers">Webhook signature headers (svix-id, svix-timestamp, svix-signature)</param>
    /// <returns>True if processed successfully</returns>
    Task<bool> ProcessInboundEmailWebhookAsync(string payload, Dictionary<string, string> headers);
}
