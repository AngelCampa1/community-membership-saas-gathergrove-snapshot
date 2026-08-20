using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for event engagement analytics functionality
/// </summary>
[ApiController]
[Route("api/analytics/events")]
[Authorize]
public class EventEngagementAnalyticsController : ControllerBase
{
    private readonly IEventEngagementAnalyticsService _analyticsService;
    private readonly IClubAuthorizationService _clubAuthorizationService;
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventEngagementAnalyticsController> _logger;

    public EventEngagementAnalyticsController(
        IEventEngagementAnalyticsService analyticsService,
        IClubAuthorizationService clubAuthorizationService,
        GatherGroveDbContext context,
        ILogger<EventEngagementAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _clubAuthorizationService = clubAuthorizationService;
        _context = context;
        _logger = logger;
    }

    private async Task<(IActionResult? Error, int? ClubId)> AuthorizeEventAccessAsync(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return (Unauthorized(), null);

        var eventClubId = await _context.Events
            .Where(e => e.Id == eventId)
            .Select(e => (int?)e.ClubId)
            .FirstOrDefaultAsync();

        if (!eventClubId.HasValue)
            return (NotFound(new { message = "Event not found" }), null);

        if (!await _clubAuthorizationService.ValidateClubAccessAsync(eventClubId.Value, userId))
            return (Forbid(), null);

        return (null, eventClubId.Value);
    }

    /// <summary>
    /// Get comprehensive event engagement analytics for a club
    /// </summary>
    [HttpGet("club/{clubId}")]
    public async Task<IActionResult> GetEventEngagementAnalytics(
        int clubId,
        DateTime startDate,
        DateTime endDate)
    {
        try
        {
            // Validate input parameters
            if (clubId <= 0)
                return BadRequest("Club ID must be greater than 0");

            if (startDate >= endDate)
                return BadRequest("Start date must be before end date");

            // Get current user ID
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            // Check authorization
            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            // Build analytics query
            var query = new EventEngagementAnalyticsQuery
            {
                ClubId = clubId,
                StartDate = startDate,
                EndDate = endDate
            };

            var analytics = await _analyticsService.GetEventEngagementAnalyticsReportAsync(query, userId);
            return Ok(analytics);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement analytics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving analytics" });
        }
    }

    /// <summary>
    /// Get engagement trends for a club
    /// </summary>
    [HttpGet("club/{clubId}/trends")]
    public async Task<IActionResult> GetEngagementTrends(int clubId, int daysBack = 30)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest("Club ID must be greater than 0");

            if (daysBack <= 0 || daysBack > 365)
                return BadRequest("Days back must be between 1 and 365");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            // Get engagement trends from service
            var trends = await _analyticsService.CalculateEngagementTrendsAsync(clubId, userId, daysBack);

            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting engagement trends for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving trends" });
        }
    }

    /// <summary>
    /// Get member engagement insights
    /// </summary>
    [HttpGet("club/{clubId}/member/{memberId}/insights")]
    public async Task<IActionResult> GetMemberEngagementInsights(int clubId, int memberId, int periodDays = 90)
    {
        try
        {
            if (clubId <= 0 || memberId <= 0)
                return BadRequest("Club ID and Member ID must be greater than 0");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            // Get member engagement insights from service
            var insights = await _analyticsService.GetMemberEngagementInsightsAsync(clubId, memberId, userId, periodDays);

            return Ok(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member engagement insights for member {MemberId}", memberId);
            return StatusCode(500, new { message = "An error occurred while retrieving insights" });
        }
    }

    /// <summary>
    /// Get event recommendations for a member
    /// </summary>
    [HttpGet("club/{clubId}/member/{memberId}/recommendations")]
    public async Task<IActionResult> GetEventRecommendations(int clubId, int memberId, int maxRecommendations = 5)
    {
        try
        {
            if (clubId <= 0 || memberId <= 0)
                return BadRequest("Club ID and Member ID must be greater than 0");

            if (maxRecommendations <= 0 || maxRecommendations > 20)
                return BadRequest("Max recommendations must be between 1 and 20");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            var recommendations = await _analyticsService.GenerateEventRecommendationsAsync(clubId, memberId, maxRecommendations);
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event recommendations for member {MemberId}", memberId);
            return StatusCode(500, new { message = "An error occurred while retrieving recommendations" });
        }
    }

    /// <summary>
    /// Analyze event performance
    /// </summary>
    [HttpGet("event/{eventId}/performance")]
    public async Task<IActionResult> AnalyzeEventPerformance(int eventId)
    {
        try
        {
            if (eventId <= 0)
                return BadRequest("Event ID must be greater than 0");

            var authorization = await AuthorizeEventAccessAsync(eventId);
            if (authorization.Error != null)
                return authorization.Error;

            var analysis = await _analyticsService.AnalyzeEventPerformanceAsync(eventId);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing event performance for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while analyzing event performance" });
        }
    }

    /// <summary>
    /// Get engagement benchmarks for a club
    /// </summary>
    [HttpGet("club/{clubId}/benchmarks")]
    public async Task<IActionResult> GetEngagementBenchmarks(int clubId)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest("Club ID must be greater than 0");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            var benchmarks = await _analyticsService.GetEngagementBenchmarksAsync(clubId);
            return Ok(benchmarks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting engagement benchmarks for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving benchmarks" });
        }
    }

    /// <summary>
    /// Predict event success
    /// </summary>
    [HttpGet("event/{eventId}/predict-success")]
    public async Task<IActionResult> PredictEventSuccess(int eventId)
    {
        try
        {
            if (eventId <= 0)
                return BadRequest("Event ID must be greater than 0");

            var authorization = await AuthorizeEventAccessAsync(eventId);
            if (authorization.Error != null)
                return authorization.Error;

            var prediction = await _analyticsService.PredictEventSuccessAsync(eventId);
            return Ok(prediction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting event success for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while predicting event success" });
        }
    }

    /// <summary>
    /// Generate engagement report
    /// </summary>
    [HttpPost("club/{clubId}/report")]
    public async Task<IActionResult> GenerateEngagementReport(
        int clubId,
        string reportType,
        DateTime startDate,
        DateTime endDate)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest("Club ID must be greater than 0");

            var validReportTypes = new[] { "summary", "detailed", "comprehensive" };
            if (string.IsNullOrWhiteSpace(reportType) || !validReportTypes.Contains(reportType))
                return BadRequest("Invalid report type");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            var report = await _analyticsService.GenerateEngagementReportAsync(clubId, reportType, startDate, endDate);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating engagement report for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while generating the report" });
        }
    }

    /// <summary>
    /// Get ROI metrics for a club
    /// </summary>
    [HttpGet("club/{clubId}/roi")]
    public async Task<IActionResult> GetROIMetrics(int clubId, int periodMonths = 6)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest("Club ID must be greater than 0");

            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var hasAccess = await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId);
            if (!hasAccess)
                return Forbid();

            var roi = await _analyticsService.CalculateROIMetricsAsync(clubId, periodMonths);
            return Ok(roi);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ROI metrics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving ROI metrics" });
        }
    }
}

