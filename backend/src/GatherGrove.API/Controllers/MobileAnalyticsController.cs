using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Mobile-compatible analytics controller
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}")]
[Authorize]
public class MobileAnalyticsController : ControllerBase
{
    private readonly IEventEngagementAnalyticsService _analyticsService;
    private readonly IClubAuthorizationService _clubAuthorizationService;
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MobileAnalyticsController> _logger;

    public MobileAnalyticsController(
        IEventEngagementAnalyticsService analyticsService,
        IClubAuthorizationService clubAuthorizationService,
        GatherGroveDbContext context,
        ILogger<MobileAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _clubAuthorizationService = clubAuthorizationService;
        _context = context;
        _logger = logger;
    }

    private async Task<IActionResult?> ValidateRouteEventOwnershipAsync(int clubId, int eventId)
    {
        var eventClubId = await _context.Events
            .Where(e => e.Id == eventId)
            .Select(e => (int?)e.ClubId)
            .FirstOrDefaultAsync();

        if (!eventClubId.HasValue)
            return NotFound(new { message = "Event not found" });

        if (eventClubId.Value != clubId)
            return Forbid("Event not authorized for this club");

        return null;
    }

    /// <summary>
    /// Get event engagement analytics
    /// Mobile route: GET /api/v1/clubs/{clubId}/events/{eventId}/engagement-analytics
    /// </summary>
    [HttpGet("events/{eventId}/engagement-analytics")]
    [ProducesResponseType(typeof(EventEngagementAnalyticsReportDto), 200)]
    public async Task<IActionResult> GetEventEngagementAnalytics(
        int clubId,
        int eventId,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("Mobile: Getting engagement analytics for event {EventId}", eventId);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("User not authenticated");

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
                return Forbid("User not authorized for this club");

            var eventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (eventValidation != null)
                return eventValidation;

            var end = endDate ?? DateTime.UtcNow;
            var start = startDate ?? end.AddDays(-30);

            var query = new EventEngagementAnalyticsQuery
            {
                ClubId = clubId,
                EventIds = new List<int> { eventId },
                StartDate = start,
                EndDate = end
            };

            var analytics = await _analyticsService.GetEventEngagementAnalyticsReportAsync(query, userId);
            return Ok(analytics);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement analytics for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while retrieving analytics" });
        }
    }

    /// <summary>
    /// Get member engagement insights
    /// Mobile route: GET /api/v1/clubs/{clubId}/members/engagement-insights
    /// </summary>
    [HttpGet("members/engagement-insights")]
    [ProducesResponseType(typeof(MemberEngagementInsights), 200)]
    public async Task<IActionResult> GetMemberEngagementInsights(
        int clubId,
        int? memberId = null,
        int periodDays = 90)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("User not authenticated");

            var targetMemberId = memberId ?? userId;

            _logger.LogInformation("Mobile: Getting engagement insights for member {MemberId}", targetMemberId);

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                if (targetMemberId != userId)
                    return Forbid("User not authorized to view other member insights");
            }

            var insights = await _analyticsService.GetMemberEngagementInsightsAsync(clubId, targetMemberId, userId, periodDays);
            return Ok(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member engagement insights for member {MemberId}", memberId);
            return StatusCode(500, new { message = "An error occurred while retrieving member insights" });
        }
    }

    /// <summary>
    /// Get event performance analysis
    /// Mobile route: GET /api/v1/clubs/{clubId}/events/{eventId}/performance-analysis
    /// </summary>
    [HttpGet("events/{eventId}/performance-analysis")]
    [ProducesResponseType(typeof(EventPerformanceAnalysis), 200)]
    public async Task<IActionResult> GetEventPerformanceAnalysis(int clubId, int eventId)
    {
        try
        {
            _logger.LogInformation("Mobile: Getting performance analysis for event {EventId}", eventId);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("User not authenticated");

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
                return Forbid("User not authorized for this club");

            var eventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (eventValidation != null)
                return eventValidation;

            var analysis = await _analyticsService.AnalyzeEventPerformanceAsync(eventId);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event performance analysis for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while analyzing event performance" });
        }
    }

    /// <summary>
    /// Get ROI metrics for a club
    /// Mobile route: GET /api/v1/clubs/{clubId}/analytics/roi-metrics
    /// </summary>
    [HttpGet("analytics/roi-metrics")]
    [ProducesResponseType(typeof(EventROIMetrics), 200)]
    public async Task<IActionResult> GetROIMetrics(int clubId, int periodMonths = 6)
    {
        try
        {
            _logger.LogInformation("Mobile: Getting ROI metrics for club {ClubId}", clubId);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("User not authenticated");

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
                return Forbid("User not authorized for this club");

            var metrics = await _analyticsService.CalculateROIMetricsAsync(clubId, periodMonths);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ROI metrics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving ROI metrics" });
        }
    }

    /// <summary>
    /// Get basic event analytics (attendance, RSVPs, check-ins)
    /// Mobile route: GET /api/v1/clubs/{clubId}/events/{eventId}/analytics
    /// </summary>
    [HttpGet("events/{eventId}/analytics")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetBasicEventAnalytics(int clubId, int eventId)
    {
        try
        {
            _logger.LogInformation("Mobile: Getting basic analytics for event {EventId}", eventId);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("User not authenticated");

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
                return Forbid("User not authorized for this club");

            var eventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
            if (eventValidation != null)
                return eventValidation;

            var analysis = await _analyticsService.AnalyzeEventPerformanceAsync(eventId);

            var basicAnalytics = new
            {
                eventId,
                clubId,
                attendance = new
                {
                    total = analysis.AttendanceAnalysis.TotalAttended,
                    rsvps = analysis.AttendanceAnalysis.TotalRsvps,
                    checkIns = analysis.AttendanceAnalysis.TotalAttended,
                    attendanceRate = analysis.AttendanceAnalysis.AttendanceRate
                },
                performanceScore = analysis.PerformanceScore,
                comparisonToAverage = analysis.ComparisonToAverage
            };

            return Ok(basicAnalytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting basic analytics for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while retrieving event analytics" });
        }
    }
}
