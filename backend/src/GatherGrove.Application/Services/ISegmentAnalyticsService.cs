using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for segment analytics and performance metrics
/// Provides functionality for calculating segment performance, trends, and insights
/// </summary>
public interface ISegmentAnalyticsService
{
    /// <summary>
    /// Gets analytics for a specific segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment analytics response</returns>
    Task<SegmentAnalyticsResponse> GetSegmentAnalyticsAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Gets analytics for all segments in a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of segment analytics</returns>
    Task<IEnumerable<SegmentAnalyticsResponse>> GetAllSegmentAnalyticsAsync(int clubId, int userId);

    /// <summary>
    /// Calculates engagement score for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days to analyze</param>
    /// <returns>Engagement score (0-100)</returns>
    Task<double> CalculateSegmentEngagementAsync(int clubId, int segmentId, int userId, int days = 30);

    /// <summary>
    /// Calculates event attendance rate for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days to analyze</param>
    /// <returns>Attendance rate as percentage</returns>
    Task<double> CalculateEventAttendanceRateAsync(int clubId, int segmentId, int userId, int days = 30);

    /// <summary>
    /// Calculates payment compliance rate for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days to analyze</param>
    /// <returns>Payment compliance rate as percentage</returns>
    Task<double> CalculatePaymentComplianceRateAsync(int clubId, int segmentId, int userId, int days = 30);

    /// <summary>
    /// Gets performance metrics for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>List of performance metrics</returns>
    Task<IEnumerable<SegmentPerformanceMetricResponse>> GetSegmentPerformanceMetricsAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Creates a custom performance metric for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The performance metric creation request</param>
    /// <returns>Created performance metric response</returns>
    Task<SegmentPerformanceMetricResponse> CreatePerformanceMetricAsync(int clubId, int segmentId, int userId, CreateSegmentPerformanceMetricRequest request);

    /// <summary>
    /// Updates an existing performance metric
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="metricId">The metric ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The performance metric update request</param>
    /// <returns>Updated performance metric response</returns>
    Task<SegmentPerformanceMetricResponse> UpdatePerformanceMetricAsync(int clubId, int segmentId, int metricId, int userId, UpdateSegmentPerformanceMetricRequest request);

    /// <summary>
    /// Deletes a performance metric
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="metricId">The metric ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeletePerformanceMetricAsync(int clubId, int segmentId, int metricId, int userId);

    /// <summary>
    /// Compares performance across multiple segments
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentIds">List of segment IDs to compare</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment comparison result</returns>
    Task<SegmentComparisonResult> GetSegmentComparisonAsync(int clubId, IEnumerable<int> segmentIds, int userId);

    /// <summary>
    /// Gets trend data for a segment over time
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="days">Number of days to analyze</param>
    /// <returns>Segment trend data</returns>
    Task<SegmentTrendResult> GetSegmentTrendsAsync(int clubId, int segmentId, int userId, int days = 30);

    /// <summary>
    /// Generates a comprehensive report for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The report generation request</param>
    /// <returns>Generated segment report</returns>
    Task<SegmentReportResult> GenerateSegmentReportAsync(int clubId, int segmentId, int userId, GenerateSegmentReportRequest request);

    /// <summary>
    /// Refreshes analytics for a segment by recalculating all metrics
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>True if refresh was successful</returns>
    Task<bool> RefreshSegmentAnalyticsAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Gets AI-generated insights and recommendations for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment insights and recommendations</returns>
    Task<SegmentInsightsResult> GetSegmentInsightsAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Calculates a specific metric by type
    /// </summary>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="metricName">The metric name</param>
    /// <param name="metricType">The metric type (COUNT, PERCENTAGE, AVERAGE, SUM, RATIO)</param>
    /// <returns>Calculated metric value</returns>
    Task<double> CalculateMetricByTypeAsync(int segmentId, string metricName, string metricType);

    /// <summary>
    /// Gets segment health score based on various factors
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Segment health score and indicators</returns>
    Task<SegmentHealthScoreResult> GetSegmentHealthScoreAsync(int clubId, int segmentId, int userId);

    /// <summary>
    /// Schedules automatic analytics refresh for a segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="schedule">The refresh schedule configuration</param>
    /// <returns>True if scheduled successfully</returns>
    Task<bool> ScheduleAnalyticsRefreshAsync(int clubId, int segmentId, int userId, AnalyticsRefreshSchedule schedule);

    /// <summary>
    /// Gets segment analytics dashboard data
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="dateRange">Number of days to include in dashboard</param>
    /// <returns>Dashboard data for all segments</returns>
    Task<SegmentAnalyticsDashboardResult> GetAnalyticsDashboardAsync(int clubId, int userId, int dateRange = 30);

    /// <summary>
    /// Gets segment analytics dashboard
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="daysBack">Number of days to include in dashboard</param>
    /// <returns>Dashboard data for all segments</returns>
    Task<SegmentAnalyticsDashboard> GetSegmentAnalyticsDashboardAsync(int clubId, int userId, int daysBack);

    /// <summary>
    /// Gets detailed analytics for a specific segment
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="segmentId">The segment ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="daysBack">Number of days to include in analysis</param>
    /// <param name="includeMembers">Include member list in response</param>
    /// <returns>Detailed segment analytics</returns>
    Task<DetailedSegmentAnalytics> GetSegmentAnalyticsAsync(int clubId, int segmentId, int userId, int daysBack, bool includeMembers);

    /// <summary>
    /// Compares multiple segments
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The segment comparison request</param>
    /// <returns>Segment comparison results</returns>
    Task<SegmentComparisonResult> CompareSegmentsAsync(int clubId, int userId, SegmentComparisonRequest request);

    /// <summary>
    /// Gets engagement trends for segments
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The engagement trends request</param>
    /// <returns>Segment engagement trends</returns>
    Task<SegmentEngagementTrends> GetSegmentEngagementTrendsAsync(int clubId, int userId, SegmentEngagementTrendsRequest request);

    /// <summary>
    /// Gets member growth and churn analysis by segments
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The growth analysis request</param>
    /// <returns>Segment growth and churn analysis</returns>
    Task<SegmentGrowthAnalysis> GetSegmentGrowthAnalysisAsync(int clubId, int userId, SegmentGrowthAnalysisRequest request);

    /// <summary>
    /// Gets segment performance metrics and KPIs
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="segmentIds">List of segment IDs to analyze (optional)</param>
    /// <param name="includeProjections">Include future projections in metrics</param>
    /// <returns>Segment performance metrics</returns>
    Task<SegmentPerformanceMetrics> GetSegmentPerformanceMetricsAsync(int clubId, int userId, List<int>? segmentIds, bool includeProjections);

    /// <summary>
    /// Exports segment analytics data
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The export request details</param>
    /// <returns>Analytics export result</returns>
    Task<AnalyticsExportResult> ExportSegmentAnalyticsAsync(int clubId, int userId, AnalyticsExportRequest request);

    /// <summary>
    /// Gets actionable insights and recommendations for segments
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="segmentId">Optional specific segment ID to analyze</param>
    /// <param name="focusArea">Optional focus area for insights</param>
    /// <returns>Segment insights and recommendations</returns>
    Task<SegmentInsightsResponse> GetSegmentInsightsAsync(int clubId, int userId, int? segmentId, string? focusArea);
}