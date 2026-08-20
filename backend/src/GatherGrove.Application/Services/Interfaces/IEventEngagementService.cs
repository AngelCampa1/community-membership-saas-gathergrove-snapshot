using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for managing event engagement analysis and tracking
/// </summary>
public interface IEventEngagementService
{
    #region Event Attendance & Participation

    /// <summary>
    /// Record member attendance at an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="attendedAt">Attendance timestamp (optional, defaults to now)</param>
    /// <param name="notes">Optional attendance notes</param>
    /// <returns>Event attendance record</returns>
    Task<EventAttendance> RecordEventAttendanceAsync(int eventId, int memberId, DateTime? attendedAt = null, string? notes = null);

    /// <summary>
    /// Update event RSVP and trigger engagement recalculation
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="rsvpStatus">RSVP status</param>
    /// <returns>Updated RSVP record</returns>
    Task<EventRsvp> UpdateEventRsvpAsync(int eventId, int memberId, string rsvpStatus);

    /// <summary>
    /// Get attendance records for an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>List of attendance records</returns>
    Task<List<EventAttendance>> GetEventAttendanceAsync(int eventId);

    /// <summary>
    /// Get member's event attendance history
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to look back</param>
    /// <returns>Member's attendance history</returns>
    Task<List<EventAttendance>> GetMemberAttendanceHistoryAsync(int memberId, int daysBack = 365);

    #endregion

    #region Event Engagement Scoring

    /// <summary>
    /// Calculate engagement score for a specific event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event engagement metrics</returns>
    Task<EventEngagementMetrics> CalculateEventEngagementScoreAsync(int eventId);

    /// <summary>
    /// Calculate member's event participation score
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Event participation score (0-100)</returns>
    Task<decimal> CalculateMemberEventScoreAsync(int memberId, int daysBack = 90);

    /// <summary>
    /// Analyze event impact on overall member engagement
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event impact analysis</returns>
    Task<EventImpactAnalysis> AnalyzeEventImpactAsync(int eventId);

    /// <summary>
    /// Get event engagement trends over time
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Event engagement trends</returns>
    Task<EventEngagementTrendsDto> GetEventEngagementTrendsAsync(int clubId, int daysBack = 90);

    #endregion

    #region Event Analytics & Reporting

    /// <summary>
    /// Generate comprehensive event analytics report
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event analytics report</returns>
    Task<EventAnalyticsReport> GenerateEventReportAsync(int eventId);

    /// <summary>
    /// Get club-wide event engagement overview
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Club event engagement overview</returns>
    Task<ClubEventEngagementOverview> GetClubEventOverviewAsync(int clubId);

    /// <summary>
    /// Identify events with highest engagement rates
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="limit">Number of top events to return</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Top performing events</returns>
    Task<List<EventEngagementMetrics>> GetTopPerformingEventsAsync(int clubId, int limit = 10, int daysBack = 365);

    /// <summary>
    /// Identify members with low event engagement
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="threshold">Engagement threshold (0-100)</param>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Members with low event engagement</returns>
    Task<List<MemberEventEngagement>> GetLowEventEngagementMembersAsync(int clubId, decimal threshold = 30m, int daysBack = 90);

    #endregion

    #region Event Recommendations

    /// <summary>
    /// Generate event recommendations for a member based on engagement patterns
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="limit">Number of recommendations to return</param>
    /// <returns>Event recommendations</returns>
    Task<List<EventRecommendation>> GetEventRecommendationsAsync(int memberId, int limit = 5);

    /// <summary>
    /// Predict event attendance based on member engagement patterns
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <returns>Attendance prediction</returns>
    Task<EventAttendancePrediction> PredictEventAttendanceAsync(int eventId, int memberId);

    /// <summary>
    /// Get optimal event timing suggestions based on member engagement data
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Event timing recommendations</returns>
    Task<EventTimingRecommendations> GetOptimalEventTimingsAsync(int clubId);

    #endregion

    #region Real-time Updates

    /// <summary>
    /// Update member engagement score after event activity
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="eventActivityType">Type of event activity</param>
    /// <param name="eventId">Event ID</param>
    /// <param name="metadata">Additional activity metadata</param>
    /// <returns>Updated engagement score</returns>
    Task<MemberEngagementScore> UpdateEngagementAfterEventActivityAsync(int memberId, string eventActivityType, int eventId, object? metadata = null);

    /// <summary>
    /// Process batch event engagement updates
    /// </summary>
    /// <param name="updates">List of engagement updates</param>
    /// <returns>Processing results</returns>
    Task<BatchUpdateResult> ProcessBatchEventEngagementUpdatesAsync(List<EventEngagementUpdate> updates);

    #endregion
}

#region Data Transfer Objects

/// <summary>
/// Event engagement metrics
/// </summary>
public class EventEngagementMetrics
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int TotalInvited { get; set; }
    public int TotalRsvps { get; set; }
    public int TotalAttended { get; set; }
    public decimal RsvpRate { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public EngagementLevel EngagementLevel { get; set; }
    public Dictionary<string, decimal> MemberTypeBreakdown { get; set; } = new();
    public List<string> TopEngagementFactors { get; set; } = new();
}

/// <summary>
/// Event impact analysis on member engagement
/// </summary>
public class EventImpactAnalysis
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public decimal PreEventAverageScore { get; set; }
    public decimal PostEventAverageScore { get; set; }
    public decimal EngagementImpact { get; set; }
    public int MembersPositivelyImpacted { get; set; }
    public int MembersNegativelyImpacted { get; set; }
    public List<MemberEngagementChange> MemberChanges { get; set; } = new();
}

/// <summary>
/// Event engagement trends over time
/// </summary>
public class EventEngagementTrendsDto
{
    public int ClubId { get; set; }
    public List<DailyEventEngagement> DailyTrends { get; set; } = new();
    public decimal AverageEngagementScore { get; set; }
    public decimal TrendDirection { get; set; } // Positive for improving, negative for declining
    public int TotalEvents { get; set; }
    public int TotalAttendances { get; set; }
}

/// <summary>
/// Daily event engagement data
/// </summary>
public class DailyEventEngagement
{
    public DateTime Date { get; set; }
    public int EventsHeld { get; set; }
    public int TotalAttendance { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public List<EventEngagementMetrics> Events { get; set; } = new();
}

/// <summary>
/// Comprehensive event analytics report
/// </summary>
public class EventAnalyticsReport
{
    public int EventId { get; set; }
    public EventEngagementMetrics Metrics { get; set; } = new();
    public EventImpactAnalysis Impact { get; set; } = new();
    public List<MemberEventEngagement> MemberEngagement { get; set; } = new();
    public Dictionary<string, object> CustomMetrics { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Club-wide event engagement overview
/// </summary>
public class ClubEventEngagementOverview
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
    public int TotalMembers { get; set; }
    public decimal AverageEventAttendance { get; set; }
    public decimal ClubEventEngagementScore { get; set; }
    public EventEngagementTrendsDto Trends { get; set; } = new();
    public List<EventEngagementMetrics> TopEvents { get; set; } = new();
    public List<MemberEventEngagement> LowEngagementMembers { get; set; } = new();
}

/// <summary>
/// Member event engagement details
/// </summary>
public class MemberEventEngagement
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int EventsInvited { get; set; }
    public int EventsRsvped { get; set; }
    public int EventsAttended { get; set; }
    public decimal EventEngagementScore { get; set; }
    public EngagementLevel EngagementLevel { get; set; }
    public DateTime LastEventAttendance { get; set; }
    public List<string> PreferredEventTypes { get; set; } = new();
}

/// <summary>
/// Event recommendation for a member
/// </summary>
public class EventRecommendation
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal RecommendationScore { get; set; }
    public List<string> RecommendationReasons { get; set; } = new();
    public decimal AttendanceProbability { get; set; }
}

/// <summary>
/// Event attendance prediction
/// </summary>
public class EventAttendancePrediction
{
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public decimal AttendanceProbability { get; set; }
    public string PredictionConfidence { get; set; } = string.Empty; // Low, Medium, High
    public List<string> InfluencingFactors { get; set; } = new();
    public Dictionary<string, decimal> FactorWeights { get; set; } = new();
}

/// <summary>
/// Event timing recommendations
/// </summary>
public class EventTimingRecommendations
{
    public int ClubId { get; set; }
    public List<OptimalTimeSlot> OptimalTimeSlots { get; set; } = new();
    public Dictionary<DayOfWeek, decimal> DayPreferences { get; set; } = new();
    public Dictionary<int, decimal> HourPreferences { get; set; } = new();
    public string RecommendedFrequency { get; set; } = string.Empty;
}

/// <summary>
/// Optimal time slot for events
/// </summary>
public class OptimalTimeSlot
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public decimal EngagementScore { get; set; }
    public int HistoricalAttendance { get; set; }
}

/// <summary>
/// Member engagement change after event
/// </summary>
public class MemberEngagementChange
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal PreEventScore { get; set; }
    public decimal PostEventScore { get; set; }
    public decimal ScoreChange { get; set; }
    public bool Attended { get; set; }
}

/// <summary>
/// Event engagement update for batch processing
/// </summary>
public class EventEngagementUpdate
{
    public int MemberId { get; set; }
    public int EventId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public DateTime ActivityTime { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Batch update processing result
/// </summary>
public class BatchUpdateResult
{
    public int TotalProcessed { get; set; }
    public int SuccessfulUpdates { get; set; }
    public int FailedUpdates { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime ProcessedAt { get; set; }
}

#endregion