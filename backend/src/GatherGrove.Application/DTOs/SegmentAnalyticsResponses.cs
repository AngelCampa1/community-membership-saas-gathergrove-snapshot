namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment performance metrics
/// </summary>
public class SegmentPerformanceMetricResponse
{
    /// <summary>
    /// Unique identifier for the metric
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Club this metric belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name for reference
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Metric type
    /// </summary>
    public SegmentMetricType MetricType { get; set; }

    /// <summary>
    /// Metric name
    /// </summary>
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Current metric value
    /// </summary>
    public decimal CurrentValue { get; set; }

    /// <summary>
    /// Previous period value for comparison
    /// </summary>
    public decimal? PreviousValue { get; set; }

    /// <summary>
    /// Change from previous period
    /// </summary>
    public decimal? Change { get; set; }

    /// <summary>
    /// Percentage change from previous period
    /// </summary>
    public decimal? PercentageChange { get; set; }

    /// <summary>
    /// Trend direction
    /// </summary>
    public TrendDirection Trend { get; set; }

    /// <summary>
    /// Metric calculation method
    /// </summary>
    public MetricCalculationMethod CalculationMethod { get; set; }

    /// <summary>
    /// When the metric was last calculated
    /// </summary>
    public DateTime LastCalculated { get; set; }

    /// <summary>
    /// Whether the metric is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Historical values for trending
    /// </summary>
    public List<MetricHistoricalValue> HistoricalValues { get; set; } = new();

    /// <summary>
    /// When the metric was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User who created the metric
    /// </summary>
    public string CreatedByUserName { get; set; } = string.Empty;
}

/// <summary>
/// Result of segment comparison analysis
/// </summary>
public class SegmentComparisonResult
{
    /// <summary>
    /// Primary segment being compared
    /// </summary>
    public SegmentComparisonData PrimarySegment { get; set; } = new();

    /// <summary>
    /// Comparison segments
    /// </summary>
    public List<SegmentComparisonData> ComparisonSegments { get; set; } = new();

    /// <summary>
    /// Metrics used in comparison
    /// </summary>
    public List<ComparisonMetric> Metrics { get; set; } = new();

    /// <summary>
    /// Key insights from the comparison
    /// </summary>
    public List<ComparisonInsight> Insights { get; set; } = new();

    /// <summary>
    /// When the comparison was performed
    /// </summary>
    public DateTime ComparisonDate { get; set; }

    /// <summary>
    /// Date range for the comparison data
    /// </summary>
    public DateRange DateRange { get; set; } = new();
}

/// <summary>
/// Result of segment trend analysis
/// </summary>
public class SegmentTrendResult
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Trend data points
    /// </summary>
    public List<TrendDataPoint> TrendData { get; set; } = new();

    /// <summary>
    /// Overall trend direction
    /// </summary>
    public TrendDirection OverallTrend { get; set; }

    /// <summary>
    /// Trend strength (0-1)
    /// </summary>
    public decimal TrendStrength { get; set; }

    /// <summary>
    /// Seasonal patterns detected
    /// </summary>
    public List<SeasonalPattern> SeasonalPatterns { get; set; } = new();

    /// <summary>
    /// Forecast for next period
    /// </summary>
    public TrendForecast? Forecast { get; set; }

    /// <summary>
    /// Analysis period
    /// </summary>
    public DateRange AnalysisPeriod { get; set; } = new();
}

/// <summary>
/// Result of segment report generation
/// </summary>
public class SegmentReportResult
{
    /// <summary>
    /// Report ID
    /// </summary>
    public int ReportId { get; set; }

    /// <summary>
    /// Report type
    /// </summary>
    public SegmentReportType ReportType { get; set; }

    /// <summary>
    /// Report title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Summary of the report
    /// </summary>
    public ReportSummary Summary { get; set; } = new();

    /// <summary>
    /// Detailed sections of the report
    /// </summary>
    public List<ReportSection> Sections { get; set; } = new();

    /// <summary>
    /// Key findings and insights
    /// </summary>
    public List<ReportInsight> KeyFindings { get; set; } = new();

    /// <summary>
    /// Recommendations based on the analysis
    /// </summary>
    public List<string> Recommendations { get; set; } = new();

    /// <summary>
    /// Download URL for the report file
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// When the report was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// Report parameters used
    /// </summary>
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// Result of segment insights analysis
/// </summary>
public class SegmentInsightsResult
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Key insights discovered
    /// </summary>
    public List<SegmentInsight> Insights { get; set; } = new();

    /// <summary>
    /// Anomalies detected
    /// </summary>
    public List<SegmentAnomaly> Anomalies { get; set; } = new();

    /// <summary>
    /// Recommended actions
    /// </summary>
    public List<RecommendedAction> RecommendedActions { get; set; } = new();

    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public decimal HealthScore { get; set; }

    /// <summary>
    /// Risk assessment
    /// </summary>
    public RiskAssessment RiskAssessment { get; set; } = new();

    /// <summary>
    /// When the analysis was performed
    /// </summary>
    public DateTime AnalysisDate { get; set; }
}

/// <summary>
/// Result of segment health score calculation
/// </summary>
public class SegmentHealthScoreResult
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public decimal OverallScore { get; set; }

    /// <summary>
    /// Score breakdown by component
    /// </summary>
    public HealthScoreComponents ScoreComponents { get; set; } = new();

    /// <summary>
    /// Health grade (A, B, C, D, F)
    /// </summary>
    public string HealthGrade { get; set; } = string.Empty;

    /// <summary>
    /// Areas of concern
    /// </summary>
    public List<HealthConcern> Concerns { get; set; } = new();

    /// <summary>
    /// Areas of strength
    /// </summary>
    public List<string> Strengths { get; set; } = new();

    /// <summary>
    /// Improvement suggestions
    /// </summary>
    public List<string> Improvements { get; set; } = new();

    /// <summary>
    /// Historical health scores
    /// </summary>
    public List<HealthScoreHistory> HistoricalScores { get; set; } = new();

    /// <summary>
    /// When the score was calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Analytics dashboard data
/// </summary>
public class SegmentAnalyticsDashboardResult
{
    /// <summary>
    /// Overview statistics
    /// </summary>
    public DashboardOverview Overview { get; set; } = new();

    /// <summary>
    /// Top performing segments
    /// </summary>
    public List<SegmentPerformanceSummary> TopSegments { get; set; } = new();

    /// <summary>
    /// Segments needing attention
    /// </summary>
    public List<SegmentAlert> AlertSegments { get; set; } = new();

    /// <summary>
    /// Recent trends and changes
    /// </summary>
    public List<TrendSummary> RecentTrends { get; set; } = new();

    /// <summary>
    /// Key metrics charts data
    /// </summary>
    public List<ChartData> ChartsData { get; set; } = new();

    /// <summary>
    /// Activity summary for the current period
    /// </summary>
    public ActivitySummary ActivitySummary { get; set; } = new();

    /// <summary>
    /// When the dashboard was last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Member tag usage statistics response
/// </summary>
public class MemberTagUsageStatsResponse
{
    /// <summary>
    /// Tag ID
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// Tag name
    /// </summary>
    public string TagName { get; set; } = string.Empty;

    /// <summary>
    /// Current usage statistics
    /// </summary>
    public TagUsageStats CurrentStats { get; set; } = new();

    /// <summary>
    /// Usage trends over time
    /// </summary>
    public List<TagUsageTrend> UsageTrends { get; set; } = new();

    /// <summary>
    /// Correlation with other tags
    /// </summary>
    public List<TagCorrelation> TagCorrelations { get; set; } = new();

    /// <summary>
    /// When the statistics were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

// Supporting classes for analytics responses

/// <summary>
/// Historical metric value
/// </summary>
public class MetricHistoricalValue
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
}

/// <summary>
/// Trend direction enumeration
/// </summary>
public enum TrendDirection
{
    Up,
    Down,
    Stable,
    Volatile,
    Unknown
}

/// <summary>
/// Segment comparison data
/// </summary>
public class SegmentComparisonData
{
    public int SegmentId { get; set; }
    public string SegmentName { get; set; } = string.Empty;
    public Dictionary<string, decimal> MetricValues { get; set; } = new();
}

/// <summary>
/// Comparison metric
/// </summary>
public class ComparisonMetric
{
    public string MetricName { get; set; } = string.Empty;
    public decimal PrimaryValue { get; set; }
    public List<decimal> ComparisonValues { get; set; } = new();
    public ComparisonResult Result { get; set; } = ComparisonResult.Neutral;
}

/// <summary>
/// Comparison result
/// </summary>
public enum ComparisonResult
{
    Significantly_Better,
    Better,
    Neutral,
    Worse,
    Significantly_Worse
}

/// <summary>
/// Comparison insight
/// </summary>
public class ComparisonInsight
{
    public string Metric { get; set; } = string.Empty;
    public string Insight { get; set; } = string.Empty;
    public InsightSeverity Severity { get; set; }
}

/// <summary>
/// Insight severity
/// </summary>
public enum InsightSeverity
{
    Info,
    Warning,
    Critical
}

// Note: DateRange class is defined in other DTO files

/// <summary>
/// Trend data point
/// </summary>
public class TrendDataPoint
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
    public string Label { get; set; } = string.Empty;
}

/// <summary>
/// Seasonal pattern
/// </summary>
public class SeasonalPattern
{
    public string PatternType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Confidence { get; set; }
}

/// <summary>
/// Trend forecast
/// </summary>
public class TrendForecast
{
    public decimal PredictedValue { get; set; }
    public decimal ConfidenceInterval { get; set; }
    public DateTime ForecastDate { get; set; }
}

/// <summary>
/// Report summary
/// </summary>
public class ReportSummary
{
    public int TotalSegments { get; set; }
    public DateRange AnalysisPeriod { get; set; } = new();
    public Dictionary<string, object> KeyStats { get; set; } = new();
}

/// <summary>
/// Report section
/// </summary>
public class ReportSection
{
    public string SectionName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<ChartData> Charts { get; set; } = new();
    public Dictionary<string, object> Data { get; set; } = new();
}

/// <summary>
/// Report insight
/// </summary>
public class ReportInsight
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InsightSeverity Severity { get; set; }
    public List<string> SupportingData { get; set; } = new();
}

/// <summary>
/// Segment insight
/// </summary>
public class SegmentInsight
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InsightType Type { get; set; }
    public decimal Confidence { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

/// <summary>
/// Insight type
/// </summary>
public enum InsightType
{
    Growth,
    Decline,
    Anomaly,
    Pattern,
    Opportunity,
    Risk
}

/// <summary>
/// Segment anomaly
/// </summary>
public class SegmentAnomaly
{
    public string MetricName { get; set; } = string.Empty;
    public decimal ExpectedValue { get; set; }
    public decimal ActualValue { get; set; }
    public decimal Deviation { get; set; }
    public DateTime DetectedAt { get; set; }
    public AnomalySeverity Severity { get; set; }
}

/// <summary>
/// Anomaly severity
/// </summary>
public enum AnomalySeverity
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Recommended action
/// </summary>
public class RecommendedAction
{
    public string Action { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public ActionPriority Priority { get; set; }
    public decimal EstimatedImpact { get; set; }
}

/// <summary>
/// Action priority
/// </summary>
public enum ActionPriority
{
    Low,
    Medium,
    High,
    Urgent
}

/// <summary>
/// Risk assessment
/// </summary>
public class RiskAssessment
{
    public RiskLevel OverallRisk { get; set; }
    public List<IdentifiedRisk> Risks { get; set; } = new();
    public List<string> Mitigation { get; set; } = new();
}

/// <summary>
/// Risk level
/// </summary>
public enum RiskLevel
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Identified risk
/// </summary>
public class IdentifiedRisk
{
    public string RiskType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RiskLevel Level { get; set; }
    public decimal Probability { get; set; }
}

/// <summary>
/// Health score components
/// </summary>
public class HealthScoreComponents
{
    public decimal GrowthScore { get; set; }
    public decimal EngagementScore { get; set; }
    public decimal RetentionScore { get; set; }
    public decimal ActivityScore { get; set; }
    public decimal QualityScore { get; set; }
}

/// <summary>
/// Health concern
/// </summary>
public class HealthConcern
{
    public string Area { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ConcernSeverity Severity { get; set; }
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>
/// Concern severity
/// </summary>
public enum ConcernSeverity
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Health score history
/// </summary>
public class HealthScoreHistory
{
    public DateTime Date { get; set; }
    public decimal Score { get; set; }
    public string Grade { get; set; } = string.Empty;
}

/// <summary>
/// Dashboard overview
/// </summary>
public class DashboardOverview
{
    public int TotalSegments { get; set; }
    public int ActiveSegments { get; set; }
    public decimal AverageGrowthRate { get; set; }
    public decimal AverageHealthScore { get; set; }
    public int AlertCount { get; set; }
}

/// <summary>
/// Segment performance summary
/// </summary>
public class SegmentPerformanceSummary
{
    public int SegmentId { get; set; }
    public string SegmentName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public decimal GrowthRate { get; set; }
    public decimal HealthScore { get; set; }
    public TrendDirection Trend { get; set; }
}

/// <summary>
/// Segment alert
/// </summary>
public class SegmentAlert
{
    public int SegmentId { get; set; }
    public string SegmentName { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Alert severity
/// </summary>
public enum AlertSeverity
{
    Info,
    Warning,
    Critical
}

/// <summary>
/// Trend summary
/// </summary>
public class TrendSummary
{
    public string TrendName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TrendDirection Direction { get; set; }
    public decimal Magnitude { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

/// <summary>
/// Chart data
/// </summary>
public class ChartData
{
    public string ChartType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Labels { get; set; } = new();
    public List<ChartDataset> Datasets { get; set; } = new();
    public Dictionary<string, object> Options { get; set; } = new();
}

/// <summary>
/// Chart dataset
/// </summary>
public class ChartDataset
{
    public string Label { get; set; } = string.Empty;
    public List<decimal> Data { get; set; } = new();
    public string Color { get; set; } = string.Empty;
}

// Note: ActivitySummary class is defined in other DTO files

/// <summary>
/// Tag usage trend
/// </summary>
public class TagUsageTrend
{
    public DateTime Date { get; set; }
    public int AssignmentCount { get; set; }
    public decimal UsagePercentage { get; set; }
}

/// <summary>
/// Tag correlation
/// </summary>
public class TagCorrelation
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public decimal CorrelationScore { get; set; }
    public int CoOccurrenceCount { get; set; }
}