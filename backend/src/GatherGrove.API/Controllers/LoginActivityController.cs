using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for login activity tracking and member engagement analytics
/// </summary>
[ApiController]
[Route("api/v1/analytics/login-activity")]
[Authorize]
public class LoginActivityController : ControllerBase
{
    private readonly ILoginActivityService _loginActivityService;
    private readonly ILogger<LoginActivityController> _logger;

    public LoginActivityController(
        ILoginActivityService loginActivityService,
        ILogger<LoginActivityController> logger)
    {
        _loginActivityService = loginActivityService;
        _logger = logger;
    }

    /// <summary>
    /// Get login activity statistics for a club (Unlimited tier only)
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="days">Number of days to analyze (default: 30)</param>
    /// <returns>Login activity statistics</returns>
    [HttpGet("stats/{clubId}")]
    [Authorize(Policy = "UnlimitedTierRequired")]
    public async Task<IActionResult> GetLoginStats(int clubId, [FromQuery] int days = 30)
    {
        try
        {
            var stats = await _loginActivityService.GetClubLoginStatsAsync(clubId, days);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get login stats for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get member login activity details (Unlimited tier only)
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="days">Number of days to analyze (default: 30)</param>
    /// <returns>Member login activity list</returns>
    [HttpGet("members/{clubId}")]
    [Authorize(Policy = "UnlimitedTierRequired")]
    public async Task<IActionResult> GetMemberLoginActivity(int clubId, [FromQuery] int days = 30)
    {
        try
        {
            var memberActivity = await _loginActivityService.GetMemberLoginActivityAsync(clubId, days);
            return Ok(memberActivity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get member login activity for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get inactive members at risk of churn (Unlimited tier only)
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="inactiveDays">Days of inactivity to consider at-risk (default: 30)</param>
    /// <returns>List of inactive members</returns>
    [HttpGet("inactive-members/{clubId}")]
    [Authorize(Policy = "UnlimitedTierRequired")]
    public async Task<IActionResult> GetInactiveMembers(int clubId, [FromQuery] int inactiveDays = 30)
    {
        try
        {
            var inactiveMembers = await _loginActivityService.GetInactiveMembersAsync(clubId, inactiveDays);
            return Ok(inactiveMembers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get inactive members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get login trends over time for visualization (Unlimited tier only)
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="days">Number of days to analyze (default: 90)</param>
    /// <returns>Login trends data</returns>
    [HttpGet("trends/{clubId}")]
    public async Task<IActionResult> GetLoginTrends(int clubId, [FromQuery] int days = 90)
    {
        try
        {
            var trends = await _loginActivityService.GetLoginTrendsAsync(clubId, days);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get login trends for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Trigger manual engagement score calculation for all members in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Success response</returns>
    [HttpPost("calculate-engagement-scores/{clubId}")]
    public async Task<IActionResult> CalculateEngagementScores(int clubId)
    {
        try
        {
            await _loginActivityService.UpdateMemberEngagementScoresAsync(clubId);
            return Ok(new { message = "Engagement scores calculation initiated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate engagement scores for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}