using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Models;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for exporting analytics data
/// </summary>
public class ExportAnalyticsRequest
{
    [Required]
    public int ClubId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public string DataType { get; set; } = string.Empty; // EngagementTrends, CohortAnalysis, etc.

    [Required]
    public string ExportFormat { get; set; } = "PDF"; // PDF, Excel, CSV

    [Required]
    public string ExportType { get; set; } = string.Empty; // PDF, Excel, CSV (legacy compatibility)

    public List<string> IncludedMetrics { get; set; } = new();
    public bool IncludeCharts { get; set; }
    public string ReportTitle { get; set; } = string.Empty;
}

/// <summary>
/// Event engagement trends response
/// </summary>
public class EventEngagementTrends
{
    public int ClubId { get; set; }
    public int PeriodDays { get; set; }
    public string TrendDirection { get; set; } = string.Empty;
    public decimal GrowthRate { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public List<DailyEngagementTrend> DailyTrends { get; set; } = new();
    public List<EventEngagementData> Events { get; set; } = new();
    public Dictionary<DateTime, double> TrendData { get; set; } = new();
    public double OverallTrend { get; set; }
    public string TrendDescription { get; set; } = string.Empty;
    public List<string> KeyInsights { get; set; } = new();
    public Dictionary<string, double> Benchmarks { get; set; } = new();
}

/// <summary>
/// Cohort analysis response
/// </summary>
public class CohortAnalysisResponse
{
    public int ClubId { get; set; }
    public AnalysisPeriod AnalysisPeriod { get; set; } = new();
    public Dictionary<string, CohortInfo> CohortData { get; set; } = new();
    public List<RetentionTrendPoint> RetentionTrends { get; set; } = new();
    public List<MemberCohortData> Cohorts { get; set; } = new();
    public Dictionary<string, double> OverallMetrics { get; set; } = new();
    public List<string> Insights { get; set; } = new();
    public string RecommendedStrategy { get; set; } = string.Empty;
}

/// <summary>
/// Cohort information for analytics
/// </summary>
public class CohortInfo
{
    public int Size { get; set; }
    public double RetentionRate { get; set; }
    public double ChurnRate { get; set; }
    public double AverageLifetimeValue { get; set; }
}

/// <summary>
/// Cohort analysis result with required properties
/// </summary>
public class CohortAnalysisResult
{
    public int ClubId { get; set; }
    public string AnalysisPeriod { get; set; } = string.Empty;
    public List<CohortMetrics> CohortData { get; set; } = new();
    public List<RetentionTrendPoint> RetentionTrends { get; set; } = new();
    public List<CohortData> Cohorts { get; set; } = new();
    public Dictionary<string, double> RetentionRates { get; set; } = new();
    public double AverageRetentionRate { get; set; }
    public List<RetentionInsight> Insights { get; set; } = new();
    public DateTime AnalysisPeriodStart { get; set; }
    public DateTime AnalysisPeriodEnd { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Cohort metrics for analysis
/// </summary>
public class CohortMetrics
{
    public string CohortName { get; set; } = string.Empty;
    public DateTime CohortStartDate { get; set; }
    public int InitialSize { get; set; }
    public Dictionary<string, double> RetentionRatesByPeriod { get; set; } = new();
    public double AverageLifetimeValue { get; set; }
    public double ChurnRate { get; set; }
}

/// <summary>
/// Retention trend point for trend analysis
/// </summary>
public class RetentionTrendPoint
{
    public DateTime Period { get; set; }
    public double RetentionRate { get; set; }
    public int CohortCount { get; set; }
}

/// <summary>
/// Financial ROI analysis response
/// </summary>
public class FinancialRoiAnalysis
{
    public FinancialMetricsData OverallMetrics { get; set; } = new();
    public Dictionary<string, FinancialMetricsData> ByCategory { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public Dictionary<DateTime, double> TrendAnalysis { get; set; } = new();
}

/// <summary>
/// Event performance comparison response
/// </summary>
public class EventPerformanceComparison
{
    public List<EventPerformanceData> Events { get; set; } = new();
    public EventPerformanceData BestPerforming { get; set; } = new();
    public EventPerformanceData WorstPerforming { get; set; } = new();
    public Dictionary<string, double> AverageMetrics { get; set; } = new();
    public List<string> SuccessPatterns { get; set; } = new();
    public List<string> ImprovementOpportunities { get; set; } = new();
}

/// <summary>
/// Member segmentation analysis response
/// </summary>
public class MemberSegmentationAnalysis
{
    public List<MemberEngagementPattern> Segments { get; set; } = new();
    public Dictionary<string, int> SegmentSizes { get; set; } = new();
    public Dictionary<string, string> SegmentCharacteristics { get; set; } = new();
    public List<string> ActionableInsights { get; set; } = new();
    public Dictionary<string, List<string>> RecommendedActions { get; set; } = new();
}

// Note: MemberCohortData, FinancialMetricsData, and MemberEngagementPattern 
// are defined in GatherGrove.Domain.Models to avoid duplication
