namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for generating a Stripe Connect link
/// </summary>
public class StripeConnectLinkRequest
{
    /// <summary>
    /// The country code for the connected account (e.g., "US", "CA", "MX", "GB")
    /// If not provided, defaults to the platform's default country
    /// </summary>
    public string? Country { get; set; }
}