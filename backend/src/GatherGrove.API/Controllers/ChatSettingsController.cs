using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club chat settings
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/settings/chat")]
[Authorize]
public class ChatSettingsController : ControllerBase
{
    private readonly IChatSettingsService _chatSettingsService;
    private readonly ILogger<ChatSettingsController> _logger;

    public ChatSettingsController(
        IChatSettingsService chatSettingsService,
        ILogger<ChatSettingsController> logger)
    {
        _chatSettingsService = chatSettingsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Chat settings</returns>
    /// <response code="200">Returns the chat settings</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet]
    [ProducesResponseType(typeof(ChatSettingsResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ChatSettingsResponse>> GetChatSettings(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting chat settings for club {ClubId} by user {UserId}", clubId, userId);

            var settings = await _chatSettingsService.GetChatSettingsAsync(clubId, userId);
            return Ok(settings);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to chat settings for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat settings for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving chat settings" });
        }
    }

    /// <summary>
    /// Updates the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The updated chat settings</param>
    /// <returns>Updated chat settings</returns>
    /// <response code="200">Chat settings updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPut]
    [ProducesResponseType(typeof(ChatSettingsResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ChatSettingsResponse>> UpdateChatSettings(
        int clubId,
        [FromBody] UpdateChatSettingsRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Updating chat settings for club {ClubId} by user {UserId}", clubId, userId);

            var settings = await _chatSettingsService.UpdateChatSettingsAsync(clubId, userId, request);
            return Ok(settings);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid chat settings update for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to chat settings for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating chat settings for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while updating chat settings" });
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