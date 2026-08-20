using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for waitlist service operations
/// </summary>
public interface IWaitlistService
{
    /// <summary>
    /// Adds a member to an event waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="request">The add to waitlist request</param>
    /// <returns>The created waitlist entry</returns>
    Task<WaitlistEntryResponse> AddToWaitlistAsync(int eventId, AddToWaitlistRequest request);

    /// <summary>
    /// Removes a member from an event waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>Task representing the removal operation</returns>
    Task RemoveFromWaitlistAsync(int eventId, int memberId);

    /// <summary>
    /// Gets all waitlist entries for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of waitlist entries for the event</returns>
    Task<List<WaitlistEntryResponse>> GetWaitlistForEventAsync(int eventId);

    /// <summary>
    /// Processes waitlist to promote members when spots become available
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="availableSpots">Number of available spots</param>
    /// <returns>Waitlist processing result</returns>
    Task<WaitlistProcessingResult> ProcessWaitlistAsync(int eventId, int availableSpots);

    /// <summary>
    /// Updates the position of a member in the waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="newPosition">The new position</param>
    /// <returns>Task representing the update operation</returns>
    Task UpdateWaitlistPositionAsync(int eventId, int memberId, int newPosition);

    /// <summary>
    /// Gets the waitlist status for a specific member
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>Member waitlist status or null if not on waitlist</returns>
    Task<MemberWaitlistStatus?> GetMemberWaitlistStatusAsync(int eventId, int memberId);
}