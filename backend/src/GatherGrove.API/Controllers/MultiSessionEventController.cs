using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Domain.Entities;
using System.Security.Claims;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing multi-session events
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/multi-session-events")]
[Authorize]
public class MultiSessionEventController : ControllerBase
{
    private readonly IMultiSessionEventService _multiSessionEventService;
    private readonly ApplicationClubAuth _clubAuthorizationService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<MultiSessionEventController> _logger;

    public MultiSessionEventController(
        IMultiSessionEventService multiSessionEventService,
        ApplicationClubAuth clubAuthorizationService,
        ITierGateService tierGateService,
        ILogger<MultiSessionEventController> logger)
    {
        _multiSessionEventService = multiSessionEventService;
        _clubAuthorizationService = clubAuthorizationService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new multi-session event for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The multi-session event creation request</param>
    /// <returns>The created multi-session event</returns>
    [HttpPost]
    [ProducesResponseType(typeof(MultiSessionEventResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateMultiSessionEvent(
        [FromRoute] int clubId,
        [FromBody] CreateMultiSessionEventRequest request)
    {
        try
        {
            _logger.LogInformation("Creating multi-session event '{Name}' for club {ClubId}", request.Name, clubId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Check tier restrictions for multi-session events (unlimited tier feature)
            var tierValidation = await _tierGateService.ValidateFeatureAccessAsync(clubId, "MultiSessionEvents");
            if (!tierValidation.HasAccess)
            {
                return Forbid("Feature not available for your tier");
            }

            var response = await _multiSessionEventService.CreateMultiSessionEventAsync(clubId, request);

            _logger.LogInformation("Multi-session event '{Name}' created with ID {Id}", response.Name, response.Id);

            return CreatedAtAction(
                nameof(GetMultiSessionEvent),
                new { clubId, eventId = response.Id },
                response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for creating multi-session event: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating multi-session event for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while creating the multi-session event");
        }
    }

    /// <summary>
    /// Gets all multi-session events for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of multi-session events for the club</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<MultiSessionEventResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMultiSessionEventsByClub([FromRoute] int clubId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var events = await _multiSessionEventService.GetMultiSessionEventsByClubAsync(clubId);

            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting multi-session events for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving multi-session events");
        }
    }

    /// <summary>
    /// Gets a specific multi-session event by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <returns>The multi-session event details</returns>
    [HttpGet("{eventId}")]
    [ProducesResponseType(typeof(MultiSessionEventResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMultiSessionEvent(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var multiSessionEvent = await _multiSessionEventService.GetMultiSessionEventAsync(eventId);
            if (multiSessionEvent == null)
            {
                return NotFound($"Multi-session event with ID {eventId} not found");
            }

            // Ensure the event belongs to the specified club
            if (multiSessionEvent.ClubId != clubId)
            {
                return NotFound($"Multi-session event with ID {eventId} not found in club {clubId}");
            }

            return Ok(multiSessionEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting multi-session event {EventId} for club {ClubId}", eventId, clubId);
            return StatusCode(500, "An error occurred while retrieving the multi-session event");
        }
    }

    /// <summary>
    /// Registers a member for a multi-session event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="request">The registration request</param>
    /// <returns>The created registration</returns>
    [HttpPost("{eventId}/registrations")]
    [ProducesResponseType(typeof(MultiSessionRegistrationResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RegisterForMultiSessionEvent(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] MultiSessionRegistrationRequest request)
    {
        try
        {
            _logger.LogInformation("Registering member {MemberId} for multi-session event {EventId}",
                request.MemberId, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var registration = await _multiSessionEventService.RegisterForMultiSessionEventAsync(eventId, request);

            _logger.LogInformation("Member {MemberId} registered for multi-session event {EventId}",
                request.MemberId, eventId);

            return CreatedAtAction(
                nameof(GetMemberProgress),
                new { clubId, eventId, memberId = request.MemberId },
                registration);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for multi-session event registration: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for multi-session event registration: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering member {MemberId} for multi-session event {EventId}",
                request.MemberId, eventId);
            return StatusCode(500, "An error occurred while registering for the multi-session event");
        }
    }

    /// <summary>
    /// Adds a new session to an existing multi-session event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="request">The add session request</param>
    /// <returns>The created session</returns>
    [HttpPost("{eventId}/sessions")]
    [ProducesResponseType(typeof(EventSessionResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddSessionToEvent(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] AddEventSessionRequest request)
    {
        try
        {
            _logger.LogInformation("Adding session '{Name}' to multi-session event {EventId}",
                request.Name, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var session = await _multiSessionEventService.AddSessionToEventAsync(eventId, request);

            _logger.LogInformation("Session '{Name}' added to multi-session event {EventId}",
                session.Name, eventId);

            return CreatedAtAction(
                nameof(GetEventSession),
                new { clubId, eventId, sessionId = session.Id },
                session);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for adding session: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding session to multi-session event {EventId}", eventId);
            return StatusCode(500, "An error occurred while adding the session");
        }
    }

    /// <summary>
    /// Updates an existing event session
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="sessionId">The ID of the session</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated session</returns>
    [HttpPut("{eventId}/sessions/{sessionId}")]
    [ProducesResponseType(typeof(EventSessionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateEventSession(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int sessionId,
        [FromBody] UpdateEventSessionRequest request)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var updatedSession = await _multiSessionEventService.UpdateEventSessionAsync(sessionId, request);
            if (updatedSession == null)
            {
                return NotFound($"Session with ID {sessionId} not found");
            }

            _logger.LogInformation("Session {SessionId} updated for event {EventId}", sessionId, eventId);

            return Ok(updatedSession);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for updating session {SessionId}: {Message}", sessionId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating session {SessionId} for event {EventId}", sessionId, eventId);
            return StatusCode(500, "An error occurred while updating the session");
        }
    }

    /// <summary>
    /// Gets a specific event session
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="sessionId">The ID of the session</param>
    /// <returns>The session details</returns>
    [HttpGet("{eventId}/sessions/{sessionId}")]
    [ProducesResponseType(typeof(EventSessionResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventSession(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int sessionId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Note: This would require an additional method in the service to get a single session
            // For now, we'll get the full event and extract the session
            var multiSessionEvent = await _multiSessionEventService.GetMultiSessionEventAsync(eventId);
            if (multiSessionEvent == null || multiSessionEvent.ClubId != clubId)
            {
                return NotFound($"Multi-session event with ID {eventId} not found in club {clubId}");
            }

            var session = multiSessionEvent.Sessions.FirstOrDefault(s => s.Id == sessionId);
            if (session == null)
            {
                return NotFound($"Session with ID {sessionId} not found in event {eventId}");
            }

            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session {SessionId} for event {EventId}", sessionId, eventId);
            return StatusCode(500, "An error occurred while retrieving the session");
        }
    }

    /// <summary>
    /// Gets attendance records for a specific session
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="sessionId">The ID of the session</param>
    /// <returns>List of attendance records</returns>
    [HttpGet("{eventId}/sessions/{sessionId}/attendance")]
    [ProducesResponseType(typeof(List<EventSessionAttendance>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetSessionAttendance(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int sessionId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var attendance = await _multiSessionEventService.GetSessionAttendanceAsync(sessionId);

            return Ok(attendance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attendance for session {SessionId}", sessionId);
            return StatusCode(500, "An error occurred while retrieving session attendance");
        }
    }

    /// <summary>
    /// Gets member progress across all sessions in a multi-session event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the multi-session event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>The member's progress information</returns>
    [HttpGet("{eventId}/members/{memberId}/progress")]
    [ProducesResponseType(typeof(MultiSessionMemberProgress), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMemberProgress(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var progress = await _multiSessionEventService.GetMemberProgressAsync(eventId, memberId);
            if (progress == null)
            {
                return NotFound($"No progress found for member {memberId} in event {eventId}");
            }

            return Ok(progress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member progress for member {MemberId} in event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while retrieving member progress");
        }
    }
}