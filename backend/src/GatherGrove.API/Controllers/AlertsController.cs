using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using GatherGrove.Application.Services.Alerts;
using GatherGrove.Application.DTOs.Alerts;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club alert configurations
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/alerts")]
[Authorize(Policy = "AdminOnly")]
public class AlertsController : ControllerBase
{
    private readonly IAlertConfigService _alertConfigService;
    private readonly ILogger<AlertsController> _logger;

    public AlertsController(
        IAlertConfigService alertConfigService,
        ILogger<AlertsController> logger)
    {
        _alertConfigService = alertConfigService;
        _logger = logger;
    }

    /// <summary>
    /// Gets alert configuration for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <returns>Club alert configuration</returns>
    [HttpGet("config")]
    [ProducesResponseType(typeof(AlertConfigResponse), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<AlertConfigResponse>> GetAlertConfig(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting alert configuration for club {ClubId} by user {UserId}", clubId, userId);

            var config = await _alertConfigService.GetAlertConfigAsync(clubId, userId);
            return Ok(config);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to alert config for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to this club's alert configuration");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogInformation("Alert config not found for club {ClubId}: {Message}", clubId, ex.Message);
            return NotFound("Alert configuration not found for this club");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert configuration for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving alert configuration");
        }
    }

    /// <summary>
    /// Creates new alert configuration for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="request">Alert configuration to create</param>
    /// <returns>Created alert configuration</returns>
    [HttpPost("config")]
    [ProducesResponseType(typeof(AlertConfigResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<AlertConfigResponse>> CreateAlertConfig(
        int clubId,
        [FromBody] CreateAlertConfigRequest? request)
    {
        try
        {
            if (request == null)
            {
                _logger.LogWarning("Null request received for create alert config in club {ClubId}", clubId);
                return BadRequest("Alert configuration request cannot be null");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for create alert config in club {ClubId}", clubId);
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Creating alert configuration for club {ClubId} by user {UserId}", clubId, userId);

            var config = await _alertConfigService.CreateAlertConfigAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetAlertConfig), new { clubId }, config);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to create alert config for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to create alert configuration for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for creating alert config in club {ClubId}: {Message}", clubId, ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating alert configuration for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while creating alert configuration");
        }
    }

    /// <summary>
    /// Updates existing alert configuration for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="request">Alert configuration to update</param>
    /// <returns>Updated alert configuration</returns>
    [HttpPut("config")]
    [ProducesResponseType(typeof(AlertConfigResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<AlertConfigResponse>> UpdateAlertConfig(
        int clubId,
        [FromBody] UpdateAlertConfigRequest? request)
    {
        try
        {
            if (request == null)
            {
                _logger.LogWarning("Null request received for update alert config in club {ClubId}", clubId);
                return BadRequest("Alert configuration request cannot be null");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for update alert config in club {ClubId}", clubId);
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Updating alert configuration for club {ClubId} by user {UserId}", clubId, userId);

            var config = await _alertConfigService.UpdateAlertConfigAsync(clubId, userId, request);
            return Ok(config);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to update alert config for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to update alert configuration for this club");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogInformation("Alert config not found for update in club {ClubId}: {Message}", clubId, ex.Message);
            return NotFound("Alert configuration not found for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for updating alert config in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating alert configuration for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while updating alert configuration");
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user authentication");
        }
        return userId;
    }
}
