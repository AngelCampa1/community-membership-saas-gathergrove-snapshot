namespace GatherGrove.Application.Configuration;

/// <summary>
/// Configuration settings for Stripe integration
/// </summary>
public class StripeSettings
{
    /// <summary>
    /// Stripe secret key for API authentication
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Stripe publishable key for frontend use
    /// </summary>
    public string PublishableKey { get; set; } = string.Empty;

    /// <summary>
    /// Webhook secret for validating webhook events
    /// </summary>
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Grow monthly plan ($29/month)
    /// </summary>
    public string GrowMonthlyPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Grow annual plan ($290/year)
    /// </summary>
    public string GrowAnnualPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Unlimited monthly plan ($200/month)
    /// </summary>
    public string UnlimitedMonthlyPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Unlimited annual plan ($2000/year)
    /// </summary>
    public string UnlimitedAnnualPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Seed monthly plan ($9/month)
    /// </summary>
    public string SeedMonthlyPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Stripe price ID for the Seed annual plan ($99/year)
    /// </summary>
    public string SeedAnnualPriceId { get; set; } = string.Empty;

    /// <summary>
    /// Your domain for success and cancel URLs
    /// </summary>
    public string Domain { get; set; } = string.Empty;

    /// <summary>
    /// Whether Stripe Connect is enabled for this environment
    /// </summary>
    public bool IsConnectEnabled { get; set; } = false;

    /// <summary>
    /// Default country code for Stripe accounts (e.g., "US", "CA", "GB")
    /// </summary>
    public string? DefaultCountry { get; set; } = "US";

    /// <summary>
    /// The country of the platform's Stripe account (e.g., "US", "CA", "GB")
    /// Used to determine if application fees are supported
    /// </summary>
    public string PlatformCountry { get; set; } = "US";
}