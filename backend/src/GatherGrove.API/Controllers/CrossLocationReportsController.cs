using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API endpoints for cross-location reporting and analytics
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/clubs/{clubId}/reports")]
public class CrossLocationReportsController : ControllerBase
{
    private readonly ICrossLocationReportingService _reportingService;
    private readonly ILogger<CrossLocationReportsController> _logger;

    public CrossLocationReportsController(
        ICrossLocationReportingService reportingService,
        ILogger<CrossLocationReportsController> logger)
    {
        _reportingService = reportingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets consolidated dashboard showing all locations for a club
    /// </summary>
    [HttpGet("consolidated-dashboard")]
    public async Task<ActionResult<ConsolidatedDashboardResponse>> GetConsolidatedDashboard(int clubId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var dashboard = await _reportingService.GetConsolidatedDashboardAsync(clubId, userId);
            return Ok(dashboard);
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
            _logger.LogError(ex, "Error getting consolidated dashboard for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving the consolidated dashboard" });
        }
    }
}

