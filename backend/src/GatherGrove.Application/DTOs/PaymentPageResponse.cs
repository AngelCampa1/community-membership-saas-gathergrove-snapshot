namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for payment page details
/// </summary>
public class PaymentPageResponse
{
    /// <summary>
    /// The club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// The member's full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// The member's membership type
    /// </summary>
    public string MembershipType { get; set; } = string.Empty;

    /// <summary>
    /// The amount due
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Description of what the payment is for
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether the token is still valid (not expired and not used)
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// The Stripe publishable key for the frontend
    /// </summary>
    public string StripePublishableKey { get; set; } = string.Empty;

    /// <summary>
    /// Whether the system is running in development mode (simulated payments)
    /// </summary>
    public bool IsDevelopmentMode { get; set; }

    /// <summary>
    /// Whether the club has Stripe connected
    /// </summary>
    public bool IsStripeConnected { get; set; }
}