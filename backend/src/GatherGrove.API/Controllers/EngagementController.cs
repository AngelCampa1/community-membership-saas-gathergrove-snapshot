using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for engagement dashboard and trends visualization
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class EngagementController : ControllerBase
{
    private readonly IFeatureUsageAnalyticsService _featureAnalyticsService;
    private readonly IMemberEngagementService _engagementService;
    private readonly ILogger<EngagementController> _logger;

    public EngagementController(
        IFeatureUsageAnalyticsService featureAnalyticsService,
        IMemberEngagementService engagementService,
        ILogger<EngagementController> logger)
    {
        _featureAnalyticsService = featureAnalyticsService;
        _engagementService = engagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive engagement dashboard data for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze (default: 30)</param>
    /// <returns>Complete engagement dashboard data</returns>
    [HttpGet("dashboard/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetEngagementDashboard(
        int clubId,
        [FromQuery] int daysBack = 30)
    {
        try
        {
            // Get all dashboard components in parallel for better performance
            var overviewTask = _engagementService.GetEngagementOverview(clubId);
            var trendsTask = _engagementService.GetEngagementTrends(clubId, daysBack);
            var featureUsageTask = _featureAnalyticsService.GetFeatureUsageAnalyticsAsync(clubId, daysBack);
            var memberEngagementTask = _featureAnalyticsService.GetMemberEngagementAnalyticsAsync(clubId);
            var platformUsageTask = _featureAnalyticsService.GetPlatformUsageComparisonAsync(clubId, daysBack);
            var lowEngagementTask = _featureAnalyticsService.GetLowEngagementMembersAsync(clubId, 30);

            await Task.WhenAll(overviewTask, trendsTask, featureUsageTask, memberEngagementTask, platformUsageTask, lowEngagementTask);

            var dashboardData = new
            {
                Overview = await overviewTask,
                Trends = await trendsTask,
                FeatureUsage = await featureUsageTask,
                MemberEngagement = await memberEngagementTask,
                PlatformUsage = await platformUsageTask,
                LowEngagementMembers = await lowEngagementTask,
                GeneratedAt = DateTime.UtcNow,
                PeriodDays = daysBack
            };

            return Ok(dashboardData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement dashboard for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement dashboard data");
        }
    }

    /// <summary>
    /// Get engagement trends visualization data
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze (default: 90)</param>
    /// <param name="granularity">Data granularity (daily, weekly, monthly)</param>
    /// <returns>Engagement trends for visualization</returns>
    [HttpGet("trends/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetEngagementTrends(
        int clubId,
        [FromQuery] int daysBack = 90,
        [FromQuery] string granularity = "daily")
    {
        try
        {
            var trends = await _engagementService.GetEngagementTrends(clubId, daysBack);

            // Transform data based on requested granularity
            var transformedTrends = granularity.ToLower() switch
            {
                "weekly" => TransformToWeeklyGranularity(trends, daysBack),
                "monthly" => TransformToMonthlyGranularity(trends, daysBack),
                _ => trends // daily is default
            };

            return Ok(new
            {
                Trends = transformedTrends,
                Granularity = granularity,
                Period = $"{daysBack} days",
                GeneratedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement trends for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement trends");
        }
    }

    /// <summary>
    /// Get engagement distribution data for visualization
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Engagement score distribution data</returns>
    [HttpGet("distribution/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetEngagementDistribution(int clubId)
    {
        try
        {
            var memberAnalytics = await _featureAnalyticsService.GetMemberEngagementAnalyticsAsync(clubId);

            var distributionData = new
            {
                Distribution = memberAnalytics.Distribution,
                TotalMembers = memberAnalytics.ClubSummary.TotalMembers,
                AverageScore = memberAnalytics.ClubSummary.AverageEngagementScore,
                HighlyEngaged = memberAnalytics.Distribution.HighlyActive,
                ModeratelyEngaged = memberAnalytics.Distribution.Moderate,
                LowEngagement = memberAnalytics.Distribution.LowEngagement,
                AtRisk = memberAnalytics.Distribution.Inactive
            };

            return Ok(distributionData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement distribution for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement distribution");
        }
    }


    /// <summary>
    /// Export engagement report data for leadership presentations
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="format">Export format (json, csv, xlsx)</param>
    /// <param name="daysBack">Number of days to include (default: 90)</param>
    /// <returns>Exportable engagement report</returns>
    [HttpGet("export/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> ExportEngagementReport(
        int clubId,
        [FromQuery] string format = "json",
        [FromQuery] int daysBack = 90)
    {
        try
        {
            // Get comprehensive report data
            var overviewTask = _engagementService.GetEngagementOverview(clubId);
            var trendsTask = _engagementService.GetEngagementTrends(clubId, daysBack);
            var featureUsageTask = _featureAnalyticsService.GetFeatureUsageAnalyticsAsync(clubId, daysBack);
            var memberEngagementTask = _featureAnalyticsService.GetMemberEngagementAnalyticsAsync(clubId);
            var platformUsageTask = _featureAnalyticsService.GetPlatformUsageComparisonAsync(clubId, daysBack);

            await Task.WhenAll(overviewTask, trendsTask, featureUsageTask, memberEngagementTask, platformUsageTask);

            var reportData = new EngagementReportData
            {
                GeneratedAt = DateTime.UtcNow,
                ClubId = clubId,
                PeriodDays = daysBack,
                Overview = await overviewTask,
                Trends = await trendsTask,
                FeatureUsage = await featureUsageTask,
                MemberEngagement = await memberEngagementTask,
                FeatureAdoption = null, // This method doesn't exist in the actual service
                PlatformUsage = await platformUsageTask
            };

            return format.ToLower() switch
            {
                "csv" => Ok(ConvertReportToCsv(reportData)),
                "xlsx" => Ok(ConvertReportToExcel(reportData)),
                _ => Ok(reportData) // JSON default
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting engagement report for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while exporting engagement report");
        }
    }

    /// <summary>
    /// Get engagement comparison between member segments
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="segmentBy">Segmentation criteria (tenure, engagement_level, activity)</param>
    /// <param name="daysBack">Number of days to analyze (default: 30)</param>
    /// <returns>Engagement comparison by segments</returns>
    [HttpGet("segments/{clubId}")]
    [Authorize(Policy = "UnlimitedTier")]
    public async Task<IActionResult> GetEngagementBySegments(
        int clubId,
        [FromQuery] string segmentBy = "tenure",
        [FromQuery] int daysBack = 30)
    {
        try
        {
            var memberAnalytics = await _featureAnalyticsService.GetMemberEngagementAnalyticsAsync(clubId);

            var segmentData = segmentBy.ToLower() switch
            {
                "tenure" => CreateTenureSegments(memberAnalytics),
                "engagement_level" => CreateEngagementLevelSegments(memberAnalytics),
                "activity" => CreateActivitySegments(memberAnalytics),
                _ => CreateTenureSegments(memberAnalytics)
            };

            return Ok(new
            {
                Segments = segmentData,
                SegmentedBy = segmentBy,
                Period = $"{daysBack} days",
                GeneratedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving engagement segments for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving engagement segments");
        }
    }

    #region Private Helper Methods

    private object TransformToWeeklyGranularity(object trends, int daysBack)
    {
        // Implementation to aggregate daily data into weekly buckets
        return trends; // Placeholder
    }

    private object TransformToMonthlyGranularity(object trends, int daysBack)
    {
        // Implementation to aggregate daily data into monthly buckets
        return trends; // Placeholder
    }

    private object CreateEngagementJourney(IEnumerable<object> activityPatterns)
    {
        // Implementation to create engagement journey visualization data
        return new { }; // Placeholder
    }

    private object CreateEngagementHeatMap(object featureAnalytics)
    {
        // Implementation to create heat map data structure
        return new { }; // Placeholder
    }

    private string GetPeakEngagementDay(object heatMapData)
    {
        // Implementation to identify peak engagement day
        return "Monday"; // Placeholder
    }

    private int GetPeakEngagementHour(object heatMapData)
    {
        // Implementation to identify peak engagement hour
        return 14; // Placeholder (2 PM)
    }

    private object ConvertReportToCsv(EngagementReportData reportData)
    {
        // Implementation to convert report data to CSV format
        return new { Format = "CSV", Data = "csv_data_here" }; // Placeholder
    }

    private object ConvertReportToExcel(EngagementReportData reportData)
    {
        // Implementation to convert report data to Excel format
        return new { Format = "Excel", Data = "xlsx_data_here" }; // Placeholder
    }

    private object CreateTenureSegments(object memberAnalytics)
    {
        // Implementation to create tenure-based segments
        return new { }; // Placeholder
    }

    private object CreateEngagementLevelSegments(object memberAnalytics)
    {
        // Implementation to create engagement level segments
        return new { }; // Placeholder
    }

    private object CreateActivitySegments(object memberAnalytics)
    {
        // Implementation to create activity-based segments
        return new { }; // Placeholder
    }

    #endregion
}

/// <summary>
/// Data structure for comprehensive engagement report
/// </summary>
public class EngagementReportData
{
    public DateTime GeneratedAt { get; set; }
    public int ClubId { get; set; }
    public int PeriodDays { get; set; }
    public object? Overview { get; set; }
    public object? Trends { get; set; }
    public object? FeatureUsage { get; set; }
    public object? MemberEngagement { get; set; }
    public object? FeatureAdoption { get; set; }
    public object? PlatformUsage { get; set; }
}