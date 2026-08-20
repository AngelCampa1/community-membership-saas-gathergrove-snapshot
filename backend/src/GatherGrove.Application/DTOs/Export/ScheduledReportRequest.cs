using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Request object for creating scheduled reports
/// US-005 Data Export & Reporting Engine
/// </summary>
public class ScheduledReportRequest
{
    /// <summary>
    /// Name of the scheduled report
    /// </summary>
    public string ReportName { get; set; } = string.Empty;

    /// <summary>
    /// Type of report (Members, Financial, etc.)
    /// </summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Export format
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Report frequency
    /// </summary>
    public ReportFrequency Frequency { get; set; }

    /// <summary>
    /// Day of week for weekly reports
    /// </summary>
    public DayOfWeek? WeeklyDayOfWeek { get; set; }

    /// <summary>
    /// Day of month for monthly reports
    /// </summary>
    public int? MonthlyDayOfMonth { get; set; }

    /// <summary>
    /// Time of day to deliver the report
    /// </summary>
    public TimeSpan DeliveryTime { get; set; }

    /// <summary>
    /// Email recipients
    /// </summary>
    public List<string> Recipients { get; set; } = new List<string>();

    /// <summary>
    /// Whether the report is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether to include charts
    /// </summary>
    public bool IncludeCharts { get; set; } = false;

    /// <summary>
    /// Custom filters for the report
    /// </summary>
    public Dictionary<string, object> CustomFilters { get; set; } = new Dictionary<string, object>();
}

/// <summary>
/// Request object for updating scheduled reports
/// </summary>
public class UpdateScheduledReportRequest
{
    /// <summary>
    /// Updated report name
    /// </summary>
    public string? ReportName { get; set; }

    /// <summary>
    /// Updated active status
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Updated recipients
    /// </summary>
    public List<string>? Recipients { get; set; }

    /// <summary>
    /// Updated delivery time
    /// </summary>
    public TimeSpan? DeliveryTime { get; set; }

    /// <summary>
    /// Updated custom filters
    /// </summary>
    public Dictionary<string, object>? CustomFilters { get; set; }
}