using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for exporting segment analytics data
/// </summary>
public class AnalyticsExportRequest
{
    /// <summary>
    /// Club ID (set by controller)
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Export format (CSV, Excel, PDF)
    /// </summary>
    [Required]
    public AnalyticsExportFormat ExportFormat { get; set; }

    /// <summary>
    /// Specific segment IDs to export (optional - exports all if not provided)
    /// </summary>
    public List<int>? SegmentIds { get; set; }

    /// <summary>
    /// Data types to include in export
    /// </summary>
    [Required]
    public List<AnalyticsDataType> DataTypes { get; set; } = new();

    /// <summary>
    /// Date range for the export
    /// </summary>
    [Required]
    public DateRange DateRange { get; set; } = new();

    /// <summary>
    /// Include detailed member data
    /// </summary>
    public bool IncludeMemberData { get; set; } = false;

    /// <summary>
    /// Include charts and visualizations (for PDF/Excel)
    /// </summary>
    public bool IncludeCharts { get; set; } = true;

    /// <summary>
    /// Include insights and recommendations
    /// </summary>
    public bool IncludeInsights { get; set; } = true;

    /// <summary>
    /// Custom report title
    /// </summary>
    public string? ReportTitle { get; set; }

    /// <summary>
    /// Additional notes to include in the export
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Language for the export (default: English)
    /// </summary>
    public string Language { get; set; } = "en";

    /// <summary>
    /// Time zone for date formatting
    /// </summary>
    public string TimeZone { get; set; } = "UTC";
}

/// <summary>
/// Result of analytics export operation
/// </summary>
public class AnalyticsExportResult
{
    /// <summary>
    /// Export operation ID
    /// </summary>
    public string ExportId { get; set; } = string.Empty;

    /// <summary>
    /// Export status
    /// </summary>
    public ExportStatus Status { get; set; }

    /// <summary>
    /// Download URL for the exported file (when completed)
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// File name of the exported file
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long? FileSizeBytes { get; set; }

    /// <summary>
    /// Export format used
    /// </summary>
    public AnalyticsExportFormat ExportFormat { get; set; }

    /// <summary>
    /// Number of segments included in export
    /// </summary>
    public int SegmentCount { get; set; }

    /// <summary>
    /// Number of members included in export
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Date range of exported data
    /// </summary>
    public DateRange DataRange { get; set; } = new();

    /// <summary>
    /// Export progress (0-100)
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// Current export stage description
    /// </summary>
    public string? CurrentStage { get; set; }

    /// <summary>
    /// Error message (if export failed)
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// When the export was requested
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the export was started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the export was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Export expiration date (when download link expires)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// User who requested the export
    /// </summary>
    public string RequestedBy { get; set; } = string.Empty;

    /// <summary>
    /// Export summary statistics
    /// </summary>
    public ExportSummary? Summary { get; set; }
}

/// <summary>
/// Analytics export format options
/// </summary>
public enum AnalyticsExportFormat
{
    /// <summary>
    /// Comma-separated values
    /// </summary>
    CSV,

    /// <summary>
    /// Microsoft Excel format
    /// </summary>
    Excel,

    /// <summary>
    /// PDF report format
    /// </summary>
    PDF,

    /// <summary>
    /// JSON data format
    /// </summary>
    JSON
}

/// <summary>
/// Types of analytics data to include in export
/// </summary>
public enum AnalyticsDataType
{
    /// <summary>
    /// Basic segment information and member counts
    /// </summary>
    SegmentBasics,

    /// <summary>
    /// Engagement metrics and scores
    /// </summary>
    EngagementMetrics,

    /// <summary>
    /// Growth and trend analysis
    /// </summary>
    GrowthTrends,

    /// <summary>
    /// Member demographics
    /// </summary>
    Demographics,

    /// <summary>
    /// Event attendance data
    /// </summary>
    EventAttendance,

    /// <summary>
    /// Performance metrics
    /// </summary>
    PerformanceMetrics,

    /// <summary>
    /// Insights and recommendations
    /// </summary>
    Insights,

    /// <summary>
    /// Comparative analysis between segments
    /// </summary>
    Comparisons,

    /// <summary>
    /// Historical trend data
    /// </summary>
    HistoricalData,

    /// <summary>
    /// Predictive analytics and forecasts
    /// </summary>
    Forecasts
}

// ExportStatus enum removed - using GatherGrove.Domain.Enums.ExportStatus instead

/// <summary>
/// Summary of export results
/// </summary>
public class ExportSummary
{
    /// <summary>
    /// Total number of data records exported
    /// </summary>
    public int TotalRecords { get; set; }

    /// <summary>
    /// Number of segments analyzed
    /// </summary>
    public int SegmentsAnalyzed { get; set; }

    /// <summary>
    /// Number of members included
    /// </summary>
    public int MembersIncluded { get; set; }

    /// <summary>
    /// Key statistics from the export
    /// </summary>
    public Dictionary<string, object> KeyStatistics { get; set; } = new();

    /// <summary>
    /// Export processing time in seconds
    /// </summary>
    public double ProcessingTimeSeconds { get; set; }

    /// <summary>
    /// Data quality indicators
    /// </summary>
    public Dictionary<string, string> DataQualityFlags { get; set; } = new();
}