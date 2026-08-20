using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for segment analytics and reporting (Unlimited tier feature)
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/segment-analytics")]
public class SegmentAnalyticsController : ControllerBase
{
    private readonly ISegmentAnalyticsService _segmentAnalyticsService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<SegmentAnalyticsController> _logger;

    public SegmentAnalyticsController(
        ISegmentAnalyticsService segmentAnalyticsService,
        IClubAuthorizationService authService,
        ILogger<SegmentAnalyticsController> logger)
    {
        _segmentAnalyticsService = segmentAnalyticsService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets segment analytics dashboard data
    /// </summary>
    /// <remarks>
    /// Retrieves comprehensive analytics data for all segments in the club.
    /// Includes segment sizes, growth trends, and performance metrics.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get analytics for</param>
    /// <param name="daysBack">Number of days to include in trend analysis (default: 30)</param>
    /// <response code="200">Returns the segment analytics dashboard data</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("dashboard")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentAnalyticsDashboard), 200)]
    public async Task<IActionResult> GetSegmentAnalyticsDashboard([FromRoute] int clubId, [FromQuery] int daysBack = 30)
    {
        try
        {
            _logger.LogInformation("Getting segment analytics dashboard for club {ClubId}, {DaysBack} days",
                clubId, daysBack);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var dashboardData = await _segmentAnalyticsService.GetSegmentAnalyticsDashboardAsync(clubId, userId.Value, daysBack);

            _logger.LogInformation("Retrieved segment analytics dashboard for club {ClubId}", clubId);

            return Ok(dashboardData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting segment analytics dashboard for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving segment analytics." });
        }
    }

    /// <summary>
    /// Gets detailed analytics for a specific segment
    /// </summary>
    /// <remarks>
    /// Retrieves comprehensive analytics data for a specific member segment.
    /// Includes member distribution, engagement metrics, trends, and insights.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentId">The ID of the segment to analyze</param>
    /// <param name="daysBack">Number of days to include in trend analysis (default: 30)</param>
    /// <param name="includeMembers">Include detailed member list in response (default: false)</param>
    /// <response code="200">Returns the detailed segment analytics</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpGet("segments/{segmentId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(DetailedSegmentAnalytics), 200)]
    public async Task<IActionResult> GetSegmentAnalytics([FromRoute] int clubId, [FromRoute] int segmentId,
        [FromQuery] int daysBack = 30, [FromQuery] bool includeMembers = false)
    {
        try
        {
            _logger.LogInformation("Getting analytics for segment {SegmentId} in club {ClubId}, {DaysBack} days",
                segmentId, clubId, daysBack);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var segmentAnalytics = await _segmentAnalyticsService.GetSegmentAnalyticsAsync(
                clubId, segmentId, userId.Value, daysBack, includeMembers);

            if (segmentAnalytics == null)
            {
                return NotFound(new { message = "Segment not found" });
            }

            _logger.LogInformation("Retrieved analytics for segment {SegmentId}", segmentId);

            return Ok(segmentAnalytics);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get analytics for segment {SegmentId} in club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting analytics for segment {SegmentId} in club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving segment analytics." });
        }
    }

    /// <summary>
    /// Compares multiple segments
    /// </summary>
    /// <remarks>
    /// Provides comparative analytics between multiple member segments.
    /// Includes side-by-side metrics, growth trends, and performance comparisons.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The segment comparison request</param>
    /// <response code="200">Returns the segment comparison results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("compare")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentComparisonResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CompareSegments([FromRoute] int clubId, [FromBody] SegmentComparisonRequest request)
    {
        try
        {
            _logger.LogInformation("Comparing {SegmentCount} segments for club {ClubId}",
                request.SegmentIds?.Count ?? 0, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the clubId in the request
            request.ClubId = clubId;

            var comparisonResult = await _segmentAnalyticsService.CompareSegmentsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Segment comparison completed for club {ClubId}", clubId);

            return Ok(comparisonResult);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to compare segments for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error comparing segments for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while comparing segments." });
        }
    }

    /// <summary>
    /// Gets engagement trends for segments
    /// </summary>
    /// <remarks>
    /// Retrieves engagement trends and patterns for member segments over time.
    /// Includes event attendance, activity levels, and participation metrics.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The engagement trends request</param>
    /// <response code="200">Returns the segment engagement trends</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("engagement-trends")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentEngagementTrends), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> GetSegmentEngagementTrends([FromRoute] int clubId, [FromBody] SegmentEngagementTrendsRequest request)
    {
        try
        {
            _logger.LogInformation("Getting engagement trends for segments in club {ClubId}, {DaysBack} days",
                clubId, request.DaysBack);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the clubId in the request
            request.ClubId = clubId;

            var engagementTrends = await _segmentAnalyticsService.GetSegmentEngagementTrendsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Retrieved engagement trends for segments in club {ClubId}", clubId);

            return Ok(engagementTrends);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get segment engagement trends for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting segment engagement trends for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving engagement trends." });
        }
    }

    /// <summary>
    /// Gets member growth and churn analysis by segments
    /// </summary>
    /// <remarks>
    /// Analyzes member growth, retention, and churn patterns across segments.
    /// Includes cohort analysis, retention rates, and predictive insights.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The growth analysis request</param>
    /// <response code="200">Returns the segment growth and churn analysis</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("growth-analysis")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentGrowthAnalysis), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> GetSegmentGrowthAnalysis([FromRoute] int clubId, [FromBody] SegmentGrowthAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Getting growth analysis for segments in club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the clubId in the request
            request.ClubId = clubId;

            var growthAnalysis = await _segmentAnalyticsService.GetSegmentGrowthAnalysisAsync(clubId, userId.Value, request);

            _logger.LogInformation("Retrieved growth analysis for segments in club {ClubId}", clubId);

            return Ok(growthAnalysis);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get segment growth analysis for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting segment growth analysis for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving growth analysis." });
        }
    }

    /// <summary>
    /// Gets segment performance metrics and KPIs
    /// </summary>
    /// <remarks>
    /// Retrieves key performance indicators and metrics for member segments.
    /// Includes conversion rates, lifetime value, and segment health scores.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentIds">List of segment IDs to analyze (optional, analyzes all if not provided)</param>
    /// <param name="includeProjections">Include future projections in metrics (default: false)</param>
    /// <response code="200">Returns the segment performance metrics</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("performance-metrics")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentPerformanceMetrics), 200)]
    public async Task<IActionResult> GetSegmentPerformanceMetrics([FromRoute] int clubId,
        [FromQuery] List<int>? segmentIds = null, [FromQuery] bool includeProjections = false)
    {
        try
        {
            _logger.LogInformation("Getting performance metrics for segments in club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var performanceMetrics = await _segmentAnalyticsService.GetSegmentPerformanceMetricsAsync(
                clubId, userId.Value, segmentIds, includeProjections);

            _logger.LogInformation("Retrieved performance metrics for segments in club {ClubId}", clubId);

            return Ok(performanceMetrics);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get segment performance metrics for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting segment performance metrics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving performance metrics." });
        }
    }

    /// <summary>
    /// Exports segment analytics data
    /// </summary>
    /// <remarks>
    /// Exports comprehensive segment analytics data to various formats (CSV, Excel, PDF).
    /// Includes all available metrics, trends, and insights for the specified segments.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The export request details</param>
    /// <response code="200">Returns the export file or download link</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("export")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(AnalyticsExportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> ExportSegmentAnalytics([FromRoute] int clubId, [FromBody] AnalyticsExportRequest request)
    {
        try
        {
            _logger.LogInformation("Exporting segment analytics for club {ClubId} in {Format} format",
                clubId, request.ExportFormat);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the clubId in the request
            request.ClubId = clubId;

            var exportResult = await _segmentAnalyticsService.ExportSegmentAnalyticsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Segment analytics export completed for club {ClubId}", clubId);

            return Ok(exportResult);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to export segment analytics for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error exporting segment analytics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while exporting analytics data." });
        }
    }

    /// <summary>
    /// Gets actionable insights and recommendations for segments
    /// </summary>
    /// <remarks>
    /// Analyzes segment data and provides AI-powered insights and actionable recommendations.
    /// Includes optimization suggestions, targeting recommendations, and growth strategies.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentId">Optional specific segment ID to analyze (analyzes all if not provided)</param>
    /// <param name="focusArea">Optional focus area for insights (engagement, growth, retention, etc.)</param>
    /// <response code="200">Returns the segment insights and recommendations</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("insights")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentInsightsResponse), 200)]
    public async Task<IActionResult> GetSegmentInsights([FromRoute] int clubId,
        [FromQuery] int? segmentId = null, [FromQuery] string? focusArea = null)
    {
        try
        {
            _logger.LogInformation("Getting insights for segments in club {ClubId}, focus: {FocusArea}",
                clubId, focusArea ?? "general");

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var insights = await _segmentAnalyticsService.GetSegmentInsightsAsync(clubId, userId.Value, segmentId, focusArea);

            _logger.LogInformation("Retrieved {InsightCount} insights for club {ClubId}",
                insights.Insights?.Count ?? 0, clubId);

            return Ok(insights);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get segment insights for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting segment insights for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving segment insights." });
        }
    }
}