using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for dashboard operations and statistics
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId:int}/dashboard")]
[Authorize]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Gets dashboard summary statistics for a club
    /// </summary>
    /// <remarks>
    /// Returns key dashboard metrics including member count, dues collected this year,
    /// upcoming events count, and tier information. This data is used to populate the
    /// main dashboard view with statistics and contextual upgrade prompts.
    /// 
    /// Requires 'Admin' role and ownership of the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get dashboard summary for.</param>
    /// <response code="200">Returns the dashboard summary with current stats and tier info.</response>
    /// <response code="401">If the request lacks a valid JWT.</response>
    /// <response code="403">If the user is not an admin for the specified club.</response>
    /// <response code="404">If the specified club does not exist.</response>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<IActionResult> GetDashboardSummary([FromRoute] int clubId)
    {
        try
        {
            // Get the current user ID from the JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid or missing user ID claim in JWT");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid user authentication.",
                    Status = 401
                });
            }

            _logger.LogInformation("Getting dashboard summary for club {ClubId} by user {UserId}", clubId, userId);

            // Verify club ownership - user must own the club they're requesting data for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to access club {ClubId} but owns club {UserClubId}",
                    userId, clubId, userClubId);
                return Forbid();
            }

            var summary = await _dashboardService.GetDashboardSummaryAsync(clubId);

            _logger.LogInformation("Dashboard summary retrieved successfully for club {ClubId}", clubId);

            return Ok(summary);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new ProblemDetails
            {
                Title = "Club Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid argument for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = ex.Message,
                Status = 400
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard summary for club {ClubId}", clubId);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Dashboard Error",
                Detail = "An unexpected error occurred while retrieving dashboard data.",
                Status = 500
            });
        }
    }
}