using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for Multi-Session Event operations
/// </summary>
public interface IMultiSessionEventRepository
{
    /// <summary>
    /// Creates a new multi-session event
    /// </summary>
    /// <param name="multiSessionEvent">The multi-session event to create</param>
    /// <returns>The created multi-session event</returns>
    Task<MultiSessionEvent> CreateAsync(MultiSessionEvent multiSessionEvent);

    /// <summary>
    /// Gets a multi-session event by ID
    /// </summary>
    /// <param name="id">The multi-session event ID</param>
    /// <returns>The multi-session event if found, null otherwise</returns>
    Task<MultiSessionEvent?> GetByIdAsync(int id);

    /// <summary>
    /// Gets a multi-session event by ID with all sessions included
    /// </summary>
    /// <param name="id">The multi-session event ID</param>
    /// <returns>The multi-session event with sessions if found, null otherwise</returns>
    Task<MultiSessionEvent?> GetByIdWithSessionsAsync(int id);

    /// <summary>
    /// Gets all multi-session events for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of multi-session events for the club</returns>
    Task<List<MultiSessionEvent>> GetByClubIdAsync(int clubId);

    /// <summary>
    /// Updates an existing multi-session event
    /// </summary>
    /// <param name="multiSessionEvent">The multi-session event to update</param>
    /// <returns>The updated multi-session event</returns>
    Task<MultiSessionEvent> UpdateAsync(MultiSessionEvent multiSessionEvent);

    /// <summary>
    /// Deletes a multi-session event
    /// </summary>
    /// <param name="id">The multi-session event ID</param>
    /// <returns>Task representing the delete operation</returns>
    Task DeleteAsync(int id);

    /// <summary>
    /// Creates a registration for a multi-session event
    /// </summary>
    /// <param name="registration">The registration to create</param>
    /// <returns>The created registration</returns>
    Task<MultiSessionEventRegistration> CreateRegistrationAsync(MultiSessionEventRegistration registration);

    /// <summary>
    /// Gets member progress across all sessions in a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>The member's progress information as a dynamic object</returns>
    Task<object?> GetMemberProgressAsync(int multiSessionEventId, int memberId);

    /// <summary>
    /// Gets all registrations for a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <returns>List of registrations for the event</returns>
    Task<List<MultiSessionEventRegistration>> GetRegistrationsAsync(int multiSessionEventId);
}
