namespace GatherGrove.Application.Services;

/// <summary>
/// Service for generating application URLs consistently across the system
/// </summary>
public interface IUrlService
{
    /// <summary>
    /// Gets the base URL for the frontend application
    /// </summary>
    string GetFrontendBaseUrl();

    /// <summary>
    /// Gets the base URL for the API
    /// </summary>
    string GetApiBaseUrl();

    /// <summary>
    /// Generates a member join URL for an invite code
    /// </summary>
    string GenerateJoinUrl(string inviteCode);

    /// <summary>
    /// Generates a payment URL for a payment token
    /// </summary>
    string GeneratePaymentUrl(string paymentToken);

    /// <summary>
    /// Generates an account activation URL
    /// </summary>
    string GenerateActivationUrl(string activationToken);

    /// <summary>
    /// Generates a password reset URL
    /// </summary>
    string GeneratePasswordResetUrl(string resetToken);

    /// <summary>
    /// Generates an event RSVP URL
    /// </summary>
    string GenerateEventRsvpUrl(string rsvpToken);

    /// <summary>
    /// Generates a Stripe Connect refresh URL
    /// </summary>
    string GenerateStripeConnectRefreshUrl();

    /// <summary>
    /// Generates a Stripe Connect return URL
    /// </summary>
    string GenerateStripeConnectReturnUrl();
}