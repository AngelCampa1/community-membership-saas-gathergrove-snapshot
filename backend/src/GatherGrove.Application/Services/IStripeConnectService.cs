using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for Stripe Connect operations (Story 18)
/// </summary>
public interface IStripeConnectService
{
    /// <summary>
    /// Generates a Stripe Connect onboarding link for the specified club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="userEmail">The email of the user creating the account</param>
    /// <param name="country">Optional country code for the connected account</param>
    /// <returns>Response containing the onboarding URL</returns>
    Task<StripeConnectLinkResponse> GenerateConnectLinkAsync(int clubId, string userEmail, string? country = null);

    /// <summary>
    /// Gets the Stripe Connect status for the specified club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>Response containing the connection status</returns>
    Task<StripeConnectStatusResponse> GetConnectStatusAsync(int clubId);

    /// <summary>
    /// Disconnects the Stripe account for the specified club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    Task DisconnectAsync(int clubId);
}