using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces
{
    /// <summary>
    /// Service interface for managing member engagement scoring and analytics
    /// </summary>
    public interface IMemberEngagementService
    {
        /// <summary>
        /// Calculate engagement score for a specific member
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <param name="forceRecalculation">Force recalculation even if recently calculated</param>
        /// <returns>Updated engagement score</returns>
        Task<MemberEngagementScore> CalculateEngagementScore(int memberId, bool forceRecalculation = false);

        /// <summary>
        /// Get current engagement score for a member
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <returns>Current engagement score or null if not found</returns>
        Task<MemberEngagementScore?> GetMemberEngagementScore(int memberId);

        /// <summary>
        /// Get engagement scores for all members in a club
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="level">Optional filter by engagement level</param>
        /// <returns>List of engagement scores</returns>
        Task<List<MemberEngagementScore>> GetEngagementScores(int clubId, EngagementLevel? level = null);

        /// <summary>
        /// Get members at risk of disengagement
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="threshold">Score threshold for at-risk classification</param>
        /// <returns>List of at-risk members</returns>
        Task<List<MemberEngagementScore>> GetAtRiskMembers(int clubId, decimal threshold = 40m);

        /// <summary>
        /// Get engagement history for a member
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <param name="daysBack">Number of days of history to retrieve</param>
        /// <returns>List of historical engagement scores</returns>
        Task<List<MemberEngagementHistory>> GetEngagementHistory(int memberId, int daysBack = 90);

        /// <summary>
        /// Update engagement score in real-time based on activity
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <param name="activityType">Type of activity that occurred</param>
        /// <param name="metadata">Additional activity metadata</param>
        /// <returns>Updated engagement score</returns>
        Task<MemberEngagementScore> UpdateEngagementOnActivity(int memberId, string activityType, object? metadata = null);

        /// <summary>
        /// Process engagement alerts for declining engagement
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <returns>List of generated alerts</returns>
        Task<List<MemberEngagementAlert>> ProcessEngagementAlerts(int clubId);

        /// <summary>
        /// Get active engagement alerts for a club
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="severity">Optional filter by alert severity</param>
        /// <returns>List of active alerts</returns>
        Task<List<MemberEngagementAlert>> GetEngagementAlerts(int clubId, AlertSeverity? severity = null);

        /// <summary>
        /// Resolve an engagement alert
        /// </summary>
        /// <param name="alertId">Alert ID</param>
        /// <param name="resolvedByUserId">User resolving the alert</param>
        /// <param name="resolutionNotes">Notes about the resolution</param>
        /// <returns>Resolved alert</returns>
        Task<MemberEngagementAlert> ResolveAlert(int alertId, int resolvedByUserId, string? resolutionNotes = null);

        /// <summary>
        /// Execute bulk action on members by engagement level
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="actionType">Type of bulk action to execute</param>
        /// <param name="targetLevel">Target engagement level</param>
        /// <param name="options">Additional options for the bulk action</param>
        /// <returns>Bulk action result</returns>
        Task<BulkActionResult> ExecuteBulkAction(int clubId, BulkActionType actionType, EngagementLevel targetLevel, BulkActionOptions? options = null);

        /// <summary>
        /// Get engagement trends and analytics for a club
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <param name="daysBack">Number of days to analyze</param>
        /// <returns>Engagement trends data</returns>
        Task<EngagementTrends> GetEngagementTrends(int clubId, int daysBack = 30);

        /// <summary>
        /// Recalculate engagement scores for all members in a club
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <returns>Number of scores recalculated</returns>
        Task<int> RecalculateClubEngagementScores(int clubId);

        /// <summary>
        /// Track member login for engagement scoring
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <param name="sessionId">Session identifier</param>
        /// <param name="platform">Platform used for login</param>
        /// <param name="metadata">Additional login metadata</param>
        /// <returns>Login tracking record</returns>
        Task<MemberLoginTracking> TrackMemberLogin(int memberId, string sessionId, string platform, object? metadata = null);

        /// <summary>
        /// Update profile completeness tracking for a member
        /// </summary>
        /// <param name="memberId">Member ID</param>
        /// <returns>Profile completeness tracking record</returns>
        Task<ProfileCompletenessTracking> UpdateProfileCompleteness(int memberId);

        /// <summary>
        /// Get engagement overview statistics for a club
        /// </summary>
        /// <param name="clubId">Club ID</param>
        /// <returns>Overview statistics</returns>
        Task<EngagementOverview> GetEngagementOverview(int clubId);
    }

    /// <summary>
    /// Result of a bulk action operation
    /// </summary>
    public class BulkActionResult
    {
        public int TotalTargeted { get; set; }
        public int SuccessfulActions { get; set; }
        public int FailedActions { get; set; }
        public List<string> Errors { get; set; } = new();
        public string ActionType { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
    }

    /// <summary>
    /// Options for bulk action operations
    /// </summary>
    public class BulkActionOptions
    {
        public string? EmailTemplate { get; set; }
        public string? MessageContent { get; set; }
        public int? AssignedUserId { get; set; }
        public Dictionary<string, object> CustomProperties { get; set; } = new();
    }

    /// <summary>
    /// Types of bulk actions available
    /// </summary>
    public enum BulkActionType
    {
        SendReEngagementEmail,
        CreateFollowUpTask,
        AssignPersonalOutreach,
        AddToSpecialCampaign,
        UpdateMembershipStatus,
        SchedulePhoneCall,
        InviteToSpecialEvent
    }

    /// <summary>
    /// Engagement trends analytics data
    /// </summary>
    public class EngagementTrends
    {
        public int TotalMembers { get; set; }
        public decimal AverageScore { get; set; }
        public decimal ScoreChange { get; set; }
        public Dictionary<EngagementLevel, int> MembersByLevel { get; set; } = new();
        public Dictionary<string, decimal> ComponentAverages { get; set; } = new();
        public List<DailyEngagementTrend> DailyTrends { get; set; } = new();
        public int AtRiskMembers { get; set; }
        public int NewlyAtRisk { get; set; }
        public int ImprovedMembers { get; set; }
    }

    /// <summary>
    /// Daily engagement trend data point
    /// </summary>
    public class DailyEngagementTrend
    {
        public DateTime Date { get; set; }
        public decimal AverageScore { get; set; }
        public int ActiveMembers { get; set; }
        public Dictionary<EngagementLevel, int> LevelDistribution { get; set; } = new();
    }

    /// <summary>
    /// Engagement overview statistics
    /// </summary>
    public class EngagementOverview
    {
        public int TotalMembers { get; set; }
        public decimal AverageScore { get; set; }
        public int HighlyEngaged { get; set; }
        public int ModeratelyEngaged { get; set; }
        public int AtRisk { get; set; }
        public int ActiveAlerts { get; set; }
        public int CriticalAlerts { get; set; }
        public decimal ScoreTrend { get; set; }
        public DateTime LastCalculated { get; set; }
        public Dictionary<string, decimal> ComponentBreakdown { get; set; } = new();
    }
}