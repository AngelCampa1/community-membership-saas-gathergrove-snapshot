using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API endpoints for managing location administrators and permissions
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1")]
public class LocationAdminsController : ControllerBase
{
    private readonly IHierarchicalPermissionsService _permissionsService;
    private readonly ILogger<LocationAdminsController> _logger;

    public LocationAdminsController(
        IHierarchicalPermissionsService permissionsService,
        ILogger<LocationAdminsController> logger)
    {
        _permissionsService = permissionsService;
        _logger = logger;
    }

    /// <summary>
    /// Assigns an admin to a location with specified permission level
    /// </summary>
    [HttpPost("locations/{locationId}/admins")]
    public async Task<ActionResult<LocationAdminResponse>> AssignLocationAdmin(
        int locationId,
        [FromBody] AssignLocationAdminRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var result = await _permissionsService.AssignLocationAdminAsync(locationId, userId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning admin to location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while assigning the admin" });
        }
    }

    /// <summary>
    /// Gets all admins for a location
    /// </summary>
    [HttpGet("locations/{locationId}/admins")]
    public async Task<ActionResult<List<LocationAdminResponse>>> GetLocationAdmins(int locationId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var admins = await _permissionsService.GetLocationAdminsAsync(locationId, userId);
            return Ok(admins);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admins for location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while retrieving admins" });
        }
    }

    /// <summary>
    /// Removes an admin from a location
    /// </summary>
    [HttpDelete("locations/{locationId}/admins/{userId}")]
    public async Task<ActionResult> RemoveLocationAdmin(int locationId, int userId)
    {
        try
        {
            var removingUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(removingUserIdClaim) || !int.TryParse(removingUserIdClaim, out int removingUserId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            await _permissionsService.RemoveLocationAdminAsync(locationId, userId, removingUserId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing admin {UserId} from location {LocationId}", userId, locationId);
            return StatusCode(500, new { message = "An error occurred while removing the admin" });
        }
    }

    /// <summary>
    /// Gets all location permissions for a user within a club
    /// </summary>
    [HttpGet("users/{userId}/clubs/{clubId}/location-permissions")]
    public async Task<ActionResult<List<LocationAdminResponse>>> GetUserLocationPermissions(int userId, int clubId)
    {
        try
        {
            var requestingUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(requestingUserIdClaim) || !int.TryParse(requestingUserIdClaim, out int requestingUserId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            // Only allow users to view their own permissions or allow club admins to view any user's permissions
            if (userId != requestingUserId)
            {
                // TODO: Add club admin check here
                // For now, return forbidden if trying to view another user's permissions
                return Forbid("You can only view your own location permissions");
            }

            var permissions = await _permissionsService.GetUserLocationPermissionsAsync(userId, clubId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location permissions for user {UserId} in club {ClubId}", userId, clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving location permissions" });
        }
    }
}

