using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for member directory settings (Story 29)
/// </summary>
[ApiController]
[Route("api/v1/users/me")]
[Produces("application/json")]
[Authorize(Policy = "MemberOnly")] // Members only
public class UserDirectorySettingsController : ControllerBase
{
    private readonly IMemberDirectorySettingsService _memberDirectorySettingsService;
    private readonly ILogger<UserDirectorySettingsController> _logger;

    public UserDirectorySettingsController(
        IMemberDirectorySettingsService memberDirectorySettingsService,
        ILogger<UserDirectorySettingsController> logger)
    {
        _memberDirectorySettingsService = memberDirectorySettingsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the directory settings for the current member
    /// </summary>
    /// <remarks>
    /// Returns the member's current directory privacy settings, including whether the club directory is enabled,
    /// which fields the admin allows to be shared, and the member's current opt-in status and visible fields.
    /// </remarks>
    /// <response code="200">Returns the member's directory settings</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not a member</response>
    /// <response code="404">If the member record is not found</response>
    [HttpGet("directory-settings")]
    [ProducesResponseType(typeof(MemberDirectorySettingsResponse), 200)]
    public async Task<IActionResult> GetDirectorySettings()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid user ID claim for directory settings request");
                return Unauthorized("Invalid authentication token");
            }

            _logger.LogInformation("Getting directory settings for user {UserId}", userId);

            var settings = await _memberDirectorySettingsService.GetMemberDirectorySettingsAsync(userId);
            return Ok(settings);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("User not found for directory settings request: {Error}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Member record not found for directory settings request: {Error}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting directory settings");
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving directory settings." });
        }
    }

    /// <summary>
    /// Updates the directory settings for the current member
    /// </summary>
    /// <remarks>
    /// Updates the member's directory privacy settings, allowing them to opt-in/out of the directory
    /// and choose which admin-allowed fields are visible. The member can only make visible fields 
    /// that the admin has configured as sharable.
    /// </remarks>
    /// <param name="request">The updated directory settings</param>
    /// <response code="200">Returns the updated directory settings</response>
    /// <response code="400">If the request is invalid or contains disallowed fields</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not a member or directory is disabled</response>
    /// <response code="404">If the member record is not found</response>
    [HttpPut("directory-settings")]
    [ProducesResponseType(typeof(MemberDirectorySettingsResponse), 200)]
    public async Task<IActionResult> UpdateDirectorySettings([FromBody] UpdateMemberDirectorySettingsRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid user ID claim for directory settings update");
                return Unauthorized("Invalid authentication token");
            }

            _logger.LogInformation("Updating directory settings for user {UserId}", userId);

            var updatedSettings = await _memberDirectorySettingsService.UpdateMemberDirectorySettingsAsync(userId, request);
            return Ok(updatedSettings);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for directory settings update: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Operation not allowed for directory settings update: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating directory settings");
            return StatusCode(500, new { message = "An unexpected error occurred while updating directory settings." });
        }
    }
}