using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Historical trend analysis for event engagement
/// </summary>
public class EventEngagementTrends
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClubId { get; set; }

    // Time Period
    [Required]
    [StringLength(20)]
    public string TrendPeriod { get; set; } = string.Empty;

    [Required]
    public DateTime PeriodStart { get; set; }

    [Required]
    public DateTime PeriodEnd { get; set; }

    // Event Metrics
    [Required]
    public int TotalEvents { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(8,2)")]
    public decimal AverageAttendance { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AverageAttendanceRate { get; set; } = 0;

    // Engagement Metrics
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AverageEngagementScore { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalEngagementBoost { get; set; } = 0;

    [Required]
    public int ActiveMemberCount { get; set; } = 0;

    // Satisfaction Metrics
    [Column(TypeName = "decimal(3,1)")]
    public decimal? AverageSatisfaction { get; set; }

    [Column(TypeName = "decimal(4,1)")]
    public decimal? AverageNPS { get; set; }

    // Growth Metrics
    [Required]
    public int NewMemberEventAttendance { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal MemberRetentionRate { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal RepeatAttendanceRate { get; set; } = 0;

    // Comparison Metrics
    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal GrowthRate { get; set; } = 0;

    [Required]
    [StringLength(10)]
    public string TrendDirection { get; set; } = "stable";

    // Insights (JSON for detailed analysis)
    [Required]
    public string TrendInsights { get; set; } = "{}";

    // Timestamps
    [Required]
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Club Club { get; set; } = null!;
}