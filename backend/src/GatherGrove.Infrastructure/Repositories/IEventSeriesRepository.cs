using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for Event Series operations
/// </summary>
public interface IEventSeriesRepository
{
    /// <summary>
    /// Creates a new event series
    /// </summary>
    /// <param name="eventSeries">The event series to create</param>
    /// <returns>The created event series</returns>
    Task<EventSeries> CreateAsync(EventSeries eventSeries);

    /// <summary>
    /// Gets an event series by ID
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>The event series if found, null otherwise</returns>
    Task<EventSeries?> GetByIdAsync(int id);

    /// <summary>
    /// Gets all event series for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of event series for the club</returns>
    Task<List<EventSeries>> GetByClubIdAsync(int clubId);

    /// <summary>
    /// Updates an existing event series
    /// </summary>
    /// <param name="eventSeries">The event series to update</param>
    /// <returns>The updated event series</returns>
    Task<EventSeries> UpdateAsync(EventSeries eventSeries);

    /// <summary>
    /// Deletes an event series (soft delete)
    /// </summary>
    /// <param name="id">The event series ID to delete</param>
    /// <returns>Task representing the delete operation</returns>
    Task DeleteAsync(int id);

    /// <summary>
    /// Gets active event series for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of active event series</returns>
    Task<List<EventSeries>> GetActiveByClubIdAsync(int clubId);

    /// <summary>
    /// Checks if an event series exists
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>True if exists, false otherwise</returns>
    Task<bool> ExistsAsync(int id);
}
