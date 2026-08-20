using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing promotional offers via Stripe
/// Stripe is the source of truth - all promotions are created/managed in Stripe Dashboard
/// </summary>
public class PromotionService : IPromotionService
{
    private readonly ILogger<PromotionService> _logger;
    private readonly StripeSettings _stripeSettings;

    // Metadata key used to identify promotions that should be auto-displayed (optional)
    private const string AutoDisplayMetadataKey = "auto_display";

    public PromotionService(
        ILogger<PromotionService> logger,
        IOptions<StripeSettings> stripeSettings)
    {
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    /// <inheritdoc />
    public async Task<ActivePromotionResponse> GetActivePromotionResponseAsync()
    {
        try
        {
            var promotionCodeService = new PromotionCodeService();

            // List active promotion codes, looking for ones marked for auto-display
            var options = new PromotionCodeListOptions
            {
                Active = true,
                Limit = 100,
                Expand = new List<string> { "data.coupon" }
            };

            var promotionCodes = await promotionCodeService.ListAsync(options);

            // Find a promotion code to auto-display
            // Priority 1: Look for codes with metadata "auto_display": "true"
            // Priority 2: If none found, use the most recent active promotion with remaining redemptions
            var displayPromo = promotionCodes.Data
                .Where(pc => pc.Active &&
                             pc.Coupon != null &&
                             pc.Coupon.Valid &&
                             pc.Metadata != null &&
                             pc.Metadata.TryGetValue(AutoDisplayMetadataKey, out var autoDisplay) &&
                             autoDisplay.Equals("true", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(pc => pc.Created)
                .FirstOrDefault();

            // Fallback: use the most recent active promotion if no explicit auto-display found
            if (displayPromo == null)
            {
                displayPromo = promotionCodes.Data
                    .Where(pc => pc.Active &&
                                 pc.Coupon != null &&
                                 pc.Coupon.Valid &&
                                 (!pc.MaxRedemptions.HasValue || pc.TimesRedeemed < pc.MaxRedemptions.Value))
                    .OrderByDescending(pc => pc.Created)
                    .FirstOrDefault();
            }

            if (displayPromo == null)
            {
                _logger.LogDebug("No active auto-display promotions found in Stripe");
                return new ActivePromotionResponse
                {
                    HasActivePromotion = false
                };
            }

            var coupon = displayPromo.Coupon;

            // Calculate remaining redemptions if max is set
            int? remaining = null;
            if (displayPromo.MaxRedemptions.HasValue)
            {
                remaining = (int)(displayPromo.MaxRedemptions.Value - displayPromo.TimesRedeemed);
                if (remaining <= 0)
                {
                    _logger.LogDebug("Promotion {Code} has reached max redemptions", displayPromo.Code);
                    return new ActivePromotionResponse
                    {
                        HasActivePromotion = false
                    };
                }
            }

            _logger.LogInformation(
                "Found active auto-display promotion: {Code} ({CouponId})",
                displayPromo.Code, coupon.Id);

            return new ActivePromotionResponse
            {
                HasActivePromotion = true,
                Promotion = MapCouponToResponse(coupon, displayPromo.Code),
                RedemptionsRemaining = remaining
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Error fetching promotions from Stripe");
            return new ActivePromotionResponse
            {
                HasActivePromotion = false
            };
        }
    }

    /// <inheritdoc />
    public async Task<ValidatePromoCodeResponse> ValidatePromoCodeAsync(string promoCode)
    {
        if (string.IsNullOrWhiteSpace(promoCode))
        {
            return new ValidatePromoCodeResponse
            {
                IsValid = false,
                ErrorMessage = "Promo code is required"
            };
        }

        try
        {
            var promotionCodeService = new PromotionCodeService();

            // Search for the promotion code by code string
            var options = new PromotionCodeListOptions
            {
                Code = promoCode.Trim(),
                Active = true,
                Limit = 1,
                Expand = new List<string> { "data.coupon" }
            };

            var promotionCodes = await promotionCodeService.ListAsync(options);
            var promoCodeObj = promotionCodes.Data.FirstOrDefault();

            if (promoCodeObj == null)
            {
                _logger.LogInformation("Promo code not found in Stripe: {PromoCode}", promoCode);
                return new ValidatePromoCodeResponse
                {
                    IsValid = false,
                    ErrorMessage = "Invalid promo code"
                };
            }

            // Check if promotion code is active
            if (!promoCodeObj.Active)
            {
                return new ValidatePromoCodeResponse
                {
                    IsValid = false,
                    ErrorMessage = "This promo code is no longer active"
                };
            }

            // Check if the coupon is valid
            var coupon = promoCodeObj.Coupon;
            if (coupon == null || !coupon.Valid)
            {
                return new ValidatePromoCodeResponse
                {
                    IsValid = false,
                    ErrorMessage = "This promo code is no longer valid"
                };
            }

            // Check redemption limits
            if (promoCodeObj.MaxRedemptions.HasValue &&
                promoCodeObj.TimesRedeemed >= promoCodeObj.MaxRedemptions.Value)
            {
                return new ValidatePromoCodeResponse
                {
                    IsValid = false,
                    ErrorMessage = "This promo code has reached its redemption limit"
                };
            }

            // Check expiration
            if (promoCodeObj.ExpiresAt.HasValue && promoCodeObj.ExpiresAt.Value < DateTime.UtcNow)
            {
                return new ValidatePromoCodeResponse
                {
                    IsValid = false,
                    ErrorMessage = "This promo code has expired"
                };
            }

            _logger.LogInformation(
                "Promo code validated successfully: {PromoCode} -> Coupon {CouponId}",
                promoCode, coupon.Id);

            return new ValidatePromoCodeResponse
            {
                IsValid = true,
                Promotion = MapCouponToResponse(coupon, promoCodeObj.Code)
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Error validating promo code with Stripe: {PromoCode}", promoCode);
            return new ValidatePromoCodeResponse
            {
                IsValid = false,
                ErrorMessage = "Unable to validate promo code. Please try again."
            };
        }
    }

    /// <inheritdoc />
    public async Task<string?> GetStripePromotionCodeIdAsync(string promoCode)
    {
        if (string.IsNullOrWhiteSpace(promoCode))
        {
            return null;
        }

        try
        {
            var promotionCodeService = new PromotionCodeService();
            var options = new PromotionCodeListOptions
            {
                Code = promoCode.Trim(),
                Active = true,
                Limit = 1
            };

            var promotionCodes = await promotionCodeService.ListAsync(options);
            var promoCodeObj = promotionCodes.Data.FirstOrDefault();

            return promoCodeObj?.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Error looking up Stripe promotion code: {PromoCode}", promoCode);
            return null;
        }
    }

    /// <inheritdoc />
    public async Task<string?> GetStripeCouponIdAsync(string promoCode)
    {
        if (string.IsNullOrWhiteSpace(promoCode))
        {
            return null;
        }

        try
        {
            var promotionCodeService = new PromotionCodeService();
            var options = new PromotionCodeListOptions
            {
                Code = promoCode.Trim(),
                Active = true,
                Limit = 1,
                Expand = new List<string> { "data.coupon" }
            };

            var promotionCodes = await promotionCodeService.ListAsync(options);
            var promoCodeObj = promotionCodes.Data.FirstOrDefault();

            return promoCodeObj?.Coupon?.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Error looking up Stripe coupon for promo code: {PromoCode}", promoCode);
            return null;
        }
    }

    /// <summary>
    /// Maps a Stripe Coupon to a PromotionResponse DTO
    /// </summary>
    private PromotionResponse MapCouponToResponse(Coupon coupon, string? promoCode)
    {
        return new PromotionResponse
        {
            PromotionId = 0, // Not stored in DB anymore
            Name = coupon.Name ?? promoCode ?? "Special Offer",
            Description = null,
            PromoCode = promoCode,
            DiscountType = coupon.PercentOff.HasValue ? "percent_off" : "amount_off",
            PercentOff = coupon.PercentOff,
            AmountOff = coupon.AmountOff,
            Currency = coupon.Currency,
            Duration = coupon.Duration,
            DurationInMonths = (int?)coupon.DurationInMonths,
            DiscountDescription = GetDiscountDescription(coupon)
        };
    }

    /// <summary>
    /// Generates a human-readable discount description from a Stripe coupon
    /// </summary>
    private string GetDiscountDescription(Coupon coupon)
    {
        string discountPart;
        if (coupon.PercentOff.HasValue)
        {
            discountPart = $"{coupon.PercentOff:0}% off";
        }
        else if (coupon.AmountOff.HasValue)
        {
            var amount = coupon.AmountOff.Value / 100m; // Convert cents to dollars
            var currency = coupon.Currency?.ToUpper() ?? "USD";
            discountPart = $"${amount:0.00} {currency} off";
        }
        else
        {
            discountPart = "Discount";
        }

        string durationPart = coupon.Duration switch
        {
            "once" => " (first invoice)",
            "forever" => " forever",
            "repeating" when coupon.DurationInMonths.HasValue =>
                $" for {coupon.DurationInMonths} month{(coupon.DurationInMonths > 1 ? "s" : "")}",
            _ => string.Empty
        };

        return discountPart + durationPart;
    }
}
