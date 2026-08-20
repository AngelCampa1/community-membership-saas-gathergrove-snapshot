using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.Security;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;
using DTOMemberEventQRCode = GatherGrove.Application.DTOs.MemberEventQRCode;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing event check-in operations
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/events/{eventId}/checkin")]
[Authorize]
public class EventCheckinController : ControllerBase
{
    private readonly IEventCheckinService _eventCheckinService;
    private readonly ApplicationClubAuth _clubAuthorizationService;
    private readonly ITierGateService _tierGateService;
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventCheckinController> _logger;

    public EventCheckinController(
        IEventCheckinService eventCheckinService,
        ApplicationClubAuth clubAuthorizationService,
        ITierGateService tierGateService,
        GatherGroveDbContext context,
        ILogger<EventCheckinController> logger)
    {
        _eventCheckinService = eventCheckinService;
        _clubAuthorizationService = clubAuthorizationService;
        _tierGateService = tierGateService;
        _context = context;
        _logger = logger;
    }

    private async Task<IActionResult?> ValidateRouteEventOwnershipAsync(int clubId, int eventId)
    {
        var eventClubId = await _context.Events
            .Where(e => e.Id == eventId)
            .Select(e => (int?)e.ClubId)
            .FirstOrDefaultAsync();

        if (!eventClubId.HasValue)
        {
            return NotFound("Event not found");
        }

        if (eventClubId.Value != clubId)
        {
            _logger.LogWarning(
                "Rejected event check-in route for event {EventId}: event club {EventClubId} did not match route club {RouteClubId}",
                eventId,
                eventClubId.Value,
                clubId);

            return Forbid("Event not authorized for this club");
        }

        return null;
    }

    private async Task<IActionResult?> ValidateRouteMemberOwnershipAsync(int clubId, int memberId)
    {
        var memberBelongsToClub = await _context.Members
            .AnyAsync(m => m.Id == memberId && m.ClubId == clubId);

        if (!memberBelongsToClub)
        {
            _logger.LogWarning(
                "Rejected event check-in route for member {MemberId}: member did not belong to route club {RouteClubId}",
                memberId,
                clubId);

            return Forbid("Member not authorized for this club");
        }

        return null;
    }

    private async Task<bool> IsClubAdminOrSelfMemberAsync(int clubId, int memberId)
    {
        if (await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return true;
        }

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return false;
        }

        var normalizedEmail = userEmail.Trim().ToUpperInvariant();
        return await _context.Members.AnyAsync(m =>
            m.Id == memberId &&
            m.ClubId == clubId &&
            m.Email.ToUpper() == normalizedEmail);
    }

    /// <summary>
    /// Generates a QR code for event check-in
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The QR code generation request</param>
    /// <returns>The generated QR code data</returns>
    [HttpPost("qr-code")]
    [ProducesResponseType(typeof(EventQRCode), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GenerateCheckinQRCode(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] GenerateEventQRCodeRequest request)
    {
        try
        {
            _logger.LogInformation("Generating check-in QR code for event {EventId}", eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized for this club");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            // Check tier restrictions for QR code check-in (unlimited tier feature)
            var tierValidation = await _tierGateService.ValidateFeatureAccessAsync(clubId, "QRCodeCheckin");
            if (!tierValidation.HasAccess)
            {
                return Forbid("Feature not available for your tier");
            }

            // Ensure the request has the correct event ID
            request.ClubId = clubId;
            request.EventId = eventId;

            var qrCode = await _eventCheckinService.GenerateEventCheckinQRCodeAsync(request);

            _logger.LogInformation(
                "Check-in QR code generated for event {EventId} with token fingerprint {TokenFingerprint}",
                eventId,
                SensitiveLogValue.Fingerprint(qrCode.QRCodeData));

            return CreatedAtAction(
                nameof(GetCheckinStatistics),
                new { clubId, eventId },
                qrCode);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for generating QR code: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while generating the QR code");
        }
    }

    /// <summary>
    /// Checks in a member using a QR code
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The QR code check-in request</param>
    /// <returns>The check-in response</returns>
    [HttpPost("qr")]
    [ProducesResponseType(typeof(CheckinResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CheckinWithQRCode(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] QRCodeCheckinRequest request)
    {
        try
        {
            _logger.LogInformation("Processing QR code check-in for member {MemberId} at event {EventId}",
                request.MemberId, eventId);

            // Validate club authorization (allow members to check themselves in)
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await IsClubAdminOrSelfMemberAsync(clubId, request.MemberId))
            {
                return Forbid("User not authorized to check in this member");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var routeMemberValidation = await ValidateRouteMemberOwnershipAsync(clubId, request.MemberId);
            if (routeMemberValidation != null)
            {
                return routeMemberValidation;
            }

            request.ClubId = clubId;
            request.EventId = eventId;
            var response = await _eventCheckinService.CheckinWithQRCodeAsync(request);

            if (!response.Success)
            {
                return BadRequest(response.ErrorMessage);
            }

            _logger.LogInformation("Member {MemberId} checked in successfully for event {EventId}",
                request.MemberId, eventId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing QR code check-in for member {MemberId} at event {EventId}",
                request.MemberId, eventId);
            return StatusCode(500, "An error occurred while processing the check-in");
        }
    }

    /// <summary>
    /// Performs manual check-in for a member
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="location">Optional check-in location</param>
    /// <returns>The check-in response</returns>
    [HttpPost("manual/{memberId}")]
    [ProducesResponseType(typeof(CheckinResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ManualCheckin(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId,
        [FromBody] string? location = null)
    {
        try
        {
            _logger.LogInformation("Processing manual check-in for member {MemberId} at event {EventId}",
                memberId, eventId);

            // Validate club authorization (only club admins can do manual check-ins)
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized for this club");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var routeMemberValidation = await ValidateRouteMemberOwnershipAsync(clubId, memberId);
            if (routeMemberValidation != null)
            {
                return routeMemberValidation;
            }

            var response = await _eventCheckinService.ManualCheckinAsync(eventId, memberId, DateTime.UtcNow, location);

            if (!response.Success)
            {
                return BadRequest(response.ErrorMessage);
            }

            _logger.LogInformation("Member {MemberId} manually checked in successfully for event {EventId}",
                memberId, eventId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing manual check-in for member {MemberId} at event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while processing the manual check-in");
        }
    }

    /// <summary>
    /// Checks out a member from an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>The checkout response</returns>
    [HttpPost("checkout/{memberId}")]
    [ProducesResponseType(typeof(CheckinResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CheckoutMember(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Processing checkout for member {MemberId} from event {EventId}",
                memberId, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await IsClubAdminOrSelfMemberAsync(clubId, memberId))
            {
                return Forbid("User not authorized to check out this member");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var response = await _eventCheckinService.CheckoutMemberAsync(eventId, memberId, DateTime.UtcNow);

            if (!response.Success)
            {
                return BadRequest(response.ErrorMessage);
            }

            _logger.LogInformation("Member {MemberId} checked out successfully from event {EventId}",
                memberId, eventId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing checkout for member {MemberId} from event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while processing the checkout");
        }
    }

    /// <summary>
    /// Gets all check-ins for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of event check-ins</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<EventCheckin>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventCheckins(
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

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized for this club");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var checkins = await _eventCheckinService.GetEventCheckinsAsync(eventId);

            return Ok(checkins);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting check-ins for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving check-ins");
        }
    }

    /// <summary>
    /// Gets list of event attendees with check-in status (mobile-compatible)
    /// Route: GET /api/v1/clubs/{clubId}/events/{eventId}/attendees
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of attendees with check-in status</returns>
    [HttpGet("../attendees")]
    [ProducesResponseType(typeof(List<EventAttendeeDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventAttendees(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Getting attendees for event {EventId}", eventId);

            // Validate club authorization
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized for this club");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var attendees = await _eventCheckinService.GetEventAttendeesAsync(eventId);

            return Ok(attendees);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attendees for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving attendees");
        }
    }

    /// <summary>
    /// Check in an attendee (mobile-compatible endpoint)
    /// Route: POST /api/v1/clubs/{clubId}/events/{eventId}/checkin/attendee
    /// Request body: { memberId: number, location?: string }
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The check-in request</param>
    /// <returns>The check-in response</returns>
    [HttpPost("attendee")]
    [ProducesResponseType(typeof(CheckinResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CheckInAttendee(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] CheckInAttendeeRequest request)
    {
        try
        {
            _logger.LogInformation("Mobile check-in request for member {MemberId} at event {EventId}",
                request.MemberId, eventId);

            // Validate club authorization (only club admins can perform manual attendee check-ins)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized to check in this member");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var routeMemberValidation = await ValidateRouteMemberOwnershipAsync(clubId, request.MemberId);
            if (routeMemberValidation != null)
            {
                return routeMemberValidation;
            }

            // Delegate to existing ManualCheckinAsync service method
            var response = await _eventCheckinService.ManualCheckinAsync(
                eventId,
                request.MemberId,
                DateTime.UtcNow,
                request.Location);

            if (!response.Success)
            {
                return BadRequest(response.ErrorMessage);
            }

            _logger.LogInformation("Member {MemberId} checked in successfully via mobile for event {EventId}",
                request.MemberId, eventId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing mobile check-in for member {MemberId} at event {EventId}",
                request.MemberId, eventId);
            return StatusCode(500, "An error occurred while processing the check-in");
        }
    }

    /// <summary>
    /// Gets check-in statistics for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>Check-in statistics</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(CheckinStatisticsResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCheckinStatistics(
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

            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
            {
                return Forbid("User not authorized for this club");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var statistics = await _eventCheckinService.GetCheckinStatisticsAsync(eventId);

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting check-in statistics for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving check-in statistics");
        }
    }

    /// <summary>
    /// Generates a member-specific QR code for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="validForHours">How long the QR code should be valid for</param>
    /// <returns>The generated member QR code</returns>
    [HttpPost("members/{memberId}/qr-code")]
    [ProducesResponseType(typeof(DTOMemberEventQRCode), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GenerateMemberQRCode(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId,
        [FromBody] int validForHours = 24)
    {
        try
        {
            _logger.LogInformation("Generating member QR code for member {MemberId} and event {EventId}",
                memberId, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await IsClubAdminOrSelfMemberAsync(clubId, memberId))
            {
                return Forbid("User not authorized to generate QR code for this member");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var request = new GenerateMemberQRCodeRequest
            {
                EventId = eventId,
                MemberId = memberId,
                ValidForHours = validForHours
            };

            var memberQRCode = await _eventCheckinService.GenerateMemberQRCodeAsync(request);

            _logger.LogInformation("Member QR code generated for member {MemberId} and event {EventId}",
                memberId, eventId);

            return CreatedAtAction(
                nameof(GetMemberCheckinHistory),
                new { clubId, eventId, memberId },
                memberQRCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating member QR code for member {MemberId} and event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while generating the member QR code");
        }
    }

    /// <summary>
    /// Gets check-in history for a specific member
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event (optional filter)</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>List of member's check-ins</returns>
    [HttpGet("members/{memberId}/history")]
    [ProducesResponseType(typeof(List<EventCheckin>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMemberCheckinHistory(
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

            if (!await IsClubAdminOrSelfMemberAsync(clubId, memberId))
            {
                return Forbid("User not authorized to view this member's check-in history");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var history = await _eventCheckinService.GetMemberCheckinHistoryAsync(memberId, eventId);

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting check-in history for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while retrieving check-in history");
        }
    }

    /// <summary>
    /// Validates if a member can check in to an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>Validation result</returns>
    [HttpGet("members/{memberId}/eligibility")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ValidateCheckinEligibility(
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

            if (!await IsClubAdminOrSelfMemberAsync(clubId, memberId))
            {
                return Forbid("User not authorized to check eligibility for this member");
            }

            var routeEventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (routeEventValidation != null)
            {
                return routeEventValidation;
            }

            var (canCheckin, reason) = await _eventCheckinService.ValidateCheckinEligibilityAsync(eventId, memberId);

            return Ok(new
            {
                CanCheckin = canCheckin,
                Reason = reason,
                MemberId = memberId,
                EventId = eventId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating check-in eligibility for member {MemberId} at event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while validating check-in eligibility");
        }
    }
}
