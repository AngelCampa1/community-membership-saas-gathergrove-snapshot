using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for promotion information
/// </summary>
public class PromotionResponse
{
    /// <summary>
    /// Unique identifier for the promotion
    /// </summary>
    public int PromotionId { get; set; }

    /// <summary>
    /// Display name for the promotion
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the promotion
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// The promo code if this is a code-based promotion
    /// </summary>
    public string? PromoCode { get; set; }

    /// <summary>
    /// Discount type: "percent_off" or "amount_off"
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
    /// Human-readable discount description (e.g., "100% off for 3 months")
    /// </summary>
    public string DiscountDescription { get; set; } = string.Empty;
}

/// <summary>
/// Request model for validating a promo code
/// </summary>
public class ValidatePromoCodeRequest
{
    /// <summary>
    /// The promo code to validate
    /// </summary>
    [Required(ErrorMessage = "Promo code is required")]
    public string PromoCode { get; set; } = string.Empty;
}

/// <summary>
/// Response model for promo code validation
/// </summary>
public class ValidatePromoCodeResponse
{
    /// <summary>
    /// Whether the promo code is valid
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Error message if the code is invalid
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// The promotion details if valid
    /// </summary>
    public PromotionResponse? Promotion { get; set; }
}

/// <summary>
/// Response model for active promotion that can be auto-applied
/// </summary>
public class ActivePromotionResponse
{
    /// <summary>
    /// Whether there is an active auto-apply promotion available
    /// </summary>
    public bool HasActivePromotion { get; set; }

    /// <summary>
    /// The promotion details if one is available
    /// </summary>
    public PromotionResponse? Promotion { get; set; }

    /// <summary>
    /// Number of redemptions remaining (null if unlimited)
    /// </summary>
    public int? RedemptionsRemaining { get; set; }
}
