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
/// Controller for managing event waitlists
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/events/{eventId}/waitlist")]
[Authorize]
public class WaitlistController : ControllerBase
{
    private readonly IWaitlistService _waitlistService;
    private readonly IMemberService _memberService;
    private readonly ApplicationClubAuth _clubAuthorizationService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<WaitlistController> _logger;

    public WaitlistController(
        IWaitlistService waitlistService,
        IMemberService memberService,
        ApplicationClubAuth clubAuthorizationService,
        ITierGateService tierGateService,
        ILogger<WaitlistController> logger)
    {
        _waitlistService = waitlistService;
        _memberService = memberService;
        _clubAuthorizationService = clubAuthorizationService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Adds a member to an event waitlist
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The add to waitlist request</param>
    /// <returns>The created waitlist entry</returns>
    [HttpPost]
    [ProducesResponseType(typeof(WaitlistEntryResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddToWaitlist(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] AddToWaitlistRequest request)
    {
        try
        {
            _logger.LogInformation("Adding member {MemberId} to waitlist for event {EventId}",
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

            // Check tier restrictions for waitlist management (unlimited tier feature)
            var tierValidation = await _tierGateService.ValidateFeatureAccessAsync(clubId, "WaitlistManagement");
            if (!tierValidation.HasAccess)
            {
                return Forbid("Feature not available for your tier");
            }

            var waitlistEntry = await _waitlistService.AddToWaitlistAsync(eventId, request);

            _logger.LogInformation("Member {MemberId} added to waitlist at position {Position}",
                request.MemberId, waitlistEntry.Position);

            return CreatedAtAction(
                nameof(GetMemberWaitlistStatus),
                new { clubId, eventId, memberId = request.MemberId },
                waitlistEntry);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for adding to waitlist: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding member {MemberId} to waitlist for event {EventId}",
                request.MemberId, eventId);
            return StatusCode(500, "An error occurred while adding to the waitlist");
        }
    }

    /// <summary>
    /// Joins the current user to the event waitlist (mobile-compatible endpoint)
    /// Mobile expects: POST .../waitlist/join
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The created waitlist entry</returns>
    [HttpPost("join")]
    [ProducesResponseType(typeof(WaitlistEntryResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> JoinWaitlist(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Get current user's email from JWT
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User email not found in token");
            }

            // Get current user's member record
            var member = await _memberService.GetMemberByEmailAsync(clubId, userEmail);
            if (member == null)
            {
                return NotFound($"No member found for email {userEmail} in club {clubId}");
            }

            // Delegate to existing AddToWaitlist logic
            var request = new AddToWaitlistRequest
            {
                MemberId = member.Id
            };

            return await AddToWaitlist(clubId, eventId, request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining waitlist for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while joining the waitlist");
        }
    }

    /// <summary>
    /// Removes the current user from the event waitlist (mobile-compatible endpoint)
    /// Mobile expects: POST .../waitlist/leave
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>No content on success</returns>
    [HttpPost("leave")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> LeaveWaitlist(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Get current user's email from JWT
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User email not found in token");
            }

            // Get current user's member record
            var member = await _memberService.GetMemberByEmailAsync(clubId, userEmail);
            if (member == null)
            {
                return NotFound($"No member found for email {userEmail} in club {clubId}");
            }

            // Delegate to existing RemoveFromWaitlist logic
            return await RemoveFromWaitlist(clubId, eventId, member.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving waitlist for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while leaving the waitlist");
        }
    }

    /// <summary>
    /// Gets the current user's waitlist status (mobile-compatible endpoint)
    /// Mobile expects: GET .../waitlist/status
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The member's waitlist status</returns>
    [HttpGet("status")]
    [ProducesResponseType(typeof(MemberWaitlistStatus), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetWaitlistStatus(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Get current user's email from JWT
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User email not found in token");
            }

            // Get current user's member record
            var member = await _memberService.GetMemberByEmailAsync(clubId, userEmail);
            if (member == null)
            {
                return NotFound($"No member found for email {userEmail} in club {clubId}");
            }

            // Delegate to existing GetMemberWaitlistStatus logic
            return await GetMemberWaitlistStatus(clubId, eventId, member.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting waitlist status for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving waitlist status");
        }
    }

    /// <summary>
    /// Gets the waitlist for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of waitlist entries</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<WaitlistEntryResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventWaitlist(
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

            var waitlist = await _waitlistService.GetWaitlistForEventAsync(eventId);

            return Ok(waitlist);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting waitlist for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving the waitlist");
        }
    }

    /// <summary>
    /// Removes a member from an event waitlist
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member to remove</param>
    /// <returns>No content on success</returns>
    [HttpDelete("members/{memberId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveFromWaitlist(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Removing member {MemberId} from waitlist for event {EventId}",
                memberId, eventId);

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

            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            _logger.LogInformation("Member {MemberId} removed from waitlist for event {EventId}",
                memberId, eventId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for removing from waitlist: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing member {MemberId} from waitlist for event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while removing from the waitlist");
        }
    }

    /// <summary>
    /// Gets a member's waitlist status for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <returns>The member's waitlist status</returns>
    [HttpGet("members/{memberId}/status")]
    [ProducesResponseType(typeof(MemberWaitlistStatus), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMemberWaitlistStatus(
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

            var status = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);
            if (status == null)
            {
                return NotFound($"Member {memberId} is not on the waitlist for event {eventId}");
            }

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting waitlist status for member {MemberId} in event {EventId}",
                memberId, eventId);
            return StatusCode(500, "An error occurred while retrieving waitlist status");
        }
    }

    /// <summary>
    /// Updates a member's position in the waitlist
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="memberId">The ID of the member</param>
    /// <param name="newPosition">The new position in the waitlist</param>
    /// <returns>No content on success</returns>
    [HttpPut("members/{memberId}/position")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateWaitlistPosition(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int memberId,
        [FromBody] int newPosition)
    {
        try
        {
            _logger.LogInformation("Updating waitlist position for member {MemberId} to position {NewPosition}",
                memberId, newPosition);

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

            if (newPosition < 1)
            {
                return BadRequest("Position must be greater than 0");
            }

            await _waitlistService.UpdateWaitlistPositionAsync(eventId, memberId, newPosition);

            _logger.LogInformation("Waitlist position updated for member {MemberId} to position {NewPosition}",
                memberId, newPosition);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for updating waitlist position: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating waitlist position for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while updating waitlist position");
        }
    }

    /// <summary>
    /// Processes the waitlist when spots become available
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="availableSpots">Number of available spots</param>
    /// <returns>The processing result</returns>
    [HttpPost("process")]
    [ProducesResponseType(typeof(WaitlistProcessingResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ProcessWaitlist(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] int availableSpots)
    {
        try
        {
            _logger.LogInformation("Processing waitlist for event {EventId} with {AvailableSpots} spots",
                eventId, availableSpots);

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

            if (availableSpots < 1)
            {
                return BadRequest("Available spots must be greater than 0");
            }

            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            _logger.LogInformation("Waitlist processed for event {EventId}, promoted {PromotedCount} members",
                eventId, result.PromotedMembers.Count);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing waitlist for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while processing the waitlist");
        }
    }
}