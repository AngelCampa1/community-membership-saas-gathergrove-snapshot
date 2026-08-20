using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club directory settings
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/settings/directory")]
[Authorize]
public class DirectorySettingsController : ControllerBase
{
    private readonly IDirectorySettingsService _directorySettingsService;
    private readonly ILogger<DirectorySettingsController> _logger;

    public DirectorySettingsController(
        IDirectorySettingsService directorySettingsService,
        ILogger<DirectorySettingsController> logger)
    {
        _directorySettingsService = directorySettingsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Directory settings</returns>
    /// <response code="200">Returns the directory settings</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet]
    [ProducesResponseType(typeof(DirectorySettingsResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<DirectorySettingsResponse>> GetDirectorySettings(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting directory settings for club {ClubId} by user {UserId}", clubId, userId);

            var settings = await _directorySettingsService.GetDirectorySettingsAsync(clubId, userId);
            return Ok(settings);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to directory settings for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting directory settings for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving directory settings" });
        }
    }

    /// <summary>
    /// Updates the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The updated directory settings</param>
    /// <returns>Updated directory settings</returns>
    /// <response code="200">Directory settings updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPut]
    [ProducesResponseType(typeof(DirectorySettingsResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<DirectorySettingsResponse>> UpdateDirectorySettings(
        int clubId,
        [FromBody] UpdateDirectorySettingsRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Updating directory settings for club {ClubId} by user {UserId}", clubId, userId);

            var settings = await _directorySettingsService.UpdateDirectorySettingsAsync(clubId, userId, request);
            return Ok(settings);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid directory settings update for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to directory settings for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating directory settings for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while updating directory settings" });
        }
    }

    /// <summary>
    /// Gets the current user ID from JWT claims
    /// </summary>
    /// <returns>User ID</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if user ID cannot be determined</exception>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token");
        }
        return userId;
    }
}