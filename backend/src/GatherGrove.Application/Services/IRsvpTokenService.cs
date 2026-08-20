using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for RSVP token operations
/// </summary>
public interface IRsvpTokenService
{
    /// <summary>
    /// Generates RSVP tokens for all members of a club for a specific event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>Dictionary mapping member ID to their RSVP tokens (Attending and NotAttending)</returns>
    Task<Dictionary<int, Dictionary<string, string>>> GenerateRsvpTokensForEventAsync(int clubId, int eventId);

    /// <summary>
    /// Processes an RSVP via a unique token from an email link
    /// </summary>
    /// <param name="token">The unique RSVP token</param>
    /// <returns>Response containing success status and confirmation details</returns>
    Task<RsvpViaLinkResponse> ProcessRsvpViaTokenAsync(string token);

    /// <summary>
    /// Cleans up expired RSVP tokens
    /// </summary>
    /// <returns>Number of tokens cleaned up</returns>
    Task<int> CleanupExpiredTokensAsync();
}