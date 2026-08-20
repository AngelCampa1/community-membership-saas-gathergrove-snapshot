using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AppClubAuthorizationService = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Controllers
{
    [ApiController]
    [Route("api/clubs/{clubId}/analytics/premium")]
    [Authorize(Policy = "UnlimitedTierRequired")]
    [Produces("application/json")]
    public class AdvancedAnalyticsController : ControllerBase
    {
        private readonly IAdvancedAnalyticsService _analyticsService;
        private readonly GatherGrove.Application.Services.IEventEngagementAnalyticsService _eventAnalyticsService;
        private readonly AppClubAuthorizationService _clubAuthorizationService;
        private readonly GatherGroveDbContext _context;
        private readonly ILogger<AdvancedAnalyticsController> _logger;

        public AdvancedAnalyticsController(
            IAdvancedAnalyticsService analyticsService,
            GatherGrove.Application.Services.IEventEngagementAnalyticsService eventAnalyticsService,
            AppClubAuthorizationService clubAuthorizationService,
            GatherGroveDbContext context,
            ILogger<AdvancedAnalyticsController> logger)
        {
            _analyticsService = analyticsService;
            _eventAnalyticsService = eventAnalyticsService;
            _clubAuthorizationService = clubAuthorizationService;
            _context = context;
            _logger = logger;
        }

        private async Task<ActionResult?> ValidateRouteEventOwnershipAsync(int clubId, int eventId)
        {
            var clubValidation = await ValidateRouteClubAdminAsync(clubId);
            if (clubValidation != null)
                return clubValidation;

            var eventClubId = await _context.Events
                .Where(e => e.Id == eventId)
                .Select(e => (int?)e.ClubId)
                .FirstOrDefaultAsync();

            if (!eventClubId.HasValue)
                return NotFound(new { message = "Event not found" });

            if (eventClubId.Value != clubId)
                return Forbid();

            return null;
        }

        private async Task<ActionResult?> ValidateRouteClubAdminAsync(int clubId)
        {
            if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId))
                return Forbid();

            return null;
        }

        /// <summary>
        /// Get engagement trends for unlimited tier users
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="startDate">Start date for analysis</param>
        /// <param name="endDate">End date for analysis</param>
        /// <returns>Engagement trend data</returns>
        [HttpGet("engagement-trends")]
        [ProducesResponseType(typeof(List<EngagementTrendDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<List<EngagementTrendDto>>> GetEngagementTrends(
            int clubId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                if (startDate >= endDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var trends = await _analyticsService.GetEngagementTrendsAsync(clubId, startDate, endDate);
                return Ok(trends);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engagement trends for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while retrieving engagement trends" });
            }
        }

        /// <summary>
        /// Get cohort analysis for member retention
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="startDate">Start date for analysis</param>
        /// <param name="endDate">End date for analysis</param>
        /// <returns>Cohort analysis data</returns>
        [HttpGet("cohorts")]
        [ProducesResponseType(typeof(List<CohortDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<CohortDto>>> GetCohortAnalysis(
            int clubId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var cohorts = await _analyticsService.GetCohortAnalysisAsync(clubId, startDate, endDate);
                return Ok(cohorts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cohort analysis for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while retrieving cohort analysis" });
            }
        }

        /// <summary>
        /// Get financial ROI tracking data
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="startDate">Start date for analysis</param>
        /// <param name="endDate">End date for analysis</param>
        /// <returns>Financial ROI data</returns>
        [HttpGet("roi")]
        [ProducesResponseType(typeof(List<ROIDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<ROIDto>>> GetFinancialROI(
            int clubId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var roiData = await _analyticsService.GetFinancialROIAsync(clubId, startDate, endDate);
                return Ok(roiData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting financial ROI for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while retrieving financial ROI data" });
            }
        }

        /// <summary>
        /// Compare event performance across multiple events
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="request">Event comparison request</param>
        /// <returns>Event comparison data</returns>
        [HttpPost("events/compare")]
        [ProducesResponseType(typeof(List<EventComparisonDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<EventComparisonDto>>> CompareEvents(
            int clubId,
            [FromBody] EventComparisonRequestDto request)
        {
            try
            {
                if (request.EventIds == null || !request.EventIds.Any())
                {
                    return BadRequest(new { message = "At least one event ID must be provided" });
                }

                if (request.EventIds.Count > 10)
                {
                    return BadRequest(new { message = "Cannot compare more than 10 events at once" });
                }

                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var comparison = await _analyticsService.CompareEventsAsync(clubId, request.EventIds);
                return Ok(comparison);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error comparing events for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while comparing events" });
            }
        }

        /// <summary>
        /// Get member segmentation analysis
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="criteria">Segmentation criteria (optional)</param>
        /// <returns>Member segment data</returns>
        [HttpGet("segmentation")]
        [ProducesResponseType(typeof(List<MemberSegmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<MemberSegmentDto>>> GetMemberSegmentation(
            int clubId,
            [FromQuery] string? criteria = null)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var criteriaList = !string.IsNullOrEmpty(criteria)
                    ? criteria.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                    : new List<string>();

                var segments = await _analyticsService.GetMemberSegmentationAsync(clubId, criteriaList);
                return Ok(segments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting member segmentation for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while retrieving member segmentation" });
            }
        }

        /// <summary>
        /// Export analytics data in various formats
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="request">Export request</param>
        /// <returns>Export download information</returns>
        [HttpPost("export")]
        [ProducesResponseType(typeof(ExportResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ExportResponseDto>> ExportData(
            int clubId,
            [FromBody] ExportRequestDto request)
        {
            try
            {
                var validDataTypes = new[] { "engagement", "cohorts", "roi", "events", "segmentation" };
                var validFormats = new[] { "pdf", "excel", "csv" };

                if (!validDataTypes.Contains(request.DataType.ToLowerInvariant()))
                {
                    return BadRequest(new { message = $"Invalid data type. Must be one of: {string.Join(", ", validDataTypes)}" });
                }

                if (!validFormats.Contains(request.Format.ToLowerInvariant()))
                {
                    return BadRequest(new { message = $"Invalid format. Must be one of: {string.Join(", ", validFormats)}" });
                }

                if (request.StartDate >= request.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                // Get user ID from claims for authorization
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("Unable to extract user ID from token for export request");
                    return Unauthorized(new { message = "User ID not found in authentication token" });
                }

                var exportResult = await _analyticsService.ExportDataAsync(
                    clubId,
                    userId,
                    request.DataType,
                    request.Format,
                    request.StartDate,
                    request.EndDate);

                return Ok(exportResult);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized export attempt for club {ClubId}", clubId);
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while exporting data" });
            }
        }

        /// <summary>
        /// Download exported analytics files
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="filename">Filename to download</param>
        /// <returns>File download</returns>
        [HttpGet("downloads/{filename}")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DownloadFile(int clubId, string filename)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                if (string.IsNullOrEmpty(filename) || filename.Contains("..") || filename.Contains("/") || filename.Contains("\\"))
                {
                    return BadRequest(new { message = "Invalid filename" });
                }

                var exportPath = Path.Combine(Path.GetTempPath(), "gathergrove-exports");
                var fullPath = Path.Combine(exportPath, filename);

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                var extension = Path.GetExtension(filename).ToLowerInvariant();

                var contentType = extension switch
                {
                    ".pdf" => "application/pdf",
                    ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".csv" => "text/csv",
                    _ => "application/octet-stream"
                };

                // Clean up file after download
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch
                {
                    // Ignore cleanup errors
                }

                return File(fileBytes, contentType, filename);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {Filename} for club {ClubId}", filename, clubId);
                return StatusCode(500, new { message = "An error occurred while downloading the file" });
            }
        }

        /// <summary>
        /// Get real-time analytics summary for dashboard
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <returns>Real-time analytics summary</returns>
        [HttpGet("realtime/summary")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetRealTimeSummary(int clubId)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var endDate = DateTime.UtcNow;
                var startDate = endDate.AddDays(-30);

                // Get summary data for real-time updates
                // BUG FIX #9: Use await instead of .Result to prevent potential deadlocks
                var engagementTrendsTask = _analyticsService.GetEngagementTrendsAsync(clubId, startDate, endDate);
                var memberSegmentationTask = _analyticsService.GetMemberSegmentationAsync(clubId, new List<string>());

                await Task.WhenAll(engagementTrendsTask, memberSegmentationTask);

                var engagementTrends = await engagementTrendsTask;
                var memberSegmentation = await memberSegmentationTask;

                var summary = new
                {
                    lastUpdated = DateTime.UtcNow,
                    engagementScore = engagementTrends.LastOrDefault()?.AverageScore ?? 0,
                    memberCount = memberSegmentation.Sum(s => s.Count),
                    trends = new
                    {
                        engagement = engagementTrends.Count > 1 ?
                            (engagementTrends.Last().AverageScore > engagementTrends[engagementTrends.Count - 2].AverageScore ? "up" : "down") : "stable",
                        membership = "stable" // Would need historical data for real calculation
                    }
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting real-time summary for club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while retrieving real-time summary" });
            }
        }

        /// <summary>
        /// Get personalized event recommendations for a member
        /// </summary>
        [HttpGet("event-recommendations")]
        [ProducesResponseType(typeof(List<GatherGrove.Application.DTOs.EventRecommendation>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<GatherGrove.Application.DTOs.EventRecommendation>>> GetEventRecommendations(
            int clubId,
            [FromQuery] int memberId,
            [FromQuery] int maxRecommendations = 5)
        {
            try
            {
                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var recommendations = await _eventAnalyticsService.GenerateEventRecommendationsAsync(
                    clubId, memberId, maxRecommendations);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting event recommendations for Member {MemberId}", memberId);
                return StatusCode(500, new { message = "An error occurred while generating recommendations" });
            }
        }

        /// <summary>
        /// Analyze event performance metrics
        /// </summary>
        [HttpGet("event-performance/{eventId}")]
        [ProducesResponseType(typeof(EventPerformanceAnalysis), StatusCodes.Status200OK)]
        public async Task<ActionResult<EventPerformanceAnalysis>> AnalyzeEventPerformance(
            int clubId,
            int eventId)
        {
            try
            {
                var eventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
                if (eventValidation != null)
                    return eventValidation;

                var analysis = await _eventAnalyticsService.AnalyzeEventPerformanceAsync(eventId);
                return Ok(analysis);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing event performance for Event {EventId}", eventId);
                return StatusCode(500, new { message = "An error occurred while analyzing event performance" });
            }
        }

        /// <summary>
        /// Predict event success probability
        /// </summary>
        [HttpGet("event-success-prediction/{eventId}")]
        [ProducesResponseType(typeof(EventSuccessPrediction), StatusCodes.Status200OK)]
        public async Task<ActionResult<EventSuccessPrediction>> PredictEventSuccess(
            int clubId,
            int eventId)
        {
            try
            {
                var eventValidation = await ValidateRouteEventOwnershipAsync(clubId, eventId);
                if (eventValidation != null)
                    return eventValidation;

                var prediction = await _eventAnalyticsService.PredictEventSuccessAsync(eventId);
                return Ok(prediction);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting event success for Event {EventId}", eventId);
                return StatusCode(500, new { message = "An error occurred while predicting event success" });
            }
        }

        /// <summary>
        /// Generate comprehensive engagement report
        /// </summary>
        [HttpPost("engagement-report")]
        [ProducesResponseType(typeof(EngagementReport), StatusCodes.Status200OK)]
        public async Task<ActionResult<EngagementReport>> GenerateEngagementReport(
            int clubId,
            [FromBody] EngagementReportRequest request)
        {
            try
            {
                if (request.StartDate >= request.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var clubValidation = await ValidateRouteClubAdminAsync(clubId);
                if (clubValidation != null)
                    return clubValidation;

                var report = await _eventAnalyticsService.GenerateEngagementReportAsync(
                    clubId,
                    request.ReportType,
                    request.StartDate,
                    request.EndDate);

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating engagement report for Club {ClubId}", clubId);
                return StatusCode(500, new { message = "An error occurred while generating the report" });
            }
        }
    }

    // Request DTO
    public class EngagementReportRequest
    {
        public string ReportType { get; set; } = "comprehensive";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
