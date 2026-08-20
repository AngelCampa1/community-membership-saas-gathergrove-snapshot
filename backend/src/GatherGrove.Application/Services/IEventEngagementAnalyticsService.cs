using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for event engagement analytics and tracking
/// </summary>
public interface IEventEngagementAnalyticsService
{
    #region Event Interaction Tracking

    /// <summary>
    /// Track event interaction (sign-up, check-in, cancellation, etc.)
    /// </summary>
    /// <param name="request">Interaction tracking request</param>
    /// <returns>Success status</returns>
    Task<bool> TrackEventInteractionAsync(TrackEventInteractionRequest request);

    /// <summary>
    /// Batch track multiple event interactions
    /// </summary>
    /// <param name="requests">List of interaction requests</param>
    /// <returns>Number of successful tracked interactions</returns>
    Task<int> TrackEventInteractionsBatchAsync(List<TrackEventInteractionRequest> requests);

    /// <summary>
    /// Track member check-in with additional engagement data
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="checkInData">Additional check-in data (platform, device, etc.)</param>
    /// <returns>Success status</returns>
    Task<bool> TrackMemberCheckInAsync(int eventId, int memberId, Dictionary<string, object>? checkInData = null);

    /// <summary>
    /// Track member check-out and calculate session metrics
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="checkOutData">Additional check-out data</param>
    /// <returns>Session duration in minutes</returns>
    Task<int?> TrackMemberCheckOutAsync(int eventId, int memberId, Dictionary<string, object>? checkOutData = null);

    #endregion

    #region Engagement Score Calculation

    /// <summary>
    /// Calculate engagement score for a member in a specific event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="memberId">Member ID</param>
    /// <returns>Calculated engagement score</returns>
    Task<decimal> CalculateEventEngagementScoreAsync(int eventId, int memberId);

    /// <summary>
    /// Calculate and update overall member engagement scores
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="clubId">Club ID for context</param>
    /// <returns>Updated member engagement DTO</returns>
    Task<MemberEventEngagementDto> CalculateMemberEngagementScoresAsync(int memberId, int clubId);

    /// <summary>
    /// Recalculate engagement scores for all members in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Number of members processed</returns>
    Task<int> RecalculateClubMemberEngagementScoresAsync(int clubId);

    #endregion

    #region Analytics and Reporting

    /// <summary>
    /// Get event engagement metrics for a specific event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="clubId">Club ID for authorization</param>
    /// <param name="userId">User ID for tier-based authorization</param>
    /// <returns>Event engagement metrics</returns>
    Task<EventEngagementMetricsDto?> GetEventEngagementMetricsAsync(int eventId, int clubId, int userId);

    /// <summary>
    /// Get comprehensive engagement analytics report for a club
    /// </summary>
    /// <param name="query">Analytics query parameters</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Comprehensive analytics report</returns>
    Task<EventEngagementAnalyticsReportDto> GetEventEngagementAnalyticsReportAsync(EventEngagementAnalyticsQuery query, int userId);

    /// <summary>
    /// Get member event engagement scores for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="limit">Maximum number of members to return</param>
    /// <param name="sortBy">Sort criteria</param>
    /// <returns>List of member engagement scores</returns>
    Task<List<MemberEventEngagementDto>> GetMemberEventEngagementScoresAsync(
        int clubId, int userId, int limit = 50, string sortBy = "AverageEventEngagementScore");

    /// <summary>
    /// Get sign-up to attendance conversion rates
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="periodStart">Analysis period start</param>
    /// <param name="periodEnd">Analysis period end</param>
    /// <returns>Conversion rate metrics</returns>
    Task<Dictionary<string, decimal>> GetSignUpToAttendanceConversionRatesAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null);

    #endregion

    #region Event Type and Pattern Analysis

    /// <summary>
    /// Compare engagement across different event types
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="periodStart">Analysis period start</param>
    /// <param name="periodEnd">Analysis period end</param>
    /// <returns>Event type engagement comparison</returns>
    Task<Dictionary<string, EventTypeEngagementDto>> CompareEngagementAcrossEventTypesAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null);

    /// <summary>
    /// Analyze no-show patterns for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="periodStart">Analysis period start</param>
    /// <param name="periodEnd">Analysis period end</param>
    /// <returns>No-show pattern analysis</returns>
    Task<NoShowPatternAnalysisDto> AnalyzeNoShowPatternsAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null);

    /// <summary>
    /// Identify most engaged event participants
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="limit">Number of top participants to return</param>
    /// <param name="periodStart">Analysis period start</param>
    /// <param name="periodEnd">Analysis period end</param>
    /// <returns>List of most engaged members</returns>
    Task<List<MemberEventEngagementDto>> GetMostEngagedEventParticipantsAsync(
        int clubId, int userId, int limit = 10, DateTime? periodStart = null, DateTime? periodEnd = null);

    /// <summary>
    /// Identify at-risk members based on engagement patterns
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="limit">Number of at-risk members to return</param>
    /// <returns>List of at-risk members</returns>
    Task<List<MemberEventEngagementDto>> GetAtRiskMembersAsync(int clubId, int userId, int limit = 10);

    #endregion

    #region Real-time Analytics

    /// <summary>
    /// Get real-time engagement metrics for a live event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="clubId">Club ID for authorization</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Real-time engagement metrics</returns>
    Task<RealTimeEngagementDto?> GetRealTimeEventEngagementAsync(int eventId, int clubId, int userId);

    /// <summary>
    /// Update real-time engagement metrics for an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="engagementData">Real-time engagement data</param>
    /// <returns>Success status</returns>
    Task<bool> UpdateRealTimeEngagementAsync(int eventId, Dictionary<string, object> engagementData);

    #endregion

    #region Utility Methods

    /// <summary>
    /// Calculate member event participation frequency
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="clubId">Club ID</param>
    /// <param name="periodDays">Period in days to analyze</param>
    /// <returns>Participation frequency metrics</returns>
    Task<Dictionary<string, decimal>> GetMemberParticipationFrequencyAsync(int memberId, int clubId, int periodDays = 90);

    /// <summary>
    /// Monitor event satisfaction correlation with engagement
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Correlation analysis results</returns>
    Task<Dictionary<string, object>> GetSatisfactionEngagementCorrelationAsync(int clubId, int userId);

    /// <summary>
    /// Export engagement analytics data for external analysis
    /// </summary>
    /// <param name="query">Analytics query parameters</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="format">Export format (csv, json, xlsx)</param>
    /// <returns>Exported data as byte array</returns>
    Task<byte[]> ExportEngagementAnalyticsAsync(EventEngagementAnalyticsQuery query, int userId, string format = "csv");

    #endregion

    #region Additional Analytics Methods

    /// <summary>
    /// Generate event recommendations for a member
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="maxRecommendations">Maximum number of recommendations</param>
    /// <returns>List of event recommendations</returns>
    Task<List<EventRecommendation>> GenerateEventRecommendationsAsync(int clubId, int memberId, int maxRecommendations = 5);

    /// <summary>
    /// Analyze event performance metrics
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event performance analysis</returns>
    Task<EventPerformanceAnalysis> AnalyzeEventPerformanceAsync(int eventId);

    /// <summary>
    /// Get engagement benchmarks for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Engagement benchmarks</returns>
    Task<EngagementBenchmarks> GetEngagementBenchmarksAsync(int clubId);

    /// <summary>
    /// Predict event success based on historical data
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event success prediction</returns>
    Task<EventSuccessPrediction> PredictEventSuccessAsync(int eventId);

    /// <summary>
    /// Generate comprehensive engagement report
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="reportType">Report type (summary, detailed, comprehensive)</param>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    /// <returns>Engagement report</returns>
    Task<EngagementReport> GenerateEngagementReportAsync(int clubId, string reportType, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Calculate ROI metrics for events
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="periodMonths">Analysis period in months</param>
    /// <returns>ROI metrics</returns>
    Task<EventROIMetrics> CalculateROIMetricsAsync(int clubId, int periodMonths = 6);

    /// <summary>
    /// Calculate engagement trends for a club over time
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="daysBack">Number of days back to analyze</param>
    /// <returns>Engagement trend data</returns>
    Task<List<DailyEngagementTrend>> CalculateEngagementTrendsAsync(int clubId, int userId, int daysBack = 30);

    /// <summary>
    /// Get detailed engagement insights for a specific member
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="memberId">Member ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="periodDays">Analysis period in days</param>
    /// <returns>Member engagement insights</returns>
    Task<MemberEngagementInsights> GetMemberEngagementInsightsAsync(int clubId, int memberId, int userId, int periodDays = 90);

    /// <summary>
    /// Get event engagement analytics summary for a specific event
    /// Requires Expand tier access for authorization
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="clubId">Club ID for authorization</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Event engagement analytics summary</returns>
    Task<EventEngagementAnalytics> GetEventEngagementAnalyticsAsync(int eventId, int clubId, int userId);

    #endregion
}
