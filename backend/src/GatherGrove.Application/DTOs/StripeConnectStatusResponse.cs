namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing Stripe Connect status information for Story 18
/// </summary>
public class StripeConnectStatusResponse
{
    /// <summary>
    /// Whether the club has a connected Stripe account
    /// </summary>
    public bool IsConnected { get; set; }

    /// <summary>
    /// The Stripe account ID if connected (for display/debugging purposes only)
    /// </summary>
    public string? StripeAccountId { get; set; }

    /// <summary>
    /// Whether the system is running in development mode (simulated payments)
    /// </summary>
    public bool IsDevelopmentMode { get; set; }
}