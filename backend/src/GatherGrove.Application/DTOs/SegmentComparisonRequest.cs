using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for comparing multiple segments and their characteristics
/// </summary>
public class SegmentComparisonRequest
{
    /// <summary>
    /// The club containing the segments to compare
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// IDs of segments to compare (minimum 2, maximum 10)
    /// </summary>
    [Required(ErrorMessage = "At least 2 segment IDs are required for comparison")]
    [MinLength(2, ErrorMessage = "At least 2 segments are required for comparison")]
    [MaxLength(10, ErrorMessage = "Cannot compare more than 10 segments at once")]
    public List<int> SegmentIds { get; set; } = new();

    /// <summary>
    /// Metrics to compare between segments
    /// </summary>
    [Required(ErrorMessage = "At least one comparison metric is required")]
    public List<SegmentComparisonMetric> ComparisonMetrics { get; set; } = new();

    /// <summary>
    /// Date range for time-based comparisons
    /// </summary>
    public DateRangeFilter? DateRange { get; set; }

    /// <summary>
    /// Type of comparison to perform
    /// </summary>
    public SegmentComparisonType ComparisonType { get; set; } = SegmentComparisonType.Standard;

    /// <summary>
    /// Whether to include demographic breakdowns
    /// </summary>
    public bool IncludeDemographics { get; set; } = false;

    /// <summary>
    /// Whether to include engagement metrics
    /// </summary>
    public bool IncludeEngagementMetrics { get; set; } = true;

    /// <summary>
    /// Whether to include member overlap analysis
    /// </summary>
    public bool IncludeMemberOverlap { get; set; } = false;

    /// <summary>
    /// Whether to include trend analysis over time
    /// </summary>
    public bool IncludeTrendAnalysis { get; set; } = false;

    /// <summary>
    /// Whether to include statistical significance testing
    /// </summary>
    public bool IncludeStatisticalTests { get; set; } = false;

    /// <summary>
    /// Custom fields to include in comparison
    /// </summary>
    public List<int>? CustomFieldIds { get; set; }

    /// <summary>
    /// Tags to analyze in the comparison
    /// </summary>
    public List<int>? TagIds { get; set; }

    /// <summary>
    /// Grouping criteria for detailed breakdowns
    /// </summary>
    public List<string>? GroupBy { get; set; }

    /// <summary>
    /// Whether to calculate predictive insights
    /// </summary>
    public bool IncludePredictiveInsights { get; set; } = false;

    /// <summary>
    /// Confidence level for statistical tests (e.g., 0.95 for 95%)
    /// </summary>
    [Range(0.90, 0.99, ErrorMessage = "Confidence level must be between 0.90 and 0.99")]
    public double ConfidenceLevel { get; set; } = 0.95;

    /// <summary>
    /// Format for the comparison results
    /// </summary>
    public ComparisonResultFormat ResultFormat { get; set; } = ComparisonResultFormat.Detailed;

    /// <summary>
    /// Whether to include visual chart data
    /// </summary>
    public bool IncludeChartData { get; set; } = false;

    /// <summary>
    /// Chart types to generate
    /// </summary>
    public List<ChartType>? ChartTypes { get; set; }

    /// <summary>
    /// Benchmarking options
    /// </summary>
    public BenchmarkingOptions? Benchmarking { get; set; }

    /// <summary>
    /// User requesting the comparison (for audit purposes)
    /// </summary>
    [Required]
    public int RequestedByUserId { get; set; }

    /// <summary>
    /// Additional filters to apply to all segments before comparison
    /// </summary>
    public SegmentFilterCriteria? GlobalFilters { get; set; }

    /// <summary>
    /// Whether to export results to a file
    /// </summary>
    public bool ExportResults { get; set; } = false;

    /// <summary>
    /// Export format if ExportResults is true
    /// </summary>
    public ExportFormat ExportFormat { get; set; } = ExportFormat.Excel;

    /// <summary>
    /// Custom comparison weights for metrics
    /// </summary>
    public Dictionary<SegmentComparisonMetric, double>? MetricWeights { get; set; }

    /// <summary>
    /// Validates the comparison request
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var errors = new List<string>();

        if (SegmentIds == null || SegmentIds.Count < 2)
        {
            errors.Add("At least 2 segment IDs are required for comparison");
        }
        else if (SegmentIds.Count > 10)
        {
            errors.Add("Cannot compare more than 10 segments at once");
        }
        else if (SegmentIds.Distinct().Count() != SegmentIds.Count)
        {
            errors.Add("Duplicate segment IDs are not allowed");
        }

        if (ComparisonMetrics == null || !ComparisonMetrics.Any())
        {
            errors.Add("At least one comparison metric is required");
        }

        if (DateRange != null && DateRange.EndValue.HasValue)
        {
            if (DateRange.Value > DateRange.EndValue.Value)
            {
                errors.Add("Date range start date cannot be after end date");
            }
        }

        if (IncludeStatisticalTests && SegmentIds?.Count < 2)
        {
            errors.Add("Statistical testing requires at least 2 segments");
        }

        if (MetricWeights != null)
        {
            var invalidWeights = MetricWeights.Where(w => w.Value < 0 || w.Value > 10).ToList();
            if (invalidWeights.Any())
            {
                errors.Add("Metric weights must be between 0 and 10");
            }
        }

        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors
        };
    }
}

/// <summary>
/// Types of segment comparisons
/// </summary>
public enum SegmentComparisonType
{
    /// <summary>
    /// Standard comparison with basic metrics
    /// </summary>
    Standard,

    /// <summary>
    /// Detailed comparison with advanced analytics
    /// </summary>
    Detailed,

    /// <summary>
    /// Performance-focused comparison
    /// </summary>
    Performance,

    /// <summary>
    /// Demographic-focused comparison
    /// </summary>
    Demographic,

    /// <summary>
    /// Engagement-focused comparison
    /// </summary>
    Engagement,

    /// <summary>
    /// Custom comparison with user-defined metrics
    /// </summary>
    Custom
}

/// <summary>
/// Metrics available for segment comparison
/// </summary>
public enum SegmentComparisonMetric
{
    /// <summary>
    /// Total member count
    /// </summary>
    MemberCount,

    /// <summary>
    /// Average engagement score
    /// </summary>
    AverageEngagementScore,

    /// <summary>
    /// Event attendance rate
    /// </summary>
    EventAttendanceRate,

    /// <summary>
    /// Member retention rate
    /// </summary>
    RetentionRate,

    /// <summary>
    /// Growth rate over time
    /// </summary>
    GrowthRate,

    /// <summary>
    /// Average member age
    /// </summary>
    AverageAge,

    /// <summary>
    /// Gender distribution
    /// </summary>
    GenderDistribution,

    /// <summary>
    /// Geographic distribution
    /// </summary>
    GeographicDistribution,

    /// <summary>
    /// Membership type distribution
    /// </summary>
    MembershipTypeDistribution,

    /// <summary>
    /// Tag distribution
    /// </summary>
    TagDistribution,

    /// <summary>
    /// Custom field values
    /// </summary>
    CustomFieldValues,

    /// <summary>
    /// Communication preferences
    /// </summary>
    CommunicationPreferences,

    /// <summary>
    /// Payment compliance rate
    /// </summary>
    PaymentComplianceRate
}

/// <summary>
/// Format options for comparison results
/// </summary>
public enum ComparisonResultFormat
{
    /// <summary>
    /// Summary format with key insights
    /// </summary>
    Summary,

    /// <summary>
    /// Detailed format with comprehensive data
    /// </summary>
    Detailed,

    /// <summary>
    /// Executive format for high-level overview
    /// </summary>
    Executive,

    /// <summary>
    /// Technical format with statistical details
    /// </summary>
    Technical
}

/// <summary>
/// Chart types for visualization
/// </summary>
public enum ChartType
{
    /// <summary>
    /// Bar chart comparison
    /// </summary>
    BarChart,

    /// <summary>
    /// Line chart for trends
    /// </summary>
    LineChart,

    /// <summary>
    /// Pie chart for distributions
    /// </summary>
    PieChart,

    /// <summary>
    /// Radar chart for multi-dimensional comparison
    /// </summary>
    RadarChart,

    /// <summary>
    /// Scatter plot for correlations
    /// </summary>
    ScatterPlot,

    /// <summary>
    /// Heatmap for pattern analysis
    /// </summary>
    Heatmap
}

/// <summary>
/// Benchmarking options for comparison
/// </summary>
public class BenchmarkingOptions
{
    /// <summary>
    /// Whether to include industry benchmarks
    /// </summary>
    public bool IncludeIndustryBenchmarks { get; set; } = false;

    /// <summary>
    /// Whether to include historical benchmarks
    /// </summary>
    public bool IncludeHistoricalBenchmarks { get; set; } = true;

    /// <summary>
    /// Period for historical comparison (in months)
    /// </summary>
    [Range(1, 60, ErrorMessage = "Historical period must be between 1 and 60 months")]
    public int HistoricalPeriodMonths { get; set; } = 12;

    /// <summary>
    /// Custom benchmark values
    /// </summary>
    public Dictionary<SegmentComparisonMetric, double>? CustomBenchmarks { get; set; }

    /// <summary>
    /// Whether to calculate percentile rankings
    /// </summary>
    public bool CalculatePercentileRankings { get; set; } = false;
}