using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for managing promotional offers via Stripe
/// Stripe is the source of truth - promotions are created/managed in Stripe Dashboard
/// </summary>
public interface IPromotionService
{
    /// <summary>
    /// Gets active promotion codes from Stripe that can be displayed to users
    /// Looks for promotion codes with metadata indicating they should be auto-displayed
    /// </summary>
    /// <returns>Response containing promotion details and availability</returns>
    Task<ActivePromotionResponse> GetActivePromotionResponseAsync();

    /// <summary>
    /// Validates a promo code directly against Stripe
    /// </summary>
    /// <param name="promoCode">The promo code to validate</param>
    /// <returns>Validation result with promotion details if valid</returns>
    Task<ValidatePromoCodeResponse> ValidatePromoCodeAsync(string promoCode);

    /// <summary>
    /// Gets the Stripe promotion code ID for a given code string
    /// Used when applying to subscriptions
    /// </summary>
    /// <param name="promoCode">The promo code to look up</param>
    /// <returns>The Stripe promotion code ID if found and valid, null otherwise</returns>
    Task<string?> GetStripePromotionCodeIdAsync(string promoCode);

    /// <summary>
    /// Gets the Stripe coupon ID for a given promo code
    /// Used when applying coupons directly to subscriptions
    /// </summary>
    /// <param name="promoCode">The promo code to look up</param>
    /// <returns>The Stripe coupon ID if found and valid, null otherwise</returns>
    Task<string?> GetStripeCouponIdAsync(string promoCode);
}
