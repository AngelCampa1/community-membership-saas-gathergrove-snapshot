using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks member event cancellations and no-show patterns for predictive analytics
/// </summary>
public class EventCancellationTracking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int MemberId { get; set; }

    // Cancellation Details
    [Required]
    [StringLength(20)]
    public string CancellationType { get; set; } = "cancellation"; // cancellation, no_show, late_cancellation

    [Required]
    [StringLength(100)]
    public string? CancellationReason { get; set; }

    [Required]
    public DateTime CancelledAt { get; set; } = DateTime.UtcNow;

    [Required]
    public int DaysBeforeEvent { get; set; } = 0;

    [Required]
    public int HoursBeforeEvent { get; set; } = 0;

    // Pattern Analysis
    [Required]
    [StringLength(50)]
    public string CancellationCategory { get; set; } = "other"; // personal, work, health, no_reason, technical, other

    [Required]
    public bool WasRescheduled { get; set; } = false;

    public DateTime? RescheduledToEventId { get; set; }

    // Historical Context
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal MemberReliabilityScore { get; set; } = 100.0m;

    [Required]
    public int ConsecutiveCancellations { get; set; } = 0;

    [Required]
    public int TotalCancellationsLast90Days { get; set; } = 0;

    // No-Show Specific
    [Required]
    public bool WasNoShow { get; set; } = false;

    [Required]
    public bool PartialAttendance { get; set; } = false;

    [Column(TypeName = "decimal(5,2)")]
    public decimal? AttendancePercentage { get; set; }

    // Event Context
    [StringLength(50)]
    public string? EventType { get; set; }

    [StringLength(20)]
    public string? EventDay { get; set; } // monday, tuesday, etc.

    [StringLength(20)]
    public string? EventTime { get; set; } // morning, afternoon, evening

    [Required]
    public bool WasEventCancelled { get; set; } = false;

    // Impact Analysis
    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal ImpactOnEngagementScore { get; set; } = 0.0m;

    [Required]
    public bool TriggeredAlert { get; set; } = false;

    // Follow-up Actions
    [Required]
    public bool FollowUpSent { get; set; } = false;

    public DateTime? FollowUpSentAt { get; set; }

    [StringLength(20)]
    public string? FollowUpResponse { get; set; } // responded, no_response, unsubscribed

    // Predictive Features
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal FutureNoShowProbability { get; set; } = 0.0m;

    [Required]
    [StringLength(20)]
    public string RiskCategory { get; set; } = "low"; // low, medium, high, critical

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual Member Member { get; set; } = null!;
}