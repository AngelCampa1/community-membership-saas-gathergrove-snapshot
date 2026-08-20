using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request body for claiming a 30-day free trial.
/// </summary>
public class ClaimTrialRequest
{
    /// <summary>
    /// Stripe PaymentMethod ID. Required — credit card is captured upfront.
    /// </summary>
    [Required]
    public string PaymentMethodId { get; set; } = string.Empty;

    /// <summary>
    /// The tier to trial: "Seed", "Grow", or "Expand". Defaults to "Seed".
    /// </summary>
    [RegularExpression("^(Seed|Grow|Expand|Unlimited)$", ErrorMessage = "TargetTier must be 'Seed', 'Grow', or 'Expand'")]
    public string TargetTier { get; set; } = "Seed";

    /// <summary>
    /// Billing cycle for after trial ends: "monthly" or "annual". Defaults to "monthly".
    /// </summary>
    [RegularExpression("^(monthly|annual)$", ErrorMessage = "BillingCycle must be 'monthly' or 'annual'")]
    public string BillingCycle { get; set; } = "monthly";
}
