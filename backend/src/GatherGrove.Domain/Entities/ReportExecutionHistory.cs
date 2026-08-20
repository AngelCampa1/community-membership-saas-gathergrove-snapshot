using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents the execution history of a scheduled report
/// US-005 Data Export & Reporting Engine - Report execution tracking
/// </summary>
public class ReportExecutionHistory
{
    /// <summary>
    /// Unique identifier for the execution record
    /// </summary>
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// The scheduled report ID this execution belongs to
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ScheduleId { get; set; } = string.Empty;

    /// <summary>
    /// When the report was executed
    /// </summary>
    [Required]
    public DateTime ExecutedAt { get; set; }

    /// <summary>
    /// Execution status
    /// </summary>
    [Required]
    public ScheduledReportExecutionStatus Status { get; set; }

    /// <summary>
    /// When the report execution completed (success or failure)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Size of the generated report in bytes
    /// </summary>
    public long? ReportSizeBytes { get; set; }

    /// <summary>
    /// Execution time in seconds
    /// </summary>
    public int ExecutionTimeSeconds { get; set; }

    /// <summary>
    /// Error message if execution failed
    /// </summary>
    [StringLength(1000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Job ID for tracking background processing
    /// </summary>
    [StringLength(50)]
    public string? JobId { get; set; }

    /// <summary>
    /// File path or URL to the generated report
    /// </summary>
    [StringLength(500)]
    public string? ReportFilePath { get; set; }

    /// <summary>
    /// Navigation property for the scheduled report
    /// </summary>
    public virtual ScheduledReport ScheduledReport { get; set; } = null!;
}