using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API endpoints for managing location-specific branding
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/locations/{locationId}/branding")]
public class LocationBrandingController : ControllerBase
{
    private readonly ILocationBrandingService _brandingService;
    private readonly ILogger<LocationBrandingController> _logger;

    public LocationBrandingController(
        ILocationBrandingService brandingService,
        ILogger<LocationBrandingController> logger)
    {
        _brandingService = brandingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets branding for a location
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<LocationBrandingResponse>> GetLocationBranding(int locationId)
    {
        try
        {
            var branding = await _brandingService.GetLocationBrandingAsync(locationId);
            return Ok(branding);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branding for location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while retrieving location branding" });
        }
    }

    /// <summary>
    /// Updates branding for a location
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<LocationBrandingResponse>> UpdateLocationBranding(
        int locationId,
        [FromBody] UpdateLocationBrandingRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var branding = await _brandingService.UpdateLocationBrandingAsync(locationId, userId, request);
            return Ok(branding);
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
            _logger.LogError(ex, "Error updating branding for location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while updating location branding" });
        }
    }
}

