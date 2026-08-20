using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Enums;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing member engagement analytics and scoring
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class MemberEngagementController : ControllerBase
{
    private readonly IMemberEngagementService _engagementService;
    private readonly IClubAuthorizationService _authorizationService;
    private readonly ILogger<MemberEngagementController> _logger;

    public MemberEngagementController(
        IMemberEngagementService engagementService,
        IClubAuthorizationService authorizationService,
        ILogger<MemberEngagementController> logger)
    {
        _engagementService = engagementService;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Calculate engagement score for a specific member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="forceRecalculation">Force recalculation even if recently calculated</param>
    /// <returns>Updated engagement score</returns>
    [HttpPost("{memberId}/calculate")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> CalculateEngagementScore(int memberId, [FromQuery] bool forceRecalculation = false)
    {
        try
        {
            var score = await _engagementService.CalculateEngagementScore(memberId, forceRecalculation);
            return Ok(score);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement score for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while calculating the engagement score");
        }
    }

    /// <summary>
    /// Get current engagement score for a member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <returns>Current engagement score or null if not found</returns>
    [HttpGet("{memberId}")]
    [Authorize(Policy = "ClubMember")]
    public async Task<IActionResult> GetMemberEngagementScore(int memberId)
    {
        try
        {
            // SECURITY FIX: Validate that the requesting user has access to this member's club
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Unable to determine user identity");
            }

            // Verify the user can access the member's data (same club or self)
            if (!await _authorizationService.CanAccessMemberDataAsync(memberId, userId))
            {
                _logger.LogWarning("User {UserId} attempted unauthorized access to member {MemberId} engagement score", userId, memberId);
                return Forbid();
            }

            var score = await _engagementService.GetMemberEngagementScore(memberId);
            if (score == null)
            {
                return NotFound("Engagement score not found");
            }
            return Ok(score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement score for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while retrieving the engagement score");
        }
    }

    /// <summary>
    /// Get engagement scores for all members in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="level">Optional filter by engagement level</param>
    /// <returns>List of engagement scores</returns>
    [HttpGet("club/{clubId}")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> GetClubEngagementScores(int clubId, [FromQuery] string? level = null)
    {
        // Check for Expand tier access
        if (!await _authorizationService.HasFeatureAccess(clubId, "memberengagement"))
        {
            _logger.LogWarning("Club {ClubId} attempted to access member engagement without Expand tier", clubId);
            return StatusCode(403, new { message = "You need Expand to see member stats" });
        }

        try
        {
            EngagementLevel? engagementLevel = null;
            if (!string.IsNullOrEmpty(level) && Enum.TryParse<EngagementLevel>(level, true, out var parsedLevel))
            {
                engagementLevel = parsedLevel;
            }

            var scores = await _engagementService.GetEngagementScores(clubId, engagementLevel);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement scores for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement scores");
        }
    }

    /// <summary>
    /// Get members at risk of disengagement
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="threshold">Score threshold for at-risk classification</param>
    /// <returns>List of at-risk members</returns>
    [HttpGet("club/{clubId}/at-risk")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> GetAtRiskMembers(int clubId, [FromQuery] decimal threshold = 40m)
    {
        // Check for Expand tier access
        if (!await _authorizationService.HasFeatureAccess(clubId, "memberengagement"))
        {
            _logger.LogWarning("Club {ClubId} attempted to access at-risk members without Expand tier", clubId);
            return StatusCode(403, new { message = "You need Expand to see member stats" });
        }

        try
        {
            var atRiskMembers = await _engagementService.GetAtRiskMembers(clubId, threshold);
            return Ok(atRiskMembers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving at-risk members for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving at-risk members");
        }
    }

    /// <summary>
    /// Get engagement history for a member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days of history to retrieve</param>
    /// <returns>List of historical engagement scores</returns>
    [HttpGet("{memberId}/history")]
    [Authorize(Policy = "ClubMember")]
    public async Task<IActionResult> GetEngagementHistory(int memberId, [FromQuery] int daysBack = 90)
    {
        try
        {
            var history = await _engagementService.GetEngagementHistory(memberId, daysBack);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement history for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while retrieving engagement history");
        }
    }

    /// <summary>
    /// Update engagement score based on activity
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="activityType">Type of activity that occurred</param>
    /// <param name="metadata">Additional activity metadata</param>
    /// <returns>Updated engagement score</returns>
    [HttpPost("{memberId}/activity")]
    [Authorize(Policy = "ClubMember")]
    public async Task<IActionResult> UpdateEngagementOnActivity(int memberId, [FromBody] UpdateEngagementRequest request)
    {
        try
        {
            var score = await _engagementService.UpdateEngagementOnActivity(memberId, request.ActivityType, request.Metadata);
            return Ok(score);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating engagement for member {MemberId} on activity {ActivityType}",
                memberId, request.ActivityType);
            return StatusCode(500, "An error occurred while updating engagement");
        }
    }

    /// <summary>
    /// Process engagement alerts for declining engagement
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>List of generated alerts</returns>
    [HttpPost("club/{clubId}/process-alerts")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> ProcessEngagementAlerts(int clubId)
    {
        try
        {
            var alerts = await _engagementService.ProcessEngagementAlerts(clubId);
            return Ok(new { AlertsGenerated = alerts.Count, Alerts = alerts });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing engagement alerts for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while processing engagement alerts");
        }
    }

    /// <summary>
    /// Get active engagement alerts for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="severity">Optional filter by alert severity</param>
    /// <returns>List of active alerts</returns>
    [HttpGet("club/{clubId}/alerts")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> GetEngagementAlerts(int clubId, [FromQuery] string? severity = null)
    {
        try
        {
            AlertSeverity? alertSeverity = null;
            if (!string.IsNullOrEmpty(severity) && Enum.TryParse<AlertSeverity>(severity, true, out var parsedSeverity))
            {
                alertSeverity = parsedSeverity;
            }

            var alerts = await _engagementService.GetEngagementAlerts(clubId, alertSeverity);
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement alerts for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement alerts");
        }
    }

    /// <summary>
    /// Resolve an engagement alert
    /// </summary>
    /// <param name="alertId">Alert ID</param>
    /// <param name="request">Resolution request</param>
    /// <returns>Resolved alert</returns>
    [HttpPost("alerts/{alertId}/resolve")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> ResolveAlert(int alertId, [FromBody] ResolveAlertRequest request)
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Unable to determine user identity");
            }

            var alert = await _engagementService.ResolveAlert(alertId, userId, request.ResolutionNotes);
            return Ok(alert);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving alert {AlertId}", alertId);
            return StatusCode(500, "An error occurred while resolving the alert");
        }
    }

    /// <summary>
    /// Get engagement trends and analytics for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Engagement trends data</returns>
    [HttpGet("club/{clubId}/trends")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> GetEngagementTrends(int clubId, [FromQuery] int daysBack = 30)
    {
        // Check for Expand tier access
        if (!await _authorizationService.HasFeatureAccess(clubId, "memberengagement"))
        {
            _logger.LogWarning("Club {ClubId} attempted to access engagement trends without Expand tier", clubId);
            return StatusCode(403, new { message = "You need Expand to see member stats" });
        }

        try
        {
            var trends = await _engagementService.GetEngagementTrends(clubId, daysBack);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement trends for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement trends");
        }
    }

    /// <summary>
    /// Recalculate engagement scores for all members in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Number of scores recalculated</returns>
    [HttpPost("club/{clubId}/recalculate")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> RecalculateClubEngagementScores(int clubId)
    {
        try
        {
            var recalculatedCount = await _engagementService.RecalculateClubEngagementScores(clubId);
            return Ok(new { RecalculatedCount = recalculatedCount, Message = $"Recalculated {recalculatedCount} engagement scores" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating engagement scores for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while recalculating engagement scores");
        }
    }

    /// <summary>
    /// Get engagement overview statistics for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Overview statistics</returns>
    [HttpGet("club/{clubId}/overview")]
    [Authorize(Policy = "ClubAdmin")]
    public async Task<IActionResult> GetEngagementOverview(int clubId)
    {
        // Check for Expand tier access
        if (!await _authorizationService.HasFeatureAccess(clubId, "memberengagement"))
        {
            _logger.LogWarning("Club {ClubId} attempted to access engagement overview without Expand tier", clubId);
            return StatusCode(403, new { message = "You need Expand to see member stats" });
        }

        try
        {
            var overview = await _engagementService.GetEngagementOverview(clubId);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement overview for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement overview");
        }
    }
}

/// <summary>
/// Request model for updating engagement on activity
/// </summary>
public class UpdateEngagementRequest
{
    public string ActivityType { get; set; } = string.Empty;
    public object? Metadata { get; set; }
}

/// <summary>
/// Request model for resolving alerts
/// </summary>
public class ResolveAlertRequest
{
    public string? ResolutionNotes { get; set; }
}
