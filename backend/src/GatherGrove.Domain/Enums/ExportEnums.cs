namespace GatherGrove.Domain.Enums;

/// <summary>
/// Export type categories
/// </summary>
public enum ExportType
{
    Members,
    Financials,
    Events,
    Analytics,
    Scheduled
}

/// <summary>
/// Export format options
/// </summary>
public enum ExportFormat
{
    CSV,
    Excel,
    PDF,
    JSON
}

/// <summary>
/// Report frequency options
/// </summary>
public enum ReportFrequency
{
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Annually
}

/// <summary>
/// Export status
/// </summary>
public enum ExportStatus
{
    Queued,
    Processing,
    Completed,
    Failed,
    Cancelled,
    Expired
}

/// <summary>
/// Scheduled report execution status
/// </summary>
public enum ScheduledReportExecutionStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Background job priority
/// </summary>
public enum JobPriority
{
    Low,
    Normal,
    High,
    Critical
}

/// <summary>
/// Background task priority for exports
/// </summary>
public enum BackgroundTaskPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}

/// <summary>
/// Background task status for export operations
/// </summary>
public enum BackgroundTaskStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Compliance level for data export
/// </summary>
public enum ComplianceLevel
{
    Basic,
    GDPR,
    HIPAA,
    SOX,
    PCI_DSS,
    CCPA
}