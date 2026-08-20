using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using GatherGrove.Domain.Models;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Daily engagement trend data point
/// </summary>
public class DailyEngagementTrend
{
    public DateTime Date { get; set; }
    public decimal EngagementScore { get; set; }
    public int EventCount { get; set; }
    public int AttendeeCount { get; set; }
    public decimal AttendanceRate { get; set; }
}

/// <summary>
/// Date range for analytics queries
/// </summary>
public class DateRange
{
    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string Description { get; set; } = string.Empty;

    public int DaysCount => (EndDate - StartDate).Days + 1;

    public bool IsValid => StartDate <= EndDate;
}

/// <summary>
/// Event engagement analytics summary
/// </summary>
public class EventEngagementAnalytics
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int TotalRegistrations { get; set; }
    public int TotalAttendees { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public decimal SatisfactionRating { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

// MemberEngagementSummary is already defined in FeatureUsageAnalyticsDto.cs

/// <summary>
/// Analysis period metadata
/// </summary>
public class AnalysisPeriod
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string PeriodType { get; set; } = string.Empty; // weekly, monthly, quarterly, custom
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Overall statistics for engagement analytics
/// </summary>
public class OverallStats
{
    public int TotalMembers { get; set; }
    public int ActiveMembers { get; set; }
    public int TotalEvents { get; set; }
    public int TotalAttendances { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public decimal AverageAttendanceRate { get; set; }
    public decimal MemberRetentionRate { get; set; }
    public Dictionary<string, int> EngagementLevelDistribution { get; set; } = new();
    public Dictionary<string, decimal> TrendMetrics { get; set; } = new();
}

/// <summary>
/// Member engagement insights
/// </summary>
public class MemberEngagementInsights
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int ClubId { get; set; }
    public int AnalysisPeriod { get; set; }
    public decimal EventAttendanceRate { get; set; }
    public decimal RsvpAccuracyRate { get; set; }
    public string EngagementTrend { get; set; } = string.Empty;
    public string EngagementLevel { get; set; } = string.Empty;
    public List<string> RecommendedActions { get; set; } = new();
    public decimal AverageEngagementScore { get; set; }
    public int TotalEventsAttended { get; set; }
    public int TotalEventsRegistered { get; set; }
    public DateTime LastEventAttended { get; set; }
    public Dictionary<string, decimal> EngagementMetrics { get; set; } = new();
    public List<DailyEngagementTrend> EngagementTrendData { get; set; } = new();
}

/// <summary>
/// Event engagement factors
/// </summary>
public class EngagementFactors
{
    public Dictionary<string, decimal> EventFactors { get; set; } = new();
    public Dictionary<string, decimal> MemberFactors { get; set; } = new();
    public Dictionary<string, decimal> ContextualFactors { get; set; } = new();
}

/// <summary>
/// Batch processing result for engagement data
/// </summary>
public class BatchProcessingResult
{
    public int TotalEventsProcessed { get; set; }
    public int BatchesProcessed { get; set; }
    public long ProcessingTimeMs { get; set; }
    public DateTime ProcessedAt { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Event recommendation for a member
/// </summary>
public class EventRecommendation
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public decimal RecommendationScore { get; set; }
    public decimal AttendanceProbability { get; set; }
    public string RecommendationReason { get; set; } = string.Empty;
}

/// <summary>
/// Event performance analysis
/// </summary>
public class EventPerformanceAnalysis
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PerformanceScore { get; set; }
    public AttendanceAnalysis AttendanceAnalysis { get; set; } = new();
    public Dictionary<string, object> EngagementBreakdown { get; set; } = new();
    public PerformanceComparison ComparisonToAverage { get; set; } = new();
    public List<string> ImprovementSuggestions { get; set; } = new();
}

/// <summary>
/// Attendance analysis summary
/// </summary>
public class AttendanceAnalysis
{
    public int TotalRsvps { get; set; }
    public int TotalAttended { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal NoShowRate { get; set; }
}

/// <summary>
/// Performance comparison to averages
/// </summary>
public class PerformanceComparison
{
    public decimal AttendanceRateVsAverage { get; set; }
    public decimal EngagementScoreVsAverage { get; set; }
}

/// <summary>
/// Engagement benchmarks for a club
/// </summary>
public class EngagementBenchmarks
{
    public int ClubId { get; set; }
    public decimal AverageAttendanceRate { get; set; }
    public decimal AverageRsvpRate { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public Dictionary<string, decimal> IndustryComparisons { get; set; } = new();
    public Dictionary<string, string> PerformanceIndicators { get; set; } = new();
    public string BenchmarkPeriod { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Event success prediction
/// </summary>
public class EventSuccessPrediction
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PredictedAttendanceRate { get; set; }
    public decimal SuccessProbability { get; set; }
    public string ConfidenceLevel { get; set; } = string.Empty;
    public List<string> RiskFactors { get; set; } = new();
    public List<string> SuccessFactors { get; set; } = new();
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Engagement report
/// </summary>
public class EngagementReport
{
    public int ClubId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public DateRange ReportPeriod { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public string ExecutiveSummary { get; set; } = string.Empty;
    public Dictionary<string, object> KeyMetrics { get; set; } = new();
    public TrendAnalysis TrendAnalysis { get; set; } = new();
    public List<MemberInsightSummary> MemberInsights { get; set; } = new();
    public List<EventAnalysisSummary> EventAnalysis { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>
/// Trend analysis
/// </summary>
public class TrendAnalysis
{
    public string OverallDirection { get; set; } = string.Empty;
    public decimal MonthlyGrowthRate { get; set; }
    public Dictionary<string, decimal> SeasonalPatterns { get; set; } = new();
}

/// <summary>
/// Member insight summary
/// </summary>
public class MemberInsightSummary
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal EngagementScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
}

/// <summary>
/// Event analysis summary
/// </summary>
public class EventAnalysisSummary
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PerformanceScore { get; set; }
    public decimal AttendanceRate { get; set; }
}

/// <summary>
/// Event ROI metrics
/// </summary>
public class EventROIMetrics
{
    public int ClubId { get; set; }
    public int AnalysisPeriodMonths { get; set; }
    public decimal TotalEventCosts { get; set; }
    public decimal TotalMemberValue { get; set; }
    public decimal ROIPercentage { get; set; }
    public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    public Dictionary<string, decimal> ValueDrivers { get; set; } = new();
    public decimal CostPerMember { get; set; }
    public decimal ValuePerMember { get; set; }
}

/// <summary>
/// Member engagement detail
/// </summary>
public class MemberEngagementDetail
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal EngagementScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public DateTime LastActivity { get; set; }
}

#region Advanced Analytics DTOs - US-004

/// <summary>
/// Request DTO for engagement trends analysis
/// </summary>
public class EngagementTrendsRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ClubId must be greater than 0")]
    public int ClubId { get; set; }

    [Range(1, 365, ErrorMessage = "DaysBack must be between 1 and 365")]
    public int DaysBack { get; set; } = 90;

    public bool IncludeSeasonalAnalysis { get; set; } = true;
    public bool IncludeTrendProjections { get; set; } = false;
}

/// <summary>
/// Request DTO for cohort analysis
/// </summary>
public class CohortAnalysisRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ClubId must be greater than 0")]
    public int ClubId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string GroupBy { get; set; } = "Month"; // Month, Week, Quarter
    public bool IncludeLifetimeValue { get; set; } = true;
}

/// <summary>
/// Request DTO for event performance comparison
/// </summary>
public class CompareEventsRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ClubId must be greater than 0")]
    public int ClubId { get; set; }

    [Required]
    [MinLength(2, ErrorMessage = "At least 2 events are required for comparison")]
    [MaxLength(10, ErrorMessage = "Maximum 10 events can be compared at once")]
    public List<int> EventIds { get; set; } = new();

    public List<string> MetricsToCompare { get; set; } = new() { "Attendance", "Engagement", "ROI" };
    public bool IncludeStatisticalSignificance { get; set; } = false;
}

/// <summary>
/// Request DTO for member segmentation
/// </summary>
public class MemberSegmentationRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ClubId must be greater than 0")]
    public int ClubId { get; set; }

    [Required]
    public MemberSegmentationCriteria Criteria { get; set; } = new();
}

/// <summary>
/// Member segmentation criteria
/// </summary>
public class MemberSegmentationCriteria
{
    public decimal EngagementThreshold { get; set; } = 0.5m;
    public decimal AttendanceThreshold { get; set; } = 0.3m;
    public int PeriodDays { get; set; } = 90;
    public List<string> SegmentationTypes { get; set; } = new() { "Engagement", "Attendance" };
    public int MinimumSegmentSize { get; set; } = 10;
    public bool IncludeBehavioralPatterns { get; set; } = true;
    public bool IncludeActionableInsights { get; set; } = true;
    public DateTime? AnalysisStartDate { get; set; }
    public DateTime? AnalysisEndDate { get; set; }
}

/// <summary>
/// Request DTO for analytics data export - US-004
/// </summary>
public class AdvancedExportAnalyticsRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "ClubId must be greater than 0")]
    public int ClubId { get; set; }

    [Required]
    [StringLength(50, ErrorMessage = "DataType must be specified and cannot exceed 50 characters")]
    public string DataType { get; set; } = string.Empty; // EngagementTrends, CohortAnalysis, EventComparison, etc.

    [Required]
    [RegularExpression(@"^(PDF|Excel|CSV)$", ErrorMessage = "ExportFormat must be PDF, Excel, or CSV")]
    public string ExportFormat { get; set; } = "PDF";

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<string>? SpecificMetrics { get; set; }
    public string? CustomFileName { get; set; }
    public bool IncludeCharts { get; set; } = true;
    public bool IncludeRawData { get; set; } = false;
    public bool IncludePrivacySensitiveData { get; set; } = false;
    public bool IncludeDetailedMetrics { get; set; } = true;

    /// <summary>
    /// Custom filters for advanced export analytics
    /// </summary>
    public Dictionary<string, object> CustomFilters { get; set; } = new();
}

/// <summary>
/// Advanced event engagement trends response - US-004
/// </summary>
public class AdvancedEventEngagementTrends
{
    public int ClubId { get; set; }
    public int PeriodDays { get; set; }
    public List<DailyEngagementTrend> DailyTrends { get; set; } = new();
    public double AverageEngagementScore { get; set; }
    public List<EventEngagementData> Events { get; set; } = new();
    public Dictionary<DateTime, double> TrendData { get; set; } = new();
    public double OverallTrend { get; set; }
    public Dictionary<string, object> SeasonalPatterns { get; set; } = new();
    public List<string> Insights { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

// CohortAnalysisResult is now defined in AdvancedAnalyticsDto.cs - avoiding duplicate

/// <summary>
/// Advanced event performance comparison result - US-004
/// </summary>
public class AdvancedEventPerformanceComparison
{
    public List<EventPerformanceData> EventPerformances { get; set; } = new();
    public Dictionary<string, object> ComparisonMetrics { get; set; } = new();
    public EventPerformanceData? BestPerformingEvent { get; set; }
    public EventPerformanceData? WorstPerformingEvent { get; set; }
    public List<string> KeyFindings { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public bool StatisticalSignificance { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Member segmentation result
/// </summary>
public class MemberSegmentationResult
{
    public List<MemberSegment> Segments { get; set; } = new();
    public Dictionary<string, int> SegmentDistribution { get; set; } = new();
    public List<BehavioralPattern> BehavioralPatterns { get; set; } = new();
    public List<ActionableInsight> ActionableInsights { get; set; } = new();
    public int TotalMembersAnalyzed { get; set; }
    public DateTime AnalysisDate { get; set; } = DateTime.UtcNow;
}

// Note: EventEngagementTrends, CohortAnalysisResponse, FinancialRoiAnalysis, 
// EventPerformanceComparison, and MemberSegmentationAnalysis DTOs are defined 
// in AdvancedAnalyticsDto.cs to avoid duplication

/// <summary>
/// Cohort data for cohort analysis
/// </summary>
public class CohortData
{
    public string CohortName { get; set; } = string.Empty;
    public DateTime CohortStartDate { get; set; }
    public int InitialSize { get; set; }
    public Dictionary<string, double> RetentionRatesByPeriod { get; set; } = new();
    public double AverageLifetimeValue { get; set; }
    public double ChurnRate { get; set; }
}

/// <summary>
/// Retention insight for cohort analysis
/// </summary>
public class RetentionInsight
{
    public string InsightType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ImpactScore { get; set; }
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Cohort analysis metadata
/// </summary>
public class CohortAnalysisMetadata
{
    public DateTime AnalysisStartDate { get; set; }
    public DateTime AnalysisEndDate { get; set; }
    public string GroupingPeriod { get; set; } = "Month";
    public int TotalCohortsAnalyzed { get; set; }
    public int TotalMembersIncluded { get; set; }
}

/// <summary>
/// Event performance data for comparisons
/// </summary>
public class EventPerformanceData
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public int TotalAttendees { get; set; }
    public int TotalRegistrations { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public decimal Revenue { get; set; }
    public decimal Costs { get; set; }
    public double ROI { get; set; }
    public string PerformanceRating { get; set; } = string.Empty;
}

/// <summary>
/// Member segment for segmentation analysis
/// </summary>
public class MemberSegment
{
    public string SegmentName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public double AverageEngagementScore { get; set; }
    public decimal AverageLifetimeValue { get; set; }
    public double ChurnRisk { get; set; }
    public List<string> Characteristics { get; set; } = new();
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Behavioral pattern for member analysis
/// </summary>
public class BehavioralPattern
{
    public string PatternName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Frequency { get; set; }
    public double ImpactScore { get; set; }
    public List<string> AffectedSegments { get; set; } = new();
}

/// <summary>
/// Actionable insight for analytics
/// </summary>
public class ActionableInsight
{
    public string InsightType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public List<string> RecommendedActions { get; set; } = new();
    public double PotentialImpact { get; set; }
    public string Category { get; set; } = string.Empty;
}

/// <summary>
/// Event engagement data for trends
/// </summary>
public class EventEngagementData
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal EngagementScore { get; set; }
    public int AttendeeCount { get; set; }
    public decimal AttendanceRate { get; set; }
    public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
}

#endregion

/// <summary>
/// Event comparison response for advanced analytics
/// </summary>
public class EventComparisonResponse
{
    public int ClubId { get; set; }
    public List<EventComparisonData> EventComparisons { get; set; } = new();
    public EventComparisonData TopPerformingEvent { get; set; } = new();
}

/// <summary>
/// Event comparison data
/// </summary>
public class EventComparisonData
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public decimal Revenue { get; set; }
    public decimal Costs { get; set; }
    public decimal ROI { get; set; }
}

/// <summary>
/// Member segmentation response
/// </summary>
public class MemberSegmentationResponse
{
    public int ClubId { get; set; }
    public MemberSegmentationCriteria SegmentationCriteria { get; set; } = new();
    public Dictionary<string, List<MemberSegmentData>> Segments { get; set; } = new();
}

/// <summary>
/// Member segment data
/// </summary>
public class MemberSegmentData
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
}


