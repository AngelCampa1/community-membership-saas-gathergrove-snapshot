using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for multi-session event service operations
/// </summary>
public interface IMultiSessionEventService
{
    /// <summary>
    /// Creates a new multi-session event
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The create request</param>
    /// <returns>The created multi-session event response</returns>
    Task<MultiSessionEventResponse> CreateMultiSessionEventAsync(int clubId, CreateMultiSessionEventRequest request);

    /// <summary>
    /// Gets a multi-session event by ID
    /// </summary>
    /// <param name="id">The multi-session event ID</param>
    /// <returns>The multi-session event response</returns>
    Task<MultiSessionEventResponse?> GetMultiSessionEventAsync(int id);

    /// <summary>
    /// Registers a member for a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="request">The registration request</param>
    /// <returns>The registration response</returns>
    Task<MultiSessionRegistrationResponse> RegisterForMultiSessionEventAsync(int multiSessionEventId, MultiSessionRegistrationRequest request);

    /// <summary>
    /// Adds a session to a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="request">The add session request</param>
    /// <returns>The created session response</returns>
    Task<EventSessionResponse> AddSessionToEventAsync(int multiSessionEventId, AddEventSessionRequest request);

    /// <summary>
    /// Updates an event session
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated session response</returns>
    Task<EventSessionResponse?> UpdateEventSessionAsync(int sessionId, UpdateEventSessionRequest request);

    /// <summary>
    /// Gets attendance for a specific session
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <returns>List of attendance records</returns>
    Task<List<EventSessionAttendance>> GetSessionAttendanceAsync(int sessionId);

    /// <summary>
    /// Gets progress for a member in a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>Member progress information</returns>
    Task<MultiSessionMemberProgress?> GetMemberProgressAsync(int multiSessionEventId, int memberId);

    /// <summary>
    /// Gets all multi-session events for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of multi-session events</returns>
    Task<List<MultiSessionEventResponse>> GetMultiSessionEventsByClubAsync(int clubId);
}