using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Comprehensive tracking of member engagement for specific events
/// </summary>
public class EventEngagementTracking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int MemberId { get; set; }

    // Registration & Attendance
    [Required]
    [StringLength(20)]
    public string RegistrationStatus { get; set; } = "registered";

    [Required]
    [StringLength(20)]
    public string AttendanceStatus { get; set; } = "pending";

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AttendancePercentage { get; set; } = 0;

    // Engagement Metrics
    public DateTime? CheckInTimestamp { get; set; }
    public DateTime? CheckOutTimestamp { get; set; }
    public int? SessionDurationMinutes { get; set; }

    [Required]
    public int InteractionCount { get; set; } = 0;

    [Required]
    public int NetworkingConnections { get; set; } = 0;

    // Participation Levels
    [Required]
    [StringLength(20)]
    public string ParticipationLevel { get; set; } = "passive";

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ParticipationScore { get; set; } = 0;

    // Event-Specific Engagement
    [Required]
    public int QuestionsAsked { get; set; } = 0;

    [Required]
    public int PollsParticipated { get; set; } = 0;

    [Required]
    public int ResourcesDownloaded { get; set; } = 0;

    [Required]
    public int ChatMessages { get; set; } = 0;

    [Required]
    public bool BreakoutParticipation { get; set; } = false;

    // Technology Usage
    [Required]
    [StringLength(20)]
    public string Platform { get; set; } = "web";

    [StringLength(20)]
    public string? DeviceType { get; set; }

    [StringLength(20)]
    public string? ConnectionQuality { get; set; }

    [Required]
    public bool TechnicalIssues { get; set; } = false;

    // Behavioral Analytics
    [Column(TypeName = "decimal(5,2)")]
    public decimal? FocusScore { get; set; }

    public int? AttentionSpan { get; set; }

    [Required]
    public bool MultitaskingDetected { get; set; } = false;

    // Feedback Integration
    [Required]
    public bool PostEventSurveyCompleted { get; set; } = false;

    [Column(TypeName = "decimal(3,1)")]
    public decimal? SatisfactionRating { get; set; }

    public int? NetPromoterScore { get; set; }

    // Impact on Member Engagement
    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal EngagementBoost { get; set; } = 0;

    public DateTime? LastEngagementUpdate { get; set; }

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual Member Member { get; set; } = null!;
}