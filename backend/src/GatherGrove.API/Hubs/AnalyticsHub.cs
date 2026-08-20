using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Analytics;
using ClubAuthorizationService = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Hubs;

/// <summary>
/// Real-time SignalR hub for streaming advanced analytics data
/// Provides live updates for engagement trends, cohort analysis, and ROI metrics
/// Requires Unlimited tier authorization
/// </summary>
[Authorize(Policy = "UnlimitedTierRequired")]
public class AnalyticsHub : Hub
{
    private readonly IAdvancedAnalyticsService _analyticsService;
    private readonly ClubAuthorizationService _clubAuthorizationService;
    private readonly ILogger<AnalyticsHub> _logger;

    public AnalyticsHub(
        IAdvancedAnalyticsService analyticsService,
        ClubAuthorizationService clubAuthorizationService,
        ILogger<AnalyticsHub> logger)
    {
        _analyticsService = analyticsService;
        _clubAuthorizationService = clubAuthorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Join a club's analytics group to receive real-time updates
    /// </summary>
    /// <param name="clubId">Club ID to subscribe to</param>
    public async Task JoinClubAnalytics(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        var groupName = $"club-analytics-{clubId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("User {UserId} joined analytics group for club {ClubId}",
            Context.UserIdentifier, clubId);

        // Send initial data
        try
        {
            await StreamEngagementMetrics(clubId);
            await StreamCohortAnalysis(clubId);
            await StreamROIMetrics(clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending initial analytics data for club {ClubId}", clubId);
        }
    }

    /// <summary>
    /// Leave a club's analytics group
    /// </summary>
    /// <param name="clubId">Club ID to unsubscribe from</param>
    public async Task LeaveClubAnalytics(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        var groupName = $"club-analytics-{clubId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("User {UserId} left analytics group for club {ClubId}",
            Context.UserIdentifier, clubId);
    }

    /// <summary>
    /// Stream real-time engagement metrics
    /// </summary>
    /// <param name="clubId">Club ID</param>
    public async Task StreamEngagementMetrics(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        try
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-30); // Last 30 days for real-time view

            var engagementTrends = await _analyticsService.GetEngagementTrendsAsync(clubId, startDate, endDate);

            var groupName = $"club-analytics-{clubId}";
            await Clients.Group(groupName).SendAsync("EngagementUpdate", new
            {
                clubId = clubId,
                timestamp = DateTime.UtcNow,
                data = engagementTrends,
                type = "engagement_trends"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming engagement metrics for club {ClubId}", clubId);

            // Send error notification to client
            await Clients.Caller.SendAsync("AnalyticsError", new
            {
                clubId = clubId,
                error = "Failed to load engagement data",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Stream real-time cohort analysis
    /// </summary>
    /// <param name="clubId">Club ID</param>
    public async Task StreamCohortAnalysis(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        try
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddMonths(-6); // Last 6 months for cohort analysis

            var cohortData = await _analyticsService.GetCohortAnalysisAsync(clubId, startDate, endDate);

            var groupName = $"club-analytics-{clubId}";
            await Clients.Group(groupName).SendAsync("CohortUpdate", new
            {
                clubId = clubId,
                timestamp = DateTime.UtcNow,
                data = cohortData,
                type = "cohort_analysis"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming cohort analysis for club {ClubId}", clubId);

            await Clients.Caller.SendAsync("AnalyticsError", new
            {
                clubId = clubId,
                error = "Failed to load cohort data",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Stream real-time ROI metrics
    /// </summary>
    /// <param name="clubId">Club ID</param>
    public async Task StreamROIMetrics(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        try
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddMonths(-12); // Last 12 months for ROI analysis

            var roiData = await _analyticsService.GetFinancialROIAsync(clubId, startDate, endDate);

            var groupName = $"club-analytics-{clubId}";
            await Clients.Group(groupName).SendAsync("ROIUpdate", new
            {
                clubId = clubId,
                timestamp = DateTime.UtcNow,
                data = roiData,
                type = "financial_roi"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming ROI metrics for club {ClubId}", clubId);

            await Clients.Caller.SendAsync("AnalyticsError", new
            {
                clubId = clubId,
                error = "Failed to load ROI data",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Stream member segmentation updates
    /// </summary>
    /// <param name="clubId">Club ID</param>
    public async Task StreamMemberSegmentation(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        try
        {
            var segmentData = await _analyticsService.GetMemberSegmentationAsync(clubId, new List<string>());

            var groupName = $"club-analytics-{clubId}";
            await Clients.Group(groupName).SendAsync("SegmentationUpdate", new
            {
                clubId = clubId,
                timestamp = DateTime.UtcNow,
                data = segmentData,
                type = "member_segmentation"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming member segmentation for club {ClubId}", clubId);

            await Clients.Caller.SendAsync("AnalyticsError", new
            {
                clubId = clubId,
                error = "Failed to load segmentation data",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Request refresh of all analytics data
    /// </summary>
    /// <param name="clubId">Club ID</param>
    public async Task RefreshAllAnalytics(int clubId)
    {
        await EnsureAuthorizedForClubAsync(clubId);

        _logger.LogInformation("Refreshing all analytics for club {ClubId} requested by user {UserId}",
            clubId, Context.UserIdentifier);

        // Send all analytics updates
        await StreamEngagementMetrics(clubId);
        await StreamCohortAnalysis(clubId);
        await StreamROIMetrics(clubId);
        await StreamMemberSegmentation(clubId);
    }

    private async Task EnsureAuthorizedForClubAsync(int clubId)
    {
        if (Context.User is null || !await _clubAuthorizationService.CanAccessClubAsAdminAsync(Context.User, clubId))
        {
            _logger.LogWarning("Unauthorized analytics hub access attempt by user {UserId} for club {ClubId}",
                Context.UserIdentifier, clubId);
            throw new HubException("Not authorized for this club's analytics.");
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Analytics client connected: {ConnectionId}, User: {UserId}",
            Context.ConnectionId, Context.UserIdentifier);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Analytics client disconnected: {ConnectionId}, User: {UserId}, Exception: {Exception}",
            Context.ConnectionId, Context.UserIdentifier, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }
}
