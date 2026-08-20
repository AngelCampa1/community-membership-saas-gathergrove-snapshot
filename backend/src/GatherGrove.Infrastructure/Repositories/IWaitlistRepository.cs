using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for Event Waitlist operations
/// </summary>
public interface IWaitlistRepository
{
    /// <summary>
    /// Creates a new waitlist entry
    /// </summary>
    /// <param name="waitlistEntry">The waitlist entry to create</param>
    /// <returns>The created waitlist entry</returns>
    Task<EventWaitlist> CreateAsync(EventWaitlist waitlistEntry);

    /// <summary>
    /// Gets waitlist entries for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of waitlist entries ordered by position</returns>
    Task<List<EventWaitlist>> GetByEventIdAsync(int eventId);

    /// <summary>
    /// Gets a specific waitlist entry by event and member
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>The waitlist entry if found, null otherwise</returns>
    Task<EventWaitlist?> GetByEventAndMemberAsync(int eventId, int memberId);

    /// <summary>
    /// Deletes a waitlist entry
    /// </summary>
    /// <param name="id">The waitlist entry ID</param>
    /// <returns>Task representing the delete operation</returns>
    Task DeleteAsync(int id);

    /// <summary>
    /// Gets the next position number for a waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>The next available position</returns>
    Task<int> GetNextPositionAsync(int eventId);

    /// <summary>
    /// Gets the next position for a specific priority level
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="priority">The priority level</param>
    /// <returns>The next position for that priority</returns>
    Task<int> GetNextPositionForPriorityAsync(int eventId, WaitlistPriority priority);

    /// <summary>
    /// Reorders positions after a deletion
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="deletedPosition">The position that was deleted</param>
    /// <returns>Task representing the reorder operation</returns>
    Task ReorderPositionsAsync(int eventId, int deletedPosition);

    /// <summary>
    /// Updates a waitlist entry position
    /// </summary>
    /// <param name="id">The waitlist entry ID</param>
    /// <param name="newPosition">The new position</param>
    /// <returns>Task representing the update operation</returns>
    Task UpdatePositionAsync(int id, int newPosition);

    /// <summary>
    /// Reorders positions after a position change
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="oldPosition">The old position</param>
    /// <param name="newPosition">The new position</param>
    /// <param name="excludeEntryId">Optional ID of entry to exclude from reordering (the one being moved)</param>
    /// <returns>Task representing the reorder operation</returns>
    Task ReorderAfterPositionChangeAsync(int eventId, int oldPosition, int newPosition, int? excludeEntryId = null);

    /// <summary>
    /// Gets the total count of waitlist entries for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>Total waitlist count</returns>
    Task<int> GetTotalWaitlistCountAsync(int eventId);

    /// <summary>
    /// Updates a waitlist entry
    /// </summary>
    /// <param name="waitlistEntry">The waitlist entry to update</param>
    /// <returns>The updated waitlist entry</returns>
    Task<EventWaitlist> UpdateAsync(EventWaitlist waitlistEntry);
}
