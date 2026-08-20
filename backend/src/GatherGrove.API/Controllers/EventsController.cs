using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club events
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/events")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ILogger<EventsController> _logger;
    private readonly GatherGroveDbContext _context;
    private readonly IEventTokenService _tokenService;
    private readonly IConfiguration _configuration;

    public EventsController(
        IEventService eventService,
        ILogger<EventsController> logger,
        GatherGroveDbContext context,
        IEventTokenService tokenService,
        IConfiguration configuration)
    {
        _eventService = eventService;
        _logger = logger;
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    /// <summary>
    /// Creates a new event for a club
    /// </summary>
    /// <remarks>
    /// Creates a new event record for the specified club.
    /// Requires authentication and admin access to the specified club.
    /// The event name and location are required fields.
    /// Description can contain HTML content for rich formatting.
    /// </remarks>
    /// <param name="clubId">The ID of the club where the event will be created</param>
    /// <param name="request">The details of the new event to create</param>
    /// <response code="201">Returns the newly created event's details</response>
    /// <response code="400">If the request body fails validation (e.g., missing name, invalid date, etc.)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost]
    [ProducesResponseType(typeof(EventResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CreateEvent([FromRoute] int clubId, [FromBody] CreateEventRequest request)
    {
        try
        {
            _logger.LogInformation("Creating event for club {ClubId}: {Name} at {Location}", clubId, request.Name, request.Location);

            // Verify club ownership - user must own the club they're creating events for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user creating event in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to create event in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var eventResponse = await _eventService.CreateEventAsync(clubId, request);

            _logger.LogInformation("Event created successfully: {EventId}", eventResponse.Id);

            return CreatedAtAction(
                nameof(GetEvent),
                new { clubId, eventId = eventResponse.Id },
                eventResponse);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create event for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating event for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while creating the event." });
        }
    }

    /// <summary>
    /// Updates an existing event
    /// </summary>
    /// <remarks>
    /// Updates all details of an existing event in the specified club.
    /// Requires authentication and admin access to the specified club.
    /// All fields in the request body will replace the existing values.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event to update</param>
    /// <param name="request">The updated event details</param>
    /// <response code="200">Returns the updated event's details</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpPut("{eventId}")]
    [ProducesResponseType(typeof(EventResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateEvent([FromRoute] int clubId, [FromRoute] int eventId, [FromBody] UpdateEventRequest request)
    {
        try
        {
            _logger.LogInformation("Updating event {EventId} for club {ClubId}: {Name}", eventId, clubId, request.Name);

            // Verify club ownership - user must own the club they're updating events for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user updating event in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to update event in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var eventResponse = await _eventService.UpdateEventAsync(clubId, eventId, request);

            _logger.LogInformation("Event updated successfully: {EventId}", eventResponse.Id);

            return Ok(eventResponse);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update event {EventId} for club {ClubId}: {Error}", eventId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating event {EventId} for club {ClubId}", eventId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the event." });
        }
    }

    /// <summary>
    /// Deletes a specific event
    /// </summary>
    /// <remarks>
    /// Deletes an event from the specified club.
    /// Requires authentication and admin access to the specified club.
    /// This action will also delete all associated RSVPs and tokens.
    /// This action cannot be undone.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event to delete</param>
    /// <response code="204">Event deleted successfully</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpDelete("{eventId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteEvent([FromRoute] int clubId, [FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Deleting event {EventId} for club {ClubId}", eventId, clubId);

            // Verify club ownership - user must own the club they're deleting events from
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user deleting event in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to delete event in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            await _eventService.DeleteEventAsync(clubId, eventId);

            _logger.LogInformation("Event deleted successfully: {EventId}", eventId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to delete event {EventId} for club {ClubId}: {Error}", eventId, clubId, ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting event {EventId} for club {ClubId}", eventId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while deleting the event." });
        }
    }

    /// <summary>
    /// Generate payment link for a paid event
    /// </summary>
    /// <remarks>
    /// Generates a unique, shareable payment link for a paid event.
    /// The link allows public access to event registration and payment.
    /// Only works for paid events (events with pricing configured).
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event to generate a link for</param>
    /// <response code="200">Returns the payment link information</response>
    /// <response code="400">If the event is free or invalid</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpPost("{eventId}/payment-link")]
    [ProducesResponseType(typeof(PaymentLinkResponse), 200)]
    [ProducesResponseType(typeof(object), 400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(typeof(object), 404)]
    public async Task<IActionResult> GeneratePaymentLink([FromRoute] int clubId, [FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Generating payment link for event {EventId} in club {ClubId}", eventId, clubId);

            // Verify club ownership - user must own the club they're generating links for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user generating payment link in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to generate payment link in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            // Get event from database
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

            if (eventEntity == null)
            {
                _logger.LogWarning("Event {EventId} not found in club {ClubId}", eventId, clubId);
                return NotFound(new { message = $"Event with ID {eventId} not found in club {clubId}." });
            }

            // Validate event is paid (not free)
            if (eventEntity.IsFree)
            {
                _logger.LogWarning("Cannot generate payment link for free event {EventId}", eventId);
                return BadRequest(new { message = "Cannot generate payment link for free events. Event must have pricing configured." });
            }

            // Generate token via EventTokenService
            var token = await _tokenService.GeneratePaymentTokenAsync(eventId);

            // Build full payment link URL
            var baseUrl = _configuration["AppSettings:FrontendUrl"] ?? "https://gathergrove.club";
            var paymentLink = $"{baseUrl}/events/pay/{token}";

            var response = new PaymentLinkResponse
            {
                PaymentToken = token,
                PaymentLink = paymentLink,
                ExpiresAt = eventEntity.EventDateTime
            };

            _logger.LogInformation("Payment link generated successfully for event {EventId}", eventId);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to generate payment link for event {EventId} in club {ClubId}: {Error}", eventId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating payment link for event {EventId} in club {ClubId}", eventId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while generating the payment link." });
        }
    }

    /// <summary>
    /// Gets a specific event by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific event within a club.
    /// Requires authentication and access to the specified club.
    /// Returns the complete event information including HTML content in description.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event to retrieve</param>
    /// <response code="200">Returns the event's details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpGet("{eventId}")]
    [ProducesResponseType(typeof(EventResponse), 200)]
    public async Task<IActionResult> GetEvent([FromRoute] int clubId, [FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Getting event {EventId} for club {ClubId}", eventId, clubId);

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var eventResponse = await _eventService.GetEventByIdAsync(clubId, eventId);

            if (eventResponse == null)
            {
                _logger.LogWarning("Event {EventId} not found in club {ClubId}", eventId, clubId);
                return NotFound(new { message = $"Event with ID {eventId} not found in club {clubId}." });
            }

            return Ok(eventResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting event {EventId} for club {ClubId}", eventId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the event." });
        }
    }

    /// <summary>
    /// Gets all events for a club, optionally filtered by upcoming/past
    /// </summary>
    /// <remarks>
    /// Retrieves events associated with the specified club.
    /// Requires authentication and access to the specified club.
    /// Use filter parameter to get specific event types:
    /// - filter=upcoming: Returns future events sorted by soonest first
    /// - filter=past: Returns past events sorted by most recent first
    /// - No filter: Returns all events sorted by event date/time
    /// </remarks>
    /// <param name="clubId">The ID of the club to get events for</param>
    /// <param name="filter">Optional filter: "upcoming" for future events, "past" for past events</param>
    /// <response code="200">Returns the list of events for the club</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<EventResponse>), 200)]
    public async Task<IActionResult> GetEvents([FromRoute] int clubId, [FromQuery] string? filter = null)
    {
        try
        {
            _logger.LogInformation("Getting events for club {ClubId} with filter: {Filter}", clubId, filter ?? "none");

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var events = await _eventService.GetEventsByClubAsync(clubId, filter);

            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting events for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving events." });
        }
    }

    /// <summary>
    /// Updates or creates an RSVP for a member and event
    /// </summary>
    /// <remarks>
    /// This endpoint supports both admin and member self-service use cases:
    /// - Admin Access: Authenticated admin can set RSVP status for any member in their club
    /// - Member Self-Service: Authenticated member can only update their own RSVP status
    /// 
    /// The system will automatically determine if the request is from an admin or member
    /// and apply appropriate authorization. Members can only change their own RSVP status.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member whose RSVP is being updated</param>
    /// <param name="request">The RSVP update request</param>
    /// <response code="200">Returns the updated RSVP details</response>
    /// <response code="400">If the request body fails validation or invalid RSVP status</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user doesn't have permission to update this RSVP</response>
    /// <response code="404">If the specified club, event, or member does not exist</response>
    [HttpPut("{eventId}/rsvps/{memberId}")]
    [ProducesResponseType(typeof(EventRsvpResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateRsvp([FromRoute] int clubId, [FromRoute] int eventId, [FromRoute] int memberId, [FromBody] UpdateRsvpRequest request)
    {
        try
        {
            _logger.LogInformation("Updating RSVP for member {MemberId} and event {EventId} in club {ClubId}: {Status}", memberId, eventId, clubId, request.RsvpStatus);

            // Get user claims to determine authorization level
            var userClubIdClaim = User.FindFirst("ClubId");
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId) ||
                userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Missing or invalid user claims for RSVP update");
                return Forbid();
            }

            // Verify the request is for the correct club
            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to update RSVP in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            // For member self-service: verify the member ID corresponds to the authenticated user
            // For admin access: allow updating any member's RSVP in their club
            var isAdminRequest = User.IsInRole("Admin");

            if (!isAdminRequest)
            {
                // Member self-service: find the member record associated with this user
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("Missing Email claim for member RSVP update");
                    return Forbid();
                }

                var memberRecord = await _context.Members
                    .Where(m => m.ClubId == clubId)
                    .FirstOrDefaultAsync(m => m.Email == userEmail);

                if (memberRecord == null || memberRecord.Id != memberId)
                {
                    _logger.LogWarning("Member {UserId} attempted to update RSVP for different member {MemberId}", userId, memberId);
                    return Forbid();
                }
            }

            var rsvpResponse = await _eventService.UpsertRsvpAsync(clubId, eventId, memberId, request);

            _logger.LogInformation("RSVP updated successfully: Member {MemberId}, Event {EventId}, Status {Status}", memberId, eventId, request.RsvpStatus);

            return Ok(rsvpResponse);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update RSVP for member {MemberId} and event {EventId}: {Error}", memberId, eventId, ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating RSVP for member {MemberId} and event {EventId}", memberId, eventId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the RSVP." });
        }
    }

    /// <summary>
    /// Gets all RSVPs for a specific event
    /// </summary>
    /// <remarks>
    /// Retrieves all RSVP responses for the specified event.
    /// Requires authentication and access to the specified club.
    /// Returns a list of all members' RSVP statuses for the event.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event</param>
    /// <response code="200">Returns the list of RSVPs for the event</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpGet("{eventId}/rsvps")]
    [ProducesResponseType(typeof(List<EventRsvpResponse>), 200)]
    public async Task<IActionResult> GetEventRsvps([FromRoute] int clubId, [FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Getting RSVPs for event {EventId} in club {ClubId}", eventId, clubId);

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var rsvps = await _eventService.GetEventRsvpsAsync(clubId, eventId);

            return Ok(rsvps);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get RSVPs for event {EventId}: {Error}", eventId, ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting RSVPs for event {EventId}", eventId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving RSVPs." });
        }
    }

    /// <summary>
    /// Gets an RSVP for a specific member and event
    /// </summary>
    /// <remarks>
    /// Retrieves the RSVP status of a specific member for a specific event.
    /// Requires authentication and access to the specified club.
    /// Returns null if the member has not yet RSVP'd to the event.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <response code="200">Returns the RSVP details if found</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club, event, member, or RSVP does not exist</response>
    [HttpGet("{eventId}/rsvps/{memberId}")]
    [ProducesResponseType(typeof(EventRsvpResponse), 200)]
    public async Task<IActionResult> GetMemberRsvp([FromRoute] int clubId, [FromRoute] int eventId, [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Getting RSVP for member {MemberId} and event {EventId} in club {ClubId}", memberId, eventId, clubId);

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var rsvp = await _eventService.GetMemberRsvpAsync(clubId, eventId, memberId);

            if (rsvp == null)
            {
                _logger.LogInformation("RSVP not found for member {MemberId} and event {EventId}", memberId, eventId);
                return NotFound();
            }

            return Ok(rsvp);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get RSVP for member {MemberId} and event {EventId}: {Error}", memberId, eventId, ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting RSVP for member {MemberId} and event {EventId}", memberId, eventId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the RSVP." });
        }
    }

    /// <summary>
    /// Sends invitations for an event to specified members
    /// </summary>
    /// <remarks>
    /// Sends invitations to specified members or all club members for an event.
    /// Requires authentication and admin access to the specified club.
    /// Supports email and push notification methods.
    /// Invitation feature is restricted to Grow tier clubs.
    /// </remarks>
    /// <param name="clubId">The ID of the club the event belongs to</param>
    /// <param name="eventId">The ID of the event to send invitations for</param>
    /// <param name="request">The invitation request containing methods and optional member IDs</param>
    /// <response code="200">Returns success message with sent count</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="402">If the club does not have invitation features (Grow tier required)</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or event does not exist</response>
    [HttpPost("{eventId}/invitations")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> SendEventInvitations([FromRoute] int clubId, [FromRoute] int eventId, [FromBody] SendEventInvitationsRequest request)
    {
        try
        {
            _logger.LogInformation("Sending invitations for event {EventId} in club {ClubId}", eventId, clubId);

            // Verify club ownership - user must own the club they're sending invitations for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user sending invitations in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to send invitations in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var result = await _eventService.SendEventInvitationsAsync(clubId, eventId, request);

            return Ok(new { message = result.Message, sentCount = result.SentCount });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to send invitations for event {EventId}: {Error}", eventId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized invitation attempt for event {EventId}: {Error}", eventId, ex.Message);
            return StatusCode(402, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending invitations for event {EventId}", eventId);
            return StatusCode(500, new { message = "An unexpected error occurred while sending invitations." });
        }
    }
}