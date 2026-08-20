namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing Stripe configuration status for member payment functionality
/// </summary>
public class StripeConfigResponse
{
    /// <summary>
    /// Whether Stripe is configured for the club
    /// </summary>
    public bool IsConfigured { get; set; }

    /// <summary>
    /// Whether the club can accept payments
    /// </summary>
    public bool CanAcceptPayments { get; set; }

    /// <summary>
    /// Whether the system is running in development mode (simulated payments)
    /// </summary>
    public bool IsDevelopmentMode { get; set; }
}