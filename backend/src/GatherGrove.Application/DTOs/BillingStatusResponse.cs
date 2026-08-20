namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model containing current billing and subscription status
/// </summary>
public class BillingStatusResponse
{
    /// <summary>
    /// Current club tier (Grow or Expand)
    /// </summary>
    public string CurrentTier { get; set; } = string.Empty;

    /// <summary>
    /// Whether the club has an active subscription
    /// </summary>
    public bool HasActiveSubscription { get; set; }

    /// <summary>
    /// The Stripe subscription ID if one exists
    /// </summary>
    public string? SubscriptionId { get; set; }

    /// <summary>
    /// The next billing date if subscription exists
    /// </summary>
    public DateTime? NextBillingDate { get; set; }

    /// <summary>
    /// The subscription status from Stripe
    /// </summary>
    public string? SubscriptionStatus { get; set; }

    /// <summary>
    /// Whether the user can upgrade to a higher tier
    /// </summary>
    public bool CanUpgrade { get; set; }

    /// <summary>
    /// Current billing cycle (monthly or annual) if subscription exists
    /// </summary>
    public string? BillingCycle { get; set; }

    /// <summary>
    /// Member usage vs limit for current tier
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Member limit for current tier
    /// </summary>
    public int MemberLimit { get; set; }

    /// <summary>
    /// Name of the promotion applied to this subscription, if any
    /// </summary>
    public string? AppliedPromotionName { get; set; }

    /// <summary>
    /// Description of the active discount, if any
    /// </summary>
    public string? ActiveDiscountDescription { get; set; }

    /// <summary>
    /// Simplified trial lifecycle status for frontend UX.
    /// inactive | trialing | expired | active
    /// </summary>
    public string TrialStatus { get; set; } = "inactive";

    /// <summary>
    /// Trial end timestamp if a trial is active.
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>
    /// True when the club needs to add a payment method to continue service.
    /// </summary>
    public bool RequiresPaymentSetup { get; set; }

    /// <summary>
    /// True when app access should be locked due to subscription state.
    /// </summary>
    public bool AccountLocked { get; set; }

    /// <summary>
    /// Convenience flag used by frontend routing.
    /// </summary>
    public bool CanAccessApp { get; set; } = true;
}
