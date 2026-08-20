using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for event operations
/// </summary>
public interface IEventService
{
    /// <summary>
    /// Creates a new event for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The event creation request</param>
    /// <returns>The created event</returns>
    Task<EventResponse> CreateEventAsync(int clubId, CreateEventRequest request);

    /// <summary>
    /// Updates an existing event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event to update</param>
    /// <param name="request">The event update request</param>
    /// <returns>The updated event</returns>
    Task<EventResponse> UpdateEventAsync(int clubId, int eventId, UpdateEventRequest request);

    /// <summary>
    /// Deletes an existing event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event to delete</param>
    /// <returns>Task indicating completion</returns>
    Task DeleteEventAsync(int clubId, int eventId);

    /// <summary>
    /// Gets a specific event by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The event if found</returns>
    Task<EventResponse?> GetEventByIdAsync(int clubId, int eventId);

    /// <summary>
    /// Gets all events for a club, optionally filtered by upcoming/past
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="filter">Optional filter: "upcoming" for future events, "past" for past events, null for all events</param>
    /// <returns>List of events</returns>
    Task<List<EventResponse>> GetEventsByClubAsync(int clubId, string? filter = null);

    /// <summary>
    /// Updates or creates an RSVP for a member and event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="request">The RSVP update request</param>
    /// <returns>The updated RSVP</returns>
    Task<EventRsvpResponse> UpsertRsvpAsync(int clubId, int eventId, int memberId, UpdateRsvpRequest request);

    /// <summary>
    /// Gets all RSVPs for a specific event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of RSVPs for the event</returns>
    Task<List<EventRsvpResponse>> GetEventRsvpsAsync(int clubId, int eventId);

    /// <summary>
    /// Gets an RSVP for a specific member and event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>The RSVP if found</returns>
    Task<EventRsvpResponse?> GetMemberRsvpAsync(int clubId, int eventId, int memberId);

    /// <summary>
    /// Sends invitations for an event to specified members
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The invitation request containing methods and optional member IDs</param>
    /// <returns>The result of sending invitations</returns>
    Task<SendEventInvitationsResponse> SendEventInvitationsAsync(int clubId, int eventId, SendEventInvitationsRequest request);

    /// <summary>
    /// Creates a new event for a club (3-parameter overload)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The event creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created event</returns>
    Task<EventResponse> CreateEventAsync(int clubId, CreateEventRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing event (4-parameter overload)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event to update</param>
    /// <param name="request">The event update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The updated event</returns>
    Task<EventResponse> UpdateEventAsync(int clubId, int eventId, UpdateEventRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes an existing event (3-parameter overload)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task indicating completion</returns>
    Task DeleteEventAsync(int clubId, int eventId, CancellationToken cancellationToken);

    /// <summary>
    /// Gets all events for a club (alternative name)
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="filter">Optional filter: "upcoming" for future events, "past" for past events, null for all events</param>
    /// <returns>List of events</returns>
    Task<List<EventResponse>> GetEventsAsync(int clubId, string? filter = null);

    /// <summary>
    /// Creates an RSVP for a member and event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="request">The RSVP creation request</param>
    /// <returns>The created RSVP</returns>
    Task<EventRsvpResponse> CreateRsvpAsync(int clubId, int eventId, int memberId, UpdateRsvpRequest request);
}