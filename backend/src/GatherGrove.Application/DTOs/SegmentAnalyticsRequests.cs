using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating segment performance metrics
/// </summary>
public class CreateSegmentPerformanceMetricRequest
{
    /// <summary>
    /// The club this metric belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Segment ID to create metrics for
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// Metric type
    /// </summary>
    [Required]
    public SegmentMetricType MetricType { get; set; }

    /// <summary>
    /// Metric name
    /// </summary>
    [Required]
    [StringLength(100)]
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Metric calculation method
    /// </summary>
    [Required]
    public MetricCalculationMethod CalculationMethod { get; set; }

    /// <summary>
    /// Metric configuration parameters
    /// </summary>
    public Dictionary<string, object> Configuration { get; set; } = new();

    /// <summary>
    /// Whether the metric should be automatically calculated
    /// </summary>
    public bool AutoCalculate { get; set; } = true;

    /// <summary>
    /// Calculation frequency for auto-calculated metrics
    /// </summary>
    public MetricFrequency? CalculationFrequency { get; set; }

    /// <summary>
    /// User creating this metric
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }
}

/// <summary>
/// Request for updating segment performance metrics
/// </summary>
public class UpdateSegmentPerformanceMetricRequest
{
    /// <summary>
    /// ID of the metric to update
    /// </summary>
    [Required]
    public int MetricId { get; set; }

    /// <summary>
    /// Updated metric name
    /// </summary>
    [Required]
    [StringLength(100)]
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Updated calculation method
    /// </summary>
    [Required]
    public MetricCalculationMethod CalculationMethod { get; set; }

    /// <summary>
    /// Updated configuration parameters
    /// </summary>
    public Dictionary<string, object> Configuration { get; set; } = new();

    /// <summary>
    /// Whether the metric should be active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Updated calculation frequency
    /// </summary>
    public MetricFrequency? CalculationFrequency { get; set; }

    /// <summary>
    /// User updating this metric
    /// </summary>
    [Required]
    public int UpdatedByUserId { get; set; }
}

/// <summary>
/// Request for generating segment reports
/// </summary>
public class GenerateSegmentReportRequest
{
    /// <summary>
    /// The club this report is for
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Segment IDs to include in the report
    /// </summary>
    [Required]
    public List<int> SegmentIds { get; set; } = new();

    /// <summary>
    /// Report type
    /// </summary>
    [Required]
    public SegmentReportType ReportType { get; set; }

    /// <summary>
    /// Date range for the report
    /// </summary>
    [Required]
    public DateRangeFilter DateRange { get; set; } = new();

    /// <summary>
    /// Metrics to include in the report
    /// </summary>
    public List<string> IncludeMetrics { get; set; } = new();

    /// <summary>
    /// Whether to include comparisons
    /// </summary>
    public bool IncludeComparisons { get; set; } = false;

    /// <summary>
    /// Comparison baseline (previous period, etc.)
    /// </summary>
    public ComparisonBaseline? ComparisonBaseline { get; set; }

    /// <summary>
    /// Output format for the report
    /// </summary>
    public ReportOutputFormat OutputFormat { get; set; } = ReportOutputFormat.JSON;

    /// <summary>
    /// Whether to include visualizations
    /// </summary>
    public bool IncludeVisualizations { get; set; } = false;

    /// <summary>
    /// User requesting the report
    /// </summary>
    [Required]
    public int RequestedByUserId { get; set; }
}

/// <summary>
/// Request for analytics refresh scheduling
/// </summary>
public class AnalyticsRefreshSchedule
{
    /// <summary>
    /// Schedule frequency
    /// </summary>
    [Required]
    public RefreshFrequency Frequency { get; set; }

    /// <summary>
    /// Specific time of day for refresh (for daily/weekly schedules)
    /// </summary>
    public TimeOnly? RefreshTime { get; set; }

    /// <summary>
    /// Days of week for weekly schedules
    /// </summary>
    public List<DayOfWeek> RefreshDays { get; set; } = new();

    /// <summary>
    /// Whether the schedule is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Timezone for scheduling
    /// </summary>
    public string TimeZone { get; set; } = "UTC";
}

/// <summary>
/// Segment metric types
/// </summary>
public enum SegmentMetricType
{
    MemberCount,
    GrowthRate,
    EngagementScore,
    ActivityLevel,
    RetentionRate,
    ConversionRate,
    EventAttendance,
    CommunicationEngagement,
    FeatureUsage,
    Custom
}

/// <summary>
/// Metric calculation methods
/// </summary>
public enum MetricCalculationMethod
{
    Count,
    Average,
    Sum,
    Percentage,
    Rate,
    Trend,
    Distribution,
    Custom
}

/// <summary>
/// Metric calculation frequencies
/// </summary>
public enum MetricFrequency
{
    Hourly,
    Daily,
    Weekly,
    Monthly,
    OnDemand
}

/// <summary>
/// Segment report types
/// </summary>
public enum SegmentReportType
{
    Overview,
    Performance,
    Growth,
    Engagement,
    Comparison,
    Trend,
    Custom
}

/// <summary>
/// Comparison baselines
/// </summary>
public enum ComparisonBaseline
{
    PreviousPeriod,
    SamePeriodLastYear,
    ClubAverage,
    BestPerforming,
    Custom
}

/// <summary>
/// Report output formats
/// </summary>
public enum ReportOutputFormat
{
    JSON,
    PDF,
    Excel,
    CSV
}

/// <summary>
/// Analytics refresh frequencies
/// </summary>
public enum RefreshFrequency
{
    RealTime,
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Manual
}