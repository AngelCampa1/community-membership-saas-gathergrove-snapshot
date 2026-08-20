using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for event series service operations
/// </summary>
public interface IEventSeriesService
{
    /// <summary>
    /// Creates a new event series
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The create request</param>
    /// <returns>The created event series response</returns>
    Task<EventSeriesResponse> CreateEventSeriesAsync(int clubId, CreateEventSeriesRequest request);

    /// <summary>
    /// Gets an event series by ID
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>The event series response</returns>
    Task<EventSeriesResponse?> GetEventSeriesAsync(int id);

    /// <summary>
    /// Gets all event series for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of event series for the club</returns>
    Task<List<EventSeriesResponse>> GetEventSeriesByClubAsync(int clubId);

    /// <summary>
    /// Updates an existing event series
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated event series response</returns>
    Task<EventSeriesResponse?> UpdateEventSeriesAsync(int id, UpdateEventSeriesRequest request);

    /// <summary>
    /// Deletes an event series
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>Task representing the delete operation</returns>
    Task DeleteEventSeriesAsync(int id);

    /// <summary>
    /// Generates events from a series based on its recurrence pattern
    /// </summary>
    /// <param name="eventSeriesId">The event series ID</param>
    /// <returns>List of generated events</returns>
    Task<List<Event>> GenerateSeriesEventsAsync(int eventSeriesId);

    /// <summary>
    /// Registers a member for all upcoming events in a series (bulk RSVP)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventSeriesId">The event series ID</param>
    /// <param name="request">The bulk RSVP request</param>
    /// <returns>Result of the bulk RSVP operation</returns>
    Task<BulkSeriesRsvpResult> RegisterMemberForSeriesAsync(int clubId, int eventSeriesId, BulkSeriesRsvpRequest request);
}