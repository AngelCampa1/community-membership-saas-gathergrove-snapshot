namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a promotional offer that can be applied to subscriptions.
/// Links to Stripe coupons/promotion codes for discount application.
/// </summary>
public class Promotion
{
    /// <summary>
    /// Unique identifier for the promotion
    /// </summary>
    public int PromotionId { get; set; }

    /// <summary>
    /// The Stripe coupon ID (e.g., "launch-3mo-free")
    /// </summary>
    public string StripeCouponId { get; set; } = string.Empty;

    /// <summary>
    /// The Stripe promotion code ID if using customer-facing promo codes
    /// </summary>
    public string? StripePromotionCodeId { get; set; }

    /// <summary>
    /// Display name for the promotion (e.g., "Launch Offer - 3 Months Free")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the promotion
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Customer-facing promo code (e.g., "LAUNCH100") for code-based promotions
    /// </summary>
    public string? PromoCode { get; set; }

    /// <summary>
    /// If true, this promotion is automatically applied to new subscriptions
    /// </summary>
    public bool IsAutoApply { get; set; }

    /// <summary>
    /// Maximum number of times this promotion can be auto-applied (null = unlimited)
    /// </summary>
    public int? MaxAutoApplyRedemptions { get; set; }

    /// <summary>
    /// Current count of auto-apply redemptions
    /// </summary>
    public int AutoApplyRedemptionCount { get; set; }

    /// <summary>
    /// Whether this promotion is currently active and can be redeemed
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When this promotion becomes available (null = immediately)
    /// </summary>
    public DateTime? StartsAt { get; set; }

    /// <summary>
    /// When this promotion expires (null = never)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Discount type from Stripe: "percent_off" or "amount_off"
    /// </summary>
    public string? DiscountType { get; set; }

    /// <summary>
    /// Percentage off (0-100) if DiscountType is "percent_off"
    /// </summary>
    public decimal? PercentOff { get; set; }

    /// <summary>
    /// Amount off in cents if DiscountType is "amount_off"
    /// </summary>
    public long? AmountOff { get; set; }

    /// <summary>
    /// Currency for amount_off discounts (e.g., "usd")
    /// </summary>
    public string? Currency { get; set; }

    /// <summary>
    /// Stripe coupon duration: "once", "repeating", or "forever"
    /// </summary>
    public string? Duration { get; set; }

    /// <summary>
    /// Number of months the coupon applies if duration is "repeating"
    /// </summary>
    public int? DurationInMonths { get; set; }

    /// <summary>
    /// When this promotion was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this promotion was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for clubs that used this promotion
    /// </summary>
    public virtual ICollection<Club> AppliedToClubs { get; set; } = new List<Club>();
}
