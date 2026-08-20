namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model returned when successfully upgrading a subscription
/// </summary>
public class UpgradeSubscriptionResponse
{
    /// <summary>
    /// The Stripe subscription ID for the newly created subscription
    /// </summary>
    public string SubscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// The new tier the club has been upgraded to (should be "Grow")
    /// </summary>
    public string NewTier { get; set; } = string.Empty;

    /// <summary>
    /// The next billing date in ISO format
    /// </summary>
    public DateTime NextBillingDate { get; set; }

    /// <summary>
    /// The subscription status from Stripe (usually "active")
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Success message to display to the user
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Name of the applied promotion, if any
    /// </summary>
    public string? AppliedPromotionName { get; set; }

    /// <summary>
    /// Description of the applied discount, if any
    /// </summary>
    public string? AppliedDiscountDescription { get; set; }
}