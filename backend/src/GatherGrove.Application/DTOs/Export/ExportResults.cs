using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result object for scheduled reports
/// </summary>
public class ScheduledReportResult
{
    /// <summary>
    /// Unique schedule ID
    /// </summary>
    public string ScheduleId { get; set; } = string.Empty;

    /// <summary>
    /// Current status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Next run date
    /// </summary>
    public DateTime NextRunDate { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Report name
    /// </summary>
    public string ReportName { get; set; } = string.Empty;
}

/// <summary>
/// Result object for report execution
/// </summary>
public class ReportExecutionResult
{
    /// <summary>
    /// Execution ID
    /// </summary>
    public string ExecutionId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Schedule ID
    /// </summary>
    public string ScheduleId { get; set; } = string.Empty;

    /// <summary>
    /// Job ID for tracking
    /// </summary>
    public string JobId { get; set; } = string.Empty;

    /// <summary>
    /// Execution status
    /// </summary>
    public ScheduledReportExecutionStatus Status { get; set; }

    /// <summary>
    /// When execution started
    /// </summary>
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When execution completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Report size in bytes
    /// </summary>
    public long ReportSizeBytes { get; set; }

    /// <summary>
    /// Error message if failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// File path to generated report
    /// </summary>
    public string? FilePath { get; set; }
}

/// <summary>
/// Result object for export operations
/// </summary>
public class ExportResult
{
    /// <summary>
    /// Export ID
    /// </summary>
    public string ExportId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Export status
    /// </summary>
    public ExportStatus Status { get; set; }

    /// <summary>
    /// Generated filename
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long? FileSizeBytes { get; set; }

    /// <summary>
    /// When export was requested
    /// </summary>
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When export was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When export completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Download URL for the exported file
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// Error message if failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// When export was exported/generated
    /// </summary>
    public DateTime? ExportedAt { get; set; }

    /// <summary>
    /// Number of records exported
    /// </summary>
    public int? RecordCount { get; set; }
}

/// <summary>
/// Result object for scheduled report processing
/// </summary>
public class ScheduledReportProcessingResult
{
    /// <summary>
    /// Total number of reports processed
    /// </summary>
    public int ProcessedCount { get; set; }

    /// <summary>
    /// Number of successful executions
    /// </summary>
    public int SuccessfulCount { get; set; }

    /// <summary>
    /// Number of failed executions
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>
    /// Processing start time
    /// </summary>
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Processing completion time
    /// </summary>
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Statistics for report execution
/// </summary>
public class ReportExecutionStatistics
{
    /// <summary>
    /// Total number of executions
    /// </summary>
    public int TotalExecutions { get; set; }

    /// <summary>
    /// Number of successful executions
    /// </summary>
    public int SuccessfulExecutions { get; set; }

    /// <summary>
    /// Number of failed executions
    /// </summary>
    public int FailedExecutions { get; set; }

    /// <summary>
    /// Success rate as percentage
    /// </summary>
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Average execution time
    /// </summary>
    public TimeSpan AverageExecutionTime { get; set; }

    /// <summary>
    /// Last successful execution
    /// </summary>
    public DateTime? LastSuccessfulExecution { get; set; }

    /// <summary>
    /// Last failed execution
    /// </summary>
    public DateTime? LastFailedExecution { get; set; }
}

/// <summary>
/// Background job for scheduled reports
/// </summary>
public class ScheduledReportJob
{
    /// <summary>
    /// Schedule ID
    /// </summary>
    public string ScheduleId { get; set; } = string.Empty;

    /// <summary>
    /// When job was queued
    /// </summary>
    public DateTime QueuedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Job priority
    /// </summary>
    public JobPriority Priority { get; set; }
}

/// <summary>
/// Queue status information
/// </summary>
public class QueueStatus
{
    /// <summary>
    /// Number of pending jobs
    /// </summary>
    public int PendingJobCount { get; set; }

    /// <summary>
    /// Number of running jobs
    /// </summary>
    public int RunningJobCount { get; set; }

    /// <summary>
    /// Average wait time
    /// </summary>
    public TimeSpan AverageWaitTime { get; set; }
}