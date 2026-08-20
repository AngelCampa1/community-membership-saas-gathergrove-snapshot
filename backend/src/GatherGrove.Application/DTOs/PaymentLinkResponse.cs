namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing payment link information for a paid event
/// </summary>
public class PaymentLinkResponse
{
    /// <summary>
    /// The unique payment token for this event
    /// </summary>
    /// <example>abc123xyz789securetoken</example>
    public string PaymentToken { get; set; } = string.Empty;

    /// <summary>
    /// The full shareable payment link URL
    /// </summary>
    /// <example>https://gathergrove.club/events/pay/abc123xyz789securetoken</example>
    public string PaymentLink { get; set; } = string.Empty;

    /// <summary>
    /// When the payment link expires (typically the event date)
    /// </summary>
    /// <example>2025-12-31T23:59:59Z</example>
    public DateTime ExpiresAt { get; set; }
}

