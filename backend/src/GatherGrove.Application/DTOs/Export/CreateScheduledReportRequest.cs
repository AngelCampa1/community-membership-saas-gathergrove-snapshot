using GatherGrove.Domain.Enums;
using ReportFrequency = GatherGrove.Domain.Enums.ReportFrequency;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Request DTO for creating scheduled reports
/// US-005 Data Export & Reporting Engine - Scheduled report creation request
/// </summary>
public class CreateScheduledReportRequest
{
    /// <summary>
    /// Name of the scheduled report
    /// </summary>
    public string ReportName { get; set; } = string.Empty;

    /// <summary>
    /// Type of report to generate
    /// </summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Export format for the report
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Frequency of report generation
    /// </summary>
    public ReportFrequency Frequency { get; set; }

    /// <summary>
    /// List of email recipients
    /// </summary>
    public List<string> Recipients { get; set; } = new();

    /// <summary>
    /// Time of day to deliver the report
    /// </summary>
    public TimeSpan DeliveryTime { get; set; }

    /// <summary>
    /// Whether the scheduled report is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Additional parameters for the report
    /// </summary>
    public Dictionary<string, string> Parameters { get; set; } = new();

    /// <summary>
    /// Optional description of the report
    /// </summary>
    public string? Description { get; set; }
}

// Using ReportFrequency from GatherGrove.Domain.Enums namespace