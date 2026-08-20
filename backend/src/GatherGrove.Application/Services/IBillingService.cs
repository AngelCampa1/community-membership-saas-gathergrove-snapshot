using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing billing and subscription operations with Stripe
/// </summary>
public interface IBillingService
{
    /// <summary>
    /// Gets the current billing status and subscription information for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>Current billing status and subscription details</returns>
    Task<BillingStatusResponse> GetBillingStatusAsync(int clubId);

    /// <summary>
    /// Upgrades a club's subscription to a higher tier or different billing cycle using Stripe
    /// </summary>
    /// <param name="clubId">The ID of the club to upgrade</param>
    /// <param name="request">The upgrade request containing payment method and plan details</param>
    /// <returns>The upgrade result with subscription details</returns>
    Task<UpgradeSubscriptionResponse> UpgradeSubscriptionAsync(int clubId, UpgradeSubscriptionRequest request);

    /// <summary>
    /// Claims a 30-day trial by creating a Stripe trial subscription with CC on file that auto-charges.
    /// </summary>
    /// <param name="clubId">The ID of the club.</param>
    /// <param name="targetTier">The tier to trial: "Grow" or "Unlimited".</param>
    /// <param name="paymentMethodId">Stripe PaymentMethod ID to attach as default payment.</param>
    /// <param name="billingCycle">Billing cycle for after trial ends: "monthly" or "annual". Defaults to "monthly".</param>
    /// <returns>Trial claim result and trial end timestamp.</returns>
    Task<ClaimTrialResponse> ClaimTrialAsync(int clubId, string targetTier, string paymentMethodId, string billingCycle = "monthly");

    /// <summary>
    /// Creates a Stripe customer portal session for payment method management.
    /// </summary>
    /// <param name="clubId">The ID of the club.</param>
    /// <returns>A response containing a Stripe-hosted portal URL.</returns>
    Task<CreateCustomerPortalSessionResponse> CreateCustomerPortalSessionAsync(int clubId);

    /// <summary>
    /// Cancels an active subscription
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>True if cancellation was successful</returns>
    Task<bool> CancelSubscriptionAsync(int clubId);

    /// <summary>
    /// Processes webhook events from Stripe to keep subscription status in sync
    /// </summary>
    /// <param name="json">The JSON payload from Stripe webhook</param>
    /// <param name="stripeSignature">The Stripe signature header for verification</param>
    /// <returns>True if webhook was processed successfully</returns>
    Task<bool> ProcessWebhookAsync(string json, string stripeSignature);
}
