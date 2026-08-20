using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a scheduled report configuration
/// US-005 Data Export & Reporting Engine - Scheduled report entity
/// </summary>
public class ScheduledReport
{
    /// <summary>
    /// Unique identifier for the scheduled report
    /// </summary>
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// The club this scheduled report belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the scheduled report
    /// </summary>
    [Required]
    [StringLength(200)]
    public string ReportName { get; set; } = string.Empty;

    /// <summary>
    /// Type of report (Members, Financial, Analytics, etc.)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Export format for the report
    /// </summary>
    [Required]
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Report frequency (Daily, Weekly, Monthly, etc.)
    /// </summary>
    [Required]
    public ReportFrequency Frequency { get; set; }

    /// <summary>
    /// Day of week for weekly reports
    /// </summary>
    public DayOfWeek? WeeklyDayOfWeek { get; set; }

    /// <summary>
    /// Day of month for monthly reports (1-31)
    /// </summary>
    public int? MonthlyDayOfMonth { get; set; }

    /// <summary>
    /// Time of day to deliver the report
    /// </summary>
    [Required]
    public TimeSpan DeliveryTime { get; set; }

    /// <summary>
    /// Email recipients for the report (comma-separated)
    /// </summary>
    [Required]
    public List<string> Recipients { get; set; } = new List<string>();

    /// <summary>
    /// Whether the scheduled report is active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Next scheduled run date
    /// </summary>
    public DateTime NextRunDate { get; set; }

    /// <summary>
    /// Last execution date
    /// </summary>
    public DateTime? LastExecuted { get; set; }

    /// <summary>
    /// User who created this scheduled report
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this scheduled report was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this scheduled report was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Custom filters for the report (JSON)
    /// </summary>
    public Dictionary<string, object>? CustomFilters { get; set; }

    /// <summary>
    /// Whether to include charts in the report
    /// </summary>
    public bool IncludeCharts { get; set; } = false;

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for execution history
    /// </summary>
    public virtual ICollection<ReportExecutionHistory> ExecutionHistory { get; set; } = new List<ReportExecutionHistory>();
}