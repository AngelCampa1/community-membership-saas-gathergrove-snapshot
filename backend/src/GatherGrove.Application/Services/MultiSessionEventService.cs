using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Repositories;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing multi-session event operations
/// </summary>
public class MultiSessionEventService : IMultiSessionEventService
{
    private readonly IMultiSessionEventRepository _multiSessionEventRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IEventSessionRepository _eventSessionRepository;
    private readonly ILogger<MultiSessionEventService> _logger;

    public MultiSessionEventService(
        IMultiSessionEventRepository multiSessionEventRepository,
        IEventRepository eventRepository,
        IEventSessionRepository eventSessionRepository,
        ILogger<MultiSessionEventService> logger)
    {
        _multiSessionEventRepository = multiSessionEventRepository;
        _eventRepository = eventRepository;
        _eventSessionRepository = eventSessionRepository;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new multi-session event with all its sessions
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The create request</param>
    /// <returns>The created multi-session event response</returns>
    public async Task<MultiSessionEventResponse> CreateMultiSessionEventAsync(int clubId, CreateMultiSessionEventRequest request)
    {
        _logger.LogInformation("Creating multi-session event '{Name}' for club {ClubId} with {SessionCount} sessions",
            request.Name, clubId, request.Sessions.Count);

        // Validate sessions
        ValidateSessionRequests(request.Sessions);

        var multiSessionEvent = new MultiSessionEvent
        {
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            MaxCapacity = request.MaxCapacity,
            RegistrationRequired = request.RegistrationRequired,
            AllowIndividualSessionRegistration = request.AllowIndividualSessionRegistration,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdEvent = await _multiSessionEventRepository.CreateAsync(multiSessionEvent);

        // Create all sessions
        var sessions = new List<EventSession>();
        foreach (var sessionRequest in request.Sessions.OrderBy(s => s.SessionNumber))
        {
            var session = new EventSession
            {
                MultiSessionEventId = createdEvent.Id,
                Name = sessionRequest.Name,
                Description = sessionRequest.Description,
                StartDateTime = sessionRequest.StartDateTime,
                EndDateTime = sessionRequest.EndDateTime,
                SessionNumber = sessionRequest.SessionNumber,
                MaxCapacity = sessionRequest.MaxCapacity,
                IsMandatory = sessionRequest.IsMandatory,
                Prerequisites = sessionRequest.Prerequisites,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdSession = await _eventSessionRepository.CreateAsync(session);
            sessions.Add(createdSession);
        }

        _logger.LogInformation("Multi-session event '{Name}' created with ID {Id} and {SessionCount} sessions",
            createdEvent.Name, createdEvent.Id, sessions.Count);

        return MapToMultiSessionEventResponse(createdEvent, sessions);
    }

    /// <summary>
    /// Gets a multi-session event by ID
    /// </summary>
    /// <param name="id">The multi-session event ID</param>
    /// <returns>The multi-session event response</returns>
    public async Task<MultiSessionEventResponse?> GetMultiSessionEventAsync(int id)
    {
        var multiSessionEvent = await _multiSessionEventRepository.GetByIdWithSessionsAsync(id);
        if (multiSessionEvent == null)
        {
            return null;
        }

        return MapToMultiSessionEventResponse(multiSessionEvent, multiSessionEvent.Sessions.ToList());
    }

    /// <summary>
    /// Registers a member for a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="request">The registration request</param>
    /// <returns>The created registration response</returns>
    public async Task<MultiSessionRegistrationResponse> RegisterForMultiSessionEventAsync(int multiSessionEventId, MultiSessionRegistrationRequest request)
    {
        _logger.LogInformation("Registering member {MemberId} for multi-session event {EventId}",
            request.MemberId, multiSessionEventId);

        var multiSessionEvent = await _multiSessionEventRepository.GetByIdWithSessionsAsync(multiSessionEventId);
        if (multiSessionEvent == null)
        {
            throw new ArgumentException($"Multi-session event with ID {multiSessionEventId} not found");
        }

        // Validate registration policy
        if (!request.RegisterForAllSessions && !multiSessionEvent.AllowIndividualSessionRegistration)
        {
            throw new InvalidOperationException("Individual session registration is not allowed for this event");
        }

        // Determine which sessions to register for
        var sessionsToRegister = request.RegisterForAllSessions
            ? multiSessionEvent.Sessions
            : multiSessionEvent.Sessions.Where(s => request.SelectedSessionIds != null && request.SelectedSessionIds.Contains(s.Id)).ToList();

        if (!sessionsToRegister.Any())
        {
            throw new ArgumentException("No valid sessions selected for registration");
        }

        // Create the registration
        var registration = new MultiSessionEventRegistration
        {
            MultiSessionEventId = multiSessionEventId,
            MemberId = request.MemberId,
            RegisteredForAllSessions = request.RegisterForAllSessions,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        var createdRegistration = await _multiSessionEventRepository.CreateRegistrationAsync(registration);

        if (createdRegistration == null)
        {
            throw new InvalidOperationException("Failed to create multi-session event registration");
        }

        // Create session registration info
        var sessionRegistrations = sessionsToRegister.Select(session => new SessionRegistrationInfo
        {
            SessionId = session.Id,
            SessionNumber = session.SessionNumber,
            SessionName = session.Name,
            Attended = false,
            AttendedAt = null
        }).ToList();

        _logger.LogInformation("Member {MemberId} registered for {SessionCount} sessions in event {EventId}",
            request.MemberId, sessionRegistrations.Count, multiSessionEventId);

        return new MultiSessionRegistrationResponse
        {
            Id = createdRegistration.Id,
            MultiSessionEventId = multiSessionEventId,
            MemberId = request.MemberId,
            RegisteredForAllSessions = request.RegisterForAllSessions,
            SessionRegistrations = sessionRegistrations,
            Notes = request.Notes,
            CreatedAt = createdRegistration.CreatedAt
        };
    }

    /// <summary>
    /// Adds a new session to an existing multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="request">The add session request</param>
    /// <returns>The created session response</returns>
    public async Task<EventSessionResponse> AddSessionToEventAsync(int multiSessionEventId, AddEventSessionRequest request)
    {
        _logger.LogInformation("Adding session '{Name}' to multi-session event {EventId}",
            request.Name, multiSessionEventId);

        var multiSessionEvent = await _multiSessionEventRepository.GetByIdAsync(multiSessionEventId);
        if (multiSessionEvent == null)
        {
            throw new ArgumentException($"Multi-session event with ID {multiSessionEventId} not found");
        }

        var session = new EventSession
        {
            MultiSessionEventId = multiSessionEventId,
            Name = request.Name,
            Description = request.Description,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            SessionNumber = request.SessionNumber,
            MaxCapacity = request.MaxCapacity,
            IsMandatory = request.IsMandatory,
            Prerequisites = request.Prerequisites,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdSession = await _eventSessionRepository.CreateAsync(session);

        _logger.LogInformation("Session '{Name}' added to event {EventId} with ID {SessionId}",
            createdSession.Name, multiSessionEventId, createdSession.Id);

        return MapToEventSessionResponse(createdSession);
    }

    /// <summary>
    /// Updates an existing event session
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated session response</returns>
    public async Task<EventSessionResponse?> UpdateEventSessionAsync(int sessionId, UpdateEventSessionRequest request)
    {
        _logger.LogInformation("Updating event session {SessionId}", sessionId);

        var session = await _eventSessionRepository.GetByIdAsync(sessionId);
        if (session == null)
        {
            return null;
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(request.Name))
            session.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            session.Description = request.Description;

        if (request.StartDateTime.HasValue)
            session.StartDateTime = request.StartDateTime.Value;

        if (request.EndDateTime.HasValue)
            session.EndDateTime = request.EndDateTime.Value;

        if (request.MaxCapacity.HasValue)
            session.MaxCapacity = request.MaxCapacity;

        if (request.IsMandatory.HasValue)
            session.IsMandatory = request.IsMandatory.Value;

        if (request.Prerequisites != null)
            session.Prerequisites = request.Prerequisites;

        session.UpdatedAt = DateTime.UtcNow;

        var updatedSession = await _eventSessionRepository.UpdateAsync(session);

        _logger.LogInformation("Event session {SessionId} updated", sessionId);

        return MapToEventSessionResponse(updatedSession);
    }

    /// <summary>
    /// Gets attendance records for a specific session
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <returns>List of attendance records</returns>
    public async Task<List<EventSessionAttendance>> GetSessionAttendanceAsync(int sessionId)
    {
        return await _eventSessionRepository.GetSessionAttendanceAsync(sessionId);
    }

    /// <summary>
    /// Gets member progress across all sessions in a multi-session event
    /// </summary>
    /// <param name="multiSessionEventId">The multi-session event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>The member's progress information</returns>
    public async Task<MultiSessionMemberProgress?> GetMemberProgressAsync(int multiSessionEventId, int memberId)
    {
        var progress = await _multiSessionEventRepository.GetMemberProgressAsync(multiSessionEventId, memberId);
        return progress as MultiSessionMemberProgress;
    }

    /// <summary>
    /// Gets all multi-session events for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of multi-session events for the club</returns>
    public async Task<List<MultiSessionEventResponse>> GetMultiSessionEventsByClubAsync(int clubId)
    {
        var events = await _multiSessionEventRepository.GetByClubIdAsync(clubId);
        var responses = new List<MultiSessionEventResponse>();

        foreach (var eventItem in events)
        {
            var sessions = await _eventSessionRepository.GetByMultiSessionEventIdAsync(eventItem.Id);
            responses.Add(MapToMultiSessionEventResponse(eventItem, sessions));
        }

        return responses;
    }

    private void ValidateSessionRequests(List<EventSessionRequest> sessions)
    {
        if (!sessions.Any())
        {
            throw new ArgumentException("At least one session is required");
        }

        // Check for duplicate session numbers
        var duplicateNumbers = sessions.GroupBy(s => s.SessionNumber)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key);

        if (duplicateNumbers.Any())
        {
            throw new ArgumentException($"Duplicate session numbers found: {string.Join(", ", duplicateNumbers)}");
        }

        // Validate date ordering
        foreach (var session in sessions)
        {
            if (session.EndDateTime <= session.StartDateTime)
            {
                throw new ArgumentException($"Session '{session.Name}' end time must be after start time");
            }
        }
    }

    private MultiSessionEventResponse MapToMultiSessionEventResponse(MultiSessionEvent multiSessionEvent, List<EventSession> sessions)
    {
        return new MultiSessionEventResponse
        {
            Id = multiSessionEvent.Id,
            ClubId = multiSessionEvent.ClubId,
            Name = multiSessionEvent.Name,
            Description = multiSessionEvent.Description,
            Location = multiSessionEvent.Location,
            MaxCapacity = multiSessionEvent.MaxCapacity,
            RegistrationRequired = multiSessionEvent.RegistrationRequired,
            AllowIndividualSessionRegistration = multiSessionEvent.AllowIndividualSessionRegistration,
            IsActive = multiSessionEvent.IsActive,
            Sessions = sessions.OrderBy(s => s.SessionNumber).Select(MapToEventSessionResponse).ToList(),
            TotalRegistrations = 0, // This would be calculated from registrations in real implementation
            CreatedAt = multiSessionEvent.CreatedAt,
            UpdatedAt = multiSessionEvent.UpdatedAt
        };
    }

    private EventSessionResponse MapToEventSessionResponse(EventSession session)
    {
        return new EventSessionResponse
        {
            Id = session.Id,
            MultiSessionEventId = session.MultiSessionEventId,
            Name = session.Name,
            Description = session.Description,
            StartDateTime = session.StartDateTime,
            EndDateTime = session.EndDateTime,
            SessionNumber = session.SessionNumber,
            MaxCapacity = session.MaxCapacity,
            IsMandatory = session.IsMandatory,
            Prerequisites = session.Prerequisites,
            RegisteredMembers = 0, // This would be calculated from registrations in real implementation
            AttendedMembers = 0, // This would be calculated from attendance records in real implementation
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt
        };
    }
}