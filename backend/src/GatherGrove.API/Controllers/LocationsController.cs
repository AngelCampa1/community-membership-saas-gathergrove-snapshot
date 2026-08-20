using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API endpoints for managing club locations
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1")]
public class LocationsController : ControllerBase
{
    private readonly ILocationManagementService _locationManagementService;
    private readonly ILogger<LocationsController> _logger;

    public LocationsController(
        ILocationManagementService locationManagementService,
        ILogger<LocationsController> logger)
    {
        _locationManagementService = locationManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new location for a club (Unlimited tier only)
    /// </summary>
    [HttpPost("clubs/{clubId}/locations")]
    public async Task<ActionResult<LocationResponse>> CreateLocation(int clubId, [FromBody] CreateLocationRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var location = await _locationManagementService.CreateLocationAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetLocation), new { locationId = location.Id }, location);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating location for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while creating the location" });
        }
    }

    /// <summary>
    /// Gets all locations for a club
    /// </summary>
    [HttpGet("clubs/{clubId}/locations")]
    public async Task<ActionResult<List<LocationResponse>>> GetClubLocations(int clubId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var locations = await _locationManagementService.GetClubLocationsAsync(clubId, userId);
            return Ok(locations);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving locations" });
        }
    }

    /// <summary>
    /// Gets a single location by ID
    /// </summary>
    [HttpGet("locations/{locationId}")]
    public async Task<ActionResult<LocationResponse>> GetLocation(int locationId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var location = await _locationManagementService.GetLocationAsync(locationId, userId);
            return Ok(location);
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
            _logger.LogError(ex, "Error getting location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while retrieving the location" });
        }
    }

    /// <summary>
    /// Updates an existing location
    /// </summary>
    [HttpPut("locations/{locationId}")]
    public async Task<ActionResult<LocationResponse>> UpdateLocation(int locationId, [FromBody] UpdateLocationRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var location = await _locationManagementService.UpdateLocationAsync(locationId, userId, request);
            return Ok(location);
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
            _logger.LogError(ex, "Error updating location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while updating the location" });
        }
    }

    /// <summary>
    /// Deactivates a location (soft delete)
    /// </summary>
    [HttpDelete("locations/{locationId}")]
    public async Task<ActionResult> DeactivateLocation(int locationId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            await _locationManagementService.DeactivateLocationAsync(locationId, userId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while deactivating the location" });
        }
    }

    /// <summary>
    /// Gets detailed statistics for a location
    /// </summary>
    [HttpGet("locations/{locationId}/stats")]
    public async Task<ActionResult<LocationResponse>> GetLocationStats(int locationId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var stats = await _locationManagementService.GetLocationStatsAsync(locationId, userId);
            return Ok(stats);
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
            _logger.LogError(ex, "Error getting stats for location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while retrieving location statistics" });
        }
    }
}

