using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for tracking and analyzing member login activity
/// </summary>
public interface ILoginActivityService
{
    /// <summary>
    /// Records a login event for analytics tracking
    /// </summary>
    Task RecordLoginEventAsync(int userId, int? memberId, int? clubId, string platform, string? deviceType, string sessionId);

    /// <summary>
    /// Records a failed login attempt for analytics
    /// </summary>
    Task RecordFailedLoginAsync(string email, string reason, string platform, string? deviceType);

    /// <summary>
    /// Gets login activity statistics for a club
    /// </summary>
    Task<LoginActivityStatsDto> GetClubLoginStatsAsync(int clubId, int days = 30);

    /// <summary>
    /// Gets member login activity for admin dashboard
    /// </summary>
    Task<List<MemberLoginActivityDto>> GetMemberLoginActivityAsync(int clubId, int days = 30);

    /// <summary>
    /// Gets members with low login activity (potential churn risk)
    /// </summary>
    Task<List<MemberLoginActivityDto>> GetInactiveMembersAsync(int clubId, int inactiveDays = 30);

    /// <summary>
    /// Calculates and updates engagement scores for all members in a club
    /// </summary>
    Task UpdateMemberEngagementScoresAsync(int clubId);

    /// <summary>
    /// Gets login trends over time for visualization
    /// </summary>
    Task<List<LoginTrendDto>> GetLoginTrendsAsync(int clubId, int days = 90);

    /// <summary>
    /// Updates login streak for a member
    /// </summary>
    Task UpdateLoginStreakAsync(int memberId);
}