using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club administrators and invitations
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/admins")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all administrators for a specific club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of club administrators</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ClubAdminResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<IEnumerable<ClubAdminResponse>>> GetClubAdmins(int clubId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("Getting administrators for club {ClubId} by user {UserId}", clubId, currentUserId);

            var admins = await _adminService.GetClubAdminsAsync(clubId, currentUserId);
            return Ok(admins);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting administrators for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving administrators" });
        }
    }

    /// <summary>
    /// Creates a new administrator invitation for a club (Grow tier only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The invitation request details</param>
    /// <returns>The created invitation details</returns>
    [HttpPost("invites")]
    [ProducesResponseType(typeof(AdminInviteResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<AdminInviteResponse>> CreateAdminInvite(int clubId, [FromBody] CreateAdminInviteRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("Creating admin invitation for club {ClubId} by user {UserId} to email {Email}",
                clubId, currentUserId, request.Email);

            var invitation = await _adminService.CreateAdminInviteAsync(clubId, currentUserId, request);
            return CreatedAtAction(nameof(GetPendingInvites), new { clubId }, invitation);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when creating admin invitation for club {ClubId}", clubId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating admin invitation for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while creating the invitation" });
        }
    }

    /// <summary>
    /// Gets all pending invitations for a specific club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of pending invitations</returns>
    [HttpGet("invites")]
    [ProducesResponseType(typeof(IEnumerable<AdminInviteResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<IEnumerable<AdminInviteResponse>>> GetPendingInvites(int clubId)
    {
        try
        {
            _logger.LogInformation("Getting pending invitations for club {ClubId}", clubId);

            var invitations = await _adminService.GetPendingInvitesAsync(clubId);
            return Ok(invitations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending invitations for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving invitations" });
        }
    }

    /// <summary>
    /// Cancels a pending invitation
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="inviteId">The invitation ID to cancel</param>
    /// <returns>Success status</returns>
    [HttpDelete("invites/{inviteId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult> CancelInvite(int clubId, int inviteId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("Cancelling invitation {InviteId} for club {ClubId} by user {UserId}",
                inviteId, clubId, currentUserId);

            var success = await _adminService.CancelInviteAsync(clubId, inviteId, currentUserId);

            if (!success)
            {
                return NotFound(new { message = "Invitation not found" });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when cancelling invitation {InviteId} for club {ClubId}", inviteId, clubId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling invitation {InviteId} for club {ClubId}", inviteId, clubId);
            return StatusCode(500, new { message = "An error occurred while cancelling the invitation" });
        }
    }

    /// <summary>
    /// Removes an administrator from a club (Grow tier only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userIdToRemove">The user ID to remove as admin</param>
    /// <returns>Success status</returns>
    [HttpDelete("{userIdToRemove}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult> RemoveAdmin(int clubId, int userIdToRemove)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation("Removing admin {UserIdToRemove} from club {ClubId} by user {CurrentUserId}",
                userIdToRemove, clubId, currentUserId);

            var success = await _adminService.RemoveAdminAsync(clubId, userIdToRemove, currentUserId);

            if (!success)
            {
                return NotFound(new { message = "Administrator not found" });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when removing admin {UserIdToRemove} from club {ClubId}", userIdToRemove, clubId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing admin {UserIdToRemove} from club {ClubId}", userIdToRemove, clubId);
            return StatusCode(500, new { message = "An error occurred while removing the administrator" });
        }
    }

    /// <summary>
    /// Gets the current user ID from the JWT token
    /// </summary>
    /// <returns>Current user ID</returns>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }
}