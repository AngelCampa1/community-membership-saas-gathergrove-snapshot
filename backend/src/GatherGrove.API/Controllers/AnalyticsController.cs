using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for general analytics and feature usage tracking
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IFeatureUsageAnalyticsService _featureAnalyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IFeatureUsageAnalyticsService featureAnalyticsService,
        ILogger<AnalyticsController> logger)
    {
        _featureAnalyticsService = featureAnalyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Track feature usage event
    /// </summary>
    /// <param name="request">Feature usage tracking request</param>
    /// <returns>Tracking confirmation</returns>
    [HttpPost("track-feature")]
    [Authorize(Policy = "ClubMember")]
    public async Task<IActionResult> TrackFeatureUsage([FromBody] TrackFeatureUsageRequest request)
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Unable to determine user identity");
            }

            await _featureAnalyticsService.TrackFeatureUsageAsync(
                request.ClubId,
                userId,
                request.FeatureName,
                request.Platform,
                request.SessionId);

            return Ok(new { Success = true, Message = "Feature usage tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking feature usage for feature {FeatureName}", request.FeatureName);
            return StatusCode(500, "An error occurred while tracking feature usage");
        }
    }

    /// <summary>
    /// Get feature usage analytics for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze (default: 30)</param>
    /// <param name="daysBack">Number of days to analyze (default: 30)</param>
    /// <returns>Feature usage analytics data</returns>
    [HttpGet("feature-usage/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetFeatureUsageAnalytics(
        int clubId,
        [FromQuery] int daysBack = 30)
    {
        try
        {
            var analytics = await _featureAnalyticsService.GetFeatureUsageAnalyticsAsync(clubId, daysBack);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving feature usage analytics for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving feature usage analytics");
        }
    }

    /// <summary>
    /// Get member engagement analytics for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Member engagement analytics data</returns>
    [HttpGet("member-engagement/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetMemberEngagementAnalytics(int clubId)
    {
        try
        {
            var analytics = await _featureAnalyticsService.GetMemberEngagementAnalyticsAsync(clubId);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving member engagement analytics for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving member engagement analytics");
        }
    }

    /// <summary>
    /// Get top used features for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="limit">Number of top features to return (default: 10)</param>
    /// <returns>Top features list</returns>
    [HttpGet("top-features/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetTopFeatures(
        int clubId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var topFeatures = await _featureAnalyticsService.GetTopFeaturesAsync(clubId, limit);
            return Ok(topFeatures);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top features for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving top features");
        }
    }

    /// <summary>
    /// Get platform usage comparison (web vs mobile)
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze (default: 30)</param>
    /// <returns>Platform usage comparison data</returns>
    [HttpGet("platform-usage/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetPlatformUsageComparison(
        int clubId,
        [FromQuery] int daysBack = 30)
    {
        try
        {
            var platformData = await _featureAnalyticsService.GetPlatformUsageComparisonAsync(clubId, daysBack);
            return Ok(platformData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving platform usage comparison for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving platform usage comparison");
        }
    }


    /// <summary>
    /// Get low engagement members for targeted outreach
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="scoreThreshold">Engagement score threshold (default: 40)</param>
    /// <returns>List of low engagement members</returns>
    [HttpGet("low-engagement/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetLowEngagementMembers(
        int clubId,
        [FromQuery] int scoreThreshold = 40)
    {
        try
        {
            var lowEngagementMembers = await _featureAnalyticsService.GetLowEngagementMembersAsync(clubId, scoreThreshold);
            return Ok(lowEngagementMembers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving low engagement members for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving low engagement members");
        }
    }

    /// <summary>
    /// Calculate and update engagement scores for all members in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Calculation results</returns>
    [HttpPost("calculate-engagement/{clubId}")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> CalculateMemberEngagementScores(int clubId)
    {
        try
        {
            var success = await _featureAnalyticsService.CalculateMemberEngagementScoresAsync(clubId);
            return Ok(new
            {
                Message = "Engagement scores calculated successfully",
                Success = success
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement scores for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while calculating engagement scores");
        }
    }

    /// <summary>
    /// Tracks blocked feature attempts for analytics
    /// This helps understand which features users want but cannot access
    /// </summary>
    /// <param name="request">Blocked feature tracking request</param>
    /// <returns>Tracking confirmation</returns>
    [HttpPost("blocked-feature")]
    public IActionResult TrackBlockedFeature([FromBody] TrackBlockedFeatureRequest request)
    {
        try
        {
            // Log for analytics purposes - this is a fire-and-forget tracking endpoint
            _logger.LogInformation(
                "Blocked feature access: Club {ClubId}, Feature {Feature}, CurrentTier {CurrentTier}, RequiredTier {RequiredTier}",
                request.ClubId,
                request.Feature,
                request.CurrentTier,
                request.RequiredTier);

            return Ok(new { Success = true, Message = "Blocked feature tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking blocked feature for club {ClubId}", request.ClubId);
            // Return success even on error - this is just analytics tracking
            return Ok(new { Success = false, Message = "Error tracking blocked feature" });
        }
    }
}

/// <summary>
/// Request model for tracking feature usage
/// </summary>
