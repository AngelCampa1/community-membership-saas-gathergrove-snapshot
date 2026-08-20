using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for tracking and reporting communication analytics
/// </summary>
public interface ICommunicationAnalyticsService
{
    /// <summary>
    /// Gets analytics summary for a club's communications
    /// </summary>
    Task<CommunicationAnalyticsResponse> GetAnalyticsSummaryAsync(int clubId, AnalyticsFilterRequest request);

    /// <summary>
    /// Gets detailed analytics for a specific communication
    /// </summary>
    Task<CommunicationDetailsResponse> GetCommunicationDetailsAsync(int clubId, int communicationId);

    /// <summary>
    /// Tracks an email open event
    /// </summary>
    Task TrackEmailOpenAsync(TrackEmailOpenRequest request);

    /// <summary>
    /// Tracks a link click event
    /// </summary>
    Task TrackLinkClickAsync(TrackLinkClickRequest request);

    /// <summary>
    /// Creates analytics tracking record for a communication
    /// </summary>
    Task CreateAnalyticsRecordAsync(int communicationId, int memberId, string trackingId, int? templateId = null, int? abTestCampaignId = null, string? variantName = null);
}

