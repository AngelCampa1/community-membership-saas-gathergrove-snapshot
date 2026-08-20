using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for communication analytics and tracking
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/communication-analytics")]
[Authorize]
public class CommunicationAnalyticsController : ControllerBase
{
    private readonly ICommunicationAnalyticsService _analyticsService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<CommunicationAnalyticsController> _logger;

    public CommunicationAnalyticsController(
        ICommunicationAnalyticsService analyticsService,
        IClubAuthorizationService authService,
        ILogger<CommunicationAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets analytics summary for a club's communications
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(CommunicationAnalyticsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CommunicationAnalyticsResponse>> GetAnalyticsSummary(
        int clubId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? communicationType,
        [FromQuery] int? templateId,
        [FromQuery] int? segmentId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        if (!await _authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return Forbid("You need Expand to see message stats");
        }

        try
        {
            var filter = new AnalyticsFilterRequest
            {
                StartDate = startDate,
                EndDate = endDate,
                CommunicationType = communicationType,
                TemplateId = templateId,
                SegmentId = segmentId
            };

            var analytics = await _analyticsService.GetAnalyticsSummaryAsync(clubId, filter);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics summary for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error retrieving analytics" });
        }
    }

    /// <summary>
    /// Gets detailed analytics for a specific communication
    /// </summary>
    [HttpGet("communications/{communicationId}")]
    [ProducesResponseType(typeof(CommunicationDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CommunicationDetailsResponse>> GetCommunicationDetails(
        int clubId,
        int communicationId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var details = await _analyticsService.GetCommunicationDetailsAsync(clubId, communicationId);
            return Ok(details);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting details for communication {CommunicationId}", communicationId);
            return StatusCode(500, new { message = "Error retrieving communication details" });
        }
    }
}

/// <summary>
/// Public controller for tracking email opens and clicks
/// </summary>
[ApiController]
[Route("api/v1/track")]
[AllowAnonymous]
public class CommunicationTrackingController : ControllerBase
{
    private readonly ICommunicationAnalyticsService _analyticsService;
    private readonly ILogger<CommunicationTrackingController> _logger;

    public CommunicationTrackingController(
        ICommunicationAnalyticsService analyticsService,
        ILogger<CommunicationTrackingController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Tracks email open events (1x1 pixel)
    /// </summary>
    [HttpGet("open/{trackingId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> TrackEmailOpen(string trackingId)
    {
        try
        {
            await _analyticsService.TrackEmailOpenAsync(new TrackEmailOpenRequest
            {
                TrackingId = trackingId,
                UserAgent = Request.Headers["User-Agent"].ToString(),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            // Return a 1x1 transparent pixel
            var pixel = Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
            return File(pixel, "image/gif");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking email open for {TrackingId}", trackingId);
            // Still return the pixel even on error
            var pixel = Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
            return File(pixel, "image/gif");
        }
    }

    /// <summary>
    /// Tracks link click events and redirects
    /// </summary>
    [HttpGet("click/{trackingId}")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> TrackLinkClick(string trackingId, [FromQuery] string url)
    {
        try
        {
            await _analyticsService.TrackLinkClickAsync(new TrackLinkClickRequest
            {
                TrackingId = trackingId,
                LinkUrl = url,
                UserAgent = Request.Headers["User-Agent"].ToString(),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            return Redirect(url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking link click for {TrackingId}", trackingId);
            // Still redirect even on error
            return Redirect(url);
        }
    }
}

