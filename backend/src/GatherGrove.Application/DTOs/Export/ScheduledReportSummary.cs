using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Summary data for scheduled reports
/// US-005 Data Export & Reporting Engine
/// </summary>
public class ScheduledReportSummary
{
    public string ScheduleId { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public ExportFormat Format { get; set; }
    public ReportFrequency Frequency { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime NextRunDate { get; set; }
    public DateTime? LastExecuted { get; set; }
    public ScheduledReportExecutionStatus Status { get; set; }
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }

    /// <summary>
    /// Last run date
    /// </summary>
    public DateTime? LastRunDate { get; set; }

    /// <summary>
    /// When the scheduled report was created
    /// </summary>
    public DateTime? CreatedAt { get; set; }
}