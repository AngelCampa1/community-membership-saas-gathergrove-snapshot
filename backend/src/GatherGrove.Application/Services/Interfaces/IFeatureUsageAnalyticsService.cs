using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for feature usage analytics and engagement tracking
/// </summary>
public interface IFeatureUsageAnalyticsService
{
    Task<bool> TrackFeatureUsageAsync(int clubId, int memberId, string featureName, string platform, string? sessionId = null, string? action = null, string? context = null, decimal? duration = null);
    Task<FeatureUsageAnalyticsResponse> GetFeatureUsageAnalyticsAsync(int clubId, int days = 30);
    Task<MemberEngagementAnalyticsResponse> GetMemberEngagementAnalyticsAsync(int clubId);
    Task<bool> CalculateMemberEngagementScoresAsync(int clubId);
    Task<List<MemberEngagementSummary>> GetLowEngagementMembersAsync(int clubId, int scoreThreshold = 40);
    Task<List<FeatureUsageStatistic>> GetTopFeaturesAsync(int clubId, int limit = 10);
    Task<PlatformUsageComparison> GetPlatformUsageComparisonAsync(int clubId, int days = 30);
}