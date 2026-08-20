namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing a Stripe Connect onboarding link for Story 18
/// </summary>
public class StripeConnectLinkResponse
{
    /// <summary>
    /// The secure Stripe Connect onboarding URL
    /// </summary>
    public string OnboardingUrl { get; set; } = string.Empty;
}