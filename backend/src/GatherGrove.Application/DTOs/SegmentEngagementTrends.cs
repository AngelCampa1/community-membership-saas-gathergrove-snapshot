using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment engagement trends analysis
/// </summary>
public class SegmentEngagementTrends
{
    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Analysis date range
    /// </summary>
    public DateRange DateRange { get; set; } = new();

    /// <summary>
    /// Overall engagement trends across all segments
    /// </summary>
    public OverallEngagementTrend OverallTrend { get; set; } = new();

    /// <summary>
    /// Individual segment engagement trends
    /// </summary>
    public List<SegmentEngagementTrend> SegmentTrends { get; set; } = new();

    /// <summary>
    /// Engagement trend comparisons between segments
    /// </summary>
    public List<TrendComparison> TrendComparisons { get; set; } = new();

    /// <summary>
    /// Key findings from the trend analysis
    /// </summary>
    public List<EngagementInsight> KeyFindings { get; set; } = new();

    /// <summary>
    /// Forecasted engagement trends
    /// </summary>
    public List<EngagementForecast> Forecasts { get; set; } = new();

    /// <summary>
    /// When the analysis was performed
    /// </summary>
    public DateTime AnalysisDate { get; set; }
}

/// <summary>
/// Request for segment engagement trends
/// </summary>
public class SegmentEngagementTrendsRequest
{
    /// <summary>
    /// Club ID (set by controller)
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Number of days to analyze (default: 30)
    /// </summary>
    [Range(1, 365)]
    public int DaysBack { get; set; } = 30;

    /// <summary>
    /// Specific segment IDs to analyze (optional - analyzes all if not provided)
    /// </summary>
    public List<int>? SegmentIds { get; set; }

    /// <summary>
    /// Engagement metrics to include in analysis
    /// </summary>
    public List<string> Metrics { get; set; } = new() { "EventAttendance", "CommunicationActivity", "ProfileUpdates" };

    /// <summary>
    /// Granularity of trend data (daily, weekly, monthly)
    /// </summary>
    public string Granularity { get; set; } = "daily";

    /// <summary>
    /// Include forecasting in the analysis
    /// </summary>
    public bool IncludeForecasting { get; set; } = false;

    /// <summary>
    /// Include comparison with club average
    /// </summary>
    public bool IncludeClubComparison { get; set; } = true;
}

/// <summary>
/// Overall engagement trend across the club
/// </summary>
public class OverallEngagementTrend
{
    /// <summary>
    /// Average engagement score across all segments
    /// </summary>
    public decimal AverageEngagementScore { get; set; }

    /// <summary>
    /// Trend direction (Up, Down, Stable)
    /// </summary>
    public TrendDirection TrendDirection { get; set; }

    /// <summary>
    /// Percentage change from previous period
    /// </summary>
    public decimal PercentageChange { get; set; }

    /// <summary>
    /// Data points over the analysis period
    /// </summary>
    public List<TrendDataPoint> DataPoints { get; set; } = new();
}

/// <summary>
/// Engagement trend for a specific segment
/// </summary>
public class SegmentEngagementTrend
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Current engagement score
    /// </summary>
    public decimal CurrentEngagementScore { get; set; }

    /// <summary>
    /// Previous engagement score for comparison
    /// </summary>
    public decimal PreviousEngagementScore { get; set; }

    /// <summary>
    /// Trend direction
    /// </summary>
    public TrendDirection TrendDirection { get; set; }

    /// <summary>
    /// Percentage change
    /// </summary>
    public decimal PercentageChange { get; set; }

    /// <summary>
    /// Engagement metric breakdowns
    /// </summary>
    public Dictionary<string, List<TrendDataPoint>> MetricTrends { get; set; } = new();

    /// <summary>
    /// Notable events or changes affecting engagement
    /// </summary>
    public List<TrendEvent> TrendEvents { get; set; } = new();
}

/// <summary>
/// Comparison between segment trends
/// </summary>
public class TrendComparison
{
    /// <summary>
    /// Primary segment ID
    /// </summary>
    public int PrimarySegmentId { get; set; }

    /// <summary>
    /// Primary segment name
    /// </summary>
    public string PrimarySegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Comparison segment ID
    /// </summary>
    public int ComparisonSegmentId { get; set; }

    /// <summary>
    /// Comparison segment name
    /// </summary>
    public string ComparisonSegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Correlation coefficient between trends (-1 to 1)
    /// </summary>
    public decimal Correlation { get; set; }

    /// <summary>
    /// Performance difference summary
    /// </summary>
    public string ComparisonSummary { get; set; } = string.Empty;
}

/// <summary>
/// Engagement insight from trend analysis
/// </summary>
public class EngagementInsight
{
    /// <summary>
    /// Insight title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Insight type (Opportunity, Risk, Pattern, Anomaly)
    /// </summary>
    public InsightType Type { get; set; }

    /// <summary>
    /// Affected segments
    /// </summary>
    public List<int> AffectedSegments { get; set; } = new();

    /// <summary>
    /// Confidence level (0-1)
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Recommended actions
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Forecasted engagement trends
/// </summary>
public class EngagementForecast
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
    /// Forecasted data points
    /// </summary>
    public List<ForecastDataPoint> ForecastedPoints { get; set; } = new();

    /// <summary>
    /// Forecast confidence level
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Forecast method used
    /// </summary>
    public string ForecastMethod { get; set; } = string.Empty;
}

/// <summary>
/// Event that affected trend patterns
/// </summary>
public class TrendEvent
{
    /// <summary>
    /// Event date
    /// </summary>
    public DateTime EventDate { get; set; }

    /// <summary>
    /// Event description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Impact on engagement (positive/negative)
    /// </summary>
    public decimal Impact { get; set; }

    /// <summary>
    /// Event type
    /// </summary>
    public string EventType { get; set; } = string.Empty;
}

/// <summary>
/// Forecast data point with confidence intervals
/// </summary>
public class ForecastDataPoint
{
    /// <summary>
    /// Date of forecast
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Predicted value
    /// </summary>
    public decimal PredictedValue { get; set; }

    /// <summary>
    /// Lower confidence bound
    /// </summary>
    public decimal LowerBound { get; set; }

    /// <summary>
    /// Upper confidence bound
    /// </summary>
    public decimal UpperBound { get; set; }
}